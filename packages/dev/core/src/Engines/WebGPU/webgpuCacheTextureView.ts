/* eslint-disable babylonjs/available */

/**
 * Caches GPUTextureView objects so that render-pass attachments (color, MSAA resolve, depth/stencil)
 * don't recreate a fresh view every time a render target is bound/cleared.
 * Views are keyed on the live GPUTexture object via a WeakMap: once a texture is recreated (e.g. on resize)
 * the old texture becomes unreachable and its cached views are collected along with it, so no manual
 * invalidation is required.
 * @internal
 */
export class WebGPUCacheTextureView {
    private _cache = new WeakMap<GPUTexture, Map<string, GPUTextureView>>();

    public getView(texture: GPUTexture, descriptor: GPUTextureViewDescriptor): GPUTextureView {
        let viewsForTexture = this._cache.get(texture);
        if (!viewsForTexture) {
            viewsForTexture = new Map();
            this._cache.set(texture, viewsForTexture);
        }

        const key = WebGPUCacheTextureView._GetKey(descriptor);
        let view = viewsForTexture.get(key);
        if (!view) {
            view = texture.createView(descriptor);
            viewsForTexture.set(key, view);
        }

        return view;
    }

    private static _GetKey(descriptor: GPUTextureViewDescriptor): string {
        return `${descriptor.format}_${descriptor.dimension}_${descriptor.baseMipLevel}_${descriptor.mipLevelCount}_${descriptor.baseArrayLayer}_${descriptor.arrayLayerCount}_${descriptor.aspect}_${descriptor.usage}_${descriptor.swizzle}`;
    }
}
