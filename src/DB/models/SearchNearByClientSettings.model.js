const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const DISTANCE_UNITS = App.getDictByName('DISTANCE_UNITS');

  const Model = sequelize.define( exportModelWithName, {
    unitType: {
      type: DataTypes.ENUM, required: true, values: DISTANCE_UNITS,
      defaultValue: DISTANCE_UNITS[ 0 ],
    },
    maxSearchSquareInDegrees: {
      type: DataTypes.FLOAT.UNSIGNED, allowNull: true, defaultValue: 0.1,
    },
    maxSearchRadius: {
      type: DataTypes.FLOAT.UNSIGNED, allowNull: true, defaultValue: 15.0,
    },
  });

  Model.getUnits = function ({asArray=false}={}) {
    return Model._mapDict(DISTANCE_UNITS, {asArray} );
  };

  Model.getSettings = async function (view=true) {

    const mModel = await Model.findOne({
      attributes: {
        exclude: ['updatedAt','createdAt', view?'maxSearchSquareInDegrees':null],
      },
      order: [['id','desc']],
    });

    return App.isObject(mModel) && App.isPosNumber(mModel.id)
      ? mModel
      : await Model.create({
        unitType: Model.getUnits({asArray: true})[ 0 ],
      });

  }

  Model.setUnitType = async function( unitType ){
    const unitTypes = Model.getUnits();

    if( !unitTypes.hasOwnProperty(unitType) )
      return {success: false, message: 'Unsupported units, please use one of provided units', data: unitTypes};

    const updateSettings = await (await Model.getSettings()).update({ unitType });
    if( !App.isObject(updateSettings) || !App.isPosNumber(updateSettings.id) )
      return {success: false, message: 'Failed to update settings'};

    return await Model.setMaxSearchRadius( updateSettings.maxSearchRadius );

  }

  Model.setMaxSearchRadius = async function( maxSearchRadius ){
    if( !App.isPosNumber(maxSearchRadius) )
      return {success: false, message: 'Radius must be valid positive number'};
    const mSettings = await Model.getSettings();
    const unitTypes = Model.getUnits();

    let normUnits = 0;
    switch(mSettings.unitType){
      case unitTypes.kilometer: {
        normUnits = maxSearchRadius; 
        break;
      }
      case unitTypes.mile: {
        normUnits = App.geo.lib.milesToKms( maxSearchRadius )
        break;
      }
      case unitTypes.feet: {
        normUnits = +( App.geo.lib.feetsToMeters( maxSearchRadius ) /1000 ).toFixed(4);
        break;
      }
      case unitTypes.meter: {
        normUnits = +( maxSearchRadius /1000 ).toFixed(4);
        break;
      }
    }

    const maxSearchSquareInDegrees = App.geo.lib.kmToAvgLatLonDeg(normUnits);

    const updateSettings = await mSettings.update({
      maxSearchRadius,
      maxSearchSquareInDegrees,
    });

    if( !App.isObject(updateSettings) || !App.isPosNumber(updateSettings.id) )
      return {success: false, message: 'Failed to update settings'};

    return {success: true, message: 'success', data: updateSettings};

  }

  return Model;

}
