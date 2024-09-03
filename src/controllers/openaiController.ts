
import { env } from 'process';
import keys from './../keys'
import OpenAI from 'openai'

export class OpenAIController {

  private openai: OpenAI;
  private assistant: any;

  constructor(
  ) {

    this.initialize = this.initialize.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.initialize();
  }

  private async initialize() {

    console.log(env.OPENAI_API_KEY);

    try {
      // Inicializar OpenAI con la clave de API
      this.openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY.toString(),
      });

      // Crear el asistente solo una vez al inicializar el controlador
      this.assistant = await this.openai.beta.assistants.create({
        name: 'Laura, A sistente comercial de Nucleo Check',
        instructions: `
        
    "Responde a las preguntas de manera breve y directa.",
    "Proporciona respuestas concisas, de 2 a 3 oraciones como máximo.",
    "Amplía la respuesta solo si el usuario pide más información.",

    intenta averiguar si ya es cliente o es un cliente potencial, si es un cliente potencial, intenta averiguar si es un restaurante, 
    bar, cafetería, heladería, food truck, o delivery, y si es un restaurante, intenta averiguar si es un pequeño emprendimiento o una gran cadena.",
        `,
        model: 'gpt-4o',
      });
    } catch (error) {
      console.error('Error al inicializar OpenAI:', error);
    }

  }

  public async sendMessage(req: any, res: any) {

    try {
      if (!this.openai || !this.assistant) {
        // Reintentar inicializar si no están definidos
        await this.initialize();
      }

      const { message } = req.body;

      // Crear un nuevo hilo para la conversación
      const thread = await this.openai.beta.threads.create();

      // Agregar el mensaje del usuario al hilo
      await this.openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: message,
      });

      // Ejecutar el asistente
      const run = await this.openai.beta.threads.runs.create(thread.id, {
        assistant_id: this.assistant.id,
      });

      // Esperar a que el asistente termine de procesar
      let runStatus = await this.openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );

      while (runStatus.status !== 'completed') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await this.openai.beta.threads.runs.retrieve(
          thread.id,
          run.id
        );
      }

      // Obtener los mensajes del hilo
      const messages = await this.openai.beta.threads.messages.list(thread.id);

      // Obtener la última respuesta del asistente
      const assistantResponse = messages.data
        .filter((message) => message.role === 'assistant')
        .pop();

      // Enviar la respuesta
      res.json({ response: assistantResponse?.content[0] });
    } catch (error) {
      console.error('Error en sendMessage:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

}

export const openaiController = new OpenAIController();