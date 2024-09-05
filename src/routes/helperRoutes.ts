import express, { Router } from 'express';
import HelperController from '../controllers/helperController';

class HelperRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {

        this.router.post('/GET_CONTRATO_BY_ID', HelperController.getContratoById);
        this.router.get('/GET_LIST_FOR_COMBO/:tipomodulo', HelperController.getListForCombo);
    }
}

export default new HelperRoutes().router;