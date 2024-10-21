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
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const whatsapp_web_js_1 = require("whatsapp-web.js");
class OpenAIController {
    constructor() {
        this.numeroDestino = '5491160223474'; // Número en formato internacional  
        this.mensaje = 'hola';
        this.initialize = this.initialize.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.webhookVerification = this.webhookVerification.bind(this);
        this.handleIncomingWhatsAppMessage = this.handleIncomingWhatsAppMessage.bind(this);
        this.initialize();
        // Inicializar cliente de WhatsApp
        this.client = new whatsapp_web_js_1.Client({
            puppeteer: {
                headless: true,
            },
        });
        this.client.on('qr', (qr) => {
            qrcode_terminal_1.default.generate(qr, { small: true });
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
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.openai = new openai_1.default({
                    apiKey: process_1.env.OPENAI_API_KEY.toString(),
                });
                this.assistant = yield this.openai.beta.assistants.create({
                    name: 'asistente comercial de una empresa de software de gestión gastronómica llamado Nucleo Check',
                    instructions: `...`, // Instrucciones que ya tienes
                    model: 'gpt-4o',
                });
            }
            catch (error) {
                console.error('Error al inicializar OpenAI:', error);
            }
        });
    }
    // Ruta para la verificación del webhook de WhatsApp
    webhookVerification(req, res) {
        const VERIFY_TOKEN = 'EAAPjb1ZAOsKMBOyzZBHDUcdMqGZCfAqsAXX3hQk182cKzEGykw7Qqk7npqf0z3n66tTQgv0LtMPjZB0Mb1dD3ZA8SaY2eXrpAYikHuTZCWPIpGn2EoCV8oeSKmmyyL2lPNhLRarljpTDRtGZBxOyMECSou69OmMSyxmTNTVrcDwuCXhH7x2k74l2ZAdw0TeEXI8AQzuZAHSwMI85KzXA84bK1k05rsXwswojmnq5PLkPd';
        let mode = req.query['hub.mode'];
        let token = req.query['hub.verify_token'];
        let challenge = req.query['hub.challenge'];
        if (mode && token && token === VERIFY_TOKEN) {
            if (mode === 'subscribe') {
                console.log('WEBHOOK_VERIFIED');
                res.status(200).send(challenge);
            }
            else {
                res.sendStatus(403);
            }
        }
        else {
            res.sendStatus(403);
        }
    }
    handleIncomingWhatsAppMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const chatId = `${message.from}`;
                const userMessage = message.body;
                // Enviar el mensaje a OpenAI para obtener la respuesta
                if (!this.openai || !this.assistant) {
                    yield this.initialize();
                }
                // Crear un hilo si aún no existe
                if (!this.thread) {
                    this.thread = yield this.openai.beta.threads.create();
                }
                // Añadir el mensaje del usuario al hilo
                yield this.openai.beta.threads.messages.create(this.thread.id, {
                    role: 'user',
                    content: userMessage,
                });
                // Ejecutar el asistente
                const run = yield this.openai.beta.threads.runs.create(this.thread.id, {
                    assistant_id: this.assistant.id,
                });
                let runStatus = yield this.openai.beta.threads.runs.retrieve(this.thread.id, run.id);
                while (runStatus.status !== 'completed') {
                    yield new Promise((resolve) => setTimeout(resolve, 1000));
                    runStatus = yield this.openai.beta.threads.runs.retrieve(this.thread.id, run.id);
                }
                // Obtener los mensajes del asistente
                const messages = yield this.openai.beta.threads.messages.list(this.thread.id);
                // Combinar todos los mensajes de respuesta del asistente en una sola cadena
                const assistantResponses = messages.data
                    .filter((msg) => msg.role === 'assistant')
                    .map((msg) => msg.content)
                    .join('\n'); // Une todas las respuestas con un salto de línea
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
            }
            catch (error) {
                console.error('Error en handleIncomingWhatsAppMessage:', error);
            }
        });
    }
    sendMessage(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // La función sendMessage que ya tienes, modificada para enviar mensajes manualmente
            // desde una solicitud HTTP.
        });
    }
}
exports.OpenAIController = OpenAIController;
exports.openaiController = new OpenAIController();
