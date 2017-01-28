Build Babylon.js with Gulp
====================

Build Babylon.js with [gulp](http://gulpjs.com/ "gulp") and npm ([nodejs](http://nodejs.org/ "nodejs")), easy and cross-platform

**Paths in this file are relative to this file location, currently [Tools/Gulp](https://github.com/BabylonJS/Babylon.js/tree/master/Tools/Gulp).**

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

Be aware that all js files content will be overwritten.

### Build Babylon.js when you save a typescript file:
```
gulp watch
```

### Run Integrated Web Server and watch for changes:
```
gulp run
```

you can now freely test in the following URLs:
- [Playground]("http://localhost:1338/Playground/index-local.html")
- [Materials Library]("http://localhost:1338/materialsLibrary/index.html")
- [Postprocess Library]("http://localhost:1338/postProcessLibrary/index.html")
- [Procedural Textures Library]("http://localhost:1338/proceduralTexturesLibrary/index.html")
- [Local Dev Samples]("http://localhost:1338/localDev/index.html")

### Compile all the typscript files to their javascript respective files including declaration file
```
gulp typescript-compile
```

Be aware that all js files content will be overwritten.

### Compile all the libraries
```
gulp typescript-libraries
```

Be aware that all js files content will be overwritten.

### Compile all the typscript and the library
```
gulp typescript-all
```
### Zip individual Blender python files for distribute-able
```
gulp zip-blender
```