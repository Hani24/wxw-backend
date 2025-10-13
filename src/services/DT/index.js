const logger = require('mii-logger.js');
const moment = require('moment-timezone');

// UTC+0 == TZ='Atlantic/Reykjavik'; export TZ

moment.defaultFormat = 'YYYY-MM-DDTHH:mm:ss'; // "YYYY-MM-DDTHH:mm:ssZ"
moment.tzFormat = 'YYYY-MM-DDTHH:mm:ssZ'; // "YYYY-MM-DDTHH:mm:ssZ"
moment.humanDateFormat = 'YYYY-MMM-DD';
// moment.humanDatetimeFormat = 'YYYY-MMM-DD HH:mm'; // 24h format
moment.humanDatetimeFormat = 'YYYY-MMM-DD h:mm a'; // 12h format + am/pm
moment.humanTimeFormat = 'h:mm a'; // 12h format + am/pm
moment.inFormat_0 = 'YYYY-MMM-DD HH:mm';
moment.inFormat_1 = 'YYYY/MMM/DD HH:mm';
moment.inFormat_2 = 'YYYY MMM DD HH:mm';
moment.suppressDeprecationWarnings = true;
// moment.defaultFormatUtc = '';
// moment.updateOffset
// moment.defaultZone

// console.json({moment: Object.keys(moment)});

const isValidDatetime = (datetime_t)=>{
  try{
    // RFC2822/ISO
    return moment( datetime_t ).isValid(/*{_isValid: null}*/);
  }catch(e){
    console.error(` #DT:isValidDatetime: ${e.message}`);
  }
  return false;
}

const applyTimezone = (datetime_t, timezone_t='America/Los_Angeles', format=moment.defaultFormat)=>{
  try{
    if( !isValidDatetime(datetime_t) ) return 'n/a';
    datetime_t = moment(datetime_t).tz(timezone_t);
    return (format ? datetime_t.format(format) : datetime_t);
  }catch(e){
    console.error(` #DT:applyTimezone: ${e.message}`);
  }
  return false;
}

const cleanUpBirthday = (datetime_t, timezone_t='America/Los_Angeles', format=moment.defaultFormat)=>{
  try{
    if( !isValidDatetime(datetime_t) ) return 'n/a';
    datetime_t = `${fromDatetime(datetime_t,format).split('T')[0]}T12:00:00`; // from +00:00 <add> offset
    datetime_t = applyTimezone( datetime_t, timezone_t );
    return datetime_t;
  }catch(e){
    console.error(` #DT:cleanUpBirthday: ${e.message}`);
  }
  return false;
}

const requireMinAge = (datetime_t, minAge=13)=>{
  try{
    const mDate = new Date(datetime_t);
    return ( ((new Date()).getFullYear() - mDate.getFullYear()) > minAge );
  }catch(e){
    console.error(` #DT:requireMinAge: ${e.message}`);
  }

  return false;
}

const isValidDate = isValidDatetime;

const fromDatetime = ( datetime_t, format=false )=>{
  try{

    if( !isValidDatetime(datetime_t) )
      throw Error(`supplied [datetime] is not valid`);

    datetime_t = moment( datetime_t );
    return (format ? datetime_t.format( format ) : datetime_t);
  }catch(e){
    console.error(`#DT:fromDatetime: [${datetime_t}], ${e.message}`);
    return 'n/a';
  }
}

const getTimePast = (datetime_t)=>{
  try{
    if( !isValidDatetime(datetime_t) )
      throw Error(`supplied [datetime] is not valid`);
    return moment( datetime_t ).fromNow();
  }catch(e){
    console.error(` #DT:getTimePast: [datetime_t:${datetime_t}] ${e.message}`);
  }
  return 'n/a';
}

const formatAsISO = (datetime_t)=>{
  try{
    return isValidDatetime(datetime_t)
      ? moment(datetime_t).format( moment.defaultFormat )
      : false;
  }catch(e){
    console.error(` #DT:formatAsISO: ${e.message}`);
  }
  return false;
}

const subFromDate = ({amount=20, of='minutes', format=moment.defaultFormat}={})=>{
  try{
    const moment_t = moment().subtract(amount, of);
    return typeof format === 'string' 
      ? moment_t.format( format ) // App.getDateFormat() 
      : moment_t;
  }catch(e){
    console.error(` #DT:subFromDate: ${e.message}`);
  }
  return false;
}

const addToDate = ({amount=20, of='minutes', format=moment.defaultFormat}={})=>{
  try{
    const moment_t = moment().add(amount, of);
    return typeof format === 'string' 
      ? moment_t.format( format ) // App.getDateFormat() 
      : moment_t;
  }catch(e){
    console.error(` #DT:addToDate: ${e.message}`);
  }
  return false;
}

const getStartOf = ( datetime_t, ofThis, format=true )=>{
  const date_t = fromDatetime( datetime_t ).startOf( ofThis );
  return format ? date_t.format( typeof format === 'boolean' ? moment.defaultFormat : format ) : date_t;
}

const getEndOf = ( datetime_t, ofThis, format=true )=>{
  const date_t = fromDatetime( datetime_t ).endOf( ofThis );
  return format ? date_t.format(moment.defaultFormat) : date_t;
}

const unixTimestampToISO = (datetime_t, format=false)=>{
  try{
    // RFC2822/ISO
    return moment( (+datetime_t) *1000 ).format( format ? format : moment.defaultFormat);
  }catch(e){
    // console.error(` #DT:isValidDatetime: ${e.message}`);
  }

  return false;
}

const getTzAtUTCZero = ()=>{
  return 'Atlantic/Reykjavik';
}

module.exports = (App, params={})=>{
  return {
    isValidDatetime,
    applyTimezone,
    cleanUpBirthday,
    requireMinAge,
    isValidDate,
    getTimePast,
    fromDatetime,
    getStartOf,
    getEndOf,
    subFromDate,
    addToDate,
    formatAsISO,
    unixTimestampToISO,
    getTzAtUTCZero,
    moment,
  }
};

if( module.parent ) return;

const mDate = new Date();
const time_t = Math.floor(mDate.getTime() / 1000);

console.json({
  '123456': isValidDatetime('123456'),
  'abcde': isValidDatetime('abcde'),
  [`${time_t}`]: isValidDatetime(`${time_t}`),
  [time_t]: isValidDatetime(time_t),
  [`${time_t} => parse`]: isValidDatetime( new Date(time_t) ),
  '2021-01-01': isValidDatetime('2021-01-01'),
  '01-01-2021': isValidDatetime('01-01-2021'),
  '2011-10-10T10:20:90': isValidDatetime('2011-10-10T10:20:90'),
  '2011-10-10T10:20:20': isValidDatetime('2011-10-10T10:20:20'),
  extra: {
    date_0: isValidDatetime('2021-06-11T06:15:00'),
    date_1: isValidDatetime('2021-06-11'),
    date_2: isValidDatetime('2021/06/11'),
    date_m: moment('2021-06-11').format(moment.defaultFormat),
    date_s: new Date('2021-06-11T10:10:10').toISOString(),
  },
});

// it will add 642 seconds in the current time and will give time in 03:35 PM format
// var travelTime = moment().add(642, 'seconds').format('hh:mm A');

// it will add 11 mins in the current time and will give time in 03:35 PM format; can use m or minutes 
// var travelTime = moment().add(11, 'minutes').format('hh:mm A');

// it will add 2 hours in the current time and will give time in 03:35 PM format
// var travelTime = moment().add(2, 'hours').format('hh:mm A');



// Format Dates

//    moment().format('MMMM Do YYYY, h:mm:ss a'); // August 27th 2020, 5:53:57 am
//    moment().format('dddd');                    // Thursday
//    moment().format("MMM Do YY");               // Aug 27th 20
//    moment().format('YYYY [escaped] YYYY');     // 2020 escaped 2020
//    moment().format();                          // 2020-08-27T05:53:57+02:00

// Relative Time

//    moment("20111031", "YYYYMMDD").fromNow(); // 9 years ago
//    moment("20120620", "YYYYMMDD").fromNow(); // 8 years ago
//    moment().startOf('day').fromNow();        // 6 hours ago
//    moment().endOf('day').fromNow();          // in 18 hours
//    moment().startOf('hour').fromNow();       // an hour ago

// Calendar Time

//    moment().subtract(10, 'days').calendar(); // 08/17/2020
//    moment().subtract(6, 'days').calendar();  // Last Friday at 5:53 AM
//    moment().subtract(3, 'days').calendar();  // Last Monday at 5:53 AM
//    moment().subtract(1, 'days').calendar();  // Yesterday at 5:53 AM
//    moment().calendar();                      // Today at 5:53 AM
//    moment().add(1, 'days').calendar();       // Tomorrow at 5:53 AM
//    moment().add(3, 'days').calendar();       // Sunday at 5:53 AM
//    moment().add(10, 'days').calendar();      // 09/06/2020

// Multiple Locale Support

//    moment.locale();         // en
//    moment().format('LT');   // 5:53 AM
//    moment().format('LTS');  // 5:53:57 AM
//    moment().format('L');    // 08/27/2020
//    moment().format('l');    // 8/27/2020
//    moment().format('LL');   // August 27, 2020
//    moment().format('ll');   // Aug 27, 2020
//    moment().format('LLL');  // August 27, 2020 5:53 AM
//    moment().format('lll');  // Aug 27, 2020 5:53 AM
//    moment().format('LLLL'); // Thursday, August 27, 2020 5:53 AM
//    moment().format('llll'); // Thu, Aug 27, 2020 5:53 AM
