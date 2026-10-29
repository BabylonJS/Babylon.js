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
        expect(code).toMatch(/float f_a_c\d+ = x;/);
        expect(code).toMatch(/y = f_a_c\d+;/);
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
        expect(code).not.toMatch(/g_a_c\d+/);
    });

    it("detects writes through nested subscripts and around comments", () => {
        const code = Inline(`
#define inline
float f(vec4 a, ivec2 indices, float b) {
    a[indices[0]] = 0.0;
    b /* comment */ = 1.0;
    return a.x + b;
}
void main() {
    vec4 x = vec4(1.0);
    float y = 2.0;
    gl_FragColor = vec4(f(x, ivec2(0), y));
}
`);
        expect(code).toMatch(/vec4 f_a_c\d+ = x;/);
        expect(code).toMatch(/float f_b_c\d+ = y;/);
    });

    it("copies parameters passed to out or inout arguments of other functions", () => {
        const code = Inline(`
void setValue(out float v) {
    v = 1.0;
}
#define inline
void f(float a) {
    setValue(a);
}
void main() {
    float x = 2.0;
    f(x);
    gl_FragColor = vec4(x);
}
`);
        expect(code).toMatch(/float f_a_c\d+ = x;/);
        expect(code).toMatch(/setValue\(f_a_c\d+\)/);
    });

    it("ignores assignments in comments and never copies opaque parameters", () => {
        const code = Inline(`
#define inline
vec4 readTexture(sampler2D source, vec2 uv) {
    // source = texture input
    return texture(source, uv);
}
uniform sampler2D tex;
void main() {
    gl_FragColor = readTexture(tex, vec2(0.0));
}
`);
        expect(code).not.toMatch(/sampler2D readTexture_/);
        expect(code).toMatch(/texture\(tex, vec2\(0\.0\)\)/);
    });

    it("preserves the precision qualifiers of copied parameters", () => {
        const code = Inline(`
precision mediump float;
#define inline
float f(in highp float a) {
    a *= 0.001;
    return a;
}
void main() {
    highp float x = 1000000.0;
    gl_FragColor = vec4(f(x));
}
`);
        expect(code).toMatch(/highp float f_a_c\d+ = x;/);
    });

    it("keeps copies distinct from the return values of nested calls", () => {
        const code = Inline(`
#define inline
float f_a() {
    return 1.0;
}
#define inline
float f(float a, float b) {
    a = 2.0;
    return b;
}
void main() {
    float x = 0.0;
    gl_FragColor = vec4(f(x, f_a()));
}
`);
        const copy = /float (f_a_c\d+) = x;/.exec(code);
        const inner = /float (f_a_\d+);/.exec(code);
        expect(copy).not.toBeNull();
        expect(inner).not.toBeNull();
        expect(copy![1]).not.toBe(inner![1]);
        expect(code).toMatch(new RegExp(`${copy![1]} = 2\\.0;`));
        expect(code).toMatch(new RegExp(`f_\\d+ = ${inner![1]};`));
    });
});
