const MongoClient = require( 'mongodb').MongoClient;
const etcd  = require( './etcd');
const logit = require('node-logitio');

global_db = null

module.exports.connect = (url, database) => {
    return new Promise((resolve, reject) => {
        MongoClient.connect(`mongodb://${url}:27017/${database}`, (err, db) => {
            if (err) {
                reject(err);
            }

            global_db = db;
            resolve(db);
        });
    });
}

module.exports.getLocationStreams = (lat, lng) => {
    return new Promise((resolve, reject) => {
        const collection = global_db.collection('LocationStreams');

        collection.find({location: {
            $near: {
                $geometry: { type: "Point",  coordinates:[parseFloat(lat), parseFloat(lng)]},
                $maxDistance: 100000
            }
        }}).toArray((err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        })
    })
}

module.exports.saveLocationStream = (data) => {
    return new Promise((resolve, reject) => {
        const collection = global_db.collection('LocationStreams');

        collection.insertOne({
            location: {
                type: 'Point',
                coordinates: [parseFloat(data.lat), parseFloat(data.lng)]
            },
            stream_id: data.stream_id
        }).then((res) => {
            resolve();
        }).catch((err) => {
            reject(err);
        })

    })
} 

module.exports.isConnected = () => {
    return new Promise((resolve, reject) => {
        try {
            if (global_db.serverConfig.isConnected()) {
                resolve();
            } else {
                reject();
            }
        } catch(err) {
            reject(err);
        }
    });
};