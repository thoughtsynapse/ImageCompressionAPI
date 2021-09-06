// Using Strict JavaScript for security
'use strict';

// Module dependencies
const express = require('express')
const app = express()
const formidable = require('formidable');
const fs = require('fs');
const uuid = require('uuid');
const findRemoveSync = require('find-remove');
const sanitizer = require('sanitizer');

// Variables
const inFolder = '/var/www/sixsilicon.com/api/input/';
const outFolder = '/var/www/sixsilicon.com/api/output/';
const baseInputURL = 'https://sixsilicon.com/in/';
const baseOutputURL = 'https://sixsilicon.com/out/';

// Deleting images older than one hour from in and out folder
setInterval(() => {
  findRemoveSync(inFolder, { age: { seconds: 3600 }, dir: '*', ignore: 'index.html' });
  findRemoveSync(outFolder, { age: { seconds: 3600 }, dir: '*', ignore: 'index.html' });
}, 3600000);

// Creating Server, Send a POST request to https://sixsilicon.com/api through Postman with an image file and key 'inImg'
app.post('/api', (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

      // Creating Unique Input/Output sub-folders
      let uniqueUUID = uuid.v1();
      fs.mkdir(inFolder + uniqueUUID, { recursive: false }, (err) => { if (err) throw err; });
      fs.mkdir(outFolder + uniqueUUID, { recursive: false }, (err) => { if (err) throw err; });

      // Checking form data
      let tempImg = (typeof files.inImg.path !== 'undefined' ? sanitizer.value(files.inImg.path, 'string') : imageNotProvided(res));
      let imgName = (typeof files.inImg.name !== 'undefined' ? sanitizer.value(files.inImg.name, 'string') : imageNotProvided(res));
      let stripMetaTemp = (typeof fields.stripMeta !== 'undefined' ? sanitizer.value(fields.stripMeta, 'string') : 'true');
      let isLossyTemp = (typeof fields.isLossy !== 'undefined' ? sanitizer.value(fields.isLossy, 'string') : 'true');
      let imgQualityTemp = (typeof fields.imgQuality !== 'undefined' ? sanitizer.value(fields.imgQuality.toString(), 'string') : 'default');

      // Getting Input Image Extension
      let imgExt = imgName.split('.').pop().toUpperCase();
      let imgQualityJPG = (imgExt === 'JPG' || imgExt === 'JPEG' && inRange(parseInt(imgQualityTemp), 1, 100) ? imgQualityTemp : 'default');
      let imgQualityPNG = (imgExt === 'PNG' && inRange(parseInt(imgQualityTemp), 1, 100) ? imgQualityTemp : 'default');
      let imgQualityGIF = (imgExt === 'GIF' && inRange(parseInt(imgQualityTemp), 1, 100) ? imgQualityTemp : 'default');
      let imgQualitySVG = (imgExt === 'SVG' && inRange(parseInt(imgQualityTemp), 1, 10) ? imgQualityTemp : 'default');

      // If stripMeta and isLossy are not true then make them false, since they would have been booleam if JS didn't converted them into strings. 
      let stripMeta = (stripMetaTemp === 'true' ? 'true' : 'false');
      let isLossy = (isLossyTemp === 'true' ? 'true' : 'false');

      // Input/Output Image Name with Permanent Location
      let inImgPath = inFolder + uniqueUUID + '/' + imgName;
      let outImgPath = outFolder + uniqueUUID + '/' + imgName;
      let outImgDir = outFolder + uniqueUUID; // Output image folder path for JPEGOptim as it doesn't accept full image path.

      // Input/Output Image Public HTTP URL
      let inImgURL = baseInputURL + uniqueUUID + '/' + imgName;
      let outImgURL = baseOutputURL + uniqueUUID + '/' + imgName;

      // Moving file from temporary to input folder, on success one of the compression function will be called!
      fs.rename(tempImg, inImgPath, (err) => {
        if (err) throw err;
        else if (imgExt === 'JPG' || imgExt === 'JPEG') { compressJPG(isLossy, stripMeta, imgQualityJPG, inImgPath, outImgPath, outImgDir, res, imgExt, inImgURL, outImgURL); }
        else if (imgExt === 'PNG') { compressPNG(isLossy, stripMeta, imgQualityPNG, inImgPath, outImgPath, res, imgExt, inImgURL, outImgURL); }
        else if (imgExt === 'GIF') { compressGIF(isLossy, stripMeta, imgQualityGIF, inImgPath, outImgPath, res, imgExt, inImgURL, outImgURL); }
        else if (imgExt === 'SVG') { compressSVG(isLossy, stripMeta, imgQualitySVG, inImgPath, outImgPath, res, imgExt, inImgURL, outImgURL); }
        else {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ Error: 'Image not JPG, PNG, SVG or GIF' }));
        }
      });

    });
});
app.listen(3000, () => {
  console.log(`API Server listening at http://localhost:3000`)
})


// Compresses JPEG image with JPEGOptim
function compressJPG(isLossy, stripMeta, imgQuality, inImgPath, outImgPath, outImgDir, response, imgExt, inImgURL, outImgURL) {

  const { spawn } = require('child_process');
  let comPromiseOne = new Promise(function (successCallback, failureCallback) {

    if (isLossy === 'false' && stripMeta === 'false') {
      const comImg = spawn('jpegoptim', [inImgPath, '--dest=' + outImgDir]);
      successCallback(comImg);
    }
    else if (isLossy === 'false' && stripMeta === 'true') {
      const comImg = spawn('jpegoptim', ['--strip-all', inImgPath, '--dest=' + outImgDir]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'false' && imgQuality === 'default') {
      const comImg = spawn('jpegoptim', ['-m85', inImgPath, '--dest=' + outImgDir]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'false' && imgQuality !== 'default') {
      const comImg = spawn('jpegoptim', ['-m' + imgQuality, inImgPath, '--dest=' + outImgDir]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'true' && imgQuality === 'default') {
      const comImg = spawn('jpegoptim', ['-m85', '--strip-all', inImgPath, '--dest=' + outImgDir]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'true' && imgQuality !== 'default') {
      const comImg = spawn('jpegoptim', ['-m' + imgQuality, '--strip-all', inImgPath, '--dest=' + outImgDir]);
      successCallback(comImg);
    }
    else { failureCallback(); }

  });
  comPromiseOne.then(
    function (comImg) { comImg.stdout.on('end', () => { sendResponse(isLossy, stripMeta, imgQuality, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL); }); },
    function () {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ Error: 'Something Went Wrong' }));
    }
  );
}

// Compresses PNG image with PNGQuant and OptiPNG
function compressPNG(isLossy, stripMeta, imgQuality, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL) {

  const { spawn } = require('child_process');
  let comPromiseTwo = new Promise(function (successCallback, failureCallback) {

    if (isLossy === 'false' && stripMeta === 'false') {
      const comImg = spawn('optipng', ['-o2', inImgPath, '-out', outImgPath]);
      successCallback(comImg);
    }
    else if (isLossy === 'false' && stripMeta === 'true') {
      const comImg = spawn('optipng', ['-o2', inImgPath, '-strip all', '-out', outImgPath]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'false' && imgQuality === 'default') {
      const comImg = spawn('pngquant', ['--skip-if-larger', '--speed=1', '--quality=65-85', inImgPath, '--out', outImgPath]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'false' && imgQuality !== 'default') {
      const comImg = spawn('pngquant', ['--skip-if-larger', '--speed=1', '--quality=' + imgQuality, inImgPath, '--out', outImgPath]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'true' && imgQuality === 'default') {
      const comImg = spawn('pngquant', ['--skip-if-larger', '--speed=1', '--strip', '--quality=65-85', inImgPath, '--out', outImgPath]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'true' && imgQuality !== 'default') {
      const comImg = spawn('pngquant', ['--skip-if-larger', '--speed=1', '--strip', '--quality=' + imgQuality, inImgPath, '--out', outImgPath]);
      successCallback(comImg);
    }
    else { failureCallback(); }

  });
  comPromiseTwo.then(
    function (comImg) { comImg.stdout.on('end', () => { sendResponse(isLossy, stripMeta, imgQuality, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL); }); },
    function () {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ Error: 'Something Went Wrong' }));
    }
  );
}

// Compresses GIF image with GIFSicle
function compressGIF(isLossy, stripMeta, imgQuality, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL) {

  const { spawn } = require('child_process');
  let comPromiseThree = new Promise(function (successCallback, failureCallback) {

    if (isLossy === 'false' && stripMeta === 'false') {
      const comImg = spawn('gifsicle', ['-O3', inImgPath, '-o', outImgPath]);
      successCallback(comImg);
    }
    else if (isLossy === 'false' && stripMeta === 'true') {
      const comImg = spawn('gifsicle', ['-O3', inImgPath, '-o', outImgPath]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'false' && imgQuality === 'default') {
      const comImg = spawn('gifsicle', ['-O3', '--lossy=85', inImgPath, '-o', outImgPath]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'false' && imgQuality !== 'default') {
      const comImg = spawn('gifsicle', ['-O3', '--lossy=' + imgQuality, inImgPath, '-o', outImgPath]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'true' && imgQuality === 'default') {
      const comImg = spawn('gifsicle', ['-O3', '--lossy=85', inImgPath, '-o', outImgPath]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'true' && imgQuality !== 'default') {
      const comImg = spawn('gifsicle', ['-O3', '--lossy=' + imgQuality, inImgPath, '-o', outImgPath]);
      successCallback(comImg);
    }
    else { failureCallback(); }

  });
  comPromiseThree.then(
    function (comImg) { comImg.stdout.on('end', () => { sendResponse(isLossy, stripMeta, imgQuality, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL); }); },
    function () {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ Error: 'Something Went Wrong' }));
    }
  );
}

// Compresses SVG image with Scour
function compressSVG(isLossy, stripMeta, imgQuality, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL) {

  const { spawn } = require('child_process');
  let comPromiseFour = new Promise(function (successCallback) {

    if (isLossy === 'false' && stripMeta === 'false') {
      const comImg = spawn('scour', ['-i', inImgPath, '--no-line-breaks', '--enable-viewboxing', '--set-precision=10', '-o', outImgPath]);
      successCallback(comImg);
    }
    else if (isLossy === 'false' && stripMeta === 'true') {
      const comImg = spawn('scour', ['-i', inImgPath, '--remove-descriptive-elements', '--enable-comment-stripping', '--no-line-breaks', '--enable-viewboxing', '--set-precision=10', '-o', outImgPath]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'false' && imgQuality === 'default') {
      const comImg = spawn('scour', ['-i', inImgPath, '--no-line-breaks', '--enable-viewboxing', '--set-precision=5', '-o', outImgPath]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'false' && imgQuality !== 'default') {
      const comImg = spawn('scour', ['-i', inImgPath, '--no-line-breaks', '--enable-viewboxing', '--set-precision=' + imgQuality, '-o', outImgPath]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'true' && imgQuality === 'default') {
      const comImg = spawn('scour', ['-i', inImgPath, '--remove-descriptive-elements', '--enable-comment-stripping', '--no-line-breaks', '--enable-viewboxing', '--set-precision=5', '-o', outImgPath]);
      successCallback(comImg);
    }
    else if (isLossy === 'true' && stripMeta === 'true' && imgQuality !== 'default') {
      const comImg = spawn('scour', ['-i', inImgPath, '--remove-descriptive-elements', '--enable-comment-stripping', '--no-line-breaks', '--enable-viewboxing', '--set-precision=' + imgQuality, '-o', outImgPath]);
      successCallback(comImg);
    }
    else { failureCallback(); }

  });
  comPromiseFour.then(
    function (comImg) { comImg.stdout.on('end', () => { sendResponse(isLossy, stripMeta, imgQuality, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL); }); },
    function () {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ Error: 'Something Went Wrong' }));
    }
  );
}

// Send Response in JSON
function sendResponse(isLossy, stripMeta, imgQuality, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL) {
  let sizeBefore = Math.round(getFilesize(inImgPath))
  let sizeAfter = Math.round(getFilesize(outImgPath));
  let spaceSaved = sizeBefore - sizeAfter;
  let percentOptimised = Math.round((spaceSaved / sizeBefore) * 10000) / 100;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify({
    imageType: imgExt,
    isLossy: isLossy,
    stripMeta: stripMeta,
    sizeBefore: sizeBefore + ' KB',
    sizeAfter: sizeAfter + ' KB',
    spaceSaved: spaceSaved + ' KB',
    percentOptimised: percentOptimised + ' %',
    inImgURL: inImgURL,
    outImgURL: outImgURL
  }));
}

// Get Filesize
function getFilesize(inPath) {
  let stats = fs.statSync(inPath);
  let sizeInKB = stats.size / 1024;
  return sizeInKB;
}

// Return true if in range, otherwise false
function inRange(x, min, max) {
  return ((x - min) * (x - max) <= 0);
}

// Error Response
function imageNotProvided(response) {
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify({ Error: 'Image not Provided' }));
}

// Error Response
function fileNotImage(response) {
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify({ Error: 'File not JPG, PNG, SVG or GIF' }));
}