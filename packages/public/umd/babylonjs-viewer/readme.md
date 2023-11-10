# Babylon.js Viewer

Babylon's viewer is a wrapper around Babylon, that automatically initializes the needed components in order to display a loaded model. It is easy to use, and require no coding at all.

The viewer automatically interacts with the DOM, searching for HTML elements named `babylon`. It will then automatically read the configuration from the DOM element and will create a scene for it.

for basic and advanced usage instructions please read the doc at https://doc.babylonjs.com/features/featuresDeepDive/babylonViewer/viewerExamples

The source code can be found at https://github.com/BabylonJS/Babylon.js/tree/master/Viewer

## Basic usage

to create a simple viewer add the following code to your HTML:

```HTML
<babylon model="https://playground.babylonjs.com/scenes/Rabbit.babylon"></babylon>
<script src="https://viewer.babylonjs.com/viewer.js"></script>
```

Make sure to size the babylon HTML tag. For example:

```css
babylon {
    max-width: 800px;
    max-height: 500px;
    width: 100%;
    height: 600px;
}
```

## Installation instructions

### CDN

> ⚠️ WARNING: The CDN should not be used in production environments. The purpose of our CDN is to serve Babylon packages to users learning how to use the platform or running small experiments. Once you've built an application and are ready to share it with the world at large, you should serve all packages from your own CDN.

Compiled js files are offered on our public CDN here:

* https://viewer.babylonjs.com/viewer.js (minified)
* https://viewer.babylonjs.com/viewer.max.js

### Using NPM

To install using npm :

```javascript
npm install --save babylonjs-viewer
```

Afterwards it can be imported to the project using:

```javascript
import * as BabylonViewer from 'babylonjs-viewer';

BabylonViewer.InitTags("my-tag");
```

This will enable the BabylonViewer namespace.

Using webpack to package your project will use the minified js file.

## TypeScript

If you use the npm package, starting 3.2.0-alpha8 the babylon viewer has a fully documented declaration file.
