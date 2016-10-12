Build Babylon.canvas2d.js with Gulp
====================

More info about [Canvas2D](http://doc.babylonjs.com/overviews/Canvas2D_Home)

Build Babylon.canvas2d.js with [gulp](http://gulpjs.com/ "gulp") and npm ([nodejs](http://nodejs.org/ "nodejs")), easy and cross-platform

(Paths in this file are relative to this file location.)

# How to use it

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
### Build Babylon.canvas2d.js from the javascript files:

```
gulp
```
Will be generated :
- babylon.canvas2d.js
- babylon.canvas2d.max.js (unminified)

### Build Babylon.canvas2d.js when you save a javascript file:
```
gulp watch
```

## From the typescript source
### Build Babylon.canvas2d.js from the typescript files:

```
gulp typescript
```
Will be generated :
- babylon.canvas2d.js
- babylon.canvas2d.d.ts
- babylon.canvas2d.max.js (unminified)

Be aware that all js files content will be overwrite.

### Build Babylon.canvas2d.js when you save a typescript file:
```
gulp watch-typescript
```

### Compile all the typscript files to their javascript respective files including declaration file
```
gulp typescript-compile
```

Be aware that all js files content will be overwritten.
