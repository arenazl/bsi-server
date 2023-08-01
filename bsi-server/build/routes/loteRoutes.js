"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const loteController_1 = __importDefault(require("../controllers/loteController"));
class LoteRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        this.router.post('/list', loteController_1.default.list);
        this.router.put('/:id', loteController_1.default.update);
        this.router.get('/provincias', loteController_1.default.provincias);
        this.router.get('/localidades/:id', loteController_1.default.localidades);
    }
}
exports.default = new LoteRoutes().router;
