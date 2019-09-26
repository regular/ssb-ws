var WS = require('multiserver/plugins/ws')
const {encode, decode} = require('multiserver-address')

module.exports = function (createHandlers) {
  var exports = {}
  exports.name = 'ws'
  exports.version = require('./package.json').version
  exports.manifest = {
    getAddress: 'sync'
  }

  exports.init = function (sbot, config) {
    var port
    if(config.ws) {
      port = config.ws.port
    }
    if(!port)
      port = 1024+(~~(Math.random()*(65536-1024)))

    var layers = []

    function no_handler (req, res, next) {
      next(new Error('ssb-ws:web sockets only'))
    }
    var handlers = createHandlers(sbot)
    sbot.multiserver.transport({
      name: 'ws',
      create: function (config) {
        var _host = config.host || 'localhost'
        var _port = config.port || port
        return WS(Object.assign({
          port: _port, host: _host,
          handler: config.http !== false ? handlers : no_handler
        }, config))
      }
    })

    return {
      getAddress: function() {
        const scopes = ['device', 'private', 'public']  // TODO: get from multiserver-scopes
        const wsAddresses = scopes.reduce( (acc, scope) => {
          const addresses = decode(sbot.getAddress(scope))
          acc = acc.concat(addresses.find(stack=>{
            return stack[0].name == 'ws'
          }))
          return acc
        }, [])
        return encode(wsAddresses)
      },
      use: function (handler) {
        if(handlers.layers) handlers.layers.push(handler)
      }
    }
  }

  return exports
}

