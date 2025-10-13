const express = require('express');
const router = express.Router();

// {
//   "status": "required: ENUM: <string>: [ errored | transfered | completed | all ]",
//   "// NOTE: on (errored)": "all transfers with any error",
//   "// NOTE: on (transfered)": "from [owner:stipe] to [destination:stipe] account, but not to the bank-account",
//   "// NOTE: on (completed)": "(transfered) + sent to the bank-account ",
//   "// NOTE: on (all)": "just all available records"
// }

// /private/admin/restaurants/withdraw/transfers/auto/get/all/?offset=0&limit=15&order=desc&status='see raw-body description'

module.exports = function(App, RPath){

  router.use('', async(req, res)=>{

    try{

      const data = req.getPost();
      const mUser = await req.user;

      const {offset, limit, order, by} = req.getPagination({ order: 'asc' });
      const orderBy = App.getModel('RestaurantTransfer').getOrderBy(by);
      const status = req.query.status || req.getCommonDataString('status',null);

      const statuses = App.getModel('RestaurantTransfer').getTransferStatuses({});
      delete statuses.none;

      if( !statuses.hasOwnProperty(status) && status !== 'all' )
        return await App.json(res, 417, App.t(['Unknown status type'],req.lang), { statuses });

      const whereTransfer = {};

      switch(status){
        case statuses.errored: {
          whereTransfer['status'] = statuses.errored;
          break;
        }
        case statuses.transfered: {
          whereTransfer['status'] = statuses.transfered;
          break;
        }
        case statuses.completed: {
          whereTransfer['status'] = statuses.completed;
          break;
        }
        case statuses.all: {
          whereTransfer['status'] = { [App.DB.Op.not]: statuses.all };
          break;
        }
      }

      const mRestaurantTransfers = await App.getModel('RestaurantTransfer').findAndCountAll({
        where: whereTransfer,
        order: [[ orderBy, order ]],
        offset: offset,
        limit: limit,
      });

      App.json( res, true, App.t('success', res.lang), mRestaurantTransfers);

    }catch(e){
      console.log(e);
      App.onRouteError( req, res, e );
      // App.json( res, false, App.t('request-could-not-be-processed', req.lang) );
    }

  });

  return { router, method: '', autoDoc:{} };

};


