module.exports = async ( mMailer, { path, webPath, code, lang='en' }={})=>{

  const App = mMailer.App;

  return await mMailer.baseTemplate('main', {
    body: {
      title: `${ App.t('Email verification', lang) }`, 
      body: `
        <div>
          <br/>
          <div> ${ App.t(['Please Verify your email address'], lang) } </div>
          <br/>
          <center>
           ${ mMailer.button( App.t('Verify', lang), (path||webPath), false, true ) }
          </center>
        </div>
      `,
    }
  });

}
