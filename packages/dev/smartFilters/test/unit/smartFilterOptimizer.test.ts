import {
    ConnectionPointType,
    CustomShaderBlock,
    importCustomBlockDefinition,
    InputBlock,
    SerializedShaderBlockDefinition,
    type ShaderBlock,
    SmartFilter,
    SmartFilterOptimizer,
} from "../../src/index.js";

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

const blackAndWhiteAnnotatedGlsl = `
/*
{
    "smartFilterBlockType": "BlackAndWhiteBlock",
    "namespace": "Babylon.UnitTests",
    "blockDisableStrategy": "AutoSample"
}
*/

uniform sampler2D input; // main

vec4 blackAndWhite(vec2 vUV) { // main
    vec4 color = texture2D(input, vUV);

    float luminance = dot(color.rgb, vec3(0.3, 0.59, 0.11));
    vec3 bg = vec3(luminance, luminance, luminance);

    return vec4(bg, color.a);
}
`;

const testBlockWithTexture2DSymbolAnnotatedGlsl = `
/*
{
    "smartFilterBlockType": "TestBlockWithTexture2DSymbol",
    "namespace": "Babylon.UnitTests"
}
*/
uniform float amount;
uniform sampler2D input; // main

vec4 mainFunc(vec2 vUV) { // main
    float footexture2D = 1.0;
    float temp = doStuff(texture2D(input, vUV));
    float temp2 = texture2D(input, vUV).r;
    return texture2DStuff(amount);
}
vec4 texture2DStuff(float f) {
    return vec4(f);
}
`;

describe("smartFilterOptimizer", () => {
    const testBlockWithOverloadsDefinition = importCustomBlockDefinition(testBlockWithOverloadsAnnotatedGlsl) as SerializedShaderBlockDefinition;
    const testBlackAndWhiteBlockDefinition = importCustomBlockDefinition(blackAndWhiteAnnotatedGlsl) as SerializedShaderBlockDefinition;
    const testBlockWithTexture2DSymbolDefinition = importCustomBlockDefinition(testBlockWithTexture2DSymbolAnnotatedGlsl) as SerializedShaderBlockDefinition;

    describe("when a block has multiple overloads of a helper function", () => {
        it("should emit all of them in the optimized shader block", () => {
            // Arrange
            const smartFilter = new SmartFilter("Test");

            const testBlockWithOverloads = CustomShaderBlock.Create(smartFilter, "TestBlock1", testBlockWithOverloadsDefinition);
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

            const testBlockWithOverloads1 = CustomShaderBlock.Create(smartFilter, "TestBlock1", testBlockWithOverloadsDefinition);
            const testBlockWithOverloads2 = CustomShaderBlock.Create(smartFilter, "TestBlock2", testBlockWithOverloadsDefinition);
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
        const testBlockWithOverloads1 = CustomShaderBlock.Create(smartFilter, "TestBlock1", testBlockWithOverloadsDefinition);
        const testBlockWithOverloads2 = CustomShaderBlock.Create(smartFilter, "TestBlock2", testBlockWithOverloadsDefinition);
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

    describe("when a block has a symbol that contains the string 'texture2D'", () => {
        it("should not replace the string with sampleTexture", () => {
            // Arrange
            const smartFilter = new SmartFilter("Test");

            const blackAndWhiteBlock = CustomShaderBlock.Create(smartFilter, "BlackAndWhiteBlock", testBlackAndWhiteBlockDefinition);
            const testBlock = CustomShaderBlock.Create(smartFilter, "TestBlock1", testBlockWithTexture2DSymbolDefinition);
            const amountInputBlock = new InputBlock(smartFilter, "amount", ConnectionPointType.Float, 0.5);
            const textureInputBlock = new InputBlock(smartFilter, "texture", ConnectionPointType.Texture, null);

            textureInputBlock.output.connectTo(blackAndWhiteBlock.findInput("input")!);
            blackAndWhiteBlock.output.connectTo(testBlock.findInput("input")!);
            amountInputBlock.output.connectTo(testBlock.findInput("amount")!);
            testBlock.output.connectTo(smartFilter.output);

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
            expect(fragmentShaderCode?.indexOf("float footexture2D = 1.0;")).toBeGreaterThan(-1);
            expect(fragmentShaderCode?.indexOf("float temp = doStuff( _blackAndWhite_(vUV));")).toBeGreaterThan(-1);
            expect(fragmentShaderCode?.indexOf("float temp2 =  _blackAndWhite_(vUV).r;")).toBeGreaterThan(-1);
            expect(fragmentShaderCode?.indexOf("return _texture2DStuff_(_amount_);")).toBeGreaterThan(-1);
        });
    });
});
