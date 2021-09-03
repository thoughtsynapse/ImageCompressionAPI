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
            
            // File is JPEG
            res.write('JPG File');

            // Compressing it
            const { spawn } = require( 'child_process' );
            const comImage = spawn( 'jpegoptim', ['-m85', '--strip-all', '--overwrite', newpath]);

            // Echoing log
            comImage.stdout.on( 'data', ( data ) => {
            console.log( `stdout: ${ data }` );
            });

        }
        else  if (files.imageComp.name.split('.').pop() === 'PNG' || files.imageComp.name.split('.').pop() === 'png') {
            
            // File is PNG
            res.write('PNG File');

            // Compressing it
            const { spawn } = require( 'child_process' );
            const comImage = spawn( 'pngquant', ['--force', '--skip-if-larger', '--speed=1', '--strip', '--quality=65-80', newpath]);

            // Echoing log
            comImage.stdout.on( 'data', ( data ) => {
            console.log( `stdout: ${ data }` );
            });

        }
        else if (files.imageComp.name.split('.').pop() === 'GIF' || files.imageComp.name.split('.').pop() === 'gif') {
            
            // File is GIF
            res.write('GIF File');

            // Compressing it
            const { spawn } = require( 'child_process' );
            const comImage = spawn( 'gifsicle', ['-O3', newpath]);

            // Echoing log
            comImage.stdout.on( 'data', ( data ) => {
            console.log( `stdout: ${ data }` );
            });
            
        }
        else if (files.imageComp.name.split('.').pop() === 'SVG' || files.imageComp.name.split('.').pop() === 'svg') {

            // File is SVG
            res.write('SVG File');
          
            // Compressing it
            const { spawn } = require( 'child_process' );
            const comImage = spawn( 'scour', ['-i', newpath, '-o', outPath, '--enable-id-stripping', '--enable-comment-stripping', '--shorten-ids', '--indent=none']);

            // Echoing log
            comImage.stdout.on( 'data', ( data ) => {
            console.log( `stdout: ${ data }` );
            });

        }
        else {
          res.write('Something Else');
        }
        res.end();
      });
 });
  }
}).listen(3000);
