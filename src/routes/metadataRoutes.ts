import express, { Router } from 'express';
import fileController from '../controllers/filesController';
import MetadataController from '../controllers/metadataController';

class MetadataRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() 
    {
        this.router.get('/GET_METADATA_UI/:tipomodulo/:tipometada/:contrato', MetadataController.getMetadataUI);
        this.router.post('/POST_VALIDATE_INSERT/', MetadataController.postValidarInsertar);
        this.router.post('/POST_INSERT_PAGOS_MANUAL', MetadataController.postValidarInsertarPagos);
        this.router.post('/POST_INSERT_NOMINA_MANUAL', MetadataController.postValidarInsertarNomina);
        this.router.post('/POST_INSERT_GENERIC_SP', MetadataController.postInsertGenericSP);  
        this.router.post('/POST_SELECT_GENERIC_SP', MetadataController.postSelectGenericSP); 
        this.router.post('/POST_INSERTAR_NOMINA_DESDE_IMPORT', MetadataController.postNominaDesdeImport); 
        this.router.get('//:tipomodulo/:user/:contrato/:organismo', MetadataController.getUIResumen); 
    }
}

export default new MetadataRoutes().router;