const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    userId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Users',
        key: 'id'
      },
    },
    code: {
      type: DataTypes.STRING, allowNull: false, required: true,
    },
    maxAge: {
      type: DataTypes.INTEGER(11).UNSIGNED, 
      allowNull: true, defaultValue: 0
    },
    isUsed: {
      type: DataTypes.BOOLEAN, defaultValue: false,      
    },
    isExpired: {
      type: DataTypes.BOOLEAN, defaultValue: false,      
    },
  });

  Model.getLatestByCode = async function( {code='n/a'}={} ){
    return await Model.findOne({
      where: {
        code,
        isExpired: false,
        isUsed: false,
      },
      order: [['id','desc']]
    });
  }

  return Model;

}
