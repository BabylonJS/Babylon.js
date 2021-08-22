import * as WebGPUConstants from './webgpuConstants';
import { WebGPUTextureSamplerBindingDescription } from "./webgpuShaderProcessingContext";

/** @hidden */
export class WebGPUShaderProcessor {

    protected static _KnownUBOs: { [key: string]: { setIndex: number, bindingIndex: number, varName: string } } = {
        "Scene": { setIndex: 0, bindingIndex: 0, varName: "scene" },
        "Light0": { setIndex: 0, bindingIndex: 5, varName: "light0" },
        "Light1": { setIndex: 0, bindingIndex: 6, varName: "light1" },
        "Light2": { setIndex: 0, bindingIndex: 7, varName: "light2" },
        "Light3": { setIndex: 0, bindingIndex: 8, varName: "light3" },
        "Light4": { setIndex: 0, bindingIndex: 9, varName: "light4" },
        "Light5": { setIndex: 0, bindingIndex: 10, varName: "light5" },
        "Light6": { setIndex: 0, bindingIndex: 11, varName: "light6" },
        "Light7": { setIndex: 0, bindingIndex: 12, varName: "light7" },
        "Light8": { setIndex: 0, bindingIndex: 13, varName: "light8" },
        "Material": { setIndex: 1, bindingIndex: 0, varName: "material" },
        "Mesh": { setIndex: 1, bindingIndex: 1, varName: "mesh" },
    };

    protected static _KnownSamplers: { [key: string]: WebGPUTextureSamplerBindingDescription } = {
        "environmentBrdfSampler": { sampler: { setIndex: 0, bindingIndex: 1 }, isTextureArray: false, textures: [{ setIndex: 0, bindingIndex: 2 }] },
        // "reflectionSampler": { setIndex: 0, bindingIndex: 3 },
    };

    // TODO WEBGPU. sampler3D
    protected static _SamplerFunctionByWebGLSamplerType: { [key: string]: string } = {
        "sampler2D": "sampler2D",
        "sampler2DArray": "sampler2DArray",
        "sampler2DShadow": "sampler2DShadow",
        "sampler2DArrayShadow": "sampler2DArrayShadow",
        "samplerCube": "samplerCube",
        "sampler3D": "sampler3D",
    };

    protected static _TextureTypeByWebGLSamplerType: { [key: string]: string } = {
        "sampler2D": "texture2D",
        "sampler2DArray": "texture2DArray",
        "sampler2DShadow": "texture2D",
        "sampler2DArrayShadow": "texture2DArray",
        "samplerCube": "textureCube",
        "samplerCubeArray": "textureCubeArray",
        "sampler3D": "texture3D",
    };

    protected static _GpuTextureViewDimensionByWebGPUTextureType: { [key: string]: GPUTextureViewDimension } = {
        "textureCube": WebGPUConstants.TextureViewDimension.Cube,
        "textureCubeArray": WebGPUConstants.TextureViewDimension.CubeArray,
        "texture2D": WebGPUConstants.TextureViewDimension.E2d,
        "texture2DArray": WebGPUConstants.TextureViewDimension.E2dArray,
        "texture3D": WebGPUConstants.TextureViewDimension.E3d,
    };

    // if the webgl sampler type is not listed in this array, "sampler" is taken by default
    protected static _SamplerTypeByWebGLSamplerType: { [key: string]: string } = {
        "sampler2DShadow": "samplerShadow",
        "sampler2DArrayShadow": "samplerShadow",
    };

    protected static _IsComparisonSamplerByWebGPUSamplerType: { [key: string]: boolean } = {
        "samplerShadow": true,
        "samplerArrayShadow": true,
        "sampler": false,
    };

}
