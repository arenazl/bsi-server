import express, { Router } from 'express';
import IOController from '../controllers/IOController';
import fileController from '../controllers/filesController';

class IORoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {
        //this.router.post('/uploadtr', fileController.uploadTR);
        //this.router.get('/responsetr/:id', fileController.getResponseTR);
        this.router.post('/dropbox', IOController.dropbox);
        this.router.get('/downloadtxtfile/:tipomodulo/:id', IOController.downloadOutputFile);
    }
}

export default new IORoutes().router;