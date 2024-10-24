"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const indexRoutes_1 = __importDefault(require("./routes/indexRoutes"));
const fileRoutes_1 = __importDefault(require("./routes/fileRoutes"));
const helperRoutes_1 = __importDefault(require("./routes/helperRoutes"));
const IORoutes_1 = __importDefault(require("./routes/IORoutes"));
const metadataRoutes_1 = __importDefault(require("./routes/metadataRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const openaiRoutes_1 = __importDefault(require("./routes/openaiRoutes"));
/**
 * Represents the server class responsible for setting up and starting the Express application.
 */
class Server {
    constructor() {
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
        // Opciones HTTPS
        /*
            const httpsOptions = {
                key: fs.readFileSync(path.join(__dirname, 'crt/key.pem')),
                cert: fs.readFileSync(path.join(__dirname, 'crt/cert.pem'))
        };*/
        this.app.listen(this.app.get('port'), () => {
            console.log('Server on port', this.app.get('port'));
        });
        // Iniciar el servidor HTTPS
        /*
        https.createServer(httpsOptions, this.app).listen(3000, () => {
        console.log('HTTPS Server running on port 3000');
        X
    });*/
    }
}
const server = new Server();
server.start();
