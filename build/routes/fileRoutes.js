"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
class FileRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        //this.router.get('/files', fileController.creatser);
        //this.router.delete('/:id', fileController.delete);
    }
}
exports.default = new FileRoutes().router;
