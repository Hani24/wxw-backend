const { Sequelize, DataTypes, Model } = require('sequelize');

// https://ams-llc.atlassian.net/wiki/spaces/MAI/pages/172982348/A01.01+view+the+list+of+restaurants
// - The distance of the restaurant (The GPS distance - for vans . The address filled in during the registration for stationary points. 
// - The rate of the restaurants. 

// NOTE: 'time of the order preparations' => move to Resto options ???

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const RESTAURANT_TYPES = App.getDictByName('RESTAURANT_TYPES');

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
    cityId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: true,
      required: false,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Cities',
        key: 'id'
      },
    },
    image: {
      type: DataTypes.STRING, allowNull: false, defaultValue: '',
      get(){
        return App.S3.getUrlByName( this.getDataValue('image') );
      },
      set(image_t){
        this.setDataValue('image', !App.isString(image_t)
          ? ''
          : image_t.split('/').length >= 3
            ? image_t.split('/').pop().trim()
            : image_t
        );
      },
    },
    name: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
    },
    description: {
      type: DataTypes.TEXT, allowNull: true, defaultValue: '',
    },
    zip: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
    },
    street: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
    },
    // NOTE: what data type should it be, and range ???
    rating: {
      type: Sequelize.REAL, allowNull: false, defaultValue: 0,
    },
    type: {
      type: Sequelize.ENUM, required: true, values: RESTAURANT_TYPES,
      defaultValue: RESTAURANT_TYPES[ 0 ],
    },
    lat: {
      type: DataTypes.DECIMAL(3+8,8), allowNull: true, defaultValue: 0,
    },
    lon: {
      type: DataTypes.DECIMAL(3+8,8), allowNull: true, defaultValue: 0,
    },
    isOpen: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    phone: {
      type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
    },
    email: {
      type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
    },
    website: {
      type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
    },
    orderPrepTime: { // orderTimePreparaition
      type: DataTypes.INTEGER(4).UNSIGNED, allowNull: true, defaultValue: 30,
    },
    shareableLink: {
      type: DataTypes.VIRTUAL,
      get(){
        const restaurantId = this.get('id') || this.getDataValue('id');
        return Model.getSharableLinkById( restaurantId );
      },
      set(){},
    },
    isVerified: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    verifiedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isRestricted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    restrictedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    // just in sign-up (requested by client)
    comment: {
      type: DataTypes.TEXT, allowNull: true, defaultValue: '',
    },

    // [inner][stripe]
    personId: { // person_***
      type: DataTypes.STRING, allowNull: true, defaultValue: null
    },
    accountId: { // acct_***
      type: DataTypes.STRING, allowNull: true, defaultValue: null
    },
    isKycCompleted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    kycCompletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isOpeningHoursSet: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },

    // [inner][flags]
    // [innet-statistic]
    totalOrders:{
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalAcceptedOrders:{
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalCanceledOrders:{
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalIncomeInCent:{
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    totalPreparationTimeInSeconds:{
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
    },
    // totalCompletedOrders:{
    //   type: DataTypes.BIGINT(8).UNSIGNED, allowNull: false, defaultValue: 0,
    // },
    timezone: {
      type: DataTypes.STRING, allowNull: true, defaultValue: 'n/a',
    },
    avgRating: {
      type: DataTypes.VIRTUAL,
      get(){
        const rating = this.getDataValue('rating');
        const totalOrders = this.getDataValue('totalOrders');
        return ( App.isPosNumber(rating) &&  App.isPosNumber(totalOrders) )
          ? +( rating / totalOrders ).toFixed(2)
          : 0;
      },
      set(){},
    },
    // [inner]:[flags]:[payments]
    balance: {
      type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, defaultValue: 0
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
      'id', 'userId', 'personId', 'accountId', 'totalOrders', 'balance',
      // 'isKycCompleted'
    ];
  }

  Model.getTypes = function ({asArray=false}={}) {
    return Model._mapDict(RESTAURANT_TYPES, {asArray} );
  };

  Model.getByUserId = async function (userId) {
    if( !App.isPosNumber(Math.floor((+userId))) ) return null;
    return await Model.findOne({
      where: { userId: Math.floor((+userId)) },
    });
  };

  Model.getSharableLinkById = function (restaurantId) {
    restaurantId = (Math.floor(+restaurantId) || 0);
    return App.toAppPath('web', 'public.share-restaurant', restaurantId, true );
  };

  Model.calcOrderPickUpTime = function ({fromDate=false, add=0, timezone='', format=App.DT.moment.defaultFormat}={}) {

    if( !App.DT.isValidDate(fromDate) ){
      console.error(` calcOrderPickUpTime(fromDate: ${fromDate}, add: ${add}, timezone: ${timezone}, format: ${format}) is not valid date`);
      return '';
    }

    const pickUpDateTime = App.DT.moment(fromDate)
      .add( add, 'minutes' )
      .tz( timezone );

    return (format ? pickUpDateTime.format( format ) : pickUpDateTime);
    // .format('ha z');
    // .format( moment.humanDatetimeFormat );
    // .format( moment.humanTimeFormat );
  };

  Model.getAllOrdersWhere = async function(
    whereOrder={}, 
    whereSupplier={}, 
    {offset=0,limit=15,order='desc',orderBy='id'}={}
  ) {

    const params = {
      where: {
        ...( App.isObject(whereOrder) ? whereOrder : {} ),
        // courierId: {
        //   [ App.DB.Op.not ]: null,
        // },
        // [ App.DB.Op.and ]: {
        //   status: {
        //     [ App.DB.Op.or ]: [
        //       // statuses.processing,
        //       statuses.refunded,
        //       statuses.canceled,
        //       statuses.delivered,
        //       statuses.discarded,
        //     ]
        //   }            
        // }
      },
      distinct: true,
      attributes: [
        'id', 'status', 'orderType', 'totalPrice', 'totalItems',
        'isDeliveredByCourier', 'deliveredByCourierAt',
        'isCourierRatedByClient', 'courierRatedByClientAt',
        'courierRating',
        'isOrderRatedByClient', 'orderRatedByClientAt',
        'isRejectedByClient', 'rejectedByClientAt', 'rejectionReason',
        'isCanceledByClient', 'canceledByClientAt', 'cancellationReason',
        'isPaid', 'paidAt',
        'isRefunded', 'refundedAt',
        'isClientActionRequired', 'clientActionRequiredAt',
        'isClientActionExecuted', 'clientActionExecutedAt',
        'createdAt',
      ],
      include: [
        {
          required: true,
          model: App.getModel('Client'),
          attributes: [
            'id',
            // 'isVerified', // 'verifiedAt',
            // 'isRestricted','restrictedAt',
            // 'customerId',
            'lat','lon'
          ],
          include: [{
            required: true,
            model: App.getModel('User'),
            attributes: [
              'id','phone','gender','image','firstName','lastName',
            ],
          }]
        },
        {
          required: false, // Optional - only for on-site presence orders
          model: App.getModel('OrderOnSitePresenceDetails'),
          attributes: [
            'id', 'eventDate', 'eventStartTime', 'eventEndTime',
            'numberOfPeople', 'numberOfHours', 'specialRequests',
            'estimatedBasePrice', 'estimatedServiceFee', 'estimatedTotalPrice',
            'restaurantAcceptedAt', 'restaurantRejectedAt', 'rejectionReason',
            'acceptanceDeadline',
          ],
        },
        {
          required: false, // Optional - only for catering orders
          model: App.getModel('OrderCateringDetails'),
          as: 'OrderCateringDetails',
          attributes: [
            'id', 'eventDate', 'eventStartTime', 'eventEndTime',
            'deliveryMethod', 'deliveryAddress', 'deliveryLatitude', 'deliveryLongitude',
            'estimatedTotalPeople', 'specialRequests',
            'estimatedBasePrice', 'estimatedServiceFee', 'estimatedTotalPrice',
            'firstPaymentAmount', 'firstPaymentDueDate', 'firstPaymentPaidAt',
            'secondPaymentAmount', 'secondPaymentDueDate', 'secondPaymentPaidAt',
            'restaurantAcceptedAt', 'restaurantRejectedAt', 'rejectionReason',
            'acceptanceDeadline',
          ],
        },
        {
          required: true,
          model: App.getModel('OrderSupplier'),
          where: {
            // restaurantId,
            // [ App.DB.Op.and ]: {
            //   [ App.DB.Op.or ]: {
            //     // isTakenByCourier: true,
            //     isCanceledByRestaurant: true,
            //     isAcceptedByRestaurant: true,
            //     isOrderReady: true,
            //     // isOrderDelayed: true,
            //   }
            // }
            ...( App.isObject(whereSupplier) ? whereSupplier : {} ),
          },
          attributes: [
            'id', 'restaurantId', 'totalPrice', 'totalItems',
            'isTakenByCourier', 'takenByCourierAt',
            'isCourierArrived', 'courierArrivedAt',
            'isCanceledByRestaurant', 'canceledByRestaurantAt', 'cancellationReason',
            'isAcceptedByRestaurant', 'acceptedByRestaurantAt',
            'isOrderReady', 'orderReadyAt',
            'isOrderDelayed', 'orderDelayedAt', 'orderDelayedFor',
            // 'createdAt',
          ],
          include: [{
            model: App.getModel('OrderSupplierItem'),
            attributes: [
              'id','price','amount','totalPrice',
              // 'isRatedByClient','ratedAt','rating'
            ],
            include: [{
              model: App.getModel('MenuItem'),
              attributes: [
                'id',
                'name','image','rating','isAvailable','price',
                // 'order','description','kcal','proteins','fats','carbs',
              ],
            }],
          }],
        },
      ],

      // attributes: ['id','name','description','order'],
      order: [[ orderBy, order ]],
      offset: offset,
      limit: limit,
    };

    const mOrders = await App.getModel('Order').findAndCountAll( params );
    return mOrders;

  }

  return Model;

}


/*

[history]: [
  <Order>: {
    'id', 'status','orderType','totalPrice','totalItems',
    'isDeliveredByCourier', 'deliveredByCourierAt',
    'isCourierRatedByClient', 'courierRatedByClientAt',
    'courierRating',
    'isOrderRatedByClient', 'orderRatedByClientAt',
    'isRejectedByClient', 'rejectedByClientAt', 'rejectionReason',
    'isCanceledByClient', 'canceledByClientAt', 'cancellationReason',
    'isPaid', 'paidAt',
    'isRefunded', 'refundedAt',
    'isClientActionRequired', 'clientActionRequiredAt',
    'isClientActionExecuted', 'clientActionExecutedAt',
    'createdAt',
    <Client>: {
      'id','lat','lon'
      <User>: {
        'id','phone','gender','image','firstName','lastName',
      }
    },
    <OrderOnSitePresenceDetails>: { // Optional - only present for on-site orders
      'id', 'eventDate', 'eventStartTime', 'eventEndTime',
      'numberOfPeople', 'numberOfHours', 'specialRequests',
      'estimatedBasePrice', 'estimatedServiceFee', 'estimatedTotalPrice',
      'restaurantAcceptedAt', 'restaurantRejectedAt', 'rejectionReason',
      'acceptanceDeadline',
    },
    <OrderCateringDetails>: { // Optional - only present for catering orders
      'id', 'eventDate', 'eventStartTime', 'eventEndTime',
      'deliveryMethod', 'deliveryAddress', 'deliveryLatitude', 'deliveryLongitude',
      'estimatedTotalPeople', 'specialRequests',
      'estimatedBasePrice', 'estimatedServiceFee', 'estimatedTotalPrice',
      'firstPaymentAmount', 'firstPaymentDueDate', 'firstPaymentPaidAt',
      'secondPaymentAmount', 'secondPaymentDueDate', 'secondPaymentPaidAt',
      'restaurantAcceptedAt', 'restaurantRejectedAt', 'rejectionReason',
      'acceptanceDeadline',
    },
    <OrderSupplier>: {
      'id','restaurantId','totalPrice','totalItems',
      'isTakenByCourier', 'takenByCourierAt',
      'isCourierArrived', 'courierArrivedAt',
      'isCanceledByRestaurant', 'canceledByRestaurantAt','cancellationReason',
      'isAcceptedByRestaurant', 'acceptedByRestaurantAt',
      'isOrderReady', 'orderReadyAt',
      'isOrderDelayed', 'orderDelayedFor',
      <OrderSupplierItem>: {
        'id','price','amount','totalPrice',
        <MenuItem>: {
          'name','image','rating','isAvailable','price',
        }
      },
    }
  }
]

*/