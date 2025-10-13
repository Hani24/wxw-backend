const _Base = require('../_Base');

const PUSH_FCM_API_BASE = process.env.PUSH_FCM_API_BASE;
const PUSH_FCM_API_PUSH_PATH = process.env.PUSH_FCM_API_PUSH_PATH;
const PUSH_FCM_API_KEY = process.env.PUSH_FCM_API_KEY;

// const pushRes = await App.Push.fcm.send({ 
//   to: 'fpHzOj-Ql6W5aqh_duxQ6O:APA91bFb_kDLIdiRvTklJAIyf-NtgkIdKd-u5pvojjZWBeb-MIzd6LQMhcYq7lDCoSBUN3G4cu5FzL9n9UAKJ5jRc4rvaFROsr-htFRYLkNRdF9vx1Lzoaci55rvNe0hMpJHSOy3YS49', 
//   // body:{ title: 'this is FCM push title' } 
//   notification: {
//     title: 'This is title', // 'This is title',
//     message: 'This is message', // 'This is message',
//     body: 'This is body', // 'This is message',
//     tag: 'This is tag',
//   },
// });

module.exports = FCM = class FCM extends _Base{

  constructor(App, params={}){
    super(App, params);
    this.base = PUSH_FCM_API_BASE;
    this.pushPath = PUSH_FCM_API_PUSH_PATH;
    this._key = PUSH_FCM_API_KEY;

  }

  createPacket({ 
    to='', token='', title='', subtitle='', message='', body='', data='', tag='', icon='', 
    link='', notificationId=false, experienceId=false, channelId='default'}={}, 
    debug=false
  ){

    const sendData = this.App.isObject( body )
      ? body
      : this.App.isObject( data )
        ? data
        : {};

    if( debug )
      console.json({ createPacket: { to, token, title, message, body, tag } });

    tag = tag || `tag-${ this.App.BCrypt.randomSecureToken(8) }`;
    notificationId = notificationId || `notificationId-${ this.App.BCrypt.randomSecureToken(8) }`;
    channelId = channelId || 'default';
    experienceId = this.App.getAppName();

    message = this.App.isString(message) && message.trim().length ? message.trim() : '';
    body = this.App.isString(body) && body.trim().length ? body.trim() : body;

    const data_t = {
      title: this.App.isString(title) && title.trim().length ? title.trim() : this.App.getAppName(),
      subtitle: this.App.isString(subtitle) && subtitle.trim().length ? subtitle.trim() : '',
      body: (message || ''),
      icon: icon || this.App.getModel('AppNotification').getIconUrl(),
      link: this.App.isString(link) && link.trim().length ? link.trim() : '',
      notificationId,
      experienceId,
      tag,
      channelId,
      channel_id: channelId, 
      data: (sendData || '')
    };

    const notification_t = {
      to: to || token || '',
      token: to || token || '',
      notification: data_t,
      data: {
        icon: data_t.icon,
        title: data_t.title,
        message: data_t.body,
        body: data_t.body,
        link: data_t.link,
        href: data_t.link,
      },
    };

    if( debug )
      console.json({ notification_t });
    return notification_t;

  }

  async send(data={}, debug=false){
    const headers = { 'Authorization': `key=${ this._key }` };

    // data = {
    //   to: 'to',
    //   notification: {
    //     title: 'title', // 'This is title',
    //     body: 'body', // 'This is message',
    //     tag: 'tag',
    //   },
    //   data: {
    //     badge: 32,
    //     // notificationExperienceUrl: 'exp://exp.host/@ch3ll0v3k/N-App',
    //     title: 'title', // 'This is title',
    //     message: 'body', // 'This is message',
    //     body:  {payload:123},
    //     experienceId: '@ch3ll0v3k/N-App', // (REQUIRED !!!) pushes are not delivered if app is open
    //     notificationId: '-1',
    //     remote: 'true',
    //     isMultiple: 'false',
    //     // "notification_object": "{\"title\": \"notification_object.title\",\r\n\"experienceId\": \"@your_community_name/your-expo-project\",\r\n\"notificationId\": -1,\r\n\"isMultiple\": false,\r\n\"remote\": true,\r\n\"data\": {\"pathInJson\": \"data.notification_object.data\", \"key2\": \"value2\"}}"
    //   }
    // };

    // data = this.createPacket( data );

    const sendPushRes = await this._post( this.pushPath, data, headers);

    if( debug ){
      console.json({ data });
      console.json({ headers });
      console.json({ sendPushRes });
    }

    return sendPushRes;
  }

  sendToUserByIdInBackground( userId, data={}, debug=false ){
    this.sendToUserByIdAsync( userId, data, debug );
    return true;
  }

  async sendToUserByIdAsync( userId, data={}, debug=false ){

    const mFcmsRes = await this.App.getModel('Session').getAllRecentFcmTokensByUserId( userId );
    if( debug )
      console.json({ mFcmsRes });

    if( !mFcmsRes.success ){
      return mFcmsRes;
    }

    data = this.createPacket( data );
    if( debug )
      console.json({data});

    return await this._sendToMany( data, mFcmsRes.data, debug, userId );

  }

  broadcastInBackground( data={}, debug=false ){
    this.broadcastAsync( data, debug );
    return true;
  }

  async broadcastAsync( data={}, debug=false ){

    const mFcmsRes = await this.App.getModel('Session').getAllRecentFcmTokens();
    if( debug )
      console.json({ mFcmsRes });

    if( !mFcmsRes.success )
      return mFcmsRes;

    data = this.createPacket( data );
    if( debug )
      console.json({data});

    return await this._sendToMany( data, mFcmsRes.data, debug );

  }

  async _sendToMany( packet_t, fcms, debug=false, userId=false ){

    console.json({packet_t});

    const data = {
      success: 0,
      failure: 0,
    };

    const notifData = this.App.isObject(packet_t.notification.data)
      ? console.toJson(packet_t.notification.data) 
      : packet_t.notification.data;


    // [fcm-notification]
    for( const mRecord of fcms ){

      try{

        packet_t.to = mRecord.fcm;
        const pushRes = await this.send( packet_t );
        if( debug )
          console.log(pushRes);

        if( !pushRes.success ){
          console.error(` #fcm:_sendToMany: [res] ${pushRes.message} `);
          continue;
        }

        data.success += pushRes.data.success;
        data.failure += pushRes.data.failure;
        await console.sleep( this.getPushDelay() );

      }catch(e){
        console.error(` #fcm:_sendToMany: [loop] ${e.message} `);
      }

    }

    // [inner-notification]
    const mUsers = ( userId ) 
      ? [ {id: userId} ]
      : await this.App.getModel('User').findAll({ 
        where: { 
          emailVerified: 1, 
          role: 'user' 
        }, 
        attributes: ['id'], 
        order: [['id','asc']]
      });

    for( const mUser of mUsers ){
      const mNotification = await this.App.getModel('Notification').create({
        userId: mUser.id,
        title: packet_t.notification.title,
        message: packet_t.notification.message || packet_t.notification.body,
        img: packet_t.notification.icon,
        data: notifData,
      });
    }

    if( debug )
      console.json({data});

    const success = (data.success > 0);
    const message = (success ? 'success': 'no valid fcm tokens where found');
    return { success, message, data };

  }

}

if( module.parent ) return;


// 4xx: {
//   "pushRes": {
//     "success": true,
//     "message": "OK",
//     "data": {
//       "multicast_id": 3435525518899966500,
//       "success": 0,
//       "failure": 1,
//       "canonical_ids": 0,
//       "results": [
//         {
//           "error": "NotRegistered"
//         }
//       ]
//     }
//   }
// }

// 2xx: {
//   "pushRes": {
//     "success": true,
//     "message": "OK",
//     "data": {
//       "multicast_id": 4349418637705825300,
//       "success": 1,
//       "failure": 0,
//       "canonical_ids": 0,
//       "results": [
//         {
//           "message_id": "0:1611260339554358%2fd9afcdf9fd7ecd"
//         }
//       ]
//     }
//   }
// }
