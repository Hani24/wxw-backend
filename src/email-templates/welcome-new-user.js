
module.exports = async ( mMailer, { mUser, lang='en' })=>{

  const App = mMailer.App;

  return await mMailer.baseTemplate('main', {
    body: {
      title: `${ App.t('welcome-new-user', lang) }`, 
      body: `
        <div style="text-align:center; padding: 20px;">
          <h5> ${ App.t('welcome-new-user', lang) } </h5>
          <br/>
          ${ App.t(['TODO: [welcome-new-user] message'], lang) }
        </div>
      `,
    }
  });

}