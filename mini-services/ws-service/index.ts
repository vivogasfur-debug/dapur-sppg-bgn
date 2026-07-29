import { Server } from 'socket.io'

const io = new Server({
  cors: { origin: '*' },
})

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('new-activity', (data) => {
    io.emit('activity-update', data)
  })

  socket.on('task-updated', (data) => {
    io.emit('task-update', data)
  })

  socket.on('project-updated', (data) => {
    io.emit('project-update', data)
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

io.listen(3003)
console.log('WebSocket service running on port 3003')
