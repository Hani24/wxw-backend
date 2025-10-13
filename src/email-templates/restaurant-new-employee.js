
module.exports = async ( mMailer, { password, lang='en' })=>{

  const App = mMailer.App;

  return await mMailer.baseTemplate('main', {
    body: {
      title: `${ App.t(['Welcome','to', App.getEnv('APP_NAME'),'Team.'], lang) }`, 
      body: `
        <center>
          <div>
            ${ App.t(['Please change your temporary password as soon as possible .'], lang) }
          </div>

          <br/>
    
          <div>
            ${ App.t(['your-temporary-password'], lang) }:<br/>
            <b>${password}</b>
          </div>
        </center>
      `,
    }
  });

}



// return await mMailer.baseTemplate('main', {
//   body: {
//     title: `${ App.t('welcome', lang) }`, 
//     body: `
//       <div style="text-align:center; padding: 20px;">
//         <h3> ${ App.t(['welcome','to', App.getEnv('APP_NAME')], lang) } </h3>
//         <br/>

//         <div>
//           ${ App.t(['your-temporary-password'], lang) }
//         </div>

//         <br/>

//         <div>
//           ${ App.t(['account-recovery-password-change-message'], lang) }
//         </div>

//         <br/>
  
//         <div>
//           password: <br/><br/><b>${password}</b>
//         </div>
//       </div>
//     `,
//   }
// });
