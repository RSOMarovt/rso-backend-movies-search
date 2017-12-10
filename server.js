'use strict';

var express = require('express');

var config = require('./config');
var etcd = require('./etcd');
var mongo = require('./mongo');

var streamApi = require('./streamApi');

// App
const app = express();
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

app.get('/streams', (req, res) => {
  streamApi.getAllActiveStreams().then(streams => {
    res.status(200).send(streams);
  }).catch(err => {
    console.log('ERROR: ', err);
    res.status(500).send(err);
  })
})

app.listen(config.port, config.host);
console.log(`Running on http://${config.host}:${config.port}`);

etcd.connect(config.etcdUrl).then(() => {

  console.log('Connected to etcd server!', config.etcdUrl);
  
  // register service -> register na kubernetes, najbrz ne tako ampak preko ENV
  etcd.setValue('rso_backend_movies_url', `http://${config.host}:${config.port}`).then(() => {
    console.log('Registered service!');
  }).catch((err) => {
    console.log('Problem with service registration!!!');
  });

  // connect to mongoDB
  // etcd.getValue('mongo_url').then((mongoUrl) => {
  //   etcd.getValue('mongo_database').then(mongoDatabase => {
  //     mongo.connect(mongoUrl, mongoDatabase).then(() => {
  //       console.log('Connected to mongodb!');
  //     });
  //   }); 
  // });

  
  streamApi.findService();
  

}).catch(err => {
  console.log(`Error connecting to etcd server!!!`, err);
});








