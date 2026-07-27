import {
    type ISdfAttributeSpec,
    type ISdfLayer,
    type ISdfLayerOffset,
    type ISdfListOp,
    type ISdfPayload,
    type ISdfPrimSpec,
    type ISdfPropertySpec,
    type ISdfReference,
    type ISdfRelationshipSpec,
    type ISdfRelocate,
    type ISdfVariantSetSpec,
    type ISdfVariantSpec,
    type SdfMetadata,
} from "../sdf/index";
import { UsdResourceLimitError, ValidateResourceLimit } from "../../usdErrors";

/**
 * Diagnostic emitted while composing a USD layer stack. Diagnostics are returned next to the
 * flattened layer so missing arcs or unsupported shapes do not prevent valid content from loading.
 */
export interface ICompositionDiagnostic {
    /** Machine-readable diagnostic code. */
    code: string;
    /** Human-readable diagnostic details. */
    message: string;
    /** Diagnostic severity. */
    severity: "warning" | "error";
    /** Layer where the diagnostic was detected, when known. */
    layerIdentifier?: string;
    /** Prim path involved in the diagnostic, when known. */
    primPath?: string;
    /** Asset path involved in the diagnostic, when known. */
    assetPath?: string;
}

/**
 * Result returned by `ComposeLayerStack`.
 */
export interface IComposeLayerStackResult {
    /** The flattened, read-only Sdf layer with composition arcs applied. */
    layer: ISdfLayer;
    /** Non-fatal diagnostics produced during composition. */
    diagnostics: ICompositionDiagnostic[];
}

/**
 * Options controlling layer-stack composition.
 */
export interface IComposeLayerStackOptions {
    /**
     * Maximum number of prims composition may produce before it aborts with a bounded error.
     *
     * This guards against adversarial amplification — deeply chained, repeated, or fanned-out
     * references, payloads, inherits, and specializes that multiply a small input into an enormous
     * flattened stage. The cap counts prim specs only (not attribute array elements), so it never
     * penalizes an ordinary wide stage or a mesh with large vertex buffers. Defaults to 1,000,000.
     *
     * Must be a finite, non-negative safe integer (zero rejects any composed prim).
     */
    maxCompositionNodes?: number;

    /**
     * Maximum composition recursion depth (nested arc/prim resolution) before composition aborts with a
     * bounded error. This keeps deep reference/payload/inherit/specialize chains from overflowing the
     * JavaScript call stack with a native `RangeError`. Defaults to 512.
     *
     * Must be a finite, non-negative safe integer.
     */
    maxCompositionDepth?: number;

    /**
     * Maximum units of composition work (prim specs composed, merged, and cloned) before composition
     * aborts with a bounded error. Unlike {@link maxCompositionNodes}, which bounds the size of the
     * output, this bounds the actual work performed, so adversarial inputs that produce a small output
     * through super-linear merging/cloning are still rejected. Defaults to 20,000,000.
     *
     * Must be a finite, non-negative safe integer.
     */
    maxCompositionWork?: number;
}

type ResolveLayer = (assetPath: string, fromIdentifier: string) => ISdfLayer | undefined;
type ListItemKey<T> = (item: T) => string;

interface ICompositionContext {
    readonly resolveLayer: ResolveLayer;
    readonly diagnostics: ICompositionDiagnostic[];
    readonly composedLayers: Map<string, ISdfLayer>;
    readonly composingLayers: Set<string>;
    readonly localLayers: Map<string, ISdfLayer>;
    readonly composingLocalLayers: Set<string>;
    readonly budget: ICompositionBudget;
}

// Mutable running totals checked against the configured caps so composition aborts deterministically
// once adversarial input exceeds a budget: nodes bounds output size, depth bounds recursion (native
// stack safety), and work bounds actual prim-level effort (compose/merge/clone).
interface ICompositionBudget {
    readonly maxNodes: number;
    readonly maxDepth: number;
    readonly maxWork: number;
    nodes: number;
    depth: number;
    work: number;
}

interface ILayerCompositionState {
    readonly localLayer: ISdfLayer;
    readonly timeCodesPerSecond: number;
    readonly defaultPrim?: string;
    readonly primIndex: Map<string, ISdfPrimSpec>;
    readonly composingPrims: Set<string>;
}

interface IPrimChildResolver {
    (child: ISdfPrimSpec): ISdfPrimSpec | undefined;
}

const DefaultTimeCodesPerSecond = 24;
const DefaultMetersPerUnit = 0.01;
const DefaultUpAxis = "Y";
// Default composition budgets. Nodes/work are generous enough for ordinary large stages while still
// rejecting adversarial amplification; depth stays well below the native call-stack ceiling.
const DefaultMaxCompositionNodes = 1_000_000;
const DefaultMaxCompositionDepth = 512;
const DefaultMaxCompositionWork = 20_000_000;

/**
 * Resolves a sequence of Sdf list operations from weakest to strongest into the final ordered list.
 *
 * Explicit opinions replace weaker lists. Prepended/appended/added opinions are merged, deleted
 * items are removed, and ordered opinions are applied last to produce a deterministic order.
 * @param listOps The list operations to resolve, ordered from weakest to strongest.
 * @param getKey Optional stable key function used to compare list items.
 * @returns The composed list after all operations are applied.
 */
export function ResolveSdfListOp<T>(listOps: readonly (ISdfListOp<T> | undefined)[], getKey: ListItemKey<T> = CreateListItemKey): T[] {
    let result: T[] = [];

    for (const listOp of listOps) {
        if (!listOp) {
            continue;
        }

        result = ApplyListOp(result, listOp, getKey);
    }

    return result;
}

/**
 * Composes a root Sdf layer and all resolvable composition arcs into a single flattened Sdf layer.
 *
 * The resolver callback supplies already-parsed layers for sublayers, references, and payloads.
 * Composition is side-effect-free and never performs file IO.
 * @param rootLayer The strongest root layer for the stage.
 * @param resolveLayer Callback used to resolve sublayers, references, and payloads.
 * @param options Optional composition options, such as the maximum composed prim budget.
 * @returns The flattened layer and any non-fatal composition diagnostics.
 */
export function ComposeLayerStack(rootLayer: ISdfLayer, resolveLayer: ResolveLayer, options?: IComposeLayerStackOptions): IComposeLayerStackResult {
    const context: ICompositionContext = {
        resolveLayer,
        diagnostics: [],
        composedLayers: new Map<string, ISdfLayer>(),
        composingLayers: new Set<string>(),
        localLayers: new Map<string, ISdfLayer>(),
        composingLocalLayers: new Set<string>(),
        budget: {
            maxNodes: ResolveCompositionLimit(options?.maxCompositionNodes, DefaultMaxCompositionNodes, "maxCompositionNodes"),
            maxDepth: ResolveCompositionLimit(options?.maxCompositionDepth, DefaultMaxCompositionDepth, "maxCompositionDepth"),
            maxWork: ResolveCompositionLimit(options?.maxCompositionWork, DefaultMaxCompositionWork, "maxCompositionWork"),
            nodes: 0,
            depth: 0,
            work: 0,
        },
    };

    return {
        layer: ComposeLayer(rootLayer, context),
        diagnostics: context.diagnostics,
    };
}

// Validates a caller-provided composition limit (defaulting when omitted). Defensive second layer of
// validation at the direct-API seam; public entry points validate first via ValidateResourceLimit.
function ResolveCompositionLimit(value: number | undefined, fallback: number, option: string): number {
    return value === undefined ? fallback : ValidateResourceLimit(value, option);
}

function ResolveLayerTimeCodesPerSecond(layer: ISdfLayer): number {
    const authoredRate = layer.timeCodesPerSecond ?? layer.framesPerSecond;
    return authoredRate !== undefined && Number.isFinite(authoredRate) && authoredRate > 0 ? authoredRate : DefaultTimeCodesPerSecond;
}

function ComposeTimeOffset(
    layerOffset: ISdfLayerOffset | undefined,
    targetRate: number,
    sourceRate: number,
    context: ICompositionContext,
    details: Pick<ICompositionDiagnostic, "layerIdentifier" | "primPath" | "assetPath">
): ISdfLayerOffset | undefined {
    const rateScale = targetRate / sourceRate;
    if (layerOffset && (!Number.isFinite(layerOffset.scale) || layerOffset.scale <= 0 || !Number.isFinite(layerOffset.offset))) {
        AddDiagnostic(context, {
            code: "composition-invalid-layer-offset",
            message: "Ignoring a layer offset whose scale is not positive and finite or whose offset is not finite.",
            severity: "error",
            ...details,
        });
        return rateScale === 1 ? undefined : { scale: rateScale, offset: 0 };
    }

    const scale = (layerOffset?.scale ?? 1) * rateScale;
    const offset = layerOffset?.offset ?? 0;
    return scale === 1 && offset === 0 ? undefined : { scale, offset };
}

function ComposeLayer(layer: ISdfLayer, context: ICompositionContext): ISdfLayer {
    const cachedLayer = context.composedLayers.get(layer.identifier);
    if (cachedLayer) {
        // A cache hit clones the whole cached layer (work), but only the subtree the caller grafts
        // becomes output nodes; those are charged at the graft site via ChargeGraft. Charging the whole
        // cached layer here would over-count references that pull one small prim from a large library.
        ChargeWork(context, CountLayerPrims(cachedLayer));
        return Clone(cachedLayer);
    }

    if (context.composingLayers.has(layer.identifier)) {
        AddDiagnostic(context, {
            code: "composition-layer-cycle",
            message: `Skipping recursive composition of layer '${layer.identifier}'.`,
            severity: "error",
            layerIdentifier: layer.identifier,
        });
        return CreateEmptyLayer(layer);
    }

    context.composingLayers.add(layer.identifier);

    const localLayer = BuildLocalLayer(layer, context);
    const state: ILayerCompositionState = {
        localLayer,
        timeCodesPerSecond: ResolveLayerTimeCodesPerSecond(layer),
        defaultPrim: layer.defaultPrim,
        primIndex: CreatePrimIndex(localLayer.rootPrims),
        composingPrims: new Set<string>(),
    };

    const rootPrims = localLayer.rootPrims.map((prim) => ComposeLocalPrim(prim.path, state, context)).filter((prim): prim is ISdfPrimSpec => !!prim);

    const composedLayer: ISdfLayer = {
        identifier: localLayer.identifier,
        filePath: localLayer.filePath,
        upAxis: layer.upAxis ?? DefaultUpAxis,
        metersPerUnit: layer.metersPerUnit ?? DefaultMetersPerUnit,
        timeCodesPerSecond: state.timeCodesPerSecond,
        framesPerSecond: layer.framesPerSecond,
        startTimeCode: layer.startTimeCode,
        endTimeCode: layer.endTimeCode,
        defaultPrim: layer.defaultPrim,
        subLayers: [],
        rootPrims,
        metadata: CloneOptional(localLayer.metadata),
    };

    context.composingLayers.delete(layer.identifier);
    context.composedLayers.set(layer.identifier, Clone(composedLayer));

    return composedLayer;
}

function BuildLocalLayer(layer: ISdfLayer, context: ICompositionContext): ISdfLayer {
    const cachedLayer = context.localLayers.get(layer.identifier);
    if (cachedLayer) {
        return Clone(cachedLayer);
    }

    if (context.composingLocalLayers.has(layer.identifier)) {
        AddDiagnostic(context, {
            code: "composition-sublayer-cycle",
            message: `Skipping recursive sublayer stack for layer '${layer.identifier}'.`,
            severity: "error",
            layerIdentifier: layer.identifier,
        });
        return CreateEmptyLayer(layer);
    }

    context.composingLocalLayers.add(layer.identifier);

    let mergedLayer: ISdfLayer | undefined;

    for (let index = layer.subLayers.length - 1; index >= 0; index--) {
        const subLayer = layer.subLayers[index];
        const resolvedLayer = context.resolveLayer(subLayer.assetPath, layer.identifier);

        if (!resolvedLayer) {
            AddDiagnostic(context, {
                code: "composition-missing-sublayer",
                message: `Could not resolve sublayer '${subLayer.assetPath}' from '${layer.identifier}'.`,
                severity: "warning",
                layerIdentifier: layer.identifier,
                assetPath: subLayer.assetPath,
            });
            continue;
        }

        const layerOffset = ComposeTimeOffset(subLayer.layerOffset, ResolveLayerTimeCodesPerSecond(layer), ResolveLayerTimeCodesPerSecond(resolvedLayer), context, {
            layerIdentifier: layer.identifier,
            assetPath: subLayer.assetPath,
        });
        const composedSubLayerStack = ApplyLayerOffsetToLayer(BuildLocalLayer(resolvedLayer, context), layerOffset);
        mergedLayer = MergeLayerOpinions(context, mergedLayer, composedSubLayerStack);
    }

    mergedLayer = MergeLayerOpinions(context, mergedLayer, {
        ...Clone(layer),
        subLayers: [],
    });

    const localLayer = mergedLayer ?? CreateEmptyLayer(layer);
    context.composingLocalLayers.delete(layer.identifier);
    context.localLayers.set(layer.identifier, Clone(localLayer));

    return localLayer;
}

function ComposeLocalPrim(path: string, state: ILayerCompositionState, context: ICompositionContext): ISdfPrimSpec | undefined {
    const prim = state.primIndex.get(path);
    if (!prim) {
        AddDiagnostic(context, {
            code: "composition-missing-internal-prim",
            message: `Could not find prim '${path}' in layer '${state.localLayer.identifier}'.`,
            severity: "warning",
            layerIdentifier: state.localLayer.identifier,
            primPath: path,
        });
        return undefined;
    }

    const compositionKey = `${state.localLayer.identifier}:${path}`;
    if (state.composingPrims.has(compositionKey)) {
        AddDiagnostic(context, {
            code: "composition-prim-cycle",
            message: `Skipping recursive composition of prim '${path}' in layer '${state.localLayer.identifier}'.`,
            severity: "error",
            layerIdentifier: state.localLayer.identifier,
            primPath: path,
        });
        return undefined;
    }

    state.composingPrims.add(compositionKey);
    const composedPrim = ComposePrim(prim, state, context, (child) => ComposeLocalPrim(child.path, state, context));
    state.composingPrims.delete(compositionKey);

    return composedPrim;
}

function ComposeSyntheticPrim(prim: ISdfPrimSpec, state: ILayerCompositionState, context: ICompositionContext): ISdfPrimSpec | undefined {
    return ComposePrim(prim, state, context, (child) => ComposeSyntheticPrim(child, state, context));
}

function ComposePrim(prim: ISdfPrimSpec, state: ILayerCompositionState, context: ICompositionContext, resolveChild: IPrimChildResolver): ISdfPrimSpec | undefined {
    EnterCompositionDepth(context);
    try {
        ChargeNodes(context, 1);
        ChargeWork(context, 1);
        let composedPrim = CreateEmptyPrim(prim);

        composedPrim = ComposePathArcs(composedPrim, ResolveSdfListOp([prim.specializes]), state, context, "specializes");
        composedPrim = ComposeAssetArcs(composedPrim, ResolveSdfListOp([prim.payloads], CreatePayloadKey), state, context, "payload");
        composedPrim = ComposeAssetArcs(composedPrim, ResolveSdfListOp([prim.references], CreateReferenceKey), state, context, "reference");
        composedPrim = ComposeVariantOpinions(composedPrim, prim, state, context);
        composedPrim = ComposePathArcs(composedPrim, ResolveSdfListOp([prim.inherits]), state, context, "inherits");
        composedPrim = MergePrimOpinions(context, composedPrim, CreateDirectPrimOpinion(prim, resolveChild));

        if (composedPrim.active === false) {
            return undefined;
        }

        const relocatedPrim = ApplyRelocatesToPrim(composedPrim, composedPrim.relocates ?? []);
        return StripCompositionFields(relocatedPrim);
    } finally {
        ExitCompositionDepth(context);
    }
}

function ComposePathArcs(
    composedPrim: ISdfPrimSpec,
    paths: readonly string[],
    state: ILayerCompositionState,
    context: ICompositionContext,
    arcName: "inherits" | "specializes"
): ISdfPrimSpec {
    let result = composedPrim;

    for (let index = paths.length - 1; index >= 0; index--) {
        const path = paths[index];
        const arcPrim = ComposeLocalPrim(path, state, context);

        if (!arcPrim) {
            AddDiagnostic(context, {
                code: `composition-missing-${arcName}`,
                message: `Could not resolve ${arcName} target '${path}' for prim '${composedPrim.path}'.`,
                severity: "warning",
                layerIdentifier: state.localLayer.identifier,
                primPath: composedPrim.path,
            });
            continue;
        }

        ChargeGraft(context, arcPrim);
        result = MergePrimOpinions(context, result, RebasePrimTree(arcPrim, arcPrim.path, composedPrim.path));
    }

    return result;
}

function ComposeAssetArcs(
    composedPrim: ISdfPrimSpec,
    arcs: readonly (ISdfReference | ISdfPayload)[],
    state: ILayerCompositionState,
    context: ICompositionContext,
    arcName: "reference" | "payload"
): ISdfPrimSpec {
    let result = composedPrim;

    for (let index = arcs.length - 1; index >= 0; index--) {
        const arc = arcs[index];
        const arcPrim = ComposeAssetArc(composedPrim, arc, state, context, arcName);

        if (arcPrim) {
            result = MergePrimOpinions(context, result, arcPrim);
        }
    }

    return result;
}

function ComposeAssetArc(
    targetPrim: ISdfPrimSpec,
    arc: ISdfReference | ISdfPayload,
    state: ILayerCompositionState,
    context: ICompositionContext,
    arcName: "reference" | "payload"
): ISdfPrimSpec | undefined {
    if (!arc.assetPath) {
        const fallbackPrim = state.defaultPrim
            ? state.localLayer.rootPrims.find((prim) => prim.name === state.defaultPrim)
            : state.localLayer.rootPrims.length === 1
              ? state.localLayer.rootPrims[0]
              : undefined;
        const internalPath = arc.primPath ?? fallbackPrim?.path;
        const internalPrim = internalPath ? ComposeLocalPrim(internalPath, state, context) : undefined;

        if (!internalPrim) {
            AddDiagnostic(context, {
                code: `composition-missing-internal-${arcName}`,
                message: `Could not resolve internal ${arcName} '${arc.primPath ?? ""}' for prim '${targetPrim.path}'.`,
                severity: "warning",
                layerIdentifier: state.localLayer.identifier,
                primPath: targetPrim.path,
            });
            return undefined;
        }

        ChargeGraft(context, internalPrim);
        const layerOffset = ComposeTimeOffset(arc.layerOffset, state.timeCodesPerSecond, state.timeCodesPerSecond, context, {
            layerIdentifier: state.localLayer.identifier,
            primPath: targetPrim.path,
        });
        return ApplyLayerOffsetToPrim(RebasePrimTree(internalPrim, internalPrim.path, targetPrim.path), layerOffset);
    }

    const layer = context.resolveLayer(arc.assetPath, state.localLayer.identifier);

    if (!layer) {
        AddDiagnostic(context, {
            code: `composition-missing-${arcName}-layer`,
            message: `Could not resolve ${arcName} layer '${arc.assetPath}' from '${state.localLayer.identifier}'.`,
            severity: "warning",
            layerIdentifier: state.localLayer.identifier,
            primPath: targetPrim.path,
            assetPath: arc.assetPath,
        });
        return undefined;
    }

    const composedLayer = ComposeLayer(layer, context);
    const sourcePrim = SelectReferencedPrim(composedLayer, arc.primPath, targetPrim.path, context, arcName);

    if (!sourcePrim) {
        return undefined;
    }

    ChargeGraft(context, sourcePrim);
    const layerOffset = ComposeTimeOffset(arc.layerOffset, state.timeCodesPerSecond, ResolveLayerTimeCodesPerSecond(composedLayer), context, {
        layerIdentifier: state.localLayer.identifier,
        primPath: targetPrim.path,
        assetPath: arc.assetPath,
    });
    return ApplyLayerOffsetToPrim(RebasePrimTree(sourcePrim, sourcePrim.path, targetPrim.path), layerOffset);
}

function SelectReferencedPrim(
    layer: ISdfLayer,
    primPath: string | undefined,
    targetPrimPath: string,
    context: ICompositionContext,
    arcName: "reference" | "payload"
): ISdfPrimSpec | undefined {
    if (primPath) {
        const prim = FindPrimByPath(layer.rootPrims, primPath);

        if (!prim) {
            AddDiagnostic(context, {
                code: `composition-missing-${arcName}-prim`,
                message: `Could not find ${arcName} prim '${primPath}' in layer '${layer.identifier}'.`,
                severity: "warning",
                layerIdentifier: layer.identifier,
                primPath,
            });
        }

        return prim;
    }

    const defaultPrim = layer.defaultPrim ? layer.rootPrims.find((prim) => prim.name === layer.defaultPrim) : undefined;
    if (defaultPrim) {
        return defaultPrim;
    }

    if (layer.rootPrims.length === 1) {
        return layer.rootPrims[0];
    }

    if (layer.rootPrims.length > 1) {
        AddDiagnostic(context, {
            code: `composition-ambiguous-${arcName}-default-prim`,
            message: `Layer '${layer.identifier}' has no defaultPrim; grafting all root prims under '${targetPrimPath}'.`,
            severity: "warning",
            layerIdentifier: layer.identifier,
            primPath: targetPrimPath,
        });
        return {
            name: GetNameFromPath(targetPrimPath),
            path: targetPrimPath,
            specifier: "over",
            properties: {},
            // No budget charge here: the caller (ComposeAssetArc) charges the whole returned synthetic
            // subtree once via ChargeGraft, so charging the children here too would double-count.
            children: layer.rootPrims.map((prim) => RebasePrimAsChild(prim, targetPrimPath)),
        };
    }

    AddDiagnostic(context, {
        code: `composition-empty-${arcName}-layer`,
        message: `Layer '${layer.identifier}' has no root prims to ${arcName}.`,
        severity: "warning",
        layerIdentifier: layer.identifier,
        primPath: targetPrimPath,
    });

    return undefined;
}

function ComposeVariantOpinions(composedPrim: ISdfPrimSpec, prim: ISdfPrimSpec, state: ILayerCompositionState, context: ICompositionContext): ISdfPrimSpec {
    let result = composedPrim;

    for (const variantSet of prim.variantSets ?? []) {
        const variant = SelectVariant(variantSet, prim, state.localLayer.identifier, context);

        if (!variant) {
            continue;
        }

        const variantPrim = CreateVariantPrimOpinion(prim, variant);
        const composedVariantPrim = ComposeSyntheticPrim(variantPrim, state, context);

        if (composedVariantPrim) {
            result = MergePrimOpinions(context, result, composedVariantPrim);
        }
    }

    return result;
}

function SelectVariant(variantSet: ISdfVariantSetSpec, prim: ISdfPrimSpec, layerIdentifier: string, context: ICompositionContext): ISdfVariantSpec | undefined {
    const selectedVariantName = prim.variantSelections?.[variantSet.name];

    if (!selectedVariantName) {
        return undefined;
    }

    const variant = variantSet.variants[selectedVariantName];
    if (!variant) {
        AddDiagnostic(context, {
            code: "composition-missing-variant",
            message: `Variant '${selectedVariantName}' does not exist in variant set '${variantSet.name}' on prim '${prim.path}'.`,
            severity: "warning",
            layerIdentifier,
            primPath: prim.path,
        });
    }

    return variant;
}

function CreateVariantPrimOpinion(prim: ISdfPrimSpec, variant: ISdfVariantSpec): ISdfPrimSpec {
    return {
        name: prim.name,
        path: prim.path,
        specifier: prim.specifier,
        properties: Clone(variant.properties),
        children: variant.children.map((child) => RebasePrimAsChild(child, prim.path)),
        references: CloneOptional(variant.references),
        payloads: CloneOptional(variant.payloads),
        inherits: CloneOptional(variant.inherits),
        specializes: CloneOptional(variant.specializes),
        variantSets: CloneOptional(variant.variantSets),
        variantSelections: CloneOptional(variant.variantSelections),
        relocates: CloneOptional(variant.relocates),
        metadata: CloneOptional(variant.metadata),
    };
}

function CreateDirectPrimOpinion(prim: ISdfPrimSpec, resolveChild: IPrimChildResolver): ISdfPrimSpec {
    return {
        name: prim.name,
        path: prim.path,
        specifier: prim.specifier,
        typeName: prim.typeName,
        properties: Clone(prim.properties),
        children: prim.children.map(resolveChild).filter((child): child is ISdfPrimSpec => !!child),
        active: prim.active,
        instanceable: prim.instanceable,
        kind: prim.kind,
        metadata: CloneOptional(prim.metadata),
    };
}

function MergeLayerOpinions(context: ICompositionContext, weakerLayer: ISdfLayer | undefined, strongerLayer: ISdfLayer): ISdfLayer {
    if (!weakerLayer) {
        ChargeWork(context, CountLayerPrims(strongerLayer));
        return Clone(strongerLayer);
    }

    return {
        identifier: strongerLayer.identifier,
        filePath: strongerLayer.filePath ?? weakerLayer.filePath,
        upAxis: strongerLayer.upAxis ?? weakerLayer.upAxis,
        metersPerUnit: strongerLayer.metersPerUnit ?? weakerLayer.metersPerUnit,
        timeCodesPerSecond: strongerLayer.timeCodesPerSecond ?? weakerLayer.timeCodesPerSecond,
        framesPerSecond: strongerLayer.framesPerSecond ?? weakerLayer.framesPerSecond,
        startTimeCode: strongerLayer.startTimeCode ?? weakerLayer.startTimeCode,
        endTimeCode: strongerLayer.endTimeCode ?? weakerLayer.endTimeCode,
        defaultPrim: strongerLayer.defaultPrim ?? weakerLayer.defaultPrim,
        subLayers: [],
        rootPrims: MergePrimArrays(context, weakerLayer.rootPrims, strongerLayer.rootPrims),
        metadata: MergeMetadata(weakerLayer.metadata, strongerLayer.metadata),
    };
}

function MergePrimArrays(context: ICompositionContext, weakerPrims: readonly ISdfPrimSpec[], strongerPrims: readonly ISdfPrimSpec[]): ISdfPrimSpec[] {
    const mergedPrims = weakerPrims.map((prim) => {
        ChargeWork(context, 1);
        return Clone(prim);
    });
    const indexesByPath = new Map<string, number>();

    for (let index = 0; index < mergedPrims.length; index++) {
        indexesByPath.set(mergedPrims[index].path, index);
    }

    for (const strongerPrim of strongerPrims) {
        const existingIndex = indexesByPath.get(strongerPrim.path);

        if (existingIndex === undefined) {
            ChargeWork(context, 1);
            indexesByPath.set(strongerPrim.path, mergedPrims.length);
            mergedPrims.push(Clone(strongerPrim));
            continue;
        }

        mergedPrims[existingIndex] = MergePrimOpinions(context, mergedPrims[existingIndex], strongerPrim);
    }

    return mergedPrims;
}

function MergePrimOpinions(context: ICompositionContext, weakerPrim: ISdfPrimSpec, strongerPrim: ISdfPrimSpec): ISdfPrimSpec {
    ChargeWork(context, 1);
    return {
        name: strongerPrim.name,
        path: strongerPrim.path,
        specifier: strongerPrim.specifier,
        typeName: strongerPrim.typeName ?? weakerPrim.typeName,
        properties: MergeProperties(weakerPrim.properties, strongerPrim.properties),
        children: MergePrimArrays(context, weakerPrim.children, strongerPrim.children),
        active: strongerPrim.active ?? weakerPrim.active,
        instanceable: strongerPrim.instanceable ?? weakerPrim.instanceable,
        kind: strongerPrim.kind ?? weakerPrim.kind,
        references: MergeListOpField(weakerPrim.references, strongerPrim.references, CreateReferenceKey),
        payloads: MergeListOpField(weakerPrim.payloads, strongerPrim.payloads, CreatePayloadKey),
        inherits: MergeListOpField(weakerPrim.inherits, strongerPrim.inherits),
        specializes: MergeListOpField(weakerPrim.specializes, strongerPrim.specializes),
        variantSets: MergeVariantSets(context, weakerPrim.variantSets, strongerPrim.variantSets),
        variantSelections: MergeRecord(weakerPrim.variantSelections, strongerPrim.variantSelections),
        relocates: MergeRelocates(weakerPrim.relocates, strongerPrim.relocates),
        metadata: MergeMetadata(weakerPrim.metadata, strongerPrim.metadata),
    };
}

function MergeProperties(weakerProperties: Record<string, ISdfPropertySpec>, strongerProperties: Record<string, ISdfPropertySpec>): Record<string, ISdfPropertySpec> {
    const properties: Record<string, ISdfPropertySpec> = Clone(weakerProperties);

    for (const name of Object.keys(strongerProperties)) {
        const strongerProperty = strongerProperties[name];
        const weakerProperty = properties[name];
        properties[name] = weakerProperty ? MergePropertyOpinion(weakerProperty, strongerProperty) : Clone(strongerProperty);
    }

    return properties;
}

function MergePropertyOpinion(weakerProperty: ISdfPropertySpec, strongerProperty: ISdfPropertySpec): ISdfPropertySpec {
    if (weakerProperty.kind !== strongerProperty.kind) {
        return Clone(strongerProperty);
    }

    if (strongerProperty.kind === "attribute") {
        return MergeAttributeOpinion(weakerProperty as ISdfAttributeSpec, strongerProperty);
    }

    return MergeRelationshipOpinion(weakerProperty as ISdfRelationshipSpec, strongerProperty);
}

function MergeAttributeOpinion(weakerAttribute: ISdfAttributeSpec, strongerAttribute: ISdfAttributeSpec): ISdfAttributeSpec {
    return {
        kind: "attribute",
        name: strongerAttribute.name ?? weakerAttribute.name,
        path: strongerAttribute.path ?? weakerAttribute.path,
        typeName: strongerAttribute.typeName,
        default: strongerAttribute.default ?? CloneOptional(weakerAttribute.default),
        timeSamples: strongerAttribute.timeSamples ? Clone(strongerAttribute.timeSamples) : CloneOptional(weakerAttribute.timeSamples),
        connections: MergeListOpField(weakerAttribute.connections, strongerAttribute.connections),
        interpolation: strongerAttribute.interpolation ?? weakerAttribute.interpolation,
        colorSpace: strongerAttribute.colorSpace ?? weakerAttribute.colorSpace,
        variability: strongerAttribute.variability ?? weakerAttribute.variability,
        metadata: MergeMetadata(weakerAttribute.metadata, strongerAttribute.metadata),
    };
}

function MergeRelationshipOpinion(weakerRelationship: ISdfRelationshipSpec, strongerRelationship: ISdfRelationshipSpec): ISdfRelationshipSpec {
    return {
        kind: "relationship",
        name: strongerRelationship.name ?? weakerRelationship.name,
        path: strongerRelationship.path ?? weakerRelationship.path,
        targets: MergeListOpField(weakerRelationship.targets, strongerRelationship.targets) ?? { isExplicit: true, explicit: [] },
        metadata: MergeMetadata(weakerRelationship.metadata, strongerRelationship.metadata),
    };
}

function MergeListOpField<T>(
    weakerListOp: ISdfListOp<T> | undefined,
    strongerListOp: ISdfListOp<T> | undefined,
    getKey: ListItemKey<T> = CreateListItemKey
): ISdfListOp<T> | undefined {
    if (!weakerListOp && !strongerListOp) {
        return undefined;
    }

    return {
        isExplicit: true,
        explicit: ResolveSdfListOp([weakerListOp, strongerListOp], getKey),
    };
}

function MergeVariantSets(
    context: ICompositionContext,
    weakerSets: ISdfVariantSetSpec[] | undefined,
    strongerSets: ISdfVariantSetSpec[] | undefined
): ISdfVariantSetSpec[] | undefined {
    if (!weakerSets && !strongerSets) {
        return undefined;
    }

    const sets = (weakerSets ?? []).map((set) => Clone(set));
    const indexesByName = new Map<string, number>();

    for (let index = 0; index < sets.length; index++) {
        indexesByName.set(sets[index].name, index);
    }

    for (const strongerSet of strongerSets ?? []) {
        const existingIndex = indexesByName.get(strongerSet.name);

        if (existingIndex === undefined) {
            indexesByName.set(strongerSet.name, sets.length);
            sets.push(Clone(strongerSet));
            continue;
        }

        sets[existingIndex] = MergeVariantSetOpinion(context, sets[existingIndex], strongerSet);
    }

    return sets;
}

function MergeVariantSetOpinion(context: ICompositionContext, weakerSet: ISdfVariantSetSpec, strongerSet: ISdfVariantSetSpec): ISdfVariantSetSpec {
    const variants: Record<string, ISdfVariantSpec> = Clone(weakerSet.variants);

    for (const variantName of Object.keys(strongerSet.variants)) {
        const strongerVariant = strongerSet.variants[variantName];
        const weakerVariant = variants[variantName];
        variants[variantName] = weakerVariant ? MergeVariantOpinion(context, weakerVariant, strongerVariant) : Clone(strongerVariant);
    }

    return {
        name: strongerSet.name,
        variants,
    };
}

function MergeVariantOpinion(context: ICompositionContext, weakerVariant: ISdfVariantSpec, strongerVariant: ISdfVariantSpec): ISdfVariantSpec {
    return {
        name: strongerVariant.name ?? weakerVariant.name,
        properties: MergeProperties(weakerVariant.properties, strongerVariant.properties),
        children: MergePrimArrays(context, weakerVariant.children, strongerVariant.children),
        references: MergeListOpField(weakerVariant.references, strongerVariant.references, CreateReferenceKey),
        payloads: MergeListOpField(weakerVariant.payloads, strongerVariant.payloads, CreatePayloadKey),
        inherits: MergeListOpField(weakerVariant.inherits, strongerVariant.inherits),
        specializes: MergeListOpField(weakerVariant.specializes, strongerVariant.specializes),
        variantSets: MergeVariantSets(context, weakerVariant.variantSets, strongerVariant.variantSets),
        variantSelections: MergeRecord(weakerVariant.variantSelections, strongerVariant.variantSelections),
        relocates: MergeRelocates(weakerVariant.relocates, strongerVariant.relocates),
        metadata: MergeMetadata(weakerVariant.metadata, strongerVariant.metadata),
    };
}

function MergeRecord<T>(weakerRecord: Record<string, T> | undefined, strongerRecord: Record<string, T> | undefined): Record<string, T> | undefined {
    if (!weakerRecord && !strongerRecord) {
        return undefined;
    }

    return {
        ...CloneOptional(weakerRecord),
        ...CloneOptional(strongerRecord),
    };
}

function MergeMetadata(weakerMetadata: SdfMetadata | undefined, strongerMetadata: SdfMetadata | undefined): SdfMetadata | undefined {
    return MergeRecord(weakerMetadata, strongerMetadata);
}

function MergeRelocates(weakerRelocates: ISdfRelocate[] | undefined, strongerRelocates: ISdfRelocate[] | undefined): ISdfRelocate[] | undefined {
    if (!weakerRelocates && !strongerRelocates) {
        return undefined;
    }

    return [...(CloneOptional(weakerRelocates) ?? []), ...(CloneOptional(strongerRelocates) ?? [])];
}

function ApplyListOp<T>(baseItems: readonly T[], listOp: ISdfListOp<T>, getKey: ListItemKey<T>): T[] {
    let result: T[] = [...(listOp.isExplicit ? Clone(listOp.explicit ?? []) : Clone(baseItems))];

    result = RemoveItems(result, listOp.deleted, getKey);
    result = PrependItems(result, listOp.prepended, getKey);
    result = AppendItems(result, listOp.appended, getKey);
    result = AppendItems(result, listOp.added, getKey);
    result = ApplyOrderedItems(result, listOp.ordered, getKey);

    return result;
}

function RemoveItems<T>(items: readonly T[], itemsToRemove: readonly T[] | undefined, getKey: ListItemKey<T>): T[] {
    if (!itemsToRemove?.length) {
        return [...items];
    }

    const keysToRemove = new Set(itemsToRemove.map(getKey));
    return items.filter((item) => !keysToRemove.has(getKey(item)));
}

function PrependItems<T>(items: readonly T[], itemsToPrepend: readonly T[] | undefined, getKey: ListItemKey<T>): T[] {
    if (!itemsToPrepend?.length) {
        return [...items];
    }

    let result = RemoveItems(items, itemsToPrepend, getKey);

    for (let index = itemsToPrepend.length - 1; index >= 0; index--) {
        result = [Clone(itemsToPrepend[index]), ...result];
    }

    return result;
}

function AppendItems<T>(items: readonly T[], itemsToAppend: readonly T[] | undefined, getKey: ListItemKey<T>): T[] {
    if (!itemsToAppend?.length) {
        return [...items];
    }

    const result = RemoveItems(items, itemsToAppend, getKey);

    for (const item of itemsToAppend) {
        result.push(Clone(item));
    }

    return result;
}

function ApplyOrderedItems<T>(items: readonly T[], orderedItems: readonly T[] | undefined, getKey: ListItemKey<T>): T[] {
    if (!orderedItems?.length) {
        return [...items];
    }

    const itemsByKey = new Map<string, T>();
    for (const item of items) {
        itemsByKey.set(getKey(item), item);
    }

    const orderedKeys = new Set(orderedItems.map(getKey));
    const result = orderedItems
        .map(getKey)
        .filter((key) => itemsByKey.has(key))
        .map((key) => Clone(itemsByKey.get(key) as T));

    for (const item of items) {
        if (!orderedKeys.has(getKey(item))) {
            result.push(Clone(item));
        }
    }

    return result;
}

function CreateReferenceKey(reference: ISdfReference): string {
    return `${reference.assetPath}|${reference.primPath ?? ""}`;
}

function CreatePayloadKey(payload: ISdfPayload): string {
    return `${payload.assetPath}|${payload.primPath ?? ""}`;
}

function CreateListItemKey<T>(item: T): string {
    return StableStringify(item);
}

function CreatePrimIndex(rootPrims: readonly ISdfPrimSpec[]): Map<string, ISdfPrimSpec> {
    const index = new Map<string, ISdfPrimSpec>();

    for (const rootPrim of rootPrims) {
        IndexPrim(rootPrim, index);
    }

    return index;
}

function IndexPrim(prim: ISdfPrimSpec, index: Map<string, ISdfPrimSpec>): void {
    index.set(prim.path, prim);

    for (const child of prim.children) {
        IndexPrim(child, index);
    }
}

function FindPrimByPath(prims: readonly ISdfPrimSpec[], path: string): ISdfPrimSpec | undefined {
    for (const prim of prims) {
        if (prim.path === path) {
            return prim;
        }

        const child = FindPrimByPath(prim.children, path);
        if (child) {
            return child;
        }
    }

    return undefined;
}

function CreateEmptyLayer(layer: ISdfLayer): ISdfLayer {
    return {
        identifier: layer.identifier,
        filePath: layer.filePath,
        upAxis: layer.upAxis,
        metersPerUnit: layer.metersPerUnit,
        timeCodesPerSecond: layer.timeCodesPerSecond,
        framesPerSecond: layer.framesPerSecond,
        startTimeCode: layer.startTimeCode,
        endTimeCode: layer.endTimeCode,
        defaultPrim: layer.defaultPrim,
        subLayers: [],
        rootPrims: [],
        metadata: CloneOptional(layer.metadata),
    };
}

function CreateEmptyPrim(prim: ISdfPrimSpec): ISdfPrimSpec {
    return {
        name: prim.name,
        path: prim.path,
        specifier: prim.specifier,
        properties: {},
        children: [],
    };
}

function StripCompositionFields(prim: ISdfPrimSpec): ISdfPrimSpec {
    return {
        name: prim.name,
        path: prim.path,
        specifier: prim.specifier,
        typeName: prim.typeName,
        properties: StripCompositionFieldsFromProperties(prim.properties),
        children: prim.children.map(StripCompositionFields),
        active: prim.active,
        instanceable: prim.instanceable,
        kind: prim.kind,
        metadata: CloneOptional(prim.metadata),
    };
}

function StripCompositionFieldsFromProperties(properties: Record<string, ISdfPropertySpec>): Record<string, ISdfPropertySpec> {
    const strippedProperties: Record<string, ISdfPropertySpec> = {};

    for (const name of Object.keys(properties)) {
        const property = properties[name];

        if (property.kind === "relationship") {
            strippedProperties[name] = {
                ...Clone(property),
                targets: {
                    isExplicit: true,
                    explicit: ResolveSdfListOp([property.targets]),
                },
            };
            continue;
        }

        strippedProperties[name] = property.connections
            ? {
                  ...Clone(property),
                  connections: {
                      isExplicit: true,
                      explicit: ResolveSdfListOp([property.connections]),
                  },
              }
            : Clone(property);
    }

    return strippedProperties;
}

function RebasePrimAsChild(prim: ISdfPrimSpec, parentPath: string): ISdfPrimSpec {
    return RebasePrimTree(prim, prim.path, `${parentPath}/${prim.name}`);
}

function RebasePrimTree(prim: ISdfPrimSpec, sourceRootPath: string, targetRootPath: string): ISdfPrimSpec {
    const clonedPrim = Clone(prim);
    return UpdatePrimPaths(clonedPrim, sourceRootPath, targetRootPath);
}

function UpdatePrimPaths(prim: ISdfPrimSpec, sourceRootPath: string, targetRootPath: string): ISdfPrimSpec {
    const updatedPath = ReplacePathPrefix(prim.path, sourceRootPath, targetRootPath);
    const updatedPrim: ISdfPrimSpec = {
        ...prim,
        name: prim.path === sourceRootPath ? GetNameFromPath(targetRootPath) : prim.name,
        path: updatedPath,
        properties: UpdatePropertyPaths(prim.properties, sourceRootPath, targetRootPath),
        children: prim.children.map((child) => UpdatePrimPaths(child, sourceRootPath, targetRootPath)),
        relocates: prim.relocates?.map((relocate) => ({
            source: ReplacePathPrefix(relocate.source, sourceRootPath, targetRootPath),
            target: ReplacePathPrefix(relocate.target, sourceRootPath, targetRootPath),
        })),
    };

    return updatedPrim;
}

function UpdatePropertyPaths(properties: Record<string, ISdfPropertySpec>, sourceRootPath: string, targetRootPath: string): Record<string, ISdfPropertySpec> {
    const updatedProperties: Record<string, ISdfPropertySpec> = {};

    for (const name of Object.keys(properties)) {
        const property = properties[name];

        if (property.kind === "relationship") {
            updatedProperties[name] = {
                ...Clone(property),
                path: property.path ? ReplacePathPrefix(property.path, sourceRootPath, targetRootPath) : undefined,
                targets: UpdateListOpPaths(property.targets, sourceRootPath, targetRootPath),
            };
            continue;
        }

        updatedProperties[name] = {
            ...Clone(property),
            path: property.path ? ReplacePathPrefix(property.path, sourceRootPath, targetRootPath) : undefined,
            connections: property.connections ? UpdateListOpPaths(property.connections, sourceRootPath, targetRootPath) : undefined,
        };
    }

    return updatedProperties;
}

function UpdateListOpPaths(listOp: ISdfListOp<string>, sourceRootPath: string, targetRootPath: string): ISdfListOp<string> {
    return {
        isExplicit: listOp.isExplicit,
        explicit: listOp.explicit?.map((path) => ReplacePathPrefix(path, sourceRootPath, targetRootPath)),
        prepended: listOp.prepended?.map((path) => ReplacePathPrefix(path, sourceRootPath, targetRootPath)),
        appended: listOp.appended?.map((path) => ReplacePathPrefix(path, sourceRootPath, targetRootPath)),
        added: listOp.added?.map((path) => ReplacePathPrefix(path, sourceRootPath, targetRootPath)),
        deleted: listOp.deleted?.map((path) => ReplacePathPrefix(path, sourceRootPath, targetRootPath)),
        ordered: listOp.ordered?.map((path) => ReplacePathPrefix(path, sourceRootPath, targetRootPath)),
    };
}

function ApplyRelocatesToPrim(prim: ISdfPrimSpec, relocates: readonly ISdfRelocate[]): ISdfPrimSpec {
    if (!relocates.length) {
        return prim;
    }

    let relocatedPrim = prim;

    for (const relocate of relocates) {
        relocatedPrim = UpdatePrimPaths(relocatedPrim, relocate.source, relocate.target);
    }

    return relocatedPrim;
}

function ApplyLayerOffsetToLayer(layer: ISdfLayer, layerOffset: ISdfLayerOffset | undefined): ISdfLayer {
    if (!layerOffset) {
        return layer;
    }

    return {
        ...layer,
        rootPrims: layer.rootPrims.map((prim) => ApplyLayerOffsetToPrim(prim, layerOffset)),
    };
}

function ApplyLayerOffsetToPrim(prim: ISdfPrimSpec, layerOffset: ISdfLayerOffset | undefined): ISdfPrimSpec {
    if (!layerOffset) {
        return prim;
    }

    return {
        ...prim,
        properties: ApplyLayerOffsetToProperties(prim.properties, layerOffset),
        children: prim.children.map((child) => ApplyLayerOffsetToPrim(child, layerOffset)),
    };
}

function ApplyLayerOffsetToProperties(properties: Record<string, ISdfPropertySpec>, layerOffset: ISdfLayerOffset): Record<string, ISdfPropertySpec> {
    const updatedProperties: Record<string, ISdfPropertySpec> = {};

    for (const name of Object.keys(properties)) {
        const property = properties[name];

        if (property.kind === "relationship" || !property.timeSamples) {
            updatedProperties[name] = Clone(property);
            continue;
        }

        const remappedSamples = property.timeSamples.times
            .map((time, index) => ({
                time: time * layerOffset.scale + layerOffset.offset,
                value: Clone(property.timeSamples!.values[index]),
            }))
            .sort((left, right) => left.time - right.time);

        updatedProperties[name] = {
            ...Clone(property),
            timeSamples: {
                times: remappedSamples.map((sample) => sample.time),
                values: remappedSamples.map((sample) => sample.value),
            },
        };
    }

    return updatedProperties;
}

function ReplacePathPrefix(path: string, sourceRootPath: string, targetRootPath: string): string {
    if (path === sourceRootPath) {
        return targetRootPath;
    }

    if (path.startsWith(`${sourceRootPath}/`) || path.startsWith(`${sourceRootPath}.`)) {
        return `${targetRootPath}${path.slice(sourceRootPath.length)}`;
    }

    return path;
}

function GetNameFromPath(path: string): string {
    const slashIndex = path.lastIndexOf("/");
    return slashIndex === -1 ? path : path.slice(slashIndex + 1);
}

function AddDiagnostic(context: ICompositionContext, diagnostic: ICompositionDiagnostic): void {
    context.diagnostics.push(diagnostic);
}

// Charges the node budget (output prim-spec count) and aborts with a typed, bounded error the moment it
// is exceeded, so adversarial amplification is rejected deterministically rather than exhausting memory
// or silently truncating the stage.
function ChargeNodes(context: ICompositionContext, prims: number): void {
    context.budget.nodes += prims;
    if (context.budget.nodes > context.budget.maxNodes) {
        throw new UsdResourceLimitError(
            "composition-nodes",
            context.budget.maxNodes,
            `USD composition: composed prim count exceeds the ${context.budget.maxNodes}-node resource cap.`,
            {
                actual: context.budget.nodes,
            }
        );
    }
}

// Charges the work budget (prim specs composed, merged, or cloned). Bounds actual effort so inputs that
// produce a small output through super-linear merging/cloning still abort deterministically.
function ChargeWork(context: ICompositionContext, units: number): void {
    context.budget.work += units;
    if (context.budget.work > context.budget.maxWork) {
        throw new UsdResourceLimitError("composition-work", context.budget.maxWork, `USD composition: composition work exceeds the ${context.budget.maxWork}-unit resource cap.`, {
            actual: context.budget.work,
        });
    }
}

// Enters one level of composition recursion, aborting before the native call stack can overflow. Uses
// check-before-increment so a rejected depth leaves the counter balanced.
function EnterCompositionDepth(context: ICompositionContext): void {
    if (context.budget.depth >= context.budget.maxDepth) {
        throw new UsdResourceLimitError(
            "composition-depth",
            context.budget.maxDepth,
            `USD composition: composition depth exceeds the ${context.budget.maxDepth}-level resource cap.`,
            {
                actual: context.budget.depth + 1,
            }
        );
    }
    context.budget.depth++;
}

function ExitCompositionDepth(context: ICompositionContext): void {
    context.budget.depth--;
}

// Charges a grafted subtree against both budgets: cloning it is work, and its prims become part of the
// output stage (nodes). Used at every arc-graft site so node accounting reflects the grafted output
// rather than any larger cached layer the subtree was selected from.
function ChargeGraft(context: ICompositionContext, prim: ISdfPrimSpec): void {
    const count = CountPrimSubtree(prim);
    ChargeWork(context, count);
    ChargeNodes(context, count);
}

// Counts the prim specs (including descendants) in a composed layer. Used to charge the budget when a
// cached or local composed layer is cloned into the output.
function CountLayerPrims(layer: ISdfLayer): number {
    let count = 0;
    for (const prim of layer.rootPrims) {
        count += CountPrimSubtree(prim);
    }
    return count;
}

function CountPrimSubtree(prim: ISdfPrimSpec): number {
    let count = 1;
    for (const child of prim.children) {
        count += CountPrimSubtree(child);
    }
    return count;
}

function CloneOptional<T>(value: T | undefined): T | undefined {
    return value === undefined ? undefined : Clone(value);
}

function Clone<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((entry) => Clone(entry)) as T;
    }

    if (typeof value !== "object" || value === null) {
        return value;
    }

    const clonedRecord: Record<string, unknown> = {};
    const sourceRecord = value as Record<string, unknown>;

    for (const key of Object.keys(sourceRecord)) {
        const entry = sourceRecord[key];
        if (entry !== undefined) {
            clonedRecord[key] = Clone(entry);
        }
    }

    return clonedRecord as T;
}

function StableStringify(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map(StableStringify).join(",")}]`;
    }

    if (typeof value === "bigint") {
        return `${value.toString()}n`;
    }

    if (typeof value !== "object" || value === null) {
        return JSON.stringify(value);
    }

    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
        .sort()
        .map((key) => `${JSON.stringify(key)}:${StableStringify(record[key])}`)
        .join(",")}}`;
}
