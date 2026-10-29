import { describe, it, expect } from "vitest";
import { ShaderCodeInliner } from "core/Engines/Processors/shaderCodeInliner";

function Inline(source: string): string {
    const inliner = new ShaderCodeInliner(source);
    inliner.inlineToken = "#define inline";
    inliner.processCode();
    return inliner.code;
}

describe("ShaderCodeInliner", () => {
    it("does not write to the caller's variable when the inlined function assigns a by-value parameter", () => {
        const code = Inline(`
#define inline
void f(in float a, float b, out float c) {
    a = b;
    c = a;
}
void main() {
    float x = 1.0;
    float y;
    f(x, 2.0, y);
    gl_FragColor = vec4(x, y, 0.0, 1.0);
}
`);
        expect(code).not.toMatch(/(?<![\w.])x\s*=\s*2\.0/);
        expect(code).toMatch(/float f_a_\d+ = x;/);
        expect(code).toMatch(/y = f_a_\d+;/);
    });

    it("does not copy parameters that are only read", () => {
        const code = Inline(`
#define inline
float g(float a) {
    return a * 2.0;
}
void main() {
    float x = 1.0;
    gl_FragColor = vec4(g(x));
}
`);
        expect(code).not.toMatch(/g_a_\d+/);
    });
});
