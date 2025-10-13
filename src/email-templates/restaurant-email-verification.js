
module.exports = async ( mMailer, { path, webPath, code, lang='en' }={})=>{

  const App = mMailer.App;

  return await mMailer.baseTemplate('main', {
    body: {
      title: `${ App.t('Email verification.', lang) }`, 
      body: `
        <div>
          <br/>
          <div> ${ App.t(['Please click on the button below to verify your email address.'], lang) } </div>
          <br/>
          <center>
           ${ mMailer.button( App.t('Verify', lang), (path||webPath), false, true ) }
          </center>
        </div>
      `,
    }
  });

}

// <div> Hi <b>${userName}</b> </div>

// return await mMailer.baseTemplate('main', {
//   body: {
//     title: `${ App.t('Verify your email address', lang) }`, 
//     body: `
//       <div>
//         <div> Hi <b>${userName}</b> </div>
//         <h5>${App.t('This is yout verification code', lang)}</h5>
//         <b>${code}<b>
//         <br/><br/>
//         <h5> ${ App.t([
//           'after','email','verification',',','administration','will',
//           'review','your','account','and','send','you','an','confirmation','email'
//         ], lang) } </h5>
//         <br/><br/>
//         <div>
//          ${ mMailer.button( App.t('Verify', lang), path, false, true ) }
//         </div>
//       </div>
//     `,
//   }
// });