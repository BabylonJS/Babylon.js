/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Complete registry of all Smart Filter block types available in Babylon.js.
 * Each entry describes the block's type, category, inputs, outputs, and properties.
 *
 * This registry is purely informational — the MCP server works with a JSON data
 * model and never instantiates real Babylon.js block classes.
 */

/**
 * Describes a single input or output connection point on a block.
 */
export interface IConnectionPointInfo {
    /** Name of the connection point (e.g. "input", "output") */
    name: string;
    /** Data type of the connection point (e.g. "Texture", "Float", "Color3") */
    type: string;
    /** Whether the connection is optional */
    isOptional?: boolean;
}

/**
 * Describes a block type in the Smart Filters catalog.
 */
export interface IBlockTypeInfo {
    /** The block type identifier used in serialization */
    blockType: string;
    /** Category for grouping (e.g. "Effects", "Transitions", "Utilities", "Inputs") */
    category: string;
    /** The namespace of the block */
    namespace: string;
    /** Human-readable description of what this block does */
    description: string;
    /** List of input connection points */
    inputs: IConnectionPointInfo[];
    /** List of output connection points */
    outputs: IConnectionPointInfo[];
    /** Extra properties that can be configured on the block */
    properties?: Record<string, string>;
    /** Whether this is an input block */
    isInput?: boolean;
}

/**
 * ConnectionPointType enum values matching the Smart Filters framework.
 */
export const ConnectionPointTypes: Record<string, number> = {
    Float: 1,
    Texture: 2,
    Color3: 3,
    Color4: 4,
    Boolean: 5,
    Vector2: 6,
};

/**
 * Reverse map from ConnectionPointType number to name
 */
export const ConnectionPointTypeNames: Record<number, string> = {
    1: "Float",
    2: "Texture",
    3: "Color3",
    4: "Color4",
    5: "Boolean",
    6: "Vector2",
};

/**
 * Full catalog of Smart Filter block types.
 */
export const BlockRegistry: Record<string, IBlockTypeInfo> = {
    // ═══════════════════════════════════════════════════════════════════════
    //  Effects
    // ═══════════════════════════════════════════════════════════════════════
    BlackAndWhiteBlock: {
        blockType: "BlackAndWhiteBlock",
        category: "Effects",
        namespace: "Babylon.Demo.Effects",
        description: "Transforms the input texture to black and white.",
        inputs: [{ name: "input", type: "Texture" }],
        outputs: [{ name: "output", type: "Texture" }],
    },
    KaleidoscopeBlock: {
        blockType: "KaleidoscopeBlock",
        category: "Effects",
        namespace: "Babylon.Demo.Effects",
        description: "Applies a kaleidoscope effect to the input texture. Requires a time/angle float input.",
        inputs: [
            { name: "input", type: "Texture" },
            { name: "time", type: "Float" },
        ],
        outputs: [{ name: "output", type: "Texture" }],
    },
    PosterizeBlock: {
        blockType: "PosterizeBlock",
        category: "Effects",
        namespace: "Babylon.Demo.Effects",
        description: "Applies a posterize effect to the input texture, reducing the number of color levels.",
        inputs: [
            { name: "input", type: "Texture" },
            { name: "intensity", type: "Float" },
        ],
        outputs: [{ name: "output", type: "Texture" }],
    },
    DesaturateBlock: {
        blockType: "DesaturateBlock",
        category: "Effects",
        namespace: "Babylon.Demo.Effects",
        description: "Desaturates the input texture, reducing color saturation towards greyscale.",
        inputs: [
            { name: "input", type: "Texture" },
            { name: "intensity", type: "Float" },
        ],
        outputs: [{ name: "output", type: "Texture" }],
    },
    ContrastBlock: {
        blockType: "ContrastBlock",
        category: "Effects",
        namespace: "Babylon.Demo.Effects",
        description: "Adjusts the contrast of the input texture.",
        inputs: [
            { name: "input", type: "Texture" },
            { name: "intensity", type: "Float" },
        ],
        outputs: [{ name: "output", type: "Texture" }],
    },
    GreenScreenBlock: {
        blockType: "GreenScreenBlock",
        category: "Effects",
        namespace: "Babylon.Demo.Effects",
        description: "Removes a green screen background and replaces it with the background texture.",
        inputs: [
            { name: "input", type: "Texture" },
            { name: "background", type: "Texture" },
            { name: "reference", type: "Color3" },
            { name: "distance", type: "Float" },
        ],
        outputs: [{ name: "output", type: "Texture" }],
    },
    PixelateBlock: {
        blockType: "PixelateBlock",
        category: "Effects",
        namespace: "Babylon.Demo.Effects",
        description: "Adds a pixelation effect to the input texture.",
        inputs: [
            { name: "input", type: "Texture" },
            { name: "intensity", type: "Float" },
        ],
        outputs: [{ name: "output", type: "Texture" }],
    },
    ExposureBlock: {
        blockType: "ExposureBlock",
        category: "Effects",
        namespace: "Babylon.Demo.Effects",
        description: "Adjusts the exposure of the input texture.",
        inputs: [
            { name: "input", type: "Texture" },
            { name: "amount", type: "Float" },
        ],
        outputs: [{ name: "output", type: "Texture" }],
    },
    MaskBlock: {
        blockType: "MaskBlock",
        category: "Effects",
        namespace: "Babylon.Demo.Effects",
        description: "Applies a mask texture to the input texture, masking out portions of the image.",
        inputs: [
            { name: "input", type: "Texture" },
            { name: "mask", type: "Texture" },
        ],
        outputs: [{ name: "output", type: "Texture" }],
    },
    SpritesheetBlock: {
        blockType: "SpritesheetBlock",
        category: "Effects",
        namespace: "Babylon.Demo.Effects",
        description: "Animates a sprite sheet texture, cycling through frames over time.",
        inputs: [
            { name: "input", type: "Texture" },
            { name: "time", type: "Float", isOptional: true },
            { name: "rows", type: "Float", isOptional: true },
            { name: "columns", type: "Float", isOptional: true },
            { name: "frames", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Texture" }],
    },
    BlurBlock: {
        blockType: "BlurBlock",
        category: "Effects",
        namespace: "Babylon.Demo.Effects",
        description: "Blurs the input texture using multiple directional blur passes. " + "This is an aggregate block containing 4 internal DirectionalBlurBlocks.",
        inputs: [{ name: "input", type: "Texture" }],
        outputs: [{ name: "output", type: "Texture" }],
        properties: {
            blurSize: "number — the blur kernel size. Default: 2",
            blurTextureRatioPerPass: "number — texture ratio for each blur pass. Default: 0.5",
        },
    },
    DirectionalBlurBlock: {
        blockType: "DirectionalBlurBlock",
        category: "Effects",
        namespace: "Babylon.Demo.Effects",
        description: "Applies a single-pass directional blur to the input texture.",
        inputs: [{ name: "input", type: "Texture" }],
        outputs: [{ name: "output", type: "Texture" }],
        properties: {
            blurTextureRatio: "number — texture ratio for this blur pass. Default: 0.5",
            blurHorizontalWidth: "number — horizontal blur width. Default: 0",
            blurVerticalWidth: "number — vertical blur width. Default: 1",
        },
    },
    CompositionBlock: {
        blockType: "CompositionBlock",
        category: "Effects",
        namespace: "Babylon.Demo.Effects",
        description: "Composites a foreground texture over a background texture with configurable position, size, and alpha blending.",
        inputs: [
            { name: "background", type: "Texture" },
            { name: "foreground", type: "Texture", isOptional: true },
            { name: "foregroundTop", type: "Float", isOptional: true },
            { name: "foregroundLeft", type: "Float", isOptional: true },
            { name: "foregroundWidth", type: "Float", isOptional: true },
            { name: "foregroundHeight", type: "Float", isOptional: true },
            { name: "foregroundAlphaScale", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Texture" }],
        properties: {
            alphaMode: "number — alpha blending mode. 0=ALPHA_DISABLE, 1=ALPHA_ADD, 2=ALPHA_COMBINE, " + "3=ALPHA_SUBTRACT, 4=ALPHA_MULTIPLY. Default: 2 (ALPHA_COMBINE)",
        },
    },
    TintBlock: {
        blockType: "TintBlock",
        category: "Effects",
        namespace: "Babylon.Demo.Effects",
        description: "Adds a colored tint to the input texture.",
        inputs: [
            { name: "input", type: "Texture" },
            { name: "tint", type: "Color3" },
            { name: "amount", type: "Float" },
        ],
        outputs: [{ name: "output", type: "Texture" }],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Transitions
    // ═══════════════════════════════════════════════════════════════════════
    WipeBlock: {
        blockType: "WipeBlock",
        category: "Transitions",
        namespace: "Babylon.Demo.Transitions",
        description: "Performs a vertical wipe transition from textureB to textureA based on a progress float.",
        inputs: [
            { name: "textureA", type: "Texture" },
            { name: "textureB", type: "Texture" },
            { name: "progress", type: "Float" },
        ],
        outputs: [{ name: "output", type: "Texture" }],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Utilities
    // ═══════════════════════════════════════════════════════════════════════
    PremultiplyAlphaBlock: {
        blockType: "PremultiplyAlphaBlock",
        category: "Utilities",
        namespace: "Babylon.Demo.Utilities",
        description: "Premultiplies the input texture's color channels by its alpha channel.",
        inputs: [{ name: "input", type: "Texture" }],
        outputs: [{ name: "output", type: "Texture" }],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Inputs
    // ═══════════════════════════════════════════════════════════════════════
    Float: {
        blockType: "Float",
        category: "Inputs",
        namespace: "Inputs",
        description: "A floating point input value.",
        inputs: [],
        outputs: [{ name: "output", type: "Float" }],
        isInput: true,
    },
    Color3: {
        blockType: "Color3",
        category: "Inputs",
        namespace: "Inputs",
        description: "A Color3 (RGB) input value.",
        inputs: [],
        outputs: [{ name: "output", type: "Color3" }],
        isInput: true,
    },
    Color4: {
        blockType: "Color4",
        category: "Inputs",
        namespace: "Inputs",
        description: "A Color4 (RGBA) input value.",
        inputs: [],
        outputs: [{ name: "output", type: "Color4" }],
        isInput: true,
    },
    Texture: {
        blockType: "Texture",
        category: "Inputs",
        namespace: "Inputs",
        description: "A texture input. Provide a URL or texture reference.",
        inputs: [],
        outputs: [{ name: "output", type: "Texture" }],
        isInput: true,
    },
    Vector2: {
        blockType: "Vector2",
        category: "Inputs",
        namespace: "Inputs",
        description: "A Vector2 input value.",
        inputs: [],
        outputs: [{ name: "output", type: "Vector2" }],
        isInput: true,
    },
    Boolean: {
        blockType: "Boolean",
        category: "Inputs",
        namespace: "Inputs",
        description: "A boolean input value.",
        inputs: [],
        outputs: [{ name: "output", type: "Boolean" }],
        isInput: true,
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Output (internal — always auto-created by the graph)
    // ═══════════════════════════════════════════════════════════════════════
    OutputBlock: {
        blockType: "OutputBlock",
        category: "Output",
        namespace: "",
        description: "The final output block of the Smart Filter graph. Automatically created; do not add manually.",
        inputs: [{ name: "input", type: "Texture" }],
        outputs: [],
    },
};

/**
 * Returns a text summary of the block catalog grouped by category.
 * @returns A formatted text summary of all block types.
 */
export function GetBlockCatalogSummary(): string {
    const byCategory = new Map<string, string[]>();
    for (const [key, info] of Object.entries(BlockRegistry)) {
        if (key === "OutputBlock") {
            continue;
        } // internal
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
 * @param blockType - The block type name.
 * @returns The block type info, or undefined if not found.
 */
export function GetBlockTypeDetails(blockType: string): IBlockTypeInfo | undefined {
    return BlockRegistry[blockType];
}
