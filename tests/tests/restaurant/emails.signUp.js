
const test = __filename.split("/").pop().replace('.js', '');

module.exports = async (App, params = {}) => {

  return true;

  const toTestEmail = 'ch3ll0v3k+morris-ii-test@yandex.com';
  const code = '1234';
  const req = {
    lang: 'en',
  };

  const emailVerificationRes = await App.Mailer.send({
    to: toTestEmail,
    subject: App.t('email-verification', req.lang),
    data: await App.Mailer.createEmailTemplate('restaurant-email-verification', {
      lang: req.lang,
      code: code,
      platform: 'web',
      webPath: App.toAppPath('web', 'restaurant.email-verification-verify', code),
    })
  });

  if (!emailVerificationRes.success)
    throw Error(App.t(emailVerificationRes.message));

  if (params?.debug) {
    console.json({ emailVerificationRes });
  }

}


// {
//   "emailVerificationRes": {
//     "success": true,
//     "message": "email-has-been-sent",
//     "data": {
//       "accepted": [
//         "ch3ll0v3k+morris-ii-test@yandex.com"
//       ],
//       "rejected": [],
//       "envelopeTime": 1845,
//       "messageTime": 625,
//       "messageSize": 8547,
//       "response": "250 Great success",
//       "envelope": {
//         "from": "postmaster@wxwdelivery.com",
//         "to": [
//           "ch3ll0v3k+morris-ii-test@yandex.com"
//         ]
//       },
//       "messageId": "<9f8425f2-66be-bf48-be09-30cbab1ec720@wxwdelivery.com>",
//       "emailId": "<9f8425f2-66be-bf48-be09-30cbab1ec720@wxwdelivery.com>"
//     }
//   }
// }