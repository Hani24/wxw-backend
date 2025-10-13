require('mii-logger.js');
if (process.env.NODE_TESTS) {
  console.clear();
  console.info(` #Loading tests...`);
  console.mute();
}

const root = `${__dirname}/tests`;

module.exports = async (App, params = {}) => {

  if (!process.env.NODE_TESTS) return;
  console.unMute();

  const validation = {
    pass: [],
    fail: [],
  };

  const testsDirs = await console.listDir(root);
  for (const testDir of testsDirs) {

    console.debug(` #test: ${testDir}`);

    const testsRoot = `${root}/${testDir}`;
    const tests = (await console.listDir(testsRoot))
      .filter((t) => (t.match(/(.*)\.test\.(js|ts)$/)));

    for (const test of tests) {
      console.info(`    #${testDir}: ${test}`);
      if (!console.isFile(`${testsRoot}/${test}`)) {
        console.warn(` #[error]: ${test}: is not valid file`);
      } else {
        try {
          const exec = require(`${testsRoot}/${test}`);
          await exec(App, params);
          validation.pass.push(test);
          // console.ok(` #[pass]: ${test}: success`);
        } catch (e) {
          validation.fail.push(test);
          console.error(` #[fail]: ${test}: ${e.message}`);
        }
      }
    }

  }

  console.line();
  for (const i in validation.pass) {
    const t = validation.pass[i];
    console.ok(` #[pass]: (${(+i) + 1}) ${t}`);
  }

  console.line();
  for (const i in validation.fail) {
    const t = validation.fail[i];
    console.error(` #[fail]: (${(+i) + 1}) ${t}`);
  }

  process.exit();

}

