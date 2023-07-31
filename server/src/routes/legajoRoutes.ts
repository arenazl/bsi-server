import express, { Router } from 'express';

import legajoController from '../controllers/legajoController';
import usuarioController from '../controllers/usuarioController';

class LegajoRoutes {

    router: Router = Router();

    constructor() {
        this.config();
    }

    config() {
        this.router.post('/list', legajoController.getSP);
        this.router.get('/ventas/:id_barrio', legajoController.ventas);
        this.router.get('/:id', legajoController.getOne);
        this.router.post('/', legajoController.create);
        this.router.post('/refuerzo', legajoController.refuerzo);
        this.router.post('/cuota', legajoController.cuota);
        this.router.post('/fincuota', legajoController.finCuota);
        this.router.put('/:id', legajoController.update);
        this.router.delete('/:id', legajoController.delete);
        this.router.post('/login', usuarioController.login);

    }

}

export default new LegajoRoutes().router;

