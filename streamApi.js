var axios = require('axios');
var etcd = require('./etcd');

var config = require('./config');

global_stream_api = null;

etcdWatcher = null;

module.exports.findService = () => {
    return etcd.getValuesInDir(`/environments/${config.env}/services/stream-service/1.0.0/instances/`).then((res) => {
        try {
          console.log(res);
          var finalNode = res.node.nodes[0].nodes[0];
          var key = finalNode.key;
          var url = finalNode.value;
          
          module.exports.connect(url);
    
          etcdWatcher = etcd.createWatcher(key, (_) => {
            etcdWatcher.stop();
            global_stream_api = null;
            etcdWatcher = null;
            
            findService();
          });

          console.log('Successfully registered!');
        } catch(err) {
          console.log('Sth went wrong!!!', err);
          setTimeout(module.exports.findService, 5000); //try to connect to streamServer every 5 seconds
        }
    });
}

module.exports.connect = (url) => {
    global_stream_api = axios.create({
        baseURL: url,
        timeout: 5000
    });
}

module.exports.getAllActiveStreams = () => {
    return new Promise((resolve, reject) => {
        global_stream_api.get('/v1/streams').then((res) => {
            console.log('DATA FROM OTHER SERVER!!!');
            resolve(res.data);
        }).catch((err) => {
            console.log('PROBLEM GETTING DATA FROM OTHER SERVER!!!');
        });
    });
}