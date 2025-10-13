
module.exports = async ( mMailer, { path, webPath, code, noButton, lang='en' })=>{

  const App = mMailer.App;

  return await mMailer.baseTemplate('main', {
    body: {
      title: `${ App.t('access-recovery', lang) }`, 
      body: `
        <div style="text-align:center; padding: 20px;">
          <h5> ${ App.t('click-access-recovery', lang) } </h5>
          <br/>
          ${ App.t('follow-steps-to-recover-account', lang) }
          <br/>
          <h5>${App.t('access-recovery-code', lang)}</h5>
          <h4>${code}</h4>
          <br/>
          ${ noButton ? '' : mMailer.button( App.t(['access-recovery'], lang), (path||webPath), false, true ) }
        </div>
      `,
    }
  });

}
