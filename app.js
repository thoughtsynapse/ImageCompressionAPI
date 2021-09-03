'use strict';
let http = require('http');
let formidable = require('formidable');
let fs = require('fs');


// Send a POST request through Postman with input type 'File' and key 'imageComp'
http.createServer(function (req, res) {
  if (req.url == '/api') {
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

      let oldPath = files.imageComp.path;
      let imgExt = files.imageComp.name.split('.').pop().toLowerCase();

      let inPath  = '/var/www/sixsilicon.com/input/' + files.imageComp.name;
      let inSize = getFilesize(inPath);
      let inSizeRounded = Math.round(inSize) + ' KB';

      let outPath = '/var/www/sixsilicon.com/output/' + files.imageComp.name;

      fs.rename(oldPath, inPath , function (err) {

        if (err) throw err;
        res.setHeader('Content-Type', 'application/json');

        if (imgExt === 'jpg' || imgExt === 'jpeg') {
          res.write('JPG File');
          const { spawn } = require('child_process');
          const comImage = spawn('jpegoptim', ['-m85', '--strip-all', inPath , '--dest=' + outPath]);
        }

        else if (imgExt === 'png') {
          res.write('PNG File');
          const { spawn } = require('child_process');
          const comImage = spawn('pngquant', ['--force', '--skip-if-larger', '--speed=1', '--strip', '--quality=65-85', inPath , '--output', outPath]);
        }

        else if (imgExt === 'gif') {
          res.write('GIF File');
          const { spawn } = require('child_process');
          const comImage = spawn('gifsicle', ['-O3', '--lossy=85', inPath , '-o', outPath]);
        }

        else if (imgExt === 'svg') {
          res.write('SVG File');
          const { spawn } = require('child_process');
          const comImage = spawn('scour', ['-i', inPath , '--enable-id-stripping', '--enable-comment-stripping', '--shorten-ids', '--indent=none', '-o', outPath]);
        }

        let outSize = '1.333333'; //getFilesize(inPath);
        let outSizeRounded = Math.round(outSize) + ' KB';

        res.end(JSON.stringify({ imgType: imgExt.toUpperCase(), sizeBefore: inSizeRounded, sizeAfter: outSizeRounded, imgURL: outPath }));


      });
    });
  }
}).listen(3000, 'localhost', () => {
  console.log(`Server running at http://localhost:3000/`);
});


function getFilesize(filename) {
  let stats = fs.statSync(filename);
  let sizeInKB = stats.size / 1024;
  return sizeInKB;
}