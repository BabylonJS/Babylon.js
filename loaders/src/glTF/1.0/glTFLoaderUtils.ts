﻿import { IGLTFTechniqueParameter, EParameterType, ETextureWrapMode, IGLTFAccessor, ETextureFilterType, IGLTFRuntime, IGLTFBufferView, EComponentType } from "./glTFLoaderInterfaces";

import { Nullable } from "babylonjs/types";
import { Vector2, Vector3, Vector4, Matrix } from "babylonjs/Maths/math.vector";
import { Color4 } from 'babylonjs/Maths/math.color';
import { Effect } from "babylonjs/Materials/effect";
import { ShaderMaterial } from "babylonjs/Materials/shaderMaterial";
import { Texture } from "babylonjs/Materials/Textures/texture";
import { Node } from "babylonjs/node";
import { Scene } from "babylonjs/scene";

/**
* Utils functions for GLTF
* @hidden
*/
export class GLTFUtils {
    /**
     * Sets the given "parameter" matrix
     * @param scene: the Scene object
     * @param source: the source node where to pick the matrix
     * @param parameter: the GLTF technique parameter
     * @param uniformName: the name of the shader's uniform
     * @param shaderMaterial: the shader material
     */
    public static SetMatrix(scene: Scene, source: Node, parameter: IGLTFTechniqueParameter, uniformName: string, shaderMaterial: ShaderMaterial | Effect): void {
        var mat: Nullable<Matrix> = null;

        if (parameter.semantic === "MODEL") {
            mat = source.getWorldMatrix();
        }
        else if (parameter.semantic === "PROJECTION") {
            mat = scene.getProjectionMatrix();
        }
        else if (parameter.semantic === "VIEW") {
            mat = scene.getViewMatrix();
        }
        else if (parameter.semantic === "MODELVIEWINVERSETRANSPOSE") {
            mat = Matrix.Transpose(source.getWorldMatrix().multiply(scene.getViewMatrix()).invert());
        }
        else if (parameter.semantic === "MODELVIEW") {
            mat = source.getWorldMatrix().multiply(scene.getViewMatrix());
        }
        else if (parameter.semantic === "MODELVIEWPROJECTION") {
            mat = source.getWorldMatrix().multiply(scene.getTransformMatrix());
        }
        else if (parameter.semantic === "MODELINVERSE") {
            mat = source.getWorldMatrix().invert();
        }
        else if (parameter.semantic === "VIEWINVERSE") {
            mat = scene.getViewMatrix().invert();
        }
        else if (parameter.semantic === "PROJECTIONINVERSE") {
            mat = scene.getProjectionMatrix().invert();
        }
        else if (parameter.semantic === "MODELVIEWINVERSE") {
            mat = source.getWorldMatrix().multiply(scene.getViewMatrix()).invert();
        }
        else if (parameter.semantic === "MODELVIEWPROJECTIONINVERSE") {
            mat = source.getWorldMatrix().multiply(scene.getTransformMatrix()).invert();
        }
        else if (parameter.semantic === "MODELINVERSETRANSPOSE") {
            mat = Matrix.Transpose(source.getWorldMatrix().invert());
        }
        else {
            debugger;
        }

        if (mat) {
            switch (parameter.type) {
                case EParameterType.FLOAT_MAT2: shaderMaterial.setMatrix2x2(uniformName, Matrix.GetAsMatrix2x2(mat)); break;
                case EParameterType.FLOAT_MAT3: shaderMaterial.setMatrix3x3(uniformName, Matrix.GetAsMatrix3x3(mat)); break;
                case EParameterType.FLOAT_MAT4: shaderMaterial.setMatrix(uniformName, mat); break;
                default: break;
            }
        }
    }

    /**
     * Sets the given "parameter" matrix
     * @param shaderMaterial: the shader material
     * @param uniform: the name of the shader's uniform
     * @param value: the value of the uniform
     * @param type: the uniform's type (EParameterType FLOAT, VEC2, VEC3 or VEC4)
     */
    public static SetUniform(shaderMaterial: ShaderMaterial | Effect, uniform: string, value: any, type: number): boolean {
        switch (type) {
            case EParameterType.FLOAT: shaderMaterial.setFloat(uniform, value); return true;
            case EParameterType.FLOAT_VEC2: shaderMaterial.setVector2(uniform, Vector2.FromArray(value)); return true;
            case EParameterType.FLOAT_VEC3: shaderMaterial.setVector3(uniform, Vector3.FromArray(value)); return true;
            case EParameterType.FLOAT_VEC4: shaderMaterial.setVector4(uniform, Vector4.FromArray(value)); return true;
            default: return false;
        }
    }

    /**
    * Returns the wrap mode of the texture
    * @param mode: the mode value
    */
    public static GetWrapMode(mode: number): number {
        switch (mode) {
            case ETextureWrapMode.CLAMP_TO_EDGE: return Texture.CLAMP_ADDRESSMODE;
            case ETextureWrapMode.MIRRORED_REPEAT: return Texture.MIRROR_ADDRESSMODE;
            case ETextureWrapMode.REPEAT: return Texture.WRAP_ADDRESSMODE;
            default: return Texture.WRAP_ADDRESSMODE;
        }
    }

    /**
     * Returns the byte stride giving an accessor
     * @param accessor: the GLTF accessor objet
     */
    public static GetByteStrideFromType(accessor: IGLTFAccessor): number {
        // Needs this function since "byteStride" isn't requiered in glTF format
        var type = accessor.type;

        switch (type) {
            case "VEC2": return 2;
            case "VEC3": return 3;
            case "VEC4": return 4;
            case "MAT2": return 4;
            case "MAT3": return 9;
            case "MAT4": return 16;
            default: return 1;
        }
    }

    /**
     * Returns the texture filter mode giving a mode value
     * @param mode: the filter mode value
     */
    public static GetTextureFilterMode(mode: number): ETextureFilterType {
        switch (mode) {
            case ETextureFilterType.LINEAR:
            case ETextureFilterType.LINEAR_MIPMAP_NEAREST:
            case ETextureFilterType.LINEAR_MIPMAP_LINEAR: return Texture.TRILINEAR_SAMPLINGMODE;
            case ETextureFilterType.NEAREST:
            case ETextureFilterType.NEAREST_MIPMAP_NEAREST: return Texture.NEAREST_SAMPLINGMODE;
            default: return Texture.BILINEAR_SAMPLINGMODE;
        }
    }

    public static GetBufferFromBufferView(gltfRuntime: IGLTFRuntime, bufferView: IGLTFBufferView, byteOffset: number, byteLength: number, componentType: EComponentType): ArrayBufferView {
        var byteOffset = bufferView.byteOffset + byteOffset;

        var loadedBufferView = gltfRuntime.loadedBufferViews[bufferView.buffer];
        if (byteOffset + byteLength > loadedBufferView.byteLength) {
            throw new Error("Buffer access is out of range");
        }

        var buffer = loadedBufferView.buffer;
        byteOffset += loadedBufferView.byteOffset;

        switch (componentType) {
            case EComponentType.BYTE: return new Int8Array(buffer, byteOffset, byteLength);
            case EComponentType.UNSIGNED_BYTE: return new Uint8Array(buffer, byteOffset, byteLength);
            case EComponentType.SHORT: return new Int16Array(buffer, byteOffset, byteLength);
            case EComponentType.UNSIGNED_SHORT: return new Uint16Array(buffer, byteOffset, byteLength);
            default: return new Float32Array(buffer, byteOffset, byteLength);
        }
    }

    /**
     * Returns a buffer from its accessor
     * @param gltfRuntime: the GLTF runtime
     * @param accessor: the GLTF accessor
     */
    public static GetBufferFromAccessor(gltfRuntime: IGLTFRuntime, accessor: IGLTFAccessor): any {
        var bufferView: IGLTFBufferView = gltfRuntime.bufferViews[accessor.bufferView];
        var byteLength = accessor.count * GLTFUtils.GetByteStrideFromType(accessor);
        return GLTFUtils.GetBufferFromBufferView(gltfRuntime, bufferView, accessor.byteOffset, byteLength, accessor.componentType);
    }

    /**
     * Decodes a buffer view into a string
     * @param view: the buffer view
     */
    public static DecodeBufferToText(view: ArrayBufferView): string {
        var result = "";
        var length = view.byteLength;

        for (var i = 0; i < length; ++i) {
            result += String.fromCharCode((<any>view)[i]);
        }

        return result;
    }

    /**
     * Returns the default material of gltf. Related to
     * https://github.com/KhronosGroup/glTF/tree/master/specification/1.0#appendix-a-default-material
     * @param scene: the Babylon.js scene
     */
    public static GetDefaultMaterial(scene: Scene): ShaderMaterial {
        if (!GLTFUtils._DefaultMaterial) {
            Effect.ShadersStore["GLTFDefaultMaterialVertexShader"] = [
                "precision highp float;",
                "",
                "uniform mat4 worldView;",
                "uniform mat4 projection;",
                "",
                "attribute vec3 position;",
                "",
                "void main(void)",
                "{",
                "    gl_Position = projection * worldView * vec4(position, 1.0);",
                "}"
            ].join("\n");

            Effect.ShadersStore["GLTFDefaultMaterialPixelShader"] = [
                "precision highp float;",
                "",
                "uniform vec4 u_emission;",
                "",
                "void main(void)",
                "{",
                "    gl_FragColor = u_emission;",
                "}"
            ].join("\n");

            var shaderPath = {
                vertex: "GLTFDefaultMaterial",
                fragment: "GLTFDefaultMaterial"
            };

            var options = {
                attributes: ["position"],
                uniforms: ["worldView", "projection", "u_emission"],
                samplers: new Array<string>(),
                needAlphaBlending: false
            };

            GLTFUtils._DefaultMaterial = new ShaderMaterial("GLTFDefaultMaterial", scene, shaderPath, options);
            GLTFUtils._DefaultMaterial.setColor4("u_emission", new Color4(0.5, 0.5, 0.5, 1.0));
        }

        return GLTFUtils._DefaultMaterial;
    }

    // The GLTF default material
    private static _DefaultMaterial: Nullable<ShaderMaterial> = null;
}