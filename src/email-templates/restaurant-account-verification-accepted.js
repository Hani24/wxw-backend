
module.exports = async ( mMailer, { password, firstName, lastName, lang='en' })=>{

  const App = mMailer.App;

  return await mMailer.baseTemplate('main', {
    body: {
      title: App.t(['Welcome','to', `${App.getEnv('APP_NAME')} Team.`], lang), 
      body: `
        <div>
          <div> ${ App.t([
            `${firstName} ${lastName},`,
            `we are glad to inform you that your restaurant application for ${App.getEnv('APP_NAME')} has been approved.`,
            `Glad to have you on board!`
          ], lang) }</div>
          <br/>
        </div>
      `,
    }
  });
}

// <div>
//   ${ App.t(['login-to-start-working-today'], lang)}
// </div>
// <div> ${ App.t(['restaurant-account-verification-accepted'], lang) } </div>
// <div> ${ App.t(['Thank you for join our team.'], lang) } </div>
// <div> ${ App.t(['Your restaurant account has been verified.'], lang) } </div>
