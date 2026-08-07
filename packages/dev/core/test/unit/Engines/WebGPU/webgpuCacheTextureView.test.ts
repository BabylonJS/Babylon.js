import { describe, it, expect, beforeEach, vi } from "vitest";
import { WebGPUCacheTextureView } from "core/Engines/WebGPU/webgpuCacheTextureView";

type ViewDescriptor = Exclude<Parameters<GPUTexture["createView"]>[0], undefined>;

function createMockTexture(): GPUTexture {
    return {
        createView: vi.fn(() => ({}) as ReturnType<GPUTexture["createView"]>),
    } as unknown as GPUTexture;
}

function createDescriptor(overrides: Partial<ViewDescriptor> = {}): ViewDescriptor {
    return {
        format: "rgba8unorm",
        dimension: "2d",
        baseMipLevel: 0,
        mipLevelCount: 1,
        baseArrayLayer: 0,
        arrayLayerCount: 1,
        aspect: "all",
        ...overrides,
    } as ViewDescriptor;
}

describe("WebGPUCacheTextureView", () => {
    let cache: WebGPUCacheTextureView;

    beforeEach(() => {
        cache = new WebGPUCacheTextureView();
    });

    it("should create a view on cache miss", () => {
        const texture = createMockTexture();
        const descriptor = createDescriptor();

        const view = cache.getView(texture, descriptor);

        expect(view).toBeDefined();
        expect(texture.createView).toHaveBeenCalledTimes(1);
        expect(texture.createView).toHaveBeenCalledWith(descriptor);
    });

    it("should return the cached view on a second call with the same descriptor", () => {
        const texture = createMockTexture();
        const descriptor = createDescriptor();

        const view1 = cache.getView(texture, descriptor);
        const view2 = cache.getView(texture, createDescriptor());

        expect(view2).toBe(view1);
        expect(texture.createView).toHaveBeenCalledTimes(1);
    });

    it("should create a new view when a descriptor field changes", () => {
        const texture = createMockTexture();

        const view1 = cache.getView(texture, createDescriptor({ baseArrayLayer: 0 }));
        const view2 = cache.getView(texture, createDescriptor({ baseArrayLayer: 1 }));

        expect(view2).not.toBe(view1);
        expect(texture.createView).toHaveBeenCalledTimes(2);
    });

    it("should not share cache entries between different textures", () => {
        const textureA = createMockTexture();
        const textureB = createMockTexture();
        const descriptor = createDescriptor();

        cache.getView(textureA, descriptor);
        cache.getView(textureB, descriptor);

        expect(textureA.createView).toHaveBeenCalledTimes(1);
        expect(textureB.createView).toHaveBeenCalledTimes(1);
    });
});
