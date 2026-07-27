import { type ISdfLayer, type ISdfListOp, type ISdfPrimSpec, type SdfValue } from "./sdf/index";

/**
 * Machine-readable code identifying a single-layer policy decision. Composition-bearing, invalid, and
 * undefined-prim constructs use `error`; retained single-layer cleanup uses `info`.
 */
export type SingleLayerPolicyDiagnosticCode =
    | "usda-sublayer-unsupported"
    | "usda-references-unsupported"
    | "usda-payloads-unsupported"
    | "usda-inherits-unsupported"
    | "usda-specializes-unsupported"
    | "usda-variants-unsupported"
    | "usda-relocates-unsupported"
    | "usda-instanceable-unsupported"
    | "usda-asset-layer-unsupported"
    | "usda-over-unsupported"
    | "usda-class-unsupported"
    | "usda-inactive-prim"
    | "usda-duplicate-prim";

/**
 * A single decision made by the single-layer policy while validating and normalizing one parsed
 * USDA layer. Every diagnostic names the unsupported (or cleaned-up) construct and the USD path it
 * relates to so a caller can surface an actionable message.
 */
export interface ISingleLayerPolicyDiagnostic {
    /** Machine-readable diagnostic code. */
    code: SingleLayerPolicyDiagnosticCode;
    /** Human-readable diagnostic details. */
    message: string;
    /** Diagnostic severity. `error` marks rejected composition/undefined-prim constructs. */
    severity: "info" | "error";
    /** USD prim path, or the layer identifier for layer-level constructs. */
    path: string;
}

/**
 * Result of applying the single-layer policy to one parsed USDA layer.
 */
export interface IApplySingleLayerPolicyResult {
    /** Normalized single layer, safe to hand to the resolved-stage mapper. Composition arcs are stripped. */
    layer: ISdfLayer;
    /** Diagnostics describing every rejection and retained single-layer cleanup. */
    diagnostics: ISingleLayerPolicyDiagnostic[];
}

/**
 * Validates and normalizes one already-parsed USDA layer for the single-layer importer.
 *
 * This is the shallow seam that sits between USDA parsing and resolved-stage mapping. It is
 * deliberately *not* a composition engine: it never resolves or fetches another layer and never
 * applies LIVRPS strength ordering. It only does the two things a single layer still needs:
 *
 * - Reject composition-bearing, invalid, or undefined-prim constructs before mapping, so they cannot
 *   produce a plausible but wrong partial scene. Sublayers, references, payloads, inherits,
 *   specializes, variants, prim- or layer-level relocates, `instanceable`, duplicate prim specs,
 *   `over`/`class` prims, and asset properties that point at an external USD layer are each reported
 *   with the offending USD path. Every rejected prim (and its subtree) is dropped from the normalized
 *   layer.
 * - Preserve the explicitly supported single-layer cleanup that composition used to supply: inactive
 *   (`active = false`) prims are pruned.
 *
 * @param layer the parsed root USDA layer
 * @returns the normalized single layer plus the diagnostics describing every decision
 */
export function ApplySingleLayerPolicy(layer: ISdfLayer): IApplySingleLayerPolicyResult {
    const diagnostics: ISingleLayerPolicyDiagnostic[] = [];

    for (const subLayer of layer.subLayers) {
        diagnostics.push({
            code: "usda-sublayer-unsupported",
            severity: "error",
            path: layer.identifier,
            message: `Sublayer '${subLayer.assetPath}' requires layer composition, which the single-layer USDA importer does not support. The sublayer was ignored.`,
        });
    }

    if (layer.metadata?.relocates !== undefined) {
        diagnostics.push({
            code: "usda-relocates-unsupported",
            severity: "error",
            path: layer.identifier,
            message: `Layer '${layer.identifier}' authors layer-level relocates, which require composition and are not supported; the relocations were ignored.`,
        });
    }

    const rootPrims = NormalizeSiblings(layer.rootPrims, diagnostics);
    return { layer: { ...layer, subLayers: [], rootPrims }, diagnostics };
}

// Normalizes a set of sibling prim specs: duplicate specs authored for the same path are rejected (a
// duplicate USDA spec path is invalid, and last-wins/def-wins merging would invent composition-like
// semantics), then each unique prim is validated and recursed into. Rejected prims are dropped, which
// is what keeps a rejected subtree from producing scene objects.
function NormalizeSiblings(specs: readonly ISdfPrimSpec[], diagnostics: ISingleLayerPolicyDiagnostic[]): ISdfPrimSpec[] {
    const result: ISdfPrimSpec[] = [];
    for (const group of GroupByName(specs)) {
        if (group.length > 1) {
            const path = group[0].path;
            diagnostics.push({
                code: "usda-duplicate-prim",
                severity: "error",
                path,
                message: `Prim '${path}' is authored by ${group.length} duplicate specs in this layer, which is invalid; the prim was not instantiated.`,
            });
            continue;
        }
        const normalized = NormalizePrim(group[0], diagnostics);
        if (normalized) {
            result.push(normalized);
        }
    }
    return result;
}

// Groups sibling specs by prim name while preserving first-seen authoring order, so duplicate
// opinions for one prim (USD re-opens the same spec) can be merged deterministically.
function GroupByName(specs: readonly ISdfPrimSpec[]): ISdfPrimSpec[][] {
    const order: string[] = [];
    const groups = new Map<string, ISdfPrimSpec[]>();
    for (const spec of specs) {
        const existing = groups.get(spec.name);
        if (existing) {
            existing.push(spec);
        } else {
            groups.set(spec.name, [spec]);
            order.push(spec.name);
        }
    }
    return order.map((name) => groups.get(name)!);
}

// Applies the per-prim single-layer policy. Returns the cleaned prim to keep, or `undefined` to drop
// the prim and its whole subtree. The order matters: deactivation removes a prim regardless of
// anything else, then undefined-prim specifiers, then external-layer opinions (composition arcs and
// USD-layer asset values), then `instanceable`. Every rejection drops the prim rather than mapping it.
function NormalizePrim(prim: ISdfPrimSpec, diagnostics: ISingleLayerPolicyDiagnostic[]): ISdfPrimSpec | undefined {
    if (prim.active === false) {
        diagnostics.push({ code: "usda-inactive-prim", severity: "info", path: prim.path, message: `Prim '${prim.path}' is inactive (active = false) and was pruned.` });
        return undefined;
    }

    if (prim.specifier === "class") {
        diagnostics.push({
            code: "usda-class-unsupported",
            severity: "error",
            path: prim.path,
            message: `Class prim '${prim.path}' is an abstract inherit template and was not instantiated; class composition is not supported by the single-layer USDA importer.`,
        });
        return undefined;
    }

    if (prim.specifier === "over") {
        diagnostics.push({
            code: "usda-over-unsupported",
            severity: "error",
            path: prim.path,
            message: `Override prim '${prim.path}' has no definition to override in a single layer and was not instantiated.`,
        });
        return undefined;
    }

    const rejections = [...CollectCompositionArcDiagnostics(prim), ...CollectAssetLayerDiagnostics(prim)];
    if (rejections.length > 0) {
        diagnostics.push(...rejections);
        return undefined;
    }

    if (prim.instanceable === true) {
        diagnostics.push({
            code: "usda-instanceable-unsupported",
            severity: "error",
            path: prim.path,
            message: `Instanceable prim '${prim.path}' requires native instancing, which is not supported; the prim was not instantiated.`,
        });
        return undefined;
    }

    return CleanPrim(prim, NormalizeSiblings(prim.children, diagnostics));
}

// Reports one error per composition arc authored on a prim. Authored presence is what matters (an
// explicit-empty or delete/reorder-only list op, and an empty `variants`/`relocates` opinion, is still
// a composition opinion): any arc means the prim's real content comes from composition this importer
// does not perform, so it is rejected rather than mapped as a misleading fragment.
function CollectCompositionArcDiagnostics(prim: ISdfPrimSpec): ISingleLayerPolicyDiagnostic[] {
    const diagnostics: ISingleLayerPolicyDiagnostic[] = [];
    if (IsListOpAuthored(prim.references)) {
        diagnostics.push({
            code: "usda-references-unsupported",
            severity: "error",
            path: prim.path,
            message: `Prim '${prim.path}' authors a reference arc, which requires composition and is not supported; the prim was not instantiated.`,
        });
    }
    if (IsListOpAuthored(prim.payloads)) {
        diagnostics.push({
            code: "usda-payloads-unsupported",
            severity: "error",
            path: prim.path,
            message: `Prim '${prim.path}' authors a payload arc, which requires composition and is not supported; the prim was not instantiated.`,
        });
    }
    if (IsListOpAuthored(prim.inherits)) {
        diagnostics.push({
            code: "usda-inherits-unsupported",
            severity: "error",
            path: prim.path,
            message: `Prim '${prim.path}' authors an inherits arc, which requires composition and is not supported; the prim was not instantiated.`,
        });
    }
    if (IsListOpAuthored(prim.specializes)) {
        diagnostics.push({
            code: "usda-specializes-unsupported",
            severity: "error",
            path: prim.path,
            message: `Prim '${prim.path}' authors a specializes arc, which requires composition and is not supported; the prim was not instantiated.`,
        });
    }
    if (prim.variantSets !== undefined || prim.variantSelections !== undefined) {
        diagnostics.push({
            code: "usda-variants-unsupported",
            severity: "error",
            path: prim.path,
            message: `Prim '${prim.path}' authors variants, which require composition and are not supported; the prim was not instantiated.`,
        });
    }
    if (prim.relocates !== undefined) {
        diagnostics.push({
            code: "usda-relocates-unsupported",
            severity: "error",
            path: prim.path,
            message: `Prim '${prim.path}' authors relocates, which require composition and are not supported; the prim was not instantiated.`,
        });
    }
    return diagnostics;
}

// Detects whether a list-op arc field is authored at all, including explicit-empty (`references = []`)
// and delete/reorder-only opinions. Those carry no addition-side items, so an item-count check would
// miss them, yet they are still composition opinions this single-layer importer cannot honor.
function IsListOpAuthored<Item>(listOp: ISdfListOp<Item> | undefined): boolean {
    if (!listOp) {
        return false;
    }
    return (
        listOp.isExplicit ||
        (listOp.explicit?.length ?? 0) > 0 ||
        (listOp.prepended?.length ?? 0) > 0 ||
        (listOp.appended?.length ?? 0) > 0 ||
        (listOp.added?.length ?? 0) > 0 ||
        (listOp.deleted?.length ?? 0) > 0 ||
        (listOp.ordered?.length ?? 0) > 0
    );
}

// USD layer asset extensions. An asset value that points at one of these is a back door to another USD
// layer, so it is rejected like an explicit composition arc; ordinary sidecar assets (textures,
// MaterialX, etc.) carry no layer semantics and are preserved.
const UsdLayerAssetExtensionPattern = /\.usd[acz]?$/i;

// Reports an error when any of a prim's asset/asset[] property values (authored default or time
// samples) point at an external USD layer. This closes the gap where another layer is pulled in
// through an ordinary asset attribute rather than a first-class composition arc.
function CollectAssetLayerDiagnostics(prim: ISdfPrimSpec): ISingleLayerPolicyDiagnostic[] {
    const offending: string[] = [];
    for (const propertyName of Object.keys(prim.properties)) {
        const property = prim.properties[propertyName];
        if (property.kind !== "attribute") {
            continue;
        }
        const values = [property.default, ...(property.timeSamples?.values ?? [])];
        for (const layerPath of values.flatMap(ReadUsdLayerAssetPaths)) {
            offending.push(`${propertyName} = @${layerPath}@`);
        }
    }

    if (offending.length === 0) {
        return [];
    }
    return [
        {
            code: "usda-asset-layer-unsupported",
            severity: "error",
            path: prim.path,
            message: `Prim '${prim.path}' authors an external USD layer as an asset property value (${offending.join(", ")}), which requires composition and is not supported; the prim was not instantiated.`,
        },
    ];
}

// Extracts the USD-layer asset paths from one authored value, ignoring non-asset values and non-USD
// asset paths (textures, MaterialX, and other sidecars are intentionally preserved).
function ReadUsdLayerAssetPaths(value: SdfValue | undefined): string[] {
    if (!value) {
        return [];
    }
    if (value.type === "asset") {
        return IsUsdLayerAssetPath(value.value.authoredPath) ? [value.value.authoredPath] : [];
    }
    if (value.type === "asset[]") {
        return value.value.map((asset) => asset.authoredPath).filter(IsUsdLayerAssetPath);
    }
    return [];
}

// True when an authored asset path resolves to a USD layer by extension, ignoring any query/fragment
// suffix. Extension-based detection matches USD's own usd/usda/usdc/usdz layer formats.
function IsUsdLayerAssetPath(authoredPath: string): boolean {
    const path = authoredPath.split(/[?#]/)[0].trim();
    return UsdLayerAssetExtensionPattern.test(path);
}

// Rebuilds a kept prim with its composition-arc fields stripped (single-layer field cleanup), carrying
// every other authored field through. Kept prims have no unsupported opinions left because arc-,
// asset-layer-, and instanceable-bearing prims were already dropped.
function CleanPrim(prim: ISdfPrimSpec, children: ISdfPrimSpec[]): ISdfPrimSpec {
    return {
        ...prim,
        children,
        references: undefined,
        payloads: undefined,
        inherits: undefined,
        specializes: undefined,
        variantSets: undefined,
        variantSelections: undefined,
        relocates: undefined,
    };
}
