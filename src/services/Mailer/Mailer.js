"use strict";

const logger = require('mii-logger.js');
const nodemailer = require("nodemailer");
const mg = require('nodemailer-mailgun-transport');
const templates = require('./templates');
const emails = require('./emails');
const ALLOWED_EMAIL_DOMAINS = require('./ALLOWED_EMAIL_DOMAINS');

const DOMAIN = process.env.DOMAIN || false;
const PROTODOMAIN = process.env.PROTODOMAIN || false;
const SMTP_GATEWAY_USE_SECURE = process.env.SMTP_GATEWAY_USE_SECURE || false;
const SMTP_GATEWAY_HOST = process.env.SMTP_GATEWAY_HOST || false;
const SMTP_GATEWAY_PORT = process.env.SMTP_GATEWAY_PORT || false;
const SMTP_EMAIL_EMAIL = process.env.SMTP_EMAIL_EMAIL || false;
const SMTP_EMAIL_PASSWORD = process.env.SMTP_EMAIL_PASSWORD || false;
const SMTP_EMAIL_DOMAIN = process.env.SMTP_EMAIL_DOMAIN || false;
const SMTP_EMAIL_FROM = process.env.SMTP_EMAIL_FROM || false;
const SMTP_TEMPLATE_PROTOCOL = process.env.SMTP_TEMPLATE_PROTOCOL || false;
const SMTP_TEMPLATE_DOMAIN = process.env.SMTP_TEMPLATE_DOMAIN || false;
const SMTP_TEMPLATE_PORT = process.env.SMTP_TEMPLATE_PORT || false;
const SMTP_TEMPLATE_PROTOHOST = process.env.SMTP_TEMPLATE_PROTOHOST || false;

module.exports = class Mailer{

  constructor(App, params={}){
    this.App = App;
    this.params = params;

    this.emails = null;
    this.templates = null;
    this._config = null;
    this._init();

  }

  _init(){
    console.line();
    console.info(` #Mailer:init`);
    this._config = this._createAuthConfig();
    this.emails = emails( this );
    this.templates = templates( this );

    console.ok(` #Mailer:inited`);
    this.App.emit('Mailer:ready');
  }

  async send( {to=false, subject='no-subject', data='', html=false, encoding='utf-8', dryRun=false}={}){
    return await this._send({to, subject, data, html, encoding, dryRun });
  }

  async _send( {to=false, subject='no-subject', data='', html=false, encoding='utf-8', dryRun=false}={} ){

    return new Promise( async(resolve, reject)=>{
      try{

        // return resolve({success: true, message: 'Mailer is disabled ...' });

        to = this.App.tools.normalizeEmail( to );

        if( !to || !this.App.tools.isValidEmail(to) )
          return resolve({success: false, message: '[0]: email-address-not-valid' });

        const allowedEmailDomainRes = this.isAllowedEmailDomain( to );
        if( !allowedEmailDomainRes.success )
          return resolve( allowedEmailDomainRes );

        subject = subject || 'no-subject';
        data = !this.App.isString(data) ? JSON.stringify( data ) : (data || '');
        html = html || data; // fall back to (plain/text)

        if( !data )
          return resolve({success:false, message: 'Email data/body is empty, aborting', data });

        if( dryRun ){
          return resolve({success:true, message: 'Dry-Run', data: {
            from: `${SMTP_EMAIL_FROM} <${this._config.auth.user}>`,
            to: to,
            subject: subject,
            text: data,
            html: html,
          }});          
        }

        const transporter = this._createTransport('SMTP');

        const sendRes = await transporter.sendMail({
          from: `${SMTP_EMAIL_FROM} <${this._config.auth.user}>`,
          to: to,
          subject: subject,
          text: data,
          html: html,
        });

        // console.json({ sendRes });

        // if [MailGun]
        // {
        //   "sendRes": {
        //     "id": "<20211008025607.1.6F5B5B193AFB10E3@sandbox0fd50ac9234e4c328bda567fd6a03599.mailgun.org>",
        //     "message": "Queued. Thank you.",
        //     "messageId": "<20211008025607.1.6F5B5B193AFB10E3@sandbox0fd50ac9234e4c328bda567fd6a03599.mailgun.org>"
        //   }
        // }

        // if [SMTP]
        // {
        //   "accepted": [
        //     "ch3ll0v3k@yandex.com"
        //   ],
        //   "rejected": [],
        //   "envelopeTime": 208,
        //   "messageTime": 688,
        //   "messageSize": 851,
        //   "response": "250 2.0.0 Ok: queued on sas1-26681efc71ef.qloud-c.yandex.net as 1591201355-sDgOxMYCt3-MZxak96f",
        //   "envelope": {
        //     "from": "noreplay@3dmadcat.com",
        //     "to": [
        //       "ch3ll0v3k@yandex.com"
        //     ]
        //   },
        //   "messageId": "<17e208a3-5240-85c9-a9eb-e4cd3e65b1f4@3dmadcat.com>"
        // }

        sendRes.emailId = sendRes.messageId;

        const success = this.App.isString(sendRes.messageId); // sendRes.rejected.length === 0;
        const message = success ? 'email-has-been-sent' : 'could-not-send-email';

        // console.log("Message sent: %s", sendRes.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(sendRes));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

        resolve({success, message, data: sendRes });

        // Dev/Debug
        try{
          const mailsRoot = `${this.App.app_root}/../app-runtime/data/emails/`;
          const devId = sendRes.messageId.replace(/[<>]/g,'');
          console.writeFileSync(`${mailsRoot}/${devId}.html`, html);
          // console.jsonToFile(`${mailsRoot}/${devId}.json`, {
          //   date: (new Date()).toISOString(),
          //   from: `${SMTP_EMAIL_FROM} <${this._config.auth.user}>`,
          //   to: to,
          //   subject: subject,          
          // });
        }catch(e){
          console.error(` #Mailer:[debug]: ${e.message}`);
          console.error( e );
        }

      }catch(e){
        console.error(` #Mailer:_sent: ${e.message}`);
        console.error( e );
        resolve({success: false, message: 'request-could-not-be-processed'})

      }

    });
  }

  isAllowedEmailDomain( email ){
    try{

      return { success: true, message: 'OK' };

      // email = this.App.tools.normalizeEmail( email );

      // if( !this.App.isString(email) || !this.App.tools.isValidEmail( email ) )
      //   return {success: false, message: '[1]: email-address-not-valid' };

      // const domain = (email.trim().split('@')[1].split('.')[0]).trim();
      // const allowed = ALLOWED_EMAIL_DOMAINS.hasOwnProperty( domain );
      // return {
      //   success: allowed, 
      //   message: ['provided','email','address','is-not','allowed'],
      // };      
    }catch(e){
      console.log(e);
      return {success: false, message: '[2]: email-address-not-valid' };
    }

  }

  getAllowedEmailDomains(){
    try{
      return {
        success: true,
        message: 'OK',
        data: Object.keys(ALLOWED_EMAIL_DOMAINS),
      };
    }catch(e){
      console.log(e);
      return {success: false, message: 'error' };
    }
  }

  link( text, path='', protodomain=false, noDomain=true ){
    path = (this.App.isString(path) ? path.trim() : '');
    const mBase = noDomain ? (protodomain || PROTODOMAIN || SMTP_TEMPLATE_PROTOHOST) : '';
    path = (path.charAt(0) === '/' && mBase.charAt(0) === '/') ? path.substr(1, path.length-1) : path;
    return this.templates.createPartial('common', 'link', {}, {
      BASE: mBase,
      PATH: path,
      TEXT: text,
    });
  }

  button( text, path='', protodomain=false, noDomain=true ){
    path = (this.App.isString(path) ? path.trim() : '');
    const mBase = noDomain ? (protodomain || PROTODOMAIN || SMTP_TEMPLATE_PROTOHOST) : '';
    path = (path.charAt(0) === '/' && mBase.charAt(0) === '/') ? path.substr(1, path.length-1) : path;
    return this.templates.createPartial('common', 'button', {}, {
      BASE: mBase,
      PATH: path,
      TEXT: text,
    });
  }

  async baseTemplate( name, data={} ){
    try{

      data = this.App.isObject(data) ? data : {}; 

      data.social = {
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
      };

      data.injectEnvs = {
        APP_NAME: this.App.getEnv('APP_NAME'),
        OWNER_NAME: '', // this.App.getEnv('OWNER_NAME'),
        COMPANY_NAME: this.App.getEnv('COMPANY_NAME'),
        AWS_S3_ENDPOINT: this.App.getEnv('AWS_S3_ENDPOINT'),
        DOMAIN: this.App.getEnv('DOMAIN'), // DOMAIN: this.App.getEnv('SMTP_TEMPLATE_DOMAIN'),
        PROTODOMAIN: this.App.getEnv('PROTODOMAIN'), // PROTODOMAIN: App.getEnv('SMTP_TEMPLATE_PROTOHOST'),
        TYPE: 'main',
        YEAR: (new Date()).getFullYear(),
        SUPPORT_EMAIL: 'support', // <support, abuse> is reserver by YANDEX.MAIL
        PRIVACY_POLICY: this.App.toAppPath( 'web', 'public.view-privacy-policy', '', (!!'with-proto-domain')),
        TERMS_AND_CONDITIONS: this.App.toAppPath( 'web', 'public.view-terms-and-conditions', '', (!!'with-proto-domain')),
        // as JSON
        //   'public.get-privacy-policy',
        //   'public.get-terms-and-conditions',
      };

      // const mSocialMediaRes = await this.App.getModel('SocialMedia').getAllPopulated();
      // if( mSocialMediaRes.success ){
      //   for( const mSocialMedia of mSocialMediaRes.data ){
      //     const name = mSocialMedia.name.trim().toLowerCase();
      //     // console.json(name)
      //     if( data.social.hasOwnProperty( name ) ){
      //       data.social[ name ] = mSocialMedia.url;
      //     }
      //   }      
      // }

      // console.log(data.social);
      return await this.templates.create( this, name, data );
    }catch(e){
      console.error(` #Mailer:template: ${e.message}`);
      return false;
    }
  }

  async createEmailTemplate( name, data ){
    try{
      return await this.emails.createEmailTemplate( this, name, data );
    }catch(e){
      console.error(` #Mailer:createEmailTemplate: ${e.message}`);
      console.log(e);
      return false;
    }
  }

  _createTransport( useTransport='SMTP' ) {

    try{

      let transporter = null;

      switch(useTransport){
        case 'SMTP':{
          transporter = nodemailer.createTransport( this._config )
          break;
        }

        case 'SEND-PULSE':{
          transporter = nodemailer.createTransport({
            service: 'SendPulse', // no need to set host or port etc.
            auth: {
              user: this.App.getEnv('SENDPULSE_USER'),
              pass: this.App.getEnv('SENDPULSE_PASSWORD'),
            }
          });
          break;
        }

        case 'MAIL-GUN':{
          transporter = nodemailer.createTransport( mg({
            auth: {
              api_key: this.App.getEnv('MAILGUN_API_KEY'),
              domain: this.App.getEnv('MAILGUN_DOMAIN'),
            }
          }) );
          break;
        }
        default:
          console.error(` #Mailer:_createTransport: unknown mail transporter: ${useTransport}`);

      }

      return transporter;
    }catch(e){
      console.error(` #Mailer:_createTransport: ${e.message}`);
      return false;
    }

  }

  _createAuthConfig() {

    const user = `${ SMTP_EMAIL_EMAIL.split('@')[0] }@${ SMTP_EMAIL_DOMAIN }`;
    const pass = `${ SMTP_EMAIL_PASSWORD }`;

    // true for 465, false for other ports
    const conf = {
      host: SMTP_GATEWAY_HOST,
      port: SMTP_GATEWAY_PORT,
      secure: this.App.getBooleanFromValue(SMTP_GATEWAY_USE_SECURE), 
      // secureConnection: false, // => disable: v3 ??? 
      auth:{
        type: 'login', // default
        user: user,
        pass: pass,
      },
      // tls: {
      //   // ciphers:'SSLv3',
      //   rejectUnauthorized: false
      // }
    };
    // console.json({conf});
    return conf;
  }

}

