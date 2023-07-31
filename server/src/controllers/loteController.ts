import { Request, Response } from 'express';
import pool from '../database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';


class LoteController {

    public async list(req: Request, res: Response): Promise<void> {

        const id_barrio = req.body.id_barrio
        const estado = req.body.estado

        console.log(id_barrio);
        console.log(estado);
    
        let lotes : any;
        let query = '';

        
        if(estado == 0 || estado == 1)
        {
            query = 'select * from lotes where id_barrio = ' + id_barrio + ' and estado =  ' + estado;
        } 
        else
        {
            query = 'select * from Lotes where id_barrio = 2';
        }

        if(query !== ''){

            console.log(query);
            lotes = await pool.query(query); 
        }

        res.json(lotes);

    }
   
    public async update(req: Request, res: Response): Promise<void> {

        const { id } = req.params;
        const oldLote = req.body;

        /*
        estado: 1, 
        id: '3', 
        id_barrio: 2, 
        obervaciones: 'look'*/

        let sql = 'UPDATE lotes set estado = ' +  req.body.estado  + ' WHERE id_barrio = ' + req.body.id_barrio + ' and id = ' + req.body.id;

        console.log(sql);

        await pool.query(sql);

        res.json({ message: "The lote was Updated" });
    }

    public async provincias(req: Request, res: Response): Promise<void> {

        let provincias : any;
        let query = '';

        query = 'SELECT * from PROVINCIAS';
     
        if(query !== ''){

            console.log(query);
            provincias = await pool.query(query); 
        }

        res.json(provincias);

    } 

    public async localidades(req: Request, res: Response): Promise<void> {

        const { id } = req.params;
  
        let localidades : any;
        let query = '';

        query = 'SELECT * from LOCALIDADES where id_provincia = ' + id;
     
        if(query !== ''){

            console.log(query);
            localidades = await pool.query(query); 
        }

        res.json(localidades);

    }

}

const loteController = new LoteController;
export default loteController;