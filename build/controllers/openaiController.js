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
const databaseHelper_1 = __importDefault(require("../databaseHelper"));
const axios_1 = __importDefault(require("axios"));
class OpenAIController {
    constructor() {
        this.numeroDestino = '54111560223474';
        this.mensaje = 'Respuesta del asistente';
        this.initialize = this.initialize.bind(this);
        //this.sendMessage = this.sendMessage.bind(this);
        //this.sendWhatsApp = this.sendWhatsApp.bind(this);
        this.verifyWebhook = this.verifyWebhook.bind(this);
        this.handleWebhook = this.handleWebhook.bind(this);
        this.initialize();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.openai = new openai_1.default({
                    apiKey: keys_1.default.OpenAi.key
                });
                this.assistant = yield this.openai.beta.assistants.create({
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
            }
            catch (error) {
                console.error('Error al inicializar OpenAI:', error);
            }
        });
    }
    verifyWebhook(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const VERIFY_TOKEN = "LOOKUS";
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];
            if (mode && token) {
                if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                    console.log('Webhook verificado');
                    res.status(200).send(challenge);
                }
                else {
                    res.sendStatus(403);
                }
            }
        });
    }
    handleWebhook(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const body = req.body;
                if (body.object === 'whatsapp_business_account') {
                    body.entry.forEach((entry) => __awaiter(this, void 0, void 0, function* () {
                        const changes = entry.changes;
                        for (const change of changes) {
                            const messageData = change.value.messages;
                            if (messageData) {
                                for (const message of messageData) {
                                    const from = message.from;
                                    const messageText = message.text.body;
                                    console.log(`Mensaje recibido de ${from}: ${messageText}`);
                                    // 1. Enviar mensaje de carga
                                    yield this.sendWhatsAppMessage(from, "⏳ Procesando tu solicitud, por favor espera un momento...");
                                    // 2. Obtener respuesta del asistente
                                    const assistantResponse = yield this.sendMessage(messageText);
                                    console.log(`Respuesta del asistente: ${assistantResponse}`);
                                    // 3. Enviar respuesta final
                                    yield this.sendWhatsAppMessage(from, assistantResponse);
                                }
                            }
                        }
                    }));
                    res.status(200).send('EVENT_RECEIVED');
                }
                else {
                    res.sendStatus(404);
                }
            }
            catch (error) {
                console.error('Error al recibir mensaje de WhatsApp:', error);
                res.sendStatus(500);
            }
        });
    }
    sendMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let showCategory = false;
                // Asegurarse de que OpenAI y el asistente estén inicializados
                if (!this.openai || !this.assistant) {
                    yield this.initialize();
                }
                if (!this.assistant) {
                    throw new Error('No se pudo inicializar el asistente de OpenAI.');
                }
                if (message.includes('menu') || message.includes('carta')) {
                    showCategory = true;
                }
                const externalData = yield this.fetchDataFromSP(showCategory);
                if (!externalData) {
                    throw new Error('No se pudo obtener el menú desde el SP.');
                }
                console.log('Datos del menú:', externalData);
                // Crear un hilo si no existe
                if (!this.thread) {
                    this.thread = yield this.openai.beta.threads.create();
                    const promptWithDBData = `
        Te proporciono la carta completa del menú del restaurante:
        "${externalData}"
        A partir de ahora, podrás referenciar esta información para ayudar al usuario.
        Si el usuario en su mensaje pone la palabra menu o carta, también muestra la subcategoría de los productos.
      `;
                    yield this.openai.beta.threads.messages.create(this.thread.id, {
                        role: 'user',
                        content: promptWithDBData,
                    });
                }
                // Añadir el mensaje del usuario al hilo
                yield this.openai.beta.threads.messages.create(this.thread.id, {
                    role: 'user',
                    content: message,
                });
                // Ejecutar el asistente
                const run = yield this.openai.beta.threads.runs.create(this.thread.id, {
                    assistant_id: this.assistant.id,
                });
                // Bucle de espera con límite de intentos
                let runStatus = yield this.openai.beta.threads.runs.retrieve(this.thread.id, run.id);
                let attempts = 0;
                const maxAttempts = 10;
                while (runStatus.status !== 'completed' && attempts < maxAttempts) {
                    yield new Promise((resolve) => setTimeout(resolve, 10000));
                    runStatus = yield this.openai.beta.threads.runs.retrieve(this.thread.id, run.id);
                    attempts++;
                }
                if (runStatus.status !== 'completed') {
                    throw new Error('El asistente tardó demasiado en responder.');
                }
                const messages = yield this.openai.beta.threads.messages.list(this.thread.id);
                // Obtener la última respuesta del asistente
                const assistantResponse = messages.data.filter((msg) => msg.role === 'assistant')[0];
                var response = assistantResponse ? assistantResponse.content : 'Hubo un problema al procesar tu Smensaje.';
                //ts-ignore
                return response[0].text.value;
            }
            catch (error) {
                console.error('Error en sendMessage:', error);
                return 'Error interno del servidor';
            }
        });
    }
    sendWhatsAppMessage(to, message) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = keys_1.default.Tokens.Meta;
                yield axios_1.default.post(`https://graph.facebook.com/v21.0/124321500653142/messages`, {
                    messaging_product: 'whatsapp',
                    to: this.numeroDestino,
                    text: { body: message },
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log(`Mensaje enviado a ${to}: ${message}`);
            }
            catch (error) {
                console.error('Error al enviar mensaje de WhatsApp:', error);
            }
        });
    }
    formatResults(results, showCategory = false) {
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
            formattedData += `   💲 Precio: $${result.Precio}\n`;
        }
        return formattedData.trim(); // Elimina espacios adicionales al final
    }
    fetchDataFromSP() {
        return __awaiter(this, arguments, void 0, function* (showcategory = false) {
            let resultData = '';
            const queryResult = yield databaseHelper_1.default.executeSpSelect("GetClientFriendlyMenu", []);
            if (queryResult.length > 0) {
                resultData += this.formatResults(queryResult, showcategory);
            }
            return resultData;
        });
    }
}
exports.OpenAIController = OpenAIController;
exports.openaiController = new OpenAIController();
