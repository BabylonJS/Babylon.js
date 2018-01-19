# 3.2.0

## Major updates
- Improved building process: We now run a full visual validation test for each pull request. Furthermore, code comments are now mandatory ([sebavan](https://github.com/sebavan))
- Introduced texture binding atlas. This optimization allows the engine to reuse texture bindings instead of rebinding textures when they are not on constant sampler indexes ([deltakosh](https://github.com/deltakosh))
- New [AnimationGroup class](http://doc.babylonjs.com/how_to/group) to control simultaneously multiple animations with different targets ([deltakosh](https://github.com/deltakosh))
- `WebVRCamera` now supports GearVR ([brianzinn](https://github.com/brianzinn))
- New glTF [serializer](https://github.com/BabylonJS/Babylon.js/tree/master/serializers/src/glTF/2.0). You can now export glTF or glb files directly from a Babylon scene ([kcoley](https://github.com/kcoley))

## Updates
- Tons of functions and classes received the code comments they deserved (All the community)
- Improved [SceneOptimizer](http://doc.babylonjs.com/how_to/how_to_use_sceneoptimizer) to provide better adapatability ([deltakosh](https://github.com/deltakosh))
- Improved `scene.isReady()` function which now takes in account shadows and LOD ([deltakosh](https://github.com/deltakosh))
- New watcher configuration for VSCode. Now the task only compiles changed files ([sebavan](https://github.com/sebavan))
- Added new draw modes to engine (points, lines, linesloop, linestrip, trianglestrip, trianglefan) ([benaadams](https://github.com/benaadams))
- Added GUI Textblock.lineSpacing setter and getter to configure vertical space between lines in pixels or percentage values when working with text wrapping ([carloslanderas](https://github.com/carloslanderas))
- VRHelper now has onSelectedMeshUnselected observable that will notify observers when the current selected mesh gets unselected
  ([carloslanderas](https://github.com/carloslanderas))
- VRHelper now has onBeforeCameraTeleport and onAfterCameraTeleport observables that will be notified before and after camera teleportation is triggered.
  ([carloslanderas](https://github.com/carloslanderas))
- VRHelper now has the public property teleportationEnabled to enable / disable camera teleportation. 
   ([carloslanderas](https://github.com/carloslanderas))
- VRHelper now exposes onNewMeshPicked observable that will notify a PickingInfo object after meshSelectionPredicate evaluation
   ([carloslanderas](https://github.com/carloslanderas))
- `AssetsManager` will now clear its `tasks` lsit from all successfully loaded tasks ([deltakosh](https://github.com/deltakosh))

## Bug fixes

## Breaking changes


