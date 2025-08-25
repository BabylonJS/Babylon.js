# Dev Host

This devhost provides you a dev inner loop to test Babylon.js code, **but for most scenarios, it is recommended that you use the playground instead.**

The recommended case of using the devhost is for ES6 experiences that contain their own engine, like lottie-player.

# Scenarios

Currently this dev host supports two scenarios that you can access by adding a QSP to the URL:

exp=testScene -> Default scenario if you don't pass anything, renders a scene that is the equivalent of the default playground scene. **Prefer using the playground over this.**
exp=lottie -> Uses dev/lottie-player to play a lottie animation.

## exp=lottie

This experience allows you to test the Babylon lottie-player. You can run this experience with a lottie file in the Babylon Assets repo by using the QSP: file=fileName.json, for example: ?exp=lottie&file=triangles_noParents_noCross.json

This will run the lottie-player experience with the file `https://assets.babylonjs.com/lottie/triangles_noParents_noCross.json`;

If you need more control, you can edit directly the file /src/lottie/main.ts where you can change the configuration and variables of the animation.
