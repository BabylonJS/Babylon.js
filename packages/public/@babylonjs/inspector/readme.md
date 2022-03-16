Babylon.js inspector module
=====================

For usage documentation please visit http://doc.babylonjs.com/how_to/debug_layer.

# Installation instructions

To install using npm :

```
npm install --save-dev @babylonjs/core @babylonjs/inspector
```

# How to use

Afterwards it can be imported to the your project using:

```
import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
```

The first line will ensure you can access the property debugLayer of the scene while the second will ensure the inspector can be used within your scene.

This is a great example where code splitting or conditional loading could be use to ensure you are not delivering the inspector if not part of your final app.

For more information you can have a look at our [our ES6 dedicated documentation](https://doc.babylonjs.com/features/es6_support).
