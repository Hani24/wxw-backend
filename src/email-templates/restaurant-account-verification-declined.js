
module.exports = async ( mMailer, { password, firstName, lastName, lang='en' })=>{

  const App = mMailer.App;

  return await mMailer.baseTemplate('main', {
    body: {
      title: App.t([App.getEnv('APP_NAME'),'Team.'], lang), 
      body: `
        <div>
          <div> ${ App.t([
            `${firstName} ${lastName}`,
            `we regret to inform you that your restaurant application for ${App.getEnv('APP_NAME')} was rejected.`
          ], lang) }</div>
          <br/>
        </div>
      `,
    }
  });

}
// <div> ${ App.t(['restaurant-account-verification-declined'], lang) } </div>