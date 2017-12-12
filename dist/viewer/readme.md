Babylon.js Viewer
=====================

Babylon's viewer is a wrapper around Babylon, that automatically initializes the needed components in order to display a loaded model. It is easy to use, and require no coding at all.

The viewer automatically interacts with the DOM, searching for HTML elements named `babylon`. It will then automatically read the configuration from the DOM element and will create a scene for it.

for basic and advanced usage instructions please read the doc at https://doc.babylonjs.com/extensions/the_babylon_viewer

The source code can be found at https://github.com/BabylonJS/Babylon.js/tree/master/Viewer

# Basic usage

to create a simple viewer add the following code to your HTML>

```HTML
<babylon model="https://playground.babylonjs.com/scenes/Rabbit.babylon"></babylon>
<script src="https://viewer.babylonjs.com/viewer.min.js"></script>
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

# Installation instructions

## CDN

Compiled js files (minified) are offered on our public CDN here:

* https://viewer.babylonjs.com/serializers/viewer.min.js

## NPM

To install using npm :

```
npm install --save babylonjs-viewer
```

Afterwards it can be imported to the project using:

```
import from 'babylonjs-viewer';
```

This will enable the BabylonViewer namespace.

Using webpack to package your project will use the minified js file.
