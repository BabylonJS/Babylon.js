Build Babylon.js with Gulp
====================

Build Babylon.js with [gulp](http://gulpjs.com/ "gulp") and npm ([nodejs](http://nodejs.org/ "nodejs")), easy and cross-platform

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

### Update gulpfile.js (task scripts) if you want to add your own files:
```
/**
 * Concat all js files in order into one big js file and minify it.
 * The list is based on https://github.com/BabylonJS/Babylon.js/wiki/Creating-the-minified-version
 * Do not hesistate to update it if you need to add your own files.
 */
gulp.task('scripts', ['shaders'] ,function() {
return gulp.src([
      '../../Babylon/Math/babylon.math.js',
      '../../Babylon/Math/babylon.axis.js',

      ....
```
## From the javascript source
### Build Babylon.js from the javascript files:

```
gulp
```
Will be generated :
- build/babylon.js
- build/babylon.min.js

### Build Babylon.js when you save a javascript file:
```
gulp watch
```

## From the typescript source
### Build Babylon.js from the typescript files:

```
gulp typescript
```
Will be generated :
- build/babylon.js
- build/babylon.d.ts
- build/babylon.min.js

Be aware that all js files content will be overwrite.

### Build Babylon.js when you save a typescript file:
```
gulp watch-typescript
```

### Compile all the typscript files to their javascript respective files
```
gulp typescript-to-js
```

Be aware that all js files content will be overwrite.

### Build the typescript declaration file
```
gulp typescript-declaration
```
