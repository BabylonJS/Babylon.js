import {
    ConnectionPointType,
    CustomShaderBlock,
    importCustomBlockDefinition,
    InputBlock,
    type ShaderBlock,
    SmartFilter,
    SmartFilterOptimizer,
} from "../../dist/index.js";

const testBlockWithOverloadsAnnotatedGlsl = `
/*  
{ 
    "smartFilterBlockType": "TestBlockWithOverloads", 
    "namespace": "Babylon.UnitTests", 
    "blockDisableStrategy": "AutoSample"
}
*/

uniform sampler2D input; // main
uniform float amount;
#define ONEDEF 1.0

vec4 greenScreen(vec2 vUV) { // main
    vec4 color = texture2D(input, vUV);
    vec4 otherColor = mix(getColor(0.0), getColor(vec3(0.0, ONEDEF, 0.0)), amount);

    return mix(color, otherColor, amount);
}

vec4 getColor(float f) {
    return vec4(f);
}

vec4 getColor(vec3 v) {
    return vec4(v, ONEDEF);
}
`;

describe("smartFilterOptimizer", () => {
    const testBlockWithOverloadsDefinition = importCustomBlockDefinition(testBlockWithOverloadsAnnotatedGlsl);
    if (testBlockWithOverloadsDefinition.format !== "shaderBlockDefinition") {
        throw new Error("Block definition format is not shaderBlockDefinition");
    }

    describe("when a block has multiple overloads of a helper function", () => {
        it("should emit all of them in the optimized shader block", () => {
            // Arrange
            const smartFilter = new SmartFilter("Test");

            const testBlockWithOverloads = CustomShaderBlock.Create(
                smartFilter,
                "TestBlock1",
                testBlockWithOverloadsDefinition
            );
            const textureInputBlock = new InputBlock(smartFilter, "texture", ConnectionPointType.Texture, null);
            const mixInputBlock = new InputBlock(smartFilter, "amount", ConnectionPointType.Float, 0.5);

            textureInputBlock.output.connectTo(testBlockWithOverloads.findInput("input")!);
            mixInputBlock.output.connectTo(testBlockWithOverloads.findInput("amount")!);
            testBlockWithOverloads.output.connectTo(smartFilter.output);

            const optimizer = new SmartFilterOptimizer(smartFilter, {
                maxSamplersInFragmentShader: 16,
                removeDisabledBlocks: false,
            });

            // Act
            const optimizedSmartFilter = optimizer.optimize();

            // Assert
            expect(optimizedSmartFilter).not.toBeNull();
            const optimizedBlock = optimizedSmartFilter!.attachedBlocks.find((b) => b.name === "optimized");
            const optimizedShaderProgram = (optimizedBlock as ShaderBlock).getShaderProgram();
            const fragmentShaderCode = optimizedShaderProgram.fragment.functions[0]?.code;
            expect(fragmentShaderCode?.indexOf("vec4 _getColor_(float f)")).toBeGreaterThan(-1);
            expect(fragmentShaderCode?.indexOf("vec4 _getColor_(vec3 v)")).toBeGreaterThan(-1);
        });
    });

    describe("when a smart filter has multiple instances of a block which has multiple overloads of a helper function", () => {
        it("should emit all of them in the optimized shader block exactly once", () => {
            // Arrange
            const smartFilter = new SmartFilter("Test");

            const testBlockWithOverloads1 = CustomShaderBlock.Create(
                smartFilter,
                "TestBlock1",
                testBlockWithOverloadsDefinition
            );
            const testBlockWithOverloads2 = CustomShaderBlock.Create(
                smartFilter,
                "TestBlock2",
                testBlockWithOverloadsDefinition
            );
            const textureInputBlock = new InputBlock(smartFilter, "texture", ConnectionPointType.Texture, null);
            const mixInputBlock = new InputBlock(smartFilter, "amount", ConnectionPointType.Float, 0.5);

            textureInputBlock.output.connectTo(testBlockWithOverloads1.findInput("input")!);
            mixInputBlock.output.connectTo(testBlockWithOverloads1.findInput("amount")!);
            mixInputBlock.output.connectTo(testBlockWithOverloads2.findInput("amount")!);
            testBlockWithOverloads1.output.connectTo(testBlockWithOverloads2.findInput("input")!);
            testBlockWithOverloads2.output.connectTo(smartFilter.output);

            const optimizer = new SmartFilterOptimizer(smartFilter, {
                maxSamplersInFragmentShader: 16,
                removeDisabledBlocks: false,
            });

            // Act
            const optimizedSmartFilter = optimizer.optimize();

            // Assert
            expect(optimizedSmartFilter).not.toBeNull();
            const optimizedBlock = optimizedSmartFilter!.attachedBlocks.find((b) => b.name === "optimized");
            const optimizedShaderProgram = (optimizedBlock as ShaderBlock).getShaderProgram();
            const fragmentShaderCode = optimizedShaderProgram.fragment.functions[0]?.code;
            expect((fragmentShaderCode!.match(/vec4 _getColor_\(float f\)/g) || []).length).toBe(1);
            expect((fragmentShaderCode!.match(/vec4 _getColor_\(vec3 v\)/g) || []).length).toBe(1);
        });
    });

    describe("when a smart filter has multiple instances of a block which has a define", () => {
        const smartFilter = new SmartFilter("Test");
        const testBlockWithOverloads1 = CustomShaderBlock.Create(
            smartFilter,
            "TestBlock1",
            testBlockWithOverloadsDefinition
        );
        const testBlockWithOverloads2 = CustomShaderBlock.Create(
            smartFilter,
            "TestBlock2",
            testBlockWithOverloadsDefinition
        );
        const textureInputBlock = new InputBlock(smartFilter, "texture", ConnectionPointType.Texture, null);
        const mixInputBlock = new InputBlock(smartFilter, "amount", ConnectionPointType.Float, 0.5);

        textureInputBlock.output.connectTo(testBlockWithOverloads1.findInput("input")!);
        mixInputBlock.output.connectTo(testBlockWithOverloads1.findInput("amount")!);
        mixInputBlock.output.connectTo(testBlockWithOverloads2.findInput("amount")!);
        testBlockWithOverloads1.output.connectTo(testBlockWithOverloads2.findInput("input")!);
        testBlockWithOverloads2.output.connectTo(smartFilter.output);

        const optimizer = new SmartFilterOptimizer(smartFilter, {
            maxSamplersInFragmentShader: 16,
            removeDisabledBlocks: false,
        });

        const optimizedSmartFilter = optimizer.optimize();
        const optimizedBlock = optimizedSmartFilter?.attachedBlocks.find((b) => b.name === "optimized");
        const optimizedShaderProgram = (optimizedBlock as ShaderBlock | undefined)?.getShaderProgram();
        const defines = optimizedShaderProgram?.fragment.defines;
        const declaration = defines?.[0];
        const newDefineName = declaration?.match(/^\S*#define\s+(\w+).*$/)?.[1];
        const optimizedFunc = optimizedShaderProgram?.fragment.functions[0];

        it("optimizes the shader program", () => {
            expect(optimizedSmartFilter).not.toBeNull();
            expect(optimizedBlock).toBeDefined();
            expect(optimizedShaderProgram).toBeDefined();
        });

        it("emits exactly one define", () => {
            expect(defines).toBeDefined();
            expect(defines).toHaveLength(1);
            expect(defines![0]).toBeDefined();
        });

        it("emits the correct define with the correct name", () => {
            expect(declaration).toBeDefined();
            expect(declaration!.indexOf("ONEDEF")).toBeGreaterThan(-1);
            expect(newDefineName).toBeDefined();
            expect(newDefineName).toContain("ONEDEF");
        });

        it("does not reference the undecorated define name in the optimized function", () => {
            expect(optimizedFunc).toBeDefined();
            expect(optimizedFunc?.code).toBeDefined();
            const functionsWithBareONEDEF = optimizedFunc!.code.match(new RegExp("\\bONEDEF\\b"));
            expect(functionsWithBareONEDEF).toBeNull();
        });

        it("references the decorated define name in the optimized function twice", () => {
            const firstInstance = optimizedFunc!.code.indexOf(newDefineName!);
            expect(firstInstance).toBeGreaterThan(-1);
            const secondInstance = optimizedFunc!.code.lastIndexOf(newDefineName!);
            expect(secondInstance).toBeGreaterThan(firstInstance);
        });
    });
});
