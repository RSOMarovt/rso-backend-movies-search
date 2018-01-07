'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var logit = require('node-logitio');
var healthcheck = require('healthcheck-middleware');
var expressMetrics = require('express-metrics');

var config = require('./config');
var etcd = require('./etcd');
var mongo = require('./mongo');
var streamApi = require('./streamApi');
var healthChecks = require('./health/healthChecks');

/*
  LOGGING - LOGIT
*/

logit.init(config.logitApiKey, {
  defaultDimensions: {
    "environmentType": config.env,
    "applicationName": config.appName,
    "applicationVersion": config.appVersion
  },
  logToConsole: true,
  disableSending: config.env == 'dev'
});

/*
  ETCD REGISTER AND DISCOVERY
*/

etcd.connect(config.etcdUrl).then(() => {

  logit.info('Connected to etcd server!', config.etcdUrl);
  
  // register service -> register na kubernetes, najbrz ne tako ampak preko ENV
  etcd.setValue('rso_backend_movies_url', `http://${config.host}:${config.port}`).then(() => {
    logit.info('Registered service!');
  }).catch((err) => {
    logit.error('Problem with service registration!!!');
  });

  // connect to mongoDB
  etcd.getValue('mongo_url').then((mongoUrl) => {
    etcd.getValue('mongo_database').then(mongoDatabase => {
      mongo.connect(mongoUrl, mongoDatabase).then(() => {
        logit.info('Connected to mongodb!');
      });
    }).catch(err => {
      logit.error("Missing key mongo_database", err);
    });; 
  }).catch(err => {
    logit.error("Missing key mongo_url", err);
  });

  streamApi.findService();

}).catch(err => {
  logit.error(`Error connecting to etcd server!!!`, err);
});


/*
  APP
*/

const app = express();
app.use(bodyParser.json()) 

/*
  METRICS
*/

app.use(expressMetrics({
  port: 8091
}));


/*
  CIRCUIT BREAKER
*/

app.get('/streams', (req, res) => {
  const lat = req.query.lat;
  const lng = req.query.lng;

  logit.info(`GET /streams - Called with parameters: lat: ${lat}, lng: ${lng}.`)

  mongo.getLocationStreams(lat,lng).then(locStreams => {
    streamApi.getAllStreams().then(allStreams => {
      const allStreamsMap = {};
      allStreams.forEach(s => allStreamsMap[s.id] = s);
      const streams = locStreams.map(locStream => {
        const stream = allStreamsMap[locStream.stream_id];
        stream.location = locStream.location;
        return stream;
      });

      res.status(200).send(streams);

      logit.info(`GET /streams - End with response length: ${streams.length} items.`)
    }).fail(err => {
      logit.error(`GET /streams - BREAKER ${err}`);
      const streams = locStreams.map(locStream => {
        const stream = {};
        stream.location = locStream.location;
        return stream;
      });

      res.status(200).send(streams);
    });
  }).catch(err => {
    logit.error('GET /streams - ERROR: ', err);
    res.status(500).send(err);
  });
});


app.post('/streams', (req, res) => {
  const body = req.body;

  logit.info(`POST /streams - Called.`)

  streamApi.saveStream(body).then(streamId => {
    body.stream_id = streamId;
    mongo.saveLocationStream(body).then(() => {
      res.status(200).send(body);

      logit.info(`POST /streams - Ended.`)
    });
  }).fail((err) => {
    logit.error(`POST /stream - BREAKER`, err);
    
    res.status(503).send({});
  });
});

/*
  RSO 
*/

app.get('/', (req, res) => {
  res.send({
    clani: ['um5606'],
    opis_projekta: 'Moj projekt bo implementiral movie stream aplikacijo. Trenutno sta implementirani dve storitvi, ki med sabo kumunicirata in se upesno poisceta preko etcd registra. Na java storitvi so opravljene vse domace naloge, vendar je aplikacija se vedno brez konteksta.',
    mikrostoritve: ["http://169.51.16.3:31017/v1/streams", "http://169.51.16.3:31437/streams"],
    github: ["https://github.com/RSOMarovt/rso-backend-movie-stream", "https://github.com/RSOMarovt/rso-backend-movies-search"],
    travis: ["https://travis-ci.org/RSOMarovt/rso-backend-movie-stream", "https://travis-ci.org/RSOMarovt/rso-backend-movies-search"],
    dockerhub: ["https://hub.docker.com/r/banomaster/rso-backend-movie-stream/", "https://hub.docker.com/r/banomaster/rso-backend-movies-search/"]
  });
});

/*
  HEALTH
*/

app.use('/health', healthcheck({
  addChecks: healthChecks.check
}));

app.listen(config.port, config.host);
logit.info(`Running on http://${config.host}:${config.port}. ENV: ${config.env}`);









