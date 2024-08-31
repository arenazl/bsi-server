import express, { Router } from 'express';
import fileController from '../controllers/filesController';
import MetadataController from '../controllers/metadataController';

class MetadataRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {
        this.router.get('/GET_RESUMEN/:tipomodulo/:id', MetadataController.getResumen);
        this.router.get('/GET_FILL/:tipomodulo/:id', MetadataController.getFill);  
        this.router.get('/GET_METADATA_UI/:tipomodulo/:tipometada/:contrato', MetadataController.getMetadataUI);
    }
}

export default new MetadataRoutes().router;