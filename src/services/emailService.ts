import nodemailer from 'nodemailer';
import { config } from '@config/index';
import logger from '@config/logger';

class EmailService {
  private transporter: nodemailer.Transporter;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Verificar que tenemos configuración de email
      if (!config.email.auth.user || !config.email.auth.pass) {
        logger.warn('Email service not configured - missing credentials', {
          user: config.email.auth.user ? 'SET' : 'MISSING',
          pass: config.email.auth.pass ? 'SET' : 'MISSING'
        });
        return;
      }

      this.transporter = nodemailer.createTransport({
        service: config.email.service,
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.auth.user,
          pass: config.email.auth.pass,
        },
        tls: {
          rejectUnauthorized: false // Para Gmail
        }
      });

      this.isConfigured = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  /**
   * Enviar notificación de error simple
   */
  async sendErrorNotificationSimple(
    subject: string,
    errorDetails: string,
    friendlyDescription: string
  ): Promise<void> {
    logger.info('Attempting to send error notification email', {
      isConfigured: this.isConfigured,
      subject: subject
    });

    if (!this.isConfigured) {
      logger.warn('Email service not configured - skipping notification');
      return;
    }

    try {
      const mailOptions = {
        from: config.email.from || `BSI System <${config.email.auth.user}>`,
        to: "arenazl@gmail.com, oscarmorganti@gmail.com, Marcelo.vecchiett@gmail.com, Santiagomorganti01@gmail.com",
        subject: `[BSI Alert] ${subject}`,
        text: friendlyDescription + '\n\n--- DETALLES TÉCNICOS ---\n\n' + errorDetails,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">🚨 BSI System Alert</h1>
            </div>
            <div style="padding: 20px; background-color: #f8f9fa;">
              <h2 style="color: #dc3545;">${subject}</h2>
              <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <p style="color: #333; line-height: 1.6;">${friendlyDescription.replace(/\n/g, '<br>')}</p>
              </div>
              <details>
                <summary style="cursor: pointer; color: #007bff; font-weight: bold;">Ver detalles técnicos</summary>
                <pre style="background-color: #f1f1f1; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px;">${errorDetails}</pre>
              </details>
            </div>
            <div style="background-color: #343a40; color: white; padding: 10px; text-align: center; font-size: 12px;">
              <p style="margin: 0;">BSI System - ${new Date().toLocaleString('es-AR')}</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Error notification email sent successfully');
    } catch (error) {
      logger.error('Failed to send error notification email:', error);
      throw error;
    }
  }

  /**
   * Enviar email genérico
   */
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: any[];
  }): Promise<void> {
    if (!this.isConfigured) {
      logger.warn('Email service not configured - skipping email');
      return;
    }

    try {
      const mailOptions = {
        from: config.email.from || `BSI System <${config.email.auth.user}>`,
        ...options
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { messageId: info.messageId });
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Verificar configuración
   */
  async verify(): Promise<boolean> {
    if (!this.isConfigured) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email service verified successfully');
      return true;
    } catch (error) {
      logger.error('Email service verification failed:', error);
      return false;
    }
  }
}

export default new EmailService();