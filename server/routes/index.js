var GifCanvas = require('../../lib/gif-canvas');

exports.openImage = function openImage (req, res) {
  console.log('CONNECTION-ADDED');
  res.writeHead(200, {
    'connection': 'keep-alive',
    'content-type': 'image/gif',
    'transfer-encoding': 'chunked'
  });

  // Write out the header info
  // DEV: It would be nice to write out image info here too (e.g. width x height)
  var gif = new GifCanvas();
  gif.on('data', function getHeader (buff) {
    // Clean up our GIF and write out the info
    gif.removeAllListeners();
    res.write(buff);

    // Add the response to our list of open connections
    req.firstConnections.push({
      res: res
    });
  });
  gif.writeHeader();
};

exports.closeImages = function (req, res) {
  // Remove and save the open connections
  var connections = req.firstConnections.concat(req.secondConnections);
  req.firstConnections.splice(0, req.firstConnections.length);
  req.secondConnections.splice(0, req.secondConnections.length);

  // Write footer
  var gif = new GifCanvas();
  gif.on('data', function getFooter (buff) {
    // Clean up our GIF and write out footer
    gif.removeAllListeners();
    connections.forEach(function writeFooter (conn) {
      conn.res.end(buff);
    });

    // Close the request
    res.send(204);
  });
  gif.finish();
};

exports.writeTextToImage = require('./writeTextToImage');
exports.writeJsonToImage = require('./writeJsonToImage');

// Render some jade into memory
var fs = require('fs');
var jade = require('jade');
function renderView(filepath, locals) {
  var file = fs.readFileSync(filepath, 'utf8');
  return jade.render(file, locals);
}

var indexHtml = renderView(__dirname + '/../../views/index.jade', {});
exports.index = function (req, res) {
  res.send(indexHtml);
};

var pageNotFoundHtml = renderView(__dirname + '/../../views/404.jade', {});
exports[404] = function (req, res) {
  res.status(404);
  res.send(pageNotFoundHtml);
};
