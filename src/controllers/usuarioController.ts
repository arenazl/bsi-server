import { Request, Response } from 'express';
import pool from '../database';
import multer from 'multer';
import path from 'path';
import * as mysql from "mysql2/promise";
import databaseHelper from '../databaseHelper';

class UsuarioController {
  

    public async login(req: Request, res: Response): Promise<any> {

        console.log(req.body);

        let nombre = req.body.nombre;
        let pass = req.body.password;

        const values = [nombre, pass];
        
        const rows = await databaseHelper.executeSpSelect('sp_login_user', values); 

        return res.json(rows[0][0])
    }  

  }

const usuarioController = new UsuarioController;
export default usuarioController;