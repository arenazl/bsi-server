
import { env } from 'process';
import keys from './../keys'
import OpenAI from 'openai'
import qrcode from 'qrcode-terminal';
import { Client } from 'whatsapp-web.js';
import DatabaseHelper from "../databaseHelper";
import axios from 'axios';
import { ConnectContactLens } from 'aws-sdk';
import { Console } from 'console';
import { validateHeaderName } from 'http';


export class OpenAIController {

  private openai: OpenAI;
  private assistant: any;
  private thread: any;
  private whatsappClient: Client;

  private numeroDestino = '54111560223474';
  private mensaje = 'Respuesta del asistente';

  constructor() {

    this.initialize = this.initialize.bind(this);

    //this.sendMessage = this.sendMessage.bind(this);
    //this.sendWhatsApp = this.sendWhatsApp.bind(this);

    this.verifyWebhook = this.verifyWebhook.bind(this);
    this.handleWebhook = this.handleWebhook.bind(this);

    this.initialize();

  }

  private async initialize() {
    try {


      this.openai = new OpenAI({
        apiKey: keys.OpenAi.key
      });

      this.assistant = await this.openai.beta.assistants.create({
        name: 'mozo experimentado en el restaurante De la Bien Querida',
        instructions: `
          Sos un mozo con mucha experiencia que trabaja en un restaurante llamado "De la Bien Querida".
          Ayudás a los clientes a tomar decisiones sobre los mejores platos según sus gustos y necesidades. 
          También podés recomendar vinos y postres, y siempre das una explicación completa sobre los ingredientes y 
          los métodos de preparación de los platos. Siempre te aseguras de que los clientes se sientan bienvenidos.
          Siempre que des información sobre un producto, recordá poner por debajo la descripción y el precio.
        `,
        model: 'gpt-3.5-turbo',
      });
    } catch (error) {
      console.error('Error al inicializar OpenAI:', error);
    }
  }

  public async verifyWebhook(req: any, res: any) {
    const VERIFY_TOKEN = "LOOKUS";
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];


    if (mode && token) {
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verificado');
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    }
  }

  public async handleWebhook(req: any, res: any): Promise<void> {
    try {
        const body = req.body;
        if (body.object === 'whatsapp_business_account') {
            body.entry.forEach(async (entry) => {
                const changes = entry.changes;
                for (const change of changes) {
                    const messageData = change.value.messages;
                    if (messageData) {
                        for (const message of messageData) {
                            const from = message.from;
                            const messageText = message.text.body;

                            console.log(`Mensaje recibido de ${from}: ${messageText}`);

                            // 1. Enviar mensaje de carga
                            await this.sendWhatsAppMessage(from, "⏳Cargando Asitente de Nucleo Check ");

                            // 2. Obtener respuesta del asistente

                            const assistantResponse = await this.sendMessage(messageText);

                            console.log(`Respuesta del asistente: ${assistantResponse}`);

                            // 3. Enviar respuesta final
                            await this.sendWhatsAppMessage(from, assistantResponse);
                        }
                    }
                }
            });
            res.status(200).send('EVENT_RECEIVED');
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error('Error al recibir mensaje de WhatsApp:', error);
        res.sendStatus(500);
    }
}


  public async sendMessage(message: string): Promise<string> {
  try {

    let showCategory = false;

    if (!this.openai || !this.assistant) {
      await this.initialize();
      console.log('Asistente de OpenAI inicializado');
    }
    if (!this.assistant) {
      console.log('No se pudo inicializar el asistente de OpenAI');
      throw new Error('No se pudo inicializar el asistente de OpenAI.');
    }

    if (message.includes('men') ||  message.includes('carta')) {
      showCategory = true;
    }
    
    const externalData = await this.fetchDataFromSP(showCategory);

    if (!externalData) {
      throw new Error('No se pudo obtener el menú desde el SP.');
    }

    //console.log('Datos del menú:', externalData);

    // Crear un hilo si no existes
    if (!this.thread) 
      {

      console.log('Creando nuevo hilo');
      this.thread = await this.openai.beta.threads.create();
      const promptWithDBData = `
        Te proporciono la carta completa del menú del restaurante:
        "${externalData}"
        A partir de ahora, podrás referenciar esta información para ayudar al usuario.
        Si el usuario en su mensaje pone la palabra menu o carta, también muestra la subcategoría de los productos.
        En la descripcion incluir una breve descripcion y en el caso de tener ingredientes, señalarlos.
        Utiliza iconos en tu mensaje para mejorar la legibilidad.
      `;
      await this.openai.beta.threads.messages.create(this.thread.id, {
        role: 'user',
        content: promptWithDBData,
      });
    }

    // Añadir el mensaje del usuario al hilo
    await this.openai.beta.threads.messages.create(this.thread.id, {
      role: 'user',
      content: message,
    });

    // Ejecutar el asistente
    const run = await this.openai.beta.threads.runs.create(this.thread.id, {
      assistant_id: this.assistant.id,
    });

    // Bucle de espera con límite de intentos
    let runStatus = await this.openai.beta.threads.runs.retrieve(this.thread.id, run.id);
    let attempts = 0;
    const maxAttempts = 10;
    
    while (runStatus.status !== 'completed' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      runStatus = await this.openai.beta.threads.runs.retrieve(this.thread.id, run.id);
      attempts++;
    }
    if (runStatus.status !== 'completed') {
      throw new Error('El asistente tardó demasiado en responder.');
    }

      const messages = await this.openai.beta.threads.messages.list(this.thread.id);

      // Obtener la última respuesta del asistente
      const assistantResponse = messages.data.filter((msg) => msg.role === 'assistant')[0];

    var response: any = assistantResponse ? assistantResponse.content : 'Hubo un problema al procesar tu Smensaje.'

    //ts-ignore
    return response[0].text.value
    
  } catch (error) {
    console.error('Error en sendMessage:', error);
    return 'Error interno del servidor';
  }
}

  private async sendWhatsAppMessage(to: string, message: string) {
    try {

      console.log(`Mensaje a enviar: ${message}`);

      const token = keys.Tokens.Meta;
      await axios.post(
        `https://graph.facebook.com/v21.0/124321500653142/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.numeroDestino,
          text: { body: message },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(`Mensaje enviado a ${to}: ${message}`);

    } catch (error) {
      console.error('Error al enviar mensaje de WhatsApp:', error);
    }
  }
  
  private formatResults(results: any[], showCategory = false): string {

    let formattedData = '';
    let subCategoria = ''; // Variable para rastrear la subcategoría actual

    for (const result of results) {
        // Si la categoría cambia, mostrarla con un icono
        if (showCategory && (result.subCategoria !== subCategoria)) {
            formattedData += `\n\n🍹 *${result.subCategoria}*\n`; // Icono y subcategoría en negrita
            subCategoria = result.subCategoria; // Actualizar la categoría actual
        }

        // Agregar detalles del producto con iconos y saltos de línea para formato
        formattedData += `\n• *${result.NombreProducto}* \n`;
        formattedData += `   🏷️ ${result.Descripción}\n`;
        formattedData += `   🏷️ ${result.Ingredientes}\n`;
        formattedData += `   💲 Precio: ${result.Precio}\n`;
    }

    return formattedData.trim(); // Elimina espacios adicionales al final
}

  private async fetchDataFromSP(showcategory=false): Promise<string> {

    let resultData = '';

    const queryResult = await DatabaseHelper.executeSpSelect("GetClientFriendlyMenu", []);

    if (queryResult.length > 0) {
      resultData += this.formatResults(queryResult, showcategory);
    }

    return resultData;
  }
  
}

export const openaiController = new OpenAIController();