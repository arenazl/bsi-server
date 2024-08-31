import express, { Router } from 'express';
import uploadController from '../controllers/uploadController';
import fileController from '../controllers/filesController';

class UploadRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {
        //this.router.post('/uploadtr', fileController.uploadTR);
        this.router.get('/responsetr/:id', fileController.getResponseTR);
        this.router.post('/dropbox', uploadController.dropbox);
        this.router.get('/download/:id', uploadController.downloadFile);
        this.router.get('/downloadtxtfile/:tipomodulo/:id', uploadController.downloadOutputFile);
    }
}

export default new UploadRoutes().router;