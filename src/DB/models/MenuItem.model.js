const { Sequelize, DataTypes, Model } = require('sequelize');

// CLIENT: 
//   https://ams-llc.atlassian.net/wiki/spaces/MAI/pages/169903672/U05.02+view+the+meal+rating
// RESTO: 
//   https://ams-llc.atlassian.net/wiki/spaces/MAI/pages/169902487/R+02.03+manage+the+menu+items
//   https://ams-llc.atlassian.net/wiki/spaces/MAI/pages/169902524/R+02.04+change+the+statuses

// Next to the name of each category the partner can click on ‘add new item’ button.
// The partner should enter the name of the menu item (up to 20 symbols)
// The partner should enter the compound of the menu item (up to 300 symbols)

// The partner should enter the nutritional value of the product: 
// - Kcal (up to 5 numeral symbols)
// - Proteins  (up to 5 numeral symbols)
// - Fats (up to 5 numeral symbols)
// - Carbs (up to 5 numeral symbols)
// - Price,$ (up to 5 numeral symbols)

// All the fields should be obligatory: if the partner clicks on ‘add’ button and he didn’t complete all the forms, the message ‘please, fill in all the fields’ and the red border of the field should appear. 
// When the user clicks on ‘+’, the system file manager should be opened.
// The partner  can chose the one  image to attach them to the item
// The partner  can’t choose more than 1 image. 
// The partner  should click on the added menu item in the list to open the change the menu item information. 
// The status of the added menu item should be set as ‘not active’ - the menu item shouldn’t be displayed in the user’s restaurant menu.
// The partner should click on 'x’ button to delete the menu item
// When the partner clicks on ‘x', the modal window 'Do you want to delete the menu item?’ appears.
// When the partner agrees to delete the menu item, the  menu item should be deleted.
// The rate of the menu item should be displayed (see ‘rating the menu item in user’s part)
// Partner should use ‘drag-n-drop' button to change the position of the menu items.
// The order of the menu items in the menu of a user should be the same as the order of the menu items being set with drag-n-drop button in the admin panel of the partner.
// The partner should drag-n-drop the menu items between the different categories. 
// When the partner deletes a category, all the menu items of the category should also be deleted. 

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const LIMITS = App.getDictByName('LIMITS').MenuItem;

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
    menuCategoryId: {
      type: DataTypes.BIGINT(8).UNSIGNED,
      allowNull: false,
      required: true,
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
      references: {
        model: 'MenuCategories',
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
    name: { // upto 50 syms.
      type: DataTypes.STRING, allowNull: false
    },
    description: { // upto 300 syms.
      type: DataTypes.TEXT, allowNull: false
    },
    kcal: { //(up to 5 numeral symbols)
      type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null
    },
    proteins: { // (up to 5 numeral symbols)
      type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null
    },
    fats: { //(up to 5 numeral symbols)
      type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null
    },
    carbs: { //(up to 5 numeral symbols)
      type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null
    },
    price: {
      type: DataTypes.DECIMAL(8,2), allowNull: false, defaultValue: 0
    },
    isAvailable: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
    },
    order: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0
    },
    rating: {
      type: DataTypes.REAL.UNSIGNED, allowNull: false, defaultValue: 0
    },
    totalRatings: {
      type: DataTypes.BIGINT(8).UNSIGNED, allowNull: true, defaultValue: 0,
    },
    // ex. (5+4+3+5)/4 = 4.25. 
    // The rate is displayed only when 20 rates were made 
    avgRating: {
      type: DataTypes.VIRTUAL,
      get(){
        const rating = this.getDataValue('rating');
        const totalRatings = this.getDataValue('totalRatings');
        return ( App.isPosNumber(rating) && App.isPosNumber(totalRatings) /* && totalRatings > 20 */ )
          ? +( rating / totalRatings ).toFixed(2)
          : 0;
      },
      set(){},
    },
    isDeleted: {
      type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null
    },
  });

  Model.isValidLengthOf = function( type_t, string_t ){
    return 
      App.isString(type_t) && LIMITS.hasOwnProperty(type_t)
      &&
      App.isString(string_t) && string_t.length <= LIMITS[ type_t ];
  }

  Model.getValidLengthOf = function( type_t ){
    return App.isString(type_t) && LIMITS.hasOwnProperty(type_t)
      ? LIMITS[ type_t ]
      : 0;
  }

  /**
   * Model Associations
   */
  Model.associate = function(sequelize) {
    const { MenuCategory, CateringMenuItem } = sequelize.models;

    // MenuItem belongs to MenuCategory
    Model.belongsTo(MenuCategory, {
      foreignKey: 'menuCategoryId',
      as: 'MenuCategory'
    });

    // MenuItem has one CateringMenuItem
    Model.hasOne(CateringMenuItem, {
      foreignKey: 'menuItemId',
      as: 'CateringMenuItem'
    });
  };

  return Model;

}
