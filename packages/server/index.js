const express = require('express')
const app = express()
const port = 8080

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/enrollments', (req, res) => {
  const {spawn} = require('child_process');
  const getEnrollments = spawn('./get_enrolled_speakers.sh', [], {cwd: '/Users/eryabtseva/Projects/gbo-demo/egs/voxceleb/gbo_demo'});
  let result = '';
  getEnrollments.stdout.on('data', (chunk) => {
    result += chunk.toString('utf-8');
  });
  getEnrollments.stderr.on('data', (data) => {
      console.log(`tderr: ${data}`);
  });
  getEnrollments.on('close', (code) => {
      let response = {};
      response.enrollments = result;
      res.end(JSON.stringify(response));
  });
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
