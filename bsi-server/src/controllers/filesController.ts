import { Request, Response } from 'express';
import pool from '../database';
import multer from 'multer';
import fileType from 'file-type';
import readXlsxFile from 'read-excel-file/node';
import path from 'path';
import * as fs from 'fs';
import * as mysql from 'mysql2/promise';
import keys from './../keys';
import S3 from 'aws-sdk/clients/s3';
import { transInmediataInfo } from './../models/model';
import {transInmediataDato } from './../models/model';

import nodemailer from 'nodemailer';
import { ImportExport } from 'aws-sdk';
import legajoController from './legajoController';
import { Pool } from 'promise-mysql';

    class FilesController 
    {

        public async list(req: Request, res: Response): Promise<any> {

            var serverFiles = [];
            const dir = path.join(__dirname,'../uploads');
            const files = fs.readdirSync(dir)

            for (const file of files) {
                serverFiles.push(file)
            }   
            
        return res.json(serverFiles);
        }

        public async delete(req: Request, res: Response): Promise<void> {

        const { id } = req.params;

        await pool.query('DELETE  FROM games WHERE id = ?', [id]);

        res.json({ message: "The game was deleted" });
        }

        public async upload(req: Request, res: Response, next: any): Promise<void> {

        console.log("upload start")

            var store = multer.diskStorage({
            destination:function(req:any,file,cb){     
                cb(null, './uploads');

            },
            filename:function(req,file,cb){
                cb(null, Date.now() + '-' + file.originalname);
            }
        });

        var upload = multer({storage:store}).single('file');

        upload(req,res,async function(err)
        {

            console.log(req.file?.path);
            console.log(req.file?.originalname);
            console.log(req.file?.filename);

            let bucketName = keys.AWS.bucketName;
            let region = keys.AWS.bucketRegion;
            let accessKeyId = keys.AWS.accesKey;
            let secretAccessKey = keys.AWS.secretKey;

            const s3 = new S3({ 
                region,
                accessKeyId, 
                secretAccessKey
            })

            //@ts-ignore
            const fileStream = fs.createReadStream(req.file.path)

            const uploadParams = {
                Bucket: bucketName,
                Body: fileStream,
                //@ts-ignore
                Key: req.file.filename
            }
            
            try {
            const data = await s3.upload(uploadParams).promise();
            console.log(data);

            res.json({ uploadname: req.file.filename });

            } catch (err) {
            throw err;
            }
            
        });
        }

        public async uploadTR(req: Request, res: Response, next: any): Promise<void> {

            var store = multer.diskStorage({
            destination:function(req:any,file,cb){     
                cb(null, './uploads');

            },
            filename:function(req,file,cb){
                cb(null, Date.now()+ '-' + file.originalname);
            }
        });

        var upload = multer({storage:store}).single('file');

        upload(req,res,async function(err){

            console.log(req.file?.path);
            console.log(req.file?.originalname);
            console.log(req.file?.filename);

            // Read the contents of the txt file
            const content: string = fs.readFileSync(req.file.path, 'utf-8');
            
            // Separate the content into rows based on newline
            let rows: string[] = content.split('\n');
    
            console.log(rows);

            try {
            
                //PARSEA CABECERA
                let info = parsearInfoArchivoTR(rows[0], rows[rows.length - 2]);     
            
                const dataFromUI  = req.file?.originalname.split('-');
            
                // CONCEPTO /MOTIVO
                const user = dataFromUI[0];
                const concepto = dataFromUI[2];
                const motivo = dataFromUI[1];
            
                try 
                {
                    let connection = await pool.getConnection();

                    //LLAMAMOS AL SP DE DETALLE
                    console.log('Llamamos al sp');            
                    const values = [info.tipoDeRegistro, info.empresaNombre, info.infoDiscrecional, info.empresaCUIT.toString(), info.prestacion, info.fechaEmision.toString(), info.horaGeneracion.toString() + '00', info.fechaAcreditacion.toString(), info.bloqueDosCbuEmpresa, info.moneda, info.rotuloArchivo, info.tipoRemuneracion, info.importeTotalFinal, concepto];
                    const outParams = ["id", "created_at"];



                    const outParamValues = await executeSpInsert(connection, "Insert_Transferencia_Inmediata_Info", values, outParams);
                    const id = outParamValues['@id'];
                    const created_at = outParamValues['@created_at'];

                    console.log('Termina el SP de Info. ID value: ' + id);
                    console.log('Comienza el SP de Dato:');

                    //PARSEA DETALLE
                    let transInmediataDatos = parsearDatosArchivoTR(rows, id);

                    
                    let contador = 0;

                    for (let entity of transInmediataDatos) {      


                        const values = [
                            entity.tipoDeRegistro,
                            entity.bloqueCBU1,
                            entity.bloqueCBU2,
                            entity.importe,
                            entity.refUnivoca,
                            entity.beneficiarioDoc,
                            entity.beneficiarioApeNombre,
                            entity.filler,
                            entity.marca,
                            entity.transInmediataInfoId
                        ];                                                 

                        const outParams = ['id', 'created_at'];

                        //DESCOMENTAR PARA EJECUTAR
                        const outParamValues = await executeSpInsert(connection, "insert_transferencia_inmediata_dato", values, outParams);   
                        
                        console.log('outParamValues: ' + outParamValues);
                        
                        
                        //LEO EL RETORNO SI ES QUE HAY (ES UN ARRAY) 
                    }            


                    //Armo el archivoTR
                    escribirArchivoTR(transInmediataDatos, info, concepto, motivo);


                    //CAMBIAR LAS CONSULTAS POR SP EJECUTADOS
                    const infoScreen = getPantallaTransferenciaInfoById(id, connection);
                    console.log('---INFO---');
                    console.log(infoScreen);
                    const dataScreen = getPantallaTransferenciaDatoById(id, connection);
                    console.log('---DATA---');
                    console.log(dataScreen);

                    //DEVUELVO AL FRONT EL ID GENERADO PARA MOSTRAR LOS RESULTADOS (ESTA PANTALLA VA A LLAMAR A getResponseTR ['files/responsetr/:id] )
                    res.json({ id: id });

                } 
                catch (error) 
                {
                console.log(error);
                }             
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: 'An error occurred while updating the data.' });
            }      

        });

        }

        public async getResponseTR(req: Request, res: Response): Promise<any> {

            const { id } = req.params;

            //HACER SP CON RESULTADO CON CLAVE DE ID
 
        }

        public async uploadS3(file:any) {

        let bucketName = keys.AWS.bucketName;
        let region = keys.AWS.bucketRegion;
        let accessKeyId = keys.AWS.accesKey;
        let secretAccessKey = keys.AWS.secretKey;

        const s3 = new S3({ 
            region,
            accessKeyId, 
            secretAccessKey
        })

        const fileStream = fs.createReadStream(file.path)

        const uploadParams = {
            Bucket: bucketName,
            Body: fileStream,
            Key: file.filename
        }

        return s3.upload(uploadParams).promise()

        }

        public async dropbox(req: Request, res: Response, next: any): Promise<void> {

        let multer1 = multer({dest:"./uploads"});

        let upload = multer1.single('file')

        upload(req,res, function(err){
            if(err){
                return res.status(501).json({error:err});
            } else {
                return res.json({originalname:req.file?.originalname, uploadname:req.file?.filename});
            }
        });
        }

        public async download(req: Request, res: Response, next: any): Promise<void> {

        let bucketName = keys.AWS.bucketName;
        let region = keys.AWS.bucketRegion;
        let accessKeyId = keys.AWS.accesKey;
        let secretAccessKey = keys.AWS.secretKey;

        const s3 = new S3({ 
            region,
            accessKeyId, 
            secretAccessKey
        })

        console.log(s3);

        const downloadParams = {
            Bucket: bucketName,
            Key: req.body.filename
        }

        console.log(downloadParams);

        try {
                const data= await s3.getObject(downloadParams).createReadStream();
                data.pipe(res);
            } 
            catch (err) 
            {
                throw err;                  
            }
        }

        public async sendMail(req: Request, res: Response, next: any): Promise<void> {

        let bucketName = keys.AWS.bucketName;

        try{
            console.log('Sending Email');
            
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'arenazl@gmail.com;Proyectos.don.luisk41@gmail.com',
                    pass: 'vxmgkblhzauuapqh'   
                }
                });

                var mailOptions = {
                from: 'arenazl@gmail.com',
                to: 'arenazl@gmail.com',
                subject: 'Nueva venta a nombre de: ' + req.body.denominacion + ' ingreso al sistema!',
                html: '<h5>Se vendio el Lote ' + req.body.id_lote + '!! </h5> <h5> Comprador: ' + req.body.denominacion +  '</h5> <h5>Dni: ' + req.body.dni +  ' </h5>  <h5>Precio de venta ' + req.body.lote_total +  ' </h5>  <h5>Seña: ' + req.body.refuerzo_total +  '</h5> <p>Ingrese al sistema para verificar los datos</p> <p><a href="https://sisbarrios.herokuapp.com"> Ingrese a SIS-Barrios </a></p>'
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

        }
    }

    async function executeSpInsert(connection: mysql.Connection, spName: string, values: (string | number)[], outParams: string[]) 
    {    
        try 
        {   
            console.log('executeSpInsert')
            
            let placeholders = values.map(() => '?').join(',');
            let sql = `CALL ${spName}(${placeholders});`;

            console.log('placeholders')
            console.log(placeholders)
            console.log('sql')
            console.log(sql)
    
            const statement = await connection.prepare(sql);

            console.log('values')
            console.log(values);
            await statement.execute(values);
            statement.close();
            await connection.unprepare(sql);
            
    
            if (outParams.length > 0 ) {

                let outPlaceholders = outParams.map(param => `@${param}`).join(',');

                console.log('outPlaceholders')
                console.log(outPlaceholders)

                const [outResults]: any = await connection.query(`SELECT ${outPlaceholders};`);
            
                
                return outResults[0];
            }
            
    
            return {};
        } 
        catch (error:any) 
        {
            throw new Error(`Error al ejecutar el stored procedure: ${error.message}`);
        }       
     
    }

    function escribirArchivoTR(rows: Array<transInmediataDato>, info: transInmediataInfo, concepto:string, motivo:string) : boolean {


    const file = fs.openSync('./uploads/output.txt', 'w');

            // console.log(transInmediataDatos);

            for (const value of rows) {

                //CBU
                let CBU;
                CBU = value.bloqueCBU1.toString() + value.bloqueCBU2.toString();

                //IMPORTE
                let IMPORTE = value.importe.toString();
                IMPORTE = padStringFromLeft(IMPORTE, (12 - IMPORTE.length), '0')

                //CONCEPTO
                let CONCEPTO = concepto;
                CONCEPTO = padStringFromRight(concepto, (50 - concepto.length), ' ');

                //REFERENCIA
                let REFERENCIA = ' ';
                REFERENCIA = padStringFromRight(REFERENCIA, (12 - REFERENCIA.length), ' ');

                //EMAIL
                let EMAIL = ' ';
                EMAIL = padStringFromRight(EMAIL, (50 - EMAIL.length), ' ');

                //RELLENO
                let RELLENO = '';
                RELLENO = padStringFromRight(RELLENO, (124 - RELLENO.length), ' ');
                


            fs.writeSync(file,CBU + IMPORTE + CONCEPTO + motivo + REFERENCIA + EMAIL + RELLENO +'\n');

            }

            //DATOS FINALES

            //CANT REGISTROS FINALES
            let CANT_REGISTROS = (info.cantidadRegistroFinal + 1).toString();
            CANT_REGISTROS = padStringFromLeft(CANT_REGISTROS, (5 - CANT_REGISTROS.length), '0');

            console.log('Cant Reegistros: ' + info.cantidadRegistroFinal)
            console.log('Escribe: ' + CANT_REGISTROS)

            //IMPORTE TOTAL
            let IMPORTE_TOTAL = info.importeTotalFinal.toString();
            IMPORTE_TOTAL = padStringFromLeft(IMPORTE_TOTAL, (17 - IMPORTE_TOTAL.length), '0');

            //RELLENO
            let RELLENO = '';
            RELLENO = padStringFromRight(RELLENO, (251 - RELLENO.length), ' ');


            fs.writeSync(file, CANT_REGISTROS + IMPORTE_TOTAL  + RELLENO +'\n');




            fs.closeSync(file);

            return true;
    }

    function parsearInfoArchivoTR(infoRowC:string, infoRowF:string) : transInmediataInfo {

        let info = new transInmediataInfo();

        //CABECERA
        info.tipoDeRegistro = Number(infoRowC.substring(0, 1).trim());
        info.empresaNombre = infoRowC.substring(1, 17);
        info.infoDiscrecional = infoRowC.substring(17, 37);
        info.empresaCUIT = Number(infoRowC.substring(37, 48).trim());
        info.prestacion = infoRowC.substring(48, 58);
        info.fechaEmision = Number(infoRowC.substring(58, 64).trim());
        info.horaGeneracion = Number(infoRowC.substring(64, 68).trim());
        info.fechaAcreditacion = Number(infoRowC.substring(68, 74).trim());
        info.bloqueDosCbuEmpresa = Number(infoRowC.substring(74, 88).trim());
        info.moneda = Number(infoRowC.substring(88, 89).trim());
        info.rotuloArchivo = infoRowC.substring(89, 97);
        info.tipoRemuneracion = Number(infoRowC.substring(97, 98).trim());
        info.filler = infoRowC.substring(98, 99);
        info.marca = Number(infoRowC.substring(99, 100).trim());


        //PARTE FINAL
        info.tipoRegistroFinal = Number(infoRowF.substring(0, 1).trim());
        info.cantidadRegistroFinal =  Number(infoRowF.substring(1, 7).trim());
        info.importeTotalFinal = Number(infoRowF.substring(7, 18).trim());
        info.fillerFinal = infoRowF.substring(18, 99);
        info.marcaFinal = Number(infoRowF.substring(99, 100).trim());;

        return info;

    }

    function parsearDatosArchivoTR(rows:string[], transfeInfoId:number) : Array<transInmediataDato> {

        console.log('transfeInfoId: ' + transfeInfoId)

    let datosRows = rows.slice(1, rows.length - 2);
    let transInmediataDatos = new Array<transInmediataDato>();


    for (const row of datosRows) {

            
        let datoTran = new transInmediataDato()

        // Parse fields according to fixed width format
        datoTran.transInmediataInfoId = transfeInfoId;
        datoTran.tipoDeRegistro = Number(row.substring(0, 1).trim());
        datoTran.bloqueCBU1 = row.substring(1, 9).trim();
        datoTran.bloqueCBU2 = row.substring(9, 23).trim();
        datoTran.importe = Number(row.substring(23, 33).trim());
        datoTran.refUnivoca = row.substring(33, 48);
        datoTran.beneficiarioDoc = row.substring(48, 59).trim();
        datoTran.beneficiarioApeNombre = row.substring(59, 81).trim();
        datoTran.filler = row.substring(81, 99).trim();
        datoTran.marca = Number(row.substring(99, 100).trim());

        transInmediataDatos.push(datoTran);
        
        //console.log(datoTran);

        }    

    return transInmediataDatos;

    }

    async function getPantallaTransferenciaDatoById(transferenciaInfoId : number, connection : mysql.PoolConnection) {

        
        const queryAll = "SELECT tranDato.id as orden,  concat(tranDato.bloqueCBU1, tranDato.bloqueCBU2) as CBU, tranDato.importe as Importe, tranDato.beneficiarioApeNombre as Referencia FROM heroku_55504b2b2691e53.transferencias_inmediatas_dato AS tranDato where tranDato.transferenciaInmediataInfoId = " + transferenciaInfoId
        const datos = await pool.query( queryAll );     

        console.log(datos);
        
    
        return datos;
    }

    async function getPantallaTransferenciaInfoById(transferenciaInfoId : number, connection : mysql.PoolConnection) {

        
        const queryAll = "    SELECT tranInfo.fecha_emision as Fecha, COUNT(tranDato.id) as CantTran, tranInfo.importeTotal as ImporteTotal, tranInfo.bloque_cbu as cbuOrigen, tranInfo.concepto as concepto FROM heroku_55504b2b2691e53.transferencias_inmediatas AS tranInfo INNER JOIN heroku_55504b2b2691e53.transferencias_inmediatas_dato AS tranDato ON tranInfo.id = tranDato.transferenciaInmediataInfoId where tranInfo.id =" + transferenciaInfoId
        const info = await pool.query( queryAll );     

        console.log(info);
        
    
        return info;
    }

  function padStringFromLeft(str:string, length:number, padChar = ' ') {
    let paddedStr = padChar.repeat(length);
    return paddedStr + str;
  }
  function padStringFromRight(str:string, length:number, padChar = ' ') {
    let paddedStr = padChar.repeat(length);
    return str + paddedStr;
  }


const fileController = new FilesController;
export default fileController;