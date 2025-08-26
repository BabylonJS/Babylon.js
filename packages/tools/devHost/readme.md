# Dev Host

This devhost provides you a dev inner loop to test Babylon.js code, **but for most scenarios, it is recommended that you use the playground instead.**

The recommended case of using the devhost is for ES6 experiences that contain their own engine, like lottie-player.

# Scenarios

Currently this dev host supports two scenarios that you can access by adding the exp QSP to the URL.

## exp=lottie

This experience allows you to test the Babylon lottie-player. It supports the following params:

- file=string Renders this file from the Babylon assets repo. For example, file=triangles.json uses `https://assets.babylonjs.com/lottie/triangles.json`;
- useWorker=boolean Whether to use the webworker for rendering or not. Defaults to true if not used.

To change lottie variables or more detailed configuration options, edit the file /src/lottie/main.ts directly.

## exp=testScene

Renders a test scene, similar to the playground, but this code uses ES6 by default, so no sidefects are loaded like in the playground. This is used just for backwards compatibility, **prefer the playground for this type of testing unless you are trying to test an ES6 scenario.**. It supports the following params:

- useTS=boolean Whether to use the createScene.ts or createSceneJS.js files. Defaults to true (createScene.ts) if not used.
