/**
 * Created by noamc on 8/31/14.
 */
 var binaryServer = require('binaryjs').BinaryServer,
     https = require('https'),
     wav = require('wav'),
     opener = require('opener'),
     fs = require('fs'),
     connect = require('connect'),
     serveStatic = require('serve-static'),
     UAParser = require('./ua-parser'),
     CONFIG = require("../config.json"),
     url = require('url'),
     lame = require('lame');

 var uaParser = new UAParser();

 if(!fs.existsSync("recordings"))
    fs.mkdirSync("recordings");

var options = {
    key:    fs.readFileSync('ssl/server.key'),
    cert:   fs.readFileSync('ssl/server.crt'),
};

let globalFileName;

function getName() {
    var fileName = "recordings/" + new Date().getTime();
    globalFileName = fileName;
    return fileName;
}

var app = connect();

app
    .use(function(req, res, next) {
        var queryData = url.parse(req.url, true).query;
        if (queryData.action != undefined && queryData.action === 'find') {
            console.log(globalFileName);
            const {spawn} = require('child_process');
            const ls = spawn('ls', ['-lh', '/usr']);
            //const ls = spawn('/Users/dsnyder/kaldi/kaldi-xvector-test/egs/sre16/v2/test_mp3.sh', ['/Users/dsnyder/Sites/' + fileName + ".mp3"], {cwd: '/Users/dsnyder/kaldi/kaldi-xvector-test/egs/sre16/v2/'});
            ls.stdout.on('data', (data) => {
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(`${data}`));
                next();
            });
            ls.stderr.on('data', (data) => {
                console.log(`tderr: ${data}`);
            });
            ls.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
            });
        } else if (queryData.action != undefined && queryData.action === 'enroll') {
            if (queryData.enrollName == "") {
                res.writeHead(400, {"Content-Type": "application/json"});
                res.end(JSON.stringify({enrollError: 'Enrollment name is missing'}));
            } else {

                let enrollmentName = queryData.enrollName;

                /* DAVID, execute the enrollment script here. */
                /* Save the result into data*/
                let data = null;
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(`${data}`));
                next();
            }
        } else {
            next();
        }
    });

app.use(serveStatic('public'));

var server = https.createServer(options,app);
server.listen(9191);

opener("https://localhost:9191");

var server = binaryServer({server:server});

server.on('connection', function(client) {
    console.log("new connection...");
    var fileWriter = null;
    var writeStream = null;
    
    var userAgent  =client._socket.upgradeReq.headers['user-agent'];
    uaParser.setUA(userAgent);
    var ua = uaParser.getResult();

    client.on('stream', function(stream, meta) {

        console.log("Stream Start@" + meta.sampleRate +"Hz");
        var fileName = getName();
       // var fileName = "recordings/" + new Date().getTime();

        switch(CONFIG.AudioEncoding){
            case "WAV":
                fileWriter = new wav.FileWriter(fileName + ".wav", {
                    channels: 1,
                    sampleRate: meta.sampleRate,
                    bitDepth: 16 });
                stream.pipe(fileWriter);
            break;

            case "MP3":
                writeStream = fs.createWriteStream( fileName + ".mp3" );
                stream.pipe( new lame.Encoder(
                {
                    channels: 1, bitDepth: 16, sampleRate: meta.sampleRate, bitRate: 128, outSampleRate: 22050, mode: lame.MONO
                })
                )
                .pipe( writeStream );
            break;
        };
    });

    
    client.on('close', function(req, res) {
        if ( fileWriter != null ) {
            fileWriter.end();
        } else if ( writeStream != null ) {
            writeStream.end();
        }
        console.log("Connection Closed");
    });
});
