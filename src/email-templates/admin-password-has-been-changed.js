
module.exports = async ( mMailer, { password, lang='en' })=>{

  const App = mMailer.App;

  return await mMailer.baseTemplate('main', {
    body: {
      title: `${ App.t(['Password updated.'], lang) }`, 
      body: `
        <div style="text-align:center; padding: 20px;">
          <div> ${ App.t(['Your password has been changed.'], lang) } </div>
          <br/>
          <div>
            Password: <b>${password}</b>
          </div>
          <br/>
          <div>
            ${ App.t(['If it wasn\'t you - you need to update you password as soon as possible.'], lang, '')}
          </div>
        </div>
      `,
    }
  });

}

// <div> ${ App.t(['password-has-been-changed'], lang) } </div>
// ${ App.t(['if-you-do-not-have-changed-your-password','change-your-password' ], lang, '<br/>')}