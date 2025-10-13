
module.exports = async (App, params={}, task='')=>{

  try{

    // const roles = App.getModel('User').getRoles();
    // const email = App.createSystemEmail( roles.root );

    // let mUser = await App.getModel('User').findOne({
    //   where: { email }
    // });

    // if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) ){
    //   mUser = await App.getModel('User').create({
    //     role: roles.root,
    //     phone: '+001234567890',
    //     email,
    //     isEmailVerified: true,
    //     isPhoneVerified: true,
    //     password: await App.BCrypt.randomSecureToken(24),
    //     firstName: App.getEnv('APP_NAME'),
    //     lastName: '(system)',
    //   });
    //   if( !App.isObject(mUser) || !App.isPosNumber(mUser.id) ){
    //     console.error(` #app:[post-boot-task]: [${task}]: ${'Failed to create system user'}`);
    //     process.exit();
    //   }
    // }
    // console.ok(` #app:[post-boot-task]: [${task}]: system-user: id: [${mUser.id}], email: [${mUser.email}] inited ...`);

    return true;

  }catch(e){
    console.error(` #app:[post-boot-task]: [${task}]: ${e.message}`);
    return false;
  }

}