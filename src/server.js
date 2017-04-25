import Server from 'socket.io';

export default function startSocketServer(store) {
  const io = new Server().attach(8090);

  store.subscribe(
    () => io.emit('state', store.getState().toJS())
  );
  
  io.on('connection', (socket) => {
    console.log('Connected...')
    console.log(store.getState().toJS())

    socket.on('join', (jwt) => {
      const room = payload.sessionId;
      const user = payload.user;
      socket.join(room);
      socket.in(room).emit('JOIN_SESSION', user);
      socket.in(room).emit('state', store.getState().toJS());
      socket.in(room).on('action', store.dispatch.bind(store));
    });
  });
}
