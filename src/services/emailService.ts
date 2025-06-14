import nodemailer from 'nodemailer';
import config from '../keys';

export interface EmailErrorData {
  title: string;
  errorType: 'success' | 'warning' | 'error';
  errorMessage: string;
  friendlyDescription: string;
  recipients: string | string[];
}

class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    this.transporter = nodemailer.createTransport(config.emailConfig);
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private getColorByType(type: 'success' | 'warning' | 'error'): string {
    const colors = {
      success: '#28a745',
      warning: '#ffc107', 
      error: '#dc3545'
    };
    return colors[type];
  }

  private generateErrorHtml(data: EmailErrorData): string {
    const color = this.getColorByType(data.errorType);
    const typeText = {
      success: 'ÉXITO',
      warning: 'ADVERTENCIA',
      error: 'ERROR'
    };

    const typeIcon = {
      success: ' ✅ ' ,
      warning: ' ⚠️ ',
      error: ' ❌ '
    };

    // Extraer información del error para mejor formato
    const errorLines = data.errorMessage.split('\n');
    let endpoint = '', method = '', timestamp = '', municipioDescripcion = '', userAgent = '', body = '', query = '', params = '', stackTrace = '';
    
    let currentSection = '';
    for (const line of errorLines) {
      if (line.includes('MÉTODO HTTP:')) method = line.split(':')[1]?.trim() || '';
      else if (line.includes('ENDPOINT:')) endpoint = line.split(':')[1]?.trim() || '';
      else if (line.includes('HORA:')) timestamp = line.split(':')[1]?.trim() || '';
      else if (line.includes('MUNICIPIO:')) municipioDescripcion = line.split(':')[1]?.trim() || '';
      else if (line.includes('USER AGENT:')) userAgent = line.split(':')[1]?.trim() || '';
      else if (line.includes('- Body:')) currentSection = 'body';
      else if (line.includes('- Query:')) currentSection = 'query';
      else if (line.includes('- Params:')) currentSection = 'params';
      else if (line.includes('STACK TRACE:')) currentSection = 'stack';
      else if (currentSection === 'body' && line.trim()) body += line + '\n';
      else if (currentSection === 'query' && line.trim()) query += line + '\n';
      else if (currentSection === 'params' && line.trim()) params += line + '\n';
      else if (currentSection === 'stack' && line.trim()) stackTrace += line + '\n';
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container { 
            background: white; padding: 0; border-radius: 12px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 700px; margin: 0 auto; overflow: hidden;
          }
          .header { 
            background: #f8f9fa; color: #495057; padding: 15px 30px; 
            border-bottom: 3px solid ${color}; display: flex; align-items: center; justify-content: space-between;
          }
          .header h1 { margin: 0; font-size: 18px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
          .status-badge { 
            background: ${color}; color: white; padding: 4px 12px; 
            border-radius: 12px; font-weight: 500; font-size: 12px; text-transform: uppercase;
          }
          .content { padding: 30px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; }
          .info-card { 
            background: #f8f9fa; padding: 20px; border-radius: 8px; 
            border-left: 4px solid ${color}; transition: all 0.2s ease;
          }
          .info-card:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
          .info-card h4 { margin: 0 0 10px 0; color: #495057; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
          .info-card p { margin: 0; color: #212529; font-weight: 500; word-break: break-all; }
          .section { margin: 25px 0; }
          .section-title { 
            color: #495057; font-size: 16px; font-weight: 600; margin-bottom: 15px;
            display: flex; align-items: center; gap: 8px;
          }
          .code-block { 
            background: #2d3748; color: #e2e8f0; padding: 20px; border-radius: 8px; 
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 13px; line-height: 1.5; overflow-x: auto; white-space: pre-wrap;
            border: 1px solid #4a5568;
          }
          .json-block {
            background: #1a202c; color: #68d391; padding: 20px; border-radius: 8px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 13px; line-height: 1.6; overflow-x: auto;
            border: 1px solid #2d3748;
          }
          .footer { 
            background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; 
            font-size: 12px; border-top: 1px solid #e9ecef;
          }
          .footer p { margin: 5px 0; }
          .description { 
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            padding: 20px; border-radius: 8px; margin-bottom: 25px;
            border-left: 4px solid #2196f3;
          }
          @media (max-width: 600px) {
            .info-grid { grid-template-columns: 1fr; }
            .container { margin: 10px; }
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${typeIcon[data.errorType]}</h1>
            <div class="status-badge">${typeText[data.errorType]}</div>
          </div>
          
          <div class="content">
            <div class="description">
              <p><strong>🔍 Resumen:</strong> ${data.friendlyDescription}</p>
            </div>

            <div class="info-grid">
              <div class="info-card">
                <h4>🌐 Endpoint</h4>
                <p>${method} ${endpoint}</p>
              </div>
              <div class="info-card">
                <h4>⏰ Timestamp</h4>
                <p>${timestamp}</p>
              </div>
              <div class="info-card">
                <h4>🏛️ Municipio</h4>
                <p>${municipioDescripcion}</p>
              </div>
              <div class="info-card">
                <h4>🖥️ User Agent</h4>
                <p>${userAgent}</p>
              </div>
            </div>

            ${body ? `
            <div class="section">
              <div class="section-title">📄 Request Body</div>
              <div class="json-block">${body.trim()}</div>
            </div>
            ` : ''}

            <div class="section">
              <div class="section-title">🐛 Stack Trace</div>
              <div class="code-block">${stackTrace.trim()}</div>
            </div>
          </div>

          <div class="footer">
            <p><strong>🚀 Sistema BSI</strong> - Notificación automática</p>
            <p>📅 Generado: ${new Date().toLocaleString('es-AR')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  public async sendErrorNotification(data: EmailErrorData): Promise<{ success: boolean; message: string }> {
    try {
      const recipients = Array.isArray(data.recipients) ? data.recipients : [data.recipients];
      
      const mailOptions = {
        from: config.emailConfig.auth.user,
        to: recipients.join(', '),
        subject: `[BSI System] ${data.title}`,
        html: this.generateErrorHtml(data)
      };

      await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        message: 'Email enviado correctamente'
      };
    } catch (error: any) {
      console.error('Error enviando email:', error);
      return {
        success: false,
        message: `Error enviando email: ${error.message}`
      };
    }
  }

  public async sendErrorNotificationSimple(title: string, errorMessage: string, friendlyDescription: string): Promise<{ success: boolean; message: string }> {
    return this.sendErrorNotification({
      title,
      errorType: 'error',
      errorMessage,
      friendlyDescription,
      recipients: [config.mails.admin, config.mails.control]
    });
  }

  public async sendWarningNotification(title: string, errorMessage: string, friendlyDescription: string): Promise<{ success: boolean; message: string }> {
    return this.sendErrorNotification({
      title,
      errorType: 'warning',
      errorMessage,
      friendlyDescription,
      recipients: [config.mails.admin, config.mails.control]
    });
  }

  public async sendInfoNotification(title: string, errorMessage: string, friendlyDescription: string): Promise<{ success: boolean; message: string }> {
    return this.sendErrorNotification({
      title,
      errorType: 'success',
      errorMessage,
      friendlyDescription,
      recipients: [config.mails.admin, config.mails.control]
    });
  }

  public async sendCustomEmail(to: string | string[], subject: string, html: string): Promise<{ success: boolean; message: string }> {
    try {
      const recipients = Array.isArray(to) ? to : [to];
      
      const mailOptions = {
        from: config.emailConfig.auth.user,
        to: recipients.join(', '),
        subject: subject,
        html: html
      };

      await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        message: 'Email enviado correctamente'
      };
    } catch (error: any) {
      console.error('Error enviando email:', error);
      return {
        success: false,
        message: `Error enviando email: ${error.message}`
      };
    }
  }
}

export default EmailService.getInstance();
