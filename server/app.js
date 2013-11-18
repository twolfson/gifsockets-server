var express = require('express');

var routes = require('./routes');

function GifServer(port) {
  // Keep track of array of connections
  var firstConnections = [];
  var secondConnections = [];

  // Start a server that runs on jade
  var app = express();

  // Host static files
  app.use('/public', express['static'](__dirname + '/../public'));

  // Set up connections for server logic
  app.use(function saveConnections (req, res, next) {
    req.firstConnections = firstConnections;
    req.secondConnections = secondConnections;
    next();
  });

  // Host homepage
  app.get('/', routes.index);

  // Server logic
  app.get('/image.gif', routes.openImage);
  app.post('/image/text', routes.writeTextToImage);
  app.post('/image/json', routes.writeJsonToImage);
  // TODO: Somehow assign each page an id and allow for closing via /close:id. See #5 comments
  app.post('/image/close', routes.closeImages);

  // Host 404 page
  app.all('*', routes[404]);

  // Save app for later
  this.app = app;
}
GifServer.prototype = {
  listen: function (port) {
    // Listen and notify the outside world
    this._app = this.app.listen(port);
    console.log('gifsockets server is listening at http://127.0.0.1:' + port + '/');
  },
  destroy: function (cb) {
    this._app.close(cb || function () {});
  }
};

module.exports = GifServer;
