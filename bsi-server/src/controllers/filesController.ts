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

import nodemailer from 'nodemailer';

class FilesController {

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
            cb(null, Date.now()+'-'+file.originalname);
        }
    });

    var upload = multer({storage:store}).single('file');

    upload(req,res,async function(err){

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
          //@ts-ignore
        res.json({ uploadname: req.file.filename });
        } catch (err) {
        throw err;
        }
      
    });
}

public async upload2(req: Request, res: Response, next: any): Promise<void> {

    console.log("upload start")

       var store = multer.diskStorage({
        destination:function(req:any,file,cb){     
            cb(null, './uploads');

        },
        filename:function(req,file,cb){
            cb(null, Date.now()+'-'+file.originalname);
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
          

        rows.shift();
        rows.pop();

        console.log(rows);
  
        /*
        // Loop through each row and call the stored procedure
        try {

            for (const row of rows) {
            // Parse fields according to fixed width format
            const tipoRegistro = row.substring(0, 1);
            const nombreEmpresa = row.substring(1, 17);
            const infoDiscrecional = row.substring(17, 37);
            const cuitEmpresa = row.substring(37, 48);
            const prestacion = row.substring(48, 58);
            const fechaEmision = row.substring(58, 64);
            const horaGeneracion = row.substring(64, 68);
            const fechaAcreditacion = row.substring(68, 74);
            const bloqueCBU = row.substring(74, 88);
            const moneda = row.substring(88, 89);
            const rotuloArchivo = row.substring(89, 97);
            const tipoRemuneracion = row.substring(97, 98);
            const filler = row.substring(98, 99);
            const marca = row.substring(99, 100);
            
            // Call stored procedure (adjust as needed for your procedure)
            await pool.query('CALL YourStoredProcedure(?, ?, ?)', [tipoRegistro, nombreEmpresa, cuitEmpresa]);

            //generacion del arhivo salida
    
            }         
            res.status(200).json({ message: 'Data updated successfully.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'An error occurred while updating the data.' });
        }   
        */   

    });

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

const fileController = new FilesController;
export default fileController;