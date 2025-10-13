const logger = require('mii-logger.js');
const AWS = require('aws-sdk');
const fs = require('fs');

const AWS_S3_ENDPOINT = process.env.AWS_S3_ENDPOINT;
const AWS_S3_BUCKER_NAME = process.env.AWS_S3_BUCKER_NAME;
const AWS_S3_ACCESS_KEY_ID = process.env.AWS_S3_ACCESS_KEY_ID;
const AWS_S3_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY;
const AWS_S3_SSL_ENABLED = process.env.AWS_S3_SSL_ENABLED;
const AWS_S3_FORCE_PATH_STYLE = process.env.AWS_S3_FORCE_PATH_STYLE;

class S3 {

  constructor(App, params={}){
    this.App = App;
    this.params = params;
    this._s3 = null;
    this.bucket = AWS_S3_BUCKER_NAME;
    this._isReady = false;
    this._init();
  }

  isReady(){ return this._isReady; }

  async _init(){

    try{

      this._s3 = new AWS.S3({
        endpoint: AWS_S3_ENDPOINT,
        // endpoint: new AWS.Endpoint(AWS_S3_ENDPOINT),
        sslEnabled: this.App.getBoolFromValue(AWS_S3_SSL_ENABLED),
        s3ForcePathStyle:true,
        accessKeyId: AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
	region: process.env.AWS_DEFAULT_REGION,
      });

      this._isReady = true;

    }catch(e){
      console.error(`#S3:_init ${e.message}`);
    }

  }

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
  async upload( path, name ){
    const self = this;
    return new Promise(async(resolve)=>{
      try{

        if( !self.isReady() )
          return resolve({ success: false, message: ['service','S3','is-not','ready'] });

        if( !console.isFile(path) && !self.App.isObject(path) )
          return resolve({ success: false, message: ['file','not','found'] });

        if( !self.App.isString(name) )
          return resolve({ success: false, message: ['name','must-be','valid','string'] });

        name = self._urlToName(name);

        const params = {
// //          ACL: 'public-read',
          Bucket: self.bucket, 
          // Key: `${self.bucket}/${name}`, 
          // Key: '', 
          Key: name, 
          // Key: name.split('.')[0], 
          // Body: fs.createReadStream( path ),
          Body: (self.App.isString(path) ? fs.readFileSync( path ) : path),
        };

        self._s3.upload(params, function(err, data) {
          if( err ){
            console.debug(`_s3.upload: ${err.message}`);
            console.log(err);
            return resolve({ success: false, message: [err.message] });
          }
          // {
          //   "ETag": "\"445d387008af5bb9c3347173804181f8\"",
          //   "Location": "http://localhost:4567/bucket/key",
          //   "key": "key",
          //   "Key": "key",
          //   "Bucket": "bucket"
          // }

          // "data": {
          //   "ETag": "\"27258cdc6b9b73bb769b1043cb3b1880\"",
          //   "VersionId": "rgq7lsZ3uSVW.xWwzuE0FcGLLwxPnTES",
          //   "Location": "https://s3.us-east-2.amazonaws.com/circuits-main/circuits-main/88ce9518f29c6ca635b58801bb0116bb.mp4",
          //   "key": "circuits-main/88ce9518f29c6ca635b58801bb0116bb.mp4",
          //   "Key": "circuits-main/88ce9518f29c6ca635b58801bb0116bb.mp4",
          //   "Bucket": "circuits-main"
          // }

          // console.json({data});

          // const fileInfoRes = self.getFileInfoFromName(data.key);
          const fileInfoRes = self.getFileInfoFromName(name);
          if( !fileInfoRes.success ){
            console.error(`#S3:upload: ${fileInfoRes.message}`);
            console.json({fileInfoRes});
            return resolve(fileInfoRes);
          };

          resolve({
            success: true, 
            message: ['success'], 
            data: fileInfoRes.data
          });
        });

      }catch(e){
        console.error(`#S3:upload: ${e.message}`);
        resolve({ success: false, message: ['failed-to','upload','data'] });
      }
    });
  }

  async moveUploadedFile( req, type, mUser, uploadDest='tmp' ){

    try{

      const fileTag = type;
      const fileType = type === 'img' ? 'image' : type;

      if( !this.App.isObject(req) || !this.App.isFunction(req.isFileAvailable) )
        return { success: false, message: ['not','valid','upload'] };

      if( !this.App.isObject(mUser) || !this.App.isPosNumber(mUser.id) )
        return { success: false, message: ['user','not','found'] };

      if( !this.App.isSupportedUploadTagName( fileType ) )
        return { success: false, message: ['uploaded','file','type','is-not','supported'] };

      if( !req.isFileAvailable( fileTag ) )
        return {success: false, message: [`[${fileTag}]`,'is-required'] };

      const moveFileRes = await req.moveFile(uploadDest, fileTag, fileType); // (dest, upload-tag, file-type-validator)
      // console.json({ moveFileRes, uploadDest, fileTag, fileType });

      if( !moveFileRes.success ){
        console.error(`error...`);
        console.json({moveFileRes});
        return moveFileRes;
      }

      // if [updated] data is the same as in the cloud, just return it self
      if( moveFileRes.data.asUrl ){
        if( moveFileRes.data.isS3Url ){
          return moveFileRes;
          // {
          //   asUrl,
          //   isS3Url,
          //   url,
          //   fileName,
          //   fileType,
          //   fileSize,
          // }
        }
      }

      const mFile = moveFileRes.data;
      const mUpload = await this.App.getModel('Upload').create({
        userId: mUser.id, 
        fileType: mFile.fileType,
        // fileName: (mFile.asUrl ? mFile.url : mFile.fileName),
        fileName: mFile.fileName,
        fileSize: mFile.fileSize,
        fileMimeType: mFile.fileMimeType,     
      });

      if( !this.App.isObject(mUpload) || !this.App.isPosNumber(mUpload.id) )
        return {success: false, message: ['failed-to','upload', fileType] };

      const s3UploadRes = await this.upload( moveFileRes.data.localPath, mUpload.fileName );

      if( !s3UploadRes.success ){
        console.error(`error...`);
        console.json({s3UploadRes});
        return s3UploadRes;
      }

      // do not wait ...
      /* await */ console.shell.async(`rm ${ moveFileRes.data.localPath }`);

      return {
        success: true,
        message: 'OK',
        data: mUpload
      };

    }catch(e){
      console.error(`#S3:moveUploadedFile: ${e.message}`);
      console.log(e);
      return { success: false, message: ['failed-to','move','file'] };
    }
  }

  _urlToName(mUrl){
    if( !this.App.isString(mUrl) || !(mUrl.trim().length) ) return '';
    return mUrl.split('/').length >= 3
      ? mUrl.split('/').pop().trim()
      : mUrl.trim();
  }

  getFileInfoFromName(name){

    try{
      name = this._urlToName(name);
      if( !name ) 
        return {success: false, message: '_urlToName: name is null', data: {name}};
      const fileUrlPath = `/${this.bucket}/${name}`;

      return { 
        success: true, 
        message: ['success'], 
        data: {
          path: fileUrlPath,
          url: `${AWS_S3_ENDPOINT}${fileUrlPath}`,
        }
      };

    }catch(e){
      console.error(`#S3:getFileInfoFromName: ${e.message}`);
      return { success: false, message: ['failed-to','create','file','info'] };
    }
  }

  getLinkByName(name){
    name = this._urlToName(name);
    if( !name ) return '';
    return `${AWS_S3_ENDPOINT}/${this.bucket}/${name}`;
  }
  getUrlByName(name){ return this.getLinkByName(name); }

}

module.exports = async(App, params={})=>{
  return new S3(App, params);
}

return;

(async()=>{

  const s3FileTest = '/m-sys/prog/web/apps/morris-armstrong-ii/apps/docker.api-server/src/services/S3/test.png';
  const newName = `${console.hash.sha256('test.png')}.png`;
  console.log({newName});
  const uploadRes = await App.S3.upload(s3FileTest, newName);
  console.json({uploadRes});
  console.json({getFileInfoFromName: App.S3.getFileInfoFromName(newName)});

})();
