Build Babylon.manager.js with Gulp
====================

Build Babylon.manager.js with [gulp](http://gulpjs.com/ "gulp") and npm ([nodejs](http://nodejs.org/ "nodejs")), easy and cross-platform

(Paths in this file are relative to this file location.)

# How to use it

From the /Tools/Gulp folder:

### First install gulp :
```
npm install -g gulp
```

### Install some dependencies :
```
npm install
```

### Update dependencies if necessary :
```
npm update
```

## From the javascript source
### Build Babylon.manager.js:

```
gulp SceneManager
```
Will be generated in dist/preview release/scenemanager:
- babylon.manager.min.js
- babylon.manager.js (unminified)
- babylon.manager.d.ts

### Build the changed files for debug when you save a typescript or shader file:
```
gulp watch
```

### Watch and run a web server for debug purpose:
```
gulp run
```

