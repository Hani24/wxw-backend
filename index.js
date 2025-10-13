const root = __dirname;
const src = `${root}/src`;
const serverTests = require(`${root}/tests`);

require(`${src}/envs/init.env.js`);
const Application = require(`${src}/Application.js`);

const config = require(`${src}/envs/common/server.config.js`)({
  root: root,
});

const App = new Application( config );

App.on('app-is-ready', async()=>{

  serverTests(App, {});

});


