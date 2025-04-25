import nodemailer from 'nodemailer';
import { Logger } from '../../logging/Logger';
import { Config } from '../../../config/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Service for sending emails
 */
export class EmailService {
  private transporter!: nodemailer.Transporter;
  private logger = Logger.getInstance();

  constructor() {
    // Trong môi trường phát triển, sử dụng ethereal.email để test
    if (Config.NODE_ENV === 'development') {
      this.createTestAccount();
    } else {
      // Trong môi trường production, sử dụng SMTP server thật
      this.transporter = nodemailer.createTransport({
        host: Config.EMAIL_HOST,
        port: Config.EMAIL_PORT,
        secure: Config.EMAIL_SECURE,
        auth: {
          user: Config.EMAIL_USER,
          pass: Config.EMAIL_PASSWORD,
        },
      });
    }
  }

  /**
   * Create test account for development
   */
  private async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      this.logger.info('Test email account created');
    } catch (error) {
      this.logger.error(`Failed to create test email account: ${error}`);
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${Config.EMAIL_FROM_NAME}" <${Config.EMAIL_FROM_ADDRESS}>`,
        ...options,
      };

      const info = await this.transporter.sendMail(mailOptions);

      // Log email URL in development for testing
      if (Config.NODE_ENV === 'development') {
        this.logger.info(`Email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      this.logger.info(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error}`);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${Config.CLIENT_URL}/reset-password?token=${token}`;

    const html = `
      <h1>Reset Your Password</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html,
    });
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verifyUrl = `${Config.CLIENT_URL}/verify-email?token=${token}`;

    const html = `
      <h1>Verify Your Email</h1>
      <p>Click the link below to verify your email address:</p>
      <a href="${verifyUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Email Verification',
      html,
    });
  }
}
