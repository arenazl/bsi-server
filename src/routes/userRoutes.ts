import express, { Router } from 'express';
import fileController from '../controllers/filesController';

class UserRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {
        this.router.get('/getUsers', fileController.getUsers);
        this.router.post('/createUser', fileController.createUser);
        this.router.put('/updateUser', fileController.updateUser);
        this.router.delete('/deleteUser/:id', fileController.deleteUser);
    }
}

export default new UserRoutes().router;