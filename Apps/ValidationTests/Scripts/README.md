# Validation Tests

The JS files in this folder are intended to be launched by file association with the Babylon Native UWP app.

With an x64 UWP build of the v8 Playground installed, simply double-click each script to launch it.

## gltf2_asset_generator_test.js

This test will iterate through and display all the models from the glTF asset generator tool's output.
This tool can be found [here](https://github.com/KhronosGroup/glTF-Asset-Generator) while the models 
themselves can be easily previewed from [here](https://bghgary.github.io/glTF-Assets-Viewer/?manifest=https://raw.githubusercontent.com/KhronosGroup/glTF-Asset-Generator/master/Output/Manifest.json&folder=0&model=0).
* The "Compatibility" category contains two models (4 and 5) which are *supposed* to fail.  While they are 
  actually throwing the correct error messages at this time, error handling is not yet implemented in
  Babylon Native, and consequently attempting to load one of these models will terminate the test.
  So far, we have worked around this problem by simply using the "desiredFolder" variable inside the
  test to observe the categories one at a time; if this proves too onerous, we may consider adding
  more powerful ways to exclude particular models from the test.
* There is a rendering bug that shows up in a number of asset generator models which seems to cause the
  normals to appear inverted/reversed.  This is most plainly evident in the Mesh_PrimitiveAttribute
  category when comparing models 5 and 6, which are visually identical in Babylon.JS but render 
  differently in Babylon Native.  Interestingly, Babylon Native's behavior in this case seems to match
  that of PlayCanvas.  This bug is under active investigation.

## gltf2_sample_models_test.js

This test will iterate through and display all the models from the glTF 2.0 sample models set.  This
set of models is viewable [here](https://github.com/KhronosGroup/glTF-Sample-Models/tree/master/2.0)
while previews, in image or GIF form, can be found by scrolling down on the same page.
* "AntiqueCamera" is currently excluded from this test due to a known bug in Spectre's handling
  of 16 bit textures.  This test is to be included again once this bug is fixed.