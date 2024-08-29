import express, { Router } from 'express';
import fileController from '../controllers/filesController';

class FileRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {

        this.router.get('/files', fileController.list);
        this.router.delete('/:id', fileController.delete);

        this.router.post('/uploadtr', fileController.uploadTR);
        this.router.get('/responsetr/:id', fileController.getResponseTR);
 
        this.router.post('/dropbox', fileController.dropbox);
        this.router.get('/download/:id', fileController.downloadFile);
        this.router.get('/downloadtxtfile/:tipomodulo/:id', fileController.downloadOutputFile);
        this.router.post('/contratosbotones', fileController.getContratosBotones);

     
        this.router.post('/ObtenerContratoById', fileController.getContratoById);

        this.router.get('/GET_METADATA_UI/:tipomodulo/:tipometada/:contrato', fileController.getMetadataUI);

        this.router.post('/POST_VALIDATE_INSERT/', fileController.postValidateInsert);

        this.router.get('/GET_RESUMEN/:tipomodulo/:id', fileController.getResumen);

        this.router.get('/GET_FILL/:tipomodulo/:id', fileController.getFill);
        
        this.router.get('/LIST_FOR_COMBO/:tipomodulo', fileController.getListForCombo);

        this.router.get('/getUsers', fileController.getUsers);
        this.router.post('/createUser', fileController.createUser);
        this.router.put('/updateUser', fileController.updateUser);
        this.router.delete('/deleteUser/:id', fileController.deleteUser);

        //this.router.post('/file', gamesController.file);
        //this.router.post('/download', gamesController.download);
    }

}

export default new FileRoutes().router;
