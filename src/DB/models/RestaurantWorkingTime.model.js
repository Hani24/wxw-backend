const { Sequelize, DataTypes, Model } = require('sequelize');

// Bussiness-Hours
module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const WEEK_DAYS = App.getDictByName('WEEK_DAYS');

  const Model = sequelize.define( exportModelWithName, {
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

    isMondayOpen: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    mondayOpenAt: {
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 9, // AM == 09:00
    },
    mondayCloseAt: {
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 10, // PM == 22:00
    },
    isTuesdayOpen: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    tuesdayOpenAt: {
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 9, // AM == 09:00
    },
    tuesdayCloseAt: {
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 10, // PM == 22:00
    },
    isWednesdayOpen: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    wednesdayOpenAt: {
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 9, // AM == 09:00
    },
    wednesdayCloseAt: {
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 10, // PM == 22:00
    },
    isThursdayOpen: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    thursdayOpenAt: {
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 9, // AM == 09:00
    },
    thursdayCloseAt: {
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 10, // PM == 22:00
    },
    isFridayOpen: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    fridayOpenAt: {
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 9, // AM == 09:00
    },
    fridayCloseAt: {
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 10, // PM == 22:00
    },
    isSaturdayOpen: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    saturdayOpenAt: {
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 9, // AM == 09:00
    },
    saturdayCloseAt: {
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 10, // PM == 22:00
    },
    isSundayOpen: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    sundayOpenAt: {
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 9, // AM == 09:00
    },
    sundayCloseAt: {
      type: DataTypes.INTEGER(1).UNSIGNED, allowNull: false, defaultValue: 10, // PM == 22:00
    },
  });

  Model.getWeekDays = function ({asArray=false}={}) {
    return Model._mapDict(WEEK_DAYS, {asArray} );
  };

  Model.getByRestaurantId = async function (restaurantId) {
    if( !App.isPosNumber(Math.floor((+restaurantId))) ) return null;
    restaurantId = Math.floor((+restaurantId));

    const mRestaurantWorkingTime = await Model.findOne({
      where: { restaurantId },
    });

    return App.isObject(mRestaurantWorkingTime) && App.isPosNumber(mRestaurantWorkingTime.id)
      ? mRestaurantWorkingTime
      : await App.getModel('RestaurantWorkingTime').create({
          restaurantId
        });

  };

  Model.getAsObjectByRestaurantId = async function (restaurantId) {

    const mRestaurantWorkingTime = (await Model.getByRestaurantId( restaurantId )) || {};

    return {
      monday: {
        isOpen: mRestaurantWorkingTime.isMondayOpen || 0,
        openAt: mRestaurantWorkingTime.mondayOpenAt || 0,
        closeAt: mRestaurantWorkingTime.mondayCloseAt || 0,
      },
      tuesday: {
        isOpen: mRestaurantWorkingTime.isTuesdayOpen || 0,
        openAt: mRestaurantWorkingTime.tuesdayOpenAt || 0,
        closeAt: mRestaurantWorkingTime.tuesdayCloseAt || 0,
      },
      wednesday: {
        isOpen: mRestaurantWorkingTime.isWednesdayOpen || 0,
        openAt: mRestaurantWorkingTime.wednesdayOpenAt || 0,
        closeAt: mRestaurantWorkingTime.wednesdayCloseAt || 0,
      },
      thursday: {
        isOpen: mRestaurantWorkingTime.isThursdayOpen || 0,
        openAt: mRestaurantWorkingTime.thursdayOpenAt || 0,
        closeAt: mRestaurantWorkingTime.thursdayCloseAt || 0,
      },
      friday: {
        isOpen: mRestaurantWorkingTime.isFridayOpen || 0,
        openAt: mRestaurantWorkingTime.fridayOpenAt || 0,
        closeAt: mRestaurantWorkingTime.fridayCloseAt || 0,
      },
      saturday: {
        isOpen: mRestaurantWorkingTime.isSaturdayOpen || 0,
        openAt: mRestaurantWorkingTime.saturdayOpenAt || 0,
        closeAt: mRestaurantWorkingTime.saturdayCloseAt || 0,
      },
      sunday: {
        isOpen: mRestaurantWorkingTime.isSundayOpen || 0,
        openAt: mRestaurantWorkingTime.sundayOpenAt || 0,
        closeAt: mRestaurantWorkingTime.sundayCloseAt || 0,
      },
    };
  }

  return Model;

}
