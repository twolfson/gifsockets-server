var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var GifEncoder = require('gif-encoder');
var objExtend = require('obj-extend');
var functionToString = require('function-to-string');

var imageInfo = require('./canvas-to-pixels/phantomjs-pixel-server');
function noop() {}

function drawImage(canvas, cb) {
  var context = canvas.getContext('2d');
  var fontSize = parseInt("FONT_SIZE", 0);
  var lineHeight = Math.ceil(1.61803398875 * fontSize);
  context.font = fontSize + 'px ' + "FONT_FAMILY";
  context.fillStyle = "BACKGROUND";
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = "FOREGROUND";
  var text = "TEXT";
  var lines = text.split('\n');
  lines.forEach(function (line, i) {
    context.fillText(line, lineHeight / 2, (i * lineHeight) + fontSize + (lineHeight / 2));
  });
  cb(null);
}
var drawImageInfo = functionToString(drawImage);

function GifCanvas(options) {
  // Inherit from GifEncoder
  GifEncoder.call(this);

  // Set up options
  options = options || {};
  // #GIFSOCKET-DIMENSIONS
  var width = options.width || 600;
  var height = options.height || 380;
  this.width = width;
  this.height = height;

  // Output canvas data to gif
  GifEncoder.call(this, width, height);

  // Configure the gif
  // gif.setDelay(100);
  // gif.setRepeat(0);
  this.setQuality(options.quality || 10);
}
util.inherits(GifCanvas, GifEncoder);
objExtend(GifCanvas.prototype, {
  getTextFrameData: function (params, cb) {
    cb = cb || noop;
    var fnBody = drawImageInfo.body
                   // Ain't no injection like a JavaScript eval injection
                   .replace('"FONT_SIZE"', JSON.stringify(params['font-size'] || '30'))
                   .replace('"FONT_FAMILY"', JSON.stringify(params['font-family'] || 'Impact'))
                   .replace('"TEXT"', JSON.stringify(params.text))
                   .replace('"BACKGROUND"', JSON.stringify(params.background || '#000000'))
                   .replace('"FOREGROUND"', JSON.stringify(params.foreground || '#BADA55'))
                   .replace('HEIGHT', this.height)
                   .replace('WIDTH', this.width);

    console.log('FRAME-DATA: Generating image');

    // TODO: Image info will operate on a switch at server start

    imageInfo({
      width: this.width,
      height: this.height,
      js: {
        params: drawImageInfo.params,
        body: fnBody
      },
      responseType: 'string'
    }, function parseFrameInfo (err, unparsedData) {
      console.log('FRAME-DATA: Image generated');
      if (err) {
        return cb(err);
      }

      cb(null, unparsedData);
    });
  }
});

module.exports = GifCanvas;