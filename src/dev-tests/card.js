const cleanCardNumber = ( data, max=16 )=>{
  data = data
    .replace(/[^\d]/g,'') 
    // .substr( 0, max )
    .trim();

  if( data.length !== max )
    return false;
  return data;

}


console.log({c: cleanCardNumber('1234 5678 9012 1234')});
console.log({c: cleanCardNumber('1234 5678 9012 1234 1')});
console.log({c: cleanCardNumber('1234 abcd 9012 1234')});
