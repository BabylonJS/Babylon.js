import { ThinEngine } from "../../Engines/thinEngine";
import { FloatArray, Nullable } from '../../types';
import { DataBuffer } from '../../Meshes/dataBuffer';
import { WebGLDataBuffer } from '../../Meshes/WebGL/webGLDataBuffer';
import { IPipelineContext } from '../IPipelineContext';
import { WebGLPipelineContext } from '../WebGL/webGLPipelineContext';

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Create an uniform buffer
         * @see https://doc.babylonjs.com/features/webgl2#uniform-buffer-objets
         * @param elements defines the content of the uniform buffer
         * @returns the webGL uniform buffer
         */
        createUniformBuffer(elements: FloatArray): DataBuffer;

        /**
         * Create a dynamic uniform buffer
         * @see https://doc.babylonjs.com/features/webgl2#uniform-buffer-objets
         * @param elements defines the content of the uniform buffer
         * @returns the webGL uniform buffer
         */
        createDynamicUniformBuffer(elements: FloatArray): DataBuffer;

        /**
         * Update an existing uniform buffer
         * @see https://doc.babylonjs.com/features/webgl2#uniform-buffer-objets
         * @param uniformBuffer defines the target uniform buffer
         * @param elements defines the content to update
         * @param offset defines the offset in the uniform buffer where update should start
         * @param count defines the size of the data to update
         */
        updateUniformBuffer(uniformBuffer: DataBuffer, elements: FloatArray, offset?: number, count?: number): void;

        /**
         * Bind an uniform buffer to the current webGL context
         * @param buffer defines the buffer to bind
         */
        bindUniformBuffer(buffer: Nullable<DataBuffer>): void;

        /**
         * Bind a buffer to the current webGL context at a given location
         * @param buffer defines the buffer to bind
         * @param location defines the index where to bind the buffer
         */
        bindUniformBufferBase(buffer: DataBuffer, location: number): void;

         /**
          * Bind a specific block at a given index in a specific shader program
          * @param pipelineContext defines the pipeline context to use
          * @param blockName defines the block name
          * @param index defines the index where to bind the block
          */
        bindUniformBlock(pipelineContext: IPipelineContext, blockName: string, index: number): void;
    }
}

ThinEngine.prototype.createUniformBuffer = function(elements: FloatArray): DataBuffer {
    var ubo = this._gl.createBuffer();

    if (!ubo) {
        throw new Error("Unable to create uniform buffer");
    }
    let result = new WebGLDataBuffer(ubo);

    this.bindUniformBuffer(result);

    if (elements instanceof Float32Array) {
        this._gl.bufferData(this._gl.UNIFORM_BUFFER, <Float32Array>elements, this._gl.STATIC_DRAW);
    } else {
        this._gl.bufferData(this._gl.UNIFORM_BUFFER, new Float32Array(<number[]>elements), this._gl.STATIC_DRAW);
    }

    this.bindUniformBuffer(null);

    result.references = 1;
    return result;
};

ThinEngine.prototype.createDynamicUniformBuffer = function(elements: FloatArray): DataBuffer {
    var ubo = this._gl.createBuffer();

    if (!ubo) {
        throw new Error("Unable to create dynamic uniform buffer");
    }

    let result = new WebGLDataBuffer(ubo);
    this.bindUniformBuffer(result);

    if (elements instanceof Float32Array) {
        this._gl.bufferData(this._gl.UNIFORM_BUFFER, <Float32Array>elements, this._gl.DYNAMIC_DRAW);
    } else {
        this._gl.bufferData(this._gl.UNIFORM_BUFFER, new Float32Array(<number[]>elements), this._gl.DYNAMIC_DRAW);
    }

    this.bindUniformBuffer(null);

    result.references = 1;
    return result;
};

ThinEngine.prototype.updateUniformBuffer = function(uniformBuffer: DataBuffer, elements: FloatArray, offset?: number, count?: number): void {
   this.bindUniformBuffer(uniformBuffer);

   if (offset === undefined) {
       offset = 0;
   }

   if (count === undefined) {
       if (elements instanceof Float32Array) {
           this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, offset, <Float32Array>elements);
       } else {
           this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, offset, new Float32Array(<number[]>elements));
       }
   } else {
       if (elements instanceof Float32Array) {
           this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, 0, <Float32Array>elements.subarray(offset, offset + count));
       } else {
           this._gl.bufferSubData(this._gl.UNIFORM_BUFFER, 0, new Float32Array(<number[]>elements).subarray(offset, offset + count));
       }
   }

   this.bindUniformBuffer(null);
};

ThinEngine.prototype.bindUniformBuffer = function(buffer: Nullable<DataBuffer>): void {
    this._gl.bindBuffer(this._gl.UNIFORM_BUFFER, buffer ? buffer.underlyingResource : null);
};

ThinEngine.prototype.bindUniformBufferBase = function(buffer: DataBuffer, location: number): void {
    this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER, location, buffer ? buffer.underlyingResource : null);
};

ThinEngine.prototype.bindUniformBlock = function(pipelineContext: IPipelineContext, blockName: string, index: number): void {
    let program = (pipelineContext as WebGLPipelineContext).program!;

    var uniformLocation = this._gl.getUniformBlockIndex(program, blockName);

    this._gl.uniformBlockBinding(program, uniformLocation, index);
};