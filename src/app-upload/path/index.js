
module.exports = (App, params={})=>{

  // App.app_root;
  // App.public_html;
  // App.services_root;
  // App.logs_root;
  // App.dicts_root;

  const rootPrefix = params.rootPrefix || '/app';

  return {
    form: `${rootPrefix}/uploads/form`,
    // images: `${rootPrefix}/uploads/images`,
    // videos: `${rootPrefix}/uploads/videos`,
    // audios: `${rootPrefix}/uploads/audios`,
    // documents: `${rootPrefix}/uploads/documents`,
    // avatars: `${rootPrefix}/uploads/avatars`,
    // menuItems: `${rootPrefix}/uploads/menu-items`,
    // restaurants: `${rootPrefix}/uploads/restaurants`,
    tmp: `${rootPrefix}/uploads/tmp`,
    // tmp: `/tmp/${App.getEnv('APP_NAME')}`,
  };

}
