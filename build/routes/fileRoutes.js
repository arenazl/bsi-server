"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const filesController_1 = __importDefault(require("../controllers/filesController"));
class FileRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        this.router.get('/files', filesController_1.default.list);
        //this.router.post('/', gamesController.create);
        //this.router.put('/:id', gamesController.update);
        this.router.delete('/:id', filesController_1.default.delete);
        this.router.post('/uploadtr', filesController_1.default.uploadTR);
        this.router.post('/importxlspagos', filesController_1.default.ImportXlsPagos);
        this.router.post('/importxlsaltas', filesController_1.default.ImportXlsAltas);
        this.router.get('/responsetr/:id', filesController_1.default.getResponseTR);
        this.router.get('/pagoslist/:id', filesController_1.default.getResponsePagos);
        this.router.get('/responsetrforcombo', filesController_1.default.getResponseTRForCombo);
        this.router.get('/responsepagosforcombo', filesController_1.default.getResponsePagosForCombo);
        this.router.post('/dropbox', filesController_1.default.dropbox);
        this.router.get('/download/:id', filesController_1.default.downloadFile);
        this.router.get('/downloadtxtfile/:tipomodulo/:id', filesController_1.default.downloadOutputFile);
        this.router.post('/contratosbotones', filesController_1.default.getContratosBotones);
        this.router.post('/ObtenerContratoById', filesController_1.default.getContratoById);
        //this.router.post('/file', gamesController.file);
        //this.router.post('/download', gamesController.download);
    }
}
exports.default = new FileRoutes().router;
