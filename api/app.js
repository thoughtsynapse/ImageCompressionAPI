// Using Strict JavaScript for security
'use strict';

// Module dependencies
const http = require('http');
const formidable = require('formidable');
const fs = require('fs');
const uuid = require('uuid');
const findRemoveSync = require('find-remove');

// Variables
const inputFolder = '/var/www/sixsilicon.com/api/input/';
const outputFolder = '/var/www/sixsilicon.com/api/output/';
const baseInputURL = 'https://sixsilicon.com/input/';
const baseOutputURL = 'https://sixsilicon.com/output/';

// Deleting files older than one hour from input and output folder
setInterval(() => {
  findRemoveSync(inputFolder, { age: { seconds: 3600 }, dir: '*', ignore: 'index.html' });
  findRemoveSync(outputFolder, { age: { seconds: 3600 }, dir: '*', ignore: 'index.html' });
}, 3600000);

// Creating Server, Send a POST request to https://sixsilicon.com/api through Postman with an image file and key 'image'
http.createServer((req, res) => {
  if (req.url == '/api') {
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

      // Creating Unique Input/Output sub-folders
      let uniqueUUID = uuid.v1();
      fs.mkdir(inputFolder + uniqueUUID, { recursive: false }, (err) => { if (err) throw err; });
      fs.mkdir(outputFolder + uniqueUUID, { recursive: false }, (err) => { if (err) throw err; });

      // Uploaded Image Name with Temporary Location
      let tempImage = files.image.path;

      // Just Image Name
      let imageName = files.image.name;

      // Input/Output Image Name with Permanent Location
      let inputImage = inputFolder + uniqueUUID + '/' + imageName;
      let outputImage = outputFolder + uniqueUUID + '/' + imageName;
      let outputPath = outputFolder + uniqueUUID;

      // Getting Input Image Extension
      let imageExt = imageName.split('.').pop().toUpperCase();

      // Input/Output Image Public HTTP URL
      let inputImageURL = baseInputURL + uniqueUUID + '/' + imageName;
      let outputImageURL = baseOutputURL + uniqueUUID + '/' + imageName;

      // Moving file from temporary to input folder, on success one of the compression function will be called!
      fs.rename(tempImage, inputImage, (err) => {
        if (err) throw err;
        else if (imageExt === 'JPG' || imageExt === 'JPEG') { compressJPG(inputImage, outputImage, outputPath, res, imageExt, inputImageURL, outputImageURL); }
        else if (imageExt === 'PNG') { compressPNG(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL); }
        else if (imageExt === 'GIF') { compressGIF(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL); }
        else if (imageExt === 'SVG') { compressSVG(inputImage, outputImage, res, imageExt, inputImageURL, outputImageURL); }
        else { res.end(); }
      });
    });
  }
}).listen(3000, 'localhost', () => {
  console.log(`Server running at http://localhost:3000/`);
});


// Compresses JPEG images
function compressJPG(inputImage, outputImage, outputPath, res, imageExt, inputImageURL, outputImageURL) {
  const { spawn } = require('child_process');
  const comImage = spawn('jpegoptim', ['-m85', '--strip-all', inputImage, '--dest=' + outputPath]);
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
  let spaceSaved = sizeBefore - sizeAfter;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ imageType: imageExt, spaceSaved: spaceSaved, sizeBefore: sizeBefore, sizeAfter: sizeAfter, inputImageURL: inputImageURL, outputImageURL: outputImageURL }));
}

// Get Filesize
function getFilesize(inputPath) {
  let stats = fs.statSync(inputPath);
  let sizeInKB = stats.size / 1024;
  return sizeInKB;
}
