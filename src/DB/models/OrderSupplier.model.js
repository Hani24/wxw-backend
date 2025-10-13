const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const ORDER_DELAYS = App.getDictByName('ORDER_DELAYS');

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
    restaurantId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Restaurants',
        key: 'id'
      },
    },
    // discountAmount: {
    //   type: DataTypes.DECIMAL(4,2), allowNull: false, defaultValue: 0
    // },
    // discountCode: {
    //   type: DataTypes.STRING, allowNull: false, defaultValue: ''
    // },
    totalPrice: {
      type: DataTypes.DECIMAL(8,2), allowNull: false, defaultValue: 0
    },
    totalItems: {
      type: DataTypes.INTEGER, allowNull: false, defaultValue: 0
    },
    isTakenByCourier: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    takenByCourierAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isCourierArrived: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    courierArrivedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isCanceledByRestaurant: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    canceledByRestaurantAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    cancellationReason: {
      type: DataTypes.TEXT, allowNull: false, defaultValue: ''
    },
    isAcceptedByRestaurant: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    acceptedByRestaurantAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isOrderReady: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    orderReadyAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isOrderDelayed: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    orderDelayedFor: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: 0
    },
    orderDelayedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },

    // [inner]:[flags]:[backend]
    isRestaurantNotified: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    restaurantNotifiedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isRestaurantAcknowledged: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    restaurantAcknowledgedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isRequestCreated: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    requestCreatedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    requestTimeLeft: {
      type: DataTypes.VIRTUAL, 
      get(){
        if( !this.getDataValue('isRequestCreated') ) return 0;
        const setAt = new Date( this.get('requestCreatedAt') || this.getDataValue('requestCreatedAt') );
        const date = new Date();
        const timeLeft = +( ( date - setAt ) / 1000 );
        return timeLeft > 0 ? timeLeft : 0;
      }
    },
    // [inner]:[flags]:[payments]
    isAppliedToBalance: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    appliedToBalanceAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    checksum: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
      set(){
        if( App.isPosNumber(this.getDataValue('id')) )
          return this.setDataValue('checksum', Model.getChecksum(this));
      }
    },
    isValidChecksum: {
      type: DataTypes.VIRTUAL, 
      get(){
        return ( App.isPosNumber(this.getDataValue('id')) )
          ? Model.getChecksum(this) === this.getDataValue('checksum')
          : false;
      }
    },
  });

  Model.getChecksumKeys = function () {
    return [
      'id', 'orderId', 'restaurantId', 'totalPrice', 'totalItems', 'isAppliedToBalance', 
    ];
  }

  Model.getDelays = function ({asArray=false}={}) {
    return Model._mapDict(ORDER_DELAYS, {asArray} );
  };

  Model.applyOrderSupplierDataToBalanceById = async function (orderSupplierId) {
    return await Model.applyOrderSupplierDataToBalance(
      await App.getModel('OrderSupplier').getById((+orderSupplierId))
    );
  }

  Model.applyOrderSupplierDataToBalance = async function (mOrderSupplier, parentTx=false) {

    if( !App.isObject(mOrderSupplier) || !App.isPosNumber(mOrderSupplier.id) ){
      console.error(`#OrderSupplier:applyOrderSupplierDataToBalance: mOrderSupplier is not valid model Object`);
      return {success: false, message: 'Order-Supplier not found'};
    }

    if( !mOrderSupplier.isValidChecksum ){
      console.error(`#OrderSupplier:applyOrderSupplierDataToBalance: wrong [supplier] checksum`);
      return {success: false, message: 'Security checksum error', data: {type: 'supplier'}};
    }

    let mRestaurant = await App.getModel('Restaurant').findOne({
      where: {
        id: mOrderSupplier.restaurantId,
        isDeleted: false,
        // isVerified: true,
        // isRestricted: false,
      },
      attributes: [
        'id','balance','isValidChecksum','checksum',
        ...App.getModel('Restaurant').getChecksumKeys(),
      ]
    });

    if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) ){
      console.error(`Failed to get Restaurant by id: ${mOrderSupplier.restaurant}`);
      return {success: false, message: `Failed to get Restaurant by id: ${mOrderSupplier.restaurant}`};      
    }

    if( !mRestaurant.isValidChecksum ){
      console.error(`Security checksum error: restaurant id: ${mOrderSupplier.restaurant}`);
      return {success: false, message: 'Security checksum error', data: {type: 'restaurant'}};   
    }

    const tx = parentTx || await App.DB.sequelize.transaction( App.DB.getTxOptions({}) );

    try{

      const mOrderSupplierUpdated = await mOrderSupplier.update({
        isAppliedToBalance: true,
        appliedToBalanceAt: App.getISODate(),
        checksum: true,
      }, { transaction: tx });

      if( !App.isObject(mOrderSupplierUpdated) || !App.isPosNumber(mOrderSupplierUpdated.id) )
        throw Error(`Failed to update OrderSupplier: supplier-id: ${mOrderSupplier.id}, restaurant-id: ${mOrderSupplier.restaurantId}`);

      if( !mOrderSupplierUpdated.isValidChecksum )
        throw Error(`Security checksum error: update/supplier: supplier-id: ${mOrderSupplier.id}, restaurant-id: ${mOrderSupplier.restaurantId}`);

      const updatedRowRes = await App.DB.sequelize.query(
        `update Restaurants set balance = balance +${mOrderSupplier.totalPrice} where id=${mRestaurant.id}`, 
        {transaction: tx}
      );

      console.warn(`[b]: balance: ${mRestaurant.balance}, checksum: ${mRestaurant.checksum}`);
      const mRestoBalance = await App.getModel('Restaurant').findOne({
        where: {
          id: mRestaurant.id
        }, 
        transaction: tx,
        attributes:['id','balance']
      });

      if( !App.isObject(mRestoBalance) || !App.isPosNumber(mRestoBalance.id) )
        throw Error(`Failed to get Restaurant balance: restaurant-id: ${mOrderSupplier.restaurantId}`);

      mRestaurant = await mRestaurant.update({
        balance: mRestoBalance.balance,
        checksum: true,
      }, {transaction: tx});
      console.warn(`[a]: balance: ${mRestaurant.balance}, checksum: ${mRestaurant.checksum}`);

      if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) )
        throw Error(`Failed to update Restaurant: supplier-id: ${mRestaurant.id}, restaurant-id: ${mRestaurant.restaurantId}`);

      if( !mRestaurant.isValidChecksum )
        throw Error('Security checksum error, restaurant');

      if( !parentTx ) await tx.commit();
      return {success: true, message: 'success'};

    }catch(e){
      console.error(`#OrderSupplier:applyOrderSupplierDataToBalance: ${e.message}`);
      if( !parentTx ) await tx.rollback();
      return {success: false, message: 'Failed to update balances'};
    }

  }

  return Model;

}
