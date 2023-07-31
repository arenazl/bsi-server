import express, { Router } from 'express';
import loteController from '../controllers/loteController';


class LoteRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {
        this.router.post('/list', loteController.list);
        this.router.put('/:id', loteController.update);
        this.router.get('/provincias', loteController.provincias);
        this.router.get('/localidades/:id', loteController.localidades);
    }

}

export default new LoteRoutes().router;

