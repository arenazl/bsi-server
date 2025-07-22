import { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '@middleware/errorHandler';
import logger from '@config/logger';

export class AuthController {
  async login(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;
    
    logger.info(`Login attempt for email: ${email}`);
    
    // TODO: Implementar autenticación real
    // Por ahora, retornar respuesta de ejemplo
    
    if (email === 'admin@bsi.com' && password === 'admin123') {
      return res.json({
        success: true,
        data: {
          accessToken: 'fake-jwt-token',
          refreshToken: 'fake-refresh-token',
          user: {
            id: '1',
            email: 'admin@bsi.com',
            firstName: 'Admin',
            lastName: 'BSI',
            role: 'ADMIN'
          }
        }
      });
    }
    
    throw new UnauthorizedError('Credenciales inválidas');
  }

  async refreshToken(req: Request, res: Response): Promise<Response> {
    const { refreshToken } = req.body;
    
    // TODO: Implementar refresh token real
    return res.json({
      success: true,
      data: {
        accessToken: 'new-fake-jwt-token',
        refreshToken: 'new-fake-refresh-token'
      }
    });
  }

  async logout(req: Request, res: Response): Promise<Response> {
    // TODO: Implementar logout real
    return res.json({
      success: true,
      message: 'Logout exitoso'
    });
  }
}