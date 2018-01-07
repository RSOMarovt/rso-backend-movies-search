const Etcd = require('node-etcd');
const config = require('./config');

global_etcd = null;

watchers = {};

module.exports.connect = (connectionUrl) => {
    return new Promise((resolve, reject) => {
        var etcd = new Etcd(connectionUrl);
        
        global_etcd = etcd;

        resolve(global_etcd);
    })
}

module.exports.getValue = (key) => {
    return new Promise((resolve, reject) => {
        global_etcd.get(key, (err, res) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(res.node.value);
        })
    })
}

module.exports.getValuesInDir = (dir) => {
    return new Promise((resolve, reject) => {
        global_etcd.get(dir, {recursive: true}, (err, res) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(res);
        })
    })
} 

module.exports.setValue = (key, value) => {
    return new Promise((resolve, reject) => {
        global_etcd.set(key, value, (err, res) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(res);
        })
    })
}

module.exports.unregisterService = () => {

}

module.exports.createWatcher = (key, callback) => {
    const watcher = global_etcd.watcher(key);
    watcher.on("change", callback);
    return watcher;
}

module.exports.clearWatcher = (key) => {
    watchers[key].stop();
}