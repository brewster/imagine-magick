"use strict";

var events = require('events');
var extend = require('obj-extend');
var gm = require('gm');
var url = require('url');

var ImagineMagick = function (request) {
  var ops_pattern = new RegExp('^\/(.*?)(\/.*)?$');
  var match = url.parse(request.url).pathname.match(ops_pattern);
  if (match && match[2]) {
    this.ops = decodeURIComponent(match[2]);
  }
};

ImagineMagick.prototype = extend({}, events.EventEmitter.prototype, {

  handleResponse: function (response) {
    if (this.ops && this.ops.length > 1) {
      this.response = response;

      // Grab the file handle and perform operations on it
      var file = gm(this.response);
      this.performOperations(file);

      // Stream out the response
      file.stream(this.onResponse.bind(this));
    } else {
      // Emit out the original stream if we're not performing any operations
      this.emit('response', response);
    }
  },

  handleAbort: function () {
    if (this.response) {
      this.response.removeAllListeners();
    }
  },

  onResponse: function (error, stdout, stderr) {
    if (error) {
      // Emit errors upwards
      this.emit('error', { message: 'error performing image operations' });
    } else {
      // Emit the stream upwards
      this.emit('response', stdout);
    }
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

ImagineMagick.operations = {

  'antialias\/(true|false)(\/|$)': function (file, bool) {
    bool = bool == 'true' ? true : false;
    file.antialias(bool);
  },
  'autoOrient(\/|$)': function (file) {
    file.autoOrient();
  },
  'backdrop(\/|$)': function (file) {
    file.backdrop();
  },
  'blur\/([0-9]+?)(\/|$)': function (file, radius) {
    file.blur(parseInt(radius, 10));
  },
  'border\/([0-9]+?)x([0-9]+?)(\/|$)': function (file, width, height) {
    file.border(parseInt(width, 10), parseInt(height, 10));
  },
  'borderColor\/(.*?)(\/|$)': function (file, color) {
    file.borderColor(color);
  },
  'box\/(.*?)(\/|$)': function (file, color) {
    file.box(color);
  },
  'charcoal\/([0-9]+?)(\/|$)': function (file, factor) {
    file.charcoal(parseInt(factor, 10));
  },
  'chop\/([0-9]+?)x([0-9]+?)+([0-9]+?)+([0-9]+?)(\/|$)': function (file, width, height, x, y) {
    file.chop(parseInt(width, 10), parseInt(height, 10), parseInt(x, 10), parseInt(y, 10));
  },
  'colors\/([0-9]+?)(\/|$)': function (file, int) {
    file.colors(parseInt(int, 10));
  },
  'colorspace\/(.*?)(\/|$)': function (file, val) {
    file.colorspace(val);
  },
  'compress\/(.*?)(\/|$)': function (file, type) {
    file.compress(type);
  },
  'comment\/(.*?)(\/|$)': function (file, text) {
    file.comment(text);
  },
  'contrast\/(.*?)(\/|$)': function (file, multiplier) {
    file.contrast(parseInt(multiplier, 10));
  },
  'crop\/([0-9]+?)x([0-9]+?)+([0-9]+?)+([0-9]+?)(\/|$)': function (file, width, height, x, y) {
    file.crop(parseInt(width, 10), parseInt(height, 10), parseInt(x, 10), parseInt(y, 10));
  },
  'disolve\/([0-9]{1-3})(\/|$)': function (file, val) {
    file.disolve(parseInt(val, 10) / 100);
  },
  'dither\/(true|false)(\/|$)': function (file, bool) {
    bool = bool == 'true' ? true : false;
    file.dither(bool);
  },
  'emboss\/([0-9]+?)(\/|$)': function (file, radius) {
    file.emboss(radius);
  },
  'enhance(\/|$)': function (file) {
    file.enhance();
  },
  'equalize(\/|$)': function (file) {
    file.equalize();
  },
  'extent\/([0-9]+?)x([0-9]+?)(\/|$)': function (file, width, height) {
    file.extent(parseInt(width, 10), parseInt(height, 10));
  },
  'filter\/(.*?)(\/|$)': function (file, type) {
    file.filter(type);
  },
  'flip(\/|$)': function (file) {
    file.flip();
  },
  'flop(\/|$)': function (file) {
    file.flop();
  },
  'foreground\/(.*?)(\/|$)': function (file, color) {
    file.foreground(color);
  },
  'frame\/([0-9]+?)x([0-9]+?)+([0-9]+?)+([0-9]+?)(\/|$)': function (file, width, height, bevelW, bevelH) {
    file.frame(parseInt(width, 10), parseInt(height, 10), parseInt(bevelW, 10), parseInt(bevelH, 10));
  },
  'gaussian\/([0-9]+?)x([0-9]+?)(\/|$)': function (file, radius, sigma) {
    file.gaussian(parseInt(radius, 10), parseInt(sigma, 10));
  },
  'gravity\/([a-zA-Z]+?)(\/|$)': function (file, type) {
    var types = {
      'northwest': 'NorthWest',
      'north': 'North',
      'northeast': 'NorthEast',
      'west': 'West',
      'center': 'Center',
      'east': 'East',
      'southwest': 'SouthWest',
      'south': 'South',
      'southeast': 'SouthEast'
    };
    type = types[type.toLowerCase()] || types['northwest'];
    file.gravity(type);
  },
  'implode\/([0-9]+?)(\/|$)': function (file, factor) {
    file.implode(parseInt(factor, 10));
  },
  'lower\/([0-9]+?)x([0-9]+?)(\/|$)': function (file, width, height) {
    file.lower(parseInt(width, 10), parseInt(height, 10));
  },
  'matteColor\/(.*?)(\/|$)': function (file, color) {
    file.matteColor(color);
  },
  'monochrome(\/|$)': function (file) {
    file.monochrome();
  },
  'negative(\/|$)': function (file) {
    file.negative();
  },
  'normalize(\/|$)': function (file) {
    file.normalize();
  },
  'paint\/([0-9]+?)(\/|$)': function (file, radius) {
    file.paint(parseInt(radius, 10));
  },
  'quality\/([0-9]+?)(\/|$)': function (file, value) {
    file.quality(parseInt(value, 10));
  },
  'resize\/([0-9]+?)x([0-9]+?)(.*?)(\/|$)': function (file, width, height, opts) {
    file.resize(parseInt(width, 10), parseInt(height, 10), opts);
  },
  'rotate\/(.*?)+([0-9]+?)(\/|$)': function (file, color, degrees) {
    file.rotate(color, parseInt(degrees, 10));
  },
  'scale\/([0-9]+?)x([0-9]+?)(\/|$)': function (file, width, height) {
    file.scale(parseInt(width, 10), parseInt(height, 10));
  },
  'sepia\/([0-9]+?)(\/|$)': function (file, threshold) {
    file.threshold(parseInt(threshold, 10));
  },
  'shadow\/([0-9]+?)x([0-9]+?)(\/|$)': function (file, radius, sigma) {
    file.shadow(parseInt(radius, 10), parseInt(sigma, 10));
  },
  'solarize\/([0-9]+?)(\/|$)': function (file, threshold) {
    file.solarize(parseInt(threshold, 10));
  },
  'swirl\/([0-9]+?)(\/|$)': function (file, degrees) {
    file.swirl(parseInt(degrees, 10));
  },
  'trim(\/|$)': function (file) {
    file.trim();
  }

};

module.exports = ImagineMagick;
