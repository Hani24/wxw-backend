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
    isStarted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
    },
    startedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
    isEnded: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false
    },
    endedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
  });

  Model.getByCourierId = async function (courierId) {
    courierId = Math.floor(+courierId);

    if( !(await App.getModel('Courier').isset({id: courierId})) ){
      console.debug(` CourierShift: getByCourierId: ${courierId} => Courier:id does not exists`);
      return null;
    }

    const mCourierShift = await Model.findOne({
      where: {
        courierId,
        isEnded: false,
        // endedAt: { [App.DB.Op.not]: null },
        endedAt: null,
      },
      order: [['id','desc']],
      attributes: [
        'id','courierId','isStarted','startedAt','isEnded','endedAt'
      ]
    });

    return App.isObject(mCourierShift) && App.isPosNumber(mCourierShift.id)
      ? mCourierShift
      : await Model.create({ courierId });

  };

  return Model;

}
