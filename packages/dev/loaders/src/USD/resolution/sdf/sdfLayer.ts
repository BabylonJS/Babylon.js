import { type ISdfPrimSpec } from "./sdfSpec";
import { type SdfMetadata } from "./sdfValue";

/**
 * Sdf layer data model: the USDA parser-to-policy seam.
 *
 * Design rules:
 * - Pure, plain data only. NO Babylon imports, NO parser state, NO functions, NO classes.
 * - The USDA parser populates one `ISdfLayer`; the single-layer policy then rejects composition
 *   opinions and normalizes the supported authored content before stage mapping.
 * - Prim data is represented as a hierarchy of `ISdfPrimSpec` objects with absolute `path`
 *   strings. This matches USDA's nested authoring form.
 * - Values use a tagged convention: every authored value is `{ type, value }`. The `type` tag
 *   preserves the USD value token (`float`, `point3f[]`, `asset`, `matrix4d`, etc.) even when
 *   several tokens share the same JavaScript payload shape.
 * - `subLayers`, references, payloads, inherits, specializes, variants, and relocates are modeled
 *   only so the single-layer policy can detect and reject their authored presence.
 */

/**
 * Time remapping applied by sublayers, references, and payloads.
 */
export interface ISdfLayerOffset {
    /** Offset added to the referenced layer's time codes after scaling. */
    offset: number;
    /** Scale applied to the referenced layer's time codes. */
    scale: number;
}

/**
 * Authored sublayer entry on a layer.
 */
export interface ISdfSubLayer {
    /** Authored asset path for the sublayer. */
    assetPath: string;
    /** Optional time offset for this sublayer entry. */
    layerOffset?: ISdfLayerOffset;
}

/**
 * Authored USD reference arc.
 */
export interface ISdfReference {
    /** Authored asset path. An empty string represents an internal reference. */
    assetPath: string;
    /** Optional prim path inside the referenced layer. */
    primPath?: string;
    /** Optional time remapping for the referenced layer. */
    layerOffset?: ISdfLayerOffset;
}

/**
 * Authored USD payload arc.
 */
export interface ISdfPayload {
    /** Authored asset path. An empty string represents an internal payload. */
    assetPath: string;
    /** Optional prim path inside the payload layer. */
    primPath?: string;
    /** Optional time remapping for the payload layer. */
    layerOffset?: ISdfLayerOffset;
}

/**
 * One parsed USDA layer before single-layer validation.
 */
export interface ISdfLayer {
    /** Layer identifier used for diagnostics and relative texture resolution. */
    identifier: string;
    /** Authored stage up axis. When absent, stage mapping applies USD's fallback. */
    upAxis?: "Y" | "Z";
    /** Authored meters represented by one stage unit. When absent, stage mapping applies USD's fallback. */
    metersPerUnit?: number;
    /** Authored time codes per second. When absent, stage mapping applies USD's fallback. */
    timeCodesPerSecond?: number;
    /** Authored playback frame rate; on a root layer, this is the legacy fallback when timeCodesPerSecond is absent. */
    framesPerSecond?: number;
    /** Authored start time code for playback. */
    startTimeCode?: number;
    /** Authored end time code for playback. */
    endTimeCode?: number;
    /** Authored default prim token for this layer. */
    defaultPrim?: string;
    /** Authored sublayers, retained so the single-layer policy can reject them. */
    subLayers: ISdfSubLayer[];
    /** Top-level prim specs. Each child recursively carries its own authored subtree. */
    rootPrims: ISdfPrimSpec[];
    /** Additional layer metadata not promoted to first-class fields yet. */
    metadata?: SdfMetadata;
}
