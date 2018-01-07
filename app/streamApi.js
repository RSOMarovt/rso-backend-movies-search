var axios = require('axios');
var circuitBreaker = require('circuitbreaker');
var logit = require('node-logitio');

var etcd = require('./etcd');
var config = require('./config');

globalStreamApi = null;

etcdWatcher = null;

module.exports.findService = () => {
    return etcd.getValuesInDir(`/environments/${config.env}/services/stream-service/1.0.0/instances/`).then((res) => {
        try {
        //   console.log('RES', res);
          var finalNode = res.node.nodes[0].nodes[0];
          var key = finalNode.key;
          var url = finalNode.value;
          
          module.exports.connect(url);
    
          etcdWatcher = etcd.createWatcher(key, (_) => {
            etcdWatcher.stop();
            globalStreamApi = null;
            etcdWatcher = null;
            
            module.exports.findService();
          });
        } catch(err) {
          logit.error('Missing service instance - retry in 5000 miliseconds.');
          setTimeout(module.exports.findService, 5000); //try to connect to streamServer every 5 seconds
        }
    }).catch(err => {
        logit.error('Error on service discovery: ', err);
    });
}

module.exports.connect = (url) => {
    logit.info('Connect to stream service.');
    globalStreamApi = axios.create({
        baseURL: url,
        timeout: 10000
    });
}

const getAllStreams = () => {
    return new Promise((resolve, reject) => {
        globalStreamApi.get('/v1/streams').then((res) => {
            resolve(res.data);
        }).catch((err) => {
            logit.error('PROBLEM GETTING DATA FROM OTHER SERVER!!!');
        });
    });
}

const saveStream = (data) => {
    return new Promise((resolve, reject) => {
        const body = JSON.parse(JSON.stringify(data));
        delete body.lat;
        delete body.lng;
        globalStreamApi.post('/v1/streams', body).then((res) => {
            resolve(res.data);
        }).catch((err) => {
            logit.error('PROBLEM SAVING DATA TO OTHER SERVER!!!', err);
        })
    });
} 

module.exports.getAllStreams = circuitBreaker(getAllStreams, {timeout: 1000, maxFailures: 3, resetTimeout: 30000});
module.exports.saveStream = circuitBreaker(saveStream, {timeout: 1000, maxFailures: 3, resetTimeout: 30000});