
import { env } from 'process';
import keys from './../keys'
import OpenAI from 'openai'
import qrcode from 'qrcode-terminal';
import { Client } from 'whatsapp-web.js';
import DatabaseHelper from "../databaseHelper";
import axios from 'axios';


export class OpenAIController {

  private openai: OpenAI;
  private assistant: any;
  private thread: any;
  private whatsappClient: Client;

  private numeroDestino = '5491160223474'; // Número en formato internacional  
  private mensaje = 'hola';

  constructor() {

    this.initialize = this.initialize.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.sendWhatsApp = this.sendWhatsApp.bind(this);
    this.webhook = this.webhook.bind(this);
    this.initialize();

  }

  public async webhook(req: any, res: any) {

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
  
  public async sendWhatsApp(req: any, res: any) {
    try {

      const token = 'EAAXOmruNQ1kBOzMkjSPZA0ZBnPZBxR1fi84hrzXCraZCZCNFZBcVoD8dcLuUYM2o2iIJJn6b5FT3WjAH6TLzxx6MMb0KQkQqqxvuCqb6YPO1mSY71oihg8yyNwZBEA8g23giOtqOXpH4qb59gCeMVoS6s1N5r5dVkerksMOfkWOAaMmSC8JvZCxYUGkNBGCZB0UbMTZCozK4CJ7AjbMnZBhSyt9jtUWZCsTnoQnGrsIFVDdH'; 

      const response = await axios.post(
        `https://graph.facebook.com/v21.0/124321500653142/messages`,
        {
          messaging_product: 'whatsapp',
          to: this.numeroDestino,
          text: { body: this.mensaje },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }

      );

    console.log('Mensaje de WhatsApp enviado:', response.data);

    } catch (error) {
      console.error('Error al enviar mensaje de WhatsApp:', error);

    }

  }

  public async receiveWhatsApp(req: any, res: any): Promise<void> {

    try {

        const body = req.body

        // Verifica que el mensaje venga de WhatsApp
        //@ts-ignore
        if (body.object === 'whatsapp_business_account') {
           //@ts-ignore
            body.entry.forEach(entry => {
                const changes = entry.changes;
                changes.forEach(change => {
                    const messageData = change.value.messages;
                    if (messageData) {
                        messageData.forEach((message) => {
                            // Aquí procesas el mensaje entrante
                            const from = message.from; // El número de teléfono que envía el mensaje
                            const messageText = message.text.body; // El contenido del mensaje

                            console.log(`Nuevo mensaje de: ${from}, Mensaje: ${messageText}`);

                            // Aquí podrías llamar a tu método para responder
                            this.sendWhatsApp(from, `Gracias por tu mensaje: ${messageText}`);
                        });
                    }
                });
            });
        }     
        res.status(200).send('EVENT_RECEIVED');
    } catch (error) {
        console.error('Error al recibir mensaje de WhatsApp:', error);
        res.sendStatus(500);
    }
  
  }

  private async initialize() {

    try {
      // Inicializar OpenAI con la clave de API
      this.openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY.toString(),
      });

      // Crear el asistente solo una vez al inicializar el controlador

      this.assistant = await this.openai.beta.assistants.create({
        name: 'mozo experimentado en el restaurante De la Bien Querida',
        instructions:
          `
          Sos un mozo con mucha experiencia que trabaja en un restaurante llamado "De la Bien Querida".         
          Ayudás a los clientes a tomar decisiones sobre los mejores platos según sus gustos y necesidades. También podés recomendar vinos y postres, 
          y siempre das una explicación completa sobre los ingredientes y los métodos de preparación de los platos. 
          Siempre te aseguras de que los clientes se sientan bienvenidos y cómodos.
          Siempre que des informacion sobre un producto, recorda poner por debajo la descripción y el precio.
        `,
        model: 'gpt-3.5-turbo',
      });

    } catch (error) {
      console.error('Error al inicializar OpenAI:', error);
    }
  }

  public async sendMessage(req: any, res: any) {
    try {

        let showCategory = false;

      if (!this.openai || !this.assistant) {
        // Reintentar inicializar si no están definidos
        await this.initialize();
      }

      const { message } = req.body;

      if(message.includes('menu') || message.includes('carta'))
            showCategory = true;

         // Cargar el menú solo al crear el hilo
         const externalData = await this.fetchDataFromSP(showCategory);

      // Crear un nuevo hilo para la conversación solo si no está definido
      if (!this.thread) {
        this.thread = await this.openai.beta.threads.create();
     
        // Añadir el menú al contexto del hilo como un mensaje del "sistema"
        const promptWithDBData = `
      Te proporciono la carta completa del menú del restaurante:
      "${externalData}"
      <ssss
      A partir de ahora, podrás referenciar esta información para ayudar al usuario.
      Si el usuario en su mensaje pone la palabra menu o carta, tb mostra la subcategoria de los productos.
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

       // Ejecutar el asistente con el contexto y el mensaje del usuario
       const run = await this.openai.beta.threads.runs.create(this.thread.id, {
        assistant_id: this.assistant.id,
      });

        // Esperar a que el asistente termine de procesar
        let runStatus = await this.openai.beta.threads.runs.retrieve(this.thread.id, run.id);

      while (runStatus.status !== 'completed') {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        runStatus = await this.openai.beta.threads.runs.retrieve(
          this.thread.id,
          run.id
        );
      }

      // Obtener los mensajes del hilos
      const messages = await this.openai.beta.threads.messages.list(this.thread.id);

      // Obtener la última respuesta del asistente
      const assistantResponse = messages.data.filter((msg) => msg.role === 'assistant')[0];

      // Enviar la respuesta generada por OpenAI al usuario
      res.json({ response: assistantResponse.content });
    } catch (error) {
      console.error('Error en sendMessage:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Método para formatear los resultados del SP en una respuesta adecuada para el cliente
  private formatResults(results: any[], showcategory = false): string {

    let formattedData = '';
    let subcategoria = '';  // Variable para rastrear la categoría actual

    for (const result of results) {
      if (showcategory && (result.subcategoria !== subcategoria)) {
        // Si la categoría cambia o es la primera vez, se muestra la categoría y subcategoría
        formattedData += `\n${result.SubCategoría} (${result.SubCategoría})\n`;
        subcategoria = result.SubCategoría; // Actualizar la categoría actual
      }
      
      // Mostrar los detalles del producto
      formattedData += `${result.NombreProducto} \n ${result.Descripción}. \n ${result.Precio} \n`;
    }

    return formattedData.trim(); // Elimina espacios adicionales al final
}

  // Método para obtener datos desde el Stored Procedure basado en palabras clave
  private async fetchDataFromSP(showcategory=false): Promise<string> {

    let resultData = '';

    // Conectar con la base de datos y ejecutar el stored procedure con las keywords
    //for (const keyword of keywords) {

    const queryResult = await DatabaseHelper.executeSpSelect("GetClientFriendlyMenu", []);


    if (queryResult.length > 0) {
      resultData += this.formatResults(queryResult, showcategory);
    }

    return resultData;
  }
  
}

export const openaiController = new OpenAIController();