# Babylon.js Viewer Assets

Babylon's viewer assets package contains all needed binary assets neeed for the proper operation of the viewer's templating system.

This packes is only needed when intalling the viewer's npm package and is installed  and used automatically.

For basic and advanced viewer usage instructions please read the doc at https://doc.babylonjs.com/extensions/the_babylon_viewer

The source code can be found at https://github.com/BabylonJS/Babylon.js/tree/master/Viewer

## Overriding the package

To override the package when (for example) using webpack, define the package `babylonjs-viewer-assets` in "externals":

```javascript
externals: {
    "babylonjs-viewer-assets": true
}
```
