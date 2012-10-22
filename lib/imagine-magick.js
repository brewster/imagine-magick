var events = require('events');
var extend = require('obj-extend');
var magick = require('magick');
var url = require('url');

var ImagineMagick = function (ops, key) {
  this.ops = ops;
  this.key = key;

  this.data = [];
  this.dataLength = 0;
};

ImagineMagick.operations = {

  'resize\/([0-9]+?)x([0-9]+?)(\/|$)': function (file, width, height) {
    file.resize(parseInt(width, 10), parseInt(height, 10));
  },
  'crop\/([0-9]+?)x([0-9]+?)(\/|$)': function (file, width, height) {
    file.crop(parseInt(width, 10), parseInt(height, 10));
  },
  'resize_to_fill\/([0-9]+?)x([0-9]+?)(\/|$)': function (file, width, height) {
    file.resizeToFill(parseInt(width, 10), parseInt(height, 10));
  },
  'opacity\/([0-9]+?)(\/|$)': function (file, opacity) {
    file.opacity(parseInt(opacity, 10) / 100);
  },
  'blur\/([0-9]+?)(\/|$)': function (file, sigma) {
    sigma = !sigma || isNaN(sigma) ? 0 : parseInt(sigma, 10);
    file.blur(sigma);
  },
  'charcoal\/([0-9]+?)(\/|$)': function (file, sigma) {
    file.charcoal(parseInt(sigma, 10));
  },
  'paint\/([0-9]+?)(\/|$)': function (file, radius) {
    file.paint(parseInt(radius, 10));
  },
  'sepia\/([0-9]+?)(\/|$)': function (file, threshold) {
    file.threshold(parseInt(radius, 10));
  }

};

ImagineMagick.prototype = extend({}, events.EventEmitter.prototype, {

  handleResponse: function (response) {
    if (this.ops && this.ops.length > 1) {
      this.response = response;

      this.proxy = new events.EventEmitter;
      this.proxy.headers = this.response.headers;
      delete this.proxy.headers['content-length'];

      this.response.on('data', this.collectData.bind(this));
      this.response.on('end', this.onEnd.bind(this));
    } else {
      this.emit('response', response);
    }
  },

  handleAbort: function () {
    if (this.response) {
      this.response.removeAllListeners();
    }
  },

  collectData: function (chunk) {
    this.data.push(chunk);
    this.dataLength += chunk.length;
  },

  getBuffer: function () {
    if (!this.buffer) {
      this.buffer = new Buffer(this.dataLength);
      var position = 0;
      this.data.forEach(function (chunk) {
        chunk.copy(this.buffer, position);
        position = chunk.length;
      }, this);
      this.data = [];
      this.dataLength = 0;
    }
    return this.buffer;
  },

  onEnd: function () {
    var file = new magick.File(this.getBuffer());
    this.performOperations(file);
    
    this.emit('response', this.proxy);
    this.proxy.emit('data', file.getBuffer());
    this.proxy.emit('end');

    file.release();
    file = null;
    this.buffer = null;
  },

  performOperations: function (file) {
    var operations = ImagineMagick.operations;
    var operation, match;
    for (operation in operations) {
      if (operations.hasOwnProperty(operation)) {
        match = this.ops.match(new RegExp(operation));
        if (match) {
          match.splice(0, 1, file);
          operations[operation].apply(this, match);
        }
      }
    }
  }

});

module.exports = ImagineMagick;
