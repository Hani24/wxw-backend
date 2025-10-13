
module.exports = async ( mMailer, { password, lang='en' })=>{

  const App = mMailer.App;

  return await mMailer.baseTemplate('main', {
    body: {
      title: `${ App.t('account-recovery', lang) }`, 
      body: `
        <div style="text-align:center; padding: 20px;">
          <h5> ${ App.t('account-recovery', lang) } </h5>
          <br/>
          ${ App.t('account-recovery-password-change-message', lang) }
          <br/>
          (new) password: "<b>${password}</b>"
        </div>
      `,
    }
  });

}