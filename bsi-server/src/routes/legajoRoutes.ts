import express, { Router } from 'express';

import legajoController from '../controllers/legajoController';
import usuarioController from '../controllers/usuarioController';

class LegajoRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {
        this.router.get('/test', legajoController.test);
    }

}

export default new LegajoRoutes().router;

