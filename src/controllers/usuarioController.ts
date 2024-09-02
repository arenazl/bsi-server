import { Request, Response } from 'express';
import pool from '../database';
import multer from 'multer';
import path from 'path';
import * as mysql from "mysql2/promise";
import databaseHelper from '../databaseHelper';

class UsuarioController {
  

  public async login(req: Request, res: Response): Promise<any> {
    const nombre = req.body.nombre;
    const pass = req.body.password;
  
    const values = [nombre, pass];
    
    try {
      // Llama al procedimiento almacenado usando el método executeSpSelect
      const rows = await databaseHelper.executeSpSelect('sp_login_user', values);
  
      // Devuelve directamente el primer registro de los resultados, que contiene estado, descripcion y data
      return res.json(rows[0]);

    } catch (error: any) {
      console.error("Error en el login:", error.message || error);
      // En caso de error, devuelve una estructura con los campos estándar
      return res.status(500).json({
        estado: 0,
        descripcion: 'Error interno del servidor.',
        data: null,
      });

    }
  }
}

const usuarioController = new UsuarioController;
export default usuarioController;