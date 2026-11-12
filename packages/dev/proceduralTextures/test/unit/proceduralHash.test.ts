import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SourceDirectory = fileURLToPath(new URL("../../src/", import.meta.url));
const Shaders = ["brick", "cloud", "fire", "grass", "marble", "road", "wood"];
const HashPattern = /#ifdef GL_FRAGMENT_PRECISION_HIGH\n.*?\n#endif/s;
const Modulus = 4001;
// Integers up to 2^24 are exact in float32.
const ExactLimit = 2 ** 24;
// The whole-period DFT check runs on the same polynomial with this smaller prime modulus (4001^2 cells is too slow here).
const ModelModulus = 251;
// Lattice coordinate scales: grass hashes gl_FragCoord.xy * {1, 4, 8, 16} and its fbm doubles the last up to 128.
const Scales = [1, 4, 8, 16, 32, 64, 128];

function Mod(x: number, m: number): number {
    return ((x % m) + m) % m;
}

function Gcd(a: number, b: number): number {
    return b ? Gcd(b, a % b) : a;
}

// Float32 reciprocal of m, moved by `ulps` units in the last place.
function Reciprocal32(m: number, ulps: number): number {
    const bits = new Uint32Array(new Float32Array([1 / m]).buffer);
    bits[0] += ulps;
    return new Float32Array(bits.buffer)[0];
}

// In-place 2D DFT over one lattice period of prime size n (no FFT); sign is -1 forward and 1 inverse (unscaled).
function Dft2(re: Float64Array, im: Float64Array, n: number, sign: number) {
    const cos = Float64Array.from({ length: n }, (_, k) => Math.cos((2 * Math.PI * k) / n));
    const sin = Float64Array.from({ length: n }, (_, k) => sign * Math.sin((2 * Math.PI * k) / n));
    const lineRe = new Float64Array(n);
    const lineIm = new Float64Array(n);
    for (const [stride, step] of [
        [n, 1],
        [1, n],
    ]) {
        for (let line = 0; line < n; line++) {
            for (let k = 0; k < n; k++) {
                let sumRe = 0;
                let sumIm = 0;
                for (let j = 0, t = 0; j < n; j++, t = t + k >= n ? t + k - n : t + k) {
                    const i = line * stride + j * step;
                    sumRe += re[i] * cos[t] - im[i] * sin[t];
                    sumIm += im[i] * cos[t] + re[i] * sin[t];
                }
                lineRe[k] = sumRe;
                lineIm[k] = sumIm;
            }
            for (let k = 0; k < n; k++) {
                re[line * stride + k * step] = lineRe[k];
                im[line * stride + k * step] = lineIm[k];
            }
        }
    }
}

function ReadHash(name: string): string {
    const source = readFileSync(join(SourceDirectory, name, `${name}ProceduralTexture.fragment.fx`), "utf8").replace(/\r\n/g, "\n");
    const match = HashPattern.exec(source);
    expect(match, `${name} hash`).not.toBeNull();
    return match![0];
}

interface IHashStats {
    max: number;
    nonIntegers: number;
}

// Translates the highp branch of the hash to JS. `quotient(x)` stands in for the shader's floor(x * (1.0 / m)), so tests can
// vary how the reciprocal and product round; everything else is integer arithmetic that double precision evaluates exactly
// as long as it stays below 2^24, which `stats` tracks through the argument of every reduction (every product is reduced).
function CompileHash(glsl: string, modulus = Modulus, quotient: (x: number) => number = (x) => Math.floor(x / modulus)) {
    const highp = glsl.slice(glsl.indexOf("\n") + 1, glsl.indexOf("#else"));
    const js = highp
        .replace(/^\/\/.*\n/gm, "")
        .replace(/\bhighp /g, "")
        .replace(
            /float mod4001\(float x\) \{\n\treturn x - floor\(x \* \(1\.0 \/ 4001\.0\)\) \* 4001\.0;/,
            "function mod4001(x) {\n\trecord(x);\n\treturn x - quotient(x) * 4001.0;"
        )
        .replace(/float (\w+)\(float x\) \{/g, "function $1(x) {")
        .replace(/float rand\(vec2 n\) \{/, "function rand(n) {")
        .replace(/\bfloat (\w+) =/g, "let $1 =")
        .replace(/\bfloor\(/g, "Math.floor(")
        .replace(/4001/g, String(modulus));
    expect(js, "reduction").toContain("record(x)");
    const stats: IHashStats = { max: 0, nonIntegers: 0 };
    const record = (x: number) => {
        stats.max = Math.max(stats.max, Math.abs(x));
        stats.nonIntegers += Number.isInteger(x) ? 0 : 1;
    };
    const rand = new Function("record", "quotient", `${js}\nreturn rand;`)(record, quotient) as (n: { x: number; y: number }) => number;
    return { rand, stats };
}

// Hash of the lattice cell holding pixel (x, y) at a coordinate scale, as the shaders compute it from gl_FragCoord.
function Cell(scale: number, x: number, y: number) {
    return { x: (x + 0.5) * scale, y: (y + 0.5) * scale };
}

describe("Procedural textures hash", () => {
    const glsl = ReadHash("grass");

    it.each(Shaders)("%s uses the shared hash", (name) => {
        expect(ReadHash(name)).toBe(glsl);
    });

    // A floor that lands one off only moves an intermediate by the modulus, which the final canonicalization removes, so the
    // result must not depend on how 1 / m or x * (1 / m) round.
    it.each(Scales)("is exact and independent of rounding for lattice coordinates at scale %i", (scale) => {
        const reference = CompileHash(glsl);
        const variants = [-1, 0, 1].map((ulps) => {
            const reciprocal = Reciprocal32(Modulus, ulps);
            return CompileHash(glsl, Modulus, (x) => Math.floor(Math.fround(x * reciprocal)));
        });
        const size = 512;
        let min = Infinity;
        let max = -Infinity;
        let mismatch: { x: number; y: number } | undefined;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Cover a 4096px texture: the last rows and columns are sampled too.
                const cell = Cell(scale, x * 8 + (y & 7), y * 8 + (x & 7));
                const value = reference.rand(cell);
                min = Math.min(min, value);
                max = Math.max(max, value);
                if (variants.some((variant) => variant.rand(cell) !== value)) {
                    mismatch ??= cell;
                }
            }
        }
        expect(mismatch, "cell whose result depends on rounding").toBeUndefined();
        expect(min).toBeGreaterThanOrEqual(0);
        expect(max).toBeLessThan(1);
        for (const { stats } of [reference, ...variants]) {
            expect(stats.nonIntegers).toBe(0);
            expect(stats.max).toBeLessThan(ExactLimit);
        }
    });

    // Grass and road hash per pixel, so a repeat shorter than the texture would show as tiles.
    it.each([1, 4, 8, 16, 128])("does not repeat within 4001 pixels at scale %i", (scale) => {
        const { rand } = CompileHash(glsl);
        const window = 256;
        const rows = 16;
        const length = window + Modulus;
        for (const axis of ["x", "y"]) {
            const values = new Float64Array(rows * length);
            for (let row = 0; row < rows; row++) {
                for (let i = 0; i < length; i++) {
                    values[row * length + i] = axis === "x" ? rand(Cell(scale, i, row)) : rand(Cell(scale, row, i));
                }
            }
            const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
            const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
            const correlation = (shift: number) => {
                let sum = 0;
                for (let row = 0; row < rows; row++) {
                    for (let i = 0; i < window; i++) {
                        sum += (values[row * length + i] - mean) * (values[row * length + i + shift] - mean);
                    }
                }
                return sum / (rows * window) / variance;
            };
            let worst = { correlation: 0, shift: 0 };
            for (let shift = 1; shift < Modulus; shift++) {
                const value = Math.abs(correlation(shift));
                if (value > worst.correlation) {
                    worst = { correlation: value, shift };
                }
            }
            // 4096 samples per shift put the noise floor near 0.07 over 4000 shifts; a repeat correlates at 1.
            expect(worst.correlation, `${axis} shift ${worst.shift}`).toBeLessThan(0.15);
            // The check would catch it: the hash does repeat after the full period.
            expect(values.subarray(Modulus, Modulus + window)).toEqual(values.subarray(0, window));
        }
    });

    it.each([1, 4, 8, 16])("has no short-range correlation for grass inputs at scale %i", (scale) => {
        const { rand } = CompileHash(glsl);
        const size = 512;
        const values = new Float64Array(size * size);
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                values[y * size + x] = rand(Cell(scale, x, y));
            }
        }
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

        const margin = 40;
        let worst = { correlation: 0, dx: 0, dy: 0 };
        for (let d = 1; d <= margin; d++) {
            for (const [dx, dy] of [
                [d, 0],
                [0, d],
                [d, d],
                [d, -d],
            ]) {
                let sum = 0;
                let count = 0;
                for (let y = margin; y < size - margin; y++) {
                    for (let x = margin; x < size - margin; x++) {
                        sum += (values[y * size + x] - mean) * (values[(y + dy) * size + x + dx] - mean);
                        count++;
                    }
                }
                const correlation = Math.abs(sum / count / variance);
                if (correlation > worst.correlation) {
                    worst = { correlation, dx, dy };
                }
            }
        }
        expect(worst.correlation, `shift (${worst.dx}, ${worst.dy})`).toBeLessThan(0.05);
    });

    // A random table bottoms out near 0.9 of the overall variance here; a hash that cancels a coordinate along some line
    // (as x + y + 101 = 0 (mod 251) did for an earlier version) gives 0.
    // The whole 4001x4001 period takes about 2 s alone, more under a parallel CI run, so allow it more than the default timeout.
    it("varies along every lattice line over the whole period", { timeout: 60_000 }, () => {
        const { rand } = CompileHash(glsl);
        const values = new Float32Array(Modulus * Modulus);
        let sum = 0;
        let sumSquares = 0;
        for (let y = 0; y < Modulus; y++) {
            for (let x = 0; x < Modulus; x++) {
                const value = rand({ x, y });
                values[y * Modulus + x] = value;
                sum += value;
                sumSquares += value * value;
            }
        }
        const variance = sumSquares / values.length - (sum / values.length) ** 2;
        let worst = { ratio: Infinity, dx: 0, dy: 0, line: 0 };
        const lineSum = new Float64Array(Modulus);
        const lineSquares = new Float64Array(Modulus);
        for (let dy = 0; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                if ((dy === 0 && dx <= 0) || Gcd(Math.abs(dx), dy) !== 1) {
                    continue;
                }
                // Points on one line in direction (dx, dy) share dy * x - dx * y (mod m).
                lineSum.fill(0);
                lineSquares.fill(0);
                for (let y = 0; y < Modulus; y++) {
                    let line = Mod(-dx * y, Modulus);
                    const step = Mod(dy, Modulus);
                    for (let x = 0; x < Modulus; x++, line = line + step >= Modulus ? line + step - Modulus : line + step) {
                        const value = values[y * Modulus + x];
                        lineSum[line] += value;
                        lineSquares[line] += value * value;
                    }
                }
                for (let line = 0; line < Modulus; line++) {
                    const ratio = (lineSquares[line] / Modulus - (lineSum[line] / Modulus) ** 2) / variance;
                    if (ratio < worst.ratio) {
                        worst = { ratio, dx, dy, line };
                    }
                }
            }
        }
        expect(worst.ratio, `direction (${worst.dx}, ${worst.dy}), line ${worst.line}`).toBeGreaterThan(0.5);
    });

    // Lattice symmetries of a polynomial hash such as (x, y) -> (y + 101, x - 101) for an earlier version hold over any prime
    // field, so they show up in the same polynomial modulo 251, whose whole period is small enough for a DFT. A random table
    // peaks near 0.027 here; that earlier version had 1.0.
    it("has no correlation under any lattice translation, reflection or rotation", () => {
        const m = ModelModulus;
        const { rand } = CompileHash(glsl, m);
        const values = new Float64Array(m * m);
        for (let y = 0; y < m; y++) {
            for (let x = 0; x < m; x++) {
                values[y * m + x] = rand({ x, y });
            }
        }
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        values.forEach((value, i) => (values[i] = value - mean));
        const variance = values.reduce((sum, value) => sum + value * value, 0) / values.length;

        const re = Float64Array.from(values);
        const im = new Float64Array(values.length);
        Dft2(re, im, m, -1);
        let worst = { correlation: 0, map: "", ox: 0, oy: 0 };
        for (const [a, b, c, d] of [
            [1, 0, 0, 1],
            [-1, 0, 0, 1],
            [1, 0, 0, -1],
            [-1, 0, 0, -1],
            [0, 1, 1, 0],
            [0, -1, 1, 0],
            [0, 1, -1, 0],
            [0, -1, -1, 0],
        ]) {
            // sum_p v(p) v(Mp + o) for every offset o. With u(q) = v(M^-1 q), U(k) = V(M^T k), and the sum is the
            // inverse transform of conj(U) V.
            const cre = new Float64Array(values.length);
            const cim = new Float64Array(values.length);
            for (let ky = 0; ky < m; ky++) {
                for (let kx = 0; kx < m; kx++) {
                    const k = ky * m + kx;
                    const j = Mod(c * ky + a * kx, m) + m * Mod(d * ky + b * kx, m);
                    cre[k] = re[j] * re[k] + im[j] * im[k];
                    cim[k] = re[j] * im[k] - im[j] * re[k];
                }
            }
            Dft2(cre, cim, m, 1);
            const identity = a === 1 && d === 1;
            for (let o = identity ? 1 : 0; o < values.length; o++) {
                const correlation = Math.abs(cre[o] / values.length / values.length / variance);
                if (correlation > worst.correlation) {
                    worst = { correlation, map: `${a},${b},${c},${d}`, ox: o % m, oy: Math.floor(o / m) };
                }
            }
        }
        expect(worst.correlation, `map (${worst.map}) offset (${worst.ox}, ${worst.oy})`).toBeLessThan(0.05);
    });
});
