import express, { Router } from 'express';
import fileController from '../controllers/filesController';
import userController from '../controllers/userController';

class UserRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {
        this.router.get('/getUsers', userController.getUsers);
        this.router.post('/createUser', userController.createUser);
        this.router.put('/updateUser', userController.updateUser);
        this.router.delete('/deleteUser/:id', userController.deleteUser);
        this.router.post('/login', userController.login);   
        this.router.post('/GET_GENERIC_SP', userController.postGenericSP);   
        
        
    }
}

export default new UserRoutes().router;