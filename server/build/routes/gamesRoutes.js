"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gamesController_1 = __importDefault(require("../controllers/gamesController"));
const usuariosController_1 = __importDefault(require("../controllers/usuariosController"));
class GameRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        this.router.get('/:rol', gamesController_1.default.list);
        this.router.get('/:id', gamesController_1.default.getOne);
        this.router.post('/', gamesController_1.default.create);
        this.router.put('/:id', gamesController_1.default.update);
        this.router.delete('/:id', gamesController_1.default.delete);
        this.router.post('/file', gamesController_1.default.file);
        this.router.post('/download', gamesController_1.default.download);
        this.router.post('/login', usuariosController_1.default.login);
        this.router.post('/controladores', usuariosController_1.default.login);
    }
}
exports.default = new GameRoutes().router;
