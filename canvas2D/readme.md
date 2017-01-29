Canvas2D, a 100% WebGL based 2D Engine
====================

Canvas2D is a separated distributed set of .js/.d.ts files laying on the top of the [babylon.js library](../readme.md)

## Table of Content

- [Releases](#releases)
- [Features list](features.md)
- [How to build it](#how-to-build-babyloncanvas2djs-with-gulp)

## Releases

You want to use an existing build, that's simple, you can grab either the latest official release or the latest build of the current developing version.

- The latest official release can be found [here](https://github.com/BabylonJS/Babylon.js/tree/master/dist)
- The latest preview release (which is the current developing version, stable most of the time) can be found [there](https://github.com/BabylonJS/Babylon.js/tree/master/dist/preview%20release/canvas2D)


## How to build Babylon.canvas2d.js with Gulp

More info about [Canvas2D](http://doc.babylonjs.com/overviews/Canvas2D_Home)

Build Babylon.canvas2d.js with [gulp](http://gulpjs.com/ "gulp") and npm ([nodejs](http://nodejs.org/ "nodejs")), easy and cross-platform

(Paths in this file are relative to this file location.)

### How to use it

From the /Tools/Gulp folder:

#### First install gulp :
```
npm install -g gulp
```

#### Install some dependencies :
```
npm install
```

#### Update dependencies if necessary :
```
npm update
```

### From the javascript source
#### Build Babylon.canvas2d.js:

```
gulp canvas2D
```
Will be generated in dist/preview release/canvas2D:
- babylon.canvas2d.min.js
- babylon.canvas2d.js (unminified)
- babylon.canvas2d.d.ts

#### Build the changed files for debug when you save a typescript or shader file:
```
gulp watch
```

#### Watch and run a web server for debug purpose:
```
gulp run
```

