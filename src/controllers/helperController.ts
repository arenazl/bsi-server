import { Request, Response } from 'express';
import databaseHelper from '../databaseHelper';

class HelperController {

  public async getContratoById(req: Request, res: Response): Promise<void> {
    const id_user = req.body.id_user;
    const id_organismo = req.body.id_organismo;
    const id_contrato = req.body.id_contrato;
  
    const values = [id_user, id_organismo, id_contrato];
    try {
      // Llama al stored procedure con los valores proporcionados
      const rows = await databaseHelper.executeSpSelect("ObtenerContratoById", values);
  
      // Verifica si rows tiene datos y devuelve la primera fila, que contiene estado, descripcion y data
      if (rows && rows.length > 0) {
        res.json(rows[0]); // Devuelve la respuesta tal como la recibe del SP
      } else {
        // Maneja el caso donde no se obtienen resultados del SP
        res.status(404).json({
          estado: 0,
          descripcion: 'No se encontraron resultados.',
          data: null,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      // Manejo del error en caso de falla del SP
      res.status(500).json({
        estado: 0,
        descripcion: 'Error interno del servidor.',
        data: null,
      });
    }
  }

  public async getListForCombo(req, res): Promise<void> {

    let { tipomodulo } = req.params;
    let values = [tipomodulo];

    try {

      const result = await databaseHelper.executeSpSelect(
        "GET_LIST_FOR_COMBO",
        values
      );

      res.json(result);
    } catch (error) {
      console.error("Error fetching getListForCombo:", error);
      res.status(500).json({
        message: "Error fetching getListForCombo:",
        error: "Internal server error",
      });
    } finally {
    }
  }

}

export const contractController = new HelperController();
export default contractController