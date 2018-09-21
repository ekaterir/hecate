const express = require('express')
const app = express()
const port = 8080

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/enrollments', (req, res) => {
  console.log("Got into enrollments");
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))