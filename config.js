module.exports = {
    env: process.env.ENV || 'dev',
    etcdUrl: process.env.ETCD_URL || 'http://localhost:2379',
    port: process.env.PORT || 8081,
    host: '0.0.0.0'
}