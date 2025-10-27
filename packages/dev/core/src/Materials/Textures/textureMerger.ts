import type { Scene } from "../../scene";
import type { IProceduralTextureCreationOptions } from "core/Materials/Textures/Procedurals/proceduralTexture";
import { ProceduralTexture } from "./Procedurals/proceduralTexture";
import type { BaseTexture } from "./baseTexture";
import type { TextureSize } from "./textureCreationOptions";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { Constants } from "../../Engines/constants";
import type { Texture } from "./texture";

/**
 * Configuration for a texture input source
 */
export interface ITextureChannelInput {
    /** The texture to use as input */
    texture: BaseTexture;
    /** Source channel to read from (0=R, 1=G, 2=B, 3=A) */
    sourceChannel: number;
}

/**
 * Configuration for a constant value input source
 */
export interface IConstantChannelInput {
    /** Constant value between 0.0 and 1.0 */
    value: number;
}

/**
 * Union type for channel input sources
 */
export type ChannelInput = ITextureChannelInput | IConstantChannelInput;

/**
 * Configuration for texture merging operation
 */
export interface ITextureMergeConfiguration {
    /** Configuration for red output channel */
    red: ChannelInput;
    /** Configuration for green output channel (optional, defaults to 0) */
    green?: ChannelInput;
    /** Configuration for blue output channel (optional, defaults to 0) */
    blue?: ChannelInput;
    /** Configuration for alpha output channel (optional, defaults to 1) */
    alpha?: ChannelInput;
    /** Output texture size. If not specified, uses the largest input texture size */
    outputSize?: TextureSize;
    /** Whether to generate mipmaps for the output texture */
    generateMipMaps?: boolean;
}

const _ShaderName = "textureMerger";

/**
 * @internal
 * Check if a channel input is a texture input
 * @param input The channel input to check
 * @returns True if the input is a texture input, false otherwise
 */
function IsTextureInput(input: ChannelInput): input is ITextureChannelInput {
    return "texture" in input;
}

/**
 * @internal
 * Check if a channel input is a constant input
 * @param input The channel input to check
 * @returns True if the input is a constant input, false otherwise
 */
function IsConstantInput(input: ChannelInput): input is IConstantChannelInput {
    return "value" in input;
}

/**
 * @internal
 * Copy texture transformation properties from one texture to another
 * @param source The source texture
 * @param destination The destination texture
 */
function CopyTextureTransform(source: Texture, destination: Texture) {
    destination.uOffset = source.uOffset;
    destination.vOffset = source.vOffset;
    destination.uScale = source.uScale;
    destination.vScale = source.vScale;
    destination.uAng = source.uAng;
    destination.vAng = source.vAng;
    destination.wAng = source.wAng;
    destination.uRotationCenter = source.uRotationCenter;
    destination.vRotationCenter = source.vRotationCenter;
}

/**
 * @internal
 * Merge multiple texture channels into a single texture
 * @param name Name for the resulting texture
 * @param config Merge configuration
 * @param scene Scene to create the texture in
 * @returns The merged texture
 */
export async function MergeTexturesAsync(name: string, config: ITextureMergeConfiguration, scene: Scene): Promise<ProceduralTexture> {
    const channels = [config.red, config.green, config.blue, config.alpha];
    const textureInputs: BaseTexture[] = [];
    const textureInputMap: number[] = []; // Maps channel index to texture input index (-1 for constants)

    // Collect unique textures and validate inputs
    for (let channelIndex = 0; channelIndex < 4; channelIndex++) {
        const channel = channels[channelIndex];
        if (channel) {
            if (IsTextureInput(channel)) {
                // Validate source channel
                if (channel.sourceChannel < 0 || channel.sourceChannel > 3) {
                    throw new Error("Source channel must be between 0 and 3 (R, G, B, A)");
                }

                // Find or add texture to inputs
                let textureIndex = textureInputs.indexOf(channel.texture);
                if (textureIndex === -1) {
                    textureIndex = textureInputs.length;
                    textureInputs.push(channel.texture);
                }
                textureInputMap[channelIndex] = textureIndex;
            } else if (IsConstantInput(channel)) {
                // Validate constant value
                if (channel.value < 0 || channel.value > 1) {
                    throw new Error("Constant value must be between 0.0 and 1.0");
                }
                textureInputMap[channelIndex] = -1;
            } else {
                throw new Error("Invalid channel input configuration");
            }
        } else {
            textureInputMap[channelIndex] = -1;
        }
    }

    // Determine output size
    let outputSize = config.outputSize;
    if (!outputSize && textureInputs.length > 0) {
        // Use the largest texture size
        let maxSize = 0;
        for (const texture of textureInputs) {
            const size = texture.getSize();
            const currentSize = Math.max(size.width, size.height);
            if (currentSize > maxSize) {
                maxSize = currentSize;
                outputSize = size.width === size.height ? maxSize : size;
            }
        }
    }
    outputSize = outputSize || 512; // Fallback size

    // Generate shader defines
    const defines: string[] = [];
    const usedTextures = new Set<number>();

    for (let channelIndex = 0; channelIndex < 4; channelIndex++) {
        const channel = channels[channelIndex];
        const channelName = ["RED", "GREEN", "BLUE", "ALPHA"][channelIndex];

        if (channel && IsTextureInput(channel)) {
            defines.push(`${channelName}_FROM_TEXTURE`);
            const textureIndex = textureInputMap[channelIndex];
            usedTextures.add(textureIndex);
        }
    }

    // Add texture defines for used textures
    usedTextures.forEach((textureIndex) => {
        defines.push(`USE_TEXTURE${textureIndex}`);
    });

    // Create the procedural texture
    const outputTextureOptions: IProceduralTextureCreationOptions = {
        type: Constants.TEXTURETYPE_HALF_FLOAT,
        format: Constants.TEXTUREFORMAT_RGBA,
        samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
        generateDepthBuffer: false,
        generateMipMaps: false,
        shaderLanguage: scene.getEngine().isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
        extraInitializationsAsync: async () => {
            if (scene.getEngine().isWebGPU) {
                await Promise.all([import("../../ShadersWGSL/textureMerger.fragment")]);
            } else {
                await Promise.all([import("../../Shaders/textureMerger.fragment")]);
            }
        },
    };
    const proceduralTexture = new ProceduralTexture(name, outputSize, _ShaderName, scene, outputTextureOptions);
    proceduralTexture.refreshRate = -1; // Do not auto-refresh

    // Set the defines
    proceduralTexture.defines = defines.length > 0 ? "#define " + defines.join("\n#define ") + "\n" : "";

    // Set up texture inputs
    for (let i = 0; i < textureInputs.length; i++) {
        CopyTextureTransform(textureInputs[i] as Texture, proceduralTexture);
        proceduralTexture.setTexture(`inputTexture${i}`, textureInputs[i]);
    }

    // Set up channel configuration
    for (let channelIndex = 0; channelIndex < 4; channelIndex++) {
        const channel = channels[channelIndex];
        const channelName = ["red", "green", "blue", "alpha"][channelIndex];

        if (channel && IsTextureInput(channel)) {
            const textureIndex = textureInputMap[channelIndex];
            proceduralTexture.setInt(`${channelName}TextureIndex`, textureIndex);
            proceduralTexture.setInt(`${channelName}SourceChannel`, channel.sourceChannel);
        } else {
            // Use constant value (either provided or default)
            let constantValue: number;
            if (channel && IsConstantInput(channel)) {
                constantValue = channel.value;
            } else {
                // Use default values: 0 for RGB, 1 for alpha
                constantValue = channelIndex === 3 ? 1.0 : 0.0;
            }
            proceduralTexture.setFloat(`${channelName}ConstantValue`, constantValue);
        }
    }

    return await new Promise<ProceduralTexture>((resolve, reject) => {
        // Compile and render
        proceduralTexture.executeWhenReady(() => {
            try {
                proceduralTexture.render();
                resolve(proceduralTexture);
            } catch (error) {
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        });
    });
}

/**
 * @internal
 * Create a texture input configuration
 * @param texture The texture to read from
 * @param sourceChannel The channel to read (0=R, 1=G, 2=B, 3=A)
 * @returns Texture channel input configuration
 */
export function CreateTextureInput(texture: BaseTexture, sourceChannel: number): ITextureChannelInput {
    return { texture, sourceChannel };
}

/**
 * @internal
 * Create a constant value input configuration
 * @param value The constant value (0.0-1.0)
 * @returns Constant channel input configuration
 */
export function CreateConstantInput(value: number): IConstantChannelInput {
    return { value };
}

/**
 * @internal
 * Create a simple RGBA channel packing configuration
 * @param red Input for red channel
 * @param green Input for green channel (optional, defaults to 0)
 * @param blue Input for blue channel (optional, defaults to 0)
 * @param alpha Input for alpha channel (optional, defaults to 1)
 * @returns Texture merge configuration
 */
export function CreateRGBAConfiguration(red: ChannelInput, green?: ChannelInput, blue?: ChannelInput, alpha?: ChannelInput): ITextureMergeConfiguration {
    return { red, green, blue, alpha };
}
