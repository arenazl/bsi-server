import express, { Router } from 'express';
import contractController from '../controllers/contractController';

class ContractRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {
        this.router.post('/contratosbotones', contractController.getContratosBotones);
        this.router.post('/obtenercontratobyid', contractController.getContratoById);
    }
}

export default new ContractRoutes().router;