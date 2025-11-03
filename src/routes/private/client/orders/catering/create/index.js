const express = require('express');
const router = express.Router();

/*
Create a catering order
{
  "restaurantId": "required: <number>",
  "eventDate": "required: <string> YYYY-MM-DD",
  "eventStartTime": "optional: <string> HH:MM",
  "eventEndTime": "optional: <string> HH:MM",
  "deliveryMethod": "required: <string> pickup | drop-off",
  "deliveryAddress": "optional: <string> Required if drop-off",
  "deliveryLatitude": "optional: <number> Required if drop-off",
  "deliveryLongitude": "optional: <number> Required if drop-off",
  "specialRequests": "optional: <string>",
  "items": "required: <array> [{menuItemId, quantity}]"
}
*/

// POST /private/client/orders/catering/create

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;
      const mClient = await req.client;

      // Validate restaurant ID
      const restaurantId = req.getCommonDataInt('restaurantId', null);
      if(!App.isPosNumber(restaurantId)){
        return App.json(res, 417, App.t(['Restaurant ID is required'], req.lang));
      }

      // Validate event date
      const eventDate = req.getCommonDataString('eventDate', '').trim();
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if(!dateRegex.test(eventDate)){
        return App.json(res, 417, App.t(['Invalid date format. Use YYYY-MM-DD'], req.lang));
      }

      // Check if date is in future
      const eventDateTime = new Date(eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if(eventDateTime < today){
        return App.json(res, 417, App.t(['Event date must be in the future'], req.lang));
      }

      // Validate delivery method
      const deliveryMethod = req.getCommonDataString('deliveryMethod', '').toLowerCase();
      const CATERING_DELIVERY_METHODS = App.getDictByName('CATERING_DELIVERY_METHODS');
      if(!CATERING_DELIVERY_METHODS.includes(deliveryMethod)){
        return App.json(res, 417, App.t(['Delivery method must be pickup or drop-off'], req.lang));
      }

      // If drop-off, validate delivery address
      let deliveryAddress = null;
      let deliveryLatitude = null;
      let deliveryLongitude = null;

      if(deliveryMethod === 'drop-off'){
        deliveryAddress = req.getCommonDataString('deliveryAddress', '').trim();
        deliveryLatitude = parseFloat(data.deliveryLatitude);
        deliveryLongitude = parseFloat(data.deliveryLongitude);

        if(!deliveryAddress || deliveryAddress.length < 10){
          return App.json(res, 417, App.t(['Delivery address is required for drop-off'], req.lang));
        }

        if(!App.isNumber(deliveryLatitude) || !App.isNumber(deliveryLongitude)){
          return App.json(res, 417, App.t(['Delivery coordinates are required for drop-off'], req.lang));
        }
      }

      // Optional fields
      const eventStartTime = req.getCommonDataString('eventStartTime', null);
      const eventEndTime = req.getCommonDataString('eventEndTime', null);
      const specialRequests = req.getCommonDataString('specialRequests', '').substr(0, 2000);

      // Validate items array
      if(!Array.isArray(data.items) || data.items.length === 0){
        return App.json(res, 417, App.t(['At least one menu item is required'], req.lang));
      }

      // Check if restaurant exists
      const Restaurant = App.getModel('Restaurant');
      const mRestaurant = await Restaurant.findByPk(restaurantId);
      if(!mRestaurant){
        return App.json(res, 404, App.t(['Restaurant not found'], req.lang));
      }

      // Check if restaurant has catering enabled
      const RestaurantOrderTypeSettings = App.getModel('RestaurantOrderTypeSettings');
      const cateringSettings = await RestaurantOrderTypeSettings.findOne({
        where: {
          restaurantId,
          orderType: 'catering',
          isEnabled: true
        }
      });

      if(!cateringSettings){
        return App.json(res, 417, App.t(['Restaurant does not offer catering'], req.lang));
      }

      // Check if date is available
      const RestaurantUnavailableDates = App.getModel('RestaurantUnavailableDates');
      const isDateAvailable = await RestaurantUnavailableDates.isDateAvailable(restaurantId, eventDate);

      if(!isDateAvailable){
        return App.json(res, 417, App.t(['Selected date is not available for this restaurant'], req.lang));
      }

      // Note: Lead time validation removed - payment schedule will adjust automatically
      // If event is less than 10 days away, first payment is due immediately
      // If event is less than 3 days away, both payments are due immediately

      // Check for existing unaccepted catering orders for the same restaurant
      const statuses = App.getModel('Order').getStatuses();
      const orderTypes = App.getModel('Order').getOrderTypes();

      const existingUnacceptedOrder = await App.getModel('Order').findOne({
        where: {
          clientId: mClient.id,
          orderType: orderTypes['catering'],
          status: {
            [App.DB.Op.or]: [statuses['created'], statuses['processing']]
          }
        },
        include: [{
          model: App.getModel('OrderSupplier'),
          as: 'OrderSuppliers',
          where: {
            restaurantId,
            isAcceptedByRestaurant: false
          },
          attributes: ['restaurantId', 'isAcceptedByRestaurant']
        }, {
          model: App.getModel('OrderCateringDetails'),
          as: 'OrderCateringDetails',
          where: {
            restaurantAcceptedAt: null
          },
          attributes: ['id', 'restaurantAcceptedAt'],
          required: false
        }]
      });

      if(existingUnacceptedOrder){
        return App.json(res, 417, App.t([
          'You already have a pending catering order for this restaurant. Please wait for the restaurant to respond.'
        ], req.lang));
      }

      // Validate and calculate pricing for all items
      const CateringMenuItem = App.getModel('CateringMenuItem');
      const MenuItem = App.getModel('MenuItem');
      const OrderCateringDetails = App.getModel('OrderCateringDetails');

      const validatedItems = [];
      let totalBasePrice = 0;
      let totalPeopleServed = 0;

      for(const orderItem of data.items){
        const menuItemId = parseInt(orderItem.menuItemId);
        const quantity = parseInt(orderItem.quantity);

        if(!App.isPosNumber(menuItemId) || !App.isPosNumber(quantity)){
          return App.json(res, 417, App.t(['Invalid item data'], req.lang));
        }

        // Get catering menu item
        const cateringMenuItem = await CateringMenuItem.findOne({
          where: {
            menuItemId,
            isDeleted: false,
            isAvailableForCatering: true
          },
          include: [{
            model: MenuItem,
            as: 'MenuItem',
            where: {
              restaurantId,
              isAvailable: true,
              isDeleted: false
            },
            required: true
          }]
        });

        if(!cateringMenuItem){
          return App.json(res, 417, App.t(['Menu item not available for catering'], req.lang));
        }

        // Check lead time
        if(!CateringMenuItem.meetsLeadTimeRequirement(cateringMenuItem, eventDate)){
          return App.json(res, 417, App.t([
            `${cateringMenuItem.MenuItem.name} requires ${cateringMenuItem.leadTimeDays} days advance notice`
          ], req.lang));
        }

        // Check minimum quantity
        const qtyValidation = CateringMenuItem.validateMinimumQuantity(cateringMenuItem, quantity);
        if(!qtyValidation.success){
          return App.json(res, 417, App.t([qtyValidation.message], req.lang));
        }

        const effectivePrice = cateringMenuItem.cateringPrice || cateringMenuItem.MenuItem.price;
        const subtotal = effectivePrice * quantity;
        const peopleServed = cateringMenuItem.feedsPeople * quantity;

        totalBasePrice += subtotal;
        totalPeopleServed += peopleServed;

        validatedItems.push({
          cateringMenuItem,
          menuItem: cateringMenuItem.MenuItem,
          quantity,
          effectivePrice,
          subtotal
        });
      }

      // Calculate service fee and total
      const serviceFeePercentage = cateringSettings.serviceFeePercentage || 15;
      const serviceFee = (totalBasePrice * serviceFeePercentage) / 100;
      const totalPrice = totalBasePrice + serviceFee;

      // Calculate payment schedule
      const paymentSchedule = OrderCateringDetails.calculatePaymentSchedule(eventDate, totalPrice);

      // Start transaction
      const tx = await App.DB.sequelize.transaction(App.DB.getTxOptions());

      try {

        // Create the order
        let mOrder = await App.getModel('Order').create({
          clientId: mClient.id,
          orderType: orderTypes['catering'],
          status: statuses['created'],
          totalPrice: totalBasePrice,
          deliveryPrice: 0,
          finalPrice: totalPrice,
          totalItems: validatedItems.length,
          discountAmount: 0,
          discountCode: '',
          discountType: '',
          clientDescription: specialRequests,
          isFreeDelivery: false,
          isPaid: false,
          isRefunded: false
        }, { transaction: tx });

        if(!mOrder || !App.isPosNumber(mOrder.id)){
          await tx.rollback();
          return App.json(res, false, App.t(['Failed to create order'], req.lang));
        }

        // Calculate acceptance deadline (24 hours)
        const acceptanceDeadline = OrderCateringDetails.calculate24HourDeadline();

        // Create catering details
        const mCateringDetails = await App.getModel('OrderCateringDetails').create({
          orderId: mOrder.id,
          eventDate,
          eventStartTime,
          eventEndTime,
          deliveryMethod,
          deliveryAddress,
          deliveryLatitude,
          deliveryLongitude,
          estimatedTotalPeople: totalPeopleServed,
          specialRequests,
          estimatedBasePrice: totalBasePrice,
          estimatedServiceFee: serviceFee,
          estimatedTotalPrice: totalPrice,
          firstPaymentAmount: paymentSchedule.firstPaymentAmount,
          firstPaymentDueDate: paymentSchedule.firstPaymentDueDate,
          secondPaymentAmount: paymentSchedule.secondPaymentAmount,
          secondPaymentDueDate: paymentSchedule.secondPaymentDueDate,
          acceptanceDeadline
        }, { transaction: tx });

        if(!mCateringDetails || !App.isPosNumber(mCateringDetails.id)){
          await tx.rollback();
          return App.json(res, false, App.t(['Failed to create catering details'], req.lang));
        }

        // Create OrderSupplier record
        let mOrderSupplier = await App.getModel('OrderSupplier').create({
          orderId: mOrder.id,
          restaurantId,
          totalPrice: totalBasePrice,
          totalItems: validatedItems.length,
          isTakenByCourier: false,
          isCanceledByRestaurant: false,
          isAcceptedByRestaurant: false,
          isOrderReady: false,
          isAppliedToBalance: false
        }, { transaction: tx });

        if(!mOrderSupplier || !App.isPosNumber(mOrderSupplier.id)){
          await tx.rollback();
          return App.json(res, false, App.t(['Failed to create order supplier'], req.lang));
        }

        // Calculate and update OrderSupplier checksum
        const calculatedChecksum = App.getModel('OrderSupplier').getChecksum(mOrderSupplier);
        mOrderSupplier = await mOrderSupplier.update({
          checksum: calculatedChecksum
        }, { transaction: tx });

        if(!mOrderSupplier.isValidChecksum){
          console.error('OrderSupplier checksum validation failed after update');
          console.error('Calculated:', calculatedChecksum);
          console.error('Stored:', mOrderSupplier.getDataValue('checksum'));
          await tx.rollback();
          return App.json(res, false, App.t(['Failed to validate order supplier checksum'], req.lang));
        }

        // Create OrderSupplierItems for each menu item
        for(const item of validatedItems){
          const mOrderSupplierItem = await App.getModel('OrderSupplierItem').create({
            orderSupplierId: mOrderSupplier.id,
            restaurantId: restaurantId,
            menuItemId: item.menuItem.id,
            amount: item.quantity,
            price: item.effectivePrice,
            totalPrice: item.subtotal
          }, { transaction: tx });

          if(!mOrderSupplierItem){
            await tx.rollback();
            return App.json(res, false, App.t(['Failed to create order items'], req.lang));
          }
        }

        // Create OrderPaymentType with client's default payment method
        const defaultPaymentCard = await App.getModel('PaymentCard').findOne({
          where: {
            clientId: mClient.id,
            isDefault: true,
            isDeleted: false
          }
        });

        if(defaultPaymentCard){
          await App.getModel('OrderPaymentType').create({
            orderId: mOrder.id,
            paymentCardId: defaultPaymentCard.id,
            type: 'Card'
          }, { transaction: tx });
        }

        // Update order checksum before commit
        mOrder = await mOrder.update({ checksum: true }, { transaction: tx });

        if(!App.isObject(mOrder) || !App.isPosNumber(mOrder.id)){
          await tx.rollback();
          return App.json(res, false, App.t(['Failed to finalize order'], req.lang));
        }

        // Commit transaction
        await tx.commit();

        // Fetch the order with catering details included (consistent with on-site-presence)
        mOrder = await App.getModel('Order').findByPk(mOrder.id, {
          include: [
            {
              model: App.getModel('OrderCateringDetails'),
              as: 'OrderCateringDetails'
            }
          ]
        });

        // Return order directly (consistent with /orders/create and /orders/on-site-presence/create endpoints)
        await App.json(res, true, App.t(['Catering order created successfully'], req.lang), mOrder);

        // Update client statistics
        await mClient.update({
          totalOrders: (mClient.totalOrders + 1),
        });

      } catch(txError){
        await tx.rollback();
        console.log('Transaction error:', txError);
        return App.json(res, false, App.t(['Failed to create catering order'], req.lang));
      }

    }catch(e){
      console.log(e);
      return App.json(res, false, App.t('error', req.lang));
    }

  });

  return { router, method: 'post', autoDoc:{} };

};
