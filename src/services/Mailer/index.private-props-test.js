"use strict";
// const logger = require('mii-logger.js');
const nodemailer = require("nodemailer");

// const RTools = require('../../tools/router-tools');
const RegsExps = require('../../services/RegsExps');

// SMTP_GATEWAY_USE_SECURE=true
// SMTP_GATEWAY_HOST=smtp.yandex.com
// SMTP_GATEWAY_PORT=465
// SMTP_EMAIL_EMAIL=noreplay
// SMTP_EMAIL_PASSWORD=*********
// SMTP_EMAIL_DOMAIN=3dmadcat.com
// SMTP_EMAIL_FROM=PMP-Studio
const SMTP_TEMPLATE_PROTOCOL = process.env.SMTP_TEMPLATE_PROTOCOL; // http
const SMTP_TEMPLATE_DOMAIN = process.env.SMTP_TEMPLATE_DOMAIN; // back.pmp.aumagency.ru
const SMTP_TEMPLATE_PORT = process.env.SMTP_TEMPLATE_PORT; // 3003
const SMTP_TEMPLATE_PROTOHOST = process.env.SMTP_TEMPLATE_PROTOHOST; // http://back.pmp.aumagency.ru:3003

const templates = require('./templates');
const ALLOWED_EMAIL_DOMAINS = require('./ALLOWED_EMAIL_DOMAINS');

// // Example of usage 
// const someMailRes = await Mailer.send({
//   to: 'ch3ll0v3k@yandex.com',
//   subject: 'This is Subject',
//   data: Mailer.template('main', {
//     body: {
//       title: 'Hello ch3ll0v3k!!', 
//       body: `
//         This is main body.
//         You can ${ Mailer.link('Click the link', '/path') } to activate something ...
//       `,
//     }
//   })
// });

module.exports = class Mailer{

  static #_createAuthConfig( ) {

    const user = `${ process.env.SMTP_EMAIL_EMAIL.split('@')[0] }@${ process.env.SMTP_EMAIL_DOMAIN }`;
    const pass = `${ process.env.SMTP_EMAIL_PASSWORD }`;

    // true for 465, false for other ports
    const conf = {
      host: process.env.SMTP_GATEWAY_HOST,
      port: process.env.SMTP_GATEWAY_PORT,
      secure: process.env.SMTP_GATEWAY_USE_SECURE, 
      auth:{
        type: 'login', // default
        user: user,
        pass: pass,
      },
    };

    return conf;

  }

  static async send( {to=false, subject='no-subject', data='', html=false, encoding='utf-8'}={}){
    return await Mailer.#_send({conf_type: 'noreplay', to, subject, data, html, encoding });
  }

  static async #_send( {conf_type='noreplay', to=false, subject='no-subject', data='', html=false, encoding='utf-8'} ){

    // console.json({ [ conf_type ]: {to, subject, data, html, encoding} });

    return new Promise( async(resolve, reject)=>{
      try{

        to = RegsExps.normalizeEmail( to );

        if( !to || !RegsExps.isValidEmail(to) ){
          resolve({success: false, message: '[0]: email-address-not-valid' });
          return;
        }

        const allowedEmailDomainRes = Mailer.isAllowedEmailDomain( to );
        if( !allowedEmailDomainRes.success ){
          resolve( allowedEmailDomainRes );
          return;
        }

        subject = subject || 'no-subject';
        data = typeof data !== 'string' ? JSON.stringify( data ) : (data || '');
        html = html || data; // fall back to (plain/text)

        const config = Mailer.#_createAuthConfig();

        const transporter = nodemailer.createTransport( config );

        const info = await transporter.sendMail({
          from: `${process.env.SMTP_EMAIL_FROM} <${config.auth.user}>`,
          to: to,
          subject: subject,
          text: data,
          html: html,
        });

        // info: => 
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

        info.emailId = info.messageId;

        const success = info.rejected.length === 0;
        const message = success ? 'email-has-been-sent' : 'could-not-send-email';

        // console.log("Message sent: %s", info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

        resolve({success, message, data: info });

      }catch(e){
        console.warn(` #Mailer:_sent: [${conf_type}]: ${e.message}`);
        console.error( e );
        resolve({success: false, message: 'request-could-not-be-processed'})

      }

    });
  }

  static isAllowedEmailDomain( email ){
    try{

      email = RegsExps.normalizeEmail( email );

      if( !RegsExps.isValidEmail( email ) ){
        return {success: false, message: '[1]: email-address-not-valid' };
      }

      const domain = ((''+email).split('@')[1].split('.')[0]).trim();
      const allowed = ALLOWED_EMAIL_DOMAINS.hasOwnProperty( domain );
      return {
        success: allowed, 
        // default message
        message: (allowed ? 'OK' : '<br/> Please read <a target="_blank" href="/supported-email-domains/"><b>Supported Email domains</b></a> section for more details'),
      };      
    }catch(e){
      console.log(e);
      return {success: false, message: '[2]: email-address-not-valid' };
    }

  }

  static link( text, path='', protodomain=false ){
    const mBase = (protodomain || SMTP_TEMPLATE_PROTOHOST);
    path = (path.charAt(0) === '/' && mBase.charAt(0) === '/') ? path.substr(1, path.length-1) : path;
    const mLink = `<a href="${ mBase }${ path }">${text}</a>`;
    return mLink;
  }

  static template( name, data ){
    return templates.create( name, data );
  }

}


/*

// async..await is not allowed in global scope, must use a wrapper
async function main() {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: "bar@example.com, baz@example.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}
*/