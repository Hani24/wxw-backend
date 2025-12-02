"use strict";

const brevo = require('@getbrevo/brevo');
const logger = require('mii-logger.js');

/**
 * Brevo Email Service
 * Handles transactional email sending via Brevo (formerly Sendinblue) API
 */
module.exports = class BrevoMailer {

  constructor(App, params = {}) {
    this.App = App;
    this.params = params;
    this.apiInstance = null;
    this.isEnabled = false;
    this._init();
  }

  _init() {
    console.line();
    console.info(` #BrevoMailer:init`);

    const BREVO_API_KEY = this.App.getEnv('BREVO_API_KEY') || false;
    const BREVO_ENABLED = this.App.getEnvAsBool('BREVO_ENABLED');

    if (!BREVO_ENABLED) {
      console.warn(` #BrevoMailer: Disabled (BREVO_ENABLED=false)`);
      return;
    }

    if (!BREVO_API_KEY) {
      console.error(` #BrevoMailer: Missing BREVO_API_KEY environment variable`);
      return;
    }

    try {
      // Initialize Brevo API client
      this.apiInstance = new brevo.TransactionalEmailsApi();
      this.apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);
      this.isEnabled = true;

      console.ok(` #BrevoMailer:initialized successfully`);
      this.App.emit('BrevoMailer:ready');
    } catch (e) {
      console.error(` #BrevoMailer:init error: ${e.message}`);
      console.error(e);
    }
  }

  /**
   * Validate if email should be sent (checks for valid email only)
   * @param {Object} user - User object with email field
   * @returns {Object} Result with isValid, email, and reason
   */
  validateEmailRecipient(user) {
    // Check if user exists
    if (!user) {
      return {
        isValid: false,
        reason: 'User object is null or undefined'
      };
    }

    // Check if email exists
    if (!user.email || typeof user.email !== 'string') {
      return {
        isValid: false,
        reason: 'User has no email address'
      };
    }

    // Validate email format
    const normalizedEmail = this.App.tools.normalizeEmail(user.email);
    if (!normalizedEmail || !this.App.tools.isValidEmail(normalizedEmail)) {
      return {
        isValid: false,
        reason: 'User email address is invalid'
      };
    }

    return {
      isValid: true,
      email: normalizedEmail
    };
  }

  /**
   * Send email via Brevo
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email address
   * @param {string} options.toName - Recipient name (optional)
   * @param {string} options.subject - Email subject
   * @param {string} options.htmlContent - HTML content
   * @param {string} options.textContent - Plain text content (optional)
   * @param {Object} options.params - Template parameters (optional)
   * @param {number} options.templateId - Brevo template ID (optional)
   * @param {boolean} options.dryRun - Test mode without sending (default: false)
   * @returns {Promise<Object>} Result object with success status
   */
  async send({
    to = false,
    toName = '',
    subject = 'no-subject',
    htmlContent = '',
    textContent = '',
    params = {},
    templateId = null,
    dryRun = false
  } = {}) {

    return new Promise(async (resolve, reject) => {
      try {

        // Check if Brevo is enabled
        if (!this.isEnabled) {
          return resolve({
            success: false,
            message: 'Brevo mailer is not enabled or not initialized'
          });
        }

        // Validate email address
        to = this.App.tools.normalizeEmail(to);
        if (!to || !this.App.tools.isValidEmail(to)) {
          return resolve({
            success: false,
            message: 'Invalid email address provided'
          });
        }

        // Validate content
        if (!templateId && !htmlContent && !textContent) {
          return resolve({
            success: false,
            message: 'Either templateId or htmlContent/textContent must be provided'
          });
        }

        // Get sender configuration from environment
        const BREVO_SENDER_EMAIL = this.App.getEnv('BREVO_SENDER_EMAIL') || this.App.getEnv('SMTP_EMAIL_EMAIL') || 'noreply@example.com';
        const BREVO_SENDER_NAME = this.App.getEnv('BREVO_SENDER_NAME') || this.App.getEnv('SMTP_EMAIL_FROM') || 'DeliveryDelight';

        // Dry run mode - return without sending
        if (dryRun) {
          return resolve({
            success: true,
            message: 'Dry-Run mode',
            data: {
              from: { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME },
              to: [{ email: to, name: toName }],
              subject: subject,
              htmlContent: htmlContent,
              textContent: textContent,
              templateId: templateId,
              params: params
            }
          });
        }

        // Prepare send email object
        const sendSmtpEmail = new brevo.SendSmtpEmail();

        sendSmtpEmail.sender = {
          email: BREVO_SENDER_EMAIL,
          name: BREVO_SENDER_NAME
        };

        sendSmtpEmail.to = [{
          email: to,
          name: toName || to.split('@')[0]
        }];

        sendSmtpEmail.subject = subject;

        // Use template or content
        if (templateId) {
          sendSmtpEmail.templateId = templateId;
          sendSmtpEmail.params = params;
        } else {
          sendSmtpEmail.htmlContent = htmlContent;
          if (textContent) {
            sendSmtpEmail.textContent = textContent;
          }
        }

        // Send the email
        const data = await this.apiInstance.sendTransacEmail(sendSmtpEmail);

        console.ok(` #BrevoMailer: Email sent successfully to ${to}`);

        resolve({
          success: true,
          message: 'Email sent successfully',
          data: {
            messageId: data.messageId,
            to: to,
            subject: subject
          }
        });

      } catch (e) {
        console.error(` #BrevoMailer:send error: ${e.message}`);
        console.error(e);

        // Check if it's a Brevo API error
        if (e.response && e.response.body) {
          return resolve({
            success: false,
            message: 'Brevo API error',
            error: e.response.body
          });
        }

        resolve({
          success: false,
          message: 'Failed to send email',
          error: e.message
        });
      }
    });
  }

  /**
   * Send order notification email to client
   * @param {Object} options - Email options
   * @param {string} options.to - Client email
   * @param {string} options.clientName - Client name
   * @param {number} options.orderId - Order ID
   * @param {string} options.type - Notification type (created, accepted, rejected, ready)
   * @param {Object} options.data - Additional data for the email
   * @returns {Promise<Object>} Result object
   */
  async sendOrderNotification({
    to,
    clientName = '',
    orderId,
    type,
    data = {}
  } = {}) {

    try {
      // Generate email content based on type
      let subject = '';
      let htmlContent = '';

      switch (type) {
        case 'created':
          subject = `Order Confirmation #${orderId}`;
          htmlContent = this._generateOrderCreatedEmail({ orderId, clientName, data });
          break;

        case 'accepted':
          subject = `Order Accepted #${orderId}`;
          htmlContent = this._generateOrderAcceptedEmail({ orderId, clientName, data });
          break;

        case 'rejected':
          subject = `Order Rejected #${orderId}`;
          htmlContent = this._generateOrderRejectedEmail({ orderId, clientName, data });
          break;

        case 'ready':
          subject = `Order Ready for Pickup #${orderId}`;
          htmlContent = this._generateOrderReadyEmail({ orderId, clientName, data });
          break;

        case 'delayed':
          subject = `Order Delayed #${orderId}`;
          htmlContent = this._generateOrderDelayedEmail({ orderId, clientName, data });
          break;

        default:
          throw new Error(`Unknown notification type: ${type}`);
      }

      return await this.send({
        to,
        toName: clientName,
        subject,
        htmlContent
      });

    } catch (e) {
      console.error(` #BrevoMailer:sendOrderNotification error: ${e.message}`);
      return {
        success: false,
        message: e.message
      };
    }
  }

  /**
   * Generate HTML for order created email
   */
  _generateOrderCreatedEmail({ orderId, clientName, data }) {
    const { orderType, restaurantName, totalPrice, eventDate } = data;

    let orderDetails = '';
    if (orderType === 'catering' || orderType === 'on-site-presence') {
      orderDetails = `
        <p><strong>Order Type:</strong> ${this._formatOrderType(orderType)}</p>
        <p><strong>Event Date:</strong> ${eventDate || 'Not specified'}</p>
        <p><strong>Total Price:</strong> $${totalPrice}</p>
        <p style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
          <strong>⏰ Important:</strong> The restaurant has 24 hours to accept your order. You will receive a notification once they respond.
        </p>
      `;
    } else {
      orderDetails = `
        <p><strong>Total Price:</strong> $${totalPrice}</p>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Order Confirmed!</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${clientName || 'there'},</p>
          <p>Thank you for your order! Your order has been received and is being processed.</p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #4CAF50; margin-top: 0;">Order #${orderId}</h2>
            <p><strong>Restaurant:</strong> ${restaurantName || 'N/A'}</p>
            ${orderDetails}
          </div>

          ${orderType === 'catering' || orderType === 'on-site-presence' ? `
          <p>You will receive email notifications when:</p>
          <ul>
            <li>The restaurant accepts or rejects your order</li>
            <li>Your order is ready for pickup or delivery</li>
          </ul>
          ` : `
          <p>The restaurant is now preparing your order. You will receive a notification when it's ready!</p>
          `}

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              If you have any questions, please don't hesitate to contact us.
            </p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} DeliveryDelight. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for order accepted email
   */
  _generateOrderAcceptedEmail({ orderId, clientName, data }) {
    const { restaurantName, eventDate, orderType } = data;

    let paymentInfo = '';
    if (orderType === 'catering' || orderType === 'on-site-presence') {
      paymentInfo = `
        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #2e7d32; margin-top: 0;">Payment Schedule</h3>
          <p>Please review your payment schedule:</p>
          <ul>
            <li><strong>First Payment (50%):</strong> Due 10 days before event</li>
            <li><strong>Second Payment (50%):</strong> Due 3 days before event</li>
          </ul>
          <p style="font-size: 14px; color: #666;">You will receive separate payment reminders.</p>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">✅ Order Accepted!</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${clientName || 'there'},</p>
          <p>Great news! Your order has been accepted by the restaurant.</p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #4CAF50; margin-top: 0;">Order #${orderId}</h2>
            <p><strong>Restaurant:</strong> ${restaurantName || 'N/A'}</p>
            <p><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">Accepted & Processing</span></p>
            ${eventDate ? `<p><strong>Event Date:</strong> ${eventDate}</p>` : ''}
          </div>

          ${paymentInfo}

          <p>The restaurant is now preparing your order. You will receive another notification when it's ready!</p>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Thank you for choosing us!
            </p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} DeliveryDelight. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for order rejected email
   */
  _generateOrderRejectedEmail({ orderId, clientName, data }) {
    const { restaurantName, rejectionReason, refundAmount, isRefunded } = data;

    let refundInfo = '';
    if (isRefunded) {
      refundInfo = `
        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1976d2; margin-top: 0;">💳 Refund Information</h3>
          <p>A refund of <strong>$${refundAmount}</strong> has been initiated to your original payment method.</p>
          <p style="font-size: 14px; color: #666;">Please allow 5-10 business days for the refund to appear in your account.</p>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Order Update</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${clientName || 'there'},</p>
          <p>We regret to inform you that your order could not be accepted by the restaurant.</p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #f44336; margin-top: 0;">Order #${orderId}</h2>
            <p><strong>Restaurant:</strong> ${restaurantName || 'N/A'}</p>
            <p><strong>Status:</strong> <span style="color: #f44336; font-weight: bold;">Rejected</span></p>
            ${rejectionReason ? `
              <div style="margin-top: 15px; padding: 10px; background-color: #fff3e0; border-left: 4px solid #ff9800;">
                <p style="margin: 0;"><strong>Reason:</strong> ${rejectionReason}</p>
              </div>
            ` : ''}
          </div>

          ${refundInfo}

          <p>We apologize for any inconvenience. Please feel free to place a new order with another restaurant.</p>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              If you have any questions about this rejection or your refund, please contact our support team.
            </p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} DeliveryDelight. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for order ready email
   */
  _generateOrderReadyEmail({ orderId, clientName, data }) {
    const { restaurantName, hasDelivery, courierAssigned } = data;

    let deliveryInfo = '';
    if (hasDelivery && courierAssigned) {
      deliveryInfo = `
        <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;">
            🚗 <strong>Your order is being delivered!</strong> A driver is on the way to deliver your order.
          </p>
        </div>
      `;
    } else if (!hasDelivery) {
      deliveryInfo = `
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;">
            📍 <strong>Ready for pickup!</strong> Please come to the restaurant to collect your order.
          </p>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">🎉 Order Ready!</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${clientName || 'there'},</p>
          <p>Your order is ready!</p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #FF9800; margin-top: 0;">Order #${orderId}</h2>
            <p><strong>Restaurant:</strong> ${restaurantName || 'N/A'}</p>
            <p><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">Ready</span></p>
          </div>

          ${deliveryInfo}

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Enjoy your meal!
            </p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} DeliveryDelight. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for order delayed email
   */
  _generateOrderDelayedEmail({ orderId, clientName, data }) {
    const { restaurantName, delayMinutes, totalDelayMinutes, newDeliveryTime } = data;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">⏰ Order Delayed</h1>
        </div>
        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <p>Hi ${clientName || 'there'},</p>
          <p>We wanted to inform you about a delay with your order.</p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #FF9800; margin-top: 0;">Order #${orderId}</h2>
            <p><strong>Restaurant:</strong> ${restaurantName || 'N/A'}</p>
            <p><strong>Additional Delay:</strong> <span style="color: #FF9800; font-weight: bold;">${delayMinutes} minutes</span></p>
            ${totalDelayMinutes ? `<p><strong>Total Delay:</strong> ${totalDelayMinutes} minutes</p>` : ''}
            ${newDeliveryTime ? `<p><strong>New Estimated Delivery:</strong> ${newDeliveryTime}</p>` : ''}
          </div>

          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">
              We apologize for the inconvenience. Your order is being prepared with care and will be ready soon.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 14px;">
              Thank you for your patience and understanding.
            </p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} DeliveryDelight. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Helper to format order type
   */
  _formatOrderType(type) {
    const types = {
      'order-now': 'Regular Order',
      'catering': 'Catering',
      'on-site-presence': 'On-Site Presence'
    };
    return types[type] || type;
  }

};
