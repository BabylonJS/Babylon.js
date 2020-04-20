## Instructions for building the JavaScript version of Draco with IE compatibility

Draco prebuilt libraries are not compatible with IE. Thus we must build the JavaScript fallback version of the Draco decoder ourselves.

Follow the instructions for building Draco from https://github.com/google/draco/blob/master/BUILDING.md#javascript-encoderdecoder except enable the BUILD_FOR_GLTF and IE_COMPATIBLE flags when running `cmake`.

```
$ cmake ../ -DCMAKE_TOOLCHAIN_FILE=/path/to/Emscripten.cmake -DBUILD_FOR_GLTF=ON -DIE_COMPATIBLE=ON`
```

Then copy the output `draco_decoder.js` to Babylon.js dist folder.

_Note that the WebAssembly versions are copied directly from the Draco repo._