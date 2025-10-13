const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const DISCOUNT_TYPES = App.getDictByName('DISCOUNT_TYPES');

  const Model = sequelize.define( exportModelWithName, {
    // restaurantId: {
    //   type: DataTypes.BIGINT(8).UNSIGNED,
    //   allowNull: false,
    //   required: true,
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    //   references: {
    //     model: 'Restaurants',
    //     key: 'id'
    //   },
    // },
    isActive: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true
    },
    code: {
      type: DataTypes.STRING, allowNull: false
    },
    // amount in - (%)
    discount: {
      type: DataTypes.DECIMAL(4,2), allowNull: false, defaultValue: 0
    },
    type: {
      type: DataTypes.ENUM, required: true, values: DISCOUNT_TYPES,
      defaultValue: DISCOUNT_TYPES[ 0 ],
    },
    description: {
      type: DataTypes.STRING, allowNull: false, defaultValue: ''
    },
    expiresAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    // [statistic]
    usedTimes: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0
    },
    totalDiscount: {
      type: DataTypes.DECIMAL(8,2), allowNull: true, defaultValue: 0
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true
    },
  });

  Model.getTypes = function ({asArray=false}={}) {
    return Model._mapDict(DISCOUNT_TYPES, {asArray} );
  };

  Model.createCode = function(len=6){
    return console.hash.sha256(`${ Date.now() }-createCode-${(+len)}`)
      .substr( +(len) || 6 )
      .toUpperCase();
  }

  Model.cleanCode = function(code){
    return App.tools.stripSpecialChars( code );
  }

  Model.getByCode = function(code){

    code = App.isString(code) ? Model.cleanCode(code) : null;
    if( App.isNull(code) ) return null;

    return Model.findOne({
      where: {
        code, 
        // isActive: true,
      },
    })
  }

  Model.getActiveByCode = function(code){

    code = App.isString(code) ? Model.cleanCode(code) : null;
    if( App.isNull(code) ) return null;

    return Model.findOne({
      where: {
        code,
        isActive: true,
        isDeleted: false,
      },
      attributes: ['id','discount','code','type','description','usedTimes', 'totalDiscount'],
      order: [['id','desc']]
    });
  }

  return Model;

}
