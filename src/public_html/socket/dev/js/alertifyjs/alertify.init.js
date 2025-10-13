window.addEventListener('load', async()=>{

  while( !alertify ){
    console.log('+++');
    await console.sleep(1000);
  }

  alertify.defaults.glossary.title = '[dev]';
  alertify.defaults.glossary.ok = 'Ok';
  alertify.defaults.glossary.cancel = 'Cancel';
  alertify.defaults.notifier.delay = 6;
  alertify.defaults.notifier.position = 'top-right'; 

  window._alert = window.alert;
  window._prompt = window.prompt;
  window._confirm = window.confirm;

  window.alert = alertify.alert;
  window.prompt = alertify.prompt;
  window.confirm = alertify.confirm;

  window.onInfo = alertify.message;
  window.onWarning = alertify.warning;
  window.onSuccess = alertify.success;
  window.onError = alertify.error;
  window.onMessage = alertify.message;

  window.alertify.setDefaults = (title, ok, cancel, delay=6, position='top-right')=>{
    alertify.defaults.glossary.title = title || '[dev]';
    alertify.defaults.glossary.ok = ok || 'Ok';
    alertify.defaults.glossary.cancel = cancel || 'Cancel';
    alertify.defaults.notifier.delay = delay || 6;
    alertify.defaults.notifier.position = position || 'top-right'; 
  }

});

