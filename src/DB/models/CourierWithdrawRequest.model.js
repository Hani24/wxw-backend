const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const Model = sequelize.define( exportModelWithName, {
    courierId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'Couriers',
        key: 'id'
      },
    },
    amount: {
      type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, defaultValue: 0
    },
    // [deprecated fields]
    cardHolderName: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
    },
    cardNumber: {
      type: DataTypes.STRING, allowNull: true, defaultValue: '',
    },
    // cardExpiryDate: {
    //   type: DataTypes.STRING, allowNull: false, required: true
    // },
    // cardCVV: {
    //   type: DataTypes.STRING, allowNull: false, required: true
    // },
    // /[deprecated fields]
    isAccepted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
    },
    acceptedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isRejected: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
    },
    rejectedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    rejectionReason: {
      type: DataTypes.TEXT, allowNull: true, defaultValue: ''
    },
    isCompleted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
    },
    completedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isPartialyApproved: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
    },
    approvedAmount: {
      type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: false, defaultValue: 0
    },
    // required oly if [isPartialyApproved] e.g. approvedAmount !== requested-amount
    partialyApprovedReason: {
      type: DataTypes.STRING, allowNull: true, defaultValue: null,
    },
    refundedAmount: {
      type: DataTypes.DECIMAL(8,2).UNSIGNED, allowNull: true, defaultValue: 0
    },

    // [inner]:[backend]
    isInitialized: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
    },
    initializedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    // [inner]:[stripe]
    transferId: {
      type: DataTypes.STRING, allowNull: true, defaultValue: null,
    },
    payoutId: {
      type: DataTypes.STRING, allowNull: true, defaultValue: null,
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
      'id', 'courierId','amount', 'isInitialized','isAccepted', 'isRejected', 'isCompleted', 
      'isPartialyApproved', 'approvedAmount','refundedAmount',
      'transferId','payoutId',
    ];
  }

  Model.getAllByCourierId = async function (courierId, {offset=0,limit=15,order='desc',by='id',orderBy=false}={} ) {
    courierId = Math.floor(+courierId);

    if( !(await App.getModel('Courier').isset({id: courierId})) ){
      console.debug(` CourierWithdrawRequest: getByCourierId: ${courierId} => Courier:id does not exists`);
      return { count: 0, rows: [] };
    }

    orderBy = Model.getOrderBy(orderBy || by);

    const mCourierWithdrawRequests = await Model.findAndCountAll({
      where: {
        courierId,
      },
      // distinct: true,
      attributes: [
        'id','courierId','amount','transferId','payoutId',
        'isPartialyApproved','approvedAmount', 'partialyApprovedReason',
        'isRejected','rejectedAt','rejectionReason',
        'isAccepted','acceptedAt',
        'isCompleted','completedAt',
        'createdAt',
        // [deprecated-fields] =>
        // 'cardHolderName','cardNumber',
        'isValidChecksum','checksum',
        ...App.getModel('CourierWithdrawRequest').getChecksumKeys(),
      ],
      offset,
      limit,
      order: [[ orderBy, order ]]
    });

    return mCourierWithdrawRequests;

  };

  return Model;

}
