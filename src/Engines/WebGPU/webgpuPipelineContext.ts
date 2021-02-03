import { IPipelineContext } from '../IPipelineContext';
import { Nullable } from '../../types';
import { WebGPUEngine } from '../webgpuEngine';
import { InternalTexture } from '../../Materials/Textures/internalTexture';
import { Effect } from '../../Materials/effect';
import { WebGPUShaderProcessingContext } from './webgpuShaderProcessingContext';
import { UniformBuffer } from "../../Materials/uniformBuffer";
import { IMatrixLike, IVector2Like, IVector3Like, IVector4Like, IColor3Like, IColor4Like } from '../../Maths/math.like';

const _uniformSizes: { [type: string]: number } = {
    "bool": 1,
    "int": 1,
    "float": 1,
    "vec2": 2,
    "ivec2": 2,
    "vec3": 3,
    "ivec3": 3,
    "vec4": 4,
    "ivec4": 4,
    "mat2": 4,
    "mat3": 12,
    "mat4": 16
};

/** @hidden */
export interface IWebGPUPipelineContextSamplerCache {
    samplerBinding: number;
    firstTextureName: string;
}

/** @hidden */
export interface IWebGPUPipelineContextTextureCache {
    textureBinding: number;
    texture: InternalTexture;
}

/** @hidden */
export interface IWebGPUPipelineContextVertexInputsCache {
    indexBuffer: Nullable<GPUBuffer>;
    indexOffset: number;

    vertexStartSlot: number;
    vertexBuffers: GPUBuffer[];
    vertexOffsets: number[];
}

/** @hidden */
export interface IWebGPURenderPipelineStageDescriptor {
    vertexStage: GPUProgrammableStage;
    fragmentStage?: GPUProgrammableStage;
}

/** @hidden */
export class WebGPUBindGroupCacheNode {
    public values: { [id: number]: WebGPUBindGroupCacheNode };
    public bindGroups: GPUBindGroup[];

    constructor() {
        this.values = {};
    }
}

/** @hidden */
export class WebGPUPipelineContext implements IPipelineContext {
    public engine: WebGPUEngine;

    public shaderProcessingContext: WebGPUShaderProcessingContext;

    public leftOverUniformsByName: { [name: string]: string };

    public sources: {
        vertex: string,
        fragment: string,
        rawVertex: string,
        rawFragment: string,
    };

    public stages: Nullable<IWebGPURenderPipelineStageDescriptor>;

    public samplers: { [name: string]: Nullable<IWebGPUPipelineContextSamplerCache> } = { };
    public textures: { [name: string]: Nullable<IWebGPUPipelineContextTextureCache> } = { };

    public bindGroupLayouts: GPUBindGroupLayout[];
    public bindGroupsCache: WebGPUBindGroupCacheNode;

    /**
     * Stores the uniform buffer
     */
    public uniformBuffer: Nullable<UniformBuffer>;

    // Default implementation.
    public onCompiled?: () => void;

    public get isAsync() {
        return false;
    }

    public get isReady(): boolean {
        if (this.stages) {
            return true;
        }

        return false;
    }

    /** @hidden */
    public _name: string;

    constructor(shaderProcessingContext: WebGPUShaderProcessingContext, engine: WebGPUEngine) {
        this._name = "unnamed";
        this.shaderProcessingContext = shaderProcessingContext;
        this.leftOverUniformsByName = {};
        this.engine = engine;
        this.bindGroupsCache = new WebGPUBindGroupCacheNode();
    }

    public _handlesSpectorRebuildCallback(onCompiled: (program: any) => void): void {
        // Nothing to do yet for spector.
    }

    public _fillEffectInformation(effect: Effect, uniformBuffersNames: { [key: string]: number }, uniformsNames: string[], uniforms: { [key: string]: Nullable<WebGLUniformLocation> }, samplerList: string[], samplers: { [key: string]: number }, attributesNames: string[], attributes: number[]) {
        const engine = this.engine;

        // TODO WEBGPU. Cleanup SEB on this entire function. Should not need anything in here or almost.
        let effectAvailableUniforms = engine.getUniforms(this, uniformsNames);
        effectAvailableUniforms.forEach((uniform, index) => {
            uniforms[uniformsNames[index]] = uniform;
        });

        // Prevent Memory Leak by reducing the number of string, refer to the string instead of copy.
        effect._fragmentSourceCode = "";
        effect._vertexSourceCode = "";
        // this._fragmentSourceCodeOverride = "";
        // this._vertexSourceCodeOverride = "";

        const foundSamplers = this.shaderProcessingContext.availableSamplers;
        let index: number;
        for (index = 0; index < samplerList.length; index++) {
            const name = samplerList[index];
            const sampler = foundSamplers[samplerList[index]];

            if (sampler == null || sampler == undefined) {
                samplerList.splice(index, 1);
                index--;
            }
            else {
                samplers[name] = index;
            }
        }

        for (let attr of engine.getAttributes(this, attributesNames)) {
            attributes.push(attr);
        }

        // Build the uniform layout for the left over uniforms.
        this.buildUniformLayout();

        let attributeNamesFromEffect: string[] = [];
        let attributeLocationsFromEffect: number[] = [];
        for (index = 0; index < attributesNames.length; index++) {
            const location = attributes[index];
            if (location >= 0) {
                attributeNamesFromEffect.push(attributesNames[index]);
                attributeLocationsFromEffect.push(location);
            }
        }
        this.shaderProcessingContext.attributeNamesFromEffect = attributeNamesFromEffect;
        this.shaderProcessingContext.attributeLocationsFromEffect = attributeLocationsFromEffect;
    }

    /** @hidden */
    /**
     * Build the uniform buffer used in the material.
     */
    public buildUniformLayout(): void {
        if (!this.shaderProcessingContext.leftOverUniforms.length) {
            return;
        }

        this.uniformBuffer = new UniformBuffer(this.engine, undefined, undefined, "leftOver-" + this._name);

        for (let leftOverUniform of this.shaderProcessingContext.leftOverUniforms) {
            const size = _uniformSizes[leftOverUniform.type];
            this.uniformBuffer.addUniform(leftOverUniform.name, size, leftOverUniform.length);
            // TODO WEBGPU. Replace with info from uniform buffer class
            this.leftOverUniformsByName[leftOverUniform.name] = leftOverUniform.type;
        }

        this.uniformBuffer.create();
    }

    /**
     * Release all associated resources.
     **/
    public dispose() {
        if (this.uniformBuffer) {
            this.uniformBuffer.dispose();
        }
    }

    /**
     * Sets an integer value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value Value to be set.
     */
    public setInt(uniformName: string, value: number): void {
        if (!this.uniformBuffer || !this.leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateInt(uniformName, value);
    }

    /**
     * Sets an int2 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int2.
     * @param y Second int in int2.
     */
    public setInt2(uniformName: string, x: number, y: number): void {
        if (!this.uniformBuffer || !this.leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateInt2(uniformName, x, y);
    }

    /**
     * Sets an int3 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int3.
     * @param y Second int in int3.
     * @param z Third int in int3.
     */
    public setInt3(uniformName: string, x: number, y: number, z: number): void {
        if (!this.uniformBuffer || !this.leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateInt3(uniformName, x, y, z);
    }

    /**
     * Sets an int4 value on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First int in int4.
     * @param y Second int in int4.
     * @param z Third int in int4.
     * @param w Fourth int in int4.
     */
    public setInt4(uniformName: string, x: number, y: number, z: number, w: number): void {
        if (!this.uniformBuffer || !this.leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateInt4(uniformName, x, y, z, w);
    }

    /**
     * Sets an int array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray(uniformName: string, array: Int32Array): void {
        if (!this.uniformBuffer || !this.leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateIntArray(uniformName, array);
    }

    /**
     * Sets an int array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray2(uniformName: string, array: Int32Array): void {
        this.setIntArray(uniformName, array);
    }

    /**
     * Sets an int array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray3(uniformName: string, array: Int32Array): void {
        this.setIntArray(uniformName, array);
    }

    /**
     * Sets an int array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setIntArray4(uniformName: string, array: Int32Array): void {
        this.setIntArray(uniformName, array);
    }

    /**
     * Sets an array on a uniform variable.
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray(uniformName: string, array: number[]): void {
        if (!this.uniformBuffer || !this.leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateArray(uniformName, array);
    }

    /**
     * Sets an array 2 on a uniform variable. (Array is specified as single array eg. [1,2,3,4] will result in [[1,2],[3,4]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray2(uniformName: string, array: number[]): void {
        this.setArray(uniformName, array);
    }

    /**
     * Sets an array 3 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6] will result in [[1,2,3],[4,5,6]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     * @returns this effect.
     */
    public setArray3(uniformName: string, array: number[]): void {
        this.setArray(uniformName, array);
    }

    /**
     * Sets an array 4 on a uniform variable. (Array is specified as single array eg. [1,2,3,4,5,6,7,8] will result in [[1,2,3,4],[5,6,7,8]] in the shader)
     * @param uniformName Name of the variable.
     * @param array array to be set.
     */
    public setArray4(uniformName: string, array: number[]): void {
        this.setArray(uniformName, array);
    }

    /**
     * Sets matrices on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrices matrices to be set.
     */
    public setMatrices(uniformName: string, matrices: Float32Array): void {
        if (!this.uniformBuffer || !this.leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateMatrices(uniformName, matrices);
    }

    /**
     * Sets matrix on a uniform variable.
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    public setMatrix(uniformName: string, matrix: IMatrixLike): void {
        if (!this.uniformBuffer || !this.leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateMatrix(uniformName, matrix);
    }

    /**
     * Sets a 3x3 matrix on a uniform variable. (Specified as [1,2,3,4,5,6,7,8,9] will result in [1,2,3][4,5,6][7,8,9] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    public setMatrix3x3(uniformName: string, matrix: Float32Array): void {
        if (!this.uniformBuffer || !this.leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateMatrix3x3(uniformName, matrix);
    }

    /**
     * Sets a 2x2 matrix on a uniform variable. (Specified as [1,2,3,4] will result in [1,2][3,4] matrix)
     * @param uniformName Name of the variable.
     * @param matrix matrix to be set.
     */
    public setMatrix2x2(uniformName: string, matrix: Float32Array): void {
        if (!this.uniformBuffer || !this.leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateMatrix2x2(uniformName, matrix);
    }

    /**
     * Sets a float on a uniform variable.
     * @param uniformName Name of the variable.
     * @param value value to be set.
     * @returns this effect.
     */
    public setFloat(uniformName: string, value: number): void {
        if (!this.uniformBuffer || !this.leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateFloat(uniformName, value);
    }

    /**
     * Sets a Vector2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector2 vector2 to be set.
     */
    public setVector2(uniformName: string, vector2: IVector2Like): void {
        this.setFloat2(uniformName, vector2.x, vector2.y);
    }

    /**
     * Sets a float2 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float2.
     * @param y Second float in float2.
     */
    public setFloat2(uniformName: string, x: number, y: number): void {
        if (!this.uniformBuffer || !this.leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateFloat2(uniformName, x, y);
    }

    /**
     * Sets a Vector3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector3 Value to be set.
     */
    public setVector3(uniformName: string, vector3: IVector3Like): void {
        this.setFloat3(uniformName, vector3.x, vector3.y, vector3.z);
    }

    /**
     * Sets a float3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float3.
     * @param y Second float in float3.
     * @param z Third float in float3.
     */
    public setFloat3(uniformName: string, x: number, y: number, z: number): void {
        if (!this.uniformBuffer || !this.leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateFloat3(uniformName, x, y, z);
    }

    /**
     * Sets a Vector4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param vector4 Value to be set.
     */
    public setVector4(uniformName: string, vector4: IVector4Like): void {
        this.setFloat4(uniformName, vector4.x, vector4.y, vector4.z, vector4.w);
    }

    /**
     * Sets a float4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param x First float in float4.
     * @param y Second float in float4.
     * @param z Third float in float4.
     * @param w Fourth float in float4.
     * @returns this effect.
     */
    public setFloat4(uniformName: string, x: number, y: number, z: number, w: number): void {
        if (!this.uniformBuffer || !this.leftOverUniformsByName[uniformName]) {
            return;
        }
        this.uniformBuffer.updateFloat4(uniformName, x, y, z, w);
    }

    /**
     * Sets a Color3 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     */
    public setColor3(uniformName: string, color3: IColor3Like): void {
        this.setFloat3(uniformName, color3.r, color3.g, color3.b);
    }

    /**
     * Sets a Color4 on a uniform variable.
     * @param uniformName Name of the variable.
     * @param color3 Value to be set.
     * @param alpha Alpha value to be set.
     */
    public setColor4(uniformName: string, color3: IColor3Like, alpha: number): void {
        this.setFloat4(uniformName, color3.r, color3.g, color3.b, alpha);
    }

    /**
     * Sets a Color4 on a uniform variable
     * @param uniformName defines the name of the variable
     * @param color4 defines the value to be set
     */
    public setDirectColor4(uniformName: string, color4: IColor4Like): void {
        this.setFloat4(uniformName, color4.r, color4.g, color4.b, color4.a);
    }

    public _getVertexShaderCode(): string | null {
        return this.sources?.vertex;
    }

    public _getFragmentShaderCode(): string | null {
        return this.sources?.fragment;
    }
}