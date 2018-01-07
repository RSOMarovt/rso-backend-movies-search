console.log('PROCESS ENV:', process.env.ENV);
console.log('PROCESS ETCD_URL', process.env.ETCD_URL);

module.exports = {
    env: process.env.ENV || 'dev',
    etcdUrl: process.env.ETCD_URL || 'http://localhost:2379',
    port: process.env.PORT || 8081,
    host: '0.0.0.0',
    appName: 'location-search',
    appVersion: '1.0.0',

    // Logit
    logitApiKey: '1fd2e144-3bce-4ecf-9c96-826c6866703f'
    
    
}