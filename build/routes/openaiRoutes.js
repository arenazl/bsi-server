"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openaiController_1 = require("../controllers/openaiController");
class OpenAIRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.config();
    }
    config() {
        this.router.get('/webhook', openaiController_1.openaiController.verifyWebhook);
        this.router.post('/webhook', openaiController_1.openaiController.handleWebhook);
    }
}
const openaiRoutes = new OpenAIRoutes();
exports.default = openaiRoutes.router;
