'use strict';
var http = require('http');
var formidable = require('formidable');
var fs = require('fs');


// Send a POST request through Postman with input type 'File' and key 'imgComp '
http.createServer(function (req, res) {
  if (req.url == '/api') {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

      res.setHeader('Content-Type', 'application/json');
      var tempPath = files.imgComp .path;
      var imgName = files.imgComp .name;
      var inPath = '/var/www/sixsilicon.com/input/' + imgName;
      var outPath = '/var/www/sixsilicon.com/output/' + imgName;
      var imgExt = imgName.split('.').pop().toLowerCase();
      var imgURL = 'http://sixsilicon.com/output/' + imgName;

      fs.rename(tempPath, inPath, function (err) {

        if (err) throw err;
        else if (imgExt === 'jpg' || imgExt === 'jpeg') { compressJPG(inPath, outPath); }
        else if (imgExt === 'png') { compressPNG(inPath, outPath); }  //...............................
        else if (imgExt === 'gif') { compressGIF(inPath, outPath); }
        else if (imgExt === 'svg') { compressSVG(inPath, outPath); }

        var inSize = getFilesize(inPath);
        var inSizeRounded = Math.round(inSize) + ' KB';
        var outSize = getFilesize(outPath);  // ..................................
        var outSizeRounded = Math.round(outSize) + ' KB';
        res.end(JSON.stringify({ imgType: imgExt.toUpperCase(), sizeBefore: inSizeRounded, sizeAfter: outSizeRounded, imgURL: imgURL }));

      });
    });
  }
}).listen(3000, 'localhost', () => {
  console.log(`Server running at http://localhost:3000/`);
});

function compressJPG(inputPath, outputPath) {
  const { spawn } = require('child_process');
  const comImage = spawn('jpegoptim', ['-m85', '--strip-all', inputPath, '--dest=' + outputPath]);
  comImage.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
}

function compressPNG(inputPath, outputPath) {
  const { spawn } = require('child_process');
  const comImage = spawn('pngquant', ['--force', '--skip-if-larger', '--speed=1', '--strip', '--quality=65-85', inputPath, '--output', outputPath]);
  comImage.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
}

function compressGIF(inputPath, outputPath) {
  const { spawn } = require('child_process');
  const comImage = spawn('gifsicle', ['-O3', '--lossy=85', inputPath, '-o', outputPath]);
  comImage.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });
}

function compressSVG(inputPath, outputPath) {
  const { spawn } = require('child_process');
  const comImage = spawn('scour', ['-i', inputPath, '--enable-id-stripping', '--enable-comment-stripping', '--shorten-ids', '--indent=none', '-o', outputPath]);
  comImage.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  })
}

function getFilesize(inputPath) {
  var stats = fs.statSync(inputPath);
  var sizeInKB = stats.size / 1024;
  return sizeInKB;
}
