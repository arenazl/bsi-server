import { Router } from 'express';
import { openaiController } from '../controllers/openaiController';

class OpenAIRoutes {

    public router: Router = Router();

    constructor() {
        this.config();
    }

    config(): void { 

        this.router.get('/webhook', openaiController.verifyWebhook);
        
        this.router.post('/webhook', openaiController.handleWebhook);
    
    }
    
}

const openaiRoutes = new OpenAIRoutes();
export default openaiRoutes.router;