import { UniformBuffer } from "../Materials/uniformBuffer";
import { ThinTexture } from "../Materials/Textures/thinTexture";
import { Buffer } from "../Meshes/buffer";

export interface IComputeShader {
 
    setShader(shaderName: string): void;

    setTexture(name: { group: number, binding: number } | string, texture: ThinTexture): void;

    setStorageTexture(name: { group: number, binding: number } | string, texture: ThinTexture, readOnly: boolean): void;

    setUniformBuffer(name: { group: number, binding: number } | string, buffer: UniformBuffer): void;

    setStorageBuffer(name: { group: number, binding: number } | string, buffer: Buffer, readOnly?: boolean): void;

    dispatch(x: number, y?: number, z?: number): void;

}