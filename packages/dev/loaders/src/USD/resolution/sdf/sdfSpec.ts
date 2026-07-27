import { type ISdfListOp } from "./sdfListOp";
import { type ISdfPayload, type ISdfReference } from "./sdfLayer";
import { type ISdfTimeSampleMap, type SdfMetadata, type SdfValue } from "./sdfValue";

/** Authored USD prim specifier. */
export type SdfSpecifier = "def" | "over" | "class";

/** Authored USD interpolation token for primvars and other interpolated attributes. */
export type SdfInterpolation = "constant" | "uniform" | "varying" | "vertex" | "faceVarying";

/** Authored USD variability token for attributes. */
export type SdfVariability = "varying" | "uniform";

/**
 * Authored prim relocate pair.
 */
export interface ISdfRelocate {
    /** Source absolute prim path to relocate from. */
    source: string;
    /** Target absolute prim path to relocate to. */
    target: string;
}

/**
 * Common composition-arc fields authored on prim-like specs.
 */
export interface ISdfCompositionFields {
    /** Authored reference list operation. */
    references?: ISdfListOp<ISdfReference>;
    /** Authored payload list operation. */
    payloads?: ISdfListOp<ISdfPayload>;
    /** Authored inherits path list operation. */
    inherits?: ISdfListOp<string>;
    /** Authored specializes path list operation. */
    specializes?: ISdfListOp<string>;
    /** Authored variant set definitions nested under this prim-like spec. */
    variantSets?: ISdfVariantSetSpec[];
    /** Authored variant selections keyed by variant set name. */
    variantSelections?: Record<string, string>;
    /** Authored relocate path pairs. */
    relocates?: ISdfRelocate[];
    /** Additional metadata not promoted to first-class fields yet. */
    metadata?: SdfMetadata;
}

/**
 * Authored USD prim spec.
 */
export interface ISdfPrimSpec extends ISdfCompositionFields {
    /** Leaf prim name, excluding parent path components. */
    name: string;
    /** Absolute prim path such as `/World/Mesh`. */
    path: string;
    /** Authored prim specifier. */
    specifier: SdfSpecifier;
    /** Optional typed schema name such as `Xform`, `Mesh`, `Material`, or `Shader`. */
    typeName?: string;
    /** Authored properties keyed by property name, including namespace prefixes such as `primvars:st`. */
    properties: Record<string, ISdfPropertySpec>;
    /** Authored child prim specs in namespace order. */
    children: ISdfPrimSpec[];
    /** Authored active metadata. `false` deactivates this prim during composition. */
    active?: boolean;
    /** Authored instanceable metadata. */
    instanceable?: boolean;
    /** Authored model kind token. */
    kind?: string;
}

/** Discriminated union for authored USD property specs. */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type ISdfPropertySpec = ISdfAttributeSpec | ISdfRelationshipSpec;

/**
 * Authored USD attribute spec.
 */
export interface ISdfAttributeSpec {
    /** Property discriminant for type narrowing. */
    kind: "attribute";
    /** Optional property name, duplicated from the containing property map key when useful for diagnostics. */
    name?: string;
    /** Optional absolute property path such as `/World/Mesh.points`. */
    path?: string;
    /** Authored USD value type token such as `float3`, `token`, `asset`, or `point3f[]`. */
    typeName: string;
    /** Optional authored default value. */
    default?: SdfValue;
    /** Optional authored time samples for this attribute. */
    timeSamples?: ISdfTimeSampleMap;
    /** Optional authored attribute connection list operation. */
    connections?: ISdfListOp<string>;
    /** Optional authored primvar interpolation token. */
    interpolation?: SdfInterpolation;
    /** Optional authored color-space metadata. */
    colorSpace?: string;
    /** Optional authored variability token. */
    variability?: SdfVariability;
    /** Additional attribute metadata not promoted to first-class fields yet. */
    metadata?: SdfMetadata;
}

/**
 * Authored USD relationship spec.
 */
export interface ISdfRelationshipSpec {
    /** Property discriminant for type narrowing. */
    kind: "relationship";
    /** Optional property name, duplicated from the containing property map key when useful for diagnostics. */
    name?: string;
    /** Optional absolute property path such as `/World/Mesh.material:binding`. */
    path?: string;
    /** Authored relationship target list operation. */
    targets: ISdfListOp<string>;
    /** Additional relationship metadata not promoted to first-class fields yet. */
    metadata?: SdfMetadata;
}

/**
 * Authored USD variant set definition.
 */
export interface ISdfVariantSetSpec {
    /** Variant set name, such as `modelingVariant`. */
    name: string;
    /** Authored variants keyed by variant name. */
    variants: Record<string, ISdfVariantSpec>;
}

/**
 * Authored USD variant body.
 */
export interface ISdfVariantSpec extends ISdfCompositionFields {
    /** Optional variant name, duplicated from the containing variant map key when useful for diagnostics. */
    name?: string;
    /** Authored properties grafted onto the owning prim when this variant is selected. */
    properties: Record<string, ISdfPropertySpec>;
    /** Authored child prim specs grafted under the owning prim when this variant is selected. */
    children: ISdfPrimSpec[];
}
