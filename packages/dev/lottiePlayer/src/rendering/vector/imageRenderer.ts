// Image renderer — decodes each asset (possibly a data: URI) into a texture and draws every image
// layer (ty 2) as a textured quad. A thin adapter over the shared textured-quad renderer: it owns
// the per-asset textures and their async decode; all GL plumbing lives in texturedQuad.ts.

// Registers the file/image loaders on the engine's injection seam; without it createTexture throws.
import "core/Misc/fileTools";

import { Constants } from "core/Engines/constants";
import { Logger } from "core/Misc/logger";
import { ThinTexture } from "core/Materials/Textures/thinTexture";
import { type InternalTexture } from "core/Materials/Textures/internalTexture";
import { type Nullable } from "core/types";
import { type ThinEngine } from "core/Engines/thinEngine";

import { type ILayerRenderer } from "./layerRenderer";
import { type IParsedAsset, type IParsedLayer } from "../../animation/parse";
import { CreateTexturedQuadRenderer, type IQuadRect } from "./texturedQuad";

/** An asset texture and the internal texture whose decode readiness gates the first frame. */
interface IAssetTexture {
    texture: ThinTexture;
    internal: InternalTexture;
    /** Set when the decode failed; the layer is then skipped instead of blocking readiness. */
    failed: boolean;
}

/**
 * Creates the image-layer renderer. Kicks off async decode of every asset's image; readiness waits
 * for all of them, so the first painted frame shows images rather than blank quads.
 * @param engine The engine to render with.
 * @param assets The animation's image assets.
 * @returns A layer renderer for Lottie image layers (`ty === 2`).
 */
export function CreateImageRenderer(engine: ThinEngine, assets: readonly IParsedAsset[]): ILayerRenderer {
    // One texture per asset (indexed by assetIndex). An empty `src` paints nothing.
    const textures: Nullable<IAssetTexture>[] = assets.map((asset) => {
        if (!asset.src) {
            return null;
        }
        const entry: IAssetTexture = { texture: null as unknown as ThinTexture, internal: null as unknown as InternalTexture, failed: false };
        const onError = (message?: string): void => {
            // A broken asset must not stall readiness, or the whole animation never paints.
            entry.failed = true;
            Logger.Warn(`Lottie image asset failed to load and will be skipped: ${message ?? asset.src}`);
        };
        // invertY false: the quad's uv origin is its top-left, matching the decoded image's first row.
        entry.internal = engine.createTexture(asset.src, true, false, null, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, null, onError);
        entry.texture = new ThinTexture(entry.internal);
        return entry;
    });

    return CreateTexturedQuadRenderer(engine, {
        kind: 2,
        ready: () => textures.every((t) => t === null || t.failed || t.internal.isReady),
        fillRect(layer: IParsedLayer, rect: IQuadRect): boolean {
            const image = layer.image;
            const entry = image ? textures[image.assetIndex] : null;
            if (!image || !entry || entry.failed) {
                return false;
            }
            // Local image rect (0,0)-(w,h); the shared renderer maps it to screen.
            rect.left = 0;
            rect.top = 0;
            rect.width = image.width;
            rect.height = image.height;
            return true;
        },
        textureFor: (layer) => {
            const entry = layer.image ? textures[layer.image.assetIndex] : null;
            return entry && !entry.failed ? entry.texture : null;
        },
        disposeTextures() {
            for (let i = 0; i < textures.length; i++) {
                textures[i]?.texture.dispose();
                textures[i] = null;
            }
        },
    });
}
