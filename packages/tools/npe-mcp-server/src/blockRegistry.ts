/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Complete registry of all Node Particle block types available in Babylon.js.
 * Each entry describes the block's class name, category, and its inputs/outputs.
 */

/**
 * Describes a single input or output connection point on a block.
 */
export interface IConnectionPointInfo {
    /** Name of the connection point (e.g. "particle", "output") */
    name: string;
    /** Data type of the connection point (e.g. "Float", "Vector3", "Particle") */
    type: string;
    /** Whether the connection is optional */
    isOptional?: boolean;
}

/**
 * Describes a block type in the NPE catalog.
 */
export interface IBlockTypeInfo {
    /** The Babylon.js class name for this block */
    className: string;
    /** Category for grouping (e.g. "Shape", "Update", "Math", "System") */
    category: string;
    /** Human-readable description of what this block does */
    description: string;
    /** List of input connection points */
    inputs: IConnectionPointInfo[];
    /** List of output connection points */
    outputs: IConnectionPointInfo[];
    /** Extra properties that can be configured on the block */
    properties?: Record<string, string>;
    /**
     * Default property values to bake into newly created blocks of this type.
     * These are REQUIRED by the Babylon deserialiser – omitting them can cause
     * build-time crashes.
     */
    defaultSerializedProperties?: Record<string, unknown>;
}

/**
 * Full catalog of block types. This is the canonical reference an AI agent uses
 * to know which blocks exist and what ports they have.
 * NodeParticleBlock is the non-creatable base class; the catalog exposes its concrete subclasses only.
 */
export const BlockRegistry: Record<string, IBlockTypeInfo> = {
    // ═══════════════════════════════════════════════════════════════════════
    //  Input
    // ═══════════════════════════════════════════════════════════════════════
    ParticleInputBlock: {
        className: "ParticleInputBlock",
        category: "Input",
        description:
            "Provides input values to the particle graph. Can be configured as a contextual source " +
            "(Position, Direction, Age, Lifetime, Color, etc.), a system source (Time, Delta, Emitter, CameraPosition), " +
            "or a constant value (Float, Int, Vector2, Vector3, Color4, Matrix).",
        inputs: [],
        outputs: [{ name: "output", type: "AutoDetect" }],
        properties: {
            type: "NodeParticleBlockConnectionPointTypes — the data type (Int, Float, Vector2, Vector3, Color4, Matrix, Texture)",
            contextualValue:
                "NodeParticleContextualSources — None, Position, Direction, Age, Lifetime, Color, ScaledDirection, Scale, " +
                "AgeGradient, Angle, SpriteCellIndex, SpriteCellStart, SpriteCellEnd, InitialColor, ColorDead, " +
                "InitialDirection, ColorStep, ScaledColorStep, LocalPositionUpdated, Size, DirectionScale",
            systemSource: "NodeParticleSystemSources — None, Time, Delta, Emitter, CameraPosition",
            value: "The actual constant value (number, Vector2, Vector3, Color4, Matrix)",
            min: "number — minimum value for inspector slider",
            max: "number — maximum value for inspector slider",
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  System (Output)
    // ═══════════════════════════════════════════════════════════════════════
    SystemBlock: {
        className: "SystemBlock",
        category: "System",
        description:
            "The output block that produces a particle system. Every particle graph needs at least one. " +
            "A graph can have multiple SystemBlocks, each producing a separate ParticleSystem.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "emitRate", type: "Int", isOptional: true },
            { name: "texture", type: "Texture" },
            { name: "translationPivot", type: "Vector2", isOptional: true },
            { name: "textureMask", type: "Color4", isOptional: true },
            { name: "targetStopDuration", type: "Float", isOptional: true },
            { name: "onStart", type: "System", isOptional: true },
            { name: "onEnd", type: "System", isOptional: true },
        ],
        outputs: [{ name: "system", type: "System" }],
        properties: {
            blendMode: "number — blend mode (0=OneOne, 1=Standard, 2=Add, 3=Multiply, 4=MultiplyAdd). Default: 0",
            capacity: "number — max particles in system. Default: 1000",
            manualEmitCount: "number — manual emit count (-1 for auto). Default: -1",
            startDelay: "number — delay before start in ms. Default: 0",
            updateSpeed: "number — update speed. Default: 0.0167",
            preWarmCycles: "number — pre-warm cycles. Default: 0",
            preWarmStepOffset: "number — pre-warm step multiplier. Default: 0",
            isBillboardBased: "boolean — billboard-based particles. Default: true",
            billBoardMode: "number — billboard mode (7=All, 2=Y, 6=Stretched, 9=StretchedLocal). Default: 7",
            isLocal: "boolean — local coordinate space. Default: false",
            disposeOnStop: "boolean — dispose when stopped. Default: false",
            doNoStart: "boolean — do not auto-start. Default: false",
            renderingGroupId: "number — rendering group. Default: 0",
        },
        defaultSerializedProperties: {
            blendMode: 0,
            capacity: 1000,
            manualEmitCount: -1,
            startDelay: 0,
            updateSpeed: 0.0167,
            preWarmCycles: 0,
            preWarmStepOffset: 0,
            isBillboardBased: true,
            billBoardMode: 7,
            isLocal: false,
            disposeOnStop: false,
            doNoStart: false,
            renderingGroupId: 0,
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Texture
    // ═══════════════════════════════════════════════════════════════════════
    ParticleTextureSourceBlock: {
        className: "ParticleTextureSourceBlock",
        category: "Texture",
        description: "Provides a texture for particles. The texture URL or cached data is configured via properties.",
        inputs: [],
        outputs: [{ name: "texture", type: "Texture" }],
        properties: {
            url: "string — URL of the particle texture image (e.g. 'https://assets.babylonjs.com/textures/flare.png')",
            textureDataUrl: "string — base64 data URL alternative to url (set serializedCachedData: true)",
            serializedCachedData: "boolean — whether texture is stored as base64 data URL. Default: false",
            invertY: "boolean — whether to invert Y. Default: true",
        },
        defaultSerializedProperties: { invertY: true, serializedCachedData: false },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Emitter Shapes
    // ═══════════════════════════════════════════════════════════════════════
    BoxShapeBlock: {
        className: "BoxShapeBlock",
        category: "Shape",
        description: "Box-shaped emitter that spawns particles within a box region.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "direction1", type: "Vector3", isOptional: true },
            { name: "direction2", type: "Vector3", isOptional: true },
            { name: "minEmitBox", type: "Vector3", isOptional: true },
            { name: "maxEmitBox", type: "Vector3", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    SphereShapeBlock: {
        className: "SphereShapeBlock",
        category: "Shape",
        description: "Sphere-shaped emitter that spawns particles on or within a sphere.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "radius", type: "Float", isOptional: true },
            { name: "radiusRange", type: "Float", isOptional: true },
            { name: "directionRandomizer", type: "Float", isOptional: true },
            { name: "direction1", type: "Vector3", isOptional: true },
            { name: "direction2", type: "Vector3", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    ConeShapeBlock: {
        className: "ConeShapeBlock",
        category: "Shape",
        description: "Cone-shaped emitter that spawns particles within a cone.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "radius", type: "Float", isOptional: true },
            { name: "angle", type: "Float", isOptional: true },
            { name: "radiusRange", type: "Float", isOptional: true },
            { name: "heightRange", type: "Float", isOptional: true },
            { name: "directionRandomizer", type: "Float", isOptional: true },
            { name: "direction1", type: "Vector3", isOptional: true },
            { name: "direction2", type: "Vector3", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    CylinderShapeBlock: {
        className: "CylinderShapeBlock",
        category: "Shape",
        description: "Cylinder-shaped emitter that spawns particles within a cylinder.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "radius", type: "Float", isOptional: true },
            { name: "height", type: "Float", isOptional: true },
            { name: "radiusRange", type: "Float", isOptional: true },
            { name: "directionRandomizer", type: "Float", isOptional: true },
            { name: "direction1", type: "Vector3", isOptional: true },
            { name: "direction2", type: "Vector3", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    PointShapeBlock: {
        className: "PointShapeBlock",
        category: "Shape",
        description: "Point emitter that spawns particles from a single point.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "direction1", type: "Vector3", isOptional: true },
            { name: "direction2", type: "Vector3", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    CustomShapeBlock: {
        className: "CustomShapeBlock",
        category: "Shape",
        description: "Custom emitter that spawns particles using a user-defined function.",
        inputs: [{ name: "particle", type: "Particle" }],
        outputs: [{ name: "output", type: "Particle" }],
    },

    MeshShapeBlock: {
        className: "MeshShapeBlock",
        category: "Shape",
        description: "Mesh-based emitter that spawns particles on the surface of a mesh.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "direction1", type: "Vector3", isOptional: true },
            { name: "direction2", type: "Vector3", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Particle" }],
        properties: {
            useMeshNormalsForDirection: "boolean — use mesh normals for direction. Default: true",
        },
        defaultSerializedProperties: { useMeshNormalsForDirection: true },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Setup
    // ═══════════════════════════════════════════════════════════════════════
    CreateParticleBlock: {
        className: "CreateParticleBlock",
        category: "Setup",
        description: "Creates a new particle with initial properties (emit power, lifetime, color, scale, angle, size).",
        inputs: [
            { name: "emitPower", type: "Float", isOptional: true },
            { name: "lifeTime", type: "Float", isOptional: true },
            { name: "color", type: "Color4", isOptional: true },
            { name: "colorDead", type: "Color4", isOptional: true },
            { name: "scale", type: "Vector2", isOptional: true },
            { name: "angle", type: "Float", isOptional: true },
            { name: "size", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "particle", type: "Particle" }],
    },

    SetupSpriteSheetBlock: {
        className: "SetupSpriteSheetBlock",
        category: "Setup",
        description: "Configures sprite sheet animation for particles.",
        inputs: [{ name: "particle", type: "Particle" }],
        outputs: [{ name: "output", type: "Particle" }],
        properties: {
            start: "number — start cell index. Default: 0",
            end: "number — end cell index. Default: 8",
            width: "number — sprite sheet width. Default: 64",
            height: "number — sprite sheet height. Default: 64",
            spriteCellChangeSpeed: "number — cell change speed. Default: 1",
            loop: "boolean — loop sprite animation. Default: false",
            randomStartCell: "boolean — random start cell. Default: false",
        },
        defaultSerializedProperties: {
            start: 0,
            end: 8,
            width: 64,
            height: 64,
            spriteCellChangeSpeed: 1,
            loop: false,
            randomStartCell: false,
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Update Blocks
    // ═══════════════════════════════════════════════════════════════════════
    UpdatePositionBlock: {
        className: "UpdatePositionBlock",
        category: "Update",
        description: "Updates a particle's position with a new Vector3 value.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "position", type: "Vector3" },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    UpdateDirectionBlock: {
        className: "UpdateDirectionBlock",
        category: "Update",
        description: "Updates a particle's direction with a new Vector3 value.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "direction", type: "Vector3" },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    UpdateColorBlock: {
        className: "UpdateColorBlock",
        category: "Update",
        description: "Updates a particle's color with a new Color4 value.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "color", type: "Color4" },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    UpdateScaleBlock: {
        className: "UpdateScaleBlock",
        category: "Update",
        description: "Updates a particle's scale with a new Vector2 value.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "scale", type: "Vector2" },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    UpdateSizeBlock: {
        className: "UpdateSizeBlock",
        category: "Update",
        description: "Updates a particle's size with a new Float value.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "size", type: "Float" },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    UpdateAngleBlock: {
        className: "UpdateAngleBlock",
        category: "Update",
        description: "Updates a particle's angle (rotation) with a new Float value.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "angle", type: "Float" },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    UpdateAgeBlock: {
        className: "UpdateAgeBlock",
        category: "Update",
        description: "Updates a particle's age with a new Float value.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "age", type: "Float" },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    BasicPositionUpdateBlock: {
        className: "BasicPositionUpdateBlock",
        category: "Update",
        description: "Applies basic position update to a particle (position += direction * delta).",
        inputs: [{ name: "particle", type: "Particle" }],
        outputs: [{ name: "output", type: "Particle" }],
    },

    BasicColorUpdateBlock: {
        className: "BasicColorUpdateBlock",
        category: "Update",
        description: "Applies basic color interpolation between initial color and dead color over particle lifetime.",
        inputs: [{ name: "particle", type: "Particle" }],
        outputs: [{ name: "output", type: "Particle" }],
    },

    BasicSpriteUpdateBlock: {
        className: "BasicSpriteUpdateBlock",
        category: "Update",
        description: "Applies basic sprite sheet update to a particle over its lifetime.",
        inputs: [{ name: "particle", type: "Particle" }],
        outputs: [{ name: "output", type: "Particle" }],
    },

    UpdateSpriteCellIndexBlock: {
        className: "UpdateSpriteCellIndexBlock",
        category: "Update",
        description: "Updates a particle's sprite cell index with a new Int value.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "cellIndex", type: "Int" },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    UpdateFlowMapBlock: {
        className: "UpdateFlowMapBlock",
        category: "Update",
        description: "Updates a particle's position using a flow map texture.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "flowMap", type: "Texture" },
            { name: "strength", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    UpdateNoiseBlock: {
        className: "UpdateNoiseBlock",
        category: "Update",
        description: "Updates a particle's position using a noise texture.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "noiseTexture", type: "Texture" },
            { name: "strength", type: "Vector3", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    UpdateAttractorBlock: {
        className: "UpdateAttractorBlock",
        category: "Update",
        description: "Applies an attractor force to the particle, pulling it toward a point.",
        inputs: [
            { name: "particle", type: "Particle" },
            { name: "attractor", type: "Vector3", isOptional: true },
            { name: "strength", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    AlignAngleBlock: {
        className: "AlignAngleBlock",
        category: "Update",
        description: "Aligns the angle of a particle to its direction vector.",
        inputs: [{ name: "particle", type: "Particle" }],
        outputs: [{ name: "output", type: "Particle" }],
        properties: {
            alignment: "number — alignment offset in radians. Default: PI/2",
        },
        defaultSerializedProperties: { alignment: Math.PI / 2 },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Triggers
    // ═══════════════════════════════════════════════════════════════════════
    ParticleTriggerBlock: {
        className: "ParticleTriggerBlock",
        category: "Trigger",
        description: "Triggers sub-emitters or other systems based on particle events. " + "Connects particle flow to a system for spawning sub-particles.",
        inputs: [
            { name: "input", type: "Particle" },
            { name: "condition", type: "Float", isOptional: true },
            { name: "system", type: "System" },
        ],
        outputs: [{ name: "output", type: "Particle" }],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Math Standard
    // ═══════════════════════════════════════════════════════════════════════
    ParticleMathBlock: {
        className: "ParticleMathBlock",
        category: "Math",
        description: "Applies standard math operations (Add, Subtract, Multiply, Divide, Max, Min) to two inputs.",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            operation: "ParticleMathBlockOperations — Add (0), Subtract (1), Multiply (2), Divide (3), Max (4), Min (5). Default: Add",
        },
        defaultSerializedProperties: { operation: 0 },
    },

    ParticleNumberMathBlock: {
        className: "ParticleNumberMathBlock",
        category: "Math",
        description: "Applies number-only math (Modulo, Pow) to two numeric inputs.",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            operation: "ParticleNumberMathBlockOperations — Modulo (0), Pow (1). Default: Modulo",
        },
        defaultSerializedProperties: { operation: 0 },
    },

    ParticleVectorMathBlock: {
        className: "ParticleVectorMathBlock",
        category: "Math",
        description: "Applies vector-only math (Dot, Distance) to two Vector3 inputs.",
        inputs: [
            { name: "left", type: "Vector3" },
            { name: "right", type: "Vector3" },
        ],
        outputs: [{ name: "output", type: "Float" }],
        properties: {
            operation: "ParticleVectorMathBlockOperations — Dot (0), Distance (1). Default: Dot",
        },
        defaultSerializedProperties: { operation: 0 },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Math Scientific
    // ═══════════════════════════════════════════════════════════════════════
    ParticleTrigonometryBlock: {
        className: "ParticleTrigonometryBlock",
        category: "Math",
        description:
            "Applies trigonometric/scientific operations (Cos, Sin, Abs, Exp, Exp2, Round, Floor, Ceiling, " +
            "Sqrt, Log, Tan, ArcTan, ArcCos, ArcSin, Sign, Negate, OneMinus, Reciprocal, ToDegrees, ToRadians, Fract).",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            operation:
                "ParticleTrigonometryBlockOperations — Cos (0), Sin (1), Abs (2), Exp (3), Exp2 (4), Round (5), " +
                "Floor (6), Ceiling (7), Sqrt (8), Log (9), Tan (10), ArcTan (11), ArcCos (12), ArcSin (13), " +
                "Sign (14), Negate (15), OneMinus (16), Reciprocal (17), ToDegrees (18), ToRadians (19), Fract (20). Default: Cos",
        },
        defaultSerializedProperties: { operation: 0 },
    },

    ParticleVectorLengthBlock: {
        className: "ParticleVectorLengthBlock",
        category: "Math",
        description: "Computes the length of a vector input.",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "Float" }],
    },

    ParticleFloatToIntBlock: {
        className: "ParticleFloatToIntBlock",
        category: "Math",
        description: "Converts a float to an int using Round, Ceil, Floor, or Truncate.",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "Int" }],
        properties: {
            operation: "ParticleFloatToIntBlockOperations — Round (0), Ceil (1), Floor (2), Truncate (3). Default: Round",
        },
        defaultSerializedProperties: { operation: 0 },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Conditions
    // ═══════════════════════════════════════════════════════════════════════
    ParticleConditionBlock: {
        className: "ParticleConditionBlock",
        category: "Condition",
        description: "Evaluates a condition (Equal, NotEqual, LessThan, GreaterThan, etc.) and returns ifTrue or ifFalse value.",
        inputs: [
            { name: "left", type: "Float" },
            { name: "right", type: "Float", isOptional: true },
            { name: "ifTrue", type: "AutoDetect", isOptional: true },
            { name: "ifFalse", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            test:
                "ParticleConditionBlockTests — Equal (0), NotEqual (1), LessThan (2), GreaterThan (3), " +
                "LessOrEqual (4), GreaterOrEqual (5), Xor (6), Or (7), And (8). Default: Equal",
            epsilon: "number — epsilon for comparison. Default: 0",
        },
        defaultSerializedProperties: { test: 0, epsilon: 0 },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Interpolation
    // ═══════════════════════════════════════════════════════════════════════
    ParticleLerpBlock: {
        className: "ParticleLerpBlock",
        category: "Interpolation",
        description: "Linearly interpolates between two values based on a gradient.",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
            { name: "gradient", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    ParticleNLerpBlock: {
        className: "ParticleNLerpBlock",
        category: "Interpolation",
        description: "Normalised linear interpolation between two values.",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
            { name: "gradient", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    ParticleSmoothStepBlock: {
        className: "ParticleSmoothStepBlock",
        category: "Interpolation",
        description: "Smooth step interpolation between two edges.",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "edge0", type: "Float", isOptional: true },
            { name: "edge1", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    ParticleStepBlock: {
        className: "ParticleStepBlock",
        category: "Interpolation",
        description: "Step function: returns 0 if value < edge, else 1.",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "edge", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    ParticleClampBlock: {
        className: "ParticleClampBlock",
        category: "Interpolation",
        description: "Clamps a value between min and max.",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "min", type: "Float", isOptional: true },
            { name: "max", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    ParticleGradientBlock: {
        className: "ParticleGradientBlock",
        category: "Interpolation",
        description: "Defines a multi-stop gradient. Dynamically extends with more value inputs as needed.",
        inputs: [
            { name: "gradient", type: "Float", isOptional: true },
            { name: "value0", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    ParticleGradientValueBlock: {
        className: "ParticleGradientValueBlock",
        category: "Interpolation",
        description: "Defines a single gradient entry with a reference position (0-1).",
        inputs: [{ name: "value", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            reference: "number — gradient position 0–1. Default: 0",
        },
        defaultSerializedProperties: { reference: 0 },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Random
    // ═══════════════════════════════════════════════════════════════════════
    ParticleRandomBlock: {
        className: "ParticleRandomBlock",
        category: "Misc",
        description: "Generates a random value between min and max.",
        inputs: [
            { name: "min", type: "AutoDetect", isOptional: true },
            { name: "max", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            lockMode: "ParticleRandomBlockLocks — None (0), PerParticle (1), PerSystem (2), OncePerParticle (3). Default: PerParticle",
        },
        defaultSerializedProperties: { lockMode: 1 },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Converter
    // ═══════════════════════════════════════════════════════════════════════
    ParticleConverterBlock: {
        className: "ParticleConverterBlock",
        category: "Converter",
        description:
            "Converts between Color4/Vector3/Vector2/Float components. " +
            "NOTE: Input port names have a TRAILING SPACE to disambiguate from outputs. " +
            "When connecting to inputs, use 'color ', 'xyz ', 'xy ', 'zw ', 'x ', 'y ', 'z ', 'w ' (with trailing space).",
        inputs: [
            { name: "color ", type: "Color4", isOptional: true },
            { name: "xyz ", type: "Vector3", isOptional: true },
            { name: "xy ", type: "Vector2", isOptional: true },
            { name: "zw ", type: "Vector2", isOptional: true },
            { name: "x ", type: "Float", isOptional: true },
            { name: "y ", type: "Float", isOptional: true },
            { name: "z ", type: "Float", isOptional: true },
            { name: "w ", type: "Float", isOptional: true },
        ],
        outputs: [
            { name: "color", type: "Color4" },
            { name: "xyz", type: "Vector3" },
            { name: "xy", type: "Vector2" },
            { name: "zw", type: "Vector2" },
            { name: "x", type: "Float" },
            { name: "y", type: "Float" },
            { name: "z", type: "Float" },
            { name: "w", type: "Float" },
        ],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Utility
    // ═══════════════════════════════════════════════════════════════════════
    ParticleDebugBlock: {
        className: "ParticleDebugBlock",
        category: "Utility",
        description: "Debug block that passes through its input and can log values.",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    ParticleElbowBlock: {
        className: "ParticleElbowBlock",
        category: "Utility",
        description: "Pass-through block used for visual routing in the editor.",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    ParticleLocalVariableBlock: {
        className: "ParticleLocalVariableBlock",
        category: "Utility",
        description: "Stores a local variable scoped to a particle or loop iteration.",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            scope: "ParticleLocalVariableBlockScope — Particle (0), Loop (1). Default: Particle",
        },
        defaultSerializedProperties: { scope: 0 },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Teleport
    // ═══════════════════════════════════════════════════════════════════════
    ParticleTeleportInBlock: {
        className: "ParticleTeleportInBlock",
        category: "Teleport",
        description: "Entry point for a teleport pair. Accepts any input and teleports it to a matching TeleportOut.",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [],
    },

    ParticleTeleportOutBlock: {
        className: "ParticleTeleportOutBlock",
        category: "Teleport",
        description: "Exit point for a teleport pair. Outputs the value received from a matching TeleportIn.",
        inputs: [],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },
};

// ─── Utility functions ────────────────────────────────────────────────────

/**
 * Get a summary of the block catalog grouped by category.
 * @returns A markdown string summarizing the available block types and their descriptions.
 */
export function GetBlockCatalogSummary(): string {
    const byCategory = new Map<string, string[]>();
    for (const [key, info] of Object.entries(BlockRegistry)) {
        if (!byCategory.has(info.category)) {
            byCategory.set(info.category, []);
        }
        byCategory.get(info.category)!.push(`  ${key}: ${info.description.split(".")[0]}`);
    }

    const lines: string[] = [];
    for (const [cat, entries] of byCategory) {
        lines.push(`\n## ${cat}`);
        lines.push(...entries);
    }
    return lines.join("\n");
}

/**
 * Get detailed info about a specific block type.
 * @param blockType The class name of the
 * @returns The IBlockTypeInfo for the given block type, or undefined if not found.
 */
export function GetBlockTypeDetails(blockType: string): IBlockTypeInfo | undefined {
    return BlockRegistry[blockType];
}
