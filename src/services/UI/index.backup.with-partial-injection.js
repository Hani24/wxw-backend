
class UI{

  constructor( App, params={} ){
    this.App = App;
    this.params = (App.isObject(params) ? params : {});
    this.templatesRoot = `${__dirname}/templates`;
    this.partialsRoot = `${__dirname}/partials`;
    this.templateTypes = {};
    this.partialTypes = {};
    this.envs = {};

    this.init();

  }

  init(){

    const self = this;

    console.line();

    this.envs = {
      appName: this.App.getAppName(), // == APP_NAME
      webSite: this.App.getEnv('WEBSITE'),
      aws_s3_endpoint: this.App.getEnv('AWS_S3_ENDPOINT'),
    };

    const templates = console.listDir(this.templatesRoot)
      .filter((type_t)=> this.App.isString(type_t) && type_t.endsWith('.html') )
      .map((type_t)=> type_t.replace('.html','').trim() )
      .filter((type_t)=> type_t )
      .map((type_t)=>{
        const path = `${this.templatesRoot}/${type_t}.html`;
        if( console.isFile(path) ){
          console.log(`     UI: added template: [${type_t}]`);
          self.templateTypes[ type_t ] = console.readFileSync(path, 'utf-8');
          // self.templateTypes[ type_t ] = self.templateTypes[ type_t ].replace(/[\n\r\t]/g, '');
          self.templateTypes[ type_t ] = self.inflateWithEnvs(self.templateTypes[ type_t ]);
        }else{
          console.warn(`     UI: aboring template: [${type_t}]`);
        }
      });

    const partials = console.listDir(this.partialsRoot)
      .filter((type_t)=> this.App.isString(type_t) && type_t.endsWith('.html') )
      .map((type_t)=> type_t.replace('.html','').trim() )
      .filter((type_t)=> type_t )
      .map((type_t)=>{
        const path = `${this.partialsRoot}/${type_t}.html`;
        if( console.isFile(path) ){
          console.log(`     UI: added partial: [${type_t}]`);
          self.partialTypes[ type_t ] = console.readFileSync(path, 'utf-8');
          self.partialTypes[ type_t ] = self.partialTypes[ type_t ].replace(/[\n\r\t]/g, '');
          self.partialTypes[ type_t ] = self.inflateWithEnvs(self.partialTypes[ type_t ]);
        }else{
          console.warn(`     UI: aboring partial: [${type_t}]`);
        }
      });

  }

  isValidTemplateType( type_t ){
    return this.templateTypes.hasOwnProperty(type_t);
  }

  isValidPartialType( type_t ){
    return this.partialTypes.hasOwnProperty(type_t);
  }

  inflateWithEnvs( data ){
    for( const env_t of Object.keys( this.envs ) ){
      data = data.replace(new RegExp(`{${env_t}}`, 'g'), this.envs[ env_t ]);
    }
    return data;
  }

  async getPartial( type_t, cache=true, nl=true ){

    if( !this.App.isString(type_t) )
      return { success: false, message: ['valid','partial','type','is-required'], data: ''};

    type_t = type_t.split('.html')[0].trim();
    let partial = 'n/a';

    if( !cache ){
      const partialFile = (`${this.partialsRoot}/${ type_t }.html`).replace(/\/\//g, '/');
      if( !console.isFile( partialFile ) ){
        console.warn(`#partialFile: ${partialFile}`);
        return { success: false, message: ['UI','[partial]','not','found'], data: ''};
      }
      partial = console.readFileSync( partialFile );
      if( nl )
        partial = partial.replace(/[\n\r\t]/g, '');
      partial = this.inflateWithEnvs(partial);
    }else{

      if( !this.isValidPartialType(type_t) )
        return { success: false, message: ['partial','no-found'], data: ''};
      partial = this.partialTypes[ type_t ];

    }

    return { success: true, message: ['success'], data: partial};

  }

  async getTemplate( type_t, cache=true ){

    if( !this.App.isString(type_t) )
      return { success: false, message: ['valid','template','type','is-required'], data: ''};

    type_t = type_t.split('.html')[0].trim();
    let template = 'n/a';

    if( cache ){
      const templateFile = `${this.templatesRoot}/${ type_t }.html`;
      if( !console.isFile( templateFile ) )
        return { success: false, message: ['UI','template','not','found'], data: ''};
      template = console.readFileSync( templateFile )
      template = template; // .replace(/[\n\r\t]/g, '');
      template = this.inflateWithEnvs(template);
    }else{
      if( this.isValidTemplateType(type_t) )
        return { success: false, message: ['UI','template','not','found'], data: ''};

      template = this.partialTypes[ type_t ];

    }

    return { success: true, message: ['success'], data: template};

  }

  convertToSafeTags( data ){
    return !this.App.isString(data)
      ? data
      : data
        .replace(/\</g,'&lt;')
        .replace(/\>/g,'&gt;');
  }

  async autoInject(template){

    const _injects = template.match(/{(inject):(partial):([\/a-zA-Z0-9\?\+\-\_\%]{1,}){1}}/g);
    // console.json({_injects});

    if( this.App.isArray(_injects) && _injects.length ){
      for( const injectString of _injects ){
        const params = injectString.replace(/[\{\}]/g,'').split(':');
        const mRegExp = new RegExp(`${injectString}`, 'g');
        // console.json({ params, injectString });

        if( params.length !== 3 ){
          template = template.replace(mRegExp, '');
          console.json({inject: {params}});
          continue;
        }

        switch(params[1]){
          case 'partial':
            const partialRes = await this.getPartial( params[2], false, false );
            if( !partialRes.success ){
              console.json({partialRes})
              template = template.replace(mRegExp, '');
            }else{
              // console.ok(` @ui:inject: [${injectString}]`);
              template = template.replace( mRegExp, partialRes.data); 
            }

            break;
          default:
            console.warn(` @ui:inject: default: [${injectString}]`);
            template = template.replace(mRegExp, '');
        }

      }
    }

    return template;

  }

  async renderTemplate( type_t, data={} ){

    const templateRes = await this.getTemplate( type_t );
    if( !templateRes.success )
      return templateRes;

    let template = await this.autoInject( templateRes.data );

    data = {
      ...data,
      icon: this.App.isObject(data.icon) ? data.icon : {name: false, size: 0},
      title: this.App.isString(data.title) ? this.convertToSafeTags(data.title) : this.App.getAppName(),
      header: this.App.isString(data.header) ? this.convertToSafeTags(data.header) : '', // this.App.getAppName()
      message: this.App.isString(data.message) ? this.convertToSafeTags(data.message) : '',
      content: (data.content || ''),
      social: this.App.isBoolean( data.social ) ? this.App.getBoolFromValue( data.social ) : '',
      footer: '',
    };

    if( data.icon.name ){
      const partialRes = await this.getPartial(`icon`);
      if( partialRes.success ){
        // data.message += partialRes.data.replace('{size}', data.icon.size || 100);
        // data.message = partialRes.data.replace('{size}', data.icon.size || 100)
        //   +data.message;
        data.icon = await this.autoInject( partialRes.data );
        data.icon = data.icon
          .replace(/{size}/g, data.icon.size || 100)
          .replace(/{name}/g, data.icon.name);

      }

    }else{
      data.icon = '';
    }


    if( this.App.getBoolFromValue(data.social) ){
      const partialRes = await this.getPartial('social');
      if( partialRes.success ){
        data.social = await this.autoInject( partialRes.data );

      }
    }

    if( this.App.isObject( data.action ) || this.App.isArray( data.action ) ){

      const partialRes = await this.getPartial('footer');
      let content = '';
      if( partialRes.success ){

        partialRes.data = await this.autoInject( partialRes.data );

        const partialLinkRes = await this.getPartial('link');
        if( partialLinkRes.success ){

          partialLinkRes.data = await this.autoInject( partialLinkRes.data );

          if( this.App.isObject( data.action ) ){
            if( this.App.isString(data.action.link) && this.App.isString(data.action.name) ){
              content += partialLinkRes.data
                .replace(/{link}/g, data.action.link)
                .replace(/{name}/g, data.action.name);
            }
          }else{
            for( const mAction of data.action ){
              if( this.App.isObject( mAction ) ){
                if( this.App.isString(mAction.link) && this.App.isString(mAction.name) ){
                  content += partialLinkRes.data
                    .replace(/{link}/g, mAction.link)
                    .replace(/{name}/g, mAction.name);
                }
              }
            }
          }
        }

        data.footer = partialRes.data.replace('{content}', content);
      }else{
        data.footer = '';
      }

    }

    if( this.App.isObject(data.content) ){

      if( this.App.isString(data.content.raw) ){
        data.content = data.content.raw;
      }else{

        if( data.content.partial ){
          const partialRes = await this.getPartial( data.content.partial, false, false );
          if( !partialRes.success ){
            console.json({partialRes})
            data.content = this.App.t(['UI','partial','error']);
          }else{
            let content = await this.autoInject(partialRes.data);
            if( this.App.isObject(data.content.data) ){
              for( const mKey of Object.keys(data.content.data) ){
                const mRegExp = new RegExp(`{${mKey}}`, 'g');
                content = content.replace( mRegExp, this.App.isObject(data.content.data[ mKey ]) 
                  ? JSON.stringify(data.content.data[ mKey ] /*, null, 2*/) 
                  : data.content.data[ mKey ]
                );
              }
            }

            data.content = content;

          }

        }
      }

    }

    for( const mKey of Object.keys(data) ){
      const mRegExp = new RegExp(`{${mKey}}`, 'g');
      template = template.replace( 
        mRegExp, data[ mKey ]
          // .replace(/\</g,'&lt;')
          // .replace(/\>/g,'&gt;')
      );
    }

    template = await this.autoInject(template);

    return { success: true, message: ['success'], data: template};

  }

}

module.exports = async ( App, params={} )=>{

  return new UI( App, params );

}
