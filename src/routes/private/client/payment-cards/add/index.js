const express = require('express');
const router = express.Router();

/*
{
  "cardHolderName": "required: <string>: latin text only (max: 15 sym. name and 15 sym. last-name)",
  "cardNumber": "required: <string>: 16 characters",
  "cardExpiryDate": "required: <string>: eg: 03/27",
  "cardCVV": "required: <string>: 3 digits",
  "isOneTimeCard": "required: <boolean> if true: Card will exists only for [this] order"
}

{
  "cardHolderName": "tsimaschenka viacheslau",
  "cardNumber": "4242424242424242",
  "cardExpiryDate": "09/35",
  "cardCVV": "123",
  "isOneTimeCard": false
}
*/

// /private/client/payment-cards/add

module.exports = function (App, RPath) {

  router.use('', async (req, res) => {

    try {

      const mUser = await req.user;
      const mClient = await req.client;
      const data = req.getPost();

      const decPaymentCard_t = {};

      const validate_t = [
        {
          key: 'cardNumber',
          value: App.tools.cleanCardNumber(req.getCommonDataString('cardNumber', '')),
          message: ['Please', 'provide', 'valid', 'Card', 'number'],
        },
        {
          key: 'cardHolderName',
          value: App.tools.cleanName(req.getCommonDataString('cardHolderName', ''), true, true),
          message: ['Please', 'provide', 'valid', 'Card', 'holder', 'full', 'name'],
        },
        {
          key: 'cardExpiryDate',
          value: App.tools.cleanCardExpiryDate(req.getCommonDataString('cardExpiryDate', '')),
          message: ['Please', 'provide', 'valid', 'Card', 'expiry', 'date', 'eg: 08/24'],
        },
        {
          key: 'cardCVV',
          value: App.tools.cleanCardCVV(req.getCommonDataString('cardCVV', '')),
          message: ['Please', 'provide', 'valid', 'Card', 'cvv/cvc', 'number'],
        },
      ];

      for (const mVal of validate_t) {
        if (App.isNull(mVal.value) || !mVal.value)
          return App.json(res, 417, App.t(mVal.message, res.lang));
        decPaymentCard_t[mVal.key] = mVal.value;
      }

      // "one-time" payment
      decPaymentCard_t.isOneTimeCard = App.getBoolFromValue(data.isOneTimeCard);
      decPaymentCard_t.isDefault = decPaymentCard_t.isOneTimeCard ? false : true;
      decPaymentCard_t.cardHolderName = decPaymentCard_t.cardHolderName
        .replace(/(\s\s){1,}/g, ' ').trim();

      if (!decPaymentCard_t.isOneTimeCard) {
        const mCards = await App.getModel('PaymentCard').findAll({
          where: {
            clientId: mClient.id,
            isOneTimeCard: false,
            isDeleted: false,
          },
          attributes: ['id', 'encCardNumber'],
        });

        for (const mCard of mCards) {
          const decCardNumberRes = App.RSA.decrypt(mCard.encCardNumber);

          if (!decCardNumberRes.success) {
            console.json({ decCardNumberRes });
            continue;
          }

          if (decCardNumberRes.data === decPaymentCard_t.cardNumber)
            return App.json(res, 417, App.t(['Payment-Card', 'already', 'added'], res.lang));
        }
      }

      if (decPaymentCard_t.cardHolderName.length > (15 + 1 + 15))
        return App.json(res, 417, App.t(['first', 'and', 'last', 'name', 'must-be', 'less', 'or', 'equal', 'to', '15', 'charachters', 'each'], res.lang));

      if (decPaymentCard_t.cardHolderName.split(' ').length > 2)
        return App.json(res, 417, App.t(['only', 'first', 'and', 'last', 'name', 'must-be', 'provided'], res.lang));

      const expiryDateRaw = decPaymentCard_t.cardExpiryDate.split('/');
      const expiryDate = expiryDateRaw.map((d) => (+d));
      const mDate = App.getDetailedDate();

      if (
        (expiryDate[1] < mDate.y)
        ||
        (expiryDate[1] == mDate.y && expiryDate[0] < mDate.M)
      ) {
        return App.json(res, 417, App.t(['Card', 'has-been', 'expired'], res.lang));
      }

      if (expiryDate[0] > 12)
        return App.json(res, 417, App.t(['wrong', 'card', 'date'], res.lang));

      const encPaymentCard_t = {
        clientId: mClient.id,
        encCardNumber: App.RSA.encrypt(decPaymentCard_t.cardNumber).data,
        encCardHolderName: App.RSA.encrypt(decPaymentCard_t.cardHolderName).data,
        encCardExpiryDate: App.RSA.encrypt(decPaymentCard_t.cardExpiryDate).data,
        encCardCVV: App.RSA.encrypt(decPaymentCard_t.cardCVV).data,
      };

      for (const mKey of Object.keys(encPaymentCard_t)) {
        if (App.isNull(encPaymentCard_t[mKey]) || !encPaymentCard_t[mKey])
          return App.json(res, false, App.t(['fatal', 'server', 'error'], res.lang));
      }

      encPaymentCard_t.isOneTimeCard = decPaymentCard_t.isOneTimeCard;
      encPaymentCard_t.isDefault = decPaymentCard_t.isDefault;

      if (!encPaymentCard_t.isOneTimeCard) {
        await App.getModel('PaymentCard').update(
          { isDefault: false },
          { where: { clientId: mClient.id } }
        );
      }

      const mPaymentCard = await App.getModel('PaymentCard')
        .create(encPaymentCard_t);

      if (!App.isObject(mPaymentCard) || !App.isPosNumber(mPaymentCard.id))
        return App.json(res, false, App.t(['failed-to', 'create', 'Payment-Card'], res.lang));


      {
        // Create and Attach Local-Card to Customer.id
        const paymentMethodCreateRes = await App.payments.stripe.paymentMethodCardCreate({
          // name: decPaymentCard_t.cardHolderName,
          // exp_date: decPaymentCard_t.cardExpiryDate,
          number: decPaymentCard_t.cardNumber,
          exp_month: expiryDateRaw[0],
          exp_year: expiryDateRaw[1],
          cvc: decPaymentCard_t.cardCVV,
          metadata: {
            paymentCardId: mPaymentCard.id,
            clientId: mClient.id,
            userId: mUser.id,
          }
        });

        if (!paymentMethodCreateRes.success) {
          App.logger.fatal(`#paymentMethodCardCreate`, { paymentMethodCreateRes });
          console.error(`#paymentMethodCardCreate`);
          console.json({ paymentMethodCreateRes });
          await mPaymentCard.update({ isDeleted: true });
          // await mPaymentCard.destroy();
          // return App.json( res, false, App.t(['failed-to','add','the','Payment-Card','to-the','system'], res.lang) );
          return App.json(res, 417, App.t(paymentMethodCreateRes.message, res.lang));
        }

        const updatePaymentCard = await mPaymentCard.update({
          paymentMethodId: paymentMethodCreateRes.data.id,
        });

        if (!App.isObject(updatePaymentCard) || !App.isPosNumber(updatePaymentCard.id))
          return App.json(res, false, App.t(['failed-to', 'update', 'Payment-Card'], res.lang));

        const paymentMethodAttachRes = await App.payments.stripe.paymentMethodAttach(
          mClient.customerId,
          updatePaymentCard.paymentMethodId
        );

        if (!paymentMethodAttachRes.success) {
          App.logger.fatal(`#paymentMethodAttach`, { paymentMethodAttachRes });
          console.error(`#paymentMethodAttach`);
          console.json({ paymentMethodAttachRes });
          await mPaymentCard.update({ isDeleted: true });
          // await mPaymentCard.destroy();
          // return App.json( res, false, App.t(['failed-to','attach','Payment-Card'], res.lang) );
          return App.json(res, 417, App.t(paymentMethodAttachRes.message, res.lang));
        }

      }

      if (!encPaymentCard_t.isOneTimeCard) {

        const paymentTypes = App.getModel('OrderPaymentType').getTypes();

        const mClientPaymentSettings = await App.getModel('ClientPaymentSettings')
          .getByClientId(mClient.id);

        if (!App.isObject(mClientPaymentSettings) || !App.isPosNumber(mClientPaymentSettings.id)) {
          App.logger.fatal(` #r: [${res.info.path}] #mClientPaymentSettings: could not get default payment-settings`, res.info);
          console.error(` #r: [${res.info.path}] #mClientPaymentSettings: could not get default payment-settings`);
          console.json({ 'res.info': res.info });
        } else {

          const updateClientPaymentSettings = await mClientPaymentSettings.update({
            paymentCardId: mPaymentCard.id,
            type: paymentTypes.Card,
          });

          if (!App.isObject(updateClientPaymentSettings) || !App.isPosNumber(updateClientPaymentSettings.id)) {
            App.logger.fatal(` #r: [${res.info.path}] #updateClientPaymentSettings: could not update settings`, res.info);
            console.error(` #r: [${res.info.path}] #updateClientPaymentSettings: could not update settings`);
            console.json({ 'res.info': res.info });
          }
        }

      }

      App.json(res, true, App.t(['success'], res.lang), {
        id: mPaymentCard.id,
        isOneTimeCard: mPaymentCard.isOneTimeCard,
        isDefault: mPaymentCard.isDefault,
      });

    } catch (e) {
      console.log(e);
      App.onRouteError(req, res, e);
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc: {} };

};


