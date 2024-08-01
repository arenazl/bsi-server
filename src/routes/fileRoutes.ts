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
        this.router.get('/responsetr/:id', fileController.getResponseTR);
        this.router.get('/pagoslist/:id', fileController.getResponsePagos);
        this.router.get('/responsetrforcombo', fileController.getResponseTRForCombo);
        this.router.get('/responsepagosforcombo', fileController.getResponsePagosForCombo);
        this.router.post('/dropbox', fileController.dropbox);
        this.router.get('/download/:id', fileController.downloadFile);
        this.router.get('/downloadPago/:id', fileController.downloadPagoFile);
        this.router.post('/contratosbotones', fileController.getContratosBotones);
        this.router.post('/ObtenerContratoById', fileController.getContratoById);
        //this.router.post('/file', gamesController.file);
        //this.router.post('/download', gamesController.download);
    }

}

export default new FileRoutes().router;
