import { type IBabylonMaterialsNeuralTexture, type NeuralTextureOutputs } from "./BABYLON_materials_neural_texture.types";

/** @internal */
export interface INeuralTextureGrid {
    data: Uint8Array;
    width: number;
    height: number;
}

/** @internal */
export interface INeuralTextureDecoded {
    baseColor?: Uint8Array;
    normal?: Uint8Array;
    orm?: Uint8Array;
    emissive?: Uint8Array;
    diffuse?: Uint8Array;
    /** Specular RGB with glossiness in alpha. */
    specGloss?: Uint8Array;
}

/** Number of float32 parameters of every layer but the last: W0, b0, W1, b1. */
const HiddenParameterCount = 24 * 32 + 32 + 32 * 32 + 32;

// Layout of the last layer. W2 is [32][outputs], followed by b2[outputs].
export function GetNeuralTextureWeightCount(outputs: number): number {
    return HiddenParameterCount + 33 * outputs;
}

const CoreSlots = ["baseColorTexture", "normalTexture", "occlusionTexture", "metallicRoughnessTexture"];
const SpecularGlossinessSlots = ["KHR_materials_pbrSpecularGlossiness.diffuseTexture", "KHR_materials_pbrSpecularGlossiness.specularGlossinessTexture"];
const OutputComponents: Array<[keyof NeuralTextureOutputs, number[]]> = [
    ["baseColor", [3, 4]],
    ["normal", [2]],
    ["occlusion", [1]],
    ["roughness", [1]],
    ["metallic", [1]],
    ["emissive", [3]],
    ["diffuse", [3, 4]],
    ["specular", [3]],
    ["glossiness", [1]],
];

// Tells a [startChannel, componentCount] pair apart from an explicit channel list.
function IsRange(channels: number[], components: number[]): boolean {
    if (channels.length !== 2 || !components.includes(channels[1])) {
        return false;
    }
    // Only normal has two components, so [start, 2] is ambiguous with the index list [x, 2]; contiguous lists never start at 1 there.
    return !components.includes(2) || channels[0] !== 1;
}
/**
 * Validates a babylon-ntc-v1 or babylon-ntc-v2 payload.
 * @param context the glTF context, for error messages
 * @param extension the extension payload
 * @returns the payload with every output group expressed as an explicit list of output channel indices
 * @internal
 */
export function ResolveNeuralTexture(context: string, extension: IBabylonMaterialsNeuralTexture): IBabylonMaterialsNeuralTexture {
    if (extension?.codec === "babylon-ntc-v2") {
        return ResolveV2(context, extension);
    }
    ValidateV1(context, extension);
    return extension;
}

/** @internal */
export function ValidateNeuralTexture(context: string, extension: IBabylonMaterialsNeuralTexture): void {
    ResolveNeuralTexture(context, extension);
}

function ValidateV1(context: string, extension: IBabylonMaterialsNeuralTexture): void {
    const network = extension.network;
    const dimensions = [extension.resolution, extension.hiResolution, extension.loResolution];
    const outputs = extension.outputs;
    if (
        extension.version !== 1 ||
        extension.codec !== "babylon-ntc-v1" ||
        extension.latentChannels !== 8 ||
        extension.latentTextures?.length !== 4 ||
        extension.weights?.componentType !== 5126 ||
        extension.weights.count !== 2153 ||
        network?.inputs !== 24 ||
        network.hidden?.join(",") !== "32,32" ||
        network.outputs !== 9 ||
        network.activation !== "relu" ||
        network.positionalEncoding?.frequencies?.join(",") !== "1,2" ||
        network.positionalEncoding.scale !== "hiResolution" ||
        network.weightLayout !== "W0[in][out],b0,W1,b1,W2,b2 float32" ||
        !dimensions.every((size) => size?.length === 2 && size.every((value) => Number.isSafeInteger(value) && value > 0 && value <= 16384)) ||
        !Array.isArray(extension.replacedSlots) ||
        !extension.replacedSlots.every((slot) => CoreSlots.includes(slot)) ||
        !outputs ||
        ![
            ["baseColor", 4],
            ["normal", 2],
            ["occlusion", 1],
            ["roughness", 1],
            ["metallic", 1],
        ].every(([name, count]) => {
            const indices = outputs[name as keyof typeof outputs];
            return !indices || (indices.length === count && indices.every((value) => Number.isInteger(value) && value >= 0 && value < 9));
        }) ||
        !extension.replacedSlots.every((slot) => {
            switch (slot) {
                case "baseColorTexture":
                    return !!outputs.baseColor;
                case "normalTexture":
                    return !!outputs.normal;
                case "occlusionTexture":
                    return !!outputs.occlusion;
                case "metallicRoughnessTexture":
                    return !!outputs.roughness && !!outputs.metallic;
                default:
                    return false;
            }
        })
    ) {
        throw new Error(`${context}: Unsupported or invalid babylon-ntc-v1 payload`);
    }
}

function ResolveV2(context: string, extension: IBabylonMaterialsNeuralTexture): IBabylonMaterialsNeuralTexture {
    const network = extension.network;
    const count = network?.outputs;
    const dimensions = [extension.resolution, extension.hiResolution, extension.loResolution];
    const invalid = (reason: string) => new Error(`${context}: Unsupported or invalid babylon-ntc-v2 payload (${reason})`);
    if (
        extension.version !== 1 ||
        (extension.latentChannels !== undefined && extension.latentChannels !== 8) ||
        extension.latentTextures?.length !== 4 ||
        extension.weights?.componentType !== 5126 ||
        network?.inputs !== 24 ||
        network.hidden?.join(",") !== "32,32" ||
        network.activation !== "relu" ||
        (network.positionalEncoding && (network.positionalEncoding.frequencies?.join(",") !== "1,2" || network.positionalEncoding.scale !== "hiResolution")) ||
        !dimensions.every((size) => size?.length === 2 && size.every((value) => Number.isSafeInteger(value) && value > 0 && value <= 16384))
    ) {
        throw invalid("header");
    }
    if (!Number.isInteger(count) || count < 1 || count > 32) {
        throw invalid("network.outputs");
    }
    if (extension.weights.count !== GetNeuralTextureWeightCount(count)) {
        throw invalid("weights.count");
    }
    if (
        !extension.outputs ||
        !Array.isArray(extension.replacedSlots) ||
        !extension.replacedSlots.every((slot) => CoreSlots.includes(slot) || SpecularGlossinessSlots.includes(slot) || slot === "emissiveTexture")
    ) {
        throw invalid("outputs or replacedSlots");
    }
    const outputs: NeuralTextureOutputs = {};
    for (const [name, components] of OutputComponents) {
        const channels = extension.outputs[name];
        if (channels === undefined) {
            continue;
        }
        if (!Array.isArray(channels) || !channels.every((value) => Number.isInteger(value) && value >= 0)) {
            throw invalid(`outputs.${name}`);
        }
        let indices = channels;
        if (IsRange(channels, components)) {
            indices = Array.from({ length: channels[1] }, (_, i) => channels[0] + i);
        }
        if (!components.includes(indices.length) || !indices.every((value) => value < count)) {
            throw invalid(`outputs.${name}`);
        }
        outputs[name] = indices;
    }
    const groups = (slot: string): Array<keyof NeuralTextureOutputs> => {
        switch (slot) {
            case "baseColorTexture":
                return ["baseColor"];
            case "normalTexture":
                return ["normal"];
            case "occlusionTexture":
                return ["occlusion"];
            case "metallicRoughnessTexture":
                return ["roughness", "metallic"];
            case "emissiveTexture":
                return ["emissive"];
            case "KHR_materials_pbrSpecularGlossiness.diffuseTexture":
                return ["diffuse"];
            default:
                return ["specular", "glossiness"];
        }
    };
    for (const slot of extension.replacedSlots) {
        if (!groups(slot).every((name) => !!outputs[name])) {
            throw invalid(`replacedSlots ${slot} without its outputs`);
        }
    }
    return { ...extension, outputs };
}
function SampleGrid(grid: INeuralTextureGrid, u: number, v: number, target: Float32Array, offset: number): void {
    const x = u * grid.width - 0.5;
    const y = v * grid.height - 0.5;
    const floorX = Math.floor(x);
    const floorY = Math.floor(y);
    const fx = x - floorX;
    const fy = y - floorY;
    const x0 = ((floorX % grid.width) + grid.width) % grid.width;
    const y0 = ((floorY % grid.height) + grid.height) % grid.height;
    const x1 = (x0 + 1) % grid.width;
    const y1 = (y0 + 1) % grid.height;
    const a = (y0 * grid.width + x0) * 4;
    const b = (y0 * grid.width + x1) * 4;
    const c = (y1 * grid.width + x0) * 4;
    const d = (y1 * grid.width + x1) * 4;
    for (let channel = 0; channel < 4; channel++) {
        target[offset + channel] =
            ((grid.data[a + channel] * (1 - fx) + grid.data[b + channel] * fx) * (1 - fy) + (grid.data[c + channel] * (1 - fx) + grid.data[d + channel] * fx) * fy) / 255;
    }
}

// Writes RGB(A) texels; opaque when the group has no alpha channel.
function WriteColor(target: Uint8Array, offset: number, output: Float32Array, channels: number[]): void {
    for (let c = 0; c < 3; c++) {
        target[offset + c] = Math.round(output[channels[c]] * 255);
    }
    target[offset + 3] = channels.length > 3 ? Math.round(output[channels[3]] * 255) : 255;
}

function Layer(input: Float32Array, output: Float32Array, weights: Float32Array, weightOffset: number, biasOffset: number, relu: boolean): void {
    for (let j = 0; j < output.length; j++) {
        let value = weights[biasOffset + j];
        for (let i = 0; i < input.length; i++) {
            value += input[i] * weights[weightOffset + i * output.length + j];
        }
        output[j] = relu ? Math.max(0, value) : Math.min(1, Math.max(0, value));
    }
}

/**
 * Reference decoder. Reuses all scratch arrays and yields between short batches of rows,
 * so loading large textures does not monopolize the browser's main thread.
 * @internal
 */
export async function DecodeNeuralTextureAsync(
    extension: IBabylonMaterialsNeuralTexture,
    grids: INeuralTextureGrid[],
    weights: Float32Array,
    isCancelled: () => boolean = () => false
): Promise<INeuralTextureDecoded> {
    const [width, height] = extension.resolution;
    const length = width * height * 4;
    const decoded: INeuralTextureDecoded = {};
    if (extension.replacedSlots.includes("baseColorTexture")) {
        decoded.baseColor = new Uint8Array(length);
    }
    if (extension.replacedSlots.includes("normalTexture")) {
        decoded.normal = new Uint8Array(length);
    }
    if (extension.replacedSlots.includes("occlusionTexture") || extension.replacedSlots.includes("metallicRoughnessTexture")) {
        decoded.orm = new Uint8Array(length);
    }
    if (extension.replacedSlots.includes("emissiveTexture")) {
        decoded.emissive = new Uint8Array(length);
    }
    if (extension.replacedSlots.includes("KHR_materials_pbrSpecularGlossiness.diffuseTexture")) {
        decoded.diffuse = new Uint8Array(length);
    }
    if (extension.replacedSlots.includes("KHR_materials_pbrSpecularGlossiness.specularGlossinessTexture")) {
        decoded.specGloss = new Uint8Array(length);
    }
    const outputCount = extension.network.outputs;
    const input = new Float32Array(24);
    const hidden0 = new Float32Array(32);
    const hidden1 = new Float32Array(32);
    const output = new Float32Array(outputCount);
    const channels = extension.outputs;
    let batchStart = Date.now();
    for (let y = 0; y < height; y++) {
        if (isCancelled()) {
            throw new Error("Neural texture decoding cancelled");
        }
        const v = (y + 0.5) / height;
        const py = ((v * extension.hiResolution[1]) % 1) * 2 * Math.PI;
        input[17] = Math.sin(py);
        input[19] = Math.cos(py);
        input[21] = Math.sin(2 * py);
        input[23] = Math.cos(2 * py);
        for (let x = 0; x < width; x++) {
            const u = (x + 0.5) / width;
            for (let grid = 0; grid < 4; grid++) {
                SampleGrid(grids[grid], u, v, input, grid * 4);
            }
            const px = ((u * extension.hiResolution[0]) % 1) * 2 * Math.PI;
            input[16] = Math.sin(px);
            input[18] = Math.cos(px);
            input[20] = Math.sin(2 * px);
            input[22] = Math.cos(2 * px);
            Layer(input, hidden0, weights, 0, 768, true);
            Layer(hidden0, hidden1, weights, 800, 1824, true);
            Layer(hidden1, output, weights, 1856, 1856 + 32 * outputCount, false);
            const offset = (y * width + x) * 4;
            if (decoded.baseColor) {
                WriteColor(decoded.baseColor, offset, output, channels.baseColor!);
            }
            if (decoded.normal) {
                const nx = output[channels.normal![0]] * 2 - 1;
                const ny = output[channels.normal![1]] * 2 - 1;
                decoded.normal[offset] = Math.round(output[channels.normal![0]] * 255);
                decoded.normal[offset + 1] = Math.round(output[channels.normal![1]] * 255);
                decoded.normal[offset + 2] = Math.round((Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)) * 0.5 + 0.5) * 255);
                decoded.normal[offset + 3] = 255;
            }
            if (decoded.orm) {
                decoded.orm[offset] = channels.occlusion ? Math.round(output[channels.occlusion[0]] * 255) : 255;
                decoded.orm[offset + 1] = channels.roughness ? Math.round(output[channels.roughness[0]] * 255) : 255;
                decoded.orm[offset + 2] = channels.metallic ? Math.round(output[channels.metallic[0]] * 255) : 255;
                decoded.orm[offset + 3] = 255;
            }
            if (decoded.emissive) {
                WriteColor(decoded.emissive, offset, output, channels.emissive!);
            }
            if (decoded.diffuse) {
                WriteColor(decoded.diffuse, offset, output, channels.diffuse!);
            }
            if (decoded.specGloss) {
                WriteColor(decoded.specGloss, offset, output, channels.specular!);
                decoded.specGloss[offset + 3] = Math.round(output[channels.glossiness![0]] * 255);
            }
        }
        if (Date.now() - batchStart >= 12) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            batchStart = Date.now();
        }
    }
    return decoded;
}
