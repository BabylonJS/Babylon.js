import { Tools } from "core/Misc/tools.pure";

import { type USDLoadingOptions } from "../usdLoadingOptions";
import { FreezeResolvedStage, type IResolvedStage, type IResolvedDiagnostic, type ResolvedDiagnosticSeverity, type IResolvedTexture } from "./resolvedStage";
import { type ISdfLayer } from "./sdf/index";
import { ReadListOpItems } from "./sdf/sdfListOp";
import { type ISdfCompositionFields, type ISdfPrimSpec } from "./sdf/sdfSpec";
import { ParseUsda } from "./parser/usda/usdaParser";
import { ComposeLayerStack, type ICompositionDiagnostic, type IComposeLayerStackOptions } from "./composition/composeLayerStack";
import { MapLayerToResolvedStage } from "./mapping/stageMapper";
import { ParseCrate } from "./parser/crate/crateReader";
import { ReadUsdzArchive } from "./parser/usdzArchive";
import { ValidateResourceLimit } from "../usdErrors";
import { ResolveAssetIdentifier } from "./assetPath";

/** The concrete on-disk USD container format, sniffed from magic bytes rather than the file extension. */
export type UsdFormat = "usda" | "usdc" | "usdz";

const CrateMagic = [0x50, 0x58, 0x52, 0x2d, 0x55, 0x53, 0x44, 0x43]; // "PXR-USDC"
const ZipMagic = [0x50, 0x4b]; // "PK"

/**
 * Loads the raw bytes (or text) of an external USD layer addressed by a fully-resolved identifier.
 *
 * Isolating file IO behind this callback keeps composition and mapping pure and synchronous, and lets
 * tests drive multi-layer composition from an in-memory layer set without touching the network.
 */
export type FetchUsdAsset = (resolvedIdentifier: string) => Promise<ArrayBuffer | string>;

/**
 * Detects the USD container format from raw bytes (or a string, which is always treated as ASCII USDA).
 * A `.usd` file may be ASCII or binary crate, so detection is always done from content, never the extension.
 * @param data the raw file data
 * @returns the detected format and, for ASCII input, the decoded text
 */
export function DetectUsdFormat(data: ArrayBuffer | string): { format: UsdFormat; text?: string } {
    if (typeof data === "string") {
        return { format: "usda", text: data };
    }

    const bytes = new Uint8Array(data);
    if (bytes.length >= CrateMagic.length && CrateMagic.every((value, index) => bytes[index] === value)) {
        return { format: "usdc" };
    }
    if (bytes.length >= ZipMagic.length && ZipMagic.every((value, index) => bytes[index] === value)) {
        return { format: "usdz" };
    }

    return { format: "usda", text: new TextDecoder().decode(bytes) };
}

/**
 * Resolves raw USD data into a fully-resolved {@link IResolvedStage}.
 *
 * This is the single entry point of the USD resolution layer. It detects the container format and
 * drives parsing, composition (LIVERPS) and stage/time evaluation. The returned stage is pure data:
 * every USD semantic has been resolved, so the Babylon adapter performs no further USD reasoning.
 *
 * @param data the raw USD data (ArrayBuffer for binary/usdz, string for ASCII usda)
 * @param rootUrl root url to resolve external assets against
 * @param fileName name of the file being loaded, used for diagnostics
 * @param options loader options (used by the USDZ/crate readers)
 * @returns a promise resolving to the fully-resolved stage
 */
export async function ResolveUsdStageAsync(
    data: ArrayBuffer | string,
    rootUrl: string,
    fileName: string | undefined,
    options: Readonly<USDLoadingOptions>
): Promise<IResolvedStage> {
    return await ResolveUsdStageWithFetcherAsync(data, rootUrl, fileName, options, async (identifier) => await Tools.LoadFileAsync(identifier, true));
}

/**
 * Resolution pipeline with an injectable external-layer fetcher. The public {@link ResolveUsdStageAsync}
 * supplies a Babylon file-IO fetcher; tests can supply an in-memory one to exercise multi-layer
 * composition deterministically and offline.
 * @param data the raw USD data
 * @param rootUrl root url external assets are resolved against
 * @param fileName name of the file being loaded
 * @param options loader options (used by the USDZ/crate readers)
 * @param fetchAsset callback fetching an external layer's bytes by resolved identifier
 * @returns a promise resolving to the fully-resolved stage
 */
export async function ResolveUsdStageWithFetcherAsync(
    data: ArrayBuffer | string,
    rootUrl: string,
    fileName: string | undefined,
    options: Readonly<USDLoadingOptions>,
    fetchAsset: FetchUsdAsset
): Promise<IResolvedStage> {
    const diagnostics: IResolvedDiagnostic[] = [];
    const compositionOptions = ResolveCompositionOptions(options);
    const detected = DetectUsdFormat(data);
    const rootIdentifier = `${rootUrl ?? ""}${fileName ?? "stage.usda"}`;

    if (detected.format === "usdz") {
        return await ResolveUsdzStageAsync(data as ArrayBuffer, rootIdentifier, options, compositionOptions, fetchAsset, diagnostics);
    }

    const rootLayer = detected.format === "usdc" ? ParseCrate(data as ArrayBuffer, rootIdentifier) : ParseUsda(detected.text ?? "", rootIdentifier);
    return FreezeResolvedStage(await ComposeAndMapStageAsync(rootLayer, fetchAsset, compositionOptions, diagnostics));
}

// Extracts and validates the composition resource limits from the loader options at the public
// boundary, so an invalid configuration fails fast before any parsing or composition work.
// ComposeLayerStack validates again defensively at the direct API seam.
function ResolveCompositionOptions(options: Readonly<USDLoadingOptions>): IComposeLayerStackOptions {
    const composition: IComposeLayerStackOptions = {};
    if (options.maxCompositionNodes !== undefined) {
        composition.maxCompositionNodes = ValidateResourceLimit(options.maxCompositionNodes, "maxCompositionNodes");
    }
    if (options.maxCompositionDepth !== undefined) {
        composition.maxCompositionDepth = ValidateResourceLimit(options.maxCompositionDepth, "maxCompositionDepth");
    }
    if (options.maxCompositionWork !== undefined) {
        composition.maxCompositionWork = ValidateResourceLimit(options.maxCompositionWork, "maxCompositionWork");
    }
    return composition;
}

// Unzips a USDZ archive, parses its inner root layer (USDA or USDC), and composes the stage with a
// fetcher that resolves sibling layer references from the archive's embedded assets before falling
// back to the host fetcher. This lets a self-contained USDZ compose its inner layer stack offline.
async function ResolveUsdzStageAsync(
    data: ArrayBuffer,
    rootIdentifier: string,
    options: Readonly<USDLoadingOptions>,
    compositionOptions: IComposeLayerStackOptions,
    fetchAsset: FetchUsdAsset,
    diagnostics: IResolvedDiagnostic[]
): Promise<IResolvedStage> {
    const archive = await ReadUsdzArchive(data, options.fflate, options.deflateURL);
    const innerIdentifier = archive.rootLayer.fileName;
    const innerDetected = DetectUsdFormat(archive.rootLayer.data);

    let rootLayer: ISdfLayer;
    if (innerDetected.format === "usdc") {
        rootLayer = ParseCrate(archive.rootLayer.data, innerIdentifier);
    } else if (innerDetected.format === "usda") {
        rootLayer = ParseUsda(innerDetected.text ?? "", innerIdentifier);
    } else {
        diagnostics.push({
            severity: "error",
            message: `USDZ root layer '${innerIdentifier}' has an unsupported nested format and was skipped.`,
            path: `${rootIdentifier}[${innerIdentifier}]`,
        });
        rootLayer = ParseUsda("#usda 1.0\n", innerIdentifier);
    }

    const fetchArchiveAssetAsync: FetchUsdAsset = async (resolvedIdentifier) => {
        const embedded = archive.assets.get(resolvedIdentifier);
        if (embedded) {
            const copy = new ArrayBuffer(embedded.byteLength);
            new Uint8Array(copy).set(embedded);
            return copy;
        }
        return await fetchAsset(ResolveAssetIdentifier(resolvedIdentifier, rootIdentifier));
    };

    const stage = await ComposeAndMapStageAsync(rootLayer, fetchArchiveAssetAsync, compositionOptions, diagnostics);
    await LoadEmbeddedTextureDataAsync(stage, fetchArchiveAssetAsync, stage.diagnostics);
    return FreezeResolvedStage(stage);
}

// USDZ packs its textures inside the archive, so a resolved texture URI such as "textures/base.png"
// addresses an archive-internal asset that Babylon's Texture loader cannot fetch by URL. Pull those image
// bytes here and inline them onto the resolved texture so the adapter can build each texture from a data
// URI. Bytes are fetched once per unique URI and shared across every slot that references it; assets that
// already carry a URL scheme (file:/http(s):/data:) or absolute path are left for the adapter to load.
async function LoadEmbeddedTextureDataAsync(stage: IResolvedStage, fetchAsset: FetchUsdAsset, diagnostics: IResolvedDiagnostic[]): Promise<void> {
    const texturesByUri = new Map<string, IResolvedTexture[]>();
    for (const material of stage.materials) {
        for (const texture of Object.values(material.textures)) {
            if (!texture || texture.data || HasUriScheme(texture.uri)) {
                continue;
            }
            const group = texturesByUri.get(texture.uri);
            if (group) {
                group.push(texture);
            } else {
                texturesByUri.set(texture.uri, [texture]);
            }
        }
    }

    await Promise.all(
        Array.from(texturesByUri.entries()).map(async ([uri, textures]) => {
            const bytes = await FetchTextureBytesAsync(fetchAsset, uri, diagnostics);
            if (!bytes || bytes.byteLength === 0) {
                return;
            }
            const mimeType = GuessImageMimeType(uri);
            for (const texture of textures) {
                texture.data = bytes;
                if (mimeType) {
                    texture.mimeType = mimeType;
                }
            }
        })
    );
}

// Returns true when a texture URI already names something the adapter can load directly: a URL scheme
// (file:/http(s):/data:) or an absolute path. Archive-relative paths return false so their bytes are
// pulled from the USDZ archive instead.
function HasUriScheme(uri: string): boolean {
    return /^[a-z][a-z0-9+.-]*:/i.test(uri) || uri.startsWith("/");
}

// Fetches one texture's bytes, downgrading any failure (or a text payload, which an image never is) to a
// non-fatal diagnostic so a single missing texture cannot abort the whole load.
async function FetchTextureBytesAsync(fetchAsset: FetchUsdAsset, uri: string, diagnostics: IResolvedDiagnostic[]): Promise<Uint8Array | undefined> {
    try {
        const asset = await fetchAsset(uri);
        return typeof asset === "string" ? undefined : new Uint8Array(asset);
    } catch (error) {
        diagnostics.push({ severity: "warning", message: `Failed to load embedded texture '${uri}': ${error}`, path: uri });
        return undefined;
    }
}

// Maps a texture file extension to its image MIME type so the adapter can build a correct data URI.
// Unknown extensions return undefined, letting the adapter fall back to its own default.
function GuessImageMimeType(uri: string): string | undefined {
    const extension = uri.split(".").pop()?.toLowerCase();
    switch (extension) {
        case "png":
            return "image/png";
        case "jpg":
        case "jpeg":
            return "image/jpeg";
        case "webp":
            return "image/webp";
        case "bmp":
            return "image/bmp";
        case "gif":
            return "image/gif";
        default:
            return undefined;
    }
}

// Pre-fetches the external layer stack, composes it with LIVERPS strength ordering, and maps the
// flattened result into a resolved stage. Shared by every container format once a root layer exists.
async function ComposeAndMapStageAsync(
    rootLayer: ISdfLayer,
    fetchAsset: FetchUsdAsset,
    compositionOptions: IComposeLayerStackOptions,
    diagnostics: IResolvedDiagnostic[]
): Promise<IResolvedStage> {
    const layers = await PrefetchLayerStackAsync(rootLayer, fetchAsset, diagnostics);

    const resolveLayer = (assetPath: string, fromIdentifier: string): ISdfLayer | undefined => layers.get(ResolveAssetIdentifier(assetPath, fromIdentifier));
    const composed = ComposeLayerStack(rootLayer, resolveLayer, compositionOptions);
    for (const compositionDiagnostic of composed.diagnostics) {
        diagnostics.push(ToResolvedDiagnostic(compositionDiagnostic));
    }

    const stage = MapLayerToResolvedStage(composed.layer);
    stage.diagnostics.unshift(...diagnostics);
    return stage;
}

// Walks the root layer's composition arcs breadth-first, fetching every reachable external USDA layer
// into an identifier-keyed map the synchronous composition resolver can read from. Each wave of layers
// is fetched concurrently. Binary external layers and fetch failures are recorded as non-fatal
// diagnostics so valid content still loads (composition errors must not prevent loading).
async function PrefetchLayerStackAsync(rootLayer: ISdfLayer, fetchAsset: FetchUsdAsset, diagnostics: IResolvedDiagnostic[]): Promise<Map<string, ISdfLayer>> {
    const layers = new Map<string, ISdfLayer>([[rootLayer.identifier, rootLayer]]);
    const visited = new Set<string>([rootLayer.identifier]);
    await FetchLayerWaveAsync([rootLayer], fetchAsset, layers, visited, diagnostics);
    return layers;
}

// Fetches one breadth-first wave of external layers concurrently, then recurses for the layers it
// discovered. Recursion (rather than a loop with an awaited body) keeps each fetch wave parallel while
// honoring the project's no-await-in-loop rule.
async function FetchLayerWaveAsync(
    frontier: ISdfLayer[],
    fetchAsset: FetchUsdAsset,
    layers: Map<string, ISdfLayer>,
    visited: Set<string>,
    diagnostics: IResolvedDiagnostic[]
): Promise<void> {
    const requests: { assetPath: string; identifier: string }[] = [];
    for (const layer of frontier) {
        for (const assetPath of CollectExternalAssetPaths(layer)) {
            const identifier = ResolveAssetIdentifier(assetPath, layer.identifier);
            if (!visited.has(identifier)) {
                visited.add(identifier);
                requests.push({ assetPath, identifier });
            }
        }
    }

    if (requests.length === 0) {
        return;
    }

    const fetched = await Promise.all(
        requests.map(async (request) => {
            try {
                return { request, data: await fetchAsset(request.identifier) };
            } catch (error) {
                return { request, error };
            }
        })
    );

    const nextFrontier: ISdfLayer[] = [];
    for (const result of fetched) {
        if ("error" in result) {
            const message = result.error instanceof Error ? result.error.message : String(result.error);
            diagnostics.push({ severity: "warning", message: `Could not load external layer '${result.request.assetPath}': ${message}`, path: result.request.identifier });
            continue;
        }

        const detected = DetectUsdFormat(result.data);
        if (detected.format === "usdz") {
            diagnostics.push({
                severity: "warning",
                message: `Nested USDZ layer '${result.request.assetPath}' is not supported and was skipped.`,
                path: result.request.identifier,
            });
            continue;
        }

        let childLayer: ISdfLayer;
        try {
            childLayer = detected.format === "usdc" ? ParseCrate(result.data as ArrayBuffer, result.request.identifier) : ParseUsda(detected.text ?? "", result.request.identifier);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            diagnostics.push({ severity: "warning", message: `Could not parse external layer '${result.request.assetPath}': ${message}`, path: result.request.identifier });
            continue;
        }
        layers.set(result.request.identifier, childLayer);
        nextFrontier.push(childLayer);
    }

    if (nextFrontier.length > 0) {
        await FetchLayerWaveAsync(nextFrontier, fetchAsset, layers, visited, diagnostics);
    }
}

// Collects every external (non-empty) sublayer, reference and payload asset path authored anywhere in a
// layer, including those inside variant subtrees (composition may select any variant).
function CollectExternalAssetPaths(layer: ISdfLayer): string[] {
    const paths: string[] = [];

    for (const subLayer of layer.subLayers) {
        if (subLayer.assetPath) {
            paths.push(subLayer.assetPath);
        }
    }

    function visitFields(fields: ISdfCompositionFields): void {
        for (const reference of ReadListOpItems(fields.references)) {
            if (reference.assetPath) {
                paths.push(reference.assetPath);
            }
        }
        for (const payload of ReadListOpItems(fields.payloads)) {
            if (payload.assetPath) {
                paths.push(payload.assetPath);
            }
        }
        for (const variantSet of fields.variantSets ?? []) {
            for (const variant of Object.values(variantSet.variants)) {
                visitFields(variant);
                for (const variantChild of variant.children) {
                    visitPrim(variantChild);
                }
            }
        }
    }

    function visitPrim(prim: ISdfPrimSpec): void {
        visitFields(prim);
        for (const child of prim.children) {
            visitPrim(child);
        }
    }

    for (const prim of layer.rootPrims) {
        visitPrim(prim);
    }

    return paths;
}

// Maps a composition diagnostic onto the resolved-stage diagnostic shape consumed by the loader.
function ToResolvedDiagnostic(diagnostic: ICompositionDiagnostic): IResolvedDiagnostic {
    const severity: ResolvedDiagnosticSeverity = diagnostic.severity;
    return {
        severity,
        message: `[${diagnostic.code}] ${diagnostic.message}`,
        path: diagnostic.primPath ?? diagnostic.assetPath ?? diagnostic.layerIdentifier,
    };
}
