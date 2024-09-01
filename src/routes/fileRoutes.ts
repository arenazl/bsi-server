import express, { Router } from 'express';
import fileController from '../controllers/filesController';

class FileRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {
        
        //this.router.get('/files', fileController.creatser);
        //this.router.delete('/:id', fileController.delete);
    }
}

export default new FileRoutes().router;
