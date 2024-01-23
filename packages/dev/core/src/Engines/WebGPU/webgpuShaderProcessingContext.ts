/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */
import type { ShaderLanguage } from "../../Materials/shaderLanguage";
import type { ShaderProcessingContext } from "../Processors/shaderProcessingOptions";

const _maxGroups = 4;
const _maxBindingsPerGroup = 1 << 16;

// all types not listed are assumed to consume 1 location
const _typeToLocationSize: { [key: string]: number } = {
    // GLSL types
    mat2: 2,
    mat3: 3,
    mat4: 4,

    // WGSL types
    mat2x2: 2,
    mat3x3: 3,
    mat4x4: 4,
};

/** @internal */
export interface WebGPUBindingInfo {
    groupIndex: number;
    bindingIndex: number;
}

/** @internal */
export interface WebGPUTextureDescription {
    autoBindSampler?: boolean;
    isTextureArray: boolean;
    isStorageTexture: boolean;
    textures: Array<WebGPUBindingInfo>;
    sampleType?: GPUTextureSampleType; // not used if the texture is a storage texture
}

/** @internal */
export interface WebGPUSamplerDescription {
    binding: WebGPUBindingInfo;
    type: GPUSamplerBindingType;
}

/** @internal */
export interface WebGPUBufferDescription {
    binding: WebGPUBindingInfo;
}

/** @internal */
export interface WebGPUBindGroupLayoutEntryInfo {
    name: string;
    index: number; // index of the entry (GPUBindGroupLayoutEntry) in the bindGroupLayoutEntries[group] array
    nameInArrayOfTexture?: string; // something like texture0, texture1, ... if texture is an array, else same thing as "name"
}

/**
 * @internal
 */
export class WebGPUShaderProcessingContext implements ShaderProcessingContext {
    /** @internal */
    public static _SimplifiedKnownBindings = true; // if true, use only group=0,binding=0 as a known group/binding for the Scene ubo and use group=1,binding=X for all other bindings
    // if false, see _KnownUBOs for the known groups/bindings used

    protected static _SimplifiedKnownUBOs: { [key: string]: WebGPUBufferDescription } = {
        Scene: { binding: { groupIndex: 0, bindingIndex: 0 } },
        Light0: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light1: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light2: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light3: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light4: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light5: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light6: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light7: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light8: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light9: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light10: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light11: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light12: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light13: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light14: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light15: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light16: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light17: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light18: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light19: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light20: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light21: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light22: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light23: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light24: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light25: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light26: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light27: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light28: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light29: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light30: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Light31: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Material: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Mesh: { binding: { groupIndex: -1, bindingIndex: -1 } },
        Internals: { binding: { groupIndex: -1, bindingIndex: -1 } },
    };

    protected static _KnownUBOs: { [key: string]: WebGPUBufferDescription } = {
        Scene: { binding: { groupIndex: 0, bindingIndex: 0 } },

        Light0: { binding: { groupIndex: 1, bindingIndex: 0 } },
        Light1: { binding: { groupIndex: 1, bindingIndex: 1 } },
        Light2: { binding: { groupIndex: 1, bindingIndex: 2 } },
        Light3: { binding: { groupIndex: 1, bindingIndex: 3 } },
        Light4: { binding: { groupIndex: 1, bindingIndex: 4 } },
        Light5: { binding: { groupIndex: 1, bindingIndex: 5 } },
        Light6: { binding: { groupIndex: 1, bindingIndex: 6 } },
        Light7: { binding: { groupIndex: 1, bindingIndex: 7 } },
        Light8: { binding: { groupIndex: 1, bindingIndex: 8 } },
        Light9: { binding: { groupIndex: 1, bindingIndex: 9 } },
        Light10: { binding: { groupIndex: 1, bindingIndex: 10 } },
        Light11: { binding: { groupIndex: 1, bindingIndex: 11 } },
        Light12: { binding: { groupIndex: 1, bindingIndex: 12 } },
        Light13: { binding: { groupIndex: 1, bindingIndex: 13 } },
        Light14: { binding: { groupIndex: 1, bindingIndex: 14 } },
        Light15: { binding: { groupIndex: 1, bindingIndex: 15 } },
        Light16: { binding: { groupIndex: 1, bindingIndex: 16 } },
        Light17: { binding: { groupIndex: 1, bindingIndex: 17 } },
        Light18: { binding: { groupIndex: 1, bindingIndex: 18 } },
        Light19: { binding: { groupIndex: 1, bindingIndex: 19 } },
        Light20: { binding: { groupIndex: 1, bindingIndex: 20 } },
        Light21: { binding: { groupIndex: 1, bindingIndex: 21 } },
        Light22: { binding: { groupIndex: 1, bindingIndex: 22 } },
        Light23: { binding: { groupIndex: 1, bindingIndex: 23 } },
        Light24: { binding: { groupIndex: 1, bindingIndex: 24 } },
        Light25: { binding: { groupIndex: 1, bindingIndex: 25 } },
        Light26: { binding: { groupIndex: 1, bindingIndex: 26 } },
        Light27: { binding: { groupIndex: 1, bindingIndex: 27 } },
        Light28: { binding: { groupIndex: 1, bindingIndex: 28 } },
        Light29: { binding: { groupIndex: 1, bindingIndex: 29 } },
        Light30: { binding: { groupIndex: 1, bindingIndex: 30 } },
        Light31: { binding: { groupIndex: 1, bindingIndex: 31 } },

        Material: { binding: { groupIndex: 2, bindingIndex: 0 } },
        Mesh: { binding: { groupIndex: 2, bindingIndex: 1 } },
        Internals: { binding: { groupIndex: 2, bindingIndex: 2 } },
    };

    public static get KnownUBOs() {
        return WebGPUShaderProcessingContext._SimplifiedKnownBindings ? WebGPUShaderProcessingContext._SimplifiedKnownUBOs : WebGPUShaderProcessingContext._KnownUBOs;
    }

    public shaderLanguage: ShaderLanguage;

    public uboNextBindingIndex: number;
    public freeGroupIndex: number;
    public freeBindingIndex: number;

    public availableVaryings: { [key: string]: number };
    public availableAttributes: { [key: string]: number };
    public availableBuffers: { [key: string]: WebGPUBufferDescription };
    public availableTextures: { [key: string]: WebGPUTextureDescription };
    public availableSamplers: { [key: string]: WebGPUSamplerDescription };

    public leftOverUniforms: { name: string; type: string; length: number }[];

    public orderedAttributes: string[];
    public bindGroupLayoutEntries: GPUBindGroupLayoutEntry[][];
    public bindGroupLayoutEntryInfo: WebGPUBindGroupLayoutEntryInfo[][];
    public bindGroupEntries: GPUBindGroupEntry[][];
    public bufferNames: string[]; // list of all uniform/storage buffer names used in the shader
    public textureNames: string[]; // list of all texture names used in the shader
    public samplerNames: string[]; // list of all sampler names used in the shader
    public attributeNamesFromEffect: string[];
    public attributeLocationsFromEffect: number[];

    private _attributeNextLocation: number;
    private _varyingNextLocation: number;

    constructor(shaderLanguage: ShaderLanguage) {
        this.shaderLanguage = shaderLanguage;

        this._attributeNextLocation = 0;
        this._varyingNextLocation = 0;
        this.freeGroupIndex = 0;
        this.freeBindingIndex = 0;

        this.availableVaryings = {};
        this.availableAttributes = {};
        this.availableBuffers = {};
        this.availableTextures = {};
        this.availableSamplers = {};

        this.orderedAttributes = [];
        this.bindGroupLayoutEntries = [];
        this.bindGroupLayoutEntryInfo = [];
        this.bindGroupEntries = [];
        this.bufferNames = [];
        this.textureNames = [];
        this.samplerNames = [];

        this.leftOverUniforms = [];

        this._findStartingGroupBinding();
    }

    private _findStartingGroupBinding(): void {
        const knownUBOs = WebGPUShaderProcessingContext.KnownUBOs;

        const groups: number[] = [];
        for (const name in knownUBOs) {
            const binding = knownUBOs[name].binding;
            if (binding.groupIndex === -1) {
                continue;
            }
            if (groups[binding.groupIndex] === undefined) {
                groups[binding.groupIndex] = binding.bindingIndex;
            } else {
                groups[binding.groupIndex] = Math.max(groups[binding.groupIndex], binding.bindingIndex);
            }
        }

        this.freeGroupIndex = groups.length - 1;
        if (this.freeGroupIndex === 0) {
            this.freeGroupIndex++;
            this.freeBindingIndex = 0;
        } else {
            this.freeBindingIndex = groups[groups.length - 1] + 1;
        }
    }

    public getAttributeNextLocation(dataType: string, arrayLength: number = 0): number {
        const index = this._attributeNextLocation;

        this._attributeNextLocation += (_typeToLocationSize[dataType] ?? 1) * (arrayLength || 1);

        return index;
    }

    public getVaryingNextLocation(dataType: string, arrayLength: number = 0): number {
        const index = this._varyingNextLocation;

        this._varyingNextLocation += (_typeToLocationSize[dataType] ?? 1) * (arrayLength || 1);

        return index;
    }

    public getNextFreeUBOBinding() {
        return this._getNextFreeBinding(1);
    }

    private _getNextFreeBinding(bindingCount: number) {
        if (this.freeBindingIndex > _maxBindingsPerGroup - bindingCount) {
            this.freeGroupIndex++;
            this.freeBindingIndex = 0;
        }

        if (this.freeGroupIndex === _maxGroups) {
            // eslint-disable-next-line no-throw-literal
            throw "Too many textures or UBOs have been declared and it is not supported in WebGPU.";
        }

        const returnValue = {
            groupIndex: this.freeGroupIndex,
            bindingIndex: this.freeBindingIndex,
        };

        this.freeBindingIndex += bindingCount;

        return returnValue;
    }
}
