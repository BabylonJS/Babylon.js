# Babylon Native

Build cross-platform native applications with the power of the Babylon.js JavaScript framework.

See [this blog entry](https://medium.com/@babylonjs/babylon-native-821f1694fffc) for more details.

*This project is under heavy development. Not all intended platforms are currently implemented. **DO NOT** use in production code.*

## Getting Started

*Coming soon...*

## Development Notes

### glslang and SPIRV-Cross

In order to compile the WebGL GLSL shader to the required bits for the target platform, this project utilizes [glslang](https://github.com/KhronosGroup/glslang) and [SPIRV-Cross](https://github.com/KhronosGroup/SPIRV-Cross). See [ShaderCompiler.h](./Engine/ShaderCompiler.h) and its corresponding implementation for details.

### arcana.cpp

This project makes substantial use of the utilities contained within the [arcana.cpp](https://github.com/microsoft/arcana.cpp) project, especially the support for asynchronous task execution and thread synchronization.

### N-API

This project uses a subset of [node-addon-api](https://github.com/nodejs/node-addon-api) and the JavaScript part of [N-API](https://github.com/nodejs/node/blob/master/src/js_native_api.h) to target either V8 or Chakra. See [this thread](https://github.com/nodejs/abi-stable-node/issues/354) for some context. There is also [work](https://github.com/nodejs/node-addon-api/issues/399) needed to factor out the JavaScript part of node-addon-api.

The code is located [here](./Source/Napi). Some small modifications were made to avoid node dependencies and improve performance. The Chakra version [js_native_api_chakra.cc](./Source/Napi/js_native_api_chakra.cc) came from [node_api_jsrt.cc](https://github.com/nodejs/node-chakracore/blob/master/src/node_api_jsrt.cc) and was modified to target Chakra directly. We will work on submitting these changes to the public version.

### bgfx

This project uses [bgfx](https://github.com/bkaradzic/bgfx) for the cross-platform rendering abstraction. It does not use the shader abstraction of bgfx, but instead [compiles the WebGL GLSL shader at runtime](#glslang-and-SPIRV-Cross) and generates the shader header that bgfx expects. See [BgfxEngine.cpp](./Source/Engine/BgfxEngine.cpp) for implementation details.

### base-n

This project uses [base-n](https://github.com/azawadzki/base-n) to implement base64 decoding for parsing data URLs.

### curl

This project uses [curl](https://curl.haxx.se/) (or, more accurately, [libcurl](https://curl.haxx.se/libcurl/)) as the backend for the provided implementation of XMLHttpRequest. At present, only a "golden path" is supported, but additional features will be added as they are required.

### Updating Babylon.js

To update the Babylon.js version:

* The Babylon.js repo exists as a submodule in the [Modules/Babylon.js](Modules/Babylon.js) directory pointing to the [native](https://github.com/BabylonJS/Babylon.js/tree/native) branch.
* If desired, merge in changes from other Babylon.js branches, including from the master branch.
  * This may require making changes to `src/Engine/babylon.nativeEngine.ts` to adapt to breaking changes in `src/Engine/babylon.engine.ts`.
* Follow the [Babylon.js contribution documentation](http://doc.babylonjs.com/how_to/how_to_start) instructions to install prerequisites and do your first full build.
* Run `UpdateBabylon.cmd core loaders`.

## Feature Roadmap

Feature roadmap is tracked in an [issue](https://github.com/BabylonJS/BabylonNative/issues/6#issue-454432466), which will be updated and maintained as development progresses.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## Reporting Security Issues

Security issues and bugs should be reported privately, via email, to the Microsoft Security
Response Center (MSRC) at [secure@microsoft.com](mailto:secure@microsoft.com). You should
receive a response within 24 hours. If for some reason you do not, please follow up via
email to ensure we received your original message. Further information, including the
[MSRC PGP](https://technet.microsoft.com/en-us/security/dn606155) key, can be found in
the [Security TechCenter](https://technet.microsoft.com/en-us/security/default).
