import { Request, Response } from 'express';
import pool from '../database';
import multer from 'multer';
import path from 'path';

class UsuarioController {


    public async login(req: Request, res: Response): Promise<any> {

        console.log(req.body);

        let nombre = req.body.nombre;
        let pass = req.body.password;
        let id_barrio = req.body.id_barrio;
        
        let q = 'SELECT u.id, u.nombre, g.descripcion grupo, id_grupo, id_barrio \
                FROM Usuario u \
                LEFT JOIN Grupo g on u.id_grupo = g.id \
                where u.nombre =' + "'" + nombre + "'";

        console.log(q);

        const usuario = await pool.query(q);
        
        console.log(usuario.length);
        if (usuario.length > 0) {
            return res.json(usuario[0]);
        }
    }  
}

const usuarioController = new UsuarioController;
export default usuarioController;