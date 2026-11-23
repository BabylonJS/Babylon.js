import { type IBabylonMaterialsNeuralTexture, type NeuralTextureOutputs, type NeuralTextureV4Channel } from "./BABYLON_materials_neural_texture.types";

/*
 * babylon-ntc-v4: layout rules, fp16 weights and the CPU reference decode.
 * Sources: arXiv 2305.17105 (Vaidyanathan et al. 2023) sections 4.1 to 4.4; the pseudocode of the frozen babylon-ntc-v4 spec.
 */

/** One latent grid of a babylon-ntc-v4 payload, with the sizes derived from the payload. @internal */
export interface INeuralV4GridLayout {
    /** Level-0 size. */
    width: number;
    height: number;
    /** Latent channels per cell. */
    channels: number;
    /** Bits per latent channel: 2 or 4. */
    bits: number;
    /** Indices into latentTextures of the atlas images, in packing order. */
    textures: number[];
    /** Size of each atlas image. */
    atlasWidth: number;
    atlasHeight: number;
}

/** One dense layer of the fp16 network. Offsets are in float16 values. @internal */
export interface INeuralV4LayerLayout {
    in: number;
    inStride: number;
    out: number;
    weightOffset: number;
    biasOffset: number;
}

/** Everything the readers need from a validated babylon-ntc-v4 payload. @internal */
export interface INeuralV4Layout {
    width: number;
    height: number;
    mipCount: number;
    levels: number;
    grids: [INeuralV4GridLayout, INeuralV4GridLayout];
    inputs: number;
    layers: INeuralV4LayerLayout[];
    /** Number of network outputs (N_net). */
    netOutputs: number;
    /** The logical channels (N entries). */
    channels: NeuralTextureV4Channel[];
    /** Weights size in float16 values. */
    halfCount: number;
}

/**
 * Mip texel counts: Wm = max(1, W >> m).
 * @param layout the payload layout
 * @param mip the mip
 * @returns the mip width and height
 * @internal
 */
export function GetNeuralV4MipSize(layout: Pick<INeuralV4Layout, "width" | "height">, mip: number): [number, number] {
    return [Math.max(1, layout.width >> mip), Math.max(1, layout.height >> mip)];
}

/**
 * Pyramid level that predicts the given mip (section 4.1, Table 1).
 * @param mip the mip
 * @param levels the number of pyramid levels
 * @returns the level
 * @internal
 */
export function GetNeuralV4LevelOf(mip: number, levels: number): number {
    return Math.min(levels - 1, Math.max(0, (mip >> 1) - 1));
}

/**
 * Level size of a grid.
 * @param grid the grid
 * @param level the pyramid level
 * @returns the level width and height
 * @internal
 */
export function GetNeuralV4LevelSize(grid: Pick<INeuralV4GridLayout, "width" | "height">, level: number): [number, number] {
    return [grid.width >> (2 * level), grid.height >> (2 * level)];
}

/**
 * Position of a level in the grid atlas: level 0 at the origin, the others stacked in the column at its right.
 * @param grid the grid
 * @param level the pyramid level
 * @returns the texel position of the level
 * @internal
 */
export function GetNeuralV4AtlasOrigin(grid: Pick<INeuralV4GridLayout, "width" | "height">, level: number): [number, number] {
    if (level === 0) {
        return [0, 0];
    }
    let y = 0;
    for (let k = 1; k < level; k++) {
        y += grid.height >> (2 * k);
    }
    return [grid.width, y];
}

/**
 * Largest level count such that the half-resolution grid divides by 4^(L-1).
 * @param width1 the width of the half-resolution grid
 * @param height1 the height of the half-resolution grid
 * @returns the level count
 * @internal
 */
export function GetNeuralV4Levels(width1: number, height1: number): number {
    let levels = 1;
    while (width1 % 4 ** levels === 0 && height1 % 4 ** levels === 0) {
        levels++;
    }
    return levels;
}

/**
 * Number of RGBA8 images that hold the packed bits of a grid.
 * @param channels the grid channel count
 * @param bits the bits per channel
 * @returns the image count
 * @internal
 */
export function GetNeuralV4ImageCount(channels: number, bits: number): number {
    return Math.ceil((channels * bits) / 32);
}

/**
 * First row of every layer in the weights data texture: layers are padded to multiples of four rows.
 * @param layers the network layers
 * @returns the first row of each layer
 * @internal
 */
export function GetNeuralV4RowOffsets(layers: Array<{ out: number }>): number[] {
    const offsets: number[] = [];
    let row = 0;
    for (const layer of layers) {
        offsets.push(row);
        row += Math.ceil(layer.out / 4) * 4;
    }
    return offsets;
}

/**
 * Size in bytes of the fp16 weights of a network.
 * @param layers the network layers
 * @returns the byte length
 * @internal
 */
export function GetNeuralV4WeightsByteLength(layers: Array<{ inStride: number; out: number }>): number {
    return 2 * layers.reduce((sum, layer) => sum + layer.out * (layer.inStride + 1), 0);
}

function IsSize(size: unknown): size is [number, number] {
    return Array.isArray(size) && size.length === 2 && size.every((value) => Number.isSafeInteger(value) && value > 0 && value <= 16384);
}

/**
 * Checks the babylon-ntc-v4 rules of the grids, pyramid, network, weights and channels (not the outputs).
 * @param extension the payload
 * @returns the layout, or the reason the payload is invalid
 * @internal
 */
export function GetNeuralV4Layout(extension: IBabylonMaterialsNeuralTexture): { layout: INeuralV4Layout; error?: undefined } | { layout?: undefined; error: string } {
    const fail = (error: string) => ({ error });
    if (extension.version !== 1 || !IsSize(extension.resolution)) {
        return fail("header");
    }
    const [width, height] = extension.resolution;
    if (width % 8 !== 0 || height % 8 !== 0) {
        return fail("resolution");
    }
    const grids = extension.grids;
    if (!Array.isArray(grids) || grids.length !== 2) {
        return fail("grids");
    }
    const gridLayouts: INeuralV4GridLayout[] = [];
    for (let g = 0; g < 2; g++) {
        const grid = grids[g];
        if (
            !grid ||
            !IsSize(grid.resolution) ||
            grid.sampling !== (g === 0 ? "concat2x2" : "bilinear") ||
            (grid.bits !== 2 && grid.bits !== 4) ||
            !Number.isInteger(grid.channels) ||
            grid.channels < 1 ||
            grid.channels > 64
        ) {
            return fail(`grids[${g}]`);
        }
        gridLayouts.push({ width: grid.resolution[0], height: grid.resolution[1], channels: grid.channels, bits: grid.bits, textures: [], atlasWidth: 0, atlasHeight: 0 });
    }
    const [g0, g1] = gridLayouts;
    const ratio = width / g0.width;
    if ((ratio !== 2 && ratio !== 4) || height / g0.height !== ratio || g1.width * 2 !== g0.width || g1.height * 2 !== g0.height) {
        return fail("grid resolutions");
    }
    const levels = GetNeuralV4Levels(g1.width, g1.height);
    const mipCount = 32 - Math.clz32(Math.max(width, height));
    if (extension.levels !== levels || extension.mipCount !== mipCount) {
        return fail("levels or mipCount");
    }
    const used = new Set<number>();
    for (let g = 0; g < 2; g++) {
        const grid = gridLayouts[g];
        const textures = grids[g].textures;
        if (
            !Array.isArray(textures) ||
            textures.length !== GetNeuralV4ImageCount(grid.channels, grid.bits) ||
            !textures.every((index) => Number.isInteger(index) && index >= 0 && index < (extension.latentTextures?.length ?? 0) && !used.has(index) && !!used.add(index))
        ) {
            return fail(`grids[${g}].textures`);
        }
        grid.textures = textures.slice();
        grid.atlasWidth = levels > 1 ? grid.width + (grid.width >> 2) : grid.width;
        grid.atlasHeight = grid.height;
    }
    if (extension.latentTextures.length !== used.size || used.size > 8) {
        return fail("latentTextures");
    }
    const inputs = 4 * g0.channels + g1.channels + 13;
    const network = extension.network;
    if (
        !network ||
        network.inputs !== inputs ||
        network.hidden?.join(",") !== "64,64" ||
        network.activation !== "hardgelu" ||
        network.weightFormat !== "float16" ||
        (network.inputLayout && network.inputLayout.join(",") !== "grid0,grid1,posenc,lod") ||
        (network.positionalEncoding && (network.positionalEncoding.type !== "triangle" || network.positionalEncoding.periods?.join(",") !== "8,4,2"))
    ) {
        return fail("network");
    }
    const netOutputs = network.outputs;
    if (!Number.isInteger(netOutputs) || netOutputs < 0 || netOutputs > 32) {
        return fail("network.outputs");
    }
    const expected = [
        { in: inputs, out: 64 },
        { in: 64, out: 64 },
        { in: 64, out: netOutputs },
    ];
    if (!Array.isArray(network.layers) || network.layers.length !== 3) {
        return fail("network.layers");
    }
    const layers: INeuralV4LayerLayout[] = [];
    let offset = 0;
    for (let l = 0; l < 3; l++) {
        const layer = network.layers[l];
        const inStride = Math.ceil(expected[l].in / 4) * 4;
        if (!layer || layer.in !== expected[l].in || layer.out !== expected[l].out || layer.inStride !== inStride) {
            return fail(`network.layers[${l}]`);
        }
        const weightOffset = offset;
        const biasOffset = weightOffset + layer.out * inStride;
        offset = biasOffset + layer.out;
        layers.push({ in: layer.in, inStride, out: layer.out, weightOffset, biasOffset });
    }
    const weights = extension.weights;
    if (!weights || !Number.isInteger(weights.bufferView) || weights.bufferView < 0 || weights.byteLength !== GetNeuralV4WeightsByteLength(layers)) {
        return fail("weights.byteLength");
    }
    const channels = extension.channels;
    if (!Array.isArray(channels) || channels.length < 1 || channels.length > 32) {
        return fail("channels");
    }
    let nextNet = 0;
    for (const channel of channels) {
        if (channel && typeof channel === "object" && "net" in channel) {
            if (channel.net !== nextNet++ || (channel.activation !== "none" && channel.activation !== "sigmoid")) {
                return fail("channels");
            }
        } else if (
            !channel ||
            typeof (channel as { const?: unknown }).const !== "number" ||
            !((channel as { const: number }).const >= 0 && (channel as { const: number }).const <= 1)
        ) {
            return fail("channels");
        }
    }
    if (nextNet !== netOutputs) {
        return fail("channels or network.outputs");
    }
    return { layout: { width, height, mipCount, levels, grids: [g0, g1], inputs, layers, netOutputs, channels: channels.map((c) => ({ ...c })), halfCount: offset } };
}

/**
 * Exact IEEE binary16 to float32 conversion.
 * @param half the binary16 bits
 * @returns the value
 * @internal
 */
export function HalfToFloat(half: number): number {
    const sign = half & 0x8000 ? -1 : 1;
    const exponent = (half >> 10) & 0x1f;
    const fraction = half & 0x3ff;
    if (exponent === 0) {
        return sign * fraction * 2 ** -24;
    }
    if (exponent === 31) {
        return fraction ? NaN : sign * Infinity;
    }
    return sign * (1 + fraction / 1024) * 2 ** (exponent - 15);
}

/**
 * Reads the little-endian binary16 parameters. The values stay float16 for the GPU.
 * @param layout the payload layout
 * @param bytes the bufferView bytes
 * @returns the parameters as raw half-float bits, in file order
 * @internal
 */
export function ParseNeuralV4Weights(layout: INeuralV4Layout, bytes: Uint8Array): Uint16Array {
    if (bytes.byteLength !== layout.halfCount * 2) {
        throw new Error(`Expected ${layout.halfCount * 2} bytes of float16 network parameters`);
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const half = new Uint16Array(layout.halfCount);
    for (let i = 0; i < half.length; i++) {
        half[i] = view.getUint16(i * 2, true);
        if (((half[i] >> 10) & 0x1f) === 31) {
            throw new Error("Non-finite network parameter");
        }
    }
    return half;
}

/** Float32 network parameters, per layer. @internal */
export interface INeuralV4Network {
    /** weights are [out][inStride], padding included. */
    layers: Array<{ weights: Float32Array; bias: Float32Array }>;
}

/** @internal */
export function ExpandNeuralV4Weights(layout: INeuralV4Layout, half: Uint16Array): INeuralV4Network {
    return {
        layers: layout.layers.map((layer) => {
            const weights = new Float32Array(layer.out * layer.inStride);
            for (let i = 0; i < weights.length; i++) {
                weights[i] = HalfToFloat(half[layer.weightOffset + i]);
            }
            const bias = new Float32Array(layer.out);
            for (let i = 0; i < bias.length; i++) {
                bias[i] = HalfToFloat(half[layer.biasOffset + i]);
            }
            return { weights, bias };
        }),
    };
}

/** Layout of the weights data texture shared by the bake and the runtime shader. @internal */
export interface INeuralV4WeightTexture {
    /** RGBA16F texels: each row holds one output neuron, inStride / 4 texels of weights then a (bias, 0, 0, 0) texel. */
    data: Uint16Array;
    width: number;
    height: number;
    /** First row of every layer. Layers are padded to multiples of four rows so that the shader can fetch 4 neurons per group. */
    rowOffsets: number[];
}

/** @internal */
export function PackNeuralV4WeightTexture(layout: INeuralV4Layout, half: Uint16Array): INeuralV4WeightTexture {
    const width = Math.max(...layout.layers.map((layer) => layer.inStride / 4 + 1));
    const rowOffsets = GetNeuralV4RowOffsets(layout.layers);
    const last = layout.layers[layout.layers.length - 1];
    const height = rowOffsets[rowOffsets.length - 1] + Math.ceil(last.out / 4) * 4;
    const data = new Uint16Array(width * Math.max(1, height) * 4);
    layout.layers.forEach((layer, l) => {
        const texels = layer.inStride / 4;
        for (let o = 0; o < layer.out; o++) {
            const row = (rowOffsets[l] + o) * width * 4;
            data.set(half.subarray(layer.weightOffset + o * layer.inStride, layer.weightOffset + (o + 1) * layer.inStride), row);
            data[row + texels * 4] = half[layer.biasOffset + o];
        }
    });
    return { data, width, height: Math.max(1, height), rowOffsets };
}

/** A decoded RGBA8 atlas image. @internal */
export interface INeuralV4Atlas {
    data: Uint8Array;
    width: number;
    height: number;
}

function ReadQ(layout: INeuralV4Layout, atlases: INeuralV4Atlas[], g: number, level: number, x: number, y: number, c: number): number {
    const grid = layout.grids[g];
    const [w, h] = GetNeuralV4LevelSize(grid, level);
    const [ox, oy] = GetNeuralV4AtlasOrigin(grid, level);
    x = ((x % w) + w) % w;
    y = ((y % h) + h) % h;
    const bit = c * grid.bits;
    const byte = bit >> 3;
    const atlas = atlases[grid.textures[byte >> 2]];
    const value = atlas.data[((oy + y) * atlas.width + ox + x) * 4 + (byte & 3)];
    return (value >> (8 - grid.bits - (bit & 7))) & ((1 << grid.bits) - 1);
}

/**
 * Unpacked latent integers of one level, [y][x][c].
 * @param layout the payload layout
 * @param atlases the decoded atlas images, indexed like latentTextures
 * @param g the grid, 0 or 1
 * @param level the pyramid level
 * @returns q values
 * @internal
 */
export function UnpackNeuralV4Latents(layout: INeuralV4Layout, atlases: INeuralV4Atlas[], g: number, level: number): Uint8Array {
    const grid = layout.grids[g];
    const [w, h] = GetNeuralV4LevelSize(grid, level);
    const result = new Uint8Array(w * h * grid.channels);
    let index = 0;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            for (let c = 0; c < grid.channels; c++) {
                result[index++] = ReadQ(layout, atlases, g, level, x, y, c);
            }
        }
    }
    return result;
}

const F = Math.fround;

/**
 * Scalar float32 reference of the babylon-ntc-v4 decode: the same operations in the same order as the specification.
 * @internal
 */
export class NeuralV4Decoder {
    private readonly _inputs: Float32Array;
    private readonly _hidden0 = new Float32Array(64);
    private readonly _hidden1 = new Float32Array(64);
    private readonly _net: Float32Array;

    /**
     * @param _layout the payload layout
     * @param _atlases the decoded atlas images, indexed like latentTextures
     * @param _network the float32 parameters
     */
    constructor(
        private readonly _layout: INeuralV4Layout,
        private readonly _atlases: INeuralV4Atlas[],
        private readonly _network: INeuralV4Network
    ) {
        this._inputs = new Float32Array(_layout.layers[0].inStride);
        this._net = new Float32Array(Math.max(1, _layout.netOutputs));
    }

    private _latent(g: number, level: number, x: number, y: number, c: number): number {
        const bits = this._layout.grids[g].bits;
        return (ReadQ(this._layout, this._atlases, g, level, x, y, c) - (2 ** (bits - 1) - 1)) / 2 ** bits;
    }

    /**
     * Fills the input vector of a texel.
     * @param m the mip
     * @param i texel column
     * @param j texel row, 0 is the image top
     * @returns the (padded) input vector, valid until the next call
     */
    public inputs(m: number, i: number, j: number): Float32Array {
        const layout = this._layout;
        const x = this._inputs;
        x.fill(0);
        const level = GetNeuralV4LevelOf(m, layout.levels);
        const [wm, hm] = GetNeuralV4MipSize(layout, m);
        const [g0, g1] = layout.grids;
        let index = 0;
        const [w0, h0] = GetNeuralV4LevelSize(g0, level);
        const gx0 = F(F(F(i + 0.5) * (w0 / wm)) - 0.5);
        const gy0 = F(F(F(j + 0.5) * (h0 / hm)) - 0.5);
        const cx0 = Math.floor(gx0);
        const cy0 = Math.floor(gy0);
        for (const [dx, dy] of [
            [0, 0],
            [1, 0],
            [0, 1],
            [1, 1],
        ]) {
            for (let c = 0; c < g0.channels; c++) {
                x[index++] = this._latent(0, level, cx0 + dx, cy0 + dy, c);
            }
        }
        const [w1, h1] = GetNeuralV4LevelSize(g1, level);
        const gx1 = F(F(F(i + 0.5) * (w1 / wm)) - 0.5);
        const gy1 = F(F(F(j + 0.5) * (h1 / hm)) - 0.5);
        const cx1 = Math.floor(gx1);
        const cy1 = Math.floor(gy1);
        const fx = F(gx1 - cx1);
        const fy = F(gy1 - cy1);
        const ifx = F(1 - fx);
        const ify = F(1 - fy);
        for (let c = 0; c < g1.channels; c++) {
            const a = this._latent(1, level, cx1, cy1, c);
            const b = this._latent(1, level, cx1 + 1, cy1, c);
            const d = this._latent(1, level, cx1, cy1 + 1, c);
            const e = this._latent(1, level, cx1 + 1, cy1 + 1, c);
            const top = F(F(ifx * a) + F(fx * b));
            const bottom = F(F(ifx * d) + F(fx * e));
            x[index++] = F(F(ify * top) + F(fy * bottom));
        }
        for (const p of [i, j]) {
            for (const period of [8, 4, 2]) {
                const t = p / period;
                x[index++] = TriangleWave(t);
                x[index++] = TriangleWave(t - 0.25);
            }
        }
        x[index] = F(m / Math.max(1, layout.mipCount - 1));
        return x;
    }

    /**
     * Decodes one texel of a discrete mip.
     * @param m the mip
     * @param i texel column
     * @param j texel row, 0 is the image top
     * @param out receives the logical channels, constants included
     */
    public decode(m: number, i: number, j: number, out: Float32Array | number[]): void {
        const layout = this._layout;
        if (layout.netOutputs > 0) {
            const input = this.inputs(m, i, j);
            this._dense(0, input, this._hidden0, true);
            this._dense(1, this._hidden0, this._hidden1, true);
            this._dense(2, this._hidden1, this._net, false);
        }
        for (let n = 0; n < layout.channels.length; n++) {
            const channel = layout.channels[n];
            if ("const" in channel) {
                out[n] = channel.const;
            } else if (channel.activation === "sigmoid") {
                out[n] = F(1 / F(1 + F(Math.exp(-this._net[channel.net]))));
            } else {
                out[n] = Math.min(1, Math.max(0, this._net[channel.net]));
            }
        }
    }

    private _dense(l: number, input: Float32Array, output: Float32Array, activate: boolean): void {
        const layer = this._layout.layers[l];
        const { weights, bias } = this._network.layers[l];
        for (let o = 0; o < layer.out; o++) {
            let acc = bias[o];
            const row = o * layer.inStride;
            for (let k = 0; k < layer.in; k++) {
                acc = F(acc + F(weights[row + k] * input[k]));
            }
            output[o] = activate ? HardGelu(acc) : acc;
        }
    }
}

/** The material texture groups that a babylon-ntc-v4 payload can feed. @internal */
export type NeuralV4Group = "baseColor" | "normal" | "orm" | "emissive" | "diffuse" | "specGloss";

/**
 * Logical channel indices that feed a group, in the order of the group channels.
 * @param outputs the resolved outputs
 * @param group the group
 * @returns the channel indices
 * @internal
 */
export function GetNeuralV4GroupChannels(outputs: NeuralTextureOutputs, group: NeuralV4Group): number[] {
    const first = (channels?: number[]) => (channels ? [channels[0]] : []);
    switch (group) {
        case "baseColor":
            return outputs.baseColor ?? [];
        case "normal":
            return outputs.normal ?? [];
        case "orm":
            return [...first(outputs.occlusion), ...first(outputs.roughness), ...first(outputs.metallic)];
        case "emissive":
            return outputs.emissive ?? [];
        case "diffuse":
            return outputs.diffuse ?? [];
        default:
            return [...(outputs.specular ?? []), ...first(outputs.glossiness)];
    }
}

/**
 * The texel of a group in [0, 1], as the shaders assemble it.
 * @param outputs the resolved outputs
 * @param group the group
 * @param value the value of a logical channel
 * @returns RGBA
 * @internal
 */
export function GetNeuralV4GroupTexel(outputs: NeuralTextureOutputs, group: NeuralV4Group, value: (channel: number) => number): number[] {
    const color = (channels: number[] | undefined) => [...(channels ?? [0, 0, 0]).map(value), ...(channels?.length === 4 ? [] : [1])];
    switch (group) {
        case "normal": {
            const x = outputs.normal ? value(outputs.normal[0]) : 0.5;
            const y = outputs.normal ? value(outputs.normal[1]) : 0.5;
            return [x, y, Math.sqrt(Math.max(0, 1 - ((x * 2 - 1) ** 2 + (y * 2 - 1) ** 2))) * 0.5 + 0.5, 1];
        }
        case "orm": {
            const read = (channels: number[] | undefined) => (channels ? value(channels[0]) : 1);
            return [read(outputs.occlusion), read(outputs.roughness), read(outputs.metallic), 1];
        }
        case "specGloss":
            return [...(outputs.specular ?? [0, 0, 0]).map(value), outputs.glossiness ? value(outputs.glossiness[0]) : 1];
        case "baseColor":
            return color(outputs.baseColor);
        case "emissive":
            return color(outputs.emissive);
        default:
            return color(outputs.diffuse);
    }
}

function ToByte(value: number): number {
    return Math.round(Math.min(1, Math.max(0, value)) * 255);
}

/**
 * The RGBA8 value of a group whose channels are all constants, or null when the network is needed.
 * @param layout the payload layout
 * @param outputs the resolved outputs
 * @param group the group
 * @returns the texel or null
 * @internal
 */
export function GetNeuralV4ConstantGroup(layout: INeuralV4Layout, outputs: NeuralTextureOutputs, group: NeuralV4Group): Uint8Array | null {
    for (const index of GetNeuralV4GroupChannels(outputs, group)) {
        if (!("const" in layout.channels[index])) {
            return null;
        }
    }
    return new Uint8Array(GetNeuralV4GroupTexel(outputs, group, (n) => (layout.channels[n] as { const: number }).const).map(ToByte));
}

/**
 * Decodes mip 0 of the requested groups on the CPU, yielding between short batches of rows. The slow path of last resort.
 * @param layout the payload layout
 * @param outputs the resolved outputs
 * @param groups the groups to decode
 * @param atlases the decoded atlas images, indexed like latentTextures
 * @param network the float32 parameters
 * @param isCancelled whether the load was cancelled
 * @returns RGBA8 images
 * @internal
 */
export async function DecodeNeuralV4Async(
    layout: INeuralV4Layout,
    outputs: NeuralTextureOutputs,
    groups: NeuralV4Group[],
    atlases: INeuralV4Atlas[],
    network: INeuralV4Network,
    isCancelled: () => boolean = () => false
): Promise<Partial<Record<NeuralV4Group, Uint8Array>>> {
    const { width, height } = layout;
    const decoder = new NeuralV4Decoder(layout, atlases, network);
    const result: Partial<Record<NeuralV4Group, Uint8Array>> = {};
    for (const group of groups) {
        result[group] = new Uint8Array(width * height * 4);
    }
    const values = new Float32Array(layout.channels.length);
    let batchStart = Date.now();
    for (let j = 0; j < height; j++) {
        if (isCancelled()) {
            throw new Error("Neural texture decoding cancelled");
        }
        for (let i = 0; i < width; i++) {
            decoder.decode(0, i, j, values);
            for (const group of groups) {
                result[group]!.set(GetNeuralV4GroupTexel(outputs, group, (n) => values[n]).map(ToByte), (j * width + i) * 4);
            }
        }
        if (Date.now() - batchStart >= 12) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            batchStart = Date.now();
        }
    }
    return result;
}

function TriangleWave(t: number): number {
    return F(F(4 * Math.abs(F(t - Math.floor(t)) - 0.5)) - 1);
}

/**
 * The ±1.5 hardGELU of section 4.4.
 * @param z the pre-activation
 * @returns the activation
 */
function HardGelu(z: number): number {
    return z < -1.5 ? 0 : z > 1.5 ? z : F(F(z * F(z + 1.5)) / 3);
}
