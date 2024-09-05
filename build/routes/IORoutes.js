"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const IOController_1 = __importDefault(require("../controllers/IOController"));
class IORoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        //this.router.post('/uploadtr', fileController.uploadTR);
        //this.router.get('/responsetr/:id', fileController.getResponseTR);
        this.router.post('/dropbox', IOController_1.default.dropbox);
        this.router.get('/downloadtxtfile/:tipomodulo/:id', IOController_1.default.downloadOutputFile);
    }
}
exports.default = new IORoutes().router;
