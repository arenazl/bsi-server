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
import { TipoModulo } from "../enums/enums";

class FilesController {

  public async ImportXlsPagos(req: Request, res: Response): Promise<void> {

    const values = [];
    let connection = await pool.getConnection();
    const row = await executeSpSelect(connection, "getNextPageId", values);

    var upload = await TempUploadProcess(TipoModulo.PAGOS, row[0]["nextId"]);

    upload(req, res, async () => {
      try {
        let connection = await pool.getConnection();

        const dataFromUI = req.file?.originalname.split("-");

        console.log("originalname" + req.file?.originalname);
        console.log("datafromui" + dataFromUI);
        console.log("datafromui" + dataFromUI);

        const IDUSER = dataFromUI[0];
        const IDORG = dataFromUI[1];
        const IDCONT = dataFromUI[2];
        let CONCEPTO = dataFromUI[3];
        const FECHAPAGO = formatDateFromFile(dataFromUI[4]);

        CONCEPTO = CONCEPTO.replace(".", "-");

        const rows = await readXlsxFile(req.file.path);

        const dataFromFourthRow = rows.slice(3);

        const registros = [];

        for (let row of dataFromFourthRow) {
          if (!row[3]) {
            break;
          }
          const [CBU, CUIL, NOMBRE, IMPORTE] = row.slice(3);
          registros.push({ CBU, CUIL, NOMBRE, IMPORTE });
        }

        const jsonResult = {
          IDUSER,
          IDORG,
          IDCONT,
          CONCEPTO,
          FECHAPAGO,
          ITEMS: registros,
        };

        console.log(jsonResult);

        const outParamValues = ["PAGO_HEAD_ID"];

        var result = await executeJsonInsert(
          connection,
          "insertPagoFromJson",
          jsonResult,
          outParamValues
        );

        const id = result["PAGO_HEAD_ID"];

        console.log("id: " + id);

        res.json({ id: id });
      } catch (error) {
        console.error("error tipo de archivo: " + error);
        res
          .status(500)
          .json({ message: "error tipo de archivo.", error: error.message });
        return;
      }
    });

  }


  public async ImportXlsAltas(req: Request, res: Response): Promise<void> {

    const values = [];
    let connection = await pool.getConnection();
    const row = await executeSpSelect(connection, "getNextPageId", values);

    var upload = await TempUploadProcess(TipoModulo.ALTAS, row[0]["nextId"]);

    upload(req, res, async () => {
      try {
        let connection = await pool.getConnection();

        const dataFromUI = req.file?.originalname.split("-");

        console.log("originalname" + req.file?.originalname);
        console.log("datafromui" + dataFromUI);
        console.log("datafromui" + dataFromUI);

        const IDUSER = dataFromUI[0];
        const IDORG = dataFromUI[1];
        const IDCONT = dataFromUI[2];

        const rows = await readXlsxFile(req.file.path);

        const dataFromFourthRow = rows.slice(4);

        //console.log('infro cruda')
        //console.log(dataFromFourthRow)

        const registros = [];

        for (let row of dataFromFourthRow) {
          if (!row[4]) {
            break;
          }
          const [CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo] = row;
          registros.push({ CUIL, Tipo_Doc, Nro_Doc, Apellidos, Nombres, Fecha_Nacimiento, Sexo });
        }
        const jsonResult = {
          ITEMS: registros,
        };

        let json = jsonResult;

        console.log('cantidad');
        console.log(registros.length);

        const outParams = [];

        const results = await executeJsonSelect(connection, "ValidarDatosAltaCuenta", jsonResult, outParams);

        console.log("posterior al sp");
        console.log(results);

        res.json(results);
      } catch (error) {
        console.error("Error:", error);
        res
          .status(500)
          .json({ message: "Error fetching:", error: "Internal server error" });
      }

    });

  }


  public async uploadTR(req: Request, res: Response): Promise<void> {
    try {

      var upload = await TempUploadProcess(TipoModulo.TRANSFERENCIAS, 1);

      upload(req, res, async () => {
        let info = null;
        let rows: string[];

        try {
          const content: string = fs.readFileSync(req.file.path, "utf-8");
          rows = content.split("\n");

          //console.log(rows);

          info = parsearInfoArchivoTR(rows[0], rows[rows.length - 2]);
        } catch (error) {
          console.error("error parseo: " + error);
          res.status(500).json({
            message: "An error occurred while updating the data.",
            error: error.message,
          });
          return;
        }

        const dataFromUI = req.file?.originalname.split("-");

        const user = dataFromUI[0];
        const concepto = dataFromUI[2];
        const motivo = dataFromUI[1];

        try {
          let connection = await pool.getConnection();

          var { values, outParams } = await ParseHeader(info, concepto);

          const id = await InsertTransInmediataInfo(connection, values, outParams);

          let transInmediataDatos = parsearDatosArchivoTR(rows, id);

          let contador = 0;

          for (let entity of transInmediataDatos) {
            const values = await LoopAndParseInfo(entity);

            const outParams = ["lastId"];

            const outParamValues = await InsertTransInmediataDato(
              connection,
              values,
              outParams
            );
          }

          escribirArchivoTR(transInmediataDatos, info, concepto, motivo, id);

          res.json({ id: id });
        } catch (error) {
          console.error("error DB:" + error);
        }
      });
    } catch (error) {
      console.error("error in upload:" + error);
    }
  }

  public async getContratosBotones(req: Request, res: Response): Promise<void> {

    const id_user = req.body.user;
    const id_organismo = req.body.contrato;

    const values = [id_user, id_organismo];

    let connection;

    try {
      connection = await pool.getConnection();

      const row = await executeSpSelect(connection, "ObtenerContratos", values);

      res.json(row);
    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching:", error: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }
  }

  public async getContratoById(req: Request, res: Response): Promise<void> {

    const id_user = req.body.id_user;
    const id_organismo = req.body.id_organismo;
    const id_contrato = req.body.id_contrato;

    const values = [id_user, id_organismo, id_contrato];

    let connection;

    try {
      connection = await pool.getConnection();

      const row = await executeSpSelect(connection, "ObtenerContratoById", values);

      res.json(row);
    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching:", error: "Internal server error" });
    } finally {
      if (connection) connection.release();
    }
  }

  public async downloadOutputFile(req: Request, res: Response): Promise<void> {

    const { tipomodulo } = req.params;
    const { id } = req.params;

    const values = [id];

    let connection;
    try {
      connection = await pool.getConnection();

      const row = await executeSpSelect(connection, getSpNameForTxt(tipomodulo as TipoModulo), values);

      const file = fs.openSync(`./uploads/${tipomodulo}_${id}.txt`, "w");

      console.log("row");
      console.log(row);

      let line = row[0]["archivo_contenido"];

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
      if (connection) connection.release();
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
      res.status(500).json({
        message: "Error fetching getResponseTR:",
        error: "Internal server error",
      });
    }
  }

  public async getResponsePagos(req, res) {

    const { id } = req.params;

    const values = [id];

    try {
      const connection = await pool.getConnection();

      const rows = await executeSpSelect(connection, "getPageById", values);

      if (rows.length === 0) {
        return res.status(404).json({ message: "No data found" });
      }

      const infoScreen = [];
      const dataScreen = [];
      let totalImporte = 0;

      rows.forEach((row: any) => {
        if (infoScreen.length === 0) {
          infoScreen.push({
            headerId: row.headerId,
            CUENTA_DEBITO: row.Cuenta_Debito,
            CONCEPTO: row.Prestacion,
            ROTULO: row.Rotulo,
            FECHA: row.Fecha_Acreditacion,
            CANTIDAD_TRANSFERENCIAS: 0,
            TOTAL_IMPORTE: 0,
          });
        }

        totalImporte += parseFloat(row.totalImporte);

        dataScreen.push({
          itemId: row.headerId,
          CBU: row.CBU,
          APELLIDO: row.Apellido_Nombre,
          NOMBRE: row.Apellido_Nombre,
          IMPORTE: row.totalImporte,
        });
      });

      if (infoScreen.length > 0) {
        infoScreen[0].CANTIDAD_TRANSFERENCIAS = dataScreen.length;
        infoScreen[0].TOTAL_IMPORTE = totalImporte;
      }

      res.json({ head: infoScreen[0], data: dataScreen });
    } catch (error) {
      console.error("Error fetching response:", error);
      res.status(500).json({
        message: "Error fetching getResponsePagos:",
        error: "Internal server error",
      });
    }
  }

  public async getResponseTRForCombo(req, res): Promise<void> {
    console.error("getResponseTRForCombo");

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
      res.status(500).json({
        message: "Error fetching getResponseTRList:",
        error: "Internal server error",
      });
    } finally {
      if (connection) connection.release();
    }
  }

  public async getResponsePagosForCombo(req, res): Promise<void> {
    console.error("getResponsePagosForCombo");

    let connection;
    try {
      connection = await pool.getConnection();
      const values = null;

      const result = await executeSpSelect(
        connection,
        "getPagosListForSelect",
        values
      );

      res.json(result);
    } catch (error) {
      console.error("Error fetching getResponsePagosForCombo:", error);
      res.status(500).json({
        message: "Error fetching getResponsePagosForCombo:",
        error: "Internal server error",
      });
    } finally {
      if (connection) connection.release();
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await pool.query("DELETE  FROM games WHERE id = ?", [id]);
    res.json({ message: "The game was deleted" });
  }

  public async list(req: Request, res: Response): Promise<any> {
    var serverFiles = [];
    const dir = path.join(__dirname, "../../uploads");
    const files = fs.readdirSync(dir);

    for (const file of files) {
      serverFiles.push(file);
    }
    return res.json(serverFiles);
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

function formatDateFromFile(fechaPagoRaw) {
  // fechaPagoRaw tiene el formato YYYYMMDD
  const year = fechaPagoRaw.substring(0, 4);
  const month = fechaPagoRaw.substring(4, 6);
  const day = fechaPagoRaw.substring(6, 8);
  return `${year}-${month}-${day}`; // Formato YYYY-MM-DD
}

async function executeJsonInsert(
  connection: mysql.PoolConnection,
  spName: string,
  jsonData: object,
  outParams: string[]
) {
  try {
    console.log("execute SJasonpInsert");

    const sql = `CALL ${spName}(?);`;
    const values = [JSON.stringify(jsonData)];


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

    const statement = await connection.prepare(sql);

    const [results]: any = await statement.execute(values);

    statement.close();
    await connection.unprepare(sql);

    return results[0];

  } catch (error: any) {
    console.error(error);
  } finally {
    if (connection) connection.release();
  }
}

async function executeJsonSelect(
  connection: mysql.PoolConnection,
  spName: string,
  jsonData: object,
  outParams: string[]
): Promise<any[]> {
  try {

    const sql = `CALL ${spName}(?);`;
    const values = [JSON.stringify(jsonData)];

    console.log("sql");
    console.log(sql);
    console.log("values");
    console.log(values);

    const statement = await connection.prepare(sql);
    const [results]: any = await statement.execute(values);

    console.log('results full');
    console.log(results);

    statement.close();

    await connection.unprepare(sql);

    return results[0];

  } catch (error: any) {
    console.error(error);
  } finally {
    if (connection) {
      connection.release();
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

async function InsertTransInmediataDato(
  connection: mysql.PoolConnection,
  values: (string | number)[],
  outParams: string[]
) {
  return await executeSpInsert(
    connection,
    "InsertTransInmediataDato",
    values,
    outParams
  );
}

function getSpNameForTxt(tipoModulo: TipoModulo) {

  console.log("tipoModulo");
  console.log(tipoModulo);

  switch (tipoModulo) {
    case TipoModulo.PAGOS:
      return 'GetPagoFile';
    case TipoModulo.TRANSFERENCIAS:
      return 'GetFileTransferencias';
    case TipoModulo.ALTAS:
      return 'GenerarArchivoAltaCuentas';
    default:
      return '';
  }
}

async function LoopAndParseInfo(entity: transInmediataDato) {
  return [
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
}

async function InsertTransInmediataInfo(
  connection: mysql.PoolConnection,
  values: any[],
  outParams: string[]
) {
  const outParamValues = await executeSpInsert(
    connection,
    "InsertTransInmediataInfo",
    values,
    outParams
  );

  const id = outParamValues["lastId"];
  return id;
}

async function ParseHeader(info: any, concepto: string) {
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
  return { values, outParams };
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

  try {
    //CABECERA
    info.tipoDeRegistro = Number(infoRowC.substring(0, 1).trim());

    if (Number.isNaN(info.tipoDeRegistro)) {
      throw new Error("Error en el tipo de registro");
    }

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
  } catch (error) {
    throw error;
  }

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

function padStringFromLeft(str: string, length: number, padChar = " ") {
  let paddedStr = padChar.repeat(length);
  return paddedStr + str;
}

function padStringFromRight(str: string, length: number, padChar = " ") {
  let paddedStr = padChar.repeat(length);
  return str + paddedStr;
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

async function TempUploadProcess(TipoModulo: TipoModulo, Id: number) {

  let fileName = "input" +
    "_" +
    TipoModulo +
    "_" +
    Id +
    ".xlsx";

  var store = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
      cb(null, fileName);
    },
  });

  var upload = multer({ storage: store }).single("file");
  return upload;
}

const fileController = new FilesController();
export default fileController;
