Build Babylon.js with Gulp
====================

Build Babylon.js with [gulp](http://gulpjs.com/ "gulp") and npm ([nodejs](http://nodejs.org/ "nodejs")), easy and cross-platform

(Paths in this file are relative to this file location.)

## How to use it

### First install gulp :

```
npm install -g gulp
```

### Install some dependencies :

```
npm install
```
### Update gulpfile if you want to add files:
```
return gulp.src([
      '../../Babylon/Math/babylon.math.js',
      '../../Babylon/Math/babylon.axis.js',
      
      ....
```

### Build Babylon.js :

```
gulp
```
Will be generated :
- build/babylon.js
- build/babylon.min.js

### Build Babylon.js when you save a file:
```
gulp watch
```

