
const is = (name='common', type, root='templates/')=>{ 
  return console.isFile(`${__dirname}/${root}${name}/${type}.html`);
}

const get = (name='common', type, root='templates/')=>{ 
  return console.readFileSync(`${__dirname}/${root}${name}/${type}.html`);
}

const applyEnv = ( data, injectEnvs={} )=>{
  if( !data ) return data;
  for( const env_key of Object.keys(injectEnvs) ){
    const mRegExp = new RegExp(`{${env_key}}`, 'g');
    data = data.replace(mRegExp, injectEnvs[ env_key ]);
  }

  return data;
}

const createPartial = ( name, type, applyObj={}, injectEnvs={} )=>{
  const data_raw = is(name, type) ? get(name, type) : get('common', type);
  let result = applyEnv( data_raw, injectEnvs );

  for( const applyKey of Object.keys(applyObj) ){
    const mRegExp = new RegExp(`{${applyKey}}`, 'g');
    result = result.replace(mRegExp, applyObj[ applyKey ] );
  }
  return result;
}


const create = ( mMailer, name, data )=>{

  const {App} = mMailer;

  const injectEnvs = App.isObject(data.injectEnvs) ? data.injectEnvs : {};

  data = {
    header: { ...(data.header || {}) },
    body: { ...(data.body || {}) },
    footer: { ...(data.footer || {}) },
    social: { ...(data.social || {}) },
    copyright: { ...(data.copyright || {}) },
  };

  const base = createPartial( name, 'base', {}, injectEnvs );
  const header = createPartial( name, 'header', data.header, injectEnvs ).replace('{data}','');
  const body = createPartial( name, 'body', data.body, injectEnvs )
    // {truncate if not replaced}
    .replace('{data}','')
    .replace('{title}','')
    .replace('{body}','')
    .replace('{footer}','');

  const footer = createPartial( name, 'footer', data.footer, injectEnvs ).replace('{data}','');
  const social = createPartial( name, 'social', data.social, injectEnvs ).replace('{data}','');
  const copyright = createPartial( name, 'copyright', data.copyright, injectEnvs ).replace('{data}','');

  return base
    .replace('{header}', header )
    .replace('{body}', body )
    .replace('{footer}', footer )
    .replace('{social}', social )
    .replace('{copyright}', copyright )

}

module.exports = ( mMailer, injectEnvs={} )=>{
  return {
    createPartial,
    create,
  }
};
