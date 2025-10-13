const { Sequelize, DataTypes, Model } = require('sequelize');

module.exports = async( exportModelWithName, App, params, sequelize )=>{

  const NOTIFICATION_TYPES = App.getDictByName('NOTIFICATION_TYPES_CLIENT');

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

  Model.pushToClientById = async function( id=0, pushData={}, debug=false){

    const mClient = await App.getModel('Client').findOne({
      where: {
        id: (+id),
      },
      attributes: ['id','userId']
    });

    if( !App.isObject(mClient) || !App.isPosNumber(mClient.id) )
      return {success: false, message: `Client does not exists`, data: null};

    return await Model.pushToClient(mClient, pushData, debug );

  }

  Model.pushToClient = async function( mClient=false, {title=null, message=null,image=null,data={},type='info'}={}, debug=false ){

    const types = Model.getTypes({asArray: true});

    if( !App.isObject(mClient) || !App.isPosNumber(mClient.id) )
      return {success: false, message: `Client does not exists`, data: null};

    if( !App.isString(title) || !App.isString(message) )
      return {success: false, message: `[title && message] is required`, data: null};

    if( !types.includes(type) ){
      console.error(` #pushToClient: [type:${type}] is not valid, set to default: ${types[0]}`);
      type = types[0];
    }

    const roles = App.getModel('User').getRoles();
    title = (title.replace(':',''));
    message = (`${App.tools.ucFirst(message)}`).replace('..','.');

    data = {
      ...(App.isObject(data) ? data : {}),
      datetime: App.getISODate(),
      type,
    };

    const json_t = JSON.stringify(data);

    const mModel = await Model.create({
      clientId: mClient.id,
      title,
      message,
      image: image || 'notifications.default.png',
      data: json_t,
      type,
    });

    if( !App.isObject(mModel) || !App.isPosNumber(mModel.id) )
      return {success: false, message: `Failed to create notification`, data: null};

    // don't send [push] if currnet [role] is not required [role]
    if( (await App.getModel('User').isset({id: mClient.userId, role: roles.client})) ){
      const pushRes = await App.Push.fcm.sendToUserByIdAsync( mClient.userId, {
        title: mModel.title,
        message: mModel.message,
        image: mModel.image,
        data: data,
      }, debug); 

      if( !pushRes.success ){
        // return {success: false, message: `Failed to create push-notification`, data: null};
        // console.warn(` #pushToClient: ${pushRes.message}`);
        // console.json({ pushRes });
      }

      return pushRes;
    }

    return {success: false, message: 'The current Client has changed his account to a Courier'};

  }

  Model.getAllByClientIdWhere = async function( id=0, where={}, {offset=0, limit=15, order='desc'}={} ){

    const mNotifications = await Model.findAndCountAll({
      where: {
        clientId: (+id),
        ...(App.isObject(where) ? where : {}),
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
        if( !mNotification.isRead ){
          await console.sleep(10);
          await mNotification.update({
            isRead: true,
            readAt: App.getISODate(),
          });
        }
      }
    })();

    return mNotifications;

  }

  Model.getAllByClientId = async function( id=0, pagination={} ){
    return await Model.getAllByClientIdWhere( id, {}, pagination );
  }

  return Model;

}
