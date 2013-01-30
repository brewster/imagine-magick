/* global describe, it, before, after */
"use strict";

var fs = require('fs');
var mockit = require('mockit');
var should = require('should');
var sinon = require('sinon');

var mockGm = {
  stream: sinon.spy()
};
var ImagineMagick = mockit('../lib/imagine-magick.js', {
  gm: function (stream) {
    return mockGm;
  }
});

var filepath = 'test/support/joe-strummer.jpg';

describe('ImagineMagick', function () {

  describe('initialize', function () {
    var im;
    var ops = '/resize/200x200';
    var request = { url: '/joe' + ops };

    before(function () {
      im = new ImagineMagick(request);
    });

    it('should parse out the operations string from the url', function () {
      im.ops.should.equal(ops);
    });
  });

  describe('handleResponse', function () {
    describe('when the url has no operations', function () {
      var im, stream, performOps;
      var response = sinon.spy();
      var request = { url: '/joe' };

      before(function () {
        im = new ImagineMagick(request);
        performOps = sinon.stub(im, 'performOperations');
        im.on('response', response);
        stream = fs.createReadStream(filepath);
        im.handleResponse(stream);
      });

      it('should not perform operations', function () {
        performOps.called.should.be.false;
      });
      it('should emit a response', function () {
        response.calledOnce.should.be.true;
      });
      it('should emit the unchanged response object', function () {
        response.calledWith(stream);
      });
    });
    describe('when the url has operations', function () {
      var im, stream, performOps, onStream;
      var response = sinon.spy();
      var error = sinon.spy();
      var request = { url: '/joe/resize/200x200' }
      mockGm.resize = sinon.spy();

      before(function () {
        im = new ImagineMagick(request);
        performOps = sinon.spy(im, 'performOperations');
        im.on('response', response);
        im.on('error', error);
        stream = fs.createReadStream(filepath);
        im.handleResponse(stream);
        onStream = mockGm.stream.args[0][0]
      });

      after(function () {
        mockGm.stream.reset();
      });

      it('should call performOperations', function() {
        performOps.called.should.be.true;
      });
      it('should perform resize operation', function () {
        mockGm.resize.called.should.be.true;
      });
      it('should call the stream method on the file', function () {
        mockGm.stream.calledOnce.should.be.true;
      });
      it('should not have emitted a response yet', function () {
        response.called.should.be.false;
      });

      describe('when the file streams back without error', function () {
        var file = {};
        before(function () {
          onStream(null, file);
        });

        it('should emit response', function () {
          response.calledOnce.should.be.true;
        });
        it('should emit file', function () {
          response.calledWith(file).should.be.true;
        });
      });

      describe ('when the file stream has an error', function () {
        before(function () {
          onStream(true);
        });

        it('should emit an error', function () {
          error.calledOnce.should.be.true;
        });
      });
    });
  });

});
