import express, { Application, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import indexRoutes from './routes/indexRoutes';
import legajoRoutes from './routes/legajoRoutes';
import loteRoutes from './routes/loteRoutes';
import fileRoutes from './routes/fileRoutes';

class Server {
    public app: Application;

    constructor() {
        this.app = express();
        this.config();
        this.routes();
        this.globalErrorHandler();
    }

    config(): void {
        this.app.set('port', process.env.PORT || 3000);

        this.app.use(this.allowCrossDomain);
        this.app.use(morgan('dev'));
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
    }

    allowCrossDomain(req: Request, res: Response, next: NextFunction): void {

        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

        if (req.method === 'OPTIONS') {
            res.sendStatus(200);
        } else {
            next();
        }
    }

    routes(): void {
        this.app.use('/', indexRoutes);
        this.app.use('/api/legajo', legajoRoutes);
        this.app.use('/api/file', fileRoutes);
        this.app.use('/api/lote', loteRoutes);
    }

    globalErrorHandler(): void {
        this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            console.error(err.stack);
            res.status(500).send({ error: 'Something went wrong!' });
        });

        process.on('uncaughtException', (err: Error) => {
            console.error('There was an uncaught error', err);
        });

        process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });
    }

    start(): void {
        this.app.listen(this.app.get('port'), () => {
            console.log('Server on port', this.app.get('port'));
        });
    }
}

const server = new Server();
server.start();