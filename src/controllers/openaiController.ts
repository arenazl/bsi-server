import { env } from 'process';
import keys from './../keys';
import OpenAI from 'openai';
import qrcode from 'qrcode-terminal';
import { Client } from 'whatsapp-web.js';
import { Request, Response } from 'express';

export class OpenAIController {
  private openai: OpenAI;
  private assistant: any;
  private thread: any;
  private client: Client;

  private numeroDestino = '5491160223474'; // Número en formato internacional  
  private mensaje = 'hola';

  constructor() {
    this.initialize = this.initialize.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.webhookVerification = this.webhookVerification.bind(this);
    this.handleIncomingWhatsAppMessage = this.handleIncomingWhatsAppMessage.bind(this);
    this.initialize();

    // Inicializar cliente de WhatsApp
    this.client = new Client({
      puppeteer: {
        headless: true,
      },
    });

    this.client.on('qr', (qr) => {
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      console.log('Client is ready!');
    });

    this.client.on('message', (message) => {
      console.log('Mensaje recibido en WhatsApp:', message.body);
      this.handleIncomingWhatsAppMessage(message);
    });

    this.client.initialize();
  }

  private async initialize() {
    try {
      this.openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY.toString(),
      });

      this.assistant = await this.openai.beta.assistants.create({
        name: 'asistente comercial de una empresa de software de gestión gastronómica llamado Nucleo Check',
        instructions: `...`,  // Instrucciones que ya tienes
        model: 'gpt-4o',
      });
    } catch (error) {
      console.error('Error al inicializar OpenAI:', error);
    }
  }

  // Ruta para la verificación del webhook de WhatsApp
  public webhookVerification(req: Request, res: Response) {
    
    const VERIFY_TOKEN = 'EAAPjb1ZAOsKMBOyzZBHDUcdMqGZCfAqsAXX3hQk182cKzEGykw7Qqk7npqf0z3n66tTQgv0LtMPjZB0Mb1dD3ZA8SaY2eXrpAYikHuTZCWPIpGn2EoCV8oeSKmmyyL2lPNhLRarljpTDRtGZBxOyMECSou69OmMSyxmTNTVrcDwuCXhH7x2k74l2ZAdw0TeEXI8AQzuZAHSwMI85KzXA84bK1k05rsXwswojmnq5PLkPd';

    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token && token === VERIFY_TOKEN) {
      if (mode === 'subscribe') {
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(403);
    }
  }

  public async handleIncomingWhatsAppMessage(message: any) {
    try {
      const chatId = `${message.from}`;
      const userMessage = message.body;
  
      // Enviar el mensaje a OpenAI para obtener la respuesta
      if (!this.openai || !this.assistant) {
        await this.initialize();
      }
  
      // Crear un hilo si aún no existe
      if (!this.thread) {
        this.thread = await this.openai.beta.threads.create();
      }
  
      // Añadir el mensaje del usuario al hilo
      await this.openai.beta.threads.messages.create(this.thread.id, {
        role: 'user',
        content: userMessage,
      });
  
      // Ejecutar el asistente
      const run = await this.openai.beta.threads.runs.create(this.thread.id, {
        assistant_id: this.assistant.id,
      });
  
      let runStatus = await this.openai.beta.threads.runs.retrieve(this.thread.id, run.id);
  
      while (runStatus.status !== 'completed') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await this.openai.beta.threads.runs.retrieve(this.thread.id, run.id);
      }
  
      // Obtener los mensajes del asistente
      const messages = await this.openai.beta.threads.messages.list(this.thread.id);
  
      // Combinar todos los mensajes de respuesta del asistente en una sola cadena
      const assistantResponses = messages.data
        .filter((msg) => msg.role === 'assistant')
        .map((msg) => msg.content)
        .join('\n');  // Une todas las respuestas con un salto de línea
  
      // Verificar si hay una respuesta válida
      if (!assistantResponses || assistantResponses.length === 0) {
        console.error('La respuesta del asistente está vacía o es inválida.');
        return;
      }
  
      // Verificar que el cliente esté listo antes de enviar el mensaje
      if (!this.client) {
        console.error('Cliente de WhatsApp no inicializado.');
        return;
      }
  
      // Enviar la respuesta combinada de vuelta a WhatsApp
      this.client.sendMessage(chatId, assistantResponses).then((response) => {
        console.log('Mensaje de respuesta enviado:', response);
      }).catch((err) => {
        console.error('Error al enviar respuesta a WhatsApp:', err);
      });
    } catch (error) {
      console.error('Error en handleIncomingWhatsAppMessage:', error);
    }
  }
  


  public async sendMessage(req: Request, res: Response) {
    // La función sendMessage que ya tienes, modificada para enviar mensajes manualmente
    // desde una solicitud HTTP.
  }
}

export const openaiController = new OpenAIController();
