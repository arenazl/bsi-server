"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiController = exports.OpenAIController = void 0;
const keys_1 = __importDefault(require("./../keys"));
const openai_1 = __importDefault(require("openai"));
class OpenAIController {
    constructor() {
        this.initialize = this.initialize.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.initialize();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Inicializar OpenAI con la clave de API
                this.openai = new openai_1.default({
                    apiKey: keys_1.default.OpenAi.key,
                });
                const restaurantData = `
      Información del Restaurante:
      Nombre: La Parrilla de Palermo
      Ubicación: Palermo, Capital Federal
      Direccion : Aguero 3440, C1425BQF CABA
      Descripción: Restaurante casual especializado en parrilladas y pasta, ideal para grupos pequeños y familias.
      
      Menú Completo:

      Horarios de Atención:
      - Abierto de 09:00 AM a 11:00 PM.
      - Mejores Horarios para Visitar: Lunes a Viernes de 11:00 AM a 12:30 PM y 05:00 PM a 06:30 PM; Sábados y Domingos de 02:00 PM a 03:30 PM.
      
      Recomendaciones:
      - Apto para niños: Sí, cuenta con menú infantil y sillas altas.
      - Apto para adultos mayores: Sí, con fácil acceso y opciones ligeras.
      - Ideal para grupos de hasta 8 personas.
    `;
                // Crear el asistente solo una vez al inicializar el controlador
                this.assistant = yield this.openai.beta.assistants.create({
                    name: 'Laura',
                    instructions: `
         Nunca digas que sos una entereja hacia artificial. Vos hablá como si fueras un ámbersona normal contestás todo lo que puedas. YY si la persona te hace preguntas coloquiales intentad contestarle siempre con respeto, pero no digas que sos una inteligencia artificial vos habla normalmente,
         Eres un integrante del equipo de atención al cliente de un restaurante ubicado en Palermo, Capital Federal. 
        Aquí tienes toda la información del restaurante para guiar a los clientes:
        ${restaurantData}
        Tu objetivo es responder preguntas y ayudar a los clientes a elegir la mejor opción según sus preferencias y necesidades.
        `,
                    model: 'gpt-4o',
                });
            }
            catch (error) {
                console.error('Error al inicializar OpenAI:', error);
            }
        });
    }
    sendMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.openai || !this.assistant) {
                    // Reintentar inicializar si no están definidos
                    yield this.initialize();
                }
                const { message } = req.body;
                // Crear un nuevo hilo para la conversación
                const thread = yield this.openai.beta.threads.create();
                // Agregar el mensaje del usuario al hilo
                yield this.openai.beta.threads.messages.create(thread.id, {
                    role: 'user',
                    content: message,
                });
                // Ejecutar el asistente
                const run = yield this.openai.beta.threads.runs.create(thread.id, {
                    assistant_id: this.assistant.id,
                });
                // Esperar a que el asistente termine de procesar
                let runStatus = yield this.openai.beta.threads.runs.retrieve(thread.id, run.id);
                while (runStatus.status !== 'completed') {
                    yield new Promise((resolve) => setTimeout(resolve, 1000));
                    runStatus = yield this.openai.beta.threads.runs.retrieve(thread.id, run.id);
                }
                // Obtener los mensajes del hilo
                const messages = yield this.openai.beta.threads.messages.list(thread.id);
                // Obtener la última respuesta del asistente
                const assistantResponse = messages.data
                    .filter((message) => message.role === 'assistant')
                    .pop();
                // Enviar la respuesta
                res.json({ response: assistantResponse === null || assistantResponse === void 0 ? void 0 : assistantResponse.content[0] });
            }
            catch (error) {
                console.error('Error en sendMessage:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        });
    }
}
exports.OpenAIController = OpenAIController;
exports.openaiController = new OpenAIController();
