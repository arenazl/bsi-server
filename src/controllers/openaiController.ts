
import { env } from 'process';
import keys from './../keys'
import OpenAI from 'openai'
import qrcode from 'qrcode-terminal';
import { Client } from 'whatsapp-web.js';

export class OpenAIController {

  private openai: OpenAI;
  private assistant: any;
  private thread: any;

  private numeroDestino = '5491160223474'; // Número en formato internacional  
  private mensaje = 'hola';


  constructor() {

    /*
    this.initialize = this.initialize.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.initialize();*/

    /*
    const client = new Client({
      puppeteer: {
          headless: true,
      },
  });

    client.on('qr', qr => {
      qrcode.generate(qr, {small: true});
  });

  client.on('ready', () => {

      console.log('Client is ready!');
      
      // Enviar mensaje cuando el cliente esté listo
      const chatId = `${this.numeroDestino}@c.us`; // Formato correcto para WhatsApp Web
      client.sendMessage(chatId, this.mensaje).then(response => {
          console.log('Mensaje enviado:', response);
      }).catch(err => {
          console.error('Error al enviar mensaje:', err);
      });
  });

  client.on('message_create', message => {
      console.log(message.body);

      if (message.body === '!ping') {
          message.reply('pong');
      }
  });
  client.initialize();
  */
  
  }

  private async initialize() {

    try {
      // Inicializar OpenAI con la clave de API
      this.openai = new OpenAI({
        apiKey: env.OPENAI_API_KEY.toString(),
      });

      // Crear el asistente solo una vez al inicializar el controlador
      this.assistant = await this.openai.beta.assistants.create({
        name: 'asistente comercial de una empresa de software de gestión gastronómica llamado Nucleo Check',
        instructions: 
`
Sos un asistente comercial de una empresa de software que vende un un software que se llama Nucleo Check que es de de gestión gastronómica o sea, maneja los eh, bueno, obviamente tiene un acceso por un login puedes. Puedes agregar tu stock en cuanto a mercadería, productos rubros, sub rubros, puedes **** recetas, puedes gestionar las ventas, puedes hacer las órdenes, por ejemplo, tienes todo un panel de ordenes en donde elegís los productos que que que vas a que el cliente quiere, por ejemplo, no se una gaseosa, una papa, una coca. Pones una dirección de envío y. Está integrado con las plataformas online por ejemplo, Rappi y las. Forma que tan en Argentina hoy. He pedido ya es otra que está presente. Básicamente el sistema hace eso es un sistema web y. Tiene un costo muy bajo y la ventaja y bueno, las ventajas que tiene sobre una plataforma de Windows se las debería de decir vos, pero bueno, está básicamente enfocados. Enfocado en que esto es una aplicación web que las actualizaciones se hacen automáticamente. T Con un módulo de facturación. Y un soporte online de las 24 horas.
Monitor de cocina, Con un dispositivo en la cocina, los cocineros pueden encargarse de todo sin interrumpir las tareas. Al ingresar y organizar las comandas directamente en pantalla, recibirán los pedidos sin necesidad de imprimirlos.
Registra los pedidos de los meseros
Es una manera práctica y rápida para que los meseros puedan registrar los pedidos de los clientes desde las mesas, sin necesidad de ir a un computador fijo.
Lo puedes utilizar en cualquier dispositivo
Sincronización inmediata con el sistema, Abre, adiciona y cierra mesas desde un mismo lugar
También tiene todo un módulo para hacer un diseño de lo que sería el salón o los salones que tenga, eh, cada comercio dónde poder ubicar mesas una distribución a través de un de una interfaz de. De dragón drop en donde puedes tirar mesas elegir cuántas cuántas cuántas mesas tenés y cada mesa que forma tiene cuántasillas hay y todo esto diseñarlo para tener un. Diagrama de lo que sería el local que vos manejas y las órdenes se pueden asignar a distintas mesas y tener una. La pantalla en donde puedes ver en tiempo real las órdenes distribuidas. Dentro de este gráfico que. Debería representar el salón que vos manejás también tiene todo un módulo para que los mozos a través del celular reciban las notificaciones cada vez que alguien le genera una orden o cada vez que en la cocina por ejemplo, está lista una orden por ejemplo, si en la cocina ya está listo un pedido el mozo que cargó esa orden. Esa esa orden va a ver el estado en tiempo real.  
Luego de 2 o 3 preguntas, enviar esto: Si necesitas más información, te traslado con un especialista.
<a class="chat-link" href="https://wa.me/5491160223474" target="_blank" class="bot-link"> 📞 Segui hablando con un especialista de nuestro equipo</a>.
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
      if (this.thread == null || this.thread == undefined) {
        this.thread = await this.openai.beta.threads.create();
      }

      // Detectar palabras clave relacionadas con recetas de cocina en el mensaje del usuario
      const keywords = this.detectKeywords(message);
      let externalData = '';
  
      // Si se detectan palabras clave, obtener datos externos de la API de recetas
      if (keywords.length > 0) {
        externalData = await this.fetchExternalData(keywords);
      }
  
      // Agregar el mensaje del usuario al hilo
      await this.openai.beta.threads.messages.create(this.thread.id, {
        role: 'user',
        content: message,
      });
  
      // Ejecutar el asistente
      const run = await this.openai.beta.threads.runs.create(this.thread.id, {
        assistant_id: this.assistant.id,
      });
  
      // Esperar a que el asistente termine de procesar
      let runStatus = await this.openai.beta.threads.runs.retrieve(
        this.thread.id,
        run.id
      );
  
      while (runStatus.status !== 'completed') {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        runStatus = await this.openai.beta.threads.runs.retrieve(
          this.thread.id,
          run.id
        );
      }
  
      // Obtener los mensajes del hilo
      const messages = await this.openai.beta.threads.messages.list(this.thread.id);
  
      // Obtener la última respuesta del asistente
      const assistantResponse = messages.data.filter((msg) => msg.role === 'assistant')[0];
  
      // Combinar la respuesta del asistente con los datos externos si existen
      const combinedResponse = assistantResponse?.content[0] /*+ (externalData ? `\n\n${externalData}` : '')*/;
  
      // Enviar la respuesta combinada
      res.json({ response: combinedResponse });
    } catch (error) {
      console.error('Error en sendMessage:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  

private detectKeywords(message: string): string[] {
  const keywords = ['pollo', 'pasta', 'ensalada', 'postre', 'sopa']; // Añadir más ingredientes o tipos de comida según sea necesario
  return keywords.filter(keyword => message.includes(keyword));
}

// Método para obtener datos externos basados en palabras clave de cocina
private async fetchExternalData(keywords: string[]): Promise<string> {
  let externalData = '';

  // Llamadas a la API de Spoonacular según las palabras clave detectadas
  for (const keyword of keywords) {
    externalData += await this.fetchRecipeInformation(keyword);
  }

  return externalData;
}

// Método para obtener recetas detalladas utilizando la API de Spoonacular
private async fetchRecipeInformation(ingredient: string): Promise<string> {
  try {
    // Ejemplo de URL para Spoonacular (necesitas tu propia API key)
    const apiKey = 'fef1b23fd3d240998e0cca3bf0d8cbe9';
    // Cambiamos el endpoint para obtener información detallada de la receta
    const response = await fetch(`https://api.spoonacular.com/recipes/complexSearch?query=${ingredient}&number=1&apiKey=${apiKey}&addRecipeInformation=true`);
    const data = await response.json();

    // Imprime la respuesta completa para verificar su estructura
    console.log('Respuesta de la API:', data);

    // Manejo de la respuesta si contiene resultados
    if (data.results && data.results.length > 0) {
      const recipe = data.results[0];
      const title = recipe.title || 'Título no disponible';
      const ingredients = recipe.extendedIngredients
        ? recipe.extendedIngredients.map((ing: any) => ing.original).join(', ')
        : 'Ingredientes no disponibles';
      const instructions = recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0
        ? recipe.analyzedInstructions[0].steps.map((step: any) => step.step).join(' ')
        : 'Pasos no disponibles';
      const cookingTime = recipe.readyInMinutes ? `Tiempo de cocción: ${recipe.readyInMinutes} minutos.` : 'Tiempo de cocción no disponible';

      // Formatea la respuesta con la información relevante
      return `
        <b>Receta encontrada: ${title}</b><br>
        <b>Ingredientes:</b> ${ingredients}<br>
        <b>Instrucciones:</b> ${instructions}<br>
        ${cookingTime}
      `;
    } else {
      // Mensaje cuando no se encuentran recetas
      return `No se encontraron recetas con el ingrediente: ${ingredient}.`;
    }
  } catch (error) {
    console.error('Error al obtener información de recetas:', error);
    // Muestra un error legible para el usuario
    return 'Hubo un problema al buscar las recetas. Intenta de nuevo más tarde.';
  }
}

}

export const openaiController = new OpenAIController();