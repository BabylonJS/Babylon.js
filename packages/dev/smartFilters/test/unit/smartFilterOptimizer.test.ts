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
import {
    testBlockWithOverloadsAnnotatedGlsl,
    blackAndWhiteAnnotatedGlsl,
    testBlockWithTexture2DSymbolAnnotatedGlsl,
    TwoHelpersFirstBlockGlsl,
    TwoHelpersSecondBlockGlsl,
    _helper1_,
    _helper2_,
    _helper1_2_,
    _helper2_2_,
    TestHelperConsolidationBlockGlsl,
} from "./smartFilterOptimizer.testData.js";

describe("smartFilterOptimizer", () => {
    const testBlockWithOverloadsDefinition = importCustomBlockDefinition(testBlockWithOverloadsAnnotatedGlsl) as SerializedShaderBlockDefinition;
    const testBlackAndWhiteBlockDefinition = importCustomBlockDefinition(blackAndWhiteAnnotatedGlsl) as SerializedShaderBlockDefinition;
    const testBlockWithTexture2DSymbolDefinition = importCustomBlockDefinition(testBlockWithTexture2DSymbolAnnotatedGlsl) as SerializedShaderBlockDefinition;
    const testBlockWithTwoHelpers1Definition = importCustomBlockDefinition(TwoHelpersFirstBlockGlsl) as SerializedShaderBlockDefinition;
    const testBlockWithTwoHelpers2Definition = importCustomBlockDefinition(TwoHelpersSecondBlockGlsl) as SerializedShaderBlockDefinition;
    const testHelperConsolidationDefinition = importCustomBlockDefinition(TestHelperConsolidationBlockGlsl) as SerializedShaderBlockDefinition;

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
            expect((fragmentShaderCode!.match(/vec4 _getColor_\(float f\)\s*{/g) || []).length).toBe(1);
            expect((fragmentShaderCode!.match(/vec4 _getColor_\(vec3 v\)\s*{/g) || []).length).toBe(1);
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
            expect(fragmentShaderCode?.indexOf("float temp = doStuff(_blackAndWhite_(vUV));")).toBeGreaterThan(-1);
            expect(fragmentShaderCode?.indexOf("float temp2 = _blackAndWhite_(vUV).r;")).toBeGreaterThan(-1);
            expect(fragmentShaderCode?.indexOf("return _texture2DStuff_(_amount_);")).toBeGreaterThan(-1);
        });
    });

    describe("when a helper calls a helper", () => {
        it("should respect the rename during the call from one to the other", () => {
            // Arrange
            const smartFilter = new SmartFilter("Test");

            const firstBlock = CustomShaderBlock.Create(smartFilter, "FirstBlock", testBlockWithTwoHelpers1Definition);
            const secondBlock = CustomShaderBlock.Create(smartFilter, "SecondBlock", testBlockWithTwoHelpers2Definition);
            const textureInputBlock = new InputBlock(smartFilter, "texture", ConnectionPointType.Texture, null);

            textureInputBlock.output.connectTo(firstBlock.findInput("input")!);
            firstBlock.output.connectTo(secondBlock.findInput("input")!);
            secondBlock.output.connectTo(smartFilter.output);

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
            expect(containsSubstringIgnoringWhitespace(fragmentShaderCode!, _helper1_)).toBe(true);
            expect(containsSubstringIgnoringWhitespace(fragmentShaderCode!, _helper2_)).toBe(true);
            expect(containsSubstringIgnoringWhitespace(fragmentShaderCode!, _helper1_2_)).toBe(true);
            expect(containsSubstringIgnoringWhitespace(fragmentShaderCode!, _helper2_2_)).toBe(true);
        });
    });

    describe("when a block is reused", () => {
        it("should reuse helpers that don't access uniforms", () => {
            // Arrange
            const smartFilter = new SmartFilter("Test");

            const firstBlock = CustomShaderBlock.Create(smartFilter, "FirstBlock", testHelperConsolidationDefinition);
            const secondBlock = CustomShaderBlock.Create(smartFilter, "SecondBlock", testHelperConsolidationDefinition);
            const textureInputBlock = new InputBlock(smartFilter, "texture", ConnectionPointType.Texture, null);

            textureInputBlock.output.connectTo(firstBlock.findInput("input")!);
            firstBlock.output.connectTo(secondBlock.findInput("input")!);
            secondBlock.output.connectTo(smartFilter.output);

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

            // Allow optional numeric decoration like _helperNoUniformAccess_2_ before the '('
            expect(countOfRegexMatches(fragmentShaderCode!, /vec2 _helperNoUniformAccess_(?:\d+_)?\(vec2 uv\) {/g)).toBe(1);
            expect(countOfRegexMatches(fragmentShaderCode!, /vec4 _helperAccessesUniform_(?:\d+_)?\(vec2 vUV\) {/g)).toBe(2);
        });
    });
});

function containsSubstringIgnoringWhitespace(str: string, substring: string): boolean {
    const normalizedStr = str.replace(/\s+/g, " ");
    const normalizedSubstring = substring.replace(/\s+/g, " ");
    return normalizedStr.includes(normalizedSubstring);
}

function countOfRegexMatches(str: string, regex: RegExp): number {
    const matches = str.match(regex);
    return matches ? matches.length : 0;
}
