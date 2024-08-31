import express, { Router } from 'express';
import fileController from '../controllers/filesController';

class ValidationRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {
        this.router.post('/POST_VALIDATE_INSERT/', fileController.postValidateInsert);
    }
}

export default new ValidationRoutes().router;