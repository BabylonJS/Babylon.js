/**
 * Editor-side registry of constructor-configurable fields for FlowGraph blocks.
 *
 * When a block accepts special configuration via its constructor (e.g. the
 * FlowGraphAddBlock accepting a `type` to pin its ports to a specific type),
 * those fields are listed here so the editor can expose them in the
 * "CONSTRUCTION VARIABLES" section of the right-hand property panel.
 *
 * Keys are the class names returned by block.getClassName().
 * Values are the ordered list of fields to render.
 *
 * This file is intentionally kept in the editor package so that core is not
 * aware of any editor concepts. When adding a new block whose constructor
 * config should be editable, add an entry here.
 */

/**
 * The kind of UI control to render for a constructor config field.
 */
export type ConstructorConfigFieldKind =
    | "flowgraph-type" // drop-down of all FlowGraphTypes string values
    | "boolean" // checkbox
    | "number"; // float input

/**
 * Describes a single constructor-configurable field.
 */
export interface IConstructorConfigField {
    /** The property key in block.config */
    key: string;
    /** The label shown in the panel */
    label: string;
    /** The kind of control to render */
    kind: ConstructorConfigFieldKind;
    /**
     * For "flowgraph-type" fields: when the user changes the type the editor
     * should also update the richType on every data connection of the block so
     * that port colours/labels refresh immediately without a full graph reload.
     */
    affectsPortTypes?: boolean;
}

/**
 * Drop-down options for the "flowgraph-type" field kind.
 * The `value` strings match the FlowGraphTypes const-enum values (which are
 * plain strings, so they are safe to use at runtime even though the enum is
 * declared as `const enum` in core).
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const FLOW_GRAPH_TYPE_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
    { label: "Any", value: "any" },
    { label: "Number", value: "number" },
    { label: "Integer", value: "FlowGraphInteger" },
    { label: "Boolean", value: "boolean" },
    { label: "String", value: "string" },
    { label: "Vector2", value: "Vector2" },
    { label: "Vector3", value: "Vector3" },
    { label: "Vector4", value: "Vector4" },
    { label: "Quaternion", value: "Quaternion" },
    { label: "Matrix", value: "Matrix" },
    { label: "Matrix2D", value: "Matrix2D" },
    { label: "Matrix3D", value: "Matrix3D" },
    { label: "Color3", value: "Color3" },
    { label: "Color4", value: "Color4" },
];

/** Fields shared by all IFlowGraphMathBlockConfiguration blocks (Add, Subtract, Multiply, Divide). */
const MATH_BLOCK_FIELDS: ReadonlyArray<IConstructorConfigField> = [
    { key: "type", label: "Type", kind: "flowgraph-type", affectsPortTypes: true },
    { key: "useMatrixPerComponent", label: "Matrix per component", kind: "boolean" },
    { key: "preventIntegerFloatArithmetic", label: "Prevent int/float arithmetic", kind: "boolean" },
];

/**
 * Maps a block's getClassName() result to the ordered list of constructor
 * config fields that should appear in the "CONSTRUCTION VARIABLES" panel
 * section.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const CONSTRUCTOR_CONFIG: ReadonlyMap<string, ReadonlyArray<IConstructorConfigField>> = new Map<string, ReadonlyArray<IConstructorConfigField>>([
    // ---------- Binary math blocks (IFlowGraphMathBlockConfiguration) ----------
    ["FlowGraphAddBlock", MATH_BLOCK_FIELDS],
    ["FlowGraphSubtractBlock", MATH_BLOCK_FIELDS],
    ["FlowGraphMultiplyBlock", MATH_BLOCK_FIELDS],
    ["FlowGraphDivideBlock", MATH_BLOCK_FIELDS],

    // ---------- Round block (IFlowGraphRoundBlockConfiguration) ----------
    ["FlowGraphRoundBlock", [{ key: "roundHalfAwayFromZero", label: "Round half away from zero", kind: "boolean" }]],

    // ---------- Random block (IFlowGraphRandomBlockConfiguration) ----------
    [
        "FlowGraphRandomBlock",
        [
            { key: "min", label: "Min", kind: "number" },
            { key: "max", label: "Max", kind: "number" },
            { key: "seed", label: "Seed", kind: "number" },
        ],
    ],
]);
