# BabylonJS Viewer

This project is a 3d model viewer using babylonjs.
Online docs: https://doc.babylonjs.com/extensions/the_babylon_viewer

## ES6/NPM usage

Install the package using npm:
```
npm install @babylonjs/viewer --save
```

Then in JS/Typescript the viewer to be imported via:
```
import * as BabylonViewer from '@babylonjs/viewer';
```

Add a babylon element in an html file:
```
<babylon id="babylon-viewer" camera.behaviors.auto-rotate="0"></babylon>
```

And used to load models
```
BabylonViewer.viewerManager.getViewerPromiseById('babylon-viewer').then(function (viewer) {
    // this will resolve only after the viewer with this specific ID is initialized
    viewer.onEngineInitObservable.add(function (scene) {
        viewer.loadModel({
            title: "Helmet",
            subtitle: "BabylonJS",
            thumbnail: "https://www.babylonjs.com/img/favicon/apple-icon-144x144.png",
            url: "https://www.babylonjs.com/Assets/DamagedHelmet/glTF/DamagedHelmet.gltf"
        });
    });
});
```