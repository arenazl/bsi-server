import express, { Application, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import indexRoutes from './routes/indexRoutes';
import fileRoutes from './routes/fileRoutes';
import HelperRoutes from './routes/helperRoutes';
import IORoutes from './routes/IORoutes';
import metadataRoutes from './routes/metadataRoutes';
import userRoutes from './routes/userRoutes';
import openaiRoutes from './routes/openaiRoutes';
import https from 'https';
import fs from 'fs';
import path from 'path';
require('dotenv').config();


/**
 * Represents the server class responsible for setting up and starting the Express application.
 */
class Server {
       
    public app: Application;

    constructor() {
        this.app = express();
        this.config();
        this.routes();

        /*
        const PORT = 3000;
        // Ruta básica para verificar que la app funcione
        this.app.get('/', (req, res) => {
        res.send('¡Hola, ngrok está funcionando!');
        });*/
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
    config(): void {
        this.app.set('port', process.env.PORT || 3000);
        this.app.use(this.allowCrossDomain);
        this.app.use(morgan('dev'));

        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));

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

    /**
     * Sets up the routes for the Express application.
     */
    routes(): void {

        this.app.use('/', indexRoutes);
        this.app.use('/api/file', fileRoutes);
        this.app.use('/api/helper', HelperRoutes);
        this.app.use('/api/IO', IORoutes);
        this.app.use('/api/metadata', metadataRoutes);
        this.app.use('/api/user', userRoutes);
        this.app.use('/api/openai', openaiRoutes);

        this.app.use(this.errorHandler);
    }

    /**
     * Starts the Express server.
     */
    start(): void {

            // Opciones HTTPS    
            /*
                const httpsOptions = {
                    key: fs.readFileSync(path.join(__dirname, 'crt/key.pem')),
                    cert: fs.readFileSync(path.join(__dirname, 'crt/cert.pem'))
                    
                
            };*/

        this.app.listen(this.app.get('port'), () => {
            console.log('Server on port', this.app.get('port'));
        });


        /*
        console.log('my key'); 
        console.log(process.env.OPENAI_API_KEY); 
        */

        // Iniciar el servidor HTTPS
        /*
        https.createServer(httpsOptions, this.app).listen(3000, () => {
        console.log('HTTPS Server running on port 3000');
        */

    }
}

const server = new Server();
server.start();