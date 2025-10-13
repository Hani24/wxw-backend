(async()=>{


  const DT = await (require('../src/services/DT'))({});

  // console.dir( DT );
  const deliveryHour = 7; // PM

  let pushToProcessingAt = DT.moment()
    .tz('America/Los_Angeles')
    .startOf('day');

  console.log(pushToProcessingAt.format( DT.moment.defaultFormat ));
  console.log(pushToProcessingAt.format( DT.moment.humanDatetimeFormat ));

  pushToProcessingAt.add(24, 'hours');

  pushToProcessingAt.add( (+deliveryHour)+('PM'?12:0), 'hours')


  console.log(pushToProcessingAt.format( DT.moment.humanDatetimeFormat ));
  console.log(pushToProcessingAt.format( DT.moment.defaultFormat ));

  // pushToProcessingAt.startOf('day')
  //   .add( (+deliveryHour)+(deliveryTimeType===timeTypes.PM?12:0), 'hours')
  //   // .sub( (+deliveryHour)+(deliveryTimeType===timeTypes.PM?12:0), 'hours')

  // console.json({pushToProcessingAt, deliveryHour, deliveryTimeType, type: timeTypes.PM });

  // // pushToProcessingAt = pushToProcessingAt
  // //   .add( (+deliveryHour)+(deliveryTimeType===timeTypes.PM?12:0), 'hours')


  // console.json({pushToProcessingAt, timezone: mOrderSupplier.Restaurant.timezone});

  // pushToProcessingAt
  //   .tz( mOrderSupplier.Restaurant.timezone )
  //   .format( getDateFormat() );
  // 
  // console.json({pushToProcessingAt});

})();
