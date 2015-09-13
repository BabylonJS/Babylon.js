BabylonExporter
========

BabylonExporter can create a .babylon scene from the following formats:
 - FBX
 - OBJ
 - DAE

Command line usage:
BabylonExporter.exe /i:"source.fbx" /o:"outputDir" [/sk]

/sk option is used to export bones.


* OBJ engine can export:
 * Geometries
 * Meshes hierarchies
 * Material:
   * Diffuse color
   * Diffuse texture
   * Alpha
   * Emissive color
   * Specular color
   * Specular power

* FBX/DAE engine can export:
 * Geometries
 * Meshes hierarchies
 * Bones and bones' animations
 * Material:
  * Diffuse color
  * Diffuse texture
  * Alpha
  * Emissive color
  * Specular color
  * Specular power