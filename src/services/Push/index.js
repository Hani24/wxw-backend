
const services = {
  expo: require('./push-services/expo'),
  fcm: require('./push-services/fcm'),
};

module.exports = (App, params={})=>{

  const res = {};
  
  for( const service_t of Object.keys(services) ){
    try{
      res[ service_t ] = new services[ service_t ]( App, params );
      console.ok(`     [push-services]: [${service_t}] inited`);
    }catch(e){
      console.warn(`     [push-services]: [${service_t}] : ${console.R(e.message)}`);
    }

  }

  return res;

};
