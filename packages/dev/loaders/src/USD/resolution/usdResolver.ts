import { type USDLoadingOptions } from "../usdLoadingOptions";
import { FreezeResolvedStage, type IResolvedStage, type IResolvedDiagnostic } from "./resolvedStage";
import { type ISdfLayer } from "./sdf/index";
import { ParseUsdaWithDiagnostics, DefaultUsdaParserLimits, type IUsdaParseDiagnostic, type IUsdaParserLimits } from "./parser/usda/usdaParser";
import { MapLayerToResolvedStage } from "./mapping/stageMapper";
import { UsdResourceLimitError, UsdUnsupportedFormatError, ValidateResourceLimit } from "../usdErrors";
import { ApplySingleLayerPolicy, type ISingleLayerPolicyDiagnostic } from "./singleLayerPolicy";

/** The concrete on-disk USD container format, sniffed from magic bytes rather than the file extension. */
export type UsdFormat = "usda" | "usdc" | "usdz";

const CrateMagic = [0x50, 0x58, 0x52, 0x2d, 0x55, 0x53, 0x44, 0x43]; // "PXR-USDC"
const ZipMagic = [0x50, 0x4b]; // "PK"

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
 * data's magic bytes, parses USDA text, validates and normalizes its single layer without composition
 * or external-layer fetches, and maps it to a resolved stage. Binary crate (`PXR-USDC`) and USDZ package
 * (ZIP) input is rejected with a typed {@link UsdUnsupportedFormatError} before parsing.
 *
 * @param data the raw USD data (USDA text as a string, or bytes that are sniffed and decoded as USDA text)
 * @param rootUrl root url to resolve external assets against
 * @param fileName name of the file being loaded, used for diagnostics
 * @param options loader options (parser resource limits and animation baking)
 * @returns a promise resolving to the fully-resolved stage
 * @throws UsdUnsupportedFormatError when the data is binary crate (USDC) or a USDZ package
 */
export async function ResolveUsdStageAsync(
    data: ArrayBuffer | string,
    rootUrl: string,
    fileName: string | undefined,
    options: Readonly<USDLoadingOptions>
): Promise<IResolvedStage> {
    const diagnostics: IResolvedDiagnostic[] = [];
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
    return FreezeResolvedStage(MapSingleLayerToStage(rootLayer, diagnostics));
}

// Maps one parsed USDA layer to a resolved stage through the single-layer policy seam. The policy
// validates and normalizes the layer (rejecting composition-bearing and undefined-prim constructs and
// pruning inactive/duplicate opinions) before the mapper runs, so no external layer is ever fetched.
function MapSingleLayerToStage(rootLayer: ISdfLayer, diagnostics: IResolvedDiagnostic[]): IResolvedStage {
    const normalized = ApplySingleLayerPolicy(rootLayer);
    for (const policyDiagnostic of normalized.diagnostics) {
        diagnostics.push(ToResolvedDiagnosticFromSingleLayerPolicy(policyDiagnostic));
    }

    const stage = MapLayerToResolvedStage(normalized.layer);
    stage.diagnostics.unshift(...diagnostics);
    return stage;
}

// Maps a single-layer policy diagnostic onto the resolved-stage diagnostic shape consumed by the
// loader, folding the machine-readable code into the message.
function ToResolvedDiagnosticFromSingleLayerPolicy(diagnostic: ISingleLayerPolicyDiagnostic): IResolvedDiagnostic {
    return { severity: diagnostic.severity, message: `[${diagnostic.code}] ${diagnostic.message}`, path: diagnostic.path };
}

// Extracts and validates the parser resource limits from the loader options at the public boundary so
// an invalid configuration fails fast (typed UsdConfigurationError) before any parsing. The parser
// validates again defensively at its own entry point.
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
