
module.exports = async ( mMailer, { firstName, lastName, lang='en' })=>{

  const App = mMailer.App;

  return await mMailer.baseTemplate('main', {
    body: {
      // title: App.t(['Welcome','to',App.getEnv('APP_NAME'),'Team'], lang), 
      // title: App.t(['courier-account-verification-declined'], lang), 
      title: App.t([App.getEnv('APP_NAME'),'Team.'], lang), 
      body: `
        <div>
          <div>
            ${ App.t([`We regret to inform you that your ${App.getEnv('APP_NAME')} driver application was rejected.`], lang) }
          </div>
          <br/>
        </div>
      `,
    }
  });

}