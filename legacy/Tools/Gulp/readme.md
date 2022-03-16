Build Babylon.js with Gulp
====================

Build Babylon.js with [gulp](http://gulpjs.com/ "gulp") and npm ([nodejs](http://nodejs.org/ "nodejs")), easy and cross-platform

**Paths in this file are relative to this file location, currently [Tools/Gulp](https://github.com/BabylonJS/Babylon.js/tree/master/Tools/Gulp).**

# How to use it

### First install gulp :
```
npm install -g gulp@4.0.0
```

### Install some dependencies :
```
npm install
```

### Update dependencies if necessary :
```
npm update
```

## Build all the distributed files and tests (release build):

```
npm run build
```
Will generate all the files of the dist/preview release folder.

## Build all the distributed files without tests (release build):

```
gulp typescript-libraries
```
Will generate all the files of the dist/preview release folder.

## Run all the tests (release build):

```
gulp tests-all
```

## Run Integrated Web Server and watch for changes (dev build):
```
npm start
```

you can now freely test in the following URLs:
- [Playground](http://localhost:1338/Playground/index-local.html)
- [Materials Library](http://localhost:1338/materialsLibrary/index.html)
- [Postprocess Library](http://localhost:1338/postProcessLibrary/index.html)
- [Procedural Textures Library](http://localhost:1338/proceduralTexturesLibrary/index.html)
- [Local Dev Samples](http://localhost:1338/localDev/index.html)
