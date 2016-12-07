Build Babylon.canvas2d.js with Gulp
====================

More info about [Canvas2D](http://doc.babylonjs.com/overviews/Canvas2D_Home)

Build Babylon.canvas2d.js with [gulp](http://gulpjs.com/ "gulp") and npm ([nodejs](http://nodejs.org/ "nodejs")), easy and cross-platform

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
### Build Babylon.canvas2d.js:

```
gulp Canvas2D
```
Will be generated in dist/preview release/canvas2D:
- babylon.canvas2d.min.js
- babylon.canvas2d.js (unminified)
- babylon.canvas2d.d.ts

### Build the changed files for debug when you save a typescript or shader file:
```
gulp watch
```

### Watch and run a web server for debug purpose:
```
gulp run
```

