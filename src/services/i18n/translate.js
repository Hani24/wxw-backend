// https://cloud.google.com/translate/docs/reference/libraries/v2/nodejs
// npm install --save @google-cloud/translate
// const {Translate} = require('@google-cloud/translate').v2;

const logger = require('mii-logger.js');

const DEFAULT_LANG = 'en';
const LANGS = {};

const langsList = console.listDir(`${__dirname}/langs`);
for( const langCode of langsList ){
  LANGS[ langCode ] = require(`${__dirname}/langs/${langCode}`);

}

// curl -s -X POST -H "Content-Type: application/json" \
//     -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) \
//     --data "{
//   'q': 'The Great Pyramid of Giza (also known as the Pyramid of Khufu or the
//         Pyramid of Cheops) is the oldest and largest of the three pyramids in
//         the Giza pyramid complex.',
//   'source': 'en',
//   'target': 'es',
//   'format': 'text'
// }" "https://translation.googleapis.com/language/translate/v2"

// lang = this.LANGS.hasOwnProperty( lang ) ? lang : this.DEFAULT_LANG;
// const res = this.LANGS[ lang ].hasOwnProperty( key )
//   ? this.LANGS[ lang ][ key ]
//   : this.LANGS[ this.DEFAULT_LANG ][ key ] || key; // key as backup
