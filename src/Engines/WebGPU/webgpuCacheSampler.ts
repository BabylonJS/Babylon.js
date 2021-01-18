import * as WebGPUConstants from './webgpuConstants';
import { Constants } from '../constants';
import { InternalTexture } from '../../Materials/Textures/internalTexture';
import { WebGPUTextureHelper } from "./webgpuTextureHelper";

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

    private static _GetSamplerHashCode(texture: InternalTexture): number {
        let code =
            filterToBits[texture.samplingMode] +
            comparisonFunctionToBits[(texture._comparisonFunction || 0x0202) - 0x0200 + 1] +
            filterNoMipToBits[texture.samplingMode] + // handle the lodMinClamp = lodMaxClamp = 0 case when no filter used for mip mapping
            ((texture._cachedWrapU ?? 1) << 8) +
            ((texture._cachedWrapV ?? 1) << 10) +
            ((texture._cachedWrapR ?? 1) << 12) +
            ((texture.generateMipMaps ? 1 : 0) << 14) + // need to factor this in because _getSamplerFilterDescriptor depends on samplingMode AND generateMipMaps!
            ((texture._cachedAnisotropicFilteringLevel ?? 1) << 15);

        return code;
    }

    private static _GetSamplerFilterDescriptor(internalTexture: InternalTexture, anisotropy: number): {
        magFilter: GPUFilterMode,
        minFilter: GPUFilterMode,
        mipmapFilter: GPUFilterMode,
        lodMinClamp?: number,
        lodMaxClamp?: number,
        anisotropyEnabled?: boolean,
    } {
        let magFilter: GPUFilterMode, minFilter: GPUFilterMode, mipmapFilter: GPUFilterMode, lodMinClamp: number | undefined, lodMaxClamp: number | undefined;
        const useMipMaps = internalTexture.generateMipMaps;
        switch (internalTexture.samplingMode) {
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

    private static _GetSamplerWrappingDescriptor(internalTexture: InternalTexture): {
        addressModeU: GPUAddressMode,
        addressModeV: GPUAddressMode,
        addressModeW: GPUAddressMode
    } {
        return {
            addressModeU: this._GetWrappingMode(internalTexture._cachedWrapU!),
            addressModeV: this._GetWrappingMode(internalTexture._cachedWrapV!),
            addressModeW: this._GetWrappingMode(internalTexture._cachedWrapR!),
        };
    }

    private static _GetSamplerDescriptor(internalTexture: InternalTexture): GPUSamplerDescriptor {
        const anisotropy = internalTexture.generateMipMaps ? (internalTexture._cachedAnisotropicFilteringLevel ?? 1) : 1;
        const filterDescriptor = this._GetSamplerFilterDescriptor(internalTexture, anisotropy);
        return {
            ...filterDescriptor,
            ...this._GetSamplerWrappingDescriptor(internalTexture),
            compare: internalTexture._comparisonFunction ? WebGPUTextureHelper.GetCompareFunction(internalTexture._comparisonFunction) : undefined,
            maxAnisotropy: filterDescriptor.anisotropyEnabled ? anisotropy : 1,
        };
    }

    public getSampler(internalTexture: InternalTexture, bypassCache = false): GPUSampler {
        if (this.disabled) {
            return this._device.createSampler(WebGPUCacheSampler._GetSamplerDescriptor(internalTexture));
        }

        const hash = bypassCache ? 0 : WebGPUCacheSampler._GetSamplerHashCode(internalTexture);

        let sampler = bypassCache ? undefined : this._samplers[hash];
        if (!sampler) {
            sampler =  this._device.createSampler(WebGPUCacheSampler._GetSamplerDescriptor(internalTexture));
            if (!bypassCache) {
                this._samplers[hash] = sampler;
            }
        }

        return sampler;
    }
}