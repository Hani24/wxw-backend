const { Sequelize, DataTypes, Model } = require('sequelize');

// https://ams-llc.atlassian.net/wiki/spaces/MAI/pages/169935884/U03.02+add+a+new+address

// 1 Comment
// Morris Armstrong II
// Can remove Porch and floor on 2nd item. 

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    clientId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Clients',
        key: 'id'
      },
    },
    stateId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: true,
      required: false,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'States',
        key: 'id'
      },
    },
    // cityId: {
    //   type: DataTypes.BIGINT(8).UNSIGNED,
    //   allowNull: false,
    //   required: true,
    //   onUpdate: 'CASCADE',
    //   onDelete: 'CASCADE',
    //   references: {
    //     model: 'Cities',
    //     key: 'id'
    //   },
    // },
    label: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
    },
    isDefault: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    city:{
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
    },
    street: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
    },
    apartment: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
    },
    description: {
      type: DataTypes.TEXT, allowNull: true, defaultValue: '',
    },
    // https://ams-llc.atlassian.net/wiki/spaces/MAI/pages/169935996/U06.04+Manage+the+delivery+address
    // The new address added from the delivery details part should NOT be saved to the user’s 
    // account but should be saved only for the current order.
    isOneTimeAddress: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,      
    },
    lat: {
      type: DataTypes.DECIMAL(3+8,8), allowNull: false, defaultValue: 0,      
    },
    lon: {
      type: DataTypes.DECIMAL(3+8,8), allowNull: false, defaultValue: 0,      
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
  });

  Model.getDefaultByClientId = async function(clientId){
    clientId = Math.floor(+clientId);
    if( !App.isPosNumber(clientId) ) return null;

    return Model.findOne({
      where: {
        clientId: clientId,
        isOneTimeAddress: false,
        isDefault: true,
        isDeleted: false,
      }
    });

  }

  Model.getAsListByClientId = async function(clientId){
    clientId = Math.floor(+clientId);
    if( !App.isPosNumber(clientId) ) return null;
    const list = await Model.findAll({
      where: {
        clientId,
        isOneTimeAddress: false,
        isDeleted: false,
      },
      attributes: [
        'id','isDefault','label','stateId','city','street','apartment','description','lat','lon'
      ],
      order: [['id','desc']], // last added must be set to [isDefault=true]
      include:[
        // {
        //   model: App.getModel('City'),
        //   attributes:['id','name'],
        //   required: true,
        //   include:[{
        //     model: App.getModel('State'),
        //     attributes:['id','name','code'],
        //   }],
        // },
        {
          model: App.getModel('State'),
          attributes: ['id','name','code'],
          required: true,
        },
      ],
    });

    // if( App.isArray(list) && list.length ){
    //   for( const mDeliveryAddress of list ){
    //     mDeliveryAddress.dataValues.State = mDeliveryAddress.dataValues.City.State; 
    //     delete mDeliveryAddress.dataValues.City.dataValues.State; 
    //   }      
    // }

    return list;
  }

  return Model;
}
