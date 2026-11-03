import { describe, expect, it, vi } from "vitest";
import { type AbstractEngine } from "core/Engines/abstractEngine";
import { NullEngine } from "core/Engines/nullEngine";
import { Effect } from "core/Materials/effect";
import { ImageSourceBlock } from "core/Materials/Node/Blocks/Dual/imageSourceBlock";
import { TextureBlock } from "core/Materials/Node/Blocks/Dual/textureBlock";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { NodeMaterialBuildState } from "core/Materials/Node/nodeMaterialBuildState";
import { NodeMaterialBuildStateSharedData } from "core/Materials/Node/nodeMaterialBuildStateSharedData";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { type Texture } from "core/Materials/Textures/texture";
import { ThinTexture } from "core/Materials/Textures/thinTexture";
import { Scene } from "core/scene";

describe("TextureBlock", () => {
    it.each([
        ["GLSL", ShaderLanguage.GLSL, "toGammaSpace"],
        ["WGSL", ShaderLanguage.WGSL, "toGammaSpaceVec3"],
    ])("writes both conversions of a gamma space texture's color under their defines, which follow its image (%s)", (_, shaderLanguage, toGammaSpace) => {
        const state = new NodeMaterialBuildState();
        state.sharedData = new NodeMaterialBuildStateSharedData();
        state.sharedData.nodeMaterial = { shaderLanguage } as NodeMaterial;
        const block = new TextureBlock("texture");
        block.texture = { gammaSpace: true, getScene: () => null } as unknown as Texture;
        Object.assign(block, { _linearDefineName: "ISLINEAR", _gammaDefineName: "ISGAMMA" });
        block.rgb.associatedVariableName = "rgb";

        block["_generateConversionCode"](state, block.rgb, "rgb");

        // the image can become linear (Texture.replaceImage) without building the graph again
        expect(state.compilationString).toMatch(new RegExp(`#ifdef ISLINEAR\\s+rgb = ${toGammaSpace}\\(rgb\\);\\s+#endif`));
        expect(state.compilationString).toMatch(/#ifdef ISGAMMA\s+rgb = toLinearSpace\w*\(rgb\);\s+#endif/);
    });

    it("binds a default texture for missing texture resources on WebGPU", () => {
        let engine: AbstractEngine;
        const emptyTexture = { getEngine: () => engine };
        engine = {
            isWebGPU: true,
            emptyTexture,
        } as unknown as AbstractEngine;
        const setTexture = vi.fn();
        const effect = {
            getEngine: () => engine,
            setTexture,
            setFloat: vi.fn(),
            setMatrix: vi.fn(),
        } as unknown as Effect;
        const block = new TextureBlock("test");

        Object.assign(block, { _samplerName: "testTexture" });

        block.bind(effect);

        expect(setTexture).toHaveBeenCalledWith("testTexture", expect.any(ThinTexture));
        expect((setTexture.mock.calls[0][1] as ThinTexture).getInternalTexture()).toBe(emptyTexture);
    });

    it("does not bind a default texture for missing texture resources outside WebGPU", () => {
        const effect = {
            getEngine: () => ({ isWebGPU: false }),
            setTexture: vi.fn(),
            setFloat: vi.fn(),
            setMatrix: vi.fn(),
        } as unknown as Effect;
        const block = new TextureBlock("test");

        Object.assign(block, { _samplerName: "testTexture" });

        block.bind(effect);

        expect(effect.setTexture).not.toHaveBeenCalled();
    });

    it("binds a default texture for missing image source resources on WebGPU", () => {
        let engine: AbstractEngine;
        const emptyTexture = { getEngine: () => engine };
        engine = {
            isWebGPU: true,
            emptyTexture,
        } as unknown as AbstractEngine;
        const setTexture = vi.fn();
        const effect = {
            getEngine: () => engine,
            setTexture,
        } as unknown as Effect;
        const block = new ImageSourceBlock("test");

        Object.assign(block, { _samplerName: "testTexture" });

        block.bind(effect, {} as NodeMaterial);

        expect(setTexture).toHaveBeenCalledWith("testTexture", expect.any(ThinTexture));
        expect((setTexture.mock.calls[0][1] as ThinTexture).getInternalTexture()).toBe(emptyTexture);
    });

    it("binds the image source texture dimensions to its WebGL1 uniform", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);

        try {
            const block = new ImageSourceBlock("image");
            block.texture = RawTexture.CreateRGBATexture(new Uint8Array(256 * 128 * 4), 256, 128, scene, false);
            Object.assign(block, { _samplerName: "imageSampler", _dimensionsUniformName: "textureDimensions" });

            const effect = new Effect({ vertexSource: "void main() {}", fragmentSource: "void main() {}" }, [], ["textureDimensions"], ["imageSampler"], engine);
            const setFloat2 = vi.spyOn(effect, "setFloat2").mockReturnValue(effect);

            block.bind(effect, new NodeMaterial("material", scene));

            expect(setFloat2).toHaveBeenCalledExactlyOnceWith("textureDimensions", 256, 128);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
