
module.exports = async ( mMailer, { path, webPath, code, lang='en' }={})=>{

  const App = mMailer.App;

  return await mMailer.baseTemplate('main', {
    body: {
      title: `${ App.t('Access recovery.', lang) }`, 
      body: `
        <div>
          <div> ${ App.t('Click the button below to regain access to your account.', lang) } </div>
          <br/><br/>
          <center>
           ${ mMailer.button( App.t(['access-recovery'], lang), (path||webPath), false, false ) }
          </center>
        </div>
      `,
    }
  });

}
