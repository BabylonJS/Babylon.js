import { Tools } from "core/Misc/tools.pure";

import { type USDLoadingOptions } from "../usdLoadingOptions";
import { FreezeResolvedStage, type IResolvedStage, type IResolvedDiagnostic, type ResolvedDiagnosticSeverity } from "./resolvedStage";
import { type ISdfLayer } from "./sdf/index";
import { ReadListOpItems } from "./sdf/sdfListOp";
import { type ISdfCompositionFields, type ISdfPrimSpec } from "./sdf/sdfSpec";
import { ParseUsda, ParseUsdaWithDiagnostics, DefaultUsdaParserLimits, type IUsdaParseDiagnostic, type IUsdaParserLimits } from "./parser/usda/usdaParser";
import { ComposeLayerStack, type ICompositionDiagnostic, type IComposeLayerStackOptions } from "./composition/composeLayerStack";
import { MapLayerToResolvedStage } from "./mapping/stageMapper";
import { ParseCrate } from "./parser/crate/crateReader";
import { UsdResourceLimitError, UsdUnsupportedFormatError, ValidateResourceLimit } from "../usdErrors";
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
 * This is the single entry point of the USD resolution layer. It sniffs the container format from the
 * data's magic bytes, parses single-layer USDA text, and drives composition (LIVERPS) and stage/time
 * evaluation. Binary crate (`PXR-USDC`) and USDZ package (ZIP) input is rejected with a typed
 * {@link UsdUnsupportedFormatError} before parsing, so binary bytes are never decoded as text. The
 * returned stage is pure data: every USD semantic has been resolved, so the Babylon adapter performs no
 * further USD reasoning.
 *
 * @param data the raw USD data (USDA text as a string, or bytes that are sniffed and decoded as USDA text)
 * @param rootUrl root url to resolve external assets against
 * @param fileName name of the file being loaded, used for diagnostics
 * @param options loader options (composition resource limits and animation baking)
 * @returns a promise resolving to the fully-resolved stage
 * @throws UsdUnsupportedFormatError when the data is binary crate (USDC) or a USDZ package
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
 * @param options loader options (composition resource limits and animation baking)
 * @param fetchAsset callback fetching an external layer's bytes by resolved identifier
 * @returns a promise resolving to the fully-resolved stage
 * @throws UsdUnsupportedFormatError when the data is binary crate (USDC) or a USDZ package
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
    const parserLimits = ResolveParserLimits(options);
    const rootIdentifier = `${rootUrl ?? ""}${fileName ?? "stage.usda"}`;

    // Reject an oversized raw buffer by byteLength before DetectUsdFormat/TextDecoder allocates a decoded
    // copy, so the input-bytes cap actually bounds the expensive allocation it promises to bound.
    if (typeof data !== "string") {
        const maxInputBytes = parserLimits.maxInputBytes ?? DefaultUsdaParserLimits.maxInputBytes;
        if (data.byteLength > maxInputBytes) {
            throw new UsdResourceLimitError("input-bytes", maxInputBytes, `USD: input size exceeds the ${maxInputBytes}-byte resource cap.`, {
                actual: data.byteLength,
                path: rootIdentifier,
            });
        }
    }

    const detected = DetectUsdFormat(data);

    // Only single-layer USDA text is supported. Binary crate and USDZ package bytes are sniffed from
    // their magic bytes and rejected here, before the text parser, so they can never be decoded as text.
    if (detected.format === "usdc") {
        throw new UsdUnsupportedFormatError("usdc", "USD: binary crate (USDC) data is not supported; only single-layer USDA text can be loaded.");
    }
    if (detected.format === "usdz") {
        throw new UsdUnsupportedFormatError("usdz", "USD: USDZ package data is not supported; only single-layer USDA text can be loaded.");
    }

    const rootLayer = ParseRootUsdaLayer(detected.text ?? "", rootIdentifier, diagnostics, parserLimits);
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

// Extracts and validates the parser resource limits from the loader options at the public boundary so
// an invalid configuration fails fast (typed UsdConfigurationError) before any parsing. The parser
// validates again defensively at its own entry point. Only the surviving single-layer root parse is
// wired here; external/USDZ layers are out of the narrowed loader's scope and use the safe defaults.
function ResolveParserLimits(options: Readonly<USDLoadingOptions>): Partial<IUsdaParserLimits> {
    const limits: Partial<IUsdaParserLimits> = {};
    if (options.maxInputBytes !== undefined) {
        limits.maxInputBytes = ValidateResourceLimit(options.maxInputBytes, "maxInputBytes");
    }
    if (options.maxTokenCount !== undefined) {
        limits.maxTokenCount = ValidateResourceLimit(options.maxTokenCount, "maxTokenCount");
    }
    if (options.maxParserWork !== undefined) {
        limits.maxParserWork = ValidateResourceLimit(options.maxParserWork, "maxParserWork");
    }
    return limits;
}
// Pre-fetches the external layer stack, composes it with LIVERPS strength ordering, and maps the
// flattened result into a resolved stage, once the root USDA layer has been parsed.
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

// Parses the root USDA layer and lifts its recoverable parser diagnostics onto the resolution diagnostics
// list, so a source that only parsed after error recovery is surfaced on the resolved stage instead of
// staying hidden in opaque layer metadata. Fatal parse failures (missing/invalid header, resource-limit
// breaches) are thrown by the parser and reject the load rather than being recorded as diagnostics.
function ParseRootUsdaLayer(text: string, identifier: string, diagnostics: IResolvedDiagnostic[], limits?: Partial<IUsdaParserLimits>): ISdfLayer {
    const result = ParseUsdaWithDiagnostics(text, identifier, limits);
    for (const parserDiagnostic of result.diagnostics) {
        diagnostics.push(ToResolvedParserDiagnostic(parserDiagnostic, identifier));
    }
    return result.layer;
}

// Converts a recoverable USDA parser diagnostic into a resolved-stage diagnostic, preserving its 1-based
// source location. Recoverable diagnostics are warnings: the parser recovered and continued, so the stage
// still loads but must advertise the problem rather than appear clean.
function ToResolvedParserDiagnostic(diagnostic: IUsdaParseDiagnostic, layerIdentifier: string): IResolvedDiagnostic {
    return {
        severity: "warning",
        message: diagnostic.message,
        path: layerIdentifier,
        sourceLocation: { line: diagnostic.line, column: diagnostic.column },
    };
}
