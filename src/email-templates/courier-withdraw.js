// Your withdrawal request was rejected / approved.
// Approved amount - $200

// Your withdrawal request was approved with adjustments. See the details below.
// Requested amount - $300
// Approved amount - $200
// "текст комментария от админа"

module.exports = async ( mMailer, { amount, approvedAmount, isPartialyApproved, refundedAmount, isAccepted, comment, firstName='', lastName='', lang='en' })=>{

  const App = mMailer.App;

  if( isPartialyApproved ){
    return await mMailer.baseTemplate('main', {
      body: {
        title: App.t(['Your withdrawal request was approved with adjustments. See the details below.'], lang), 
        body: `
          <div>
            <div> Requested amount - $${ (+amount).toFixed(2)} </div>
            <div> Approved amount - $${ (+approvedAmount).toFixed(2)} </div>
            <div> Refunded amount - $${ (+refundedAmount).toFixed(2)} </div>
            <br/>
            <div> ${ comment || '' } </div>
            <br/>    
          </div>
        `,
      }
    });    
  }else{
    return await mMailer.baseTemplate('main', {
      body: {
        title: App.t([`Your withdrawal request was ${isAccepted ? 'approved':'rejected'}.`], lang), 
        body: `
          <div>
            <div> Requested amount - $${ (+amount).toFixed(2)} </div>
            ${ isAccepted ? `<div> Approved amount - $${ (+approvedAmount).toFixed(2)} </div>` : '' }
            <br/>
            <div> ${ comment || '' } </div>
            <br/>    
          </div>
        `,
      }
    });    
  }

}
