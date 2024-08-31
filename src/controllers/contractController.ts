import { Request, Response } from 'express';
import databaseHelper from '../databaseHelper';

class ContractController {

  public async getContratosBotones(req: Request, res: Response): Promise<void> {

    const id_user = req.body.user;
    const id_organismo = req.body.contrato;
    const values = [id_user, id_organismo];

    try {

      const row = await databaseHelper.executeSpSelect("ObtenerContratos", values);

      res.json(row);
    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching:", error: "Internal server error" });
    } finally {
    }
  }

  public async getContratoById(req: Request, res: Response): Promise<void> {

    const id_user = req.body.id_user;
    const id_organismo = req.body.id_organismo;
    const id_contrato = req.body.id_contrato;

    const values = [id_user, id_organismo, id_contrato];
    try {

      const [row] = await databaseHelper.executeSpSelect("ObtenerContratoById", values);

      res.json([row]);
      return;

    } catch (error) {
      console.error("Error:", error);
      res
        .status(500)
        .json({ message: "Error fetching:", error: "Internal server error" });
    } finally {
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

export const contractController = new ContractController();
export default contractController