"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const indexRoutes_1 = __importDefault(require("./routes/indexRoutes"));
const legajoRoutes_1 = __importDefault(require("./routes/legajoRoutes"));
const loteRoutes_1 = __importDefault(require("./routes/loteRoutes"));
const fileRoutes_1 = __importDefault(require("./routes/fileRoutes"));
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        this.config();
        this.routes();
        this.globalErrorHandler();
    }
    config() {
        this.app.set('port', process.env.PORT || 3000);
        this.app.use(this.allowCrossDomain);
        this.app.use((0, morgan_1.default)('dev'));
        this.app.use((0, cors_1.default)());
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: false }));
    }
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
    routes() {
        this.app.use('/', indexRoutes_1.default);
        this.app.use('/api/legajo', legajoRoutes_1.default);
        this.app.use('/api/file', fileRoutes_1.default);
        this.app.use('/api/lote', loteRoutes_1.default);
    }
    globalErrorHandler() {
        this.app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).send({ error: 'Something went wrong!' });
        });
        process.on('uncaughtException', (err) => {
            console.error('There was an uncaught error', err);
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });
    }
    start() {
        this.app.listen(this.app.get('port'), () => {
            console.log('Server on port', this.app.get('port'));
        });
    }
}
const server = new Server();
server.start();
