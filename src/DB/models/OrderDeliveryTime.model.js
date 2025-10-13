const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const DELIVERY_DAYS = App.getDictByName('DELIVERY_DAYS');
  const DELIVERY_HOURS = App.getDictByName('DELIVERY_HOURS');
  const TIME_TYPES = App.getDictByName('TIME_TYPES');

  // OrderDeliveryTime
  const Model = sequelize.define( exportModelWithName, {
    orderId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Orders',
        key: 'id'
      },
    },
    deliveryDay: {
      type: DataTypes.ENUM, required: true, values: DELIVERY_DAYS,
      defaultValue: DELIVERY_DAYS[ 0 ],
    },
    deliveryHour: {
      type: DataTypes.ENUM, required: true, values: DELIVERY_HOURS,
      defaultValue: DELIVERY_HOURS[ 0 ],
    },
    deliveryTimeValue: {
      type: DataTypes.INTEGER(2).UNSIGNED, required: false, defaultValue: 0,
    },
    deliveryTimeType: {
      type: DataTypes.ENUM, required: false, values: TIME_TYPES,
      defaultValue: TIME_TYPES[ 0 ],
    },
    // humanTime: {
    //   // type: DataTypes.VIRTUAL,
    //   type: new DataTypes.VIRTUAL(DataTypes.STRING, ['humanTime']),
    //   get: function() {
    //     // const deliveryDay = this.getDataValue('deliveryDay');
    //     // const deliveryHour = this.getDataValue('deliveryHour');
    //     // const deliveryTimeValue = this.getDataValue('deliveryTimeValue');
    //     // const deliveryTimeType = this.getDataValue('deliveryTimeType');
    //   }
    // }
    createdAt: {
      type: DataTypes.DATE, 
      allowNull: false, defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE, 
      allowNull: false, defaultValue: DataTypes.NOW
    },
  });

  Model.getDeliveryDays = function ({asArray=false}={}) {
    return Model._mapDict(DELIVERY_DAYS, {asArray} );
  };

  Model.getDeliveryHours = function ({asArray=false}={}) {
    return Model._mapDict(DELIVERY_HOURS, {asArray} );
  };

  Model.getTimeTypes = function ({asArray=false}={}) {
    return Model._mapDict(TIME_TYPES, {asArray} );
  };


  Model.getHumanTimeFromObject = function (mOrderDeliveryTime) {

    if( !App.isObject(mOrderDeliveryTime) || !App.isPosNumber(mOrderDeliveryTime.id) )
      return 'n/a';

    const {
      deliveryDay, deliveryHour, deliveryTimeValue, deliveryTimeType
    } = mOrderDeliveryTime;

    if( deliveryHour === Model.getDeliveryHours()['set-by-user'] )
      return `${deliveryDay}: ${deliveryTimeValue} ${deliveryTimeType}`;

    return `${deliveryDay}: ${deliveryHour}`;

    // {
    //   "id": 2,
    //   "deliveryDay": "today",
    //   "deliveryHour": "now",
    //   "deliveryTimeValue": 0,
    //   "deliveryTimeType": "NOT-SET"
    // }

    // {
    //   "deliveryDay": "tomorrow",
    //   "deliveryHour": "set-by-user",
    //   "deliveryTimeValue": 9,
    //   "deliveryTimeType": "AM"
    // }

    // {
    //   deliveryDay: ENUM: <string>: [ today | tomorrow ],
    //   deliveryHour: ENUM: <string>: [ now | set-by-user ],
    //   deliveryTimeValue: <number>: [ 0 - 12 ],
    //   deliveryTimeType: ENUM: <string>: [ NOT-SET | AM | PM ],
    // }

  }
  return Model;

}
