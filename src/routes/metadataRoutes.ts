import express, { Router } from 'express';
import fileController from '../controllers/filesController';
import MetadataController from '../controllers/metadataController';
import asyncHandler from '../utils/asyncHandler';

class MetadataRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() 
    {
        this.router.get('/GET_METADATA_UI/:tipomodulo/:tipometada/:contrato', asyncHandler(MetadataController.getMetadataUI));
        this.router.post('/POST_VALIDATE_INSERT/', asyncHandler(MetadataController.postValidarInsertar));
        this.router.post('/POST_INSERT_PAGOS_MANUAL', asyncHandler(MetadataController.postValidarInsertarPagos));
        this.router.post('/POST_INSERT_NOMINA_MANUAL', asyncHandler(MetadataController.postValidarInsertarNomina));
        this.router.post('/POST_INSERT_GENERIC_SP', asyncHandler(MetadataController.postInsertGenericSP));  
        this.router.post('/POST_SELECT_GENERIC_SP', asyncHandler(MetadataController.postSelectGenericSP)); 
        this.router.post('/POST_INSERTAR_NOMINA_DESDE_IMPORT', asyncHandler(MetadataController.postNominaDesdeImport)); 
        this.router.get('//:tipomodulo/:user/:contrato/:organismo', asyncHandler(MetadataController.getUIResumen)); 
    }
}

export default new MetadataRoutes().router;
