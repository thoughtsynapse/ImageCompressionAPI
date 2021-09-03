'use strict';
var http = require('http');
var formidable = require('formidable');
var fs = require('fs');


// Send a POST request through Postman with input type 'File' and key 'imageComp'
http.createServer(function (req, res) {
  if (req.url == '/api') {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      
      var oldPath = files.imageComp.path;
      var imgExt = files.imageComp.name.split('.').pop().toLowerCase();
      var newPath = '/var/www/sixsilicon.com/uploads/' + files.imageComp.name;
      var outPath = '/var/www/sixsilicon.com/uploads/_' + files.imageComp.name;
      
      fs.rename(oldPath, newPath, function (err) {
        
        if (err) throw err;
        
        if (imgExt === 'jpg' || imgExt === 'jpeg') {
            res.write('JPG File');
            const { spawn } = require( 'child_process' );
            const comImage = spawn( 'jpegoptim', ['-m85', '--strip-all', '--overwrite', newPath]);
        }
        
        else if (imgExt === 'png') {
            res.write('PNG File');
            const { spawn } = require( 'child_process' );
            const comImage = spawn( 'pngquant', ['--force', '--skip-if-larger', '--speed=1', '--strip', '--quality=65-80', newPath]);

        }
        
        else if (imgExt === 'gif') {
            res.write('GIF File');
            const { spawn } = require( 'child_process' );
            const comImage = spawn( 'gifsicle', ['-O3', '--lossy=85', newPath, '-o', outPath]);
        }
        
        else if (imgExt === 'svg') {
            res.write('SVG File');
            const { spawn } = require( 'child_process' );
            const comImage = spawn( 'scour', ['-i', newPath, '-o', outPath, '--enable-id-stripping', '--enable-comment-stripping', '--shorten-ids', '--indent=none']);
        }
        
        else {
          res.write('Something Else');
        }
        res.end();
      });
 });
  }
}).listen(3000);
