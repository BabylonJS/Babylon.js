Babylon.js Actions Builder
==========

The Actions Builder is a part of the 3ds Max plugin ([Max2Babylon](https://github.com/BabylonJS/Babylon.js/tree/master/Exporters/3ds%20Max))
that allows to build actions without any line of code.

Tutorial and informations about the Actions Builder [here](https://medium.com/babylon-js/actions-builder-b05e72aa541a)

Built files are located in "./Sources"

# Install and Build files

### Install dependencies:
```
npm install
```

### Build Actions Builder:
```
gulp
```

### Build JS files from their respective TS files:
```
gulp debug
```

### Build on save:
```
gulp watch
```

### Update gulpfile.js to add your own files:
```
var files = [
    // Files
    ...
    "file1.js",
    "file2.js",
    ...
];
```
