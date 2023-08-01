"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const legajoController_1 = __importDefault(require("../controllers/legajoController"));
const usuarioController_1 = __importDefault(require("../controllers/usuarioController"));
class LegajoRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        this.router.post('/list', legajoController_1.default.getSP);
        this.router.get('/ventas/:id_barrio', legajoController_1.default.ventas);
        this.router.get('/:id', legajoController_1.default.getOne);
        this.router.post('/', legajoController_1.default.create);
        this.router.post('/refuerzo', legajoController_1.default.refuerzo);
        this.router.post('/cuota', legajoController_1.default.cuota);
        this.router.post('/fincuota', legajoController_1.default.finCuota);
        this.router.put('/:id', legajoController_1.default.update);
        this.router.delete('/:id', legajoController_1.default.delete);
        this.router.post('/login', usuarioController_1.default.login);
    }
}
exports.default = new LegajoRoutes().router;
