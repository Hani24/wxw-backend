
module.exports = async (App, params={}, task='')=>{

  try{

    if( (await App.getModel('State').isset({id: 1})) ){
      return true;
    }

    // const codes = require(`${App.root}/dev-data/us-state.js`);
    // const data = require(`${App.root}/dev-data/cities.js`);
    // [ {'city': 'Abbeville', 'state': 'Louisiana'}, ]

    const data = console.jsonFromFile(`${App.root}/dev-data/import.json`);

    for( const stateName of Object.keys(data) ){
      try{

        const state = data[ stateName ]

        const mState = await App.getModel('State').create({
          name: stateName,
          code: state.code,
        });

        if( !App.isObject(mState) ){
          console.warn(` Error: could not create State record`);
          continue;
        }

        console.ok(` #state: [${mState.id}]: [${mState.code}] - ${mState.name}`);

        for( const city of state.cities ){
          try{

            const mCity = await App.getModel('City').create({
              stateId: mState.id,
              name: city.name,
            });

            if( !App.isObject(mCity) ){
              console.warn(` Error: could not create City record`);
              continue;
            }

            console.info(`   #city: [${mCity.id}]: ${mCity.name}`);

          }catch(e){
            console.error(e.message);
          }
        }

      }catch(e){
        console.error(e.message);
      }
    }

    console.ok(` #app:[post-boot-task]: [${task}]: inited ...`);
    return true;

  }catch(e){
    console.error(` #app:[post-boot-task]: [${task}]: ${e.message}`);
    return false;
  }

}