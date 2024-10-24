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
const databaseHelper_1 = __importDefault(require("../databaseHelper"));
const axios_1 = __importDefault(require("axios"));
class OpenAIController {
    constructor() {
        this.numeroDestino = '5491160223474'; // Número en formato internacional  
        this.mensaje = 'hola';
        this.initialize = this.initialize.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.sendWhatsApp = this.sendWhatsApp.bind(this);
        this.webhook = this.webhook.bind(this);
        this.initialize();
    }
    webhook(req, res) {
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
    sendWhatsApp(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = 'EAAH3vCxdMZBoBO8c9mZB12Xg3ZBHldsRlrZBqSK2pBUPQbqzhbUrZA2OJsmwuLOcKwZCGVd4ijTR45Wom6wuI56YM53RqiLz4TbUqkf2ecglNrPhbU384pnIEKqio8J5sVZCIN8JIIfZA5jsdYHT5hBHvLK2P5ucOVjreorAZC8yXFIJ1epIK2tAoVdDq6FUdtncFTha9rRXYrAkT4eArqa1nTuY4Y6yAwyTbQwOZCBrTtUAZDZD';
                const response = yield axios_1.default.post(`https://graph.facebook.com/v20.0/124321500653142/messages`, {
                    messaging_product: 'whatsapp',
                    to: this.numeroDestino,
                    text: { body: this.mensaje },
                }, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                console.log('Mensaje de WhatsApp enviado:', response.data);
            }
            catch (error) {
                console.error('Error al enviar mensaje de WhatsApp:', error);
            }
        });
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Inicializar OpenAI con la clave de API
                this.openai = new openai_1.default({
                    apiKey: process_1.env.OPENAI_API_KEY.toString(),
                });
                // Crear el asistente solo una vez al inicializar el controlador
                this.assistant = yield this.openai.beta.assistants.create({
                    name: 'mozo experimentado en el restaurante De la Bien Querida',
                    instructions: `
          Sos un mozo con mucha experiencia que trabaja en un restaurante llamado "De la Bien Querida".         
          Ayudás a los clientes a tomar decisiones sobre los mejores platos según sus gustos y necesidades. También podés recomendar vinos y postres, 
          y siempre das una explicación completa sobre los ingredientes y los métodos de preparación de los platos. 
          Siempre te aseguras de que los clientes se sientan bienvenidos y cómodos.
          Siempre que des informacion sobre un producto, recorda poner por debajo la descripción y el precio.
        `,
                    model: 'gpt-3.5-turbo',
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
                let showCategory = false;
                if (!this.openai || !this.assistant) {
                    // Reintentar inicializar si no están definidos
                    yield this.initialize();
                }
                const { message } = req.body;
                if (message.includes('menu') || message.includes('carta'))
                    showCategory = true;
                // Cargar el menú solo al crear el hilo
                const externalData = yield this.fetchDataFromSP(showCategory);
                // Crear un nuevo hilo para la conversación solo si no está definido
                if (!this.thread) {
                    this.thread = yield this.openai.beta.threads.create();
                    // Añadir el menú al contexto del hilo como un mensaje del "sistema"
                    const promptWithDBData = `
      Te proporciono la carta completa del menú del restaurante:
      "${externalData}"
      <ssss
      A partir de ahora, podrás referenciar esta información para ayudar al usuario.
      Si el usuario en su mensaje pone la palabra menu o carta, tb mostra la subcategoria de los productos.
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
                // Ejecutar el asistente con el contexto y el mensaje del usuario
                const run = yield this.openai.beta.threads.runs.create(this.thread.id, {
                    assistant_id: this.assistant.id,
                });
                // Esperar a que el asistente termine de procesar
                let runStatus = yield this.openai.beta.threads.runs.retrieve(this.thread.id, run.id);
                while (runStatus.status !== 'completed') {
                    yield new Promise((resolve) => setTimeout(resolve, 10000));
                    runStatus = yield this.openai.beta.threads.runs.retrieve(this.thread.id, run.id);
                }
                // Obtener los mensajes del hilos
                const messages = yield this.openai.beta.threads.messages.list(this.thread.id);
                // Obtener la última respuesta del asistente
                const assistantResponse = messages.data.filter((msg) => msg.role === 'assistant')[0];
                // Enviar la respuesta generada por OpenAI al usuario
                res.json({ response: assistantResponse.content });
            }
            catch (error) {
                console.error('Error en sendMessage:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        });
    }
    // Método para formatear los resultados del SP en una respuesta adecuada para el cliente
    formatResults(results, showcategory = false) {
        let formattedData = '';
        let subcategoria = ''; // Variable para rastrear la categoría actual
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
    fetchDataFromSP() {
        return __awaiter(this, arguments, void 0, function* (showcategory = false) {
            let resultData = '';
            // Conectar con la base de datos y ejecutar el stored procedure con las keywords
            //for (const keyword of keywords) {
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
