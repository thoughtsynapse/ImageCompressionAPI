// Using Strict JavaScript for security
'use strict';

// Module dependencies
const http = require('http');
const formidable = require('formidable');
const fs = require('fs');
const uuid = require('uuid');
const findRemoveSync = require('find-remove');

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
http.createServer((req, res) => {
  if (req.url == '/api') {
    let form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {

      // Creating Unique Input/Output sub-folders
      let uniqueUUID = uuid.v1();
      fs.mkdir(inFolder + uniqueUUID, { recursive: false }, (err) => { if (err) throw err; });
      fs.mkdir(outFolder + uniqueUUID, { recursive: false }, (err) => { if (err) throw err; });

      // Getting form data
      if (typeof tempImg !== 'undefined') { var tempImg = files.inImg.path; }
      if (typeof imgName !== 'undefined') { var imgName = files.inImg.name; }
      if (typeof stripMeta !== 'undefined') { var stripMeta = fields.stripMeta; }
      if (typeof isLossy !== 'undefined') { var isLossy = fields.isLossy; }

      // Input/Output Image Name with Permanent Location
      let inImgPath = inFolder + uniqueUUID + '/' + imgName;
      let outImgPath = outFolder + uniqueUUID + '/' + imgName;
      let outImgDir = outFolder + uniqueUUID; // Output image folder path for JPEGOptim as it doesn't accept full image path.

      // Getting Input Image Extension
      let imgExt = imgName.split('.').pop().toUpperCase();

      // Input/Output Image Public HTTP URL
      let inImgURL = baseInputURL + uniqueUUID + '/' + imgName;
      let outImgURL = baseOutputURL + uniqueUUID + '/' + imgName;

      // Moving file from temporary to input folder, on success one of the compression function will be called!
      fs.rename(tempImg, inImgPath, (err) => {
        if (err) throw err;
        else if (imgExt === 'JPG' || imgExt === 'JPEG') { compressJPG(isLossy, stripMeta, inImgPath, outImgPath, outImgDir, res, imgExt, inImgURL, outImgURL); }
        else if (imgExt === 'PNG') { compressPNG(isLossy, stripMeta, inImgPath, outImgPath, res, imgExt, inImgURL, outImgURL); }
        else if (imgExt === 'GIF') { compressGIF(isLossy, stripMeta, inImgPath, outImgPath, res, imgExt, inImgURL, outImgURL); }
        else if (imgExt === 'SVG') { compressSVG(isLossy, stripMeta, inImgPath, outImgPath, res, imgExt, inImgURL, outImgURL); }
        else { res.end(); }
      });
    });
  }
}).listen(3000, 'localhost', () => {
  console.log(`Server running at http://localhost:3000/`);
});


// Compresses JPEG image with JPEGOptim
function compressJPG(isLossy, stripMeta, inImgPath, outImgPath, outImgDir, response, imgExt, inImgURL, outImgURL) {

  const { spawn } = require('child_process');
  const JPEGLossless = spawn('jpegoptim', [inImgPath, '--dest=' + outImgDir]);
  const JPEGsLossless = spawn('jpegoptim', ['--strip-all', inImgPath, '--dest=' + outImgDir]);
  const JPEGLossy = spawn('jpegoptim', ['-m85', inImgPath, '--dest=' + outImgDir]);
  const JPEGsLossy = spawn('jpegoptim', ['-m85', '--strip-all', inImgPath, '--dest=' + outImgDir]);

  let comPromiseOne = new Promise(function (successCallback, failureCallback) {
    if (isLossy === 'false' && stripMeta === 'false') { const comImg = JPEGLossless; successCallback(comImg); }
    else if (isLossy === 'false' && stripMeta === 'true') { const comImg = JPEGsLossless; successCallback(comImg); }
    else if (isLossy === 'true' && stripMeta === 'false') { const comImg = JPEGLossy; successCallback(comImg); }
    else if (isLossy === 'true' && stripMeta === 'true') { const comImg = JPEGsLossy; successCallback(comImg); }
    else { failureCallback('Wrong Form Data'); }
  });
  comPromiseOne.then(
    function (comImg) { comImg.stdout.on('end', () => { sendResponse(isLossy, stripMeta, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL); }); },
    function (error) { console.log(error); response.end(); }
  );
}

// Compresses PNG image with PNGQuant and OptiPNG
function compressPNG(isLossy, stripMeta, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL) {

  const { spawn } = require('child_process');
  const PNGLossless = spawn('optipng', ['-o2', inImgPath, '-out', outImgPath]);
  const PNGsLossless = spawn('optipng', ['-o2', inImgPath, '-strip all', '-out', outImgPath]);
  const PNGLossy = spawn('pngquant', ['--skip-if-larger', '--speed=1', '--quality=65-85', inImgPath, '--out', outImgPath]);
  const PNGsLossy = spawn('pngquant', ['--skip-if-larger', '--speed=1', '--strip', '--quality=65-85', inImgPath, '--out', outImgPath]);

  let comPromiseTwo = new Promise(function (successCallback, failureCallback) {
    if (isLossy === 'false' && stripMeta === 'false') { const comImg = PNGLossless; successCallback(comImg); }
    else if (isLossy === 'false' && stripMeta === 'true') { const comImg = PNGsLossless; successCallback(comImg); }
    else if (isLossy === 'true' && stripMeta === 'false') { const comImg = PNGLossy; successCallback(comImg); }
    else if (isLossy === 'true' && stripMeta === 'true') { const comImg = PNGsLossy; successCallback(comImg); }
    else { failureCallback('Wrong Form Data'); }
  });
  comPromiseTwo.then(
    function (comImg) { comImg.stdout.on('end', () => { sendResponse(isLossy, stripMeta, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL); }); },
    function (error) { console.log(error); response.end(); }
  );
}

// Compresses GIF image with GIFSicle
function compressGIF(isLossy, stripMeta, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL) {

  const { spawn } = require('child_process');
  const GIFLossless = spawn('gifsicle', ['-O3', inImgPath, '-o', outImgPath]);
  const GIFsLossless = spawn('gifsicle', ['-O3', inImgPath, '-o', outImgPath]);
  const GIFLossy = spawn('gifsicle', ['-O3', '--lossy=85', inImgPath, '-o', outImgPath]);
  const GIFsLossy = spawn('gifsicle', ['-O3', '--lossy=85', inImgPath, '-o', outImgPath]);

  let comPromiseThree = new Promise(function (successCallback, failureCallback) {
    if (isLossy === 'false' && stripMeta === 'false') { const comImg = GIFLossless; successCallback(comImg); }
    else if (isLossy === 'false' && stripMeta === 'true') { const comImg = GIFsLossless; successCallback(comImg); }
    else if (isLossy === 'true' && stripMeta === 'false') { const comImg = GIFLossy; successCallback(comImg); }
    else if (isLossy === 'true' && stripMeta === 'true') { const comImg = GIFsLossy; successCallback(comImg); }
    else { failureCallback('Wrong Form Data'); }
  });
  comPromiseThree.then(
    function (comImg) { comImg.stdout.on('end', () => { sendResponse(isLossy, stripMeta, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL); }); },
    function (error) { console.log(error); response.end(); }
  );
}

// Compresses SVG image with Scour
function compressSVG(isLossy, stripMeta, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL) {

  const { spawn } = require('child_process');
  const SVGLossless = spawn('scour', ['-i', inImgPath, '--no-line-breaks', '--enable-viewboxing', '--set-precision=10', '-o', outImgPath]);
  const SVGsLossless = spawn('scour', ['-i', inImgPath, '--remove-descriptive-elements', '--enable-comment-stripping', '--no-line-breaks', '--enable-viewboxing', '--set-precision=10', '-o', outImgPath]);
  const SVGLossy = spawn('scour', ['-i', inImgPath, '--no-line-breaks', '--enable-viewboxing', '-o', outImgPath]);
  const SVGsLossy = spawn('scour', ['-i', inImgPath, '--remove-descriptive-elements', '--enable-comment-stripping', '--no-line-breaks', '--enable-viewboxing', '-o', outImgPath]);

  let comPromiseFour = new Promise(function (successCallback, failureCallback) {
    if (isLossy === 'false' && stripMeta === 'false') { const comImg = SVGLossless; successCallback(comImg); }
    else if (isLossy === 'false' && stripMeta === 'true') { const comImg = SVGsLossless; successCallback(comImg); }
    else if (isLossy === 'true' && stripMeta === 'false') { const comImg = SVGLossy; successCallback(comImg); }
    else if (isLossy === 'true' && stripMeta === 'true') { const comImg = SVGsLossy; successCallback(comImg); }
    else { failureCallback('Wrong Form Data'); }
  });
  comPromiseFour.then(
    function (comImg) { comImg.stdout.on('end', () => { sendResponse(isLossy, stripMeta, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL); }); },
    function (error) { console.log(error); response.end(); }
  );
}

// Send Response in JSON
function sendResponse(isLossy, stripMeta, inImgPath, outImgPath, response, imgExt, inImgURL, outImgURL) {
  let sizeBefore = Math.round(getFilesize(inImgPath))
  let sizeAfter = Math.round(getFilesize(outImgPath));
  let spaceSaved = sizeBefore - sizeAfter;
  let percentOptimised = Math.round((spaceSaved/sizeBefore) * 10000)/100;
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