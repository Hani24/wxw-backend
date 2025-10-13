// const regexPassword = /(?=.*[0-9])/;
const regexPassword = /(.{6,})/;
const regexPhone = /^(\+?\d{0,4})?\s?-?\s?(\(?\d{3}\)?)\s?-?\s?(\(?\d{3}\)?)\s?-?\s?(\(?\d{4}\)?)?$/;


const isValidPassword = (input)=>{
  try{
    return !!(''+input).match(regexPassword)[0];
  }catch(e){
    console.error(` #RegsExps.isValidPassword: ${e.message}`);
    return false;
  }
}

const isValidPhone = (input)=>{
  try{
    return !!(''+input).match(regexPhone)[0];
  }catch(e){
    console.error(` #RegsExps.isValidPhone: ${e.message}`);
    return false;
  }

}

const isValidEmail = ( email )=>{
  let mEmailRegExp = new RegExp(/^([a-zA-Z0-9\.\-\_]){1,58}([@]{1})([a-zA-Z0-9\.\-\_]){1,58}([.]){1}(\.)?([a-zA-Z0-9\.\-\_]){1,58}$/);
  return mEmailRegExp.test( email );
}

// Password must be at least 6 characters and it must contain at least one number or special character
// isValidPassword: function( pwd ){
//   // let mPasswordRegExp = new RegExp(/([a-z]{1,32})([A-Z]{1,32})([0-9]{1,32})([\W]{1,32})/);
//   // return mPasswordRegExp.test( pwd );
//   const l = new RegExp(/([a-z]{1,32})/);
//   const d = new RegExp(/([0-9]{1,32})/);
//   const w = new RegExp(/([\W]{1,32})/);
//   const u = new RegExp(/([A-Z]{1,32})/);
//   return (l.test(pwd) && d.test(pwd) && w.test(pwd) && u.test(pwd) && pwd.length >= 6);
// }

const normalizeEmail = ( email )=>{
  return (''+email).toLowerCase().trim();
}

module.exports = {
  isValidPassword,
  isValidPhone,
  normalizeEmail,
  isValidEmail,
}