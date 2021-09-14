import * as WebGPUConstants from './webgpuConstants';
import { Constants } from '../constants';
import { WebGPUTextureHelper } from "./webgpuTextureHelper";
import { Sampler } from "../../Materials/Textures/sampler";

const filterToBits = [
    0 | 0 << 1 | 0 << 2, // not used
    0 | 0 << 1 | 0 << 2, // TEXTURE_NEAREST_SAMPLINGMODE / TEXTURE_NEAREST_NEAREST
    1 | 1 << 1 | 0 << 2, // TEXTURE_BILINEAR_SAMPLINGMODE / TEXTURE_LINEAR_LINEAR
    1 | 1 << 1 | 1 << 2, // TEXTURE_TRILINEAR_SAMPLINGMODE / TEXTURE_LINEAR_LINEAR_MIPLINEAR
    0 | 0 << 1 | 0 << 2, // TEXTURE_NEAREST_NEAREST_MIPNEAREST
    0 | 1 << 1 | 0 << 2, // TEXTURE_NEAREST_LINEAR_MIPNEAREST
    0 | 1 << 1 | 1 << 2, // TEXTURE_NEAREST_LINEAR_MIPLINEAR
    0 | 1 << 1 | 0 << 2, // TEXTURE_NEAREST_LINEAR
    0 | 0 << 1 | 1 << 2, // TEXTURE_NEAREST_NEAREST_MIPLINEAR
    1 | 0 << 1 | 0 << 2, // TEXTURE_LINEAR_NEAREST_MIPNEAREST
    1 | 0 << 1 | 1 << 2, // TEXTURE_LINEAR_NEAREST_MIPLINEAR
    1 | 1 << 1 | 0 << 2, // TEXTURE_LINEAR_LINEAR_MIPNEAREST
    1 | 0 << 1 | 0 << 2, // TEXTURE_LINEAR_NEAREST
];

// subtract 0x01FF from the comparison function value before indexing this array!
const comparisonFunctionToBits = [
    0 << 3 | 0 << 4 | 0 << 5 | 0 << 6, // undefined
    0 << 3 | 0 << 4 | 0 << 5 | 1 << 6, // NEVER
    0 << 3 | 0 << 4 | 1 << 5 | 0 << 6, // LESS
    0 << 3 | 0 << 4 | 1 << 5 | 1 << 6, // EQUAL
    0 << 3 | 1 << 4 | 0 << 5 | 0 << 6, // LEQUAL
    0 << 3 | 1 << 4 | 0 << 5 | 1 << 6, // GREATER
    0 << 3 | 1 << 4 | 1 << 5 | 0 << 6, // NOTEQUAL
    0 << 3 | 1 << 4 | 1 << 5 | 1 << 6, // GEQUAL
    1 << 3 | 0 << 4 | 0 << 5 | 0 << 6, // ALWAYS
];

const filterNoMipToBits = [
    0 << 7, // not used
    1 << 7, // TEXTURE_NEAREST_SAMPLINGMODE / TEXTURE_NEAREST_NEAREST
    1 << 7, // TEXTURE_BILINEAR_SAMPLINGMODE / TEXTURE_LINEAR_LINEAR
    0 << 7, // TEXTURE_TRILINEAR_SAMPLINGMODE / TEXTURE_LINEAR_LINEAR_MIPLINEAR
    0 << 7, // TEXTURE_NEAREST_NEAREST_MIPNEAREST
    0 << 7, // TEXTURE_NEAREST_LINEAR_MIPNEAREST
    0 << 7, // TEXTURE_NEAREST_LINEAR_MIPLINEAR
    1 << 7, // TEXTURE_NEAREST_LINEAR
    0 << 7, // TEXTURE_NEAREST_NEAREST_MIPLINEAR
    0 << 7, // TEXTURE_LINEAR_NEAREST_MIPNEAREST
    0 << 7, // TEXTURE_LINEAR_NEAREST_MIPLINEAR
    0 << 7, // TEXTURE_LINEAR_LINEAR_MIPNEAREST
    1 << 7, // TEXTURE_LINEAR_NEAREST
];

/** @hidden */
export class WebGPUCacheSampler {

    private _samplers: { [hash: number]: GPUSampler } = {};
    private _device: GPUDevice;

    public disabled: boolean;

    constructor(device: GPUDevice) {
        this._device = device;
        this.disabled = false;
    }

    public static GetSamplerHashCode(sampler: Sampler): number {
        let code =
            filterToBits[sampler.samplingMode] +
            comparisonFunctionToBits[(sampler._comparisonFunction || 0x0202) - 0x0200 + 1] +
            filterNoMipToBits[sampler.samplingMode] + // handle the lodMinClamp = lodMaxClamp = 0 case when no filter used for mip mapping
            ((sampler._cachedWrapU ?? 1) << 8) +
            ((sampler._cachedWrapV ?? 1) << 10) +
            ((sampler._cachedWrapR ?? 1) << 12) +
            ((sampler.useMipMaps ? 1 : 0) << 14) + // need to factor this in because _getSamplerFilterDescriptor depends on samplingMode AND useMipMaps!
            ((sampler._cachedAnisotropicFilteringLevel ?? 1) << 15);

        return code;
    }

    private static _GetSamplerFilterDescriptor(sampler: Sampler, anisotropy: number): {
        magFilter: GPUFilterMode,
        minFilter: GPUFilterMode,
        mipmapFilter: GPUFilterMode,
        lodMinClamp?: number,
        lodMaxClamp?: number,
        anisotropyEnabled?: boolean,
    } {
        let magFilter: GPUFilterMode, minFilter: GPUFilterMode, mipmapFilter: GPUFilterMode, lodMinClamp: number | undefined, lodMaxClamp: number | undefined;
        const useMipMaps = sampler.useMipMaps;
        switch (sampler.samplingMode) {
            case Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST:
                magFilter = WebGPUConstants.FilterMode.Linear;
                minFilter = WebGPUConstants.FilterMode.Linear;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                if (!useMipMaps) {
                    lodMinClamp = lodMaxClamp = 0;
                }
                break;
            case Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR:
            case Constants.TEXTURE_TRILINEAR_SAMPLINGMODE:
                magFilter = WebGPUConstants.FilterMode.Linear;
                minFilter = WebGPUConstants.FilterMode.Linear;
                if (!useMipMaps) {
                    mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                    lodMinClamp = lodMaxClamp = 0;
                } else {
                    mipmapFilter = WebGPUConstants.FilterMode.Linear;
                }
                break;
            case Constants.TEXTURE_NEAREST_NEAREST_MIPLINEAR:
                magFilter = WebGPUConstants.FilterMode.Nearest;
                minFilter = WebGPUConstants.FilterMode.Nearest;
                if (!useMipMaps) {
                    mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                    lodMinClamp = lodMaxClamp = 0;
                } else {
                    mipmapFilter = WebGPUConstants.FilterMode.Linear;
                }
                break;
            case Constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST:
                magFilter = WebGPUConstants.FilterMode.Nearest;
                minFilter = WebGPUConstants.FilterMode.Nearest;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                if (!useMipMaps) {
                    lodMinClamp = lodMaxClamp = 0;
                }
                break;
            case Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST:
                magFilter = WebGPUConstants.FilterMode.Nearest;
                minFilter = WebGPUConstants.FilterMode.Linear;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                if (!useMipMaps) {
                    lodMinClamp = lodMaxClamp = 0;
                }
                break;
            case Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR:
                magFilter = WebGPUConstants.FilterMode.Nearest;
                minFilter = WebGPUConstants.FilterMode.Linear;
                if (!useMipMaps) {
                    mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                    lodMinClamp = lodMaxClamp = 0;
                } else {
                    mipmapFilter = WebGPUConstants.FilterMode.Linear;
                }
                break;
            case Constants.TEXTURE_NEAREST_LINEAR:
                magFilter = WebGPUConstants.FilterMode.Nearest;
                minFilter = WebGPUConstants.FilterMode.Linear;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                lodMinClamp = lodMaxClamp = 0;
                break;
            case Constants.TEXTURE_NEAREST_NEAREST:
            case Constants.TEXTURE_NEAREST_SAMPLINGMODE:
                magFilter = WebGPUConstants.FilterMode.Nearest;
                minFilter = WebGPUConstants.FilterMode.Nearest;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                lodMinClamp = lodMaxClamp = 0;
                break;
            case Constants.TEXTURE_LINEAR_NEAREST_MIPNEAREST:
                magFilter = WebGPUConstants.FilterMode.Linear;
                minFilter = WebGPUConstants.FilterMode.Nearest;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                if (!useMipMaps) {
                    lodMinClamp = lodMaxClamp = 0;
                }
                break;
            case Constants.TEXTURE_LINEAR_NEAREST_MIPLINEAR:
                magFilter = WebGPUConstants.FilterMode.Linear;
                minFilter = WebGPUConstants.FilterMode.Nearest;
                if (!useMipMaps) {
                    mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                    lodMinClamp = lodMaxClamp = 0;
                } else {
                    mipmapFilter = WebGPUConstants.FilterMode.Linear;
                }
                break;
            case Constants.TEXTURE_LINEAR_LINEAR:
            case Constants.TEXTURE_BILINEAR_SAMPLINGMODE:
                magFilter = WebGPUConstants.FilterMode.Linear;
                minFilter = WebGPUConstants.FilterMode.Linear;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                lodMinClamp = lodMaxClamp = 0;
                break;
            case Constants.TEXTURE_LINEAR_NEAREST:
                magFilter = WebGPUConstants.FilterMode.Linear;
                minFilter = WebGPUConstants.FilterMode.Nearest;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                lodMinClamp = lodMaxClamp = 0;
                break;
            default:
                magFilter = WebGPUConstants.FilterMode.Nearest;
                minFilter = WebGPUConstants.FilterMode.Nearest;
                mipmapFilter = WebGPUConstants.FilterMode.Nearest;
                lodMinClamp = lodMaxClamp = 0;
                break;
        }

        if (anisotropy > 1 && (lodMinClamp !== 0 || lodMaxClamp !== 0)) {
            return {
                magFilter: WebGPUConstants.FilterMode.Linear,
                minFilter: WebGPUConstants.FilterMode.Linear,
                mipmapFilter: WebGPUConstants.FilterMode.Linear,
                anisotropyEnabled: true,
            };
        }

        return {
            magFilter,
            minFilter,
            mipmapFilter,
            lodMinClamp,
            lodMaxClamp,
        };
    }

    private static _GetWrappingMode(mode: number): GPUAddressMode {
        switch (mode) {
            case Constants.TEXTURE_WRAP_ADDRESSMODE:
                return WebGPUConstants.AddressMode.Repeat;
            case Constants.TEXTURE_CLAMP_ADDRESSMODE:
                return WebGPUConstants.AddressMode.ClampToEdge;
            case Constants.TEXTURE_MIRROR_ADDRESSMODE:
                return WebGPUConstants.AddressMode.MirrorRepeat;
        }
        return WebGPUConstants.AddressMode.Repeat;
    }

    private static _GetSamplerWrappingDescriptor(sampler: Sampler): {
        addressModeU: GPUAddressMode,
        addressModeV: GPUAddressMode,
        addressModeW: GPUAddressMode
    } {
        return {
            addressModeU: this._GetWrappingMode(sampler._cachedWrapU!),
            addressModeV: this._GetWrappingMode(sampler._cachedWrapV!),
            addressModeW: this._GetWrappingMode(sampler._cachedWrapR!),
        };
    }

    private static _GetSamplerDescriptor(sampler: Sampler): GPUSamplerDescriptor {
        const anisotropy = sampler.useMipMaps ? (sampler._cachedAnisotropicFilteringLevel ?? 1) : 1;
        const filterDescriptor = this._GetSamplerFilterDescriptor(sampler, anisotropy);
        return {
            ...filterDescriptor,
            ...this._GetSamplerWrappingDescriptor(sampler),
            compare: sampler._comparisonFunction ? WebGPUTextureHelper.GetCompareFunction(sampler._comparisonFunction) : undefined,
            maxAnisotropy: filterDescriptor.anisotropyEnabled ? anisotropy : 1,
        };
    }

    public getSampler(sampler: Sampler, bypassCache = false, hash = 0): GPUSampler {
        if (this.disabled) {
            return this._device.createSampler(WebGPUCacheSampler._GetSamplerDescriptor(sampler));
        }

        if (bypassCache) {
            hash = 0;
        } else if (hash === 0) {
            hash = WebGPUCacheSampler.GetSamplerHashCode(sampler);
        }

        let gpuSampler = bypassCache ? undefined : this._samplers[hash];
        if (!gpuSampler) {
            gpuSampler = this._device.createSampler(WebGPUCacheSampler._GetSamplerDescriptor(sampler));
            if (!bypassCache) {
                this._samplers[hash] = gpuSampler;
            }
        }

        return gpuSampler;
    }
}