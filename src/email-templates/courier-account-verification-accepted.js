
module.exports = async ( mMailer, { firstName, lastName, lang='en' })=>{

  const App = mMailer.App;

  return await mMailer.baseTemplate('main', {
    body: {
      title: App.t(['Welcome','to',App.getEnv('APP_NAME'),'Team.'], lang), 
      body: `
        <div>
          <div> ${ App.t([`${firstName} ${lastName},`,'we\'re glad to have you on board!'], lang) } </div>
          <br/>
          <div> ${ App.t(['Your courier account has been verified.'], lang) } </div>
          <br/>    
        </div>
      `,
    }
  });

}

// <div>
//   ${ App.t(['login-to-start-working-today'], lang)}
// </div>
// <br/>
// <div> ${ App.t(['courier-account-verification-accepted'], lang) } </div>
