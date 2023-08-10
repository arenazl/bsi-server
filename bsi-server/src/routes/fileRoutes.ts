import express, { Router } from 'express';
import fileController from '../controllers/filesController';

class FileRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {

        this.router.get('/', fileController.list);
        //this.router.post('/', gamesController.create);
        //this.router.put('/:id', gamesController.update);
        this.router.delete('/:id', fileController.delete);
        this.router.post('/upload', fileController.upload);
        this.router.post('/uploadtr', fileController.uploadTR);
        this.router.get('/responsetr/:id', fileController.getResponseTR);
        this.router.post('/dropbox', fileController.dropbox);
        this.router.post('/download', fileController.download);
          
        //this.router.post('/file', gamesController.file);
        //this.router.post('/download', gamesController.download);
    }

}

export default new FileRoutes().router;
