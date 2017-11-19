const MongoClient = require( 'mongodb').MongoClient;
const etcd  = require( './etcd');

global_db = null

module.exports.connect = (url, database) => {
    return new Promise((resolve, reject) => {
        MongoClient.connect('mongodb://localhost:27017', (err, db) => {
            if (err) {
                console.log('ERROR CONNECTING TO MONGODB!!!', err);
                reject(err);
            }

            global_db = db;
            resolve(db);
        });
    });
}

module.exports.getAllMovies = () => {
    return new Promise((resolve, reject) => {
        const collection = db.collection('movies');

        collection.find({}).toArray((err, data) => {
            if (err) {
                console.log('Error getting data!');
                reject(err);
            }

            resolve(data);
        })
    })
}