module.exports = async ( mMailer, { password, lang='en' })=>{
  const App = mMailer.App;
  return await mMailer.baseTemplate('main', {
    body: {
      title: `${ App.t(['Insuficient stripe balance'], lang) }`, 
      body: `
        <div style="text-align:center; padding: 20px;">
          <div> ${ App.t(['Failed to create auto-payout'], lang) } </div>
          <br/>
          <div>
            Reason: <b>${'Insuficient balance'}</b>
          </div>
          </div>
        </div>
      `,
    }
  });
}
