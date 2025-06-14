import { Request, Response } from "express";
import DatabaseHelper from "../databaseHelper";
import databaseHelper from "../databaseHelper";
import EmailService from "../services/emailService";
import ResponseHelper from "../utils/responseHelper";
import config from "../keys";

class UserController {


  public async login(req: Request, res: Response): Promise<any> {
    try {
      const { nombre, password } = req.body;
      const values = [nombre, password];
      
      const rows = await databaseHelper.executeSpSelect('sp_login_user', values);
      ResponseHelper.sendDatabaseResponse(res, rows);
    } catch (error: any) {
      console.error("Error en el login:", error.message || error);
      ResponseHelper.throwMethodError(error);
    }
  }

  public async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const result = await DatabaseHelper.executeSpSelect("GetAllUsers", []);
      ResponseHelper.sendSuccess(res, result, 'Usuarios obtenidos correctamente');
    } catch (error) {
      console.error("Error fetching users:", error);
      ResponseHelper.throwMethodError(error);
    }
  }

  public async createUser(req: Request, res: Response): Promise<void> {
    try {
      const result = await DatabaseHelper.executeJsonInsert("InsertUser", req.body);
      ResponseHelper.sendDatabaseResponse(res, result);
    } catch (error: any) {
      console.error("Error creating user:", error);
      ResponseHelper.throwMethodError(error);
    }
  }

  public async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const result = await DatabaseHelper.executeJsonInsert("UpdateUser", req.body);
      ResponseHelper.sendDatabaseResponse(res, result);
    } catch (error) {
      console.error("Error updating user:", error);
      ResponseHelper.throwMethodError(error);
    }
  }

  public async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const result = await DatabaseHelper.executeSpJsonReturn("DeleteUser", { id: req.params.id });
      ResponseHelper.sendDatabaseResponse(res, result);
    } catch (error) {
      console.error("Error deleting user:", error);
      ResponseHelper.throwMethodError(error);
    }
  }
}

const userController = new UserController();
export default userController;
