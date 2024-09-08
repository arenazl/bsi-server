import express, { Router } from 'express';
import fileController from '../controllers/filesController';
import MetadataController from '../controllers/metadataController';

class MetadataRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {
        this.router.get('/GET_METADATA_UI/:tipomodulo/:tipometada/:contrato', MetadataController.getMetadataUI);
        this.router.post('/POST_VALIDATE_INSERT/', MetadataController.postValidarInsertar);
        this.router.post('/POST_INSERT_PAGOS_MANUAL', MetadataController.postValidarInsertarPagos);
        this.router.get('/GET_RESUMEN_VALIDACION/:tipomodulo/:id', MetadataController.getUIResumen);
        this.router.get('/GET_FILL_IMPORTES/:tipomodulo/:id', MetadataController.getUIFill);  
        this.router.post('/GET_GENERIC_SP', MetadataController.postGenericSP);   
    }
}

export default new MetadataRoutes().router;