import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SourceDirectory = fileURLToPath(new URL("../../src/", import.meta.url));
const Shaders = ["brick", "cloud", "fire", "grass", "marble", "road", "wood"];
const HashPattern = /float mod251\(float x\) \{.*?\nfloat rand\(vec2 n\) \{.*?\n\}/s;
const HalfFloatMax = 65504;
const Period = 251;

function Mod(x: number): number {
    return ((x % Period) + Period) % Period;
}

function Gcd(a: number, b: number): number {
    return b ? Gcd(b, a % b) : a;
}

// In-place 2D DFT over one lattice period (251 is prime, so no FFT); sign is -1 forward and 1 inverse (unscaled).
function Dft2(re: Float64Array, im: Float64Array, sign: number) {
    const cos = Float64Array.from({ length: Period }, (_, k) => Math.cos((2 * Math.PI * k) / Period));
    const sin = Float64Array.from({ length: Period }, (_, k) => sign * Math.sin((2 * Math.PI * k) / Period));
    const lineRe = new Float64Array(Period);
    const lineIm = new Float64Array(Period);
    for (const [stride, step] of [
        [Period, 1],
        [1, Period],
    ]) {
        for (let line = 0; line < Period; line++) {
            for (let k = 0; k < Period; k++) {
                let sumRe = 0;
                let sumIm = 0;
                for (let n = 0, t = 0; n < Period; n++, t = t + k >= Period ? t + k - Period : t + k) {
                    const i = line * stride + n * step;
                    sumRe += re[i] * cos[t] - im[i] * sin[t];
                    sumIm += im[i] * cos[t] + re[i] * sin[t];
                }
                lineRe[k] = sumRe;
                lineIm[k] = sumIm;
            }
            for (let k = 0; k < Period; k++) {
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

// Every hash intermediate is an integer below 2^24, so evaluating the GLSL in double precision matches float32 on the GPU.
// Every product is passed straight to mod251, so tracking its largest argument bounds the intermediates.
function CompileHash(glsl: string) {
    const js = glsl
        .replace(/float (\w+)\(float x\) \{/g, "function $1(x) {")
        .replace(/float rand\(vec2 n\) \{/, "function rand(n) {")
        .replace(/\bfloat (\w+) =/g, "let $1 =")
        .replace(/\bfloor\(/g, "Math.floor(")
        .replace("function mod251(x) {", "function mod251(x) { stats.max = Math.max(stats.max, Math.abs(x));");
    const stats = { max: 0 };
    const rand = new Function("stats", `${js}\nreturn rand;`)(stats) as (n: { x: number; y: number }) => number;
    return { rand, stats };
}

describe("Procedural textures hash", () => {
    const glsl = ReadHash("grass");

    it.each(Shaders)("%s uses the shared hash", (name) => {
        expect(ReadHash(name)).toBe(glsl);
    });

    // Grass hashes floor(gl_FragCoord.xy * scale) for these scales; 512px is the size of the grass texture in the samples.
    it.each([1, 4, 8, 16])("has no shift correlation and stays in half-float range for grass inputs at scale %i", (scale) => {
        const { rand, stats } = CompileHash(glsl);
        const size = 512;
        const values = new Float64Array(size * size);
        let mean = 0;
        let min = Infinity;
        let max = -Infinity;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const value = rand({ x: (x + 0.5) * scale, y: (y + 0.5) * scale });
                values[y * size + x] = value;
                mean += value;
                min = Math.min(min, value);
                max = Math.max(max, value);
            }
        }
        mean /= values.length;
        let variance = 0;
        for (const value of values) {
            variance += (value - mean) ** 2;
        }
        variance /= values.length;

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

        expect(min).toBeGreaterThanOrEqual(0);
        expect(max).toBeLessThan(1);
        expect(worst.correlation, `shift (${worst.dx}, ${worst.dy})`).toBeLessThan(0.05);
        expect(stats.max).toBeLessThan(HalfFloatMax);
    });

    const { rand, stats } = CompileHash(glsl);
    // Values over one period of the lattice, centered so sums of products are covariances.
    const values = new Float64Array(Period * Period);
    for (let y = 0; y < Period; y++) {
        for (let x = 0; x < Period; x++) {
            values[y * Period + x] = rand({ x, y });
        }
    }
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    values.forEach((value, i) => (values[i] = value - mean));
    const variance = values.reduce((sum, value) => sum + value * value, 0) / values.length;

    // A random table peaks near 0.027 here; the previous hash had 1.0 at (x, y) -> (y + 101, x - 101).
    it("has no correlation under any lattice translation, reflection or rotation", () => {
        const re = Float64Array.from(values);
        const im = new Float64Array(values.length);
        Dft2(re, im, -1);
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
            for (let ky = 0; ky < Period; ky++) {
                for (let kx = 0; kx < Period; kx++) {
                    const k = ky * Period + kx;
                    const m = Mod(c * ky + a * kx) + Period * Mod(d * ky + b * kx);
                    cre[k] = re[m] * re[k] + im[m] * im[k];
                    cim[k] = re[m] * im[k] - im[m] * re[k];
                }
            }
            Dft2(cre, cim, 1);
            const identity = a === 1 && d === 1;
            for (let o = identity ? 1 : 0; o < values.length; o++) {
                const correlation = Math.abs(cre[o] / values.length / values.length / variance);
                if (correlation > worst.correlation) {
                    worst = { correlation, map: `${a},${b},${c},${d}`, ox: o % Period, oy: Math.floor(o / Period) };
                }
            }
        }
        expect(worst.correlation, `map (${worst.map}) offset (${worst.ox}, ${worst.oy})`).toBeLessThan(0.05);
    });

    // A random table bottoms out near 0.8 of the overall variance; the previous hash was constant along x + y = 150.
    it("varies along every lattice line", () => {
        let worst = { ratio: Infinity, dx: 0, dy: 0, x: 0, y: 0 };
        for (let dy = 0; dy <= 4; dy++) {
            for (let dx = -4; dx <= 4; dx++) {
                if ((dy === 0 && dx <= 0) || Gcd(Math.abs(dx), dy) !== 1) {
                    continue;
                }
                const seen = new Uint8Array(values.length);
                for (let start = 0; start < values.length; start++) {
                    if (seen[start]) {
                        continue;
                    }
                    let x = start % Period;
                    let y = Math.floor(start / Period);
                    let sum = 0;
                    let sumSquares = 0;
                    for (let i = 0; i < Period; i++) {
                        const value = values[y * Period + x];
                        seen[y * Period + x] = 1;
                        sum += value;
                        sumSquares += value * value;
                        x = Mod(x + dx);
                        y = Mod(y + dy);
                    }
                    const ratio = (sumSquares / Period - (sum / Period) ** 2) / variance;
                    if (ratio < worst.ratio) {
                        worst = { ratio, dx, dy, x: start % Period, y: Math.floor(start / Period) };
                    }
                }
            }
        }
        expect(worst.ratio, `direction (${worst.dx}, ${worst.dy}) through (${worst.x}, ${worst.y})`).toBeGreaterThan(0.5);
        expect(stats.max).toBeLessThan(HalfFloatMax);
    });
});
