import { Request, Response } from 'express';
import { TipoData, TipoMetada, TipoModulo } from '../enums/enums';
import DatabaseHelper from "../databaseHelper";
import multer from 'multer';
import keys from '../keys';
import { S3 } from 'aws-sdk';
import databaseHelper from '../databaseHelper';
import * as fs from "fs";

class UploadController {

 
    private formatDateFromFile(fechaPagoRaw: string): string {
        let dateTime = new Date(fechaPagoRaw);
        return new Date(dateTime.getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    }

    public async downloadOutputFile(req: Request, res: Response): Promise<void> {

      const { tipomodulo } = req.params;
      const { id } = req.params;
  
      const values = [id];
  
      try {
     
  
        const row = await databaseHelper.executeSpSelect(getSpNameForData(tipomodulo as TipoModulo, TipoData.EXPORT), values)
    
        const file = fs.openSync(`./uploads/${tipomodulo}_${id}.txt`, "w");
  
        console.log("row");
        console.log(row);
  
        let line = row[0].contenido;
  
        fs.writeSync(file, line + "\n");
  
        fs.closeSync(file);
  
        const filePath = `./uploads/${tipomodulo as TipoModulo}_${id}.txt`;
  
        res.download(filePath, function (err) { });
  
      } catch (error) {
        console.error("Error:", error);
        res.status(500).json({
          message: "Error fetching:",
          error: "Internal server error",
        });
      } finally {
      }
    }
  
    public async downloadFile(req: Request, res: Response): Promise<void> {
      try {
        const { id } = req.params; // Assuming the file is identified by an 'id'
  
        const filePath = "./uploads/output_" + id + ".txt";
  
        res.download(filePath, function (err) {
          if (err) {
            console.error(err);
            if (res.headersSent) {
            } else {
              //res.status(err)
            }
          } else {
            // The file was sent successfully
          }
        });
      } catch (error) {
        console.error("An error occurred:", error);
        res.status(500).send("Internal Server Error");
      }
    }

    public async uploadS3(file: any) {
      let bucketName = keys.AWS.bucketName;
      let region = keys.AWS.bucketRegion;
      let accessKeyId = keys.AWS.accesKey;
      let secretAccessKey = keys.AWS.secretKey;
  
      const s3 = new S3({
        region,
        accessKeyId,
        secretAccessKey,
      });
  
      const fileStream = fs.createReadStream(file.path);
  
      const uploadParams = {
        Bucket: bucketName,
        Body: fileStream,
        Key: file.filename,
      };
  
      return s3.upload(uploadParams).promise();
    }
  
    public async dropbox(req: Request, res: Response, next: any): Promise<void> {
      let multer1 = multer({ dest: "./uploads" });
  
      let upload = multer1.single("file");
  
      upload(req, res, function (err) {
        if (err) {
          return res.status(501).json({ error: err });
        } else {
          return res.json({
            originalname: req.file?.originalname,
            uploadname: req.file?.filename,
          });
        }
      });
    }
  
}

function getSpNameForData(tipoModulo: TipoModulo, tipoData: TipoData) {

  switch (true) {

    case tipoModulo === TipoModulo.PAGO && tipoData === TipoData.LIST:
      return 'PAGO_OBTENER_RESUMEN_BY_ID';

    case tipoModulo === TipoModulo.PAGO && tipoData === TipoData.EXPORT:
      return 'PAGO_OBTENER_ARCHIVO_BY_ID';

    case tipoModulo === TipoModulo.CUENTA && tipoData === TipoData.LIST:
      return 'CUENTA_OBTENER_RESUMEN_BY_ID';

    case tipoModulo === TipoModulo.CUENTA && tipoData === TipoData.EXPORT:
      return 'CUENTA_OBTENER_ARCHIVO_BY_ID';

    case tipoModulo === TipoModulo.NOMINA && tipoData === TipoData.LIST:
      return 'NOMINA_OBTENER_RESUMEN_BY_ID';

    case tipoModulo === TipoModulo.NOMINA && tipoData === TipoData.FILL:
        return 'NOMINA_OBTENER_FILL_BY_ID';

    default:
      return '';
  }
}

export const uploadController = new UploadController();
export default uploadController;

