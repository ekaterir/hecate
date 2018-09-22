const express = require('express')
var bodyParser = require('body-parser');
require('dotenv').load();
const app = express();
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

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/enrollments', (req, res) => {
  const {spawn} = require('child_process');
  const getEnrollments = spawn('./get_enrolled_speakers.sh', [], {cwd: process.env.COMMANDS_EXECUTION_DIRECTORY });
  let result = '';
  getEnrollments.stdout.on('data', (chunk) => {
    result += chunk.toString('utf-8');
  });
  getEnrollments.stderr.on('data', (data) => {
      console.log(`tderr: ${data}`);
  });
  getEnrollments.on('close', (code) => {
      let response = {};
      response.enrollments = result.replace(/_/g , " ");
      res.end(JSON.stringify(response));
  });
})

app.post('/embeddings', (req, res) => {
  const {spawn} = require('child_process');
  const youtubeId = req.body.youtubeId;
  const createEmbedding = spawn('./create_embedding.sh', [ youtubeId ], {cwd: process.env.COMMANDS_EXECUTION_DIRECTORY });
  result = '';
  createEmbedding.stdout.on('data', (chunk) => {
    result += chunk.toString('utf-8');
  });
  createEmbedding.stderr.on('data', (data) => {
      console.log(`tderr: ${data}`);
  });
  createEmbedding.on('close', (code) => {
      res.end(JSON.stringify(result));
  });
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
