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
  });

  Model.getByClientId = async function (clientId) {

    clientId = Math.floor((+clientId));
    if( !App.isPosNumber(clientId) ) return null;
    let mCart = await Model.getByFields({ clientId });
    // console.json({mCart: {getByClientId: { clientId, mCart }}});

    if( !App.isObject(mCart) || !App.isPosNumber(mCart.id) ){
      mCart = await Model.create({ clientId });
    }

    return mCart;
  }

  Model.getPopulatedByClientId = async function (clientId) {

    const mCart = await Model.getByClientId( clientId );
    if( !App.isObject(mCart) ) return null;

    return await App.getModel('Restaurant').findAll({
      attributes: [
        'id','name','image','isOpen','rating','type','lat','lon','orderPrepTime','street',
      ],
      include: [{
        model: App.getModel('CartItem'),
        where: { cartId: mCart.id },
        attributes: ['id','amount'],
        include: [{
          model: App.getModel('MenuItem'),
          // where: { isAvailable: true, },
          attributes: [
            'id','name','image','description','rating','price'
            // 'kcal','proteins','fats','carbs',
          ],
        }]
      }]
    });
  };

  Model.isCartEmptyByClientId = async function(clientId){
    const mRestaurants = await Model.getPopulatedByClientId( clientId );

    return App.isArray(mRestaurants) 
      ? (mRestaurants.length > 0 ? false : true )
      : ( true );

  }

  Model.emptyByClientId = async function(clientId){
    const mCart = await App.getModel('Cart').getByClientId(clientId);

    return (!App.isObject(mCart) || !App.isPosNumber(mCart.id) )
      ? false
      : ( !!(await App.getModel('CartItem').destroy({
          where: { cartId: mCart.id }
        })) );

  }

  return Model;

}
