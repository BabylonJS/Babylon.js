import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { type NeuralTextureOutputs } from "./BABYLON_materials_neural_texture.types";
import { GetNeuralV4RowOffsets, type INeuralV4Layout } from "./neuralTextureV4";

/*
 * GLSL ES 3.0 and WGSL generator of the babylon-ntc-v4 decode, specialised for one payload: every size, bit layout and activation is a literal.
 * Sources: arXiv 2305.17105 sections 4.1 to 4.4 and 5.3 (software filtering, stochastic texture filtering); ours.
 */

/** Filtering of the runtime (decodeInShader) mode. */
export type NeuralTextureRuntimeFilter = "bilinear" | "nearest" | "trilinear" | "stochastic";

/** The shader pieces of the runtime decode. @internal */
export interface INeuralV4RuntimeShader {
    /** Declarations and functions, for CUSTOM_FRAGMENT_DEFINITIONS. */
    definitions: string;
    /** Statements that evaluate the texel at the variable `uv` into the neural* group variables. */
    main: string;
    /** Statements for the very start of the fragment main (uniform control flow, for the derivatives). */
    mainBegin: string;
    /** GLSL precision statements for the declarations that follow. */
    preamble: string;
}

const GlslPrecision = "precision highp int;\nprecision highp sampler2D;\n";

function Lit(value: number): string {
    return Number.isInteger(value) ? value.toFixed(1) : String(value);
}

interface ILanguage {
    wgsl: boolean;
    float: string;
    int: string;
    uint: string;
    vec2: string;
    vec3: string;
    vec4: string;
    ivec2: string;
    uvec4: string;
    texture: string;
    params: string;
    decl: (type: string, name: string, value?: string) => string;
    toFloat: (expression: string) => string;
    toInt: (expression: string) => string;
    toUint: (expression: string) => string;
    shr: (value: string | number, amount: string | number) => string;
    forLoop: (variable: string, count: string) => string;
}

function GetLanguage(shaderLanguage: ShaderLanguage): ILanguage {
    if (shaderLanguage === ShaderLanguage.WGSL) {
        return {
            wgsl: true,
            float: "f32",
            int: "i32",
            uint: "u32",
            vec2: "vec2f",
            vec3: "vec3f",
            vec4: "vec4f",
            ivec2: "vec2i",
            uvec4: "vec4u",
            texture: "texture_2d<f32>",
            params: "uniforms.neuralParams",
            decl: (type, name, value) => `var ${name}: ${type}${value === undefined ? "" : ` = ${value}`};`,
            toFloat: (e) => `f32(${e})`,
            toInt: (e) => `i32(${e})`,
            toUint: (e) => `u32(${e})`,
            shr: (value, amount) => `(${value} >> u32(${amount}))`,
            forLoop: (variable, count) => `for (var ${variable}: i32 = 0; ${variable} < ${count}; ${variable}++)`,
        };
    }
    return {
        wgsl: false,
        float: "float",
        int: "int",
        uint: "uint",
        vec2: "vec2",
        vec3: "vec3",
        vec4: "vec4",
        ivec2: "ivec2",
        uvec4: "uvec4",
        texture: "sampler2D",
        params: "neuralParams",
        decl: (type, name, value) => `${type} ${name}${value === undefined ? "" : ` = ${value}`};`,
        toFloat: (e) => `float(${e})`,
        toInt: (e) => `int(${e})`,
        toUint: (e) => `uint(${e})`,
        shr: (value, amount) => `(${value} >> ${amount})`,
        forLoop: (variable, count) => `for (int ${variable} = 0; ${variable} < ${count}; ${variable}++)`,
    };
}

/**
 * Number of vec4 that hold the network outputs.
 * @param layout the payload layout
 * @returns the count
 * @internal
 */
export function GetNeuralV4NetVec4Count(layout: INeuralV4Layout): number {
    return Math.max(1, Math.ceil(layout.netOutputs / 4));
}

/**
 * Number of latent samplers (neuralLatent0...): the images of grid 0, then those of grid 1.
 * @param layout the payload layout
 * @returns the count
 * @internal
 */
export function GetNeuralV4LatentSamplerCount(layout: INeuralV4Layout): number {
    return layout.grids[0].textures.length + layout.grids[1].textures.length;
}

/**
 * Textures (in the shader order) as indices into layout-independent latentTextures.
 * @param layout the payload layout
 * @returns the texture indices
 * @internal
 */
export function GetNeuralV4LatentTextureOrder(layout: INeuralV4Layout): number[] {
    return [...layout.grids[0].textures, ...layout.grids[1].textures];
}

/**
 * Declarations and neuralDecodeTexel(m, i, j), which writes the activated network outputs to the global array neuralNet.
 * Uniform neuralParams (a vec4) is declared by the caller and neuralParams.w must be 0: it keeps compilers from unrolling the network loops.
 * @param layout the payload layout
 * @param lang the language description
 * @returns the shader source
 */
function GetDecodeSource(layout: INeuralV4Layout, lang: ILanguage): string {
    const wgsl = lang.wgsl;
    const [g0, g1] = layout.grids;
    const out: string[] = [];
    const net4 = GetNeuralV4NetVec4Count(layout);
    const in4 = layout.layers[0].inStride / 4;
    const rows = GetNeuralV4RowOffsets(layout.layers);
    const levels = layout.levels;
    const textureCount = GetNeuralV4LatentSamplerCount(layout);

    for (let i = 0; i < textureCount; i++) {
        out.push(wgsl ? `var neuralLatent${i}: ${lang.texture};\nvar neuralLatent${i}Sampler: sampler;` : `uniform sampler2D neuralLatent${i};`);
    }
    out.push(wgsl ? `var neuralWeightTex: ${lang.texture};\nvar neuralWeightTexSampler: sampler;` : "uniform sampler2D neuralWeightTex;");
    out.push(wgsl ? `var<private> neuralNet: array<vec4f, ${net4}>;` : `vec4 neuralNet[${net4}];`);
    out.push(
        wgsl
            ? `fn neuralBytes(source: texture_2d<f32>, p: vec2i) -> vec4u { return vec4u(textureLoad(source, p, 0) * 255.0 + vec4f(0.5)); }
fn neuralTriC(t: f32) -> f32 { return 4.0 * abs(t - floor(t) - 0.5) - 1.0; }
fn neuralHardGelu(z: f32) -> f32 { if (z < -1.5) { return 0.0; } if (z > 1.5) { return z; } return z * (z + 1.5) / 3.0; }
fn neuralHardGelu4(z: vec4f) -> vec4f { return vec4f(neuralHardGelu(z.x), neuralHardGelu(z.y), neuralHardGelu(z.z), neuralHardGelu(z.w)); }`
            : `uvec4 neuralBytes(sampler2D source, ivec2 p) { return uvec4(texelFetch(source, p, 0) * 255.0 + vec4(0.5)); }
float neuralTriC(float t) { return 4.0 * abs(t - floor(t) - 0.5) - 1.0; }
float neuralHardGelu(float z) { if (z < -1.5) { return 0.0; } if (z > 1.5) { return z; } return z * (z + 1.5) / 3.0; }
vec4 neuralHardGelu4(vec4 z) { return vec4(neuralHardGelu(z.x), neuralHardGelu(z.y), neuralHardGelu(z.z), neuralHardGelu(z.w)); }`
    );

    // Atlas position of a cell: wrap inside the level (one step suffices), then add the level origin.
    for (let g = 0; g < 2; g++) {
        const grid = layout.grids[g];
        let originY = "";
        for (let lv = 2; lv < levels; lv++) {
            let sum = 0;
            for (let k = 1; k < lv; k++) {
                sum += grid.height >> (2 * k);
            }
            originY += `if (lv == ${lv}) { oy = ${sum}; }\n    `;
        }
        out.push(
            wgsl
                ? `fn neuralAtlas${g}(lv: i32, cell: vec2i) -> vec2i {
    let w = ${lang.shr(grid.width, "2 * lv")};
    let h = ${lang.shr(grid.height, "2 * lv")};
    var c = cell;
    if (c.x < 0) { c.x += w; } else if (c.x >= w) { c.x -= w; }
    if (c.y < 0) { c.y += h; } else if (c.y >= h) { c.y -= h; }
    var oy = 0;
    ${originY}return vec2i(select(${grid.width}, 0, lv == 0), oy) + c;
}`
                : `ivec2 neuralAtlas${g}(int lv, ivec2 cell) {
    int w = ${lang.shr(grid.width, "2 * lv")};
    int h = ${lang.shr(grid.height, "2 * lv")};
    ivec2 c = cell;
    if (c.x < 0) { c.x += w; } else if (c.x >= w) { c.x -= w; }
    if (c.y < 0) { c.y += h; } else if (c.y >= h) { c.y -= h; }
    int oy = 0;
    ${originY}return ivec2(lv == 0 ? 0 : ${grid.width}, oy) + c;
}`
        );
    }

    const b: string[] = [];
    const d = lang.decl;
    // Latent value of channel c of a cell whose bytes are in images prefix0, prefix1...
    const latent = (prefix: string, grid: INeuralV4Layout["grids"][0], c: number) => {
        const bit = c * grid.bits;
        const byte = bit >> 3;
        const shift = 8 - grid.bits - (bit & 7);
        const q = lang.toFloat(`(${prefix}${byte >> 2}.${"xyzw"[byte & 3]} >> ${shift}u) & ${(1 << grid.bits) - 1}u`);
        return `((${q} - ${Lit(2 ** (grid.bits - 1) - 1)}) * ${Lit(1 / 2 ** grid.bits)})`;
    };
    const slot = (g: number, image: number) => (g === 0 ? 0 : g0.textures.length) + image;
    const store = (index: number, value: string) => b.push(`x[${index >> 2}].${"xyzw"[index & 3]} = ${value};`);

    b.push(d(lang.int, "lv", `min(${levels - 1}, max(0, (m >> 1) - 1))`));
    b.push(d(lang.int, "wm", `max(1, ${lang.shr(layout.width, "m")})`));
    b.push(d(lang.int, "hm", `max(1, ${lang.shr(layout.height, "m")})`));
    b.push(d(lang.float, "fi", `${lang.toFloat("i")} + 0.5`));
    b.push(d(lang.float, "fj", `${lang.toFloat("j")} + 0.5`));
    if (wgsl) {
        b.push(`var x: array<vec4f, ${in4}>;`);
    } else {
        b.push(`vec4 x[${in4}];`);
        b.push(`for (int q = 0; q < ${in4}; q++) { x[q] = vec4(0.0); }`);
    }
    let index = 0;
    // G0: four raw taps.
    b.push(d(lang.int, "w0", lang.shr(g0.width, "2 * lv")));
    b.push(d(lang.int, "h0", lang.shr(g0.height, "2 * lv")));
    b.push(d(lang.float, "gx0", `fi * (${lang.toFloat("w0")} / ${lang.toFloat("wm")}) - 0.5`));
    b.push(d(lang.float, "gy0", `fj * (${lang.toFloat("h0")} / ${lang.toFloat("hm")}) - 0.5`));
    b.push(d(lang.int, "cx0", lang.toInt("floor(gx0)")));
    b.push(d(lang.int, "cy0", lang.toInt("floor(gy0)")));
    for (let t = 0; t < 4; t++) {
        b.push(d(lang.ivec2, `pa${t}`, `neuralAtlas0(lv, ${lang.ivec2}(cx0 + ${t & 1}, cy0 + ${t >> 1}))`));
        for (let image = 0; image < g0.textures.length; image++) {
            b.push(d(lang.uvec4, `a${t}_${image}`, `neuralBytes(neuralLatent${slot(0, image)}, pa${t})`));
        }
        for (let c = 0; c < g0.channels; c++) {
            store(index++, latent(`a${t}_`, g0, c));
        }
    }
    // G1: bilinear.
    b.push(d(lang.int, "w1", lang.shr(g1.width, "2 * lv")));
    b.push(d(lang.int, "h1", lang.shr(g1.height, "2 * lv")));
    b.push(d(lang.float, "gx1", `fi * (${lang.toFloat("w1")} / ${lang.toFloat("wm")}) - 0.5`));
    b.push(d(lang.float, "gy1", `fj * (${lang.toFloat("h1")} / ${lang.toFloat("hm")}) - 0.5`));
    b.push(d(lang.int, "cx1", lang.toInt("floor(gx1)")));
    b.push(d(lang.int, "cy1", lang.toInt("floor(gy1)")));
    b.push(d(lang.float, "fx", `gx1 - ${lang.toFloat("cx1")}`));
    b.push(d(lang.float, "fy", `gy1 - ${lang.toFloat("cy1")}`));
    for (let t = 0; t < 4; t++) {
        b.push(d(lang.ivec2, `pb${t}`, `neuralAtlas1(lv, ${lang.ivec2}(cx1 + ${t & 1}, cy1 + ${t >> 1}))`));
        for (let image = 0; image < g1.textures.length; image++) {
            b.push(d(lang.uvec4, `b${t}_${image}`, `neuralBytes(neuralLatent${slot(1, image)}, pb${t})`));
        }
    }
    for (let c = 0; c < g1.channels; c++) {
        const [a, bb, dd, e] = [0, 1, 2, 3].map((t) => latent(`b${t}_`, g1, c));
        store(index++, `(1.0 - fy) * ((1.0 - fx) * ${a} + fx * ${bb}) + fy * ((1.0 - fx) * ${dd} + fx * ${e})`);
    }
    // Triangle positional encoding on the integer texel indices of the mip.
    for (const p of ["i", "j"]) {
        for (const period of [8, 4, 2]) {
            const t = `${lang.toFloat(p)} / ${Lit(period)}`;
            store(index++, `neuralTriC(${t})`);
            store(index++, `neuralTriC(${t} - 0.25)`);
        }
    }
    store(index, `${lang.toFloat("m")} / ${Lit(Math.max(1, layout.mipCount - 1))}`);

    if (layout.netOutputs > 0) {
        const groups = [16, 16, Math.ceil(layout.netOutputs / 4)];
        b.push(d(lang.int, "z", lang.toInt(`${lang.params}.w`)));
        b.push(wgsl ? `var hid0: array<vec4f, 16>;\nvar hid1: array<vec4f, 16>;\nvar y2: array<vec4f, ${groups[2]}>;` : `vec4 hid0[16];\nvec4 hid1[16];\nvec4 y2[${groups[2]}];`);
        const layerInputs = ["x", "hid0", "hid1"];
        const layerOutputs = ["hid0", "hid1", "y2"];
        const inVec4 = [in4, 16, 16];
        for (let l = 0; l < 3; l++) {
            const weight = (k: string, row: string) => (wgsl ? `textureLoad(neuralWeightTex, vec2i(${k}, ${row}), 0)` : `texelFetch(neuralWeightTex, ivec2(${k}, ${row}), 0)`);
            b.push(`${lang.forLoop("g", `${groups[l]} + z`)} {`);
            b.push(d(lang.int, "r", `${rows[l]} + g * 4`));
            b.push(d(lang.vec4, "acc", `${lang.vec4}(0.0)`));
            b.push(`${lang.forLoop("k", `${inVec4[l]} + z`)} {`);
            b.push(d(lang.vec4, "xv", `${layerInputs[l]}[k]`));
            for (let c = 0; c < 4; c++) {
                b.push(`acc.${"xyzw"[c]} += dot(${weight("k", c ? `r + ${c}` : "r")}, xv);`);
            }
            b.push("}");
            const bias = [0, 1, 2, 3].map((c) => `${weight(String(inVec4[l]), c ? `r + ${c}` : "r")}.x`).join(", ");
            b.push(`acc += ${lang.vec4}(${bias});`);
            b.push(`${layerOutputs[l]}[g] = ${l < 2 ? "neuralHardGelu4(acc)" : "acc"};`);
            b.push("}");
        }
        layout.channels.forEach((channel) => {
            if ("net" in channel) {
                const y = `y2[${channel.net >> 2}].${"xyzw"[channel.net & 3]}`;
                b.push(`neuralNet[${channel.net >> 2}].${"xyzw"[channel.net & 3]} = ${channel.activation === "sigmoid" ? `1.0 / (1.0 + exp(-${y}))` : `clamp(${y}, 0.0, 1.0)`};`);
            }
        });
    }
    out.push(wgsl ? `fn neuralDecodeTexel(m: i32, i: i32, j: i32) {\n${b.join("\n")}\n}` : `void neuralDecodeTexel(int m, int i, int j) {\n${b.join("\n")}\n}`);
    return out.join("\n");
}

/**
 * The decode functions for the bake: declarations and neuralDecodeTexel.
 * @param layout the payload layout
 * @param shaderLanguage the language
 * @returns the shader source
 * @internal
 */
export function GetNeuralV4DecodeShader(layout: INeuralV4Layout, shaderLanguage: ShaderLanguage): string {
    return GetDecodeSource(layout, GetLanguage(shaderLanguage));
}

/** Material group variable that the decode creates, in the order of the plugin texel structure. @internal */
export const NeuralV4Groups = ["baseColor", "normal", "orm", "emissive", "diffuse", "specGloss"] as const;

/**
 * Statements that build the neuralBaseColor, neuralNormal, neuralORM and the optional neuralEmissive, neuralDiffuse, neuralSpecGloss
 * variables from the global neuralNet array.
 * @param layout the payload layout
 * @param outputs the resolved (explicit channel indices) outputs
 * @param shaderLanguage the language
 * @returns the statements
 * @internal
 */
export function GetNeuralV4GroupsCode(layout: INeuralV4Layout, outputs: NeuralTextureOutputs, shaderLanguage: ShaderLanguage): string {
    const lang = GetLanguage(shaderLanguage);
    const channel = (n: number) => {
        const c = layout.channels[n];
        return "const" in c ? Lit(c.const) : `neuralNet[${c.net >> 2}].${"xyzw"[c.net & 3]}`;
    };
    const color = (channels: number[] | undefined, fallback: string) =>
        channels ? `${lang.vec4}(${channels.map(channel).join(", ")}${channels.length === 3 ? ", 1.0" : ""})` : `${lang.vec4}(${fallback})`;
    const lines: string[] = [];
    lines.push(lang.decl(lang.vec4, "neuralBaseColor", color(outputs.baseColor, "1.0")));
    lines.push(lang.decl(lang.vec4, "neuralNormal", `${lang.vec4}(${outputs.normal?.map(channel).join(", ") ?? "0.5, 0.5"}, 0.0, 1.0)`));
    lines.push(`neuralNormal.z = sqrt(max(0.0, 1.0 - dot(neuralNormal.xy * 2.0 - ${lang.vec2}(1.0), neuralNormal.xy * 2.0 - ${lang.vec2}(1.0)))) * 0.5 + 0.5;`);
    lines.push(
        lang.decl(
            lang.vec4,
            "neuralORM",
            `${lang.vec4}(${outputs.occlusion ? channel(outputs.occlusion[0]) : "1.0"}, ${outputs.roughness ? channel(outputs.roughness[0]) : "1.0"}, ${outputs.metallic ? channel(outputs.metallic[0]) : "1.0"}, 1.0)`
        )
    );
    if (outputs.emissive) {
        lines.push(lang.decl(lang.vec4, "neuralEmissive", color(outputs.emissive, "0.0, 0.0, 0.0, 1.0")));
    }
    if (outputs.diffuse) {
        lines.push(lang.decl(lang.vec4, "neuralDiffuse", color(outputs.diffuse, "1.0")));
    }
    if (outputs.specular) {
        lines.push(
            lang.decl(lang.vec4, "neuralSpecGloss", `${lang.vec4}(${outputs.specular.map(channel).join(", ")}, ${outputs.glossiness ? channel(outputs.glossiness[0]) : "1.0"})`)
        );
    }
    return lines.join("\n");
}

/**
 * The per-fragment decode with software filtering. Filtering the encoded values (not the decoded linear ones) matches how the bake and the
 * regular sRGB textures behave. Uniform neuralParams = (frame, lodBias, forceMip or -1, 0).
 * @param layout the payload layout
 * @param outputs the resolved outputs
 * @param shaderLanguage the language
 * @param filter the filtering mode
 * @returns the shader pieces
 * @internal
 */
export function GetNeuralV4RuntimeShader(
    layout: INeuralV4Layout,
    outputs: NeuralTextureOutputs,
    shaderLanguage: ShaderLanguage,
    filter: NeuralTextureRuntimeFilter
): INeuralV4RuntimeShader {
    const lang = GetLanguage(shaderLanguage);
    const wgsl = lang.wgsl;
    const net4 = GetNeuralV4NetVec4Count(layout);
    const maxMip = layout.mipCount - 1;
    const p = lang.params;
    const zero = lang.toInt(`${p}.w`);
    const d: string[] = [GetDecodeSource(layout, lang)];
    const mipSize = (axis: "width" | "height") => `max(1, ${lang.shr(layout[axis], "m")})`;

    d.push(wgsl ? `var<private> neuralAcc: array<vec4f, ${net4}>;` : `vec4 neuralAcc[${net4}];`);
    d.push(wgsl ? "var<private> neuralLodValue: f32 = 0.0;\nvar<private> neuralFragCoord: vec2f = vec2f(0.0);" : "float neuralLodValue = 0.0;\nvec2 neuralFragCoord = vec2(0.0);");
    d.push(
        wgsl
            ? `fn neuralWrap(c: i32, n: i32) -> i32 { if (c < 0) { return c + n; } if (c >= n) { return c - n; } return c; }
fn neuralComputeLod(uv: vec2f) -> f32 {
    let p = uv * vec2f(${Lit(layout.width)}, ${Lit(layout.height)});
    let dx = dpdx(p);
    let dy = dpdy(p);
    let lod = 0.5 * log2(max(max(dot(dx, dx), dot(dy, dy)), 1e-8)) + ${p}.y;
    return clamp(lod, 0.0, ${Lit(maxMip)});
}
fn neuralRandom3() -> vec3f {
    var v = vec3u(u32(neuralFragCoord.x), u32(neuralFragCoord.y), u32(${p}.x));
    v = v * 1664525u + vec3u(1013904223u);
    v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
    v ^= v >> vec3u(16u);
    v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
    return vec3f(v >> vec3u(8u)) * (1.0 / 16777216.0);
}`
            : `int neuralWrap(int c, int n) { if (c < 0) { return c + n; } if (c >= n) { return c - n; } return c; }
float neuralComputeLod(vec2 uv) {
    vec2 p = uv * vec2(${Lit(layout.width)}, ${Lit(layout.height)});
    vec2 dx = dFdx(p);
    vec2 dy = dFdy(p);
    float lod = 0.5 * log2(max(max(dot(dx, dx), dot(dy, dy)), 1e-8)) + ${p}.y;
    return clamp(lod, 0.0, ${Lit(maxMip)});
}
vec3 neuralRandom3() {
    uvec3 v = uvec3(uint(neuralFragCoord.x), uint(neuralFragCoord.y), uint(${p}.x));
    v = v * 1664525u + uvec3(1013904223u);
    v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
    v ^= v >> 16u;
    v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
    return vec3(v >> 8u) * (1.0 / 16777216.0);
}`
    );
    const clearAcc = `${lang.forLoop("q", String(net4))} { neuralAcc[q] = ${lang.vec4}(0.0); }`;
    const copyAcc = `${lang.forLoop("q", String(net4))} { neuralNet[q] = neuralAcc[q]; }`;
    // Mip choice shared by all filters. A forced mip (the debug/golden path) overrides the derivative LOD.
    const lodExpression = `select(neuralLodValue, min(${p}.z, ${Lit(maxMip)}), ${p}.z >= 0.0)`;
    if (wgsl) {
        d.push(`fn neuralAddBilinear(m: i32, f: vec2f, weight: f32) {
    let wm = ${mipSize("width")};
    let hm = ${mipSize("height")};
    let p = f * vec2f(f32(wm), f32(hm)) - vec2f(0.5);
    let fl = floor(p);
    let t = p - fl;
    let cx = i32(fl.x);
    let cy = i32(fl.y);
    let z = i32(${p}.w);
    for (var s: i32 = 0; s < 4 + z; s++) {
        let dx = s & 1;
        let dy = s >> 1u;
        let wgt = weight * select(t.x, 1.0 - t.x, dx == 0) * select(t.y, 1.0 - t.y, dy == 0);
        neuralDecodeTexel(m, neuralWrap(cx + dx, wm), neuralWrap(cy + dy, hm));
        for (var q: i32 = 0; q < ${net4}; q++) { neuralAcc[q] += wgt * neuralNet[q]; }
    }
}`);
    } else {
        d.push(`void neuralAddBilinear(int m, vec2 f, float weight) {
    int wm = ${mipSize("width")};
    int hm = ${mipSize("height")};
    vec2 p = f * vec2(float(wm), float(hm)) - vec2(0.5);
    vec2 fl = floor(p);
    vec2 t = p - fl;
    int cx = int(fl.x);
    int cy = int(fl.y);
    int z = int(${p}.w);
    for (int s = 0; s < 4 + z; s++) {
        int dx = s & 1;
        int dy = s >> 1;
        float wgt = weight * (dx == 0 ? 1.0 - t.x : t.x) * (dy == 0 ? 1.0 - t.y : t.y);
        neuralDecodeTexel(m, neuralWrap(cx + dx, wm), neuralWrap(cy + dy, hm));
        for (int q = 0; q < ${net4}; q++) { neuralAcc[q] += wgt * neuralNet[q]; }
    }
}`);
    }
    let body: string;
    const lod = wgsl ? `let lod = ${lodExpression};` : `float lod = ${p}.z >= 0.0 ? min(${p}.z, ${Lit(maxMip)}) : neuralLodValue;`;
    const mipLet = (name: string, value: string) => (wgsl ? `let ${name} = ${value};` : `int ${name} = ${value};`);
    const sizeLets = (wmName: string, hmName: string, m: string) =>
        wgsl
            ? `let ${wmName} = max(1, ${lang.shr(layout.width, m)}); let ${hmName} = max(1, ${lang.shr(layout.height, m)});`
            : `int ${wmName} = max(1, ${layout.width} >> ${m}); int ${hmName} = max(1, ${layout.height} >> ${m});`;
    switch (filter) {
        case "nearest":
            body = `${mipLet("m", `clamp(${lang.toInt("floor(lod + 0.5)")}, 0, ${maxMip})`)}
    ${sizeLets("wm", "hm", "m")}
    neuralDecodeTexel(m, min(${lang.toInt(`f.x * ${lang.toFloat("wm")}`)}, wm - 1), min(${lang.toInt(`f.y * ${lang.toFloat("hm")}`)}, hm - 1));`;
            break;
        case "stochastic":
            body = `${wgsl ? "let xi = neuralRandom3();" : "vec3 xi = neuralRandom3();"}
    ${mipLet("m", `clamp(${lang.toInt("floor(lod + xi.x)")}, 0, ${maxMip})`)}
    ${sizeLets("wm", "hm", "m")}
    ${wgsl ? "let q" : "vec2 q"} = f * ${lang.vec2}(${lang.toFloat("wm")}, ${lang.toFloat("hm")}) - ${lang.vec2}(0.5) + xi.yz;
    neuralDecodeTexel(m, neuralWrap(${lang.toInt("floor(q.x)")}, wm), neuralWrap(${lang.toInt("floor(q.y)")}, hm));`;
            break;
        case "trilinear":
            body = `${mipLet("m0", `clamp(${lang.toInt("floor(lod)")}, 0, ${maxMip})`)}
    ${wgsl ? "let tt" : "float tt"} = lod - ${lang.toFloat("m0")};
    ${clearAcc}
    ${lang.forLoop("s", `2 + ${zero}`)} {
        neuralAddBilinear(min(m0 + s, ${maxMip}), f, ${wgsl ? "select(tt, 1.0 - tt, s == 0)" : "s == 0 ? 1.0 - tt : tt"});
    }
    ${copyAcc}`;
            break;
        default:
            body = `${mipLet("m", `clamp(${lang.toInt("floor(lod + 0.5)")}, 0, ${maxMip})`)}
    ${clearAcc}
    neuralAddBilinear(m, f, 1.0);
    ${copyAcc}`;
    }
    d.push(
        wgsl
            ? `fn neuralFilter(uv: vec2f) {
    let f = fract(uv);
    ${lod}
    ${body}
}`
            : `void neuralFilter(vec2 uv) {
    vec2 f = fract(uv);
    ${lod}
    ${body}
}`
    );
    return {
        definitions: d.join("\n"),
        preamble: wgsl ? "" : GlslPrecision,
        main: `neuralFilter(uv);\n${GetNeuralV4GroupsCode(layout, outputs, shaderLanguage)}\n`,
        mainBegin: wgsl
            ? "neuralFragCoord = fragmentInputs.position.xy;\nneuralLodValue = neuralComputeLod(fragmentInputs.vMainUV1);"
            : "neuralFragCoord = gl_FragCoord.xy;\nneuralLodValue = neuralComputeLod(vMainUV1);",
    };
}

/**
 * The fragment shader of the load-time bake. Uniform neuralBake = (mip, output group index, 0, 0); the texel is the fragment position.
 * @param layout the payload layout
 * @param outputs the resolved outputs
 * @param shaderLanguage the language
 * @param groups the baked groups: the group variable and the output index that selects it
 * @returns the complete pixel shader
 * @internal
 */
export function GetNeuralV4BakeShader(
    layout: INeuralV4Layout,
    outputs: NeuralTextureOutputs,
    shaderLanguage: ShaderLanguage,
    groups: Array<[variable: string, index: number]>
): string {
    const lang = GetLanguage(shaderLanguage);
    const wgsl = lang.wgsl;
    let selector = groups[groups.length - 1][0];
    for (let i = groups.length - 2; i >= 0; i--) {
        const [variable, index] = groups[i];
        selector = wgsl ? `select(${selector}, ${variable}, i32(uniforms.neuralBake.y) == ${index})` : `int(neuralBake.y) == ${index} ? ${variable} : (${selector})`;
    }
    const decode = GetDecodeSource(layout, lang);
    const groupsCode = GetNeuralV4GroupsCode(layout, outputs, shaderLanguage);
    if (wgsl) {
        return `uniform neuralParams: vec4f;
uniform neuralBake: vec4f;
${decode}
@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {
    neuralDecodeTexel(i32(uniforms.neuralBake.x), i32(fragmentInputs.position.x), i32(fragmentInputs.position.y));
    ${groupsCode}
    fragmentOutputs.color = ${selector};
}`;
    }
    return `precision highp float;
${GlslPrecision}uniform vec4 neuralParams;
uniform vec4 neuralBake;
${decode}
void main() {
    neuralDecodeTexel(int(neuralBake.x), int(gl_FragCoord.x), int(gl_FragCoord.y));
    ${groupsCode}
    gl_FragColor = ${selector};
}`;
}
