const express = require('express');
const router = express.Router();

/*
Estimate catering order price
{
  "restaurantId": "required: <number>",
  "eventDate": "required: <string> YYYY-MM-DD",
  "deliveryMethod": "required: <string> pickup | drop-off",
  "items": "required: <array> [{menuItemId, quantity}]"
}
*/

// POST /private/client/orders/catering/estimate

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      // Validate restaurant ID
      const restaurantId = req.getCommonDataInt('restaurantId', null);
      if(!App.isPosNumber(restaurantId)){
        return App.json(res, 417, App.t(['field','[restaurantId]','is-required'], req.lang));
      }

      // Validate event date
      const eventDate = req.getCommonDataString('eventDate', '').trim();
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if(!dateRegex.test(eventDate)){
        return App.json(res, 417, App.t(['field','[eventDate]','must-be','YYYY-MM-DD','format'], req.lang));
      }

      // Check if date is in future
      const eventDateTime = new Date(eventDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if(eventDateTime < today){
        return App.json(res, 417, App.t(['Event','date','must-be','in','future'], req.lang));
      }

      // Validate delivery method
      const deliveryMethod = req.getCommonDataString('deliveryMethod', '').toLowerCase();
      const CATERING_DELIVERY_METHODS = App.getDictByName('CATERING_DELIVERY_METHODS');
      if(!CATERING_DELIVERY_METHODS.includes(deliveryMethod)){
        return App.json(res, 417, App.t(['field','[deliveryMethod]','must-be','pickup','or','drop-off'], req.lang));
      }

      // Validate items array
      if(!Array.isArray(data.items) || data.items.length === 0){
        return App.json(res, 417, App.t(['field','[items]','must-be','non-empty','array'], req.lang));
      }

      // Get restaurant
      const Restaurant = App.getModel('Restaurant');
      const restaurant = await Restaurant.findOne({
        where: {
          id: restaurantId,
          isVerified: true,
          isRestricted: false
        }
      });

      if(!restaurant){
        return App.json(res, 404, App.t(['Restaurant','not','found'], req.lang));
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
        return App.json(res, 404, App.t(['Restaurant','does-not','offer','catering'], req.lang));
      }

      // Check if date is available
      const RestaurantUnavailableDates = App.getModel('RestaurantUnavailableDates');
      const isAvailable = await RestaurantUnavailableDates.isDateAvailable(restaurantId, eventDate);

      if(!isAvailable){
        return App.json(res, 417, App.t(['Date','is','not','available','for','catering'], req.lang));
      }

      // Validate lead time for catering (minimum 10 days)
      const OrderCateringDetails = App.getModel('OrderCateringDetails');
      const leadTimeCheck = OrderCateringDetails.validateLeadTime(eventDate, 10);
      if(!leadTimeCheck.success){
        return App.json(res, 417, leadTimeCheck.message);
      }

      // Get catering menu items
      const CateringMenuItem = App.getModel('CateringMenuItem');
      const MenuItem = App.getModel('MenuItem');

      const itemsData = [];
      let totalBasePrice = 0;
      let totalPeopleServed = 0;
      const errors = [];

      for(const orderItem of data.items){
        const menuItemId = parseInt(orderItem.menuItemId);
        const quantity = parseInt(orderItem.quantity);

        if(!App.isPosNumber(menuItemId)){
          errors.push(`Invalid menuItemId: ${orderItem.menuItemId}`);
          continue;
        }

        if(!App.isPosNumber(quantity) || quantity < 1){
          errors.push(`Invalid quantity for menuItemId ${menuItemId}`);
          continue;
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
          errors.push(`Menu item ${menuItemId} not available for catering`);
          continue;
        }

        // Check lead time requirement
        if(!CateringMenuItem.meetsLeadTimeRequirement(cateringMenuItem, eventDate)){
          errors.push(`Menu item "${cateringMenuItem.MenuItem.name}" requires ${cateringMenuItem.leadTimeDays} days advance notice`);
          continue;
        }

        // Check minimum quantity
        const qtyValidation = CateringMenuItem.validateMinimumQuantity(cateringMenuItem, quantity);
        if(!qtyValidation.success){
          errors.push(`${cateringMenuItem.MenuItem.name}: ${qtyValidation.message}`);
          continue;
        }

        // Calculate prices
        const effectivePrice = cateringMenuItem.cateringPrice || cateringMenuItem.MenuItem.price;
        const subtotal = effectivePrice * quantity;
        const peopleServed = cateringMenuItem.feedsPeople * quantity;

        totalBasePrice += subtotal;
        totalPeopleServed += peopleServed;

        itemsData.push({
          menuItemId,
          cateringMenuItemId: cateringMenuItem.id,
          name: cateringMenuItem.MenuItem.name,
          description: cateringMenuItem.MenuItem.description,
          image: cateringMenuItem.MenuItem.image,
          quantity,
          pricePerItem: effectivePrice,
          subtotal: parseFloat(subtotal.toFixed(2)),
          feedsPeople: cateringMenuItem.feedsPeople,
          totalPeopleServed: peopleServed,
          minimumQuantity: cateringMenuItem.minimumQuantity,
          leadTimeDays: cateringMenuItem.leadTimeDays
        });
      }

      if(errors.length > 0){
        return App.json(res, 417, errors.join('; '));
      }

      if(itemsData.length === 0){
        return App.json(res, 417, App.t(['No','valid','items','in','order'], req.lang));
      }

      // Calculate service fee and total
      const serviceFeePercentage = cateringSettings.serviceFeePercentage || 15;
      const serviceFee = (totalBasePrice * serviceFeePercentage) / 100;
      const totalPrice = totalBasePrice + serviceFee;

      // Calculate payment schedule
      const paymentSchedule = OrderCateringDetails.calculatePaymentSchedule(eventDate, totalPrice);

      // Build response
      const estimate = {
        restaurantId,
        restaurantName: restaurant.name,
        eventDate,
        deliveryMethod,
        estimatedTotalPeople: totalPeopleServed,
        items: itemsData,
        pricing: {
          basePrice: parseFloat(totalBasePrice.toFixed(2)),
          serviceFee: parseFloat(serviceFee.toFixed(2)),
          serviceFeePercentage,
          totalPrice: parseFloat(totalPrice.toFixed(2))
        },
        paymentSchedule: {
          firstPayment: {
            amount: paymentSchedule.firstPaymentAmount,
            percentage: 50,
            dueDate: paymentSchedule.firstPaymentDueDate,
            description: '10 days before event - Non-refundable'
          },
          secondPayment: {
            amount: paymentSchedule.secondPaymentAmount,
            percentage: 50,
            dueDate: paymentSchedule.secondPaymentDueDate,
            description: '3 days before event - Non-refundable'
          }
        },
        breakdown: {
          itemsTotal: parseFloat(totalBasePrice.toFixed(2)),
          serviceFee: parseFloat(serviceFee.toFixed(2)),
          total: parseFloat(totalPrice.toFixed(2))
        }
      };

      return App.json(res, true, App.t('success', req.lang), estimate);

    }catch(e){
      console.log(e);
      return App.json(res, false, App.t('error', req.lang));
    }

  });

  return { router, method: 'post', autoDoc:{} };

};
