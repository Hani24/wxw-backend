const logger = require('mii-logger.js');
const BaseJob = require('./BaseJob');

module.exports = async( App, params={} )=>{

  // await console.sleep(2000);

  console.line();
  console.log(` #Cron-Jobs: init`);

  const JOB_PATTERN = '.job.js';
  const JOBS_ROOT = `${App.app_root}/cron/jobs`;
  const jobConfigs = require(`${JOBS_ROOT}/cron-job.config.js`)( App, params );
  const jobs = [];

  const jobsFiles = console.listDir(JOBS_ROOT).filter((item)=>item.endsWith(JOB_PATTERN));

  for( const jobFile of jobsFiles ){

    const jobName = jobFile.replace(JOB_PATTERN,'').trim();
    // console.info(`    job: [${jobFile}]`);
    const jobSourceFile = `${JOBS_ROOT}/${jobFile}`;

    if( !console.isFile(jobSourceFile) ){
      console.error(`    job: [${jobName}] is not file ...`);
      continue;
    }

    try{

      const jobModule = require(jobSourceFile);
      const mJob = await jobModule( App, params, BaseJob, jobName, (jobConfigs[ jobName ] || {}) );

      if( !App.isObject(mJob) || !App.isFunction(mJob.start) ){
        console.warn(`    job: ( ${ console.B(jobName) } ): ${'job is not available for current node-type'} `);
        continue;        
      }

      const startRes = await mJob.start();

      if( startRes.success ){
        jobs.push( mJob );
        console.log(`    job: ( ${ console.B(mJob.name) } ): ${console.G(startRes.message)} `);
        continue;
      }

      console.log(`    job: ( ${ console.Y(mJob.name) } ): ${console.R(startRes.message)} `);

    }catch(e){
      console.error(`    job: ( ${ console.R(jobName) } ): ${console.R( e.message )} `);
      console.log(e);
    }

  }

  console.ok(` #Cron-Jobs: init`);

  return {
    jobs,
    BaseJob,
  };

}
