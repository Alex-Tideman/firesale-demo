const Application = require('spectron').Application;
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = require('chai').expect;
const assert = require('chai').assert;
const path = require('path');

let electronPath = path.join(__dirname, '..', 'node_modules', '.bin', 'electron');
let appPath = path.join(__dirname, '..');
let mocksPath = path.join(__dirname, 'mocks.js');

global.before(function () {
    chai.should();
    chai.use(chaiAsPromised);
});

describe('App starts and has correct title and buttons', function () {
  let app;

  before(function () {
      app = new Application({ 
        path: electronPath,
        env: { SPECTRON: true },
        args: [appPath, '-r', mocksPath]
      });
      return app.start();
  });

  after(function () {
      return app.stop();
  });

  it('opens a window', function () {
    return app.client.waitUntilWindowLoaded().getWindowCount()
            .should.eventually.equal(1);
  });

  it('tests the title', function () {
    return app.client.waitUntilWindowLoaded().getTitle()
            .should.eventually.equal('Fire Sale');
  });

  it('tests the Open File button text exists', function() {
    return app.client.getText('#open-file')
            .should.eventually.equal('Open File');
  });

  it('tests the Save button text exists', function () {
    return app.client.getText('#save-markdown')
            .should.eventually.equal('Save Markdown');
  });

  it('tests the Open button opens a file dialog', function (done) {
    app.client.click('#open-file').then((dialog) => { 
      return app.client.getText('.raw-markdown').then(text => {
        text.should.equal('# hi');
        done();
      })
    }).catch((error) => {
      done(error);
    });
  });
});