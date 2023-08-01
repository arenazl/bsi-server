import { Request, Response } from 'express';
import pool from '../database';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { Solicitud } from '../models/model';
import keys from '../keys';

import mysql from 'mysql';

class LegajoController {


    public async getSP(req: Request, res: Response): Promise<void> {
   
        let connection = mysql.createConnection(keys.database);

        
        let sql = `CALL getItems(?, ?)`;
        
        connection.query(sql, ["2", "3"], (error:any, results: any, fields:any) => {
          if (error) {
            return console.error(error.message);
          }
          console.log(results[0]);
        });
    }

    public async list(req: Request, res: Response): Promise<void> {

    try {

        const tg = req.body.tg

        const grupo =req.body.grupo
        const barrio =req.body.id_barrio

        const fecha_start_firma =req.body.fecha_start_firma
        const fecha_end_firma =req.body.fecha_end_firma

        const fecha_start_seña =req.body.fecha_start_seña
        const fecha_end_seña =req.body.fecha_end_seña

        const id_agenda =req.body.id_agenda
        
        console.log('cond1= ' + tg);
        console.log('grupo= ' + grupo);
        console.log('barrio= ' + barrio);
        console.log('fecha_start_firma= ' + fecha_start_firma);
        console.log('fecha_end_firma= ' + fecha_end_firma);
        console.log('fecha_start_seña= ' + fecha_start_seña);
        console.log('fecha_end_seña= ' + fecha_end_seña);
    
        let games : any;
        let query = '';

        if(tg == 'Elija un estado') {
            res.json(games);
            return;
        }
        
        //query inicia
        query =     'SELECT * FROM SOLICITUDES';

        let initStr=' WHERE '
        let whereStr='';
        let GrpStr='';
        let orderStr = ' order by fecha_firma';

        if(grupo > 0)
        {
            GrpStr += ' id_grupo = '+  grupo + ' and ';  
            GrpStr += ' id_barrio = ' + barrio + ' and '; 
        } else {


            GrpStr += 'id_barrio = ' + barrio + ' and ';

        }
             
         //iniciadas
        if(tg == 1)  
        {
            whereStr += "( id_estado = 1 )";          
        }

        //documentacion
        if(tg == 2) 
        {
            if(whereStr == '') 
            {
                whereStr += "(id_estado = 5)";          
            }
        }

        //rechazadas
        if(tg == 3) 
        {
            if(whereStr == '') 
            {
                whereStr += "( id_estado = 5 and fecha_firma is null )";       
            }     
        }
        
        if(tg == 4) 
        {
            if(whereStr == '') 
            {
                whereStr += "( id_estado = 5 and fecha_firma is not null )";          
            }   
        }

        //finalizadas
        if(tg == 5) 
        {
            if(whereStr == '') 
            {
                whereStr += "( id_estado = 6 )";          
            } 
        }

        //rechazadas
        if(tg == 6) 
        {
            if(whereStr == '') 
            {
                whereStr += "( id_estado = 3 )";               
            }
        }

        //con firma y pagado
        if(tg == 8) 
        {
            if(whereStr == '') 
            {
                whereStr += "( id_estado = 5 and fecha_firma is not null and pago_completo = true )";  
            }             
        }       
        
        let queryAll = ''

        //todos
        if(tg == 7) 
        {
            queryAll += "SELECT * FROM (SELECT * FROM solicitudes ORDER BY id DESC LIMIT 1000) AS sub ORDER BY id ASC;";               
        }

        //documentcion = pendientes + agenda
        if(tg==2 && id_agenda != 0)
        {
            if(grupo > 0)
            {
                whereStr += "and ( fecha_firma is not null and id_agenda = " + id_agenda + " ) or (id_estado = 5 and fecha_firma is null and id_grupo = " + grupo + " and id_barrio = " + barrio + ")" ; 
            } else
            {
                whereStr += "and ( fecha_firma is not null and id_agenda = " + id_agenda + " ) or (id_estado = 5 and fecha_firma is null and id_barrio = " + barrio + ")";   
            }           
        }
        else
        {           
            if(fecha_start_firma)
            {
    
                //fecha firma 2=Documentacion 3=Sin Turno 1=Ingresadas
                if(fecha_start_firma == fecha_end_firma && tg !=2 && tg !=3 && tg !=1) 
                {
                    whereStr += "and ( Date(fecha_firma) = Date('" + fecha_start_firma + "') )";                
                }
                //fecha firma 2=Documentacion 3=Sin Turno 1=Ingresadas
                if(fecha_start_firma != fecha_end_firma && tg !=2 && tg !=3 && tg !=1) 
                {
                    whereStr += "and Date(fecha_firma) >= Date('" + fecha_start_firma + "') and Date(fecha_firma) <= Date('" + fecha_end_firma + "'  )";                
                }
            }   
            
            if(fecha_start_seña)
            {
                //fecha seña
                if(fecha_start_seña == fecha_end_seña) 
                {
                    whereStr += "and ( Date(timestamp) = Date('" + fecha_start_seña + "') )";                
                }  
            
                if(fecha_start_seña != fecha_end_seña) 
                {
                    whereStr += "and Date(timestamp) >= Date('" + fecha_start_seña + "') and Date(timestamp) <= Date('" + fecha_end_seña + "'  )";                
                }
            }
        }

        if(queryAll == '')
        {
            console.log(query + initStr + GrpStr + whereStr + orderStr);
            games = await pool.query( query + initStr + GrpStr  + whereStr + orderStr);     
        }else
        {
            console.log(queryAll);
            games = await pool.query( queryAll );     
        }


        res.json(games);

    } catch (error) {}

    }


    public async ventas(req: Request, res: Response): Promise<void> {

        const { id_barrio } = req.params;
        console.log(id_barrio); 
    
        let games : any;

        //query inicial
        let query = 'SELECT id_grupo, g.descripcion, COUNT(*) total FROM solicitudes s\
        inner join grupos g on s.id_grupo = g.id\
        GROUP BY id_grupo\
        order by  COUNT(*) desc';

        if(query !== ''){
            console.log(query);
            games = await pool.query(query);
       
        }

        res.json(games);
    }

    public async getOne(req: Request, res: Response): Promise<any> {

        const { id } = req.params;
        const games = await pool.query('SELECT * FROM solicitudes WHERE id = ?', [id]);
        console.log(games.length);
        
        if (games.length > 0) {
            return res.json(games[0]);
        }
        res.status(404).json({ text: "no existe la solicitud" });
    }

    public async create(req: Request, res: Response): Promise<void> {

        const result = pool.query('INSERT INTO solicitudes set ?', [req.body]);  

        try{
            console.log('Sending Email');
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'arenazl@gmail.com',
                    pass: 'vxmgkblhzauuapqh'   
                }
                });
        
                var mailOptions = {
                from: 'arenazl@gmail.com',
                to: 'arenazl@gmail.com; Proyectos.don.luisk41@gmail.com;tatiibustos@hotmail.com',
                subject:' Nueva venta a nombre de: ' + req.body.denominacion + ' ingreso al sistema!',
                html:   ' <h5>Se vendio el Lote ' + req.body.id_lote + 
                        ' !! </h5> <h5> Barrio: ' + req.body.id_barrio +  
                        ' </h5>  <h5> Comprador: ' + req.body.denominacion +  
                        ' </h5> <h5>Dni: ' + req.body.dni +  
                        ' </h5> <h5>Precio de venta ' + req.body.lote_total +  
                        ' </h5> <h5>Seña: ' + req.body.refuerzo_total +  
                        ' </h5> <h5>Grupo: ' + req.body.grupo +  
                        ' </h5> </h5> <p>Ingrese al sistema para verificar los datos</p> <p><a href="https://sisbarrios.herokuapp.com"> Ingrese a SIS-Barrios </a></p>'
                };
        
                transporter.sendMail(mailOptions, function(error:any, info:any){
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
                });
        } catch (ex) {
            console.log(ex)
        }
        
        res.json({ message: 'Solicitud Grabada' });
    }

    public async refuerzo(req: Request, res: Response): Promise<void> {

        let id_solicitud = req.body.id_solicitud;
        let id_barrio = req.body.id_barrio;
        let monto = req.body.monto;

        console.log(id_solicitud)
        console.log(id_barrio)
        console.log(monto)
        let nota = "'" + req.body.nota + "'";

        let sql = 'UPDATE solicitudes set refuerzo_total = ' +  monto +  ', observaciones_s = ' + nota + ' WHERE id_barrio = ' + id_barrio + ' and id = ' + id_solicitud;

        console.log(sql);

        await pool.query(sql);

        res.json({ message: 'Refuerzo Grabado' });

    }

    public async cuota(req: Request, res: Response): Promise<void> {

        let id_solicitud = req.body.id_solicitud;
        let id_barrio = req.body.id_barrio;
        let monto = req.body.monto;
        let pago_completo = req.body.pago_completo;
        let nota = "'" + req.body.nota + "'";

        console.log(id_solicitud)
        console.log(id_barrio)
        console.log(monto)
        console.log(pago_completo)
        console.log(nota)

        let sql = 'UPDATE   SOLICITUDES set pago_total = ' +  monto + ', pago_completo = ' + pago_completo +  ', observaciones_p = ' + nota + ' WHERE id_barrio = ' + id_barrio +  ' and id = ' + id_solicitud;

        console.log(sql);

        await pool.query(sql);

        res.json({ message: 'Cuota Grabado' });

    }

    public async finCuota(req: Request, res: Response): Promise<void> {

        let id_solicitud = req.body.id_solicitud;
        let id_barrio = req.body.id_barrio;
        let tipo = req.body.tipo;

        console.log(id_solicitud)
        console.log(id_barrio)
        console.log(tipo)

        let sql="";

        if(tipo == 1){
             sql = 'UPDATE solicitudes set finRefuerzos = 1 WHERE id_barrio = ' + id_barrio + ' and id = ' + id_solicitud;
        } else
        {
            sql = 'UPDATE solicitudes set finCuotas = 1 WHERE id_barrio = ' + id_barrio + ' and id = ' + id_solicitud;
        }

        console.log(sql)

        await pool.query(sql);

        res.json({ message: 'Fin pago grabado' });

    }

    public async update(req: Request, res: Response): Promise<void> {

        const { id } = req.params;
        const oldGame = req.body;

        console.log('UPDATE solicitudes set ? WHERE id = ?', [req.body, id]);

        await pool.query('UPDATE solicitudes set ? WHERE id = ?', [req.body, id]);

        res.json({ message: "Solicitud Actualizada" });
    }

    public async delete(req: Request, res: Response): Promise<void> {

        const { id } = req.params;

        console.log("voy a borrar este: "  + id);
        
        await pool.query('DELETE FROM solicitudes WHERE id = ?', id);

        res.json({ message: "The game was deleted" });
    }

}

const legajoController = new LegajoController;
export default legajoController;