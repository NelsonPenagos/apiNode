var fs = require('fs');
var path = require('path');

var base64decoder = function (imageBuffer, options, callback) {
  options = options || {};

  if (options && options.filename) {
    fs.writeFile(path.join(__dirname,'../image/'+options.filename + '.png'), imageBuffer, 'base64', function (err) {
      if (err) { return callback("Error desde base64"+err); }
        var name = options.filename + '.png';
      return callback(null, name);
    });
  }
};

module.exports = {base64decoder: base64decoder};
