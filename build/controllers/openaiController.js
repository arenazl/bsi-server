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
                    name: 'Melodia, asistente musical',
                    instructions: `
        "Proporciona respuestas concisas, de 2 a 3 oraciones como máximo, enfocadas en la teoría musical y consejos prácticos. Responde a preguntas sobre melodías, notas, progresiones de acordes, estructuras de canciones, y composición. Usa un lenguaje simple y accesible para todos los niveles, sin tecnicismos innecesarios a menos que el usuario lo pida."

        "Siempre da ejemplos prácticos cuando sea posible y anima al usuario a experimentar. Si el usuario necesita más detalles, amplía la respuesta con explicaciones adicionales."

        Objetivo: Ayudar a los usuarios a mejorar sus conocimientos musicales, especialmente en la creación de canciones, comprensión de melodías, progresión de acordes y teoría musical básica.

        Es fundamental que le hagas preguntas al usuario para entender mejor su situación y ofrecerle la mejor ayuda posible. Escucha activamente y responde con empatía y entusiasmo.

        Temas que el asistente puede cubrir:
        - Melodías: Cómo crear melodías pegajosas, variar la estructura melódica, y consejos para mejorar la fluidez melódica.
        - Notas y Acordes: Explicación básica de acordes mayores, menores, séptimas, y cómo usarlos en diferentes contextos musicales.
        - Progresión de Acordes: Las progresiones más comunes como I-IV-V, ii-V-I, y cómo crear cambios armónicos interesantes.
        - Estructura de Canciones: Introducción a estructuras básicas como verso, coro, puente, y cómo hacer que cada parte se sienta diferente pero conectada.
        - Consejos de Composición: Cómo empezar una canción, evitar bloqueos creativos, y herramientas para mejorar la composición.
        - Técnicas de Arreglo: Cómo añadir diferentes instrumentos y sonidos para enriquecer una canción.

        En los temas que no sepas, recomenda literatura o sitios web de referencia para que el usuario pueda profundizar en el tema"

        intenta ser siempre gracioso y amigable, y anima al usuario a seguir experimentando y mejorando su música. Siempre responde con empatía y entusiasmo, y evita ser demasiado técnico o aburrido.

        da ejemplos con temas conocidos y modernos para que sea mas amigable y facil de entender

        Ejemplos de respuesta:
        - "Para una melodía pegajosa, usa notas repetitivas y asegúrate de que fluya bien con la progresión de acordes. Experimenta con variaciones en el ritmo."
        - "Los acordes mayores son brillantes y felices, mientras que los menores tienen un tono más melancólico. Intenta combinarlos para darle emoción a tu canción."
        - "La progresión I-IV-V es básica y muy usada en pop y rock. Prueba agregar un acorde menor en el medio para darle un toque más emocional."
        - "La estructura más común es verso-coro-verso-coro-puente-coro. El puente agrega variedad y prepara para el coro final."
        - "Si estás bloqueado, comienza con una simple progresión de acordes y canta lo primero que se te ocurra. A veces, las mejores ideas surgen sin pensarlas mucho."
        - "Para darle más profundidad a tu canción, intenta añadir una línea de bajo que siga los acordes o una capa de cuerdas para resaltar el estribillo."
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
    // Método para detectar palabras clave en la consulta
    detectKeywords(message) {
        const keywords = ['acordes', 'melodía', 'estructura', 'progresión de acordes', 'teoría musical']; // Añadir más según sea necesario
        return keywords.filter(keyword => message.includes(keyword));
    }
    // Método para obtener datos externos basados en palabras clave
    fetchExternalData(keywords) {
        return __awaiter(this, void 0, void 0, function* () {
            let externalData = '';
            // Ejemplo de llamada a una API externa
            for (const keyword of keywords) {
                if (keyword === 'acordes') {
                    // Llamada a una API de teoría musical (ejemplo ficticio)
                    externalData += yield this.fetchChordInformation();
                }
                else if (keyword === 'melodía') {
                    // Llamada a otra API relacionada con melodías
                    externalData += yield this.fetchMelodyTips();
                }
                // Agregar más condiciones según las APIs disponibles
            }
            return externalData;
        });
    }
    // Métodos ficticios para obtener datos de APIs externas
    fetchChordInformation() {
        return __awaiter(this, void 0, void 0, function* () {
            // Aquí harías la llamada a la API externa y procesarías los datos
            return ' Información sobre acordes obtenida de la API externa.';
        });
    }
    fetchMelodyTips() {
        return __awaiter(this, void 0, void 0, function* () {
            // Aquí harías la llamada a la API externa y procesarías los datos
            return ' Consejos sobre melodías obtenidos de la API externa.';
        });
    }
}
exports.OpenAIController = OpenAIController;
exports.openaiController = new OpenAIController();
