import { Router } from 'express';
import { openaiController } from '../controllers/openaiController';

class OpenAIRoutes {

    public router: Router = Router();

    constructor() {
        this.config();
    }

    config(): void { 
        this.router.post('/message', openaiController.sendMessage);
        this.router.get('/webhook', openaiController.webhookVerification);
    }
    
}

const openaiRoutes = new OpenAIRoutes();
export default openaiRoutes.router;