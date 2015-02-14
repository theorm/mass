'use strict';

var express = require('express'),
  logfmt = require('logfmt'),
  join = require('path').join,
  packageJSON = require('./package.json'),
  app = express();

// configuration
app.set('port', process.env.PORT || packageJSON.settings.port);
app.use(express.static(join(__dirname, 'build')));
app.use(logfmt.requestLogger());

function startApp() {
  app.listen(app.get('port'), function () {
    console.log('Listening on ' + app.get('port'));
  });
}

startApp();
