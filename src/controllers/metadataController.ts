import { Request, Response } from "express";
import DatabaseHelper from "../databaseHelper";
import { TipoModulo, TipoMetada, TipoData } from "../enums/enums";

class MetadataController {

  public async getMetadataUI(req: Request, res: Response): Promise<any> {

    const { tipomodulo, tipometada, contrato } = req.params;
    let params;

    //let outParams = ['1','2' ];

    try 
    {
      if (contrato === 'NONE') {  params = {};
      } else {  params = { contrato };  }

      const row = await DatabaseHelper.executeSpJsonReturn(getSpNameForMetada(tipomodulo as TipoModulo, tipometada as TipoMetada),params); 

      res.json([row]);
      return;

    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Error fetching metadata:", error: "Internal server error" });
    }
  }

  public async getResumen(req: Request, res: Response): Promise<any> {
    const { tipomodulo, id } = req.params;

    try {
      const params = { id };

      const [row] = await DatabaseHelper.executeSpJsonReturn(getSpNameForData(tipomodulo as TipoModulo, TipoData.LIST), params
      );

        res.json([row]);
        return
      
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Error fetching resumen:", error: "Internal server error" });
    }
  }

  public async getFill(req: Request, res: Response): Promise<void> {
    const { tipomodulo, id } = req.params;

    try {
      const params = { id };
      const row = await DatabaseHelper.executeSpJsonReturn(
        getSpNameForData(tipomodulo as TipoModulo, TipoData.FILL),
        params
      );

      if (row.metadata_json == undefined) {
        res.json({ result: row[0].resultado_json });
      } else {
        res.json({ error: row.Data });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Error fetching fill data:", error: "Internal server error" });
    }
    
}

}

function  getSpNameForMetada(tipoModulo: TipoModulo, tipometada: TipoMetada): string {
  switch (true) {
    case tipoModulo === TipoModulo.PAGO && tipometada === TipoMetada.LIST:
      return 'PAGO_METADATA_UI_RESUMEN';
    case tipoModulo === TipoModulo.PAGO && tipometada === TipoMetada.IMPORT:
      return 'PAGO_METADATA_UI_IMPORT';
    case tipoModulo === TipoModulo.CUENTA && tipometada === TipoMetada.LIST:
      return 'CUENTA_METADATA_UI_RESUMEN';
    case tipoModulo === TipoModulo.CUENTA && tipometada === TipoMetada.IMPORT:
      return 'CUENTA_METADATA_UI_IMPORT';
    case tipoModulo === TipoModulo.NOMINA && tipometada === TipoMetada.LIST:
      return 'NOMINA_METADATA_UI_IMPORT';
    case tipoModulo === TipoModulo.NOMINA && tipometada === TipoMetada.IMPORT:
      return 'NOMINA_METADATA_UI_IMPORT';
    case tipoModulo === TipoModulo.NOMINA && tipometada === TipoMetada.FILL:
      return 'NOMINA_METADATA_UI_FILL';
    default:
      return '';
  }
}

function  getSpNameForData(tipoModulo: TipoModulo, tipoData: TipoData): string {
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
  
const metadataController = new MetadataController();
export default metadataController;


