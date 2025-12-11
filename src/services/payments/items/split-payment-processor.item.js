/**
 * Split Payment Processor Service
 * Handles second payment processing for catering and on-site-presence orders
 *
 * Payment Schedule:
 * - First Payment: 50% charged at order confirmation (10 days before event or immediately)
 * - Second Payment: 50% charged 3 days before event (or immediately if event is < 3 days away)
 */

const logger = require('mii-logger.js');

class SplitPaymentProcessor {
  constructor(App) {
    this.App = App;
  }

  /**
   * Process second payment for a catering order
   * @param {number} orderId - Order ID
   * @returns {Promise<{success: boolean, message: string, data: object}>}
   */
  async processCateringSecondPayment(orderId) {
    try {
      const ORDER_TYPES = this.App.getModel('Order').getOrderTypes();

      // Get order details
      const mOrder = await this.App.getModel('Order').findOne({
        where: {
          id: orderId,
          orderType: ORDER_TYPES['catering']
        },
        include: [{
          model: this.App.getModel('OrderCateringDetails'),
          as: 'OrderCateringDetails'
        }, {
          model: this.App.getModel('OrderPaymentType'),
          include: [{
            model: this.App.getModel('PaymentCard')
          }]
        }, {
          model: this.App.getModel('Client')
        }]
      });

      if (!this.App.isObject(mOrder)) {
        return this._response(false, 'Order not found');
      }

      // Validate order status - don't process second payment for refunded/canceled orders
      if (mOrder.status === 'refunded' || mOrder.status === 'canceled' || mOrder.status === 'cancelled') {
        return this._response(false, `Cannot process second payment - order is ${mOrder.status}`);
      }

      if (!mOrder.OrderCateringDetails) {
        return this._response(false, 'Catering details not found');
      }

      const cateringDetails = mOrder.OrderCateringDetails;

      // Validate that first payment is completed
      if (!cateringDetails.firstPaymentPaidAt) {
        return this._response(false, 'First payment not completed yet');
      }

      // Check if second payment already processed
      if (cateringDetails.secondPaymentPaidAt) {
        return this._response(false, 'Second payment already processed', {
          secondPaymentPaidAt: cateringDetails.secondPaymentPaidAt
        });
      }

      // Check if second payment is due
      if (!this.App.getModel('OrderCateringDetails').isSecondPaymentDue(cateringDetails)) {
        return this._response(false, 'Second payment is not due yet', {
          secondPaymentDueDate: cateringDetails.secondPaymentDueDate
        });
      }

      // Process the payment
      return await this._processSecondPayment(mOrder, cateringDetails, 'catering');

    } catch (e) {
      logger.error(`processCateringSecondPayment: ${e.message}`);
      return this._response(false, e.message);
    }
  }

  /**
   * Process second payment for an on-site-presence order
   * @param {number} orderId - Order ID
   * @returns {Promise<{success: boolean, message: string, data: object}>}
   */
  async processOnSitePresenceSecondPayment(orderId) {
    try {
      const ORDER_TYPES = this.App.getModel('Order').getOrderTypes();

      // Get order details
      const mOrder = await this.App.getModel('Order').findOne({
        where: {
          id: orderId,
          orderType: ORDER_TYPES['on-site-presence']
        },
        include: [{
          model: this.App.getModel('OrderOnSitePresenceDetails'),
          as: 'OrderOnSitePresenceDetails'
        }, {
          model: this.App.getModel('OrderPaymentType'),
          include: [{
            model: this.App.getModel('PaymentCard')
          }]
        }, {
          model: this.App.getModel('Client')
        }]
      });

      if (!this.App.isObject(mOrder)) {
        return this._response(false, 'Order not found');
      }

      // Validate order status - don't process second payment for refunded/canceled orders
      if (mOrder.status === 'refunded' || mOrder.status === 'canceled' || mOrder.status === 'cancelled') {
        return this._response(false, `Cannot process second payment - order is ${mOrder.status}`);
      }

      if (!mOrder.OrderOnSitePresenceDetails) {
        return this._response(false, 'On-site presence details not found');
      }

      const onSiteDetails = mOrder.OrderOnSitePresenceDetails;

      // Validate that first payment is completed
      if (!onSiteDetails.firstPaymentPaidAt) {
        return this._response(false, 'First payment not completed yet');
      }

      // Check if second payment already processed
      if (onSiteDetails.secondPaymentPaidAt) {
        return this._response(false, 'Second payment already processed', {
          secondPaymentPaidAt: onSiteDetails.secondPaymentPaidAt
        });
      }

      // Check if second payment is due
      if (!this.App.getModel('OrderOnSitePresenceDetails').isSecondPaymentDue(onSiteDetails)) {
        return this._response(false, 'Second payment is not due yet', {
          secondPaymentDueDate: onSiteDetails.secondPaymentDueDate
        });
      }

      // Process the payment
      return await this._processSecondPayment(mOrder, onSiteDetails, 'on-site-presence');

    } catch (e) {
      logger.error(`processOnSitePresenceSecondPayment: ${e.message}`);
      return this._response(false, e.message);
    }
  }

  /**
   * Process second payment for any order type
   * @param {number} orderId - Order ID
   * @returns {Promise<{success: boolean, message: string, data: object}>}
   */
  async processSecondPayment(orderId) {
    try {
      const ORDER_TYPES = this.App.getModel('Order').getOrderTypes();

      // Get basic order info to determine type
      const mOrder = await this.App.getModel('Order').findOne({
        where: { id: orderId },
        attributes: ['id', 'orderType']
      });

      if (!this.App.isObject(mOrder)) {
        return this._response(false, 'Order not found');
      }

      // Route to appropriate processor based on order type
      if (mOrder.orderType === ORDER_TYPES['catering']) {
        return await this.processCateringSecondPayment(orderId);
      } else if (mOrder.orderType === ORDER_TYPES['on-site-presence']) {
        return await this.processOnSitePresenceSecondPayment(orderId);
      } else {
        return this._response(false, 'Order type does not support split payments');
      }

    } catch (e) {
      logger.error(`processSecondPayment: ${e.message}`);
      return this._response(false, e.message);
    }
  }

  /**
   * Find all orders with due second payments
   * @returns {Promise<Array>} Array of order IDs with due second payments
   */
  async findOrdersWithDueSecondPayments() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const ORDER_TYPES = this.App.getModel('Order').getOrderTypes();
      const dueOrders = [];

      // Find catering orders with due second payments
      const cateringOrders = await this.App.getModel('OrderCateringDetails').findAll({
        where: {
          firstPaymentPaidAt: { [this.App.DB.Op.not]: null },
          secondPaymentPaidAt: null,
          secondPaymentDueDate: { [this.App.DB.Op.lte]: todayStr }
        },
        include: [{
          model: this.App.getModel('Order'),
          as: 'Order',
          where: {
            orderType: ORDER_TYPES['catering']
          },
          attributes: ['id', 'orderType', 'clientId']
        }]
      });

      cateringOrders.forEach(details => {
        if (details.Order) {
          dueOrders.push({
            orderId: details.Order.id,
            orderType: 'catering',
            secondPaymentAmount: details.secondPaymentAmount,
            secondPaymentDueDate: details.secondPaymentDueDate,
            eventDate: details.eventDate
          });
        }
      });

      // Find on-site-presence orders with due second payments
      const onSiteOrders = await this.App.getModel('OrderOnSitePresenceDetails').findAll({
        where: {
          firstPaymentPaidAt: { [this.App.DB.Op.not]: null },
          secondPaymentPaidAt: null,
          secondPaymentDueDate: { [this.App.DB.Op.lte]: todayStr }
        },
        include: [{
          model: this.App.getModel('Order'),
          as: 'Order',
          where: {
            orderType: ORDER_TYPES['on-site-presence']
          },
          attributes: ['id', 'orderType', 'clientId']
        }]
      });

      onSiteOrders.forEach(details => {
        if (details.Order) {
          dueOrders.push({
            orderId: details.Order.id,
            orderType: 'on-site-presence',
            secondPaymentAmount: details.secondPaymentAmount,
            secondPaymentDueDate: details.secondPaymentDueDate,
            eventDate: details.eventDate
          });
        }
      });

      return dueOrders;

    } catch (e) {
      logger.error(`findOrdersWithDueSecondPayments: ${e.message}`);
      return [];
    }
  }

  /**
   * Internal method to process second payment
   * @private
   */
  async _processSecondPayment(mOrder, details, orderType) {
    const tx = await this.App.DB.sequelize.transaction(this.App.DB.getTxOptions());

    try {
      // Get payment method
      const mOrderPaymentType = mOrder.OrderPaymentType;
      if (!this.App.isObject(mOrderPaymentType)) {
        throw new Error('Payment method not found');
      }

      const paymentTypes = this.App.getModel('OrderPaymentType').getTypes();

      // Only card payments are supported for second payment
      if (mOrderPaymentType.type !== paymentTypes.Card) {
        throw new Error('Only card payments are supported for second payment');
      }

      const mPaymentCard = mOrderPaymentType.PaymentCard;
      if (!this.App.isObject(mPaymentCard)) {
        throw new Error('Payment card not found');
      }

      // Get client and user info
      const mClient = mOrder.Client;
      if (!this.App.isObject(mClient)) {
        throw new Error('Client not found');
      }

      const mUser = await this.App.getModel('User').findOne({
        where: { clientId: mClient.id }
      });

      if (!this.App.isObject(mUser)) {
        throw new Error('User not found');
      }

      // Create payment intent for second payment
      const paymentAmount = Math.floor(details.secondPaymentAmount * 100); // Convert to cents
      const paymentDescription = orderType === 'catering'
        ? `Catering Order: #${mOrder.id} - Second Payment (50%)`
        : `On-Site Presence Order: #${mOrder.id} - Second Payment (50%)`;

      const paymentIntentConfig = {
        receipt_email: mUser.email,
        amount: paymentAmount,
        customer: mClient.customerId,
        payment_method: mPaymentCard.paymentMethodId,
        payment_method_types: ['card'],
        description: paymentDescription,
        metadata: {
          orderId: mOrder.id,
          orderType: mOrder.orderType,
          userId: mUser.id,
          clientId: mClient.id,
          paymentType: 'second_payment',
          firstPaymentIntentId: details.firstPaymentIntentId
        }
      };

      // Create payment intent
      const paymentIntentRes = await this.App.payments.stripe.paymentIntentCreate(paymentIntentConfig);
      if (!paymentIntentRes.success) {
        throw new Error(`Failed to create payment intent: ${paymentIntentRes.message}`);
      }

      const paymentIntentId = paymentIntentRes.data.id;

      // Confirm payment intent
      const paymentIntentConfirmRes = await this.App.payments.stripe.paymentIntentConfirm(paymentIntentId);
      if (!paymentIntentConfirmRes.success) {
        throw new Error(`Failed to confirm payment: ${paymentIntentConfirmRes.message}`);
      }

      // Update order details with second payment info
      await details.update({
        secondPaymentIntentId: paymentIntentId,
        secondPaymentPaidAt: this.App.getISODate()
      }, { transaction: tx });

      await tx.commit();

      logger.ok(`Second payment processed successfully for order #${mOrder.id}`);

      return this._response(true, 'Second payment processed successfully', {
        orderId: mOrder.id,
        orderType,
        secondPaymentIntentId: paymentIntentId,
        secondPaymentAmount: details.secondPaymentAmount,
        secondPaymentPaidAt: this.App.getISODate()
      });

    } catch (e) {
      await tx.rollback();
      logger.error(`_processSecondPayment: Order #${mOrder.id}: ${e.message}`);
      return this._response(false, e.message);
    }
  }

  /**
   * Helper to format response
   * @private
   */
  _response(success, message, data = {}) {
    return { success, message, data };
  }
}

module.exports = (App, name, params = {}) => {
  return new SplitPaymentProcessor(App);
};
