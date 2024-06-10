import { Request, Response } from "express";
import pool from "../database";
import multer from "multer";
import fileType from "file-type";
import readXlsxFile from "read-excel-file/node";
import path from "path";
import * as fs from "fs";
import * as mysql from "mysql2/promise";
import keys from "./../keys";

import S3 from "aws-sdk/clients/s3";

import { transInmediataInfo } from "./../models/model";
import { transInmediataDato } from "./../models/model";

import nodemailer from "nodemailer";
import { ImportExport } from "aws-sdk";
import legajoController from "./legajoController";

class FilesController 
{

  public async list(req: Request, res: Response): Promise<any> {
    var serverFiles = [];
    const dir = path.join(__dirname, "../../uploads");
    const files = fs.readdirSync(dir);

    for (const file of files) {
      serverFiles.push(file);
    }

    return res.json(serverFiles);
  }
  public async delete(req: Request, res: Response): Promise<void> {
    //pere

    const { id } = req.params;

    await pool.query("DELETE  FROM games WHERE id = ?", [id]);

    res.json({ message: "The game was deleted" });
  }

  public async upload(req: Request, res: Response, next: any): Promise<void> {
    console.log("upload start");

    var store = multer.diskStorage({
      destination: function (req: any, file, cb) {
        cb(null, "./uploads");
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
      },
    });

    var upload = multer({ storage: store }).single("file");

    upload(req, res, async function (err) {
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
        secretAccessKey,
      });

      //@ts-ignore
      const fileStream = fs.createReadStream(req.file.path);

      const uploadParams = {
        Bucket: bucketName,
        Body: fileStream,
        //@ts-ignore
        Key: req.file.filename,
      };

      try {
        const data = await s3.upload(uploadParams).promise();
        console.log(data);

        res.json({ uploadname: req.file.filename });
      } catch (err) {
        throw err;
      }
    });
    
  }

  public async uploadTR(req: Request, res: Response): Promise<void> {
    
    console.log("upload uploadTR");

    try { 

      var store = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, "./uploads");
        },
        filename: function (req, file, cb) {
          cb(null, Date.now() + "-" + file.originalname);
        },
      });

      var upload = multer({ storage: store }).single("file");

    } catch (error) {
      console.error("error in upload:" + error);
    }

    upload(req, res, async () => 
    {
      try {

        console.log("upload internal start");
 
        const content: string = fs.readFileSync(req.file.path, "utf-8");
        let rows: string[] = content.split("\n");

        //console.log(rows);   

        let info = parsearInfoArchivoTR(rows[0], rows[rows.length - 2]);

        //console.log(info);

        const dataFromUI = req.file?.originalname.split("-");

        const user = dataFromUI[0];
        const concepto = dataFromUI[2];
        const motivo = dataFromUI[1];
 
        try {

          let connection = await pool.getConnection();

          //LLAMAMOS AL SP DE DETALLE
          console.log("Llamamos al sp");

          const values = [
            info.tipoDeRegistro,
            info.empresaNombre,
            info.infoDiscrecional,
            info.empresaCUIT.toString(),
            info.prestacion,
            info.fechaEmision.toString(),
            info.horaGeneracion.toString() + "00",
            info.fechaAcreditacion.toString(),
            info.bloqueDosCbuEmpresa,
            info.moneda,
            info.rotuloArchivo,
            info.tipoRemuneracion,
            arreglarDecimales(info.importeTotalFinal),
            concepto,
          ];

          const outParams = ["lastId"];

          const outParamValues = await executeSpInsert(
            connection,
            "InsertTransInmediataInfo",
            values,
            outParams
          );

          const id = outParamValues["lastId"];

          let transInmediataDatos = parsearDatosArchivoTR(rows, id);

          let contador = 0;

          for (let entity of transInmediataDatos) {
            const values = [
              entity.tipoDeRegistro,
              entity.bloqueCBU1,
              entity.bloqueCBU2,
              arreglarDecimales(entity.importe),
              entity.refUnivoca,
              entity.beneficiarioDoc,
              entity.beneficiarioApeNombre,
              entity.filler,
              entity.marca,
              entity.transInmediataInfoId,
            ];

            const outParams = ["lastId"];

            const outParamValues = await executeSpInsert(
              connection,
              "InsertTransInmediataDato",
              values,
              outParams
            );
            
          }

          escribirArchivoTR(transInmediataDatos, info, concepto, motivo, id);
          
          res.json({ id: id });

        } catch (error) 
        {
          console.error("error:" + error);
        } 
             
      } catch (error)
      {
        console.error("error:" + error);
        res
          .status(500)
          .json({ message: "An error occurred while updating the data.", error: error});
      }
    });
    
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
  public async getResponseTR(req, res) {
    try {
      console.log("enter response....");
      const { id } = req.params;

      // Fetch the infoScreen data
      const infoScreen = await getPantallaTransferenciaInfoById(id);
      if (!infoScreen || infoScreen.length === 0) {
        return res.status(404).json({ error: "Info screen not found" });
      }

      // Fetch the dataScreen data
      const dataScreen = await getPantallaTransferenciaDatoById(id);
      if (!dataScreen || dataScreen.length === 0) {
        return res.status(404).json({ error: "Data screen not found" });
      }

      // Send the response
      //@ts-ignore
      res.json({ head: infoScreen[0], data: dataScreen });
    } catch (error) {

      console.error("Error fetching response:", error);
      res.status(500).json({ message: "Error fetching getResponseTR:",  error: "Internal server error" });
    }
  }

  public async getResponseTRList(req, res) : Promise<void> {

    let connection;
    try {
      connection = await pool.getConnection();
      const values = null;
      const result = await executeSpSelect(
        connection,
        "getTransListForSelect",
        values
      );

      res.json(result);
      
    } catch (error) {
      console.error("Error fetching getResponseTRList:", error);
      res.status(500).json({ message: "Error fetching getResponseTRList:",  error: "Internal server error" });
    } finally {
      if (connection) connection.release();
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

  public async download(req: Request, res: Response, next: any): Promise<void> {

    let bucketName = keys.AWS.bucketName;
    let region = keys.AWS.bucketRegion;
    let accessKeyId = keys.AWS.accesKey;
    let secretAccessKey = keys.AWS.secretKey;

    const s3 = new S3({
      region,
      accessKeyId,
      secretAccessKey,
    });

    console.log(s3);

    const downloadParams = {
      Bucket: bucketName,
      Key: req.body.filename,
    };

    console.log(downloadParams);

    try {
      const data = await s3.getObject(downloadParams).createReadStream();
      data.pipe(res);
    } catch (err) {
      throw err;
    }
  }
  public async sendMail(req: Request, res: Response, next: any): Promise<void> {
    let bucketName = keys.AWS.bucketName;

    try {
      console.log("Sending Email");

      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "arenazl@gmail.com;Proyectos.don.luisk41@gmail.com",
          pass: "vxmgkblhzauuapqh",
        },
      });

      var mailOptions = {
        from: "arenazl@gmail.com",
        to: "arenazl@gmail.com",
        subject:
          "Nueva venta a nombre de: " +
          req.body.denominacion +
          " ingreso al sistema!",
        html:
          "<h5>Se vendio el Lote " +
          req.body.id_lote +
          "!! </h5> <h5> Comprador: " +
          req.body.denominacion +
          "</h5> <h5>Dni: " +
          req.body.dni +
          " </h5>  <h5>Precio de venta " +
          req.body.lote_total +
          " </h5>  <h5>Seña: " +
          req.body.refuerzo_total +
          '</h5> <p>Ingrese al sistema para verificar los datos</p> <p><a href="https://sisbarrios.herokuapp.com"> Ingrese a SIS-Barrios </a></p>',
      };

      transporter.sendMail(mailOptions, function (error: any, info: any) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    } catch (ex) {
      console.log(ex);
    }
  }
}

function extractOutParams(queryResult, outParams) {
  const output = {};
  // Recorrer los resultados y extraer los parámetros de salida
  queryResult.forEach((resultSet) => {
    if (Array.isArray(resultSet)) {
      resultSet.forEach((row) => {
        outParams.forEach((param) => {
          if (row.hasOwnProperty(param)) {
            output[param] = row[param];
          }
        });
      });
    }
  });
  return output;
}

async function executeSpInsert(

  connection: mysql.PoolConnection,
  spName: string,
  values: (string | number)[],
  outParams: string[]
) {

  try {

    console.log("executeSpInsert");

    let placeholders = values.map(() => "?").join(",");

    let sql = `CALL ${spName}(${placeholders});`;

    console.log(placeholders);
    console.log("sql");
    console.log(sql);
    console.log("values");
    console.log(values);

    const [queryResult] = await connection.execute(sql, values);

    const outParamValues = extractOutParams(queryResult, outParams);

    return outParamValues;

  } catch (error: any) {
    console.error(error);
  } finally {
  if (connection) connection.release();
  }
}

async function executeSpSelect(

  connection: mysql.PoolConnection,
  spName: string,
  values: (string | number)[]
): Promise<any[]> {

  try {
    console.log("executeSpSelect");

    let placeholders = "";

    if (values) {
      placeholders = values.map(() => "?").join(",");
    }

    let sql = `CALL ${spName}(${placeholders});`;

    console.log("placeholders");
    console.log(placeholders);
    console.log("sql");
    console.log(sql)

    const statement = await connection.prepare(sql);

    console.log("values");
    console.log(values);

    const [results]: any = await statement.execute(values);

    statement.close();
    await connection.unprepare(sql);

    console.log("RESULT");
    console.log(results);

    return results[0];
    
  } catch (error: any) {
    console.error(error);
  } finally {
  if (connection) connection.release();
  }
  
}

function escribirArchivoTR(
  rows: Array<transInmediataDato>,
  info: transInmediataInfo,
  concepto: string,
  motivo: string,
  id: number
): boolean {
  const file = fs.openSync("./uploads/output_" + id + ".txt", "w");

  // console.log(transInmediataDatos);

  for (const value of rows) {
    //CBU
    let CBU;
    CBU = value.bloqueCBU1.toString() + value.bloqueCBU2.toString();

    //IMPORTE
    let IMPORTE = value.importe.toString();
    IMPORTE = padStringFromLeft(IMPORTE, 12 - IMPORTE.length, "0");

    //CONCEPTO
    let CONCEPTO = concepto;
    CONCEPTO = padStringFromRight(concepto, 50 - concepto.length, " ");

    //REFERENCIA
    let REFERENCIA = " ";
    REFERENCIA = padStringFromRight(REFERENCIA, 12 - REFERENCIA.length, " ");

    //EMAIL
    let EMAIL = " ";
    EMAIL = padStringFromRight(EMAIL, 50 - EMAIL.length, " ");

    //RELLENO
    let RELLENO = "";
    RELLENO = padStringFromRight(RELLENO, 124 - RELLENO.length, " ");

    fs.writeSync(
      file,
      CBU + IMPORTE + CONCEPTO + motivo + REFERENCIA + EMAIL + RELLENO + "\n"
    );
  }

  //DATOS FINALES

  //CANT REGISTROS FINALES
  let CANT_REGISTROS = (info.cantidadRegistroFinal + 1).toString();
  CANT_REGISTROS = padStringFromLeft(
    CANT_REGISTROS,
    5 - CANT_REGISTROS.length,
    "0"
  );

  console.log("Cant Reegistros: " + info.cantidadRegistroFinal);
  console.log("Escribe: " + CANT_REGISTROS);

  //IMPORTE TOTAL
  let IMPORTE_TOTAL = info.importeTotalFinal.toString();
  IMPORTE_TOTAL = padStringFromLeft(
    IMPORTE_TOTAL,
    17 - IMPORTE_TOTAL.length,
    "0"
  );

  //RELLENO
  let RELLENO = "";
  RELLENO = padStringFromRight(RELLENO, 251 - RELLENO.length, " ");

  fs.writeSync(file, CANT_REGISTROS + IMPORTE_TOTAL + RELLENO + "\n");

  fs.closeSync(file);

  return true;
}

function readDile() {
  //read a look.txt file
  fs.readFile("./uploads/look.txt", "utf8", function (err, data) {
    if (err) throw err;
    console.log(data);
  });
}

function parsearInfoArchivoTR(
  infoRowC: string,
  infoRowF: string
): transInmediataInfo {
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
  info.cantidadRegistroFinal = Number(infoRowF.substring(1, 7).trim());
  info.importeTotalFinal = Number(infoRowF.substring(7, 18).trim());
  info.fillerFinal = infoRowF.substring(18, 99);
  info.marcaFinal = Number(infoRowF.substring(99, 100).trim());

  return info;
}

function parsearDatosArchivoTR(
  rows: string[],
  transfeInfoId: number
): Array<transInmediataDato> {
  console.log("transfeInfoId: " + transfeInfoId);

  let datosRows = rows.slice(1, rows.length - 2);
  let transInmediataDatos = new Array<transInmediataDato>();

  for (const row of datosRows) {
    let datoTran = new transInmediataDato();

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

function arreglarDecimales(importe: number) {
  let valorImporte = Math.floor(importe) / 100;
  return valorImporte.toFixed(2);
}

async function getPantallaTransferenciaDatoById(transferenciaInfoId: number) {
  let connection;
  try {
    connection = await pool.getConnection();

    const values = [transferenciaInfoId];
    const result = await executeSpSelect(
      connection,
      "GetTransInmediataDatoById",
      values
    );

    return result;
  } catch (error) {
    console.error("Error fetching Pantalla Transferencia Dato:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

async function getPantallaTransferenciaInfoById(id: number) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query("CALL GetTransInmediataInfoById(?)", [
      id,
    ]);
    return rows;
  } catch (error) {
    console.error("Error fetching Pantalla Transferencia Info:", error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

function padStringFromLeft(str: string, length: number, padChar = " ") {
  let paddedStr = padChar.repeat(length);
  return paddedStr + str;
}

function padStringFromRight(str: string, length: number, padChar = " ") {
  let paddedStr = padChar.repeat(length);
  return str + paddedStr;
}

const fileController = new FilesController();
export default fileController;
