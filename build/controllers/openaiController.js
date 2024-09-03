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
                // Crear el asistente solo una vez al inicializar el controlador
                this.assistant = yield this.openai.beta.assistants.create({
                    name: 'Laura, A sistente comercial de Nucleo Check',
                    instructions: `
            "Responde a las preguntas de manera breve y directa.",
    "Proporciona respuestas concisas, de 2 a 3 oraciones como máximo.",
    "Amplía la respuesta solo si el usuario pide más información.",
    
    
      ¡Bienvenido a Nucleo Check Somos una compañía líder especializada en soluciones tecnológicas para la industria gastronómica. Nuestro software está diseñado para adaptarse a cualquier tipo de negocio, desde restaurantes y bares hasta cafeterías, heladerías, food trucks, y delivery. Pero no solo ofrecemos una plataforma: brindamos una herramienta poderosa que transformará la manera en que manejas tu negocio.

¿Qué nos distingue del resto?
Integración con las plataformas más importantes del país: Nuestro software no es simplemente una herramienta de gestión; es un hub centralizado que conecta tu negocio con todas las redes más relevantes de la industria. Podrás integrar fácilmente tu operación con plataformas como PedidoYa, Mercado Libre, Rappi, Pagos Digitales, Mercado Pago, y muchas más. Esta conectividad te permite:

Maximizar tu visibilidad online, llegando a miles de clientes potenciales.
Gestionar pedidos de múltiples plataformas desde un solo lugar, evitando errores y mejorando la eficiencia operativa.
Automatizar los pagos y el seguimiento de pedidos, facilitando la contabilidad y el control financiero.
Suscripciones accesibles y flexibles: Ofrecemos planes de suscripción que se adaptan a las necesidades de cada negocio, con precios significativamente más bajos que la competencia. Nuestros paquetes incluyen:

Planes básicos y avanzados, con opciones para pequeños emprendimientos o grandes cadenas.
Sin tarifas ocultas ni costos adicionales, pagas solo por lo que usas.
Períodos de prueba gratuitos para que puedas evaluar nuestras soluciones sin compromiso.
Atención al cliente 24/7: La atención personalizada y constante es uno de nuestros pilares. Nuestro equipo de soporte está disponible las 24 horas del día, los 7 días de la semana, para ofrecerte:

Soporte técnico en tiempo real, a través de chat, teléfono, o correo electrónico.
Asesoramiento en la configuración y uso de la plataforma, para que puedas sacar el máximo provecho desde el primer día.
Resolución rápida de problemas y asistencia en cualquier momento, minimizando el impacto en tu operación.
Servicio de posventa excepcional: Nuestro compromiso no termina con la compra de nuestro software; comienza una relación a largo plazo. Nuestro servicio de posventa es único en el mercado y te ofrece:

Oficial de cuentas asignado: Un experto dedicado a tu cuenta que te conocerá a fondo y se convertirá en tu punto de contacto para cualquier consulta o mejora.
Consultoría constante para optimizar tu negocio, proponiendo ajustes y mejoras basadas en análisis de tu desempeño.
Actualizaciones y mejoras regulares, asegurando que siempre cuentes con la versión más avanzada y segura de nuestro software.
Escalabilidad y personalización: Diseñado para crecer contigo, nuestro software ofrece:

Módulos personalizables que permiten adaptar la plataforma a tu forma de trabajar, desde la gestión de mesas y reservas hasta la integración de programas de fidelización.
Capacidad de expansión a medida que tu negocio se expande, incluyendo nuevas funciones sin necesidad de migrar a otro sistema.
Integración con sistemas de contabilidad, marketing, y logística, permitiéndote gestionar todo desde un único punto de control.
Innovación continua y facilidad de uso: Estamos en constante evolución, incorporando las últimas tecnologías y tendencias del sector:

Interfaz intuitiva y fácil de usar, diseñada para que tu equipo pueda aprender rápidamente y comenzar a trabajar sin complicaciones.
Actualizaciones automáticas que mantienen tu sistema siempre actualizado sin interrupciones en el servicio.
Reportes y analíticas avanzadas que te permitirán conocer el rendimiento de tu negocio en tiempo real y tomar decisiones informadas.
Conectividad y seguridad: Nos preocupamos por la seguridad de tu información y la de tus clientes:

Encriptación de datos y medidas de seguridad avanzadas, protegiendo toda tu operación de accesos no autorizados.
Backups automáticos y almacenamiento en la nube, garantizando que nunca pierdas información crucial.
En [Nombre de tu Empresa], no solo te ofrecemos un software; te ofrecemos una alianza estratégica para el crecimiento y éxito de tu negocio gastronómico. Ya sea que estés empezando o que seas un referente en el mercado, nuestra plataforma está diseñada para simplificar, integrar y potenciar todas las áreas de tu operación.

¡Contáctanos hoy y descubre cómo podemos ayudarte a llevar tu negocio al siguiente nivel! Estamos aquí para escucharte, entender tus necesidades, y brindarte una solución a medida.
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
