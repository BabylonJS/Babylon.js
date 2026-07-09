/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Complete registry of all Node Material block types available in Babylon.js.
 * Each entry describes the block's class name, category, target, and its inputs/outputs.
 */

/**
 * Describes a single input or output connection point on a block.
 */
export interface IConnectionPointInfo {
    /** Name of the connection point (e.g. "left", "output") */
    name: string;
    /** Data type of the connection point (e.g. "Float", "Vector3") */
    type: string;
    /** Whether the connection is optional */
    isOptional?: boolean;
}

/**
 * Describes a block type in the NME catalog.
 */
export interface IBlockTypeInfo {
    /** The Babylon.js class name for this block */
    className: string;
    /** Category for grouping (e.g. "Math", "Input", "Output") */
    category: string;
    /** Human-readable description of what this block does */
    description: string;
    /** Which shader stage this block targets */
    target: "Neutral" | "Vertex" | "Fragment" | "VertexAndFragment";
    /** List of input connection points */
    inputs: IConnectionPointInfo[];
    /** List of output connection points */
    outputs: IConnectionPointInfo[];
    /** Extra properties that can be configured on the block */
    properties?: Record<string, string>;
    /**
     * Default property values to bake into newly created blocks of this type.
     * These are REQUIRED by the Babylon deserialiser – omitting them can cause
     * build-time crashes (e.g. ClampBlock without minimum/maximum).
     */
    defaultSerializedProperties?: Record<string, unknown>;
}

/**
 * Full catalog of block types. This is the canonical reference an AI agent uses
 * to know which blocks exist and what ports they have.
 * BaseMathBlock and ReflectionTextureBaseBlock are non-creatable base classes; the catalog exposes their concrete subclasses only.
 */
export const BlockRegistry: Record<string, IBlockTypeInfo> = {
    // ─── Input ────────────────────────────────────────────────────────────
    InputBlock: {
        className: "InputBlock",
        category: "Input",
        description:
            "Provides input values to the graph. Can be configured as an attribute (position, normal, uv, etc.), " +
            "a system value (World, View, Projection matrices, etc.), or a constant/uniform value (Float, Vector2/3/4, Color3/4, Matrix).",
        target: "Vertex",
        inputs: [],
        outputs: [{ name: "output", type: "AutoDetect" }],
        properties: {
            type: "NodeMaterialBlockConnectionPointTypes — the data type of this input (Float, Vector2, Vector3, Vector4, Color3, Color4, Matrix)",
            isConstant: "boolean — whether the value is baked into the shader",
            visibleInInspector: "boolean — whether to show this in the Inspector UI",
            animationType: "AnimatedInputBlockTypes — None, Time",
            systemValue:
                "NodeMaterialSystemValues — World, View, Projection, ViewProjection, WorldView, WorldViewProjection, CameraPosition, FogColor, DeltaTime, CameraParameters, MaterialAlpha",
            attributeName: "string — position, normal, tangent, uv, uv2, uv3, uv4, uv5, uv6, color, matricesIndices, matricesWeights, matricesIndicesExtra, matricesWeightsExtra",
            value: "The actual uniform value (number, Vector2, Vector3, Vector4, Color3, Color4, Matrix)",
            min: "number — minimum value for inspector slider",
            max: "number — maximum value for inspector slider",
        },
    },

    // ─── Math ─────────────────────────────────────────────────────────────
    AddBlock: {
        className: "AddBlock",
        category: "Math",
        description: "Adds two values together (left + right).",
        target: "Neutral",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    SubtractBlock: {
        className: "SubtractBlock",
        category: "Math",
        description: "Subtracts right from left (left - right).",
        target: "Neutral",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    MultiplyBlock: {
        className: "MultiplyBlock",
        category: "Math",
        description: "Multiplies two values (left * right).",
        target: "Neutral",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    DivideBlock: {
        className: "DivideBlock",
        category: "Math",
        description: "Divides left by right (left / right).",
        target: "Neutral",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    ScaleBlock: {
        className: "ScaleBlock",
        category: "Math",
        description: "Multiplies an input by a float factor.",
        target: "Neutral",
        inputs: [
            { name: "input", type: "AutoDetect" },
            { name: "factor", type: "Float" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    ModBlock: {
        className: "ModBlock",
        category: "Math",
        description: "Computes the modulo (left % right).",
        target: "Neutral",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    PowBlock: {
        className: "PowBlock",
        category: "Math",
        description: "Raises value to a power (value ^ power).",
        target: "Neutral",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "power", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    MinBlock: {
        className: "MinBlock",
        category: "Math",
        description: "Returns the minimum of two values.",
        target: "Neutral",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    MaxBlock: {
        className: "MaxBlock",
        category: "Math",
        description: "Returns the maximum of two values.",
        target: "Neutral",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    ClampBlock: {
        className: "ClampBlock",
        category: "Math",
        description: "Clamps a value between minimum and maximum.",
        target: "Neutral",
        inputs: [{ name: "value", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            minimum: "number — lower bound (default 0)",
            maximum: "number — upper bound (default 1)",
        },
        defaultSerializedProperties: { minimum: 0.0, maximum: 1.0 },
    },
    StepBlock: {
        className: "StepBlock",
        category: "Math",
        description: "Returns 0 if value < edge, else 1. step(edge, value).",
        target: "Neutral",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "edge", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    SmoothStepBlock: {
        className: "SmoothStepBlock",
        category: "Math",
        description: "Hermite interpolation between 0 and 1 when value is between edge0 and edge1.",
        target: "Neutral",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "edge0", type: "AutoDetect" },
            { name: "edge1", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    LerpBlock: {
        className: "LerpBlock",
        category: "Math",
        description: "Linear interpolation: mix(left, right, gradient).",
        target: "Neutral",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
            { name: "gradient", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    NLerpBlock: {
        className: "NLerpBlock",
        category: "Math",
        description: "Normalized linear interpolation (normalizes the result of lerp).",
        target: "Neutral",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
            { name: "gradient", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    NegateBlock: {
        className: "NegateBlock",
        category: "Math",
        description: "Negates a value (-input).",
        target: "Neutral",
        inputs: [{ name: "value", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    OneMinusBlock: {
        className: "OneMinusBlock",
        category: "Math",
        description: "Computes (1 - input).",
        target: "Neutral",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    ReciprocalBlock: {
        className: "ReciprocalBlock",
        category: "Math",
        description: "Computes 1/input.",
        target: "Neutral",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    ArcTan2Block: {
        className: "ArcTan2Block",
        category: "Math",
        description: "Computes atan2(x, y).",
        target: "Neutral",
        inputs: [
            { name: "x", type: "AutoDetect" },
            { name: "y", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "Float" }],
    },

    // ─── Trigonometry ─────────────────────────────────────────────────────
    TrigonometryBlock: {
        className: "TrigonometryBlock",
        category: "Math",
        description:
            "Performs a trig/math operation on the input. Set the 'operation' property to: " +
            "Cos, Sin, Abs, Exp, Exp2, Round, Floor, Ceiling, Sqrt, Log, Tan, ArcTan, ArcCos, ArcSin, Fract, Sign, Radians, Degrees, " +
            "SawToothWave, TriangleWave, SquareWave.",
        target: "Neutral",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            operation: "TrigonometryBlockOperations — Cos, Sin, Abs, Exp, Exp2, Round, Floor, Ceiling, Sqrt, Log, Tan, ArcTan, ArcCos, ArcSin, Fract, Sign, Radians, Degrees",
        },
    },

    // ─── Vector/Color operations ──────────────────────────────────────────
    CrossBlock: {
        className: "CrossBlock",
        category: "Vector",
        description: "Cross product of two Vector3 inputs.",
        target: "Neutral",
        inputs: [
            { name: "left", type: "Vector3" },
            { name: "right", type: "Vector3" },
        ],
        outputs: [{ name: "output", type: "Vector3" }],
    },
    DotBlock: {
        className: "DotBlock",
        category: "Vector",
        description: "Dot product of two vectors.",
        target: "Neutral",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "Float" }],
    },
    NormalizeBlock: {
        className: "NormalizeBlock",
        category: "Vector",
        description: "Normalizes a vector.",
        target: "Neutral",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    LengthBlock: {
        className: "LengthBlock",
        category: "Vector",
        description: "Returns the length of a vector.",
        target: "Neutral",
        inputs: [{ name: "value", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "Float" }],
    },
    DistanceBlock: {
        className: "DistanceBlock",
        category: "Vector",
        description: "Returns the distance between two vectors.",
        target: "Neutral",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "Float" }],
    },
    ReflectBlock: {
        className: "ReflectBlock",
        category: "Vector",
        description: "Reflects an incident vector off a surface with the given normal.",
        target: "Neutral",
        inputs: [
            { name: "incident", type: "AutoDetect" },
            { name: "normal", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    RefractBlock: {
        className: "RefractBlock",
        category: "Vector",
        description: "Computes refraction of an incident vector.",
        target: "Neutral",
        inputs: [
            { name: "incident", type: "AutoDetect" },
            { name: "normal", type: "AutoDetect" },
            { name: "ior", type: "Float" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    TransformBlock: {
        className: "TransformBlock",
        category: "Vector",
        description: "Transforms a vector by a matrix. Commonly used to apply World, View, Projection transforms.",
        target: "Neutral",
        inputs: [
            { name: "vector", type: "AutoDetect" },
            { name: "transform", type: "Matrix" },
        ],
        outputs: [
            { name: "output", type: "Vector4" },
            { name: "xyz", type: "Vector3" },
        ],
        defaultSerializedProperties: { complementZ: 0, complementW: 1 },
    },
    VectorMergerBlock: {
        className: "VectorMergerBlock",
        category: "Vector",
        description: "Merges individual float/vector components into a Vector2, Vector3, or Vector4.",
        target: "Neutral",
        defaultSerializedProperties: { xSwizzle: "x", ySwizzle: "y", zSwizzle: "z", wSwizzle: "w" },
        inputs: [
            { name: "xyzw ", type: "Vector4", isOptional: true },
            { name: "xyz ", type: "Vector3", isOptional: true },
            { name: "xy ", type: "Vector2", isOptional: true },
            { name: "zw ", type: "Vector2", isOptional: true },
            { name: "x", type: "Float", isOptional: true },
            { name: "y", type: "Float", isOptional: true },
            { name: "z", type: "Float", isOptional: true },
            { name: "w", type: "Float", isOptional: true },
        ],
        outputs: [
            { name: "xyzw", type: "Vector4" },
            { name: "xyz", type: "Vector3" },
            { name: "xy", type: "Vector2" },
            { name: "zw", type: "Vector2" },
        ],
    },
    VectorSplitterBlock: {
        className: "VectorSplitterBlock",
        category: "Vector",
        description: "Splits a vector into its individual components.",
        target: "Neutral",
        inputs: [
            { name: "xyzw", type: "Vector4", isOptional: true },
            { name: "xyz ", type: "Vector3", isOptional: true },
            { name: "xy ", type: "Vector2", isOptional: true },
        ],
        outputs: [
            { name: "xyz", type: "Vector3" },
            { name: "xy", type: "Vector2" },
            { name: "zw", type: "Vector2" },
            { name: "x", type: "Float" },
            { name: "y", type: "Float" },
            { name: "z", type: "Float" },
            { name: "w", type: "Float" },
        ],
    },
    ColorMergerBlock: {
        className: "ColorMergerBlock",
        category: "Color",
        description: "Merges R, G, B, A float components into a Color3 or Color4.",
        target: "Neutral",
        inputs: [
            { name: "rgb ", type: "Color3", isOptional: true },
            { name: "r", type: "Float", isOptional: true },
            { name: "g", type: "Float", isOptional: true },
            { name: "b", type: "Float", isOptional: true },
            { name: "a", type: "Float", isOptional: true },
        ],
        outputs: [
            { name: "rgba", type: "Color4" },
            { name: "rgb", type: "Color3" },
        ],
    },
    ColorSplitterBlock: {
        className: "ColorSplitterBlock",
        category: "Color",
        description: "Splits a Color3/Color4 into individual R, G, B, A float components.",
        target: "Neutral",
        inputs: [
            { name: "rgba", type: "Color4", isOptional: true },
            { name: "rgb ", type: "Color3", isOptional: true },
        ],
        outputs: [
            { name: "rgb", type: "Color3" },
            { name: "r", type: "Float" },
            { name: "g", type: "Float" },
            { name: "b", type: "Float" },
            { name: "a", type: "Float" },
        ],
    },
    ColorConverterBlock: {
        className: "ColorConverterBlock",
        category: "Color",
        description: "Converts between RGB and HSL color spaces.",
        target: "Neutral",
        inputs: [
            { name: "rgb ", type: "Color3", isOptional: true },
            { name: "hsl ", type: "Color3", isOptional: true },
        ],
        outputs: [
            { name: "rgb", type: "Color3" },
            { name: "hsl", type: "Color3" },
        ],
    },
    DesaturateBlock: {
        className: "DesaturateBlock",
        category: "Color",
        description: "Desaturates a color by a given amount.",
        target: "Neutral",
        inputs: [
            { name: "color", type: "Color3" },
            { name: "level", type: "Float" },
        ],
        outputs: [{ name: "output", type: "Color3" }],
    },
    PosterizeBlock: {
        className: "PosterizeBlock",
        category: "Color",
        description: "Reduces the number of color levels (posterize effect).",
        target: "Neutral",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "steps", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    ReplaceColorBlock: {
        className: "ReplaceColorBlock",
        category: "Color",
        description: "Replaces a color in a texture with another color within a distance range.",
        target: "Neutral",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "reference", type: "AutoDetect" },
            { name: "distance", type: "Float" },
            { name: "replacement", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    GradientBlock: {
        className: "GradientBlock",
        category: "Color",
        description: "Returns a color from a gradient based on a float input (0-1).",
        target: "Neutral",
        inputs: [{ name: "gradient", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "Color3" }],
        properties: {
            colorSteps: "Array of {color: Color3, step: number} — define the gradient stops",
        },
    },

    // ─── Interpolation / Mapping ──────────────────────────────────────────
    RemapBlock: {
        className: "RemapBlock",
        category: "Interpolation",
        description: "Remaps a value from one range to another.",
        target: "Neutral",
        inputs: [
            { name: "input", type: "AutoDetect" },
            { name: "sourceMin", type: "Float", isOptional: true },
            { name: "sourceMax", type: "Float", isOptional: true },
            { name: "targetMin", type: "Float", isOptional: true },
            { name: "targetMax", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        defaultSerializedProperties: { sourceRange: [-1, 1], targetRange: [0, 1] },
        properties: {
            sourceRange: "number[] — [min, max] of source range (default [-1,1])",
            targetRange: "number[] — [min, max] of target range (default [0,1])",
        },
    },
    FresnelBlock: {
        className: "FresnelBlock",
        category: "Interpolation",
        description: "Computes a Fresnel term based on view direction and normal.",
        target: "Neutral",
        inputs: [
            { name: "worldNormal", type: "Vector4" },
            { name: "viewDirection", type: "Vector3" },
            { name: "bias", type: "Float" },
            { name: "power", type: "Float" },
        ],
        outputs: [{ name: "fresnel", type: "Float" }],
    },
    ConditionalBlock: {
        className: "ConditionalBlock",
        category: "Logic",
        description: "If/else conditional: outputs 'true' or 'false' value based on comparing a and b.",
        target: "Neutral",
        inputs: [
            { name: "a", type: "Float" },
            { name: "b", type: "Float" },
            { name: "true", type: "AutoDetect", isOptional: true },
            { name: "false", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Float" }],
        properties: {
            condition: "ConditionalBlockConditions — Equal, NotEqual, LessThan, GreaterThan, LessOrEqual, GreaterOrEqual, Xor, Or, And",
        },
    },

    // ─── Noise / Procedural ───────────────────────────────────────────────
    RandomNumberBlock: {
        className: "RandomNumberBlock",
        category: "Noise",
        description: "Generates a random number based on a seed.",
        target: "Neutral",
        inputs: [{ name: "seed", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "Float" }],
    },
    SimplexPerlin3DBlock: {
        className: "SimplexPerlin3DBlock",
        category: "Noise",
        description: "3D Simplex Perlin noise.",
        target: "Neutral",
        inputs: [{ name: "seed", type: "Vector3" }],
        outputs: [{ name: "output", type: "Float" }],
    },
    WorleyNoise3DBlock: {
        className: "WorleyNoise3DBlock",
        category: "Noise",
        description: "3D Worley (cellular) noise.",
        target: "Neutral",
        inputs: [
            { name: "seed", type: "Vector3" },
            { name: "jitter", type: "Float" },
        ],
        outputs: [
            { name: "output", type: "Vector2" },
            { name: "x", type: "Float" },
            { name: "y", type: "Float" },
        ],
    },
    VoronoiNoiseBlock: {
        className: "VoronoiNoiseBlock",
        category: "Noise",
        description: "Voronoi noise pattern.",
        target: "Neutral",
        inputs: [
            { name: "seed", type: "Vector2" },
            { name: "offset", type: "Float" },
            { name: "density", type: "Float" },
        ],
        outputs: [
            { name: "output", type: "Float" },
            { name: "cells", type: "Float" },
        ],
    },
    CloudBlock: {
        className: "CloudBlock",
        category: "Noise",
        description: "Generates cloud-like noise pattern.",
        target: "Neutral",
        inputs: [
            { name: "seed", type: "AutoDetect" },
            { name: "chaos", type: "AutoDetect", isOptional: true },
            { name: "offsetX", type: "Float", isOptional: true },
            { name: "offsetY", type: "Float", isOptional: true },
            { name: "offsetZ", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Float" }],
        properties: {
            octaves: "number — number of octaves (default 6)",
        },
    },
    WaveBlock: {
        className: "WaveBlock",
        category: "Noise",
        description: "Generates a wave pattern. Set 'kind' to SawTooth, Square, or Triangle.",
        target: "Neutral",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            kind: "WaveBlockKind — SawTooth, Square, Triangle",
        },
    },

    // ─── UV / Animation ──────────────────────────────────────────────────
    Rotate2dBlock: {
        className: "Rotate2dBlock",
        category: "UV",
        description: "Rotates a 2D vector around a center point by an angle.",
        target: "Neutral",
        inputs: [
            { name: "input", type: "Vector2" },
            { name: "angle", type: "Float" },
        ],
        outputs: [{ name: "output", type: "Vector2" }],
    },
    PannerBlock: {
        className: "PannerBlock",
        category: "UV",
        description: "Pans (scrolls) a 2D input over time.",
        target: "Neutral",
        inputs: [
            { name: "uv", type: "AutoDetect" },
            { name: "time", type: "Float" },
            { name: "speed", type: "Vector2" },
        ],
        outputs: [{ name: "output", type: "Vector2" }],
    },

    // ─── Normal / Misc ───────────────────────────────────────────────────
    NormalBlendBlock: {
        className: "NormalBlendBlock",
        category: "Misc",
        description: "Blends two normal maps together.",
        target: "Neutral",
        inputs: [
            { name: "normalMap0", type: "AutoDetect" },
            { name: "normalMap1", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    ViewDirectionBlock: {
        className: "ViewDirectionBlock",
        category: "Misc",
        description: "Computes the view direction from a world position to the camera.",
        target: "Neutral",
        inputs: [
            { name: "worldPosition", type: "Vector4" },
            { name: "cameraPosition", type: "Vector3" },
        ],
        outputs: [{ name: "output", type: "Vector3" }],
    },
    CurveBlock: {
        className: "CurveBlock",
        category: "Misc",
        description: "Applies an easing curve. Set 'type' property to the curve type.",
        target: "Neutral",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            type: "CurveBlockTypes — EaseInSine, EaseOutSine, EaseInOutSine, EaseInQuad, EaseOutQuad, EaseInOutQuad, etc.",
        },
    },
    MatrixBuilderBlock: {
        className: "MatrixBuilder",
        category: "Matrix",
        description: "Builds a matrix from individual row vectors.",
        target: "Neutral",
        inputs: [
            { name: "row0", type: "Vector4" },
            { name: "row1", type: "Vector4" },
            { name: "row2", type: "Vector4" },
            { name: "row3", type: "Vector4" },
        ],
        outputs: [{ name: "output", type: "Matrix" }],
    },
    MatrixDeterminantBlock: {
        className: "MatrixDeterminantBlock",
        category: "Matrix",
        description: "Computes the determinant of a matrix.",
        target: "Neutral",
        inputs: [{ name: "input", type: "Matrix" }],
        outputs: [{ name: "output", type: "Float" }],
    },
    MatrixTransposeBlock: {
        className: "MatrixTransposeBlock",
        category: "Matrix",
        description: "Transposes a matrix.",
        target: "Neutral",
        inputs: [{ name: "input", type: "Matrix" }],
        outputs: [{ name: "output", type: "Matrix" }],
    },

    // ─── Vertex Target ────────────────────────────────────────────────────
    VertexOutputBlock: {
        className: "VertexOutputBlock",
        category: "Output",
        description: "The vertex shader output. Connect the final transformed position here. Every material needs exactly one.",
        target: "Vertex",
        inputs: [{ name: "vector", type: "Vector4" }],
        outputs: [],
    },
    BonesBlock: {
        className: "BonesBlock",
        category: "Vertex",
        description: "Adds skeleton bone transformation support to the vertex shader.",
        target: "Vertex",
        inputs: [
            { name: "matricesIndices", type: "Vector4" },
            { name: "matricesWeights", type: "Vector4" },
            { name: "matricesIndicesExtra", type: "Vector4", isOptional: true },
            { name: "matricesWeightsExtra", type: "Vector4", isOptional: true },
            { name: "world", type: "Matrix" },
        ],
        outputs: [{ name: "output", type: "Matrix" }],
    },
    InstancesBlock: {
        className: "InstancesBlock",
        category: "Vertex",
        description: "Adds instancing support.",
        target: "Vertex",
        inputs: [
            { name: "world0", type: "Vector4" },
            { name: "world1", type: "Vector4" },
            { name: "world2", type: "Vector4" },
            { name: "world3", type: "Vector4" },
            { name: "world", type: "Matrix" },
        ],
        outputs: [
            { name: "output", type: "Matrix" },
            { name: "instanceID", type: "Float" },
        ],
    },
    MorphTargetsBlock: {
        className: "MorphTargetsBlock",
        category: "Vertex",
        description: "Adds morph target animation support.",
        target: "Vertex",
        inputs: [
            { name: "position", type: "Vector3" },
            { name: "normal", type: "Vector3" },
            { name: "tangent", type: "Vector4", isOptional: true },
            { name: "uv", type: "Vector2", isOptional: true },
            { name: "uv2", type: "Vector2", isOptional: true },
            { name: "color", type: "Color4", isOptional: true },
        ],
        outputs: [
            { name: "positionOutput", type: "Vector3" },
            { name: "normalOutput", type: "Vector3" },
            { name: "tangentOutput", type: "Vector4" },
            { name: "uvOutput", type: "Vector2" },
            { name: "uv2Output", type: "Vector2" },
            { name: "colorOutput", type: "Color4" },
        ],
    },
    LightInformationBlock: {
        className: "LightInformationBlock",
        category: "Vertex",
        description: "Provides light information (direction, color, intensity) for a specific light in the scene.",
        target: "Vertex",
        inputs: [{ name: "worldPosition", type: "Vector4" }],
        outputs: [
            { name: "direction", type: "Vector3" },
            { name: "color", type: "Color3" },
            { name: "intensity", type: "Float" },
            { name: "shadowBias", type: "Float" },
            { name: "shadowNormalBias", type: "Float" },
            { name: "shadowDepthScale", type: "Float" },
            { name: "shadowDepthRange", type: "Vector2" },
        ],
    },

    // ─── Fragment Target ──────────────────────────────────────────────────
    FragmentOutputBlock: {
        className: "FragmentOutputBlock",
        category: "Output",
        description:
            "The fragment shader output. Connect the final color here. Every material needs exactly one. " +
            "Has 'rgb' (Color3), 'rgba' (Color4), 'a' (Float/alpha), and 'glow' (Color3) inputs.",
        target: "Fragment",
        inputs: [
            { name: "rgba", type: "Color4", isOptional: true },
            { name: "rgb", type: "Color3", isOptional: true },
            { name: "a", type: "Float", isOptional: true },
            { name: "glow", type: "Color3", isOptional: true },
        ],
        outputs: [],
    },
    DiscardBlock: {
        className: "DiscardBlock",
        category: "Fragment",
        description: "Discards the current fragment if the value is below the cutoff.",
        target: "Fragment",
        inputs: [
            { name: "value", type: "Float" },
            { name: "cutoff", type: "Float" },
        ],
        outputs: [],
    },
    ImageProcessingBlock: {
        className: "ImageProcessingBlock",
        category: "Fragment",
        description: "Applies image processing (tone mapping, contrast, exposure, etc.) to a color.",
        target: "Fragment",
        inputs: [{ name: "color", type: "Color4" }],
        outputs: [
            { name: "output", type: "Color4" },
            { name: "rgb", type: "Color3" },
        ],
    },
    PerturbNormalBlock: {
        className: "PerturbNormalBlock",
        category: "Fragment",
        description: "Perturbs the world normal using a normal map texture.",
        target: "Fragment",
        inputs: [
            { name: "worldPosition", type: "Vector4" },
            { name: "worldNormal", type: "Vector4" },
            { name: "worldTangent", type: "Vector4", isOptional: true },
            { name: "uv", type: "Vector2" },
            { name: "normalMapColor", type: "Color3" },
            { name: "strength", type: "Float" },
            { name: "viewDirection", type: "Vector3", isOptional: true },
            { name: "parallaxScale", type: "Float", isOptional: true },
            { name: "parallaxHeight", type: "Float", isOptional: true },
            { name: "TBN", type: "Object", isOptional: true },
            { name: "world", type: "Matrix", isOptional: true },
        ],
        outputs: [
            { name: "output", type: "Vector4" },
            { name: "uvOffset", type: "Vector2" },
        ],
    },
    FrontFacingBlock: {
        className: "FrontFacingBlock",
        category: "Fragment",
        description: "Returns 1.0 if the fragment is front-facing, 0.0 otherwise.",
        target: "Fragment",
        inputs: [],
        outputs: [{ name: "output", type: "Float" }],
    },
    DerivativeBlock: {
        className: "DerivativeBlock",
        category: "Fragment",
        description: "Computes screen-space derivatives (dFdx, dFdy) of an input.",
        target: "Fragment",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [
            { name: "dx", type: "BasedOnInput" },
            { name: "dy", type: "BasedOnInput" },
        ],
    },
    ScreenSpaceBlock: {
        className: "ScreenSpaceBlock",
        category: "Fragment",
        description: "Provides the screen-space position of the current fragment.",
        target: "Fragment",
        inputs: [
            { name: "vector", type: "Vector3" },
            { name: "worldViewProjection", type: "Matrix" },
        ],
        outputs: [
            { name: "output", type: "Vector2" },
            { name: "x", type: "Float" },
            { name: "y", type: "Float" },
        ],
    },
    ScreenSizeBlock: {
        className: "ScreenSizeBlock",
        category: "Fragment",
        description: "Provides the screen size in pixels.",
        target: "Fragment",
        inputs: [],
        outputs: [
            { name: "xy", type: "Vector2" },
            { name: "x", type: "Float" },
            { name: "y", type: "Float" },
        ],
    },
    TwirlBlock: {
        className: "TwirlBlock",
        category: "Fragment",
        description: "Applies a twirl effect to UV coordinates.",
        target: "Fragment",
        inputs: [
            { name: "input", type: "Vector2" },
            { name: "strength", type: "Float" },
            { name: "center", type: "Vector2" },
            { name: "offset", type: "Vector2" },
        ],
        outputs: [
            { name: "output", type: "Vector2" },
            { name: "x", type: "Float" },
            { name: "y", type: "Float" },
        ],
    },
    FragCoordBlock: {
        className: "FragCoordBlock",
        category: "Fragment",
        description: "Provides the gl_FragCoord value.",
        target: "Fragment",
        inputs: [],
        outputs: [
            { name: "xy", type: "Vector2" },
            { name: "xyz", type: "Vector3" },
            { name: "xyzw", type: "Vector4" },
            { name: "x", type: "Float" },
            { name: "y", type: "Float" },
            { name: "z", type: "Float" },
            { name: "w", type: "Float" },
        ],
    },
    ShadowMapBlock: {
        className: "ShadowMapBlock",
        category: "Fragment",
        description: "Generates a shadow map output.",
        target: "Fragment",
        inputs: [
            { name: "worldPosition", type: "Vector4" },
            { name: "viewProjection", type: "Matrix" },
            { name: "worldNormal", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "depth", type: "Vector3" }],
    },

    // ─── Dual (Vertex + Fragment) ─────────────────────────────────────────
    TextureBlock: {
        className: "TextureBlock",
        category: "Texture",
        description: "Samples a 2D texture. Provide a URL via the texture property, or feed a shared ImageSourceBlock into the 'source' input instead of an embedded texture.",
        target: "VertexAndFragment",
        inputs: [
            { name: "uv", type: "AutoDetect" },
            { name: "source", type: "Object", isOptional: true },
            { name: "layer", type: "Float", isOptional: true },
            { name: "lod", type: "Float", isOptional: true },
        ],
        outputs: [
            { name: "rgba", type: "Color4" },
            { name: "rgb", type: "Color3" },
            { name: "r", type: "Float" },
            { name: "g", type: "Float" },
            { name: "b", type: "Float" },
            { name: "a", type: "Float" },
            { name: "level", type: "Float" },
        ],
        properties: {
            texture: "Texture — set via new Texture(url, scene)",
            convertToGammaSpace: "boolean",
            convertToLinearSpace: "boolean",
        },
    },
    ReflectionTextureBlock: {
        className: "ReflectionTextureBlock",
        category: "Texture",
        description: "Samples a reflection/environment texture (cubemap, equirectangular, etc.).",
        target: "VertexAndFragment",
        inputs: [
            { name: "position", type: "AutoDetect" },
            { name: "worldPosition", type: "Vector4" },
            { name: "worldNormal", type: "Vector4" },
            { name: "world", type: "Matrix" },
            { name: "cameraPosition", type: "Vector3" },
            { name: "view", type: "Matrix" },
        ],
        outputs: [
            { name: "rgb", type: "Color3" },
            { name: "rgba", type: "Color4" },
            { name: "r", type: "Float" },
            { name: "g", type: "Float" },
            { name: "b", type: "Float" },
            { name: "a", type: "Float" },
        ],
    },
    LightBlock: {
        className: "LightBlock",
        category: "Lighting",
        description: "Computes lighting (diffuse and specular) for a given world position and normal. Uses scene lights.",
        target: "VertexAndFragment",
        inputs: [
            { name: "worldPosition", type: "Vector4" },
            { name: "worldNormal", type: "AutoDetect" },
            { name: "cameraPosition", type: "Vector3" },
            { name: "glossiness", type: "Float", isOptional: true },
            { name: "glossPower", type: "Float", isOptional: true },
            { name: "diffuseColor", type: "Color3", isOptional: true },
            { name: "specularColor", type: "Color3", isOptional: true },
            { name: "view", type: "Matrix" },
        ],
        outputs: [
            { name: "diffuseOutput", type: "Color3" },
            { name: "specularOutput", type: "Color3" },
            { name: "shadow", type: "Float" },
        ],
    },
    FogBlock: {
        className: "FogBlock",
        category: "Misc",
        description: "Adds fog to the material output.",
        target: "VertexAndFragment",
        inputs: [
            { name: "worldPosition", type: "Vector4" },
            { name: "view", type: "Matrix" },
            { name: "input", type: "AutoDetect" },
            { name: "fogColor", type: "Color3" },
        ],
        outputs: [{ name: "output", type: "Color3" }],
    },
    CurrentScreenBlock: {
        className: "CurrentScreenBlock",
        category: "Texture",
        description: "Samples the current screen (for post-process / refraction effects).",
        target: "VertexAndFragment",
        inputs: [{ name: "uv", type: "AutoDetect" }],
        outputs: [
            { name: "rgba", type: "Color4" },
            { name: "rgb", type: "Color3" },
            { name: "r", type: "Float" },
            { name: "g", type: "Float" },
            { name: "b", type: "Float" },
            { name: "a", type: "Float" },
        ],
    },
    ImageSourceBlock: {
        className: "ImageSourceBlock",
        category: "Texture",
        description: "Provides a texture source that can be shared by multiple texture blocks.",
        target: "VertexAndFragment",
        inputs: [],
        outputs: [
            { name: "source", type: "Object" },
            { name: "dimensions", type: "Vector2" },
        ],
        properties: {
            texture: "Texture — set via new Texture(url, scene)",
        },
    },
    SceneDepthBlock: {
        className: "SceneDepthBlock",
        category: "Texture",
        description: "Samples the scene depth texture.",
        target: "VertexAndFragment",
        inputs: [{ name: "uv", type: "AutoDetect" }],
        outputs: [{ name: "depth", type: "Float" }],
    },

    // ─── PBR ─────────────────────────────────────────────────────────────
    PBRMetallicRoughnessBlock: {
        className: "PBRMetallicRoughnessBlock",
        category: "PBR",
        description:
            "Full PBR (Metallic-Roughness) lighting model. This is a powerful all-in-one block for physically-based rendering. " +
            "Connect world position, normal, camera position, and material properties.",
        target: "VertexAndFragment",
        defaultSerializedProperties: {
            lightFalloff: 0,
            useAlphaTest: false,
            alphaTestCutoff: 0.5,
            useAlphaBlending: false,
            useRadianceOverAlpha: true,
            useSpecularOverAlpha: true,
            enableSpecularAntiAliasing: false,
            realTimeFiltering: false,
            realTimeFilteringQuality: 8,
            useEnergyConservation: true,
            useRadianceOcclusion: true,
            useHorizonOcclusion: true,
            unlit: false,
            forceNormalForward: false,
            debugMode: 0,
            debugLimit: -1,
            debugFactor: 1,
            generateOnlyFragmentCode: false,
            directIntensity: 1.0,
            environmentIntensity: 1.0,
            specularIntensity: 1.0,
        },
        inputs: [
            { name: "worldPosition", type: "Vector4" },
            { name: "worldNormal", type: "Vector4" },
            { name: "view", type: "Matrix" },
            { name: "cameraPosition", type: "Vector3" },
            { name: "perturbedNormal", type: "Vector4", isOptional: true },
            { name: "baseColor", type: "Color3", isOptional: true },
            { name: "metallic", type: "Float", isOptional: true },
            { name: "roughness", type: "Float", isOptional: true },
            { name: "ambientOcc", type: "Float", isOptional: true },
            { name: "opacity", type: "Float", isOptional: true },
            { name: "indexOfRefraction", type: "Float", isOptional: true },
            { name: "ambientColor", type: "Color3", isOptional: true },
            { name: "reflection", type: "Object", isOptional: true },
            { name: "clearcoat", type: "Object", isOptional: true },
            { name: "sheen", type: "Object", isOptional: true },
            { name: "subsurface", type: "Object", isOptional: true },
            { name: "anisotropy", type: "Object", isOptional: true },
            { name: "iridescence", type: "Object", isOptional: true },
        ],
        outputs: [
            { name: "ambientClr", type: "Color3" },
            { name: "diffuseDir", type: "Color3" },
            { name: "specularDir", type: "Color3" },
            { name: "clearcoatDir", type: "Color3" },
            { name: "sheenDir", type: "Color3" },
            { name: "diffuseInd", type: "Color3" },
            { name: "specularInd", type: "Color3" },
            { name: "clearcoatInd", type: "Color3" },
            { name: "sheenInd", type: "Color3" },
            { name: "refraction", type: "Color3" },
            { name: "lighting", type: "Color3" },
            { name: "shadow", type: "Float" },
            { name: "alpha", type: "Float" },
        ],
    },
    ReflectionBlock: {
        className: "ReflectionBlock",
        category: "PBR",
        description: "PBR reflection block — connects to PBRMetallicRoughnessBlock's reflection input.",
        target: "VertexAndFragment",
        inputs: [
            { name: "position", type: "AutoDetect" },
            { name: "world", type: "Matrix" },
            { name: "color", type: "Color3", isOptional: true },
        ],
        outputs: [{ name: "reflection", type: "Object" }],
    },
    RefractionBlock: {
        className: "RefractionBlock",
        category: "PBR",
        description: "PBR refraction block — connects to PBRMetallicRoughnessBlock's subsurface.",
        target: "VertexAndFragment",
        inputs: [
            { name: "intensity", type: "Float", isOptional: true },
            { name: "tintAtDistance", type: "Float", isOptional: true },
            { name: "volumeIndexOfRefraction", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "refraction", type: "Object" }],
    },
    SheenBlock: {
        className: "SheenBlock",
        category: "PBR",
        description: "PBR sheen block for fabric-like materials.",
        target: "Fragment",
        inputs: [
            { name: "intensity", type: "Float" },
            { name: "color", type: "Color3" },
            { name: "roughness", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "sheen", type: "Object" }],
    },
    AnisotropyBlock: {
        className: "AnisotropyBlock",
        category: "PBR",
        description: "PBR anisotropy block for directional reflections.",
        target: "Fragment",
        inputs: [
            { name: "intensity", type: "Float", isOptional: true },
            { name: "direction", type: "Vector2", isOptional: true },
            { name: "uv", type: "Vector2", isOptional: true },
            { name: "worldTangent", type: "Vector4", isOptional: true },
            { name: "TBN", type: "Object", isOptional: true },
            { name: "roughness", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "anisotropy", type: "Object" }],
    },
    ClearCoatBlock: {
        className: "ClearCoatBlock",
        category: "PBR",
        description: "PBR clear coat block for an additional transparent layer (like car paint).",
        target: "Fragment",
        inputs: [
            { name: "intensity", type: "Float", isOptional: true },
            { name: "roughness", type: "Float", isOptional: true },
            { name: "indexOfRefraction", type: "Float", isOptional: true },
            { name: "normalMapColor", type: "Color3", isOptional: true },
            { name: "uv", type: "Vector2", isOptional: true },
            { name: "tintColor", type: "Color3", isOptional: true },
            { name: "tintAtDistance", type: "Float", isOptional: true },
            { name: "tintThickness", type: "Float", isOptional: true },
            { name: "worldTangent", type: "Vector4", isOptional: true },
            { name: "worldNormal", type: "AutoDetect", isOptional: true },
            { name: "TBN", type: "Object", isOptional: true },
        ],
        outputs: [{ name: "clearcoat", type: "Object" }],
    },
    SubSurfaceBlock: {
        className: "SubSurfaceBlock",
        category: "PBR",
        description: "PBR sub-surface scattering for translucent materials (skin, wax, etc.).",
        target: "Fragment",
        inputs: [
            { name: "thickness", type: "Float", isOptional: true },
            { name: "tintColor", type: "Color3", isOptional: true },
            { name: "translucencyIntensity", type: "Float", isOptional: true },
            { name: "translucencyDiffusionDist", type: "Color3", isOptional: true },
            { name: "refraction", type: "Object", isOptional: true },
            { name: "dispersion", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "subsurface", type: "Object" }],
    },
    IridescenceBlock: {
        className: "IridescenceBlock",
        category: "PBR",
        description: "PBR iridescence for rainbow-like thin-film effects.",
        target: "Fragment",
        inputs: [
            { name: "intensity", type: "Float", isOptional: true },
            { name: "indexOfRefraction", type: "Float", isOptional: true },
            { name: "thickness", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "iridescence", type: "Object" }],
    },

    // ─── Teleport ────────────────────────────────────────────────────────
    TeleportInBlock: {
        className: "NodeMaterialTeleportInBlock",
        category: "Teleport",
        description: "Teleport input — sends a value to a paired TeleportOutBlock without a visible connection line.",
        target: "Neutral",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [],
    },
    TeleportOutBlock: {
        className: "NodeMaterialTeleportOutBlock",
        category: "Teleport",
        description: "Teleport output — receives a value from a paired TeleportInBlock.",
        target: "Neutral",
        inputs: [],
        outputs: [{ name: "output", type: "AutoDetect" }],
    },

    // ─── Tri/Bi-Planar ──────────────────────────────────────────────────
    TriPlanarBlock: {
        className: "TriPlanarBlock",
        category: "Texture",
        description: "Tri-planar texture mapping — projects a texture from 3 axes to avoid UV stretching.",
        target: "Neutral",
        inputs: [
            { name: "position", type: "AutoDetect" },
            { name: "normal", type: "AutoDetect" },
            { name: "sharpness", type: "Float", isOptional: true },
            { name: "source", type: "Object", isOptional: true },
            { name: "sourceY", type: "Object", isOptional: true },
            { name: "sourceZ", type: "Object", isOptional: true },
        ],
        outputs: [
            { name: "rgba", type: "Color4" },
            { name: "rgb", type: "Color3" },
            { name: "r", type: "Float" },
            { name: "g", type: "Float" },
            { name: "b", type: "Float" },
            { name: "a", type: "Float" },
            { name: "level", type: "Float" },
        ],
    },
    BiPlanarBlock: {
        className: "BiPlanarBlock",
        category: "Texture",
        description: "Bi-planar texture mapping — projects a texture from 2 dominant axes.",
        target: "Neutral",
        inputs: [
            { name: "position", type: "AutoDetect" },
            { name: "normal", type: "AutoDetect" },
            { name: "sharpness", type: "Float", isOptional: true },
            { name: "source", type: "Object", isOptional: true },
            { name: "sourceY", type: "Object", isOptional: true },
        ],
        outputs: [
            { name: "rgba", type: "Color4" },
            { name: "rgb", type: "Color3" },
            { name: "r", type: "Float" },
            { name: "g", type: "Float" },
            { name: "b", type: "Float" },
            { name: "a", type: "Float" },
            { name: "level", type: "Float" },
        ],
    },
    MeshAttributeExistsBlock: {
        className: "MeshAttributeExistsBlock",
        category: "Misc",
        description: "Outputs 'input' or 'fallback' based on whether a mesh attribute (UV, color, etc.) exists.",
        target: "Neutral",
        inputs: [
            { name: "input", type: "AutoDetect" },
            { name: "fallback", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            attributeType: "MeshAttributeExistsBlockTypes — None, Normal, Tangent, VertexColor, UV1, UV2, UV3, UV4, UV5, UV6",
        },
    },

    // ─── Particle Blocks ────────────────────────────────────────────────
    ParticleTextureBlock: {
        className: "ParticleTextureBlock",
        category: "Particle",
        description: "Samples a particle texture.",
        target: "VertexAndFragment",
        inputs: [{ name: "uv", type: "AutoDetect" }],
        outputs: [
            { name: "rgba", type: "Color4" },
            { name: "rgb", type: "Color3" },
            { name: "r", type: "Float" },
            { name: "g", type: "Float" },
            { name: "b", type: "Float" },
            { name: "a", type: "Float" },
        ],
    },
    ParticleRampGradientBlock: {
        className: "ParticleRampGradientBlock",
        category: "Particle",
        description: "Applies a ramp gradient to particle color.",
        target: "Fragment",
        inputs: [{ name: "color", type: "Color4" }],
        outputs: [{ name: "rampColor", type: "Color4" }],
    },
    ParticleBlendMultiplyBlock: {
        className: "ParticleBlendMultiplyBlock",
        category: "Particle",
        description: "Applies blend-multiply to particle color.",
        target: "Fragment",
        inputs: [
            { name: "color", type: "Color4" },
            { name: "alphaTexture", type: "Float" },
            { name: "alphaColor", type: "Float" },
        ],
        outputs: [{ name: "blendColor", type: "Color4" }],
    },

    // ─── Normal Mapping ──────────────────────────────────────────────────
    TBNBlock: {
        className: "TBNBlock",
        category: "Fragment",
        description: "Computes the Tangent-Bitangent-Normal (TBN) matrix for tangent-space normal mapping. " + "Connect to PerturbNormalBlock or ClearCoatBlock TBN input.",
        target: "Fragment",
        inputs: [
            { name: "normal", type: "AutoDetect" },
            { name: "tangent", type: "Vector4" },
            { name: "world", type: "Matrix" },
        ],
        outputs: [
            { name: "TBN", type: "Object" },
            { name: "row0", type: "Vector3" },
            { name: "row1", type: "Vector3" },
            { name: "row2", type: "Vector3" },
        ],
    },
    HeightToNormalBlock: {
        className: "HeightToNormalBlock",
        category: "Fragment",
        description:
            "Converts a height field (Float) to a normal vector using screen-space derivatives. " + "Output is in tangent space by default (xyz with 0.5 offset) or world space.",
        target: "Fragment",
        inputs: [
            { name: "input", type: "Float" },
            { name: "worldPosition", type: "Vector3" },
            { name: "worldNormal", type: "Vector3" },
            { name: "worldTangent", type: "AutoDetect", isOptional: true },
        ],
        outputs: [
            { name: "output", type: "Vector4" },
            { name: "xyz", type: "Vector3" },
        ],
        properties: {
            generateInWorldSpace: "boolean — false=tangent space (default), true=world space",
            automaticNormalizationNormal: "boolean — auto-normalize normal input (default true)",
            automaticNormalizationTangent: "boolean — auto-normalize tangent input (default true)",
        },
        defaultSerializedProperties: {
            generateInWorldSpace: false,
            automaticNormalizationNormal: true,
            automaticNormalizationTangent: true,
        },
    },

    // ─── Matrix ──────────────────────────────────────────────────────────
    MatrixSplitterBlock: {
        className: "MatrixSplitterBlock",
        category: "Matrix",
        description: "Splits a 4×4 matrix into its individual row and column vectors.",
        target: "Neutral",
        inputs: [{ name: "input", type: "Matrix" }],
        outputs: [
            { name: "row0", type: "Vector4" },
            { name: "row1", type: "Vector4" },
            { name: "row2", type: "Vector4" },
            { name: "row3", type: "Vector4" },
            { name: "col0", type: "Vector4" },
            { name: "col1", type: "Vector4" },
            { name: "col2", type: "Vector4" },
            { name: "col3", type: "Vector4" },
        ],
    },

    // ─── Fragment Depth ──────────────────────────────────────────────────
    FragDepthBlock: {
        className: "FragDepthBlock",
        category: "Fragment",
        description: "Writes to gl_FragDepth. Provide either a direct depth float, " + "or worldPos + viewProjection to compute depth automatically.",
        target: "Fragment",
        inputs: [
            { name: "depth", type: "Float", isOptional: true },
            { name: "worldPos", type: "Vector4", isOptional: true },
            { name: "viewProjection", type: "Matrix", isOptional: true },
        ],
        outputs: [],
    },

    // ─── Ambient Occlusion ───────────────────────────────────────────────
    AmbientOcclusionBlock: {
        className: "AmbientOcclusionBlock",
        category: "Fragment",
        description: "Evaluates screen-space ambient occlusion (SSAO) from a depth texture.",
        target: "Fragment",
        inputs: [
            { name: "source", type: "Object" },
            { name: "screenSize", type: "Vector2" },
        ],
        outputs: [{ name: "occlusion", type: "Float" }],
        properties: {
            radius: "number — SSAO radius (default 0.0001)",
            area: "number — SSAO area (default 0.0075)",
            fallOff: "number — SSAO falloff (default 0.000001)",
        },
        defaultSerializedProperties: {
            radius: 0.0001,
            area: 0.0075,
            fallOff: 0.000001,
        },
    },

    // ─── Clip Planes ─────────────────────────────────────────────────────
    ClipPlanesBlock: {
        className: "ClipPlanesBlock",
        category: "Misc",
        description: "Implements clip planes for the material. Connect worldPosition to enable clipping.",
        target: "VertexAndFragment",
        inputs: [{ name: "worldPosition", type: "Vector4" }],
        outputs: [],
    },

    // ─── Control Flow / Loops ────────────────────────────────────────────
    LoopBlock: {
        className: "LoopBlock",
        category: "Logic",
        description:
            "Wraps code in a for loop. The input value is passed through and the output is the result after all iterations. " +
            "Use StorageReadBlock/StorageWriteBlock to read/write loop variables.",
        target: "Neutral",
        inputs: [
            { name: "input", type: "AutoDetect" },
            { name: "iterations", type: "Float", isOptional: true },
        ],
        outputs: [
            { name: "output", type: "BasedOnInput" },
            { name: "index", type: "Float" },
            { name: "loopID", type: "Object" },
        ],
        properties: {
            iterations: "number — number of loop iterations (default 4)",
        },
        defaultSerializedProperties: { iterations: 4 },
    },
    StorageReadBlock: {
        className: "StorageReadBlock",
        category: "Logic",
        description: "Reads the current iteration value from a LoopBlock. Connect the loopID output to this block.",
        target: "Neutral",
        inputs: [{ name: "loopID", type: "Object" }],
        outputs: [{ name: "value", type: "AutoDetect" }],
    },
    StorageWriteBlock: {
        className: "StorageWriteBlock",
        category: "Logic",
        description: "Writes a value into the loop variable inside a LoopBlock iteration.",
        target: "Neutral",
        inputs: [
            { name: "loopID", type: "Object" },
            { name: "value", type: "AutoDetect" },
        ],
        outputs: [],
    },

    // ─── PrePass ─────────────────────────────────────────────────────────
    PrePassOutputBlock: {
        className: "PrePassOutputBlock",
        category: "Output",
        description: "Writes to multiple prepass render targets (depth, position, normal, reflectivity, velocity).",
        target: "Fragment",
        inputs: [
            { name: "viewDepth", type: "Float", isOptional: true },
            { name: "screenDepth", type: "Float", isOptional: true },
            { name: "worldPosition", type: "AutoDetect", isOptional: true },
            { name: "localPosition", type: "AutoDetect", isOptional: true },
            { name: "viewNormal", type: "AutoDetect", isOptional: true },
            { name: "worldNormal", type: "AutoDetect", isOptional: true },
            { name: "reflectivity", type: "AutoDetect", isOptional: true },
            { name: "velocity", type: "AutoDetect", isOptional: true },
            { name: "velocityLinear", type: "AutoDetect", isOptional: true },
        ],
        outputs: [],
    },
    PrePassTextureBlock: {
        className: "PrePassTextureBlock",
        category: "Input",
        description: "Reads from prepass render target textures (position, depth, normal, etc.).",
        target: "VertexAndFragment",
        inputs: [],
        outputs: [
            { name: "position", type: "Object" },
            { name: "localPosition", type: "Object" },
            { name: "depth", type: "Object" },
            { name: "screenDepth", type: "Object" },
            { name: "normal", type: "Object" },
            { name: "worldNormal", type: "Object" },
        ],
    },
    DepthSourceBlock: {
        className: "DepthSourceBlock",
        category: "Input",
        description: "Provides a depth texture from the scene's depth renderer as an image source.",
        target: "VertexAndFragment",
        inputs: [],
        outputs: [
            { name: "source", type: "Object" },
            { name: "dimensions", type: "Vector2" },
        ],
    },

    // ─── Gaussian Splatting ──────────────────────────────────────────────
    GaussianSplattingBlock: {
        className: "GaussianSplattingBlock",
        category: "GaussianSplatting",
        description: "Vertex computation for Gaussian Splatting rendering with spherical harmonics support.",
        target: "Vertex",
        inputs: [
            { name: "splatPosition", type: "Vector3" },
            { name: "splatScale", type: "Vector2", isOptional: true },
            { name: "world", type: "Matrix" },
            { name: "view", type: "Matrix" },
            { name: "projection", type: "Matrix" },
        ],
        outputs: [
            { name: "splatVertex", type: "Vector4" },
            { name: "SH", type: "Color3" },
        ],
    },
    GaussianBlock: {
        className: "GaussianBlock",
        category: "GaussianSplatting",
        description: "Fragment part of Gaussian Splatting that processes splatted color values.",
        target: "Fragment",
        inputs: [{ name: "splatColor", type: "Color4" }],
        outputs: [
            { name: "rgba", type: "Color4" },
            { name: "rgb", type: "Color3" },
            { name: "alpha", type: "Float" },
        ],
    },
    SplatReaderBlock: {
        className: "SplatReaderBlock",
        category: "GaussianSplatting",
        description: "Reads splat data (position and color) from textures for Gaussian Splatting.",
        target: "Vertex",
        inputs: [{ name: "splatIndex", type: "Float" }],
        outputs: [
            { name: "splatPosition", type: "Vector3" },
            { name: "splatColor", type: "Color4" },
        ],
    },

    // ─── Smart Filter (SFE) ─────────────────────────────────────────────
    SmartFilterFragmentOutputBlock: {
        className: "SmartFilterFragmentOutputBlock",
        category: "Output",
        description: "Fragment output for the Smart Filter Editor (SFE) framework. Outputs as nmeMain() function.",
        target: "Fragment",
        inputs: [
            { name: "rgba", type: "Color4", isOptional: true },
            { name: "rgb", type: "Color3", isOptional: true },
            { name: "a", type: "Float", isOptional: true },
            { name: "glow", type: "Color3", isOptional: true },
        ],
        outputs: [],
    },
    SmartFilterTextureBlock: {
        className: "SmartFilterTextureBlock",
        category: "Texture",
        description: "Texture block for the SFE framework. Supports compositing with optional ImageSourceBlock.",
        target: "VertexAndFragment",
        inputs: [
            { name: "uv", type: "Vector2" },
            { name: "source", type: "Object", isOptional: true },
        ],
        outputs: [
            { name: "rgba", type: "Color4" },
            { name: "rgb", type: "Color3" },
            { name: "r", type: "Float" },
            { name: "g", type: "Float" },
            { name: "b", type: "Float" },
            { name: "a", type: "Float" },
        ],
        properties: {
            isMainInput: "boolean — whether this is the main SFE input (default false)",
        },
        defaultSerializedProperties: { isMainInput: false },
    },

    // ─── Utility / Editor ────────────────────────────────────────────────
    ElbowBlock: {
        className: "ElbowBlock",
        category: "Utility",
        description: "Pass-through block that preserves input type. Used for visual routing in the NME editor.",
        target: "Neutral",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
    NodeMaterialDebugBlock: {
        className: "NodeMaterialDebugBlock",
        category: "Debug",
        description: "Renders intermediate shader values for debugging. Only one should be active per material.",
        target: "Fragment",
        inputs: [{ name: "debug", type: "AutoDetect" }],
        outputs: [],
        properties: {
            renderAlpha: "boolean — whether to render alpha channel (default false)",
            isActive: "boolean — whether this debug output is active (default false)",
        },
        defaultSerializedProperties: { isActive: false, renderAlpha: false },
    },
    CustomBlock: {
        className: "CustomBlock",
        category: "Custom",
        description:
            "User-defined block with arbitrary shader code and dynamic inputs/outputs. " +
            "Configure via the 'options' property with code, functionName, target, inParameters, outParameters.",
        target: "Neutral",
        inputs: [],
        outputs: [],
        properties: {
            options:
                "Object — { code: string[], functionName: string, target: string, " +
                "inParameters: Array<{name, type}>, outParameters: Array<{name, type}>, " +
                "inLinkedConnectionTypes: Array }",
        },
    },
};

/**
 * Returns a summary list of all block types, grouped by category.
 * @returns A markdown-formatted string listing all block types by category
 */
export function GetBlockCatalogSummary(): string {
    const categories = new Map<string, string[]>();
    for (const [key, info] of Object.entries(BlockRegistry)) {
        const cat = info.category;
        if (!categories.has(cat)) {
            categories.set(cat, []);
        }
        categories.get(cat)!.push(`${key}: ${info.description.split(".")[0]}`);
    }
    const lines: string[] = [];
    for (const [cat, blocks] of categories) {
        lines.push(`\n## ${cat}`);
        for (const b of blocks) {
            lines.push(`  - ${b}`);
        }
    }
    return lines.join("\n");
}

/**
 * Returns detailed info about a specific block type.
 * @param blockType - The block type key (e.g. "InputBlock", "MultiplyBlock")
 * @returns The block type info or undefined if not found
 */
export function GetBlockTypeDetails(blockType: string): IBlockTypeInfo | undefined {
    return BlockRegistry[blockType];
}

/**
 * Reverse lookup: className (as it appears in customType after stripping "BABYLON.")
 * → IBlockTypeInfo.  This handles cases where the registry key differs from the
 * className (e.g. key "MatrixBuilderBlock" → className "MatrixBuilder",
 * key "TeleportInBlock" → className "NodeMaterialTeleportInBlock").
 */
export const BlockRegistryByClassName: Record<string, IBlockTypeInfo> = {};
for (const info of Object.values(BlockRegistry)) {
    BlockRegistryByClassName[info.className] = info;
}
