// Using Strict JavaScript for security
'use strict';

// Module dependencies
let http = require('http');
let formidable = require('formidable');
let fs = require('fs');
let uuid = require('uuid');
let findRemoveSync = require('find-remove');

// Variables
const inputFolder = '/var/www/sixsilicon.com/api/input/';
const outputFolder = '/var/www/sixsilicon.com/api/output/';
const baseInputURL = 'https://sixsilicon.com/api/input/';
const baseOutputURL = 'https://sixsilicon.com/api/output/';

// Deleting files older than one hour from input and output folder
setInterval(() => {
  findRemoveSync(inputFolder, { age: { seconds: 3600 }, dir: '*', ignore: 'index.html' });
  findRemoveSync(outputFolder, { age: { seconds: 3600 }, dir: '*', ignore: 'index.html' });
}, 3600000);

// Creating Server, Send a POST request through Postman with an image and key 'image '
http.createServer((req, res) => {
  if (req.url == '/api') {
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

      // Creating Unique Input/Output sub-folders
      let uniqueUUID = uuid.v1();
      fs.mkdir(outputFolder + uniqueUUID, { recursive: false }, (err) => { if (err) throw err; });
      fs.mkdir(outputFolder + uniqueUUID, { recursive: false }, (err) => { if (err) throw err; });

      // Uploaded Image Name with Temporary Location
      let tempImage = files.image.path;

      // Just Image Name
      let imageName = files.image.name;

      // Input/Output Image Name with Permanent Location
      let inputImage = inputFolder + uniqueUUID + '/' + imageName;
      let outputImage = outputFolder + uniqueUUID + '/' + imageName;

      // Getting Input Image Extension
      let imageExt = imageName.split('.').pop().toLowerCase();

      // Input/Output Image Public HTTP URL
      let inputImageURL = baseInputURL + uniqueUUID + '/' + imageName;
      let outputImageURL = baseOutputURL + uniqueUUID + '/' + imageName;

      // Moving file from temporary to input folder, on success one of the compression function will be called!
      fs.rename(tempImage, inputImage, (err) => {
        if (err) throw err;
        else if (imageExt === 'jpg' || imageExt === 'jpeg') { compressJPG(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL); }
        else if (imageExt === 'png') { compressPNG(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL); }
        else if (imageExt === 'gif') { compressGIF(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL); }
        else if (imageExt === 'svg') { compressSVG(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL); }
        else { res.end(); }
      });
    });
  }
}).listen(3000, 'localhost', () => {
  console.log(`Server running at http://localhost:3000/`);
});


// Compresses JPEG images
function compressJPG(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL) {
  const { spawn } = require('child_process');
  const comImage = spawn('jpegoptim', ['-m85', '--strip-all', inputImage, '--dest=' + outputImage]);
  comImage.stdout.on('end', () => {
    sendResponse(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL);
  });
}

// Compresses PNG images
function compressPNG(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL) {
  const { spawn } = require('child_process');
  const comImage = spawn('pngquant', ['--force', '--skip-if-larger', '--speed=1', '--strip', '--quality=65-85', inputImage, '--output', outputImage]);
  comImage.stdout.on('end', () => {
    sendResponse(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL);
  });
}

// Compresses GIF images
function compressGIF(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL) {
  const { spawn } = require('child_process');
  const comImage = spawn('gifsicle', ['-O3', '--lossy=85', inputImage, '-o', outputImage]);
  comImage.stdout.on('end', () => {
    sendResponse(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL);
  });
}

// Compresses SVG images
function compressSVG(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL) {
  const { spawn } = require('child_process');
  const comImage = spawn('scour', ['-i', inputImage, '--enable-id-stripping', '--enable-comment-stripping', '--shorten-ids', '--indent=none', '-o', outputImage]);
  comImage.stdout.on('end', () => {
    sendResponse(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL);
  });
}

// Send Response in JSON
function sendResponse(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL) {
  let sizeBefore = Math.round(getFilesize(inputImage)) + ' KB';
  let sizeAfter = Math.round(getFilesize(outputImage)) + ' KB';
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ imageType: imageExt, sizeBefore: sizeBefore, sizeAfter: sizeAfter, inputImageURL: inputImageURL, inputImageURL: inputImageURL }));
}

// Get Filesize
function getFilesize(inputPath) {
  let stats = fs.statSync(inputPath);
  let sizeInKB = stats.size / 1024;
  return sizeInKB;
}
