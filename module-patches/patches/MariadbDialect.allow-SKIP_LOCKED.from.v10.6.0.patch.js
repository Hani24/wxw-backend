const fs = require('fs');

module.exports = ( app_root, patchName='no-name', params={} )=>{

  const patchFile = `${__dirname}/MariadbDialect.js`;
  const fileToPatch = `${app_root}/node_modules/sequelize/lib/dialects/mariadb/index.js`

  return async()=>{

    if( !console.isFile(patchFile) )
      return {success: false, message: ` #${patchName}: could not be found`, data: {patchFile}};

    if( console.isFile(fileToPatch) ){
      fs.rmSync(fileToPatch, {force: true});
      if( console.isFile(fileToPatch) ){
        return {success: false, message: ` #${patchName}: filed to remove old version`, data: {fileToPatch}};
      }
    }

    fs.copyFileSync(patchFile, fileToPatch);

    if( !console.isFile(fileToPatch) )
      return {success: false, message: ` #${patchName}: filed to set up patch`, data: {fileToPatch}};

    return {success: true, message: ` #${patchName}: patch is applied successfully`};

  }

}