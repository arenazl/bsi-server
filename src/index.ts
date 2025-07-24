import express, { Application, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import indexRoutes from './routes/indexRoutes';
import fileRoutes from './routes/fileRoutes';
import HelperRoutes from './routes/helperRoutes';
import IORoutes from './routes/IORoutes';
import metadataRoutes from './routes/metadataRoutes';
// import userRoutes from './routes/userRoutes'; // Comentado temporalmente
// import openaiRoutes from './routes/openaiRoutes'; // Comentado temporalmente
import EmailService from './services-v2/emailService';
import config from './keys';
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
    async errorHandler(err: any, req: Request, res: Response, next: NextFunction) {

        
        console.error(err.stack);
        
        // Extraer información detallada del error
        const timestamp = new Date().toLocaleString('es-AR');
        const method = req.method;
        const url = req.originalUrl || req.url;
        const userAgent = req.get('User-Agent') || 'Unknown';
        const ip = req.ip || req.connection.remoteAddress || 'Unknown';
        
        // Extraer ID del municipio del request body y obtener su descripción
        let municipioId = 'No especificado';
        let municipioDescripcion = 'No especificado';
        
        try {
            if (req.body?.body?.id_organismo) {
                municipioId = req.body.body.id_organismo.toString();
            } else if (req.body?.id_organismo) {
                municipioId = req.body.id_organismo.toString();
            } else if (req.body?.IDORG) {
                municipioId = req.body.IDORG.toString();
            } else if (req.params?.organismo) {
                municipioId = req.params.organismo.toString();
            }

            // Obtener descripción del municipio si tenemos el ID
            if (municipioId !== 'No especificado') {
                try {
                    const DatabaseHelper = require('./databaseHelper').default;
                    const result = await DatabaseHelper.executeSpSelect('ObtenerNombreOrganismo', [municipioId]);
                    if (result && result.length > 0 && result[0].NombreOrganismo ) {
                        municipioDescripcion = result[0].NombreOrganismo ;
                    } else {
                        municipioDescripcion = `Municipio ID: ${municipioId}`;
                    }
                } catch (dbError) {
                    console.log('Error obteniendo descripción del municipio:', dbError);
                    municipioDescripcion = `Municipio ID: ${municipioId}`;
                }
            }
        } catch (e) {
            // Si hay error extrayendo el ID, mantener valor por defecto
        }
        
        // Construir mensaje detallado del error
        const errorDetails = `
MÉTODO HTTP: ${method}
ENDPOINT: ${url}
HORA: ${timestamp}
MUNICIPIO: ${municipioDescripcion}
USER AGENT: ${userAgent}

PARÁMETROS RECIBIDOS:
- Body: ${JSON.stringify(req.body, null, 2)}
- Query: ${JSON.stringify(req.query, null, 2)}
- Params: ${JSON.stringify(req.params, null, 2)}

STACK TRACE:
${err.stack}
        `;

        const friendlyDescription = `
Se produjo un error en el servidor BSI durante la ejecución de una operación.

Detalles del contexto:
- Endpoint afectado: ${method} ${url}
- Fecha y hora: ${timestamp}
- Dirección IP del cliente: ${ip}

Por favor revise los logs del servidor y tome las acciones necesarias.
        `;

        // Enviar email automáticamente
        try {
            await EmailService.sendErrorNotificationSimple(
                'Error',
                errorDetails.trim(),
                friendlyDescription.trim()
            );
        } catch (emailError) {
            console.error('Error enviando notificación por email:', emailError);
        }

        // Responder al cliente con formato estándar
        res.status(500).json({
            estado: 0,
            descripcion: err.message || 'Error interno del servidor',
            data: null
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
        // this.app.use('/api/user', userRoutes); // Comentado temporalmente
        // this.app.use('/api/openai', openaiRoutes); // Comentado temporalmente

        this.app.use(this.errorHandler.bind(this));
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
