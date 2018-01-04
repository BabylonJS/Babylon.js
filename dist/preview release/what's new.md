# 3.2.0

## Major updates
- Introduced texture binding atlas. This optimization allows the engine to reuse texture bindings instead of rebinding textures when they are not on constant sampler indexes ([deltakosh](https://github.com/deltakosh))
- New [AnimationGroup class](http://doc.babylonjs.com/how_to/group) to control simultaneously multiple animations with different targets ([deltakosh](https://github.com/deltakosh))

## Updates
- New watcher configuration for VSCode. Now the task only compiles changed files ([sebavan](https://github.com/sebavan))
- Added new draw modes to engine (points, lines, linesloop, linestrip, trianglestrip, trianglefan) ([benaadams](https://github.com/benaadams))
- Added GUI Textblock.lineSpacing setter and getter to configure vertical space between lines in pixels or percentage values when working with text wrapping ([carloslanderas](github.com/carloslanderas))
- VRHelper now has onSelectedMeshUnselected observable that will notify observers when the current selected mesh gets unselected
  ([carloslanderas](github.com/carloslanderas))

## Bug fixes

## Breaking changes
