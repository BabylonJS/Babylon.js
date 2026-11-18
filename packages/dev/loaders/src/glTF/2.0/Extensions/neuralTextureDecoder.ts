import { type IBabylonMaterialsNeuralTexture } from "./BABYLON_materials_neural_texture.types";

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
}

/** @internal */
export function ValidateNeuralTexture(context: string, extension: IBabylonMaterialsNeuralTexture): void {
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
        !extension.replacedSlots.every((slot) => ["baseColorTexture", "normalTexture", "occlusionTexture", "metallicRoughnessTexture"].includes(slot)) ||
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
            }
        })
    ) {
        throw new Error(`${context}: Unsupported or invalid babylon-ntc-v1 payload`);
    }
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
    const input = new Float32Array(24);
    const hidden0 = new Float32Array(32);
    const hidden1 = new Float32Array(32);
    const output = new Float32Array(9);
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
            Layer(hidden1, output, weights, 1856, 2144, false);
            const offset = (y * width + x) * 4;
            if (decoded.baseColor) {
                for (let c = 0; c < 4; c++) {
                    decoded.baseColor[offset + c] = Math.round(output[channels.baseColor![c]] * 255);
                }
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
        }
        if (Date.now() - batchStart >= 12) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            batchStart = Date.now();
        }
    }
    return decoded;
}
