import { Request, Response } from 'express';
import logger from '@config/logger';

export class UserController {
  async getAll(req: Request, res: Response): Promise<Response> {
    logger.info('Getting all users');
    
    // TODO: Implementar con base de datos real
    return res.json({
      success: true,
      data: [
        {
          id: '1',
          email: 'admin@bsi.com',
          firstName: 'Admin',
          lastName: 'BSI',
          role: 'ADMIN',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        pages: 1
      }
    });
  }

  async getById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    logger.info(`Getting user by id: ${id}`);
    
    return res.json({
      success: true,
      data: {
        id,
        email: 'user@bsi.com',
        firstName: 'User',
        lastName: 'BSI',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async create(req: Request, res: Response): Promise<Response> {
    const userData = req.body;
    logger.info('Creating new user', { email: userData.email });
    
    return res.status(201).json({
      success: true,
      data: {
        id: '2',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const updateData = req.body;
    
    logger.info(`Updating user ${id}`);
    
    return res.json({
      success: true,
      data: {
        id,
        ...updateData,
        updatedAt: new Date()
      }
    });
  }

  async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    
    logger.info(`Deleting user ${id}`);
    
    return res.json({
      success: true,
      message: `User ${id} deleted successfully`
    });
  }

  async getProfile(req: Request, res: Response): Promise<Response> {
    // TODO: Obtener del usuario autenticado
    return res.json({
      success: true,
      data: {
        id: '1',
        email: 'current@bsi.com',
        firstName: 'Current',
        lastName: 'User',
        role: 'USER'
      }
    });
  }

  async updateProfile(req: Request, res: Response): Promise<Response> {
    const updateData = req.body;
    
    return res.json({
      success: true,
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });
  }
}