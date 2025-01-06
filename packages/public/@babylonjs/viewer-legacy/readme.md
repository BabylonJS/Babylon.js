# BabylonJS Viewer

⚠️ **BabylonJS Viewer V1 is being deprecated.**

> At the end of 2024, the Babylon Viewer V1 will be deprecated in favor of the new [Babylon Viewer V2](https://doc.babylonjs.com/features/featuresDeepDive/babylonViewer). To use the Babylon Viewer V2, use the `preview` tag or append `-alpha` to the version when installing this package, e.g. `npm install @babylonjs/viewer@preview`. If you have any questions or concerns about this change, please get in touch with us on the Babylon [forum](https://forum.babylonjs.com/c/questions)!


This project is a 3d model viewer using babylonjs.
Online docs: https://doc.babylonjs.com/features/featuresDeepDive/babylonViewer/viewerExamples

## ES6/NPM usage

Install the package using npm:

```bash
npm install @babylonjs/viewer --save
```

Then in JS/Typescript the viewer to be imported via:

```bash
import * as BabylonViewer from '@babylonjs/viewer';
```

Add a babylon element in a html file:

```html
<babylon id="babylon-viewer" camera.behaviors.auto-rotate="0"></babylon>
```

And used to load models

```javascript
BabylonViewer.viewerManager.getViewerPromiseById("babylon-viewer").then(function (viewer) {
    // this will resolve only after the viewer with this specific ID is initialized
    viewer.onEngineInitObservable.add(function (scene) {
        viewer.loadModel({
            title: "Helmet",
            subtitle: "BabylonJS",
            thumbnail: "https://www.babylonjs.com/img/favicon/apple-icon-144x144.png",
            url: "https://www.babylonjs.com/Assets/DamagedHelmet/glTF/DamagedHelmet.gltf",
        });
    });
});
```
