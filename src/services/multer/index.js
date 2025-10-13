const multer = require('multer');
const path = require('path')


module.exports = async (App, params)=>{

  const uploadPath = console.deepClone( App.upload.path );
  const uploadConfig = console.deepClone( App.upload.config );

  const validator = {
    isSupportedMimeType: ( fileType, mime_type_t )=>{
      const type_t = (''+fileType).trim().toLowerCase();
      return uploadConfig.supportedTypes.hasOwnProperty(type_t) 
        && uploadConfig.supportedTypes[ type_t ].includes( mime_type_t )
    },
    getSupportedMimeTypes: ( fileType /*'image'*/ )=>{
      const type_t = (''+fileType).trim().toLowerCase();
      return uploadConfig.supportedTypes.hasOwnProperty(type_t)
        ? console.deepClone( uploadConfig.supportedTypes[ type_t ] )
        : false;
    }
  }

  const pubRoot = App.public_html;

  const upload = {
    // form: multer({ dest: `${pubRoot}${App.getPublicPath('form',false)}` }),
    // images: multer({ dest: `${pubRoot}${App.getPublicPath('images',false)}` }),
    // videos: multer({ dest: `${pubRoot}${App.getPublicPath('videos',false)}` }),
    // audios: multer({ dest: `${pubRoot}${App.getPublicPath('audios',false)}` }),
    // documents: multer({ dest: `${pubRoot}${App.getPublicPath('documents',false)}` }),
    // tmp: multer({ dest: `${pubRoot}${App.getPublicPath('tmp',false)}` }),
  };

  for( const mUploadKey of Object.keys(uploadPath) ){
    const mUploadPath = uploadPath[ mUploadKey ]; // === App.getPublicPath( mUploadKey, false);
    upload[ mUploadKey ] = multer({ dest: `${pubRoot}${ mUploadPath }` });
    console.ok(`   @upload: ${mUploadKey} => ${mUploadPath} `);
  }

  return {
    multer,
    upload,
    validator,
    moveFile: async (req, targetPath=false, fileTag, checkFileType, debug=false )=>{

      if( debug ){
        console.json({
          post: req.getPost(),
          moveFile: {
            files: req.files,
            file: req.file,
          }
        });        

        console.json({ targetPath, fileTag, checkFileType, file: req.file, files: req.files });

      }

      const isBodyDataKeyAsFile = Array.isArray(req.files) && !req.files.length;

      // handle body<string>[img]
      if( !req.file && isBodyDataKeyAsFile && req.isFileAvailable( fileTag ) ){

        const img = App.tools.cleanUrl( req.getPost( fileTag ) );

        if( !App.tools.isUrl( img ) ){
          if( debug )
            console.warn(` #multer: file-as-<string>-filed: fileTag[ ${fileTag} ] => false`);
          return { success: false, message: ['file','is-not','url'], data: {} };
        };

        const result = {
          asUrl: true, 
          isS3Url: ( img.replace( App.getEnv('AWS_S3_ENDPOINT') ,'') !== img  ), 
          url: `${img}`,
          fileName: img.split('/').pop(),
          fileType: checkFileType,
          fileSize: 0,
        };

        if( debug )
          console.json({ 'multer': { result } });

        return { success: true, message: ['success'], data: result };

      }

      // handle file[img]
      if( !req.file || !req.file.originalname || !req.file.mimetype ){

        if( !req.files ){
          if( debug )
            console.warn(` #multer: handle-file: [no-file] => false`);
          return { success: false, message: ['no-files'], data: {} };
        }else{

          let singleFile = false;

          for( const file of req.files ){
            if( debug )
              console.json({file});

            if( 
              file && file.originalname && file.path 
              && 
              file.fieldname === fileTag
            ){
              singleFile = file;
              break;
            }
          }

          if( !singleFile ){
            if( debug )
              console.warn(` #multer: handle-file: [singleFile] [no-file] => false`);
            return { success: false, message: ['no-file'], data: {} };
          }
          req.file = singleFile;
        }

      }

      if( debug )
        console.json({ file: req.file });

      const extname = path.extname(req.file.originalname) || path.extname(req.file.mimetype.replace('/','.'));

      if( checkFileType ){
        if( !validator.isSupportedMimeType( checkFileType, req.file.mimetype ) ){
          console.warn(` #multer: isSupportedMimeType( ${checkFileType}, ${req.file.mimetype} ) => false`);
          await console.shell.async(`rm -f ${req.file.path}`);
          await console.shell.async(`rm -f ${req.file.path}${extname}`);
          return { success: false, message: ['file','type','is-not','supported'], data: {} };
        }
      }

      const localPath = `${req.file.path}${extname}`;
      await console.shell.async(`mv ${req.file.path} ${localPath} `);

      const fileName = localPath.split('/').pop();
      // const filePath = targetPath ? App.getPublicPath(targetPath, true) : '';

      const result = {
        asUrl: false, 
        isS3Url: false, 
        fileName,
        fileType: checkFileType,
        // url: `${filePath}/${fileName}`,
        fileMimeType: req.file.mimetype,
        fileSize: req.file.size,
        localPath,
      };

      if( debug )
        console.json({ 'multer': { result } });

      return { success: true, message: 'success', data: result };

      // req.file = {
      //   fieldname: "img",
      //   originalname: "01.vegetables.jpg",
      //   encoding: "7bit",
      //   mimetype: "image/jpeg",
      //   destination: "/m-sys/prog/web/apps/AAF/apps/docker.backend/src/public_html/imgs/users/avatars",
      //   filename: "acaeeed73f6688ba172824efc3d6953b",
      //   path: "/m-sys/prog/web/apps/AAF/apps/docker.backend/src/public_html/imgs/users/avatars/acaeeed73f6688ba172824efc3d6953b",
      //   size: 18344
      // }

    }
  };
}

