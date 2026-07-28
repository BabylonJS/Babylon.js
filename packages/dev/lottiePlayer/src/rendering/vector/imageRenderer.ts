// Image renderer — decodes each asset (possibly a data: URI) into a texture and draws every image
// layer (ty 2) as a textured quad. A thin adapter over the shared textured-quad renderer: it owns
// the per-asset textures and their async decode; all GL plumbing lives in texturedQuad.ts.

// Registers the file/image loaders on the engine's injection seam; without it createTexture throws.
import "core/Misc/fileTools";

import { Constants } from "core/Engines/constants";
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
        // invertY false: the quad's uv origin is its top-left, matching the decoded image's first row.
        const internal = engine.createTexture(asset.src, true, false, null, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
        return { texture: new ThinTexture(internal), internal };
    });

    return CreateTexturedQuadRenderer(engine, {
        kind: 2,
        ready: () => textures.every((t) => t === null || t.internal.isReady),
        fillRect(layer: IParsedLayer, rect: IQuadRect): boolean {
            const image = layer.image;
            if (!image || !textures[image.assetIndex]) {
                return false;
            }
            // Local image rect (0,0)-(w,h); the shared renderer maps it to screen.
            rect.left = 0;
            rect.top = 0;
            rect.width = image.width;
            rect.height = image.height;
            return true;
        },
        textureFor: (layer) => (layer.image ? (textures[layer.image.assetIndex]?.texture ?? null) : null),
        disposeTextures() {
            for (const entry of textures) {
                entry?.texture.dispose();
            }
        },
    });
}
