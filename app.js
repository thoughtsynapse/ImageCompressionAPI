'use strict';
var http = require('http');
var formidable = require('formidable');
var fs = require('fs');


// Send a POST request through Postman with input type 'File' and key 'imageComp'
http.createServer(function (req, res) {
  if (req.url == '/api') {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      var oldpath = files.imageComp.path;
      var newpath = '/var/www/sixsilicon.com/uploads/' + files.imageComp.name;
      var outPath = '/var/www/sixsilicon.com/uploads/_' + files.imageComp.name;
      fs.rename(oldpath, newpath, function (err) {
        if (err) throw err;
        
        if (files.imageComp.name.split('.').pop() === 'JPG' || files.imageComp.name.split('.').pop() === 'JPEG' || files.imageComp.name.split('.').pop() === 'jpg' || files.imageComp.name.split('.').pop() === 'jpeg') {
            res.write('JPG File');
            const { spawn } = require( 'child_process' );
            const comImage = spawn( 'jpegoptim', ['-m85', '--strip-all', '--overwrite', newpath]);
        }
        
        else  if (files.imageComp.name.split('.').pop() === 'PNG' || files.imageComp.name.split('.').pop() === 'png') {
            res.write('PNG File');
            const { spawn } = require( 'child_process' );
            const comImage = spawn( 'pngquant', ['--force', '--skip-if-larger', '--speed=1', '--strip', '--quality=65-80', newpath]);

        }
        
        else  if (files.imageComp.name.split('.').pop() === 'GIF' || files.imageComp.name.split('.').pop() === 'gif') {
            res.write('GIF File');
            const { spawn } = require( 'child_process' );
            const comImage = spawn( 'gifsicle', ['-O3', newpath]);
        }
        
        else if (files.imageComp.name.split('.').pop() === 'SVG' || files.imageComp.name.split('.').pop() === 'svg') {
            res.write('SVG File');
            const { spawn } = require( 'child_process' );
            const comImage = spawn( 'scour', ['-i', newpath, '-o', outPath, '--enable-id-stripping', '--enable-comment-stripping', '--shorten-ids', '--indent=none']);
        }
        
        else {
          res.write('Something Else');
        }
        res.end();
      });
 });
  }
}).listen(3000);
