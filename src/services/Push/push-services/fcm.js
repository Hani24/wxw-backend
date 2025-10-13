const _Base = require('../_Base');
const admin = require("firebase-admin");
const { google } = require('googleapis');
const PUSH_FCM_API_BASE = process.env.PUSH_FCM_API_BASE;
const PUSH_FCM_API_PUSH_PATH = process.env.PUSH_FCM_API_PUSH_PATH;
const PUSH_FCM_API_KEY = process.env.PUSH_FCM_API_KEY;
const FIREBASE_CONFIG = process.env.FIREBASE_CONFIG || '';

module.exports = FCM = class FCM extends _Base{

  constructor(App, params={}){
    super(App, params);
 if (!App.firebase || !App.firebase.admin) {
    throw new Error('Firebase service not initialized!');
  } 
    this.base = PUSH_FCM_API_BASE;
    this.pushPath = PUSH_FCM_API_PUSH_PATH;
    this._key = PUSH_FCM_API_KEY;
    this.admin = App.firebase.admin;
    this.serviceAccount = `${App.root}/${FIREBASE_CONFIG}`;

  }

  stringifyData(data) {
    const result = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        // If the value is already a string, use it as-is; otherwise convert it
        result[key] = typeof value === 'string' ? value : JSON.stringify(value);
      }
    }
    return result;
  }	

  createPacket = (
    { title='', message='', icon='', image='', data={}, link='', href=''}={}, 
    debug=false
  ) => {

    if( debug )
      console.json({ createPacket: { title, message } });

    const tag = `tag-${ this.App.BCrypt.randomSecureToken(8) }`;
    const notificationId = `notificationId-${ this.App.BCrypt.randomSecureToken(8) }`;
    const channelId = 'default';
    const experienceId = this.App.getAppName();
    image = this.App.S3.getUrlByName(icon || image || 'notifications.default.png');
    link = (link || href || '');

    title = (this.App.isString(title) && title.trim().length ? title.trim() : '');
    message = (this.App.isString(message) && message.trim().length ? message.trim() : '');

    // https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages#Message.FIELDS.data
data = this.stringifyData(data);
    const notification_t = {
    message: {
      // Target (token/topic/condition) - set later in _sendToMany
      token: '', 
      
      // Notification content
      notification: {
        title: title,
        body: message,
        image: image
      },
      
      // Custom data payload
      data: data,
      
      // Android-specific config
     // android: {
      //  collapse_key: `col-key-${tag}`,
     //   ttl: '86400s',
    //    notification: {
    //      title: title,
    //      body: message,
    //      image: image,
   //       channel_id: channelId,
       //   tag: tag
   //     }
   //   },
      
      // iOS-specific config
      apns: {
        headers: {
          'apns-priority': '5',
	  'apns-push-type': 'alert'
        },
        payload: {
          aps: {
            alert: {
              title: title,
              body: message,
              'launch-image': image
            },
            sound: 'default',
            badge: 3,
            'mutable-content': 1,
            category: 'NEW_MESSAGE_CATEGORY'
          }
        }
      },
      
      // Web push config (uncomment if needed)
      // webpush: {
      //   headers: {
      //     TTL: '86400'
      //   }
      // }
    },
    // Keep your internal tracking tags
    _tag: tag
    };

    if( debug )
      console.json({ notification_t });
    return notification_t;

  }

  sendToUserByIdInBackground( userId, data={}, debug=false ){
    this.sendToUserByIdAsync( userId, data, debug );
    return true;
  }
async getEndpoint() {
console.log('getEndpoint this._serviceAccount: ', this.serviceAccount);
    const mServiceAccount = require(this.serviceAccount);
	console.log('getEndpoint serviceAccount: ', mServiceAccount);
    const projectId = mServiceAccount.project_id;

console.log('getEndpoint serviceAccount: projectId', projectId );
//  const projectId = this.admin.options.credential.projectId;
  return `${this.base}/v1/projects/${projectId}/messages:send`;
}
  
  async getAccessToken() {
    const MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
    const SCOPES = [MESSAGING_SCOPE];
    return new Promise((resolve, reject) => {
      console.log("#fcm getAccessToken: service account: ", this.serviceAccount);
      const key = require(this.serviceAccount);

      console.log("#fcm getAccessToken: key: ", key);
      const jwtClient = new google.auth.JWT(
        key.client_email,
        null,
        key.private_key,
        SCOPES,
        null
      );
      jwtClient.authorize(function (err, tokens) {
        if (err) {
          reject(err);
          return;
        }
        resolve(tokens.access_token);
      });
    });
  }

 async sendToUserByIdAsync( userId, data={}, debug=false ){

    const packet_t = this.createPacket( data, debug );
    const mFcmsRes = await this.App.getModel('Session').getAllRecentFcmTokensByUserId( userId );

    if( debug ){
      console.json({userId, packet_t});
      console.json({ mFcmsRes });
    }

    if( !mFcmsRes.success )
      return mFcmsRes;

    const pushRes = {
      userId,
      debug,
      success: 0,
      failure: 0,
      devices: {},
    };

    console.log(`  sendToUserByIdAsync: userId: ${userId}`)
    for( const deviceId of Object.keys(mFcmsRes.data) ){
      const deviceFcms = mFcmsRes.data[ deviceId ];
      console.warn(`  deviceFcms: deviceId: ${deviceId}, total => [${deviceFcms.length}]`);

      if( !this.App.isArray(deviceFcms) || !deviceFcms.length ){
        console.warn(`  deviceFcms: !== []`);
        continue;
      }

      for( const mRecord of deviceFcms )
        console.log(`    mRecord: ${mRecord.id}: userId: ${mRecord.userId}, deviceId: ${mRecord.deviceId}: token: ${mRecord.fcm.substr(0,12)}...`);

      if( debug )
        console.debug(`  deviceId: ${deviceId}: total push-tokens: ${deviceFcms.length}`);
      const pushToDeviceRes = await this._sendToMany( packet_t, deviceFcms, userId, debug );

      if( this.App.isUndefined( pushRes.devices[ deviceId ] ) ){
        pushRes.devices[ deviceId ] = {
          success: 0,
          failure: 0,
          tag: 'n/a',
        };        
      }

      pushRes.success += pushToDeviceRes.data.success;
      pushRes.failure += pushToDeviceRes.data.failure;

      pushRes.devices[ deviceId ].success += pushToDeviceRes.data.success;
      pushRes.devices[ deviceId ].failure += pushToDeviceRes.data.failure;
      pushRes.devices[ deviceId ].tag = pushToDeviceRes.data.tag;
      console.log(`    #deviceId: ${deviceId}, success: ${pushToDeviceRes.data.success}, failure: ${pushToDeviceRes.data.failure}, tag: ${pushToDeviceRes.data.tag}`);

    }

    const success = (pushRes.success > 0);
    const message = (success ? 'success': 'no valid fcm tokens where found');
    if( debug )
      console.json({success, message, data: pushRes});

    return { success, message, data: pushRes };

  }

  broadcastInBackground( data={}, debug=false ){
    this.broadcastAsync( data, debug );
    return true;
  }

  async broadcastAsync( data={}, debug=false, dryRun=false ){

    const mFcmsRes = await this.App.getModel('Session').getAllRecentFcmTokens();
    if( debug )
      console.json({ mFcmsRes });

    if( !mFcmsRes.success )
      return mFcmsRes;

    const packet_t = this.createPacket( data, debug );
    if( debug && dryRun )
      console.json({packet_t});

    return dryRun 
      ? {success: false, message: 'dryRun'} 
      : await this._sendToMany( packet_t, mFcmsRes.data, false, debug );

  }

  async _sendToMany( packet_t, fcms, userId=false, debug=false ){

    const data = {
      tag: packet_t._tag,
      success: 0,
      failure: 0,
      userId,
      debug,
    };

    // [fcm-notification]
    for( const mRecord of fcms ){

      try{

        packet_t.message.token = mRecord.fcm || mRecord.fcmPushToken;
        const pushRes = await this.send( packet_t, debug );

        if( debug ){
          console.debug({pushRes});
          console.debug({packet_t});
        }

        if( this.App.isNull(pushRes.data) ){
          pushRes.data = {
            failure: 1,
          };
        }

        if( !pushRes.success || pushRes.data.failure ){
          const fcmMessage = (this.App.isArray(pushRes.data.results) && this.App.isObject(pushRes.data.results[0]) 
            ? pushRes.data.results[0].error || 'no-fcm-error-message'
            : pushRes.message
          );

          console.error(` #fcm:_sendToMany: [res] ${fcmMessage}: session: ${mRecord.id}, user: ${mRecord.userId} `);

          try{

            if( !this.App.isObject(pushRes.data) || ( this.App.isUndefined(pushRes.data.success) || this.App.isUndefined(pushRes.data.failure) ) )
              throw Error(` #fcm:push:_sendToMany: not valid response from google. no cleanup will be applied`);

            // InternalServerError: <= not this, it is google-side server error
            if(!['NOT_FOUND', 'PERMISSION_DENIED'].includes(pushRes.code)){
              console.debug({mRecord});
              console.debug({pushRes});
              console.debug({packet_t});
            }else{

              // remove old/non-working clients push-tokens for the next run
              const updateSessionRes = await this.App.getModel('Session').update(
                { fcmPushToken: '' },
                { where: {id: mRecord.id} }
              );

              if( !this.App.isArray(updateSessionRes) ){
                console.warn(`    #Firebase: could not remove non-working/local fcm push-token`);
              }else{
                console.ok(`    #Firebase: removed non-working/local fcm push-token`);
              }
              console.debug({updateSessionRes});

            }

          }catch(e){
            console.error(`    #Firebase: ${e.message}`);
          }

        }

        data.success += +(!! pushRes.data.success);
        data.failure += +(!! pushRes.data.failure);

        // if it was pushed to one user+ not as broadcast
        // if( userId && (!! pushRes.data.success) ){
        //   if( debug ){
        //     console.debug(`it was pushed to one user+ not as broadcast`);
        //     console.json({userId});
        //   }
        //   break;
        // }

        await console.sleep( this.getPushDelay() );

      }catch(e){
        console.error(` #fcm:_sendToMany: [loop] ${e.message} `);
      }

    }

    const success = (data.success > 0);
    const message = (success ? 'success': 'no valid fcm tokens where found');

    if( debug || !success ){
      console.debug({
        title: packet_t.message.notification.title, 
        body: packet_t.message.notification.body,
        devices: fcms.map((mRecord)=>{ return {[ mRecord.deviceId ]: `${mRecord.fcm.substr(0, 12)}...`} }),
        res: { success, message, data },
      });
    }

    return { success, message, data };

  }

  async send(packet_t={}, debug=false){
console.log('#fcm At Send');
    const endpoint = await this.getEndpoint();
	  console.log('send: fcm: endpoint: ', endpoint);
    const accessToken = await this.getAccessToken();
	  console.log('send: fcm:  accessToken:', accessToken);
    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    };
    delete packet_t._tag;

    console.log(`sendPushRes: pushPath: ${this.pushPath}, packet_t: ${JSON.stringify(packet_t, null, 2)}, headers: ${JSON.stringify(headers, null, 2)}`);

    const sendPushRes = await this._post( this.pushPath, packet_t, headers);

    if( debug ){
      console.json({ packet_t });
      console.json({ headers });
      console.json({ sendPushRes });
    }

    return sendPushRes;
  }
}
