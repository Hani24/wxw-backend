const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    phone: {
      type: DataTypes.STRING, allowNull: false, required: true,
    },
    code: {
      type: DataTypes.STRING, allowNull: false, required: true,
    },
    maxAge: {
      type: DataTypes.INTEGER(11).UNSIGNED, allowNull: true, defaultValue: 0,
    },
    isExpired: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    isUsed: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    ip: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
    },
  });

  Model.getByCode = async function (code) {
    return await Model.findOne({ where:{ code: (''+code) } })
  };

  Model.createSmsCode = async function (code=false) {
    return code || App.tools.randInt(1000, 9999);
  };

  Model.getLatestByPhone = async function( {phone='n/a'}={} ){
    return await Model.findOne({
      where: {
        phone,
        isExpired: false,
        isUsed: false,
      },
      order: [['id','desc']]
    });
  }

  Model.getLatestByPhoneAndCode = async function( {phone='n/a',code='n/a'}={} ){
    return await Model.findOne({
      where: {
        phone,
        code,
        isExpired: false,
        isUsed: false,
      },
      order: [['id','desc']]
    });
  }

  Model.isRateLimited = function( datetime_t, value=1, type='minute' ){
    const now = App.DT.moment().subtract(value, type);
    const at = App.DT.moment(datetime_t);
    return now < at;
    // if( now < at ){
    //   return App.json( res, 417, App.t(['rate','limit','1','sms','/','minute'], req.lang));
    // }
  }

  return Model;

}
