"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploadController_1 = __importDefault(require("../controllers/uploadController"));
const filesController_1 = __importDefault(require("../controllers/filesController"));
class UploadRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        //this.router.post('/uploadtr', fileController.uploadTR);
        this.router.get('/responsetr/:id', filesController_1.default.getResponseTR);
        this.router.post('/dropbox', uploadController_1.default.dropbox);
        this.router.get('/download/:id', uploadController_1.default.downloadFile);
        this.router.get('/downloadtxtfile/:tipomodulo/:id', uploadController_1.default.downloadOutputFile);
    }
}
exports.default = new UploadRoutes().router;
