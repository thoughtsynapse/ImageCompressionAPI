'use strict';
var http = require('http');
var formidable = require('formidable');
var fs = require('fs');
var uuid = require('uuid');
const { randomUUID } = require('crypto');


// Send a POST request through Postman with input type 'File' and key 'imgComp '
http.createServer(function (req, res) {
  if (req.url == '/api') {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

      res.setHeader('Content-Type', 'application/json');
      var tempPath = files.imgComp.path;
      var imgName = files.imgComp.name;

      var uniqueUUID = uuid.v1();
      var tempIn = fs.mkdir('/var/www/sixsilicon.com/input/' + uniqueUUID, { recursive: false }, (err) => { if (err) throw err; });
      var tempOut = fs.mkdir('/var/www/sixsilicon.com/output/' + uniqueUUID, { recursive: false }, (err) => { if (err) throw err; });

      var inPath = '/var/www/sixsilicon.com/input/' + uniqueUUID + '/' + imgName;
      var outPath = '/var/www/sixsilicon.com/output/' + uniqueUUID + '/' + imgName;
      var imgExt = imgName.split('.').pop().toLowerCase();
      var imgURL = 'http://sixsilicon.com/output/' + uniqueUUID + '/' + imgName;

      fs.rename(tempPath, inPath, function (err) {

        if (err) throw err;
        else if (imgExt === 'jpg' || imgExt === 'jpeg') { compressJPG(inPath, outPath, res, imgExt, imgURL); }
        else if (imgExt === 'png') { compressPNG(inPath, outPath, res, imgExt, imgURL); }
        else if (imgExt === 'gif') { compressGIF(inPath, outPath, res, imgExt, imgURL); }
        else if (imgExt === 'svg') { compressSVG(inPath, outPath, res, imgExt, imgURL); }
        else { res.end(); }

      });
    });
  }
}).listen(3000, 'localhost', () => {
  console.log(`Server running at http://localhost:3000/`);
});

function compressJPG(inputPath, outputPath, response, imageExt, imageURL) {
  const { spawn } = require('child_process');
  const comImage = spawn('jpegoptim', ['-m85', '--strip-all', inputPath, '--dest=' + outputPath]);
  comImage.stdout.on('data', (data) => {
    var inputSizeRounded = Math.round(getFilesize(inputPath)) + ' KB';
    var outputSizeRounded = Math.round(getFilesize(outputPath)) + ' KB';
    response.end(JSON.stringify({ imgType: imageExt.toUpperCase(), sizeBefore: inputSizeRounded, sizeAfter: outputSizeRounded, imgURL: imageURL }));
  });
}

function compressPNG(inputPath, outputPath, response, imageExt, imageURL) {
  const { spawn } = require('child_process');
  const comImage = spawn('pngquant', ['--force', '--skip-if-larger', '--speed=1', '--strip', '--quality=65-85', inputPath, '--output', outputPath]);
  comImage.stdout.on('data', (data) => {
    var inputSizeRounded = Math.round(getFilesize(inputPath)) + ' KB';
    var outputSizeRounded = Math.round(getFilesize(outputPath)) + ' KB';
    response.end(JSON.stringify({ imgType: imageExt.toUpperCase(), sizeBefore: inputSizeRounded, sizeAfter: outputSizeRounded, imgURL: imageURL }));
  });
}

function compressGIF(inputPath, outputPath, response, imageExt, imageURL) {
  const { spawn } = require('child_process');
  const comImage = spawn('gifsicle', ['-O3', '--lossy=85', inputPath, '-o', outputPath]);
  comImage.stdout.on('data', (data) => {
    var inputSizeRounded = Math.round(getFilesize(inputPath)) + ' KB';
    var outputSizeRounded = Math.round(getFilesize(outputPath)) + ' KB';
    response.end(JSON.stringify({ imgType: imageExt.toUpperCase(), sizeBefore: inputSizeRounded, sizeAfter: outputSizeRounded, imgURL: imageURL }));
  });
}

function compressSVG(inputPath, outputPath, response, imageExt, imageURL) {
  const { spawn } = require('child_process');
  const comImage = spawn('scour', ['-i', inputPath, '--enable-id-stripping', '--enable-comment-stripping', '--shorten-ids', '--indent=none', '-o', outputPath]);
  comImage.stdout.on('data', (data) => {
    var inputSizeRounded = Math.round(getFilesize(inputPath)) + ' KB';
    var outputSizeRounded = Math.round(getFilesize(outputPath)) + ' KB';
    response.end(JSON.stringify({ imgType: imageExt.toUpperCase(), sizeBefore: inputSizeRounded, sizeAfter: outputSizeRounded, imgURL: imageURL }));
  });
}

function getFilesize(inputPath) {
  var stats = fs.statSync(inputPath);
  var sizeInKB = stats.size / 1024;
  return sizeInKB;
}