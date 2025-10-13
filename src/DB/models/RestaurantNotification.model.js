const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const RESTAURANT_EVENTS = App.getDictByName('RESTAURANT_EVENTS');
  const NOTIFICATION_TYPES = App.getDictByName('NOTIFICATION_TYPES_RESTAURANT');

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
    title: {
      type: DataTypes.STRING, allowNull: false, defaultValue: '',
    },
    message: {
      type: DataTypes.TEXT, allowNull: false, defaultValue: '',
    },
    image: {
      type: DataTypes.STRING, allowNull: true, defaultValue: 'notifications.default.png',
      get(){
        return App.S3.getUrlByName( this.getDataValue('image') );
      },
      // set(image){
      //   // this.setDataValue('image', image);
      // },
    },
    data: {
      type: DataTypes.TEXT, allowNull: false, defaultValue: '{}',
      get(){
        try{
          const json_t = JSON.parse(this.getDataValue('data'));
          return json_t;
        }catch(e){}
        return {};
      }
    },
    event: {
      type: Sequelize.ENUM, required: true, values: RESTAURANT_EVENTS,
      defaultValue: RESTAURANT_EVENTS[ 0 ],
    },
    type: {
      type: Sequelize.ENUM, required: true, values: NOTIFICATION_TYPES,
      defaultValue: NOTIFICATION_TYPES[ 0 ],
    },
    isRead: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE, allowNull: true, defaultValue: null,
    },
  });

  Model.getTypes = function({asArray=false}={}){
    return Model._mapDict(NOTIFICATION_TYPES, {asArray});
  }

  Model.getEvents = function ({asArray=false}={}) {
    return Model._mapDict(RESTAURANT_EVENTS, {asArray} );
  };

  Model.notifyById = async function( id=0, notifyData={}, ackTimeout=false, debug=false){

    const mRestaurant = await App.getModel('Restaurant').getByFields({
      id: (+id),
    });

    return await Model.notify(mRestaurant, notifyData, ackTimeout, debug );

  }

  Model.notify = async function( mRestaurant=false, {event,title='',message='',image=false,data={},type='info',ack=false}={}, ackTimeout=false, debug=false){

    if( !App.isObject(mRestaurant) || !App.isPosNumber(mRestaurant.id) )
      return {success: false, message: `Restaurant does not exists`, data: null};

    if( !App.isString(event) || !App.isString(title) || !App.isString(message) )
      return {success: false, message: `[event && title && message] is required`, data: null};

    if( !Model.getEvents().hasOwnProperty(event) )
      return {success: false, message: `event: [${event}] is not supported`, data: null};

    if( !NOTIFICATION_TYPES.includes(type) ){
      console.error(` #notify: [type:${type}] is not valid, set to default: ${NOTIFICATION_TYPES[0]}`);
      type = NOTIFICATION_TYPES[0];
    }

    data = {
      ...(App.isObject(data) ? data : {}),
      datetime: App.getISODate(),
      type,
    };

    const json_t = JSON.stringify(data);
    title = App.t(title || event);

    const mModel = await Model.create({
      restaurantId: mRestaurant.id,
      event,
      title,
      message,
      image: image || 'notifications.default.png',
      data: json_t,
      type,
    });

    if( !App.isObject(mModel) || !App.isPosNumber(mModel.id) )
      return {success: false, message: `Failed to create notification`, data: null};

    const method = ack ? 'broadcastToRestaurantWithAck' : 'broadcastToRestaurant';

    const notifyRes = await App.socket[ method ]( mRestaurant.id, event, {
      event: mModel.event,
      title: mModel.title,
      message: mModel.message,
      image: mModel.image,
      data: data,
    }, (ack ? ackTimeout : debug), (ack ? debug : null));

    if( !notifyRes.success && debug ){
      console.error(` #notify: ${notifyRes.message}`);
      console.json({ notifyRes });
    }

    return notifyRes;

  }

  Model.getAllByRestaurantIdWhere = async function( id=0, where={}, {offset=0, limit=15, order='desc'}={} ){

    const mNotifications = await Model.findAndCountAll({
      where: {
        ...(App.isObject(where) ? where : {}),
        restaurantId: (+id),
      },
      attributes: ['id','title','message','data','image','type','isRead','readAt','createdAt'],
      order: [[ 'id', order ]],
      offset,
      limit,
    });

    // [post-processing]
    (async()=>{
      await console.sleep(250);
      for( const mNotification of mNotifications.rows ){
        await console.sleep(10);
        if( !mNotification.isRead ){
          await mNotification.update({
            isRead: true,
            readAt: App.getISODate(),
          });
        }
      }
    })();

    return mNotifications;

  }

  Model.getAllByRestaurantId = async function( id=0, pagination={} ){
    return await Model.getAllByRestaurantIdWhere( id, {}, pagination );
  }

  return Model;

}
