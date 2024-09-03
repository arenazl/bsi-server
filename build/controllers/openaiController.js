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
const process_1 = require("process");
const openai_1 = __importDefault(require("openai"));
class OpenAIController {
    constructor() {
        this.initialize = this.initialize.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.initialize();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(process_1.env.OPENAI_API_KEY);
            try {
                // Inicializar OpenAI con la clave de API
                this.openai = new openai_1.default({
                    apiKey: process_1.env.OPENAI_API_KEY.toString(),
                });
                // Crear el asistente solo una vez al inicializar el controlador
                this.assistant = yield this.openai.beta.assistants.create({
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
