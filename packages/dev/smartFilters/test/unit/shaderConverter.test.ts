import { parseFragmentShader } from "../../dist/utils/buildTools/shaderConverter.js";

const decorator = "_";
function decorated(name: string) {
    return `${decorator}${name}${decorator}`;
}

const annotatedFragment = `
#define FOO (3. + 20.)
#define BAR(x) (x * 2.0)
uniform sampler2D input; // main
uniform bool flag;
// { "default": 1.0 }
uniform float intensity;

vec4 apply(vec2 vUV){ // main
    if (flag) {
        for (int i = 0; i < 10; i++) 
        {
            if (i > 5) {vUV += double(vUV);}
        }
    }
    vec4 color = texture2D(input, vUV);
    return color * double(intensity);
}
#define BAZ

float double(float value) { return value * 2.0; }

vec2 double(vec2 value) 
{ 
    return vec2(double(value.x), double(value.y)); 
}

`;

describe("parseFragmentShader", () => {
    const result = parseFragmentShader(annotatedFragment);

    describe("uniform parsing", () => {
        it("identifies all uniforms", () => {
            const uniformNames = result.uniforms.map((u) => u.name);
            expect(uniformNames).toContain("input");
            expect(uniformNames).toContain("flag");
            expect(uniformNames).toContain("intensity");
            expect(uniformNames.length).toBe(3);
        });

        it("decorates uniform names with underscores", () => {
            for (const uniform of result.uniforms) {
                expect(result.shaderCode.uniform?.includes(decorated(uniform.name))).toBeTruthy();
            }
        });

        it("detects the main input", () => {
            expect(result.shaderCode.mainInputTexture).toBe(decorated("input"));
        });

        it("parses uniform metadata", () => {
            const intensityUniform = result.uniforms.find((u) => u.name === "intensity");
            const flagUniform = result.uniforms.find((u) => u.name === "flag");
            expect(flagUniform?.properties).toBeUndefined();
            expect(intensityUniform?.properties?.default).toBe(1.0);
        });
    });

    describe("function parsing", () => {
        it("wraps function names with decorator", () => {
            for (const fn of result.shaderCode.functions) {
                expect(fn.name[0]).toBe(decorator);
                expect(fn.name[fn.name.length - 1]).toBe(decorator);
            }
        });

        it("identifies main function", () => {
            expect(result.shaderCode.mainFunctionName).toBe(decorated("apply"));
        });

        it("identifies all functions", () => {
            const functionNames = result.shaderCode.functions.map((f) => f.name);
            expect(functionNames).toContain(decorated("apply"));
            expect(functionNames).toContain(decorated("double"));
            // Ensure there are two double functions
            expect(result.shaderCode.functions.length).toBe(3);
            expect(functionNames.indexOf(decorated("double"))).toBeLessThan(
                functionNames.lastIndexOf(decorated("double"))
            );
        });

        it("extracts function parameters", () => {
            const namesToParams = [
                [decorated("apply"), "vec2 vUV"],
                [decorated("double"), "float value"],
                [decorated("double"), "vec2 value"],
            ];
            for (const [name, params] of namesToParams) {
                const fn = result.shaderCode.functions.find((f) => f.name === name && f.params === params);
                expect(fn).toBeDefined();
            }
        });

        it("decorates all nested function calls", () => {
            // Ensure no raw function names are present in the shader code
            for (const name of ["apply", "double"]) {
                const rawSymbolRegex = new RegExp(`\\b${name}\\b`, "g");
                for (const fn of result.shaderCode.functions) {
                    expect(fn.code).not.toMatch(rawSymbolRegex);
                }
            }
        });
    });

    describe("define parsing", () => {
        it("captures #define tokens", () => {
            expect(result.shaderCode.defines?.every((define) => define.includes("#define"))).toBeTruthy();
        });

        it("identifies all define names", () => {
            const defineNames = ["FOO", "BAR", "BAZ"];
            for (const name of defineNames) {
                expect(result.shaderCode.defines?.some((define) => define.includes(decorated(name)))).toBeTruthy();
            }
        });
    });

    describe("error handling", () => {
        it("throws when no main function is defined", () => {
            const noMainFunction = annotatedFragment.replace("apply(vec2 vUV){ // main", "apply(vec2 vUV) {");
            expect(() => parseFragmentShader(noMainFunction)).toThrow();
        });

        it("throws if more than one main function is defined", () => {
            const twoMainFunctions = annotatedFragment + "\nvec4 apply2(vec2 vUV) { // main return vec4(0.0); }";
            expect(() => parseFragmentShader(twoMainFunctions)).toThrow();
        });
    });
});
