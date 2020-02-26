import http from 'http'

function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const checkFields = (t, object, fields) => {
  fields.forEach(field => {
    t.truthy(object[field])
  })
}

const generatePort = (() => {
  let portNum = getRandomInt(8000, 12000)
  return () => portNum++
})()

export const createHttpServer = requestHandler => {
  const server = http.createServer(requestHandler)
  const port = generatePort()
  return {
    url: `http://127.0.0.1:${port}`,
    start: () =>
      new Promise((resolve, reject) => server.listen(port, err => (err ? reject(err) : resolve()))),
    stop: () =>
      new Promise((resolve, reject) => server.close(err => (err ? reject(err) : resolve()))),
  }
}
