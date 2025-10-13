class Bell{
  constructor(props={}){
    this.props = (typeof props === 'object' ? props : {});
    this.name = 'Bell';
    this.audio = null;
    this.soundName = this.props.soundName || false;
    this.extention = false;

    this._isInited = false
    this._gotPerms = false
    this.mimeTypes = [
      { type: 'audio/ogg', extention: 'ogg'},
      { type: 'audio/mp4', extention: 'mp4'},
    ];

    this._init();
  }

  _init(){
    try{

      if( !this.soundName )
        return console.error(`#${this.name}:_init: [soundName] is undefined`);

      this.soundName = this.soundName.replace(/(\.ogg|\.mp3|\.wav)/g, '').trim();
      this.audio = new Audio();

      for( const mMime of this.mimeTypes ){
        if( this.audio.canPlayType( mMime.type ) ){
          this.extention = mMime.extention;
          break; 
        }
      }

      if( !this.extention )
        return console.error(`#${this.name}:_init: supported [extention] not found`);

      this.audio.src = `${this.soundName}.${this.extention}`;
      this.audio.muted = false;
      this.audio.autoplay = false;
      this.audio.currentTime = 0;
      // this.audio.pause();
      // this.play();

      const self = this;
      document.body.addEventListener('click',()=>{
        self.getSoundPermissions();
      });

      this._isInited = true;
    }catch(e){
      console.log(`#${this.name}._init: ${e.message}`);
    }
  }

  async play(){
    try{
      if( !this._isInited )
        return console.error(`#${this.name}:_init: not inited`);

      this.audio.pause();
      this.audio.muted = false;
      this.audio.currentTime = 0;
      this.audio.play();
      return true;
    }catch(e){
      console.log(`#${this.name}.play: ${e.message}`);
      return false;
    }
  }

  async getSoundPermissions(){
    try{
      if( !this._isInited )
        return console.error(`#${this.name}:getSoundPermissions: not inited`);

      if( this._gotPerms )
        return console.log(`#${this.name}:getSoundPermissions: already done`);

      this.audio.volume = 0.001;
      if( this.play() ){
        this._gotPerms = true;
        setTimeout((self)=>{
          self.audio.volume = 1;
        }, 3000, this);
      }

    }catch(e){
      console.log(`#${this.name}.getSoundPermissions: ${e.message}`);
    }
  }

}