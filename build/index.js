"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const indexRoutes_1 = __importDefault(require("./routes/indexRoutes"));
const fileRoutes_1 = __importDefault(require("./routes/fileRoutes"));
const helperRoutes_1 = __importDefault(require("./routes/helperRoutes"));
const IORoutes_1 = __importDefault(require("./routes/IORoutes"));
const metadataRoutes_1 = __importDefault(require("./routes/metadataRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const openaiRoutes_1 = __importDefault(require("./routes/openaiRoutes"));
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
/**
 * Represents the server class responsible for setting up and starting the Express application.
 */
class Server {
    constructor() {
        // Opciones HTTPS
        this.httpsOptions = {
            key: fs_1.default.readFileSync('src/crt/key.pem'), // Asegúrate de reemplazar con la ruta real
            cert: fs_1.default.readFileSync('src/crt/cert.pem') // Asegúrate de reemplazar con la ruta real
        };
        this.app = (0, express_1.default)();
        this.config();
        this.routes();
    }
    /**
     *
     * Error handling middleware function.
     *
     * @param err - The error object.
     * @param req - The request object.
     * @param res - The response object.
     * @param next - The next middleware function in the stack.
     */
    errorHandler(err, req, res, next) {
        console.error(err.stack);
        res.status(500).json({
            message: 'Ocurrió un error en el servidor (metodo globlal)',
            error: err.message,
        });
    }
    /**
     * Configures the Express application.
     */
    config() {
        this.app.set('port', process.env.PORT || 3000);
        this.app.use(this.allowCrossDomain);
        this.app.use((0, morgan_1.default)('dev'));
        this.app.use((0, cors_1.default)({
            origin: ['https://bsi-app.com.ar', 'https://bsi-front-dev-d9e25e719b54.herokuapp.com', 'http://localhost:4200'],
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: false }));
        this.app.options('*', (req, res) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.sendStatus(200);
        });
    }
    /**
     * Middleware function to allow cross-domain requests.
     *
     * @param req - The request object.
     * @param res - The response object.
     * @param next - The next middleware function in the stack.
     */
    allowCrossDomain(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
        }
        else {
            next();
        }
    }
    /**
     * Sets up the routes for the Express application.
     */
    routes() {
        this.app.use('/', indexRoutes_1.default);
        this.app.use('/api/file', fileRoutes_1.default);
        this.app.use('/api/helper', helperRoutes_1.default);
        this.app.use('/api/IO', IORoutes_1.default);
        this.app.use('/api/metadata', metadataRoutes_1.default);
        this.app.use('/api/user', userRoutes_1.default);
        this.app.use('/api/openai', openaiRoutes_1.default);
        this.app.use(this.errorHandler);
    }
    /**
     * Starts the Express server.
     */
    start() {
        /*
        this.app.listen(this.app.get('port'), () => {
            console.log('Server on port', this.app.get('port'));
        });*/
        // Iniciar el servidor HTTPS
        https_1.default.createServer(this.httpsOptions, this.app).listen(3000, () => {
            console.log('HTTPS Server running on port 3000');
        });
    }
}
const server = new Server();
server.start();
