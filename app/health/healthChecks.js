var mongo = require('./../mongo'); 

module.exports.check = function(fail, pass) {
    mongo.isConnected().then(_ => {
        pass();
    }).catch(err => {
        fail(err);
    });
}