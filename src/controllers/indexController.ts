import { Request, Response } from 'express';
import DatabaseHelper from '../databaseHelper';

class IndexController {

    public index(req: Request, res: Response) {
        res.json({ text: 'BSI ONLINE' });
    }
}

export const indexController = new IndexController;