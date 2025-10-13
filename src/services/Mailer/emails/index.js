const emails = {}

const createEmailTemplate = async ( mMailer, templateName, data )=>{

  const {App} = mMailer;

  if( !emails.hasOwnProperty( templateName ) ){
    console.error(` #Mailer.[emails]createEmailTemplate: Unknown [email-template-name]: [${ templateName }] `);
    return '';
  }

  let tmpl = await emails[ templateName ]( mMailer, data );

  // const envs = [
  //   'AWS_S3_ENDPOINT',
  // ];
  // for( const env of envs ){
  //   const mEnv = App.getEnv(env);
  //   // console.log({mEnv, env});
  //   const mRegExp = new RegExp(`{${env}}`, 'g');
  //   tmpl = tmpl.replace(mRegExp, mEnv);
  // }

  return tmpl;
}

module.exports = ( mMailer )=>{

  const {App} = mMailer;

  console.log(` #emails: reading email templates`);

  const emails_root = `${App.config.root}${App.config.emails_root}`;

  for( const jsEmail of console.listDir(emails_root) ){

    if( !jsEmail.endsWith('.js') ){
      console.log(` #emails: email template: [${jsEmail}] is not an [js] file`);
      continue;
    }

    const name = (jsEmail.split('.js')[0]).trim();
    emails[ name ] = require(`${emails_root}/${ jsEmail }`);

    if( typeof emails[ name ] !== 'function' ){
      console.error(` #Mailer: read email template: [${jsEmail}] is not an [js] function`);
      delete emails[ name ];
      continue;
    }

    console.log(`   Added template: [${ console.B(name) }]`);

  }

  return {
    createEmailTemplate,
  }

}

