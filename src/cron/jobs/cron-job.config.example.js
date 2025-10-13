// save as: cron-job.config.js
module.exports = (App, params={})=>{
  return {
    'dev.restaurants-auto-payout': {
      debug: true,
    },
    'dev.order-supplier.apply-balance': {
      debug: true,
    },
    'dev.master-nodes.find-dead-nodes-and-reassign-work': {
      debug: false,
    },
    'dev.master-nodes.update-current': {
      debug: false,
    },
    'dev.order.auto-payment-processing': {
      debug: false,
    },
    'dev.order.clean-courier-active-order': {
      debug: false,
    },
    'dev.order.find-courier': {
      debug: false, // App.isEnv('dev'),
    },
    'dev.order.notify-suppliers.real-restos': {
      debug: false,
    },
    'dev.order.push-delayed-order-to-main-loop': {
      debug: false,
    },
    'dev.order.rate-unrated-orders': {
      debug: false,
    },
    'dev.order.remove.non-paid-or-discarded': {
      debug: false,
    },
    'dev.statistic.collect-daily-restaurants-orders-info': {
      debug: false,
    },    
  };
};
