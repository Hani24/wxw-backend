const { Sequelize, DataTypes, Model } = require('sequelize');

// NOTE: How do we calculate moving/mobile restos/food-trucks ?

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const ORDER_STATUSES = App.getDictByName('ORDER_STATUSES');
  const DISTANCE_UNITS = App.getDictByName('DISTANCE_UNITS');
  const ORDER_TYPES = App.getDictByName('ORDER_TYPES');

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
    courierId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: true,
      required: false,
      // onUpdate: 'CASCADE',
      // onDelete: 'CASCADE',
      references: {
        model: 'Couriers',
        key: 'id'
      },
    },
    clientDescription: {
      type: DataTypes.TEXT, allowNull: true, defaultValue: '',
    },
    discountAmount: {
      type: DataTypes.DECIMAL(4,2), allowNull: false, defaultValue: 0
    },
    discountCode: {
      type: DataTypes.STRING, allowNull: false, defaultValue: ''
    },
    discountType: {
      type: DataTypes.STRING, allowNull: true, defaultValue: null,
    },
    status: {
      type: Sequelize.ENUM, required: true, values: ORDER_STATUSES,
      defaultValue: ORDER_STATUSES[ 0 ],
    },
    orderType: {
      type: Sequelize.ENUM,
      required: false, // Optional - defaults to 'order-now' for backward compatibility
      allowNull: false, // Cannot be null, but has default
      values: ORDER_TYPES,
      defaultValue: ORDER_TYPES[0], // 'order-now'
    },
    totalPrice: { // all menu items from all restaurants
      type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, defaultValue: 0
    },
    deliveryPrice: {
      type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, defaultValue: 0      
    },
    deliveryPriceUnitPrice: {
      type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, defaultValue: 0
    },
    deliveryPriceUnitType: {
      type: DataTypes.ENUM, required: true, values: DISTANCE_UNITS,
      defaultValue: DISTANCE_UNITS[ 0 ],
    },
    totalPriceFee: {
      type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, defaultValue: 0      
    },
    deliveryPriceFee: {
      type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, defaultValue: 0
    },
    deliveryDistanceValue: {
      type: DataTypes.FLOAT.UNSIGNED, allowNull: false, defaultValue: 0      
    },
    deliveryDistanceType: {
      type: DataTypes.STRING, allowNull: false, defaultValue: '',
    },
    isFreeDelivery: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    finalPrice: { // all restos + all discounts + delivery price
      type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, defaultValue: 0
    },
    totalItems: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0
    },
    isDeliveredByCourier: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    deliveredByCourierAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isCourierRatedByClient: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    courierRatedByClientAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    courierRating: { // 0-5
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 0
    },
    isOrderRatedByClient: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    orderRatedByClientAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isOrderRateRequestSent: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    orderRateRequestSentAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isRejectedByClient: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    rejectedByClientAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    rejectionReason: {
      type: DataTypes.TEXT, allowNull: false, defaultValue: ''
    },
    isCanceledByClient: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    canceledByClientAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    cancellationReason: {
      type: DataTypes.TEXT, allowNull: false, defaultValue: ''
    },
    // 'Client didn't get in touch' ???
    isClientDidGetInTouch: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    clientDidGetInTouchAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },

    allSuppliersHaveConfirmed: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    allSuppliersHaveConfirmedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    // allSuppliersHaveConfirmedAt + max-order-prep-tipe + expected time for the coirier
    expectedDeliveryTime: {
      // type: DataTypes.INTEGER(4).UNSIGNED, allowNull: false, defaultValue: 0,
      type: DataTypes.DATE, allowNull: true, defaultValue: null,
    },
    // [inner][stripe]
    paymentIntentId: {
      type: DataTypes.STRING, allowNull: true, defaultValue: null
    },
    clientSecret: {
      type: DataTypes.STRING, allowNull: true, defaultValue: null
    },
    // [inner][stripe] allow server to process [auto] payment
    isPaymentRequestAllowed: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    paymentRequestAllowedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    // [inner][stripe] server has requested [auto] payment ?
    isPaymentRequested: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    paymentRequestedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    // [inner][stripe] [common]
    isPaid: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    paidAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isRefunded: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    refundedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isClientActionRequired: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    clientActionRequiredAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isClientActionExecuted: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    clientActionExecutedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },

    // [inner][processing]
    isLocked: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
    },
    lockedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    lockedByNuid: {
      type: DataTypes.STRING, allowNull: true, defaultValue: null
    },
    lastCourierId: {
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: null
    },

    // [inner][orders][delayed]
    isPushedToProcessing: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    pushedToProcessingAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    pushToProcessingAt: {
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
    // Virtual fields for order type checking
    isOrderNow: {
      type: DataTypes.VIRTUAL,
      get(){
        return this.getDataValue('orderType') === ORDER_TYPES[0]; // 'order-now'
      }
    },
    isOnSitePresence: {
      type: DataTypes.VIRTUAL,
      get(){
        return this.getDataValue('orderType') === ORDER_TYPES[1]; // 'on-site-presence'
      }
    },
  }, {
    // requested by client
    initialAutoIncrement: '10000000000'
  });

  Model.getChecksumKeys = function () {
    return [
      'id','status', 'clientId', 'totalPrice', 'deliveryPrice', 
      'isFreeDelivery', 'finalPrice', 'totalItems', 'isPaid', 'isRefunded'
      // 'totalPriceFee', // 'deliveryPriceFee', 
    ];
  }

  // Model.isValidChecksum = function (mOrder) {
  //   const checksum = Model.getChecksum(mOrder);
  //   const isValid = checksum === mOrder.checksum;
  //   if( !isValid )
  //     console.error({checksum: {expected: mOrder.checksum, result: checksum } })
  //   return isValid;
  // }

  Model.getStatuses = function ({asArray=false}={}) {
    return Model._mapDict(ORDER_STATUSES, {asArray} );
  };

  Model.getOrderTypes = function ({asArray=false}={}) {
    return Model._mapDict(ORDER_TYPES, {asArray} );
  };

  Model.getDefaultMaxAgeOfOrder = function ({amount=30, of='minutes',format=App.getDateFormat()}={}) {
    return App.DT.subFromDate({amount, of, format});
  }

  Model.getUnits = function ({asArray=false}={}) {
    return Model._mapDict(DISTANCE_UNITS, {asArray} );
  };

  Model.getFullOrderWhere = async function(where={}) {

    const mOrder = await App.getModel('Order').findOne({
      where: {
        ...( App.isObject(where) ? where : {} ),
        // status: { [ App.DB.Op.not ]: Model.getStatuses()['processing'] }
      }, 
      attributes: {
        exclude: [
          // 'clientId',
          // 'updatedAt',
          // 'paymentIntentId',
          // 'clientSecret',
          // 'allSuppliersHaveConfirmedAt',
          // 'expectedDeliveryTime',
          'isPaymentRequestAllowed',
          'paymentRequestAllowedAt',
          'isLocked',
          'lockedAt',
          'lockedByNuid',
        ]
      },
      include: [
        {
          model: App.getModel('OrderDeliveryAddress'),
          attributes: ['id'],
          include: [{
            model: App.getModel('DeliveryAddress'),
            attributes: [
              'id','label','city','stateId','street','apartment','description','lat','lon'
            ],
            include: [{
              model: App.getModel('State'),
              attributes: [
                'id','name','code'
              ],
            }]
            // include: [{
            //   model: App.getModel('City'),
            //   attributes: [
            //     'id','name',
            //   ],
            // }]
          }]
        },
        {
          model: App.getModel('OrderDeliveryTime'),
          attributes: [
            'id','deliveryDay','deliveryHour','deliveryTimeValue','deliveryTimeType'
          ],
        },
        {
          model: App.getModel('OrderDeliveryType'),
          attributes: [
            'id','type'
          ],
        },
        {
          model: App.getModel('OrderPaymentType'),
          attributes: [
            'id','type'
          ],
          include: [{
            model: App.getModel('PaymentCard'),
            attributes: [
              'id','encCardNumber','paymentMethodId'
            ],
          }]
        },
        {
          model: App.getModel('OrderSupplier'),
          // attributes: {
          //   exclude: [
          //     'restaurantId','orderId',
          //     // 'isValidChecksum','checksum',
          //     // ...App.getModel('OrderSupplier').getChecksumKeys(),
          //   ]
          // },
          include: [
            {
              model: App.getModel('Restaurant'),
              attributes: [
                'id','name','image','description','isOpen','rating','type',
                'lat','lon','zip','street','cityId',
                'isValidChecksum','checksum',
                ...App.getModel('Restaurant').getChecksumKeys(),
              ],
              include: [{
                model: App.getModel('City'),
                attributes: ['id','name']
              }]
            },
            {
              model: App.getModel('OrderSupplierItem'),
              attributes: {
                exclude: [
                  'orderSupplierId','restaurantId','menuItemId'
                ]
              },
              include: [{
                model: App.getModel('MenuItem'),
                attributes: [
                  'id','name','image','description','order','kcal','proteins',
                  'fats','carbs','price','rating','order','createdAt',
                ]
              }]
            }
          ]
        },
        {
          model: App.getModel('Courier'),
          attributes: [
            'id','isOnline','lat','lon',
            'isValidChecksum','checksum',
            ...App.getModel('Courier').getChecksumKeys(),
          ],
          include: [{
            model: App.getModel('User'),
            attributes: ['id','firstName','lastName','phone'],
          }]
        }
      ]
    });

    if( App.isObject(mOrder) && App.isObject(mOrder.OrderPaymentType) ){
      if( mOrder.OrderPaymentType.type === App.getModel('OrderPaymentType').getTypes().Card ){

        if( App.isObject(mOrder.OrderPaymentType.PaymentCard) ){

          const mPaymentCard = mOrder.OrderPaymentType.PaymentCard;

          const decCardNumberRes = App.RSA.decrypt(mPaymentCard.encCardNumber);
          if( !decCardNumberRes.success ){
            console.error(decCardNumberRes);
          }else{
            mPaymentCard.dataValues.lastDigits = decCardNumberRes.data;
            delete mPaymentCard.dataValues.encCardNumber;
            mPaymentCard.dataValues.lastDigits = mPaymentCard.dataValues.lastDigits
              .substr( mPaymentCard.dataValues.lastDigits.length -4 );
          }

        }
      }
    }

    return mOrder;

  }

  Model.pushOrderAsMailByOrderId = async function( orderId ){

    if( !(await App.getModel('Order').isset({id: orderId})) )
      return {success: false, message: App.t(['order','id','not-found'])};

    const mOrder = await App.getModel('Order').findOne({
      where: {id: orderId /* 10000000200 */ },
      attributes: [
        'id',
        // 'deliveryPrice','totalPrice','totalItems','finalPrice',
        'isPaid','isRefunded','createdAt'
      ],
      include: [{
        model: App.getModel('OrderSupplier'),
        // where: {
        //   // restaurantId: 2
        //   restaurantId: restaurantId,
        // },
        attributes: ['id','totalPrice','totalItems','restaurantId'],
        include: [
          {
            model: App.getModel('OrderSupplierItem'),
            attributes: ['id','price','amount','totalPrice'],
            include: [{
              model: App.getModel('MenuItem'),
              attributes: ['id','name','image'],
            }]
          },
          {
            model: App.getModel('Restaurant'),
            attributes: ['id','name'],
            include: [{
              model: App.getModel('User'),
              attributes: ['id','email','lang'],
            }]
          }
        ]
      }]
    });

    // const mRestoUsers = await App.getModel('User').findAll({
    //   where: {
    //     restaurantId,
    //     isEmailVerified: true,
    //   },
    //   attributes: ['id','email','lang'],
    // });

    for( const mOrderSupplier of mOrder.OrderSuppliers ){
      const mUser = mOrderSupplier.Restaurant.User;
      const mR = await App.Mailer.send({
        to: mUser.email,
        subject: App.t(['New','order','received',`#${mOrder.id}`], mUser.lang),
        data: await App.Mailer.createEmailTemplate('restaurant-new-order', { 
          lang: mUser.lang,
          mOrderSupplier,
          mOrder,
        })
      });
      // console.json({mOrderSupplier, mR});
    }
  }

  return Model;

}
