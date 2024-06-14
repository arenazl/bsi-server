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
        this.router.post('/importxls', fileController.ImportXls);
        this.router.get('/responsetr/:id', fileController.getResponseTR);
        this.router.get('/responsetrforcombo', fileController.getResponseTRForCombo);
        this.router.post('/dropbox', fileController.dropbox);
        this.router.get('/download/:id', fileController.downloadFile);
          
        //this.router.post('/file', gamesController.file);
        //this.router.post('/download', gamesController.download);
    }

}

export default new FileRoutes().router;
