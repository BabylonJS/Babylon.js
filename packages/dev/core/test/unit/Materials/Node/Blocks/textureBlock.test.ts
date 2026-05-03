import { describe, expect, it, vi } from "vitest";
import { type AbstractEngine } from "core/Engines/abstractEngine";
import { type Effect } from "core/Materials/effect";
import { ImageSourceBlock } from "core/Materials/Node/Blocks/Dual/imageSourceBlock";
import { TextureBlock } from "core/Materials/Node/Blocks/Dual/textureBlock";
import { type NodeMaterial } from "core/Materials/Node/nodeMaterial";
import { ThinTexture } from "core/Materials/Textures/thinTexture";

describe("TextureBlock", () => {
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
});
