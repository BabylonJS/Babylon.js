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

### Update config.json if you want to add your own files:
```
"extras" : {
    "files": [
        "file1.js", "file2.js"
    ]
}
```
## From the javascript source
### Build Babylon.js from the javascript files:

```
gulp
```
Will be generated :
- babylon.js
- babylon.noworker.js (minified version without collisions workers)
- babylon.max.js (unminified)

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
- babylon.js
- babylon.d.ts
- babylon.noworker.js (minified version without collisions workers)
- babylon.max.js (unminified)

Be aware that all js files content will be overwrite.

### Build Babylon.js when you save a typescript file:
```
gulp watch-typescript
```

### Compile all the typscript files to their javascript respective files including declaration file
```
gulp typescript-compile
```

Be aware that all js files content will be overwritten.
