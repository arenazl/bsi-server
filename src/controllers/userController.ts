import { Request, Response } from "express";
import DatabaseHelper from "../databaseHelper";
import databaseHelper from "../databaseHelper";

class UserController {


  public async login(req: Request, res: Response): Promise<any> {

    const nombre = req.body.nombre;
    const pass = req.body.password;

    const values = [nombre, pass];

    try {
      // Llama al procedimiento almacenado usando el método executeSpSelect
      const rows = await databaseHelper.executeSpSelect('sp_login_user', values);

      // Devuelve directamente el primer registro de los resultados, que contiene estado, descripcion y data
      return res.json(rows[0]);

    } catch (error: any) {
      console.error("Error en el login:", error.message || error);
      // En caso de error, devuelve una estructura con los campos estándar
      return res.status(500).json({
        estado: 0,
        descripcion: 'Error interno del servidor.',
        data: null,
      });
    }
  }

  public async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const result = await DatabaseHelper.executeSpSelect("GetAllUsers", []);

      res.json(result);

    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error fetching users", error: "Internal server error" });
    }
  }

  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      const result = await DatabaseHelper.executeJsonInsert("InsertUser", req.body, ["ID", "ESTADO", "DESCRIPCION"]);
      if (!result.ID) {
        res.json({ error: result.Data });
        return;
      }
      res.json({ ID: result.ID, ESTADO: result.ESTADO, DESCRIPCION: result.DESCRIPCION });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error creating user", error: "Internal server error" });
    }
  }

  public async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const result = await DatabaseHelper.executeJsonInsert("UpdateUser", req.body, ["ESTADO", "DESCRIPCION"]);
      if (result.ESTADO === undefined) {
        res.json({ error: result.Data });
        return;
      }
      res.json({ ESTADO: result.ESTADO, DESCRIPCION: result.DESCRIPCION });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error updating user", error: "Internal server error" });
    }
  }

  public async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const result = await DatabaseHelper.executeSpJsonReturn("DeleteUser", { id: req.params.id });
      if (result.ESTADO === undefined) {
        res.json({ error: result.Data });
        return;
      }
      res.json({ ESTADO: result.ESTADO, DESCRIPCION: result.DESCRIPCION });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Error deleting user", error: "Internal server error" });
    }
  }
}

const userController = new UserController();
export default userController;