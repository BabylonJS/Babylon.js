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
    // a texture has few views, so they are found by comparing the descriptors' fields: a lookup allocates nothing
    private _cache = new WeakMap<GPUTexture, Array<{ descriptor: GPUTextureViewDescriptor; view: GPUTextureView }>>();

    public getView(texture: GPUTexture, descriptor: GPUTextureViewDescriptor): GPUTextureView {
        let viewsForTexture = this._cache.get(texture);
        if (!viewsForTexture) {
            viewsForTexture = [];
            this._cache.set(texture, viewsForTexture);
        }

        for (let i = 0; i < viewsForTexture.length; i++) {
            const entry = viewsForTexture[i];
            if (WebGPUCacheTextureView._SameView(entry.descriptor, descriptor)) {
                return entry.view;
            }
        }

        const view = texture.createView(descriptor);
        // a copy: the callers reuse their descriptors for other views
        viewsForTexture.push({ descriptor: { ...descriptor }, view });

        return view;
    }

    private static _SameView(a: GPUTextureViewDescriptor, b: GPUTextureViewDescriptor): boolean {
        return (
            a.format === b.format &&
            a.dimension === b.dimension &&
            a.baseMipLevel === b.baseMipLevel &&
            a.mipLevelCount === b.mipLevelCount &&
            a.baseArrayLayer === b.baseArrayLayer &&
            a.arrayLayerCount === b.arrayLayerCount &&
            a.aspect === b.aspect &&
            a.usage === b.usage &&
            a.swizzle === b.swizzle
        );
    }
}
