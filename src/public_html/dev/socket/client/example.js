{

  // Socket.IO lib: if required: 
  //  @rem: '/socket/rem/io/socket.io.min.js'
  //  @dev: '/socket/dev/io/socket.io.min.js'
  //  @stage: '/socket/stage/io/socket.io.min.js'
  //  @prod: '/socket/prod/io/socket.io.min.js'

  const env = 'rem'; // dev | rem | stage | prod
  const host = 'api.morris-armstrong-ii-dev.ru'; // << == env 'rem'
  const token = 'client-or-driver-token';

  const sock = io.connect(`wss://${host}`, {
    path: `/socket/${ENV}/io/`,
    extraHeaders: { env }, // optional
    reconnection: true,
    reconnectionAttempts: Infinity,
    autoConnect: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
    timeout: 20000,
  });

  sock.on('connect',(err,info)=>{
    sock.emit('authenticate-client', {token});
  });

  sock.on('authenticate-client',(event)=>{
    // event: {
    //   "success": true,
    //   "message": "success",
    //   "data": { "userId": 6, "sessionId": 51, "role": "client", "token": "f544e270c086..." }
    // }
  });

  sock.on('livePositionOfCourierUpdated',(event)=>{
    // event: {
    //   lat: 0.00000000,
    //   lon: 0.00000000,
    // }
  });

}
