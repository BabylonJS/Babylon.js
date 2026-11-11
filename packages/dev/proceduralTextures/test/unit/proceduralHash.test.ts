import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SourceDirectory = fileURLToPath(new URL("../../src/", import.meta.url));
const Shaders = ["brick", "cloud", "fire", "grass", "marble", "road", "wood"];
const HashPattern = /float mod251\(float x\) \{.*?\nfloat rand\(vec2 n\) \{.*?\n\}/s;
const HalfFloatMax = 65504;

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
});
