'use strict';

var express = require('express');

var config = require('./config');
var etcd = require('./etcd');
var mongo = require('./mongo');

var streamApi = require('./streamApi');

// App
const app = express();
app.get('/', (req, res) => {
  res.send('Hello world\n');
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
  console.log('Connected to etcd server!');
  
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








