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
    | "number" // float input
    | "integer" // integer input (stored as FlowGraphInteger)
    | "string" // text input
    | "options"; // drop-down with custom options

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
    /**
     * For "options" fields: the list of options to show in the drop-down.
     * Each entry has a human-readable label and a string value.
     */
    options?: ReadonlyArray<{ label: string; value: string }>;
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

/** Fields shared by all IFlowGraphBitwiseBlockConfiguration blocks. */
const BITWISE_BLOCK_FIELDS: ReadonlyArray<IConstructorConfigField> = [{ key: "valueType", label: "Value type", kind: "flowgraph-type", affectsPortTypes: true }];

/** Fields shared by all IFlowGraphMatrixBlockConfiguration blocks. */
const MATRIX_BLOCK_FIELDS: ReadonlyArray<IConstructorConfigField> = [{ key: "matrixType", label: "Matrix type", kind: "flowgraph-type", affectsPortTypes: true }];

/** Rounding mode options for FlowGraphFloatToInt. */
// eslint-disable-next-line @typescript-eslint/naming-convention
const ROUNDING_MODE_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
    { label: "Floor", value: "floor" },
    { label: "Ceil", value: "ceil" },
    { label: "Round", value: "round" },
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

    // ---------- Variable blocks ----------
    ["FlowGraphGetVariableBlock", [{ key: "variable", label: "Variable", kind: "string" }]],
    ["FlowGraphSetVariableBlock", [{ key: "variable", label: "Variable", kind: "string" }]],

    // ---------- Console log ----------
    ["FlowGraphConsoleLogBlock", [{ key: "messageTemplate", label: "Message template", kind: "string" }]],

    // ---------- Control flow blocks ----------
    ["FlowGraphSequenceBlock", [{ key: "outputSignalCount", label: "Output count", kind: "number" }]],
    [
        "FlowGraphMultiGateBlock",
        [
            { key: "outputSignalCount", label: "Output count", kind: "number" },
            { key: "isRandom", label: "Random", kind: "boolean" },
            { key: "isLoop", label: "Loop", kind: "boolean" },
        ],
    ],
    ["FlowGraphWaitAllBlock", [{ key: "inputSignalCount", label: "Input count", kind: "number" }]],
    ["FlowGraphFlipFlopBlock", [{ key: "startValue", label: "Start value", kind: "boolean" }]],
    ["FlowGraphWhileLoopBlock", [{ key: "doWhile", label: "Do-while", kind: "boolean" }]],
    [
        "FlowGraphForLoopBlock",
        [
            { key: "initialIndex", label: "Initial index", kind: "number" },
            { key: "incrementIndexWhenLoopDone", label: "Increment when done", kind: "boolean" },
        ],
    ],

    // ---------- Normalize block ----------
    ["FlowGraphNormalizeBlock", [{ key: "nanOnZeroLength", label: "NaN on zero length", kind: "boolean" }]],

    // ---------- Transform vector block ----------
    ["FlowGraphTransformVectorBlock", [{ key: "vectorType", label: "Vector type", kind: "flowgraph-type", affectsPortTypes: true }]],

    // ---------- Matrix blocks (IFlowGraphMatrixBlockConfiguration) ----------
    ["FlowGraphTransposeBlock", MATRIX_BLOCK_FIELDS],
    ["FlowGraphDeterminantBlock", MATRIX_BLOCK_FIELDS],
    ["FlowGraphInvertMatrixBlock", MATRIX_BLOCK_FIELDS],
    ["FlowGraphMatrixMultiplicationBlock", MATRIX_BLOCK_FIELDS],

    // ---------- Bitwise blocks (IFlowGraphBitwiseBlockConfiguration) ----------
    ["FlowGraphBitwiseNotBlock", BITWISE_BLOCK_FIELDS],
    ["FlowGraphBitwiseAndBlock", BITWISE_BLOCK_FIELDS],
    ["FlowGraphBitwiseOrBlock", BITWISE_BLOCK_FIELDS],
    ["FlowGraphBitwiseXorBlock", BITWISE_BLOCK_FIELDS],

    // ---------- Combine matrix blocks ----------
    ["FlowGraphCombineMatrixBlock", [{ key: "inputIsColumnMajor", label: "Column-major input", kind: "boolean" }]],
    ["FlowGraphCombineMatrix2DBlock", [{ key: "inputIsColumnMajor", label: "Column-major input", kind: "boolean" }]],
    ["FlowGraphCombineMatrix3DBlock", [{ key: "inputIsColumnMajor", label: "Column-major input", kind: "boolean" }]],

    // ---------- Pointer / pick event blocks (stopPropagation) ----------
    ["FlowGraphPointerDownEventBlock", [{ key: "stopPropagation", label: "Stop propagation", kind: "boolean" }]],
    ["FlowGraphPointerUpEventBlock", [{ key: "stopPropagation", label: "Stop propagation", kind: "boolean" }]],
    ["FlowGraphPointerMoveEventBlock", [{ key: "stopPropagation", label: "Stop propagation", kind: "boolean" }]],
    ["FlowGraphPointerOverEventBlock", [{ key: "stopPropagation", label: "Stop propagation", kind: "boolean" }]],
    ["FlowGraphPointerOutEventBlock", [{ key: "stopPropagation", label: "Stop propagation", kind: "boolean" }]],
    ["FlowGraphMeshPickEventBlock", [{ key: "stopPropagation", label: "Stop propagation", kind: "boolean" }]],

    // ---------- Float to Int (rounding mode) ----------
    ["FlowGraphFloatToInt", [{ key: "roundingMode", label: "Rounding mode", kind: "options", options: ROUNDING_MODE_OPTIONS }]],

    // ---------- Data switch ----------
    ["FlowGraphDataSwitchBlock", [{ key: "treatCasesAsIntegers", label: "Treat cases as integers", kind: "boolean" }]],

    // ---------- DoN block ----------
    ["FlowGraphDoNBlock", [{ key: "startIndex", label: "Start index", kind: "integer" }]],

    // ---------- JsonPointerParser block ----------
    [
        "FlowGraphJsonPointerParserBlock",
        [
            { key: "jsonPointer", label: "JSON Pointer", kind: "string" },
            { key: "outputValue", label: "Output value", kind: "boolean" },
        ],
    ],

    // ---------- Interpolation / animation block ----------
    [
        "FlowGraphInterpolationBlock",
        [
            { key: "keyFramesCount", label: "Key frames count", kind: "number" },
            { key: "animationType", label: "Animation type", kind: "flowgraph-type", affectsPortTypes: true },
        ],
    ],

    // ---------- Custom event blocks ----------
    ["FlowGraphReceiveCustomEventBlock", [{ key: "eventId", label: "Event ID", kind: "string" }]],
    ["FlowGraphSendCustomEventBlock", [{ key: "eventId", label: "Event ID", kind: "string" }]],

    // ---------- Get property block ----------
    ["FlowGraphGetPropertyBlock", [{ key: "resetToDefaultWhenUndefined", label: "Reset to default when undefined", kind: "boolean" }]],
]);
