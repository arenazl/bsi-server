import express, { Router } from 'express';
import fileController from '../controllers/filesController';

class FileRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {

        this.router.get('/files', fileController.list);
        //this.router.post('/', gamesController.create);
        //this.router.put('/:id', gamesController.update);
        this.router.delete('/:id', fileController.delete);
        this.router.post('/uploadtr', fileController.uploadTR);
        this.router.post('/importxlspagos', fileController.ImportXlsPagos);
        this.router.post('/importxlsaltas', fileController.ImportXlsAltas);
        this.router.post('/exportxlsaltas', fileController.ExportXlsAltas);
        this.router.get('/responsetr/:id', fileController.getResponseTR);
        this.router.get('/pagoslist/:id', fileController.getResponsePagos);
   
        this.router.get('/responsepagosforcombo', fileController.getResponsePagosForCombo);
        this.router.post('/dropbox', fileController.dropbox);
        this.router.get('/download/:id', fileController.downloadFile);
        this.router.get('/downloadtxtfile/:tipomodulo/:id', fileController.downloadOutputFile);
        this.router.post('/contratosbotones', fileController.getContratosBotones);
        this.router.post('/ObtenerContratoById', fileController.getContratoById);

        this.router.post('/CuentaValidarEntrada', fileController.CuentaValidarEntrada);
        this.router.post('/PagoValidarEntrada', fileController.PagoValidarEntrada);

        this.router.get('/CUENTA_OBTENER_RESUMEN/:id', fileController.CuentaObtenerResumen);
        this.router.get('/PAGO_OBTENER_RESUMEN/:id', fileController.PagoObtenerResumen);

        this.router.get('/GET_METADATA_UI/:tipomodulo/:tipometada', fileController.getMetadataUI);

        this.router.get('/LIST_FOR_COMBO/:tipomodulo', fileController.getListForCombo);

        //this.router.post('/file', gamesController.file);
        //this.router.post('/download', gamesController.download);
    }

}

export default new FileRoutes().router;
