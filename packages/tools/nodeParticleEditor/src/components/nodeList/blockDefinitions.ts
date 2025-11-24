import { NodeParticleModes } from "../../nodeParticleModes";

export interface IBlockDefinition {
    name: string;
    category: string;
    modes: NodeParticleModes[];
    tooltip: string;
}

/**
 * Defines all available blocks with their categories, supported modes, and tooltips
 */
export const BlockDefinitions: IBlockDefinition[] = [
    // Shapes (Particle only)
    { name: "BoxShapeBlock", category: "Shapes", modes: [NodeParticleModes.Particle], tooltip: "Emit particles from a box shape" },
    { name: "ConeShapeBlock", category: "Shapes", modes: [NodeParticleModes.Particle], tooltip: "Emit particles from a cone shape" },
    { name: "SphereShapeBlock", category: "Shapes", modes: [NodeParticleModes.Particle], tooltip: "Emit particles from a sphere shape" },
    { name: "PointShapeBlock", category: "Shapes", modes: [NodeParticleModes.Particle], tooltip: "Emit particles from a point" },
    { name: "CustomShapeBlock", category: "Shapes", modes: [NodeParticleModes.Particle], tooltip: "Emit particles from a custom position" },
    { name: "CylinderShapeBlock", category: "Shapes", modes: [NodeParticleModes.Particle], tooltip: "Emit particles from a cylinder shape" },
    { name: "MeshShapeBlock", category: "Shapes", modes: [NodeParticleModes.Particle], tooltip: "Emit particles from a mesh shape" },

    // Inputs
    { name: "Float", category: "Inputs", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Input block set to a float value" },
    { name: "Vector2", category: "Inputs", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Input block set to a Vector2 value" },
    { name: "Vector3", category: "Inputs", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Input block set to a Vector3 value" },
    { name: "Int", category: "Inputs", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Input block set to a integer value" },
    { name: "TextureBlock", category: "Inputs", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Provide a texture" },
    { name: "Color4", category: "Inputs", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Input block set to a Color4 value" },
    { name: "MeshSourceBlock", category: "Inputs", modes: [NodeParticleModes.SolidParticle], tooltip: "Mesh source for SPS - load custom geometry from the inspector" },
    { name: "NodeMaterialBlock", category: "Inputs", modes: [NodeParticleModes.SolidParticle], tooltip: "Load a Node Material for SPS particles" },

    // Updates (Particle only - use _updateQueueStart)
    { name: "UpdateDirectionBlock", category: "Updates", modes: [NodeParticleModes.Particle], tooltip: "Update the direction of a particle" },
    { name: "UpdatePositionBlock", category: "Updates", modes: [NodeParticleModes.Particle], tooltip: "Update the position of a particle" },
    { name: "UpdateColorBlock", category: "Updates", modes: [NodeParticleModes.Particle], tooltip: "Update the color of a particle" },
    { name: "UpdateScaleBlock", category: "Updates", modes: [NodeParticleModes.Particle], tooltip: "Update the scale of a particle" },
    { name: "UpdateSizeBlock", category: "Updates", modes: [NodeParticleModes.Particle], tooltip: "Update the size of a particle" },
    { name: "UpdateAngleBlock", category: "Updates", modes: [NodeParticleModes.Particle], tooltip: "Update the angle of a particle" },
    { name: "UpdateAgeBlock", category: "Updates", modes: [NodeParticleModes.Particle], tooltip: "Update the age of a particle" },
    {
        name: "BasicColorUpdateBlock",
        category: "Updates",
        modes: [NodeParticleModes.Particle],
        tooltip: "Block used to update the color of a particle with a basic update (eg. color * delta)",
    },
    {
        name: "BasicPositionUpdateBlock",
        category: "Updates",
        modes: [NodeParticleModes.Particle],
        tooltip: "Block used to update the position of a particle with a basic update (eg. direction * delta)",
    },
    { name: "UpdateFlowMapBlock", category: "Updates", modes: [NodeParticleModes.Particle], tooltip: "Block used to update particle position based on a flow map" },
    { name: "UpdateAttractorBlock", category: "Updates", modes: [NodeParticleModes.Particle], tooltip: "Block used to update particle position based on an attractor" },
    { name: "AlignAngleBlock", category: "Updates", modes: [NodeParticleModes.Particle], tooltip: "Block used to align the angle of a particle to its direction" },
    // Updates (SolidParticle only)
    {
        name: "UpdateSolidParticleBlock",
        category: "Updates",
        modes: [NodeParticleModes.SolidParticle],
        tooltip: "Update solid particle - connect SolidParticleSystemBlock output here",
    },
    {
        name: "BasicSpriteUpdateBlock",
        category: "Updates",
        modes: [NodeParticleModes.Particle],
        tooltip: "Block used to update the sprite index of a particle with a basic update (eg. incrementing the index by 1)",
    },
    { name: "UpdateSpriteCellIndexBlock", category: "Updates", modes: [NodeParticleModes.Particle], tooltip: "Block used to update the sprite cell index of a particle" },

    // Triggers (Particle only)
    { name: "TriggerBlock", category: "Triggers", modes: [NodeParticleModes.Particle], tooltip: "Block used to trigger a particle system based on a condition" },

    // Setup
    {
        name: "CreateParticleBlock",
        category: "Setup",
        modes: [NodeParticleModes.Particle],
        tooltip: "Block used to create a particle with properties such as emit power, lifetime, color, scale, and angle",
    },
    { name: "SetupSpriteSheetBlock", category: "Setup", modes: [NodeParticleModes.Particle], tooltip: "Block used to setup a sprite sheet for particles" },
    { name: "CreateSolidParticleBlock", category: "Setup", modes: [NodeParticleModes.SolidParticle], tooltip: "Create Solid Particle System - outputs SolidParticleSystem" },
    { name: "InitSolidParticleBlock", category: "Setup", modes: [NodeParticleModes.SolidParticle], tooltip: "Configure solid particle: mesh, count, material, init/update" },

    // Math - Standard
    { name: "AddBlock", category: "Math__Standard", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Math block set to Add" },
    { name: "DivideBlock", category: "Math__Standard", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Math block set to Divide" },
    { name: "MaxBlock", category: "Math__Standard", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Math block set to Max" },
    { name: "MinBlock", category: "Math__Standard", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Math block set to Min" },
    { name: "MultiplyBlock", category: "Math__Standard", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Math block set to Multiply" },
    { name: "SubtractBlock", category: "Math__Standard", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Math block set to Subtract" },
    { name: "NegateBlock", category: "Math__Standard", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Math block set to Negate" },
    { name: "OneMinusBlock", category: "Math__Standard", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Trigonometry block set to One Minus" },
    { name: "ReciprocalBlock", category: "Math__Standard", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Trigonometry block set to Reciprocal" },
    { name: "SignBlock", category: "Math__Standard", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Trigonometry block set to Sign" },
    { name: "SqrtBlock", category: "Math__Standard", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Trigonometry block set to Square Root" },
    { name: "RoundBlock", category: "Math__Standard", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Trigonometry block set to Round" },
    { name: "FloorBlock", category: "Math__Standard", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Trigonometry block set to Floor" },
    { name: "CeilingBlock", category: "Math__Standard", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Trigonometry block set to Ceiling" },
    {
        name: "FloatToIntBlock",
        category: "Math__Standard",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Block used to convert a float value to an integer value using a specified operation (Round, Ceil, Floor, Truncate)",
    },

    // Math - Scientific
    { name: "AbsBlock", category: "Math__Scientific", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Trigonometry block set to Abs" },
    {
        name: "ArcCosBlock",
        category: "Math__Scientific",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Trigonometry block set to Arc cos (using radians)",
    },
    {
        name: "ArcSinBlock",
        category: "Math__Scientific",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Trigonometry block set to Arc sin (using radians)",
    },
    {
        name: "ArcTanBlock",
        category: "Math__Scientific",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Trigonometry block set to Arc tan (using radians)",
    },
    {
        name: "CosBlock",
        category: "Math__Scientific",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Trigonometry block set to Cos (using radians)",
    },
    {
        name: "ExpBlock",
        category: "Math__Scientific",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Trigonometry block set to Exp (using radians)",
    },
    {
        name: "Exp2Block",
        category: "Math__Scientific",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Trigonometry block set to Exp2 (using radians)",
    },
    {
        name: "LogBlock",
        category: "Math__Scientific",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Trigonometry block set to Log (using radians)",
    },
    {
        name: "SinBlock",
        category: "Math__Scientific",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Trigonometry block set to Sin (using radians)",
    },
    {
        name: "TanBlock",
        category: "Math__Scientific",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Trigonometry block set to Tan (using radians)",
    },
    {
        name: "ToDegreesBlock",
        category: "Math__Scientific",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Conversion block used to convert radians to degree",
    },
    {
        name: "ToRadiansBlock",
        category: "Math__Scientific",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Conversion block used to convert degrees to radians",
    },
    {
        name: "FractBlock",
        category: "Math__Scientific",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Outputs only the fractional value of a floating point number",
    },
    {
        name: "VectorLengthBlock",
        category: "Math__Scientific",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Block used to get the length of a vector",
    },

    // Logical
    { name: "EqualBlock", category: "Logical", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Conditional block set to Equal" },
    { name: "NotEqualBlock", category: "Logical", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Conditional block set to NotEqual" },
    { name: "LessThanBlock", category: "Logical", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Conditional block set to LessThan" },
    { name: "LessOrEqualBlock", category: "Logical", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Conditional block set to LessOrEqual" },
    { name: "GreaterThanBlock", category: "Logical", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Conditional block set to GreaterThan" },
    { name: "GreaterOrEqualBlock", category: "Logical", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Conditional block set to GreaterOrEqual" },
    { name: "XorBlock", category: "Logical", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Conditional block set to Xor" },
    { name: "OrBlock", category: "Logical", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Conditional block set to Or" },
    { name: "AndBlock", category: "Logical", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Conditional block set to And" },
    {
        name: "ConditionBlock",
        category: "Logical",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Block used to evaluate a condition and return a value",
    },

    // Interpolation
    { name: "LerpBlock", category: "Interpolation", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Interpolate between two values" },
    {
        name: "GradientValueBlock",
        category: "Interpolation",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "A gradient value block used to define a value at a specific age",
    },
    {
        name: "GradientBlock",
        category: "Interpolation",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "A gradient block used to define a gradient of values over the lifetime of a particle",
    },

    // Misc
    {
        name: "ConverterBlock",
        category: "Misc",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Convert between different types of values, such as Color4, Vector2, Vector3, and Float",
    },
    { name: "RandomBlock", category: "Misc", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Generate a random value" },
    {
        name: "DebugBlock",
        category: "Misc",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Debug block used to output values of connection ports",
    },
    { name: "ElbowBlock", category: "Misc", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Passthrough block mostly used to organize your graph" },
    {
        name: "TeleportInBlock",
        category: "Misc",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Passthrough block mostly used to organize your graph (but without visible lines). It works like a teleportation point for the graph.",
    },
    { name: "TeleportOutBlock", category: "Misc", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Endpoint for a TeleportInBlock." },
    {
        name: "LocalVariableBlock",
        category: "Misc",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Block used to store local values (eg. within a loop)",
    },
    { name: "FresnelBlock", category: "Misc", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Block used to compute the Fresnel term" },

    // System Nodes
    { name: "SystemBlock", category: "System_Nodes", modes: [NodeParticleModes.Particle], tooltip: "Generate a particle system" },
    {
        name: "SolidParticleSystemBlock",
        category: "System_Nodes",
        modes: [NodeParticleModes.SolidParticle],
        tooltip: "Configure Solid Particle System - connect SolidParticleSystemBlock output here",
    },
    { name: "TimeBlock", category: "System_Nodes", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Block used to get the current time in ms" },
    {
        name: "DeltaBlock",
        category: "System_Nodes",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Block used to get the delta value for animations",
    },
    {
        name: "EmitterPositionBlock",
        category: "System_Nodes",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Contextual block to get the coordinates of the emitter",
    },
    {
        name: "CameraPositionBlock",
        category: "System_Nodes",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Contextual block to get the position of the active camera",
    },

    // Contextual
    {
        name: "PositionBlock",
        category: "Contextual",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Contextual block to get the position of a particle",
    },
    {
        name: "DirectionBlock",
        category: "Contextual",
        modes: [NodeParticleModes.Particle],
        tooltip: "Contextual block to get the direction of a particle",
    },
    {
        name: "DirectionScaleBlock",
        category: "Contextual",
        modes: [NodeParticleModes.Particle],
        tooltip: "Contextual block to get the direction scale of a particle",
    },
    {
        name: "ScaledDirectionBlock",
        category: "Contextual",
        modes: [NodeParticleModes.Particle],
        tooltip: "Contextual block to get the scaled direction of a particle",
    },
    {
        name: "ColorBlock",
        category: "Contextual",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Contextual block to get the color of a particle",
    },
    { name: "AgeBlock", category: "Contextual", modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle], tooltip: "Contextual block to get the age of a particle" },
    {
        name: "LifetimeBlock",
        category: "Contextual",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Contextual block to get the lifetime of a particle",
    },
    {
        name: "ScaleBlock",
        category: "Contextual",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Contextual block to get the scale of a particle",
    },
    { name: "SizeBlock", category: "Contextual", modes: [NodeParticleModes.Particle], tooltip: "Contextual block to get the size of a particle" },
    {
        name: "AgeGradientBlock",
        category: "Contextual",
        modes: [NodeParticleModes.Particle, NodeParticleModes.SolidParticle],
        tooltip: "Contextual block to get the age gradient of a particle ie. the age divided by the lifetime",
    },
    {
        name: "AngleBlock",
        category: "Contextual",
        modes: [NodeParticleModes.Particle],
        tooltip: "Contextual block to get the angle of a particle",
    },
    { name: "SolidParticleIndexBlock", category: "Contextual", modes: [NodeParticleModes.SolidParticle], tooltip: "Contextual block to get the index of a solid particle" },
    { name: "InitialColorBlock", category: "Contextual", modes: [NodeParticleModes.Particle], tooltip: "Contextual block to get the initial color of a particle" },
    { name: "ColorDeadBlock", category: "Contextual", modes: [NodeParticleModes.Particle], tooltip: "Contextual block to get the expected dead color of a particle" },
    { name: "SpriteCellEndBlock", category: "Contextual", modes: [NodeParticleModes.Particle], tooltip: "Contextual block to get the end cell of a sprite sheet" },
    { name: "SpriteCellStartBlock", category: "Contextual", modes: [NodeParticleModes.Particle], tooltip: "Contextual block to get the start cell of a sprite sheet" },
    { name: "SpriteCellIndexBlock", category: "Contextual", modes: [NodeParticleModes.Particle], tooltip: "Contextual block to get the sprite cell index of a particle" },
    { name: "InitialDirectionBlock", category: "Contextual", modes: [NodeParticleModes.Particle], tooltip: "Contextual block to get the initial direction of a particle" },
    { name: "ColorStepBlock", category: "Contextual", modes: [NodeParticleModes.Particle], tooltip: "Contextual block to get the expected color step of a particle" },
    { name: "ScaledColorStepBlock", category: "Contextual", modes: [NodeParticleModes.Particle], tooltip: "Contextual block to get the expected scaled color step of a particle" },
];

/**
 * Groups blocks by category for a given mode
 * @param mode The particle mode to filter blocks for
 * @returns A record mapping category names to arrays of block definitions
 */
export function GetBlocksByMode(mode: NodeParticleModes): Record<string, IBlockDefinition[]> {
    const result: Record<string, IBlockDefinition[]> = {};
    for (const block of BlockDefinitions) {
        if (block.modes.includes(mode)) {
            if (!result[block.category]) {
                result[block.category] = [];
            }
            result[block.category].push(block);
        }
    }
    // Sort blocks within each category by name
    for (const category in result) {
        result[category].sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
}

/**
 * Gets all block names for registration (all modes combined)
 * @returns An array of all block names
 */
export function GetAllBlockNames(): string[] {
    return BlockDefinitions.map((block) => block.name);
}
