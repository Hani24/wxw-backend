const { Sequelize, DataTypes, Model } = require('sequelize');

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
    encCardHolderName: {
      type: DataTypes.TEXT, allowNull: false 
    },
    encCardNumber: {
      type: DataTypes.TEXT, allowNull: false 
    },
    encCardExpiryDate: {
      type: DataTypes.TEXT, allowNull: false 
    },
    encCardCVV: {
      type: DataTypes.TEXT, allowNull: false 
    },
    isUsedInPayment: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    lastUsedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isOneTimeCard: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,      
    },
    isDefault: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },

    // TODO: Move to: {type: DataTypes.VIRTUAL, get(){ ... }}
    // lastDigits: {
    //   type: DataTypes.VIRTUAL,
    //   // type: new DataTypes.VIRTUAL(DataTypes.STRING, ['encCardNumber']),
    //   get: function() {
    //     const encCardNumber = this.getDataValue('encCardNumber');
    //     // const encCardNumber = this.encCardNumber; // => new DataTypes.VIRTUAL( .... )
    //     // console.json({ encCardNumber });

    //     const decCardNumberRes = App.RSA.decrypt(encCardNumber);
    //     if( !decCardNumberRes.success ){
    //       console.error({decCardNumberRes});
    //       return 'n/a';
    //     }
    //     const lastDigits = decCardNumberRes.data.substr( decCardNumberRes.data.length -4 );
    //     return lastDigits;
    //   },
    //   set(){},
    // },
    // [inner][stripe]
    paymentMethodId: {
      type: DataTypes.STRING, allowNull: true, defaultValue: null
    },

  });

  Model.getAllByClientId = async function (clientId) {

    if( !App.isPosNumber(Math.floor((+clientId))) ) return null;
    clientId = Math.floor((+clientId));

    const mPaymentCards = await Model.findAll({
      where: { 
        clientId,
        isDeleted: false,
        isOneTimeCard: false,
      },
      attributes: [
        'id',
        'encCardNumber',
        // 'lastDigits',
        'isDefault','isUsedInPayment','createdAt',
      ],
      order: [['id','desc']]
    });


    if( App.isArray(mPaymentCards) || !App.isPosNumber(mPaymentCards.id) ){
      for( const mPaymentCard of mPaymentCards ){
        const decCardNumberRes = App.RSA.decrypt(mPaymentCard.encCardNumber);
        if( !decCardNumberRes.success ){
          console.error(decCardNumberRes);
          continue;
        }
        mPaymentCard.dataValues.lastDigits = decCardNumberRes.data;
        delete mPaymentCard.dataValues.encCardNumber;
        mPaymentCard.dataValues.lastDigits = mPaymentCard.dataValues.lastDigits
          .substr( mPaymentCard.dataValues.lastDigits.length -4 );
      }
    }

    return mPaymentCards;
  }

  return Model;

}
