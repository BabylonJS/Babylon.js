/* eslint-disable jest/no-conditional-expect */
import { Logger } from "../../src";
import { SmartFilter } from "../../src/smartFilter.js";
import { ImportCustomBlockDefinition } from "../../src/serialization/importCustomBlockDefinition.js";
import { CustomShaderBlock } from "../../src/blockFoundation/customShaderBlock.js";
import { SerializedShaderBlockDefinitionV1 } from "../../src/serialization/v1/shaderBlockSerialization.types";
import { IPropertyDescriptionForEdition, PropertyTypeForEdition } from "../../src/editorUtils/editableInPropertyPage.js";

const glslValidFloatDefaultValue = `
// { "smartFilterBlockType": "TestBlock", "namespace": "Bug.Repro" }
// { "default" : 42.0 }
uniform float testFloat;
vec4 test(vec2 vUV) { // main
    return vec4(vUV, testFloat, 1.);
}`;

const glslInvalidFloatDefaultValue = `
// { "smartFilterBlockType": "TestBlock", "namespace": "Bug.Repro" }
// { "default" : false }
uniform float testFloat;
vec4 test(vec2 vUV) { // main
    return vec4(vUV, testFloat, 1.);
}`;

const glslValidBoolDefaultValue = `
// { "smartFilterBlockType": "TestBlock", "namespace": "Bug.Repro" }
// { "default" : true }
uniform bool testBool;
vec4 test(vec2 vUV) { // main
    return vec4(vUV, 1., 1.);
}`;

const glslInvalidBoolDefaultValue = `
// { "smartFilterBlockType": "TestBlock", "namespace": "Bug.Repro" }
// { "default" : 2.0 }
uniform bool testBool;
vec4 test(vec2 vUV) { // main
    return vec4(vUV, 1., 1.);
}`;

const glslValidColor3DefaultValue = `
// { "smartFilterBlockType": "TestBlock", "namespace": "Bug.Repro" }
// { "default" : { "r": 1.0, "g": 2.0, "b": 3.0 } }
uniform vec3 testColor3;
vec4 test(vec2 vUV) { // main
    return vec4(vUV, 1., 1.);
}`;

const glslInvalidColor3DefaultValue = `
// { "smartFilterBlockType": "TestBlock", "namespace": "Bug.Repro" }
// { "default" : true }
uniform vec3 testColor3;
vec4 test(vec2 vUV) { // main
    return vec4(vUV, 1., 1.);
}`;

const glslValidColor4DefaultValue = `
// { "smartFilterBlockType": "TestBlock", "namespace": "Bug.Repro" }
// { "default" : { "r": 1.0, "g": 2.0, "b": 3.0, "a": 4.0 } }
uniform vec4 testColor4;
vec4 test(vec2 vUV) { // main
    return vec4(vUV, 1., 1.);
}`;

const glslInvalidColor4DefaultValue = `
// { "smartFilterBlockType": "TestBlock", "namespace": "Bug.Repro" }
// { "default" : true }
uniform vec4 testColor4;
vec4 test(vec2 vUV) { // main
    return vec4(vUV, 1., 1.);
}`;

const glslValidVector2DefaultValue = `
// { "smartFilterBlockType": "TestBlock", "namespace": "Bug.Repro" }
// { "default" : { "x": 1.0, "y": 2.0 } }
uniform vec2 testVector2;
vec4 test(vec2 vUV) { // main
    return vec4(vUV, 1., 1.);
}`;

const glslInvalidVector2DefaultValue = `
// { "smartFilterBlockType": "TestBlock", "namespace": "Bug.Repro" }
// { "default" : true }
uniform vec2 testVector2;
vec4 test(vec2 vUV) { // main
    return vec4(vUV, 1., 1.);
}`;

const glslConstPropertyNoOptions = `
// { "smartFilterBlockType": "TestBlock", "namespace": "Bug.Repro" }

// { "property" : true }
const float cp = 1;

const float notCp = 2;

vec4 test(vec2 vUV) { // main
    return vec4(cp, notCp, 1., 1.);
}`;

const glslConstPropertyWithOptions = `
// { "smartFilterBlockType": "TestBlock", "namespace": "Bug.Repro" }

// { "property" : { "options": { "zero": 0, "half": 0.5, "full": 1 } } }
const float cp = 1;

const float notCp = 2;

vec4 test(vec2 vUV) { // main
    return vec4(cp, notCp, 1., 1.);
}`;

describe("CustomShaderBlock", () => {
    const smartFilter = new SmartFilter("TestSmartFilter");
    const warnFn = jest.fn();
    const errorFn = jest.fn();

    beforeAll(() => {
        Logger.Warn = warnFn;
        Logger.Error = errorFn;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Default Value Parsing", () => {
        [
            {
                description: "When invalid Float default value is provided",
                glsl: glslInvalidFloatDefaultValue,
                expectedWarning: 'Invalid default value. Block Type: "TestBlock" Connection Point: "testFloat"',
            },
            {
                description: "When valid Float default value is provided",
                glsl: glslValidFloatDefaultValue,
                expectedWarning: undefined,
            },
            {
                description: "When invalid Bool default value is provided",
                glsl: glslInvalidBoolDefaultValue,
                expectedWarning: 'Invalid default value. Block Type: "TestBlock" Connection Point: "testBool"',
            },
            {
                description: "When valid Bool default value is provided",
                glsl: glslValidBoolDefaultValue,
                expectedWarning: undefined,
            },
            {
                description: "When invalid Color3 default value is provided",
                glsl: glslInvalidColor3DefaultValue,
                expectedWarning: 'Invalid default value. Block Type: "TestBlock" Connection Point: "testColor3"',
            },
            {
                description: "When valid Color3 default value is provided",
                glsl: glslValidColor3DefaultValue,
                expectedWarning: undefined,
            },
            {
                description: "When invalid Color4 default value is provided",
                glsl: glslInvalidColor4DefaultValue,
                expectedWarning: 'Invalid default value. Block Type: "TestBlock" Connection Point: "testColor4"',
            },
            {
                description: "When valid Color4 default value is provided",
                glsl: glslValidColor4DefaultValue,
                expectedWarning: undefined,
            },
            {
                description: "When invalid Vector2 default value is provided",
                glsl: glslInvalidVector2DefaultValue,
                expectedWarning: 'Invalid default value. Block Type: "TestBlock" Connection Point: "testVector2"',
            },
            {
                description: "When valid Vector2 default value is provided",
                glsl: glslValidVector2DefaultValue,
                expectedWarning: undefined,
            },
        ].forEach((testCase) => {
            it(`${testCase.description}`, () => {
                const blockDefinition = ImportCustomBlockDefinition(testCase.glsl) as SerializedShaderBlockDefinitionV1;
                CustomShaderBlock.Create(smartFilter, "TestBlock", blockDefinition);
                if (testCase.expectedWarning) {
                    expect(warnFn).toHaveBeenCalledWith(testCase.expectedWarning);
                } else {
                    expect(warnFn).not.toHaveBeenCalled();
                }
                expect(errorFn).not.toHaveBeenCalled();
            });
        });

        it("Should handle default float values of 0 as a valid default value", () => {
            const glslDefinition = `// { "smartFilterBlockType": "TestBlock", "namespace": "Bug.Repro" }
// { "default" : 0.0 }
uniform float testFloat;
vec4 test(vec2 vUV) { // main
    return vec4(vUV, testFloat, 1.);
}`;
            const blockDefinition = ImportCustomBlockDefinition(glslDefinition) as SerializedShaderBlockDefinitionV1;
            const customShaderBlock = CustomShaderBlock.Create(smartFilter, "TestBlock", blockDefinition);
            expect(customShaderBlock.inputs.length).toBe(1);
            expect(customShaderBlock.inputs[0].name).toBe("testFloat");
            expect(customShaderBlock.inputs[0].defaultRuntimeData).not.toBeNull();
            expect(customShaderBlock.inputs[0].defaultRuntimeData?.value).toBe(0);
        });

        it("Should handle default bool values of false as a valid default value", () => {
            const glslDefinition = `// { "smartFilterBlockType": "TestBlock", "namespace": "Bug.Repro" }
// { "default" : false }
uniform bool testBool;
vec4 test(vec2 vUV) { // main
    if (testBool) {
        return vec4(vUV, 1.0, 1.);
         } else {
        return vec4(vUV, 2.0, 1.);
    }
}`;
            const blockDefinition = ImportCustomBlockDefinition(glslDefinition) as SerializedShaderBlockDefinitionV1;
            const customShaderBlock = CustomShaderBlock.Create(smartFilter, "TestBlock", blockDefinition);
            expect(customShaderBlock.inputs.length).toBe(1);
            expect(customShaderBlock.inputs[0].name).toBe("testBool");
            expect(customShaderBlock.inputs[0].defaultRuntimeData).not.toBeNull();
            expect(customShaderBlock.inputs[0].defaultRuntimeData?.value).toBe(false);
        });
    });

    describe("Const Properties", () => {
        it("When a const is marked with property=true it should be parsed a const property", () => {
            // Arrange
            const blockDefinition = ImportCustomBlockDefinition(glslConstPropertyNoOptions) as SerializedShaderBlockDefinitionV1;

            // Act
            const customShaderBlock = CustomShaderBlock.Create(smartFilter, "TestBlock", blockDefinition);

            // Assert
            expect((customShaderBlock as any)["cp"]).toBe(1);
            expect((customShaderBlock as any)["notCp"]).not.toBeDefined();
        });

        it("When a const is marked with property={ options: ... } it should be parsed a const property with the right options annotation", () => {
            // Arrange
            const blockDefinition = ImportCustomBlockDefinition(glslConstPropertyWithOptions) as SerializedShaderBlockDefinitionV1;

            // Act
            const customShaderBlock = CustomShaderBlock.Create(smartFilter, "TestBlock", blockDefinition);

            // Assert
            expect((customShaderBlock as any)._propStore as IPropertyDescriptionForEdition[]).toContainEqual({
                propertyName: "cp",
                displayName: "cp",
                type: PropertyTypeForEdition.List,
                groupName: "PROPERTIES",
                options: {
                    blockType: "TestBlock",
                    notifiers: {
                        rebuild: true,
                    },
                    options: [
                        { label: "zero", value: 0 },
                        { label: "half", value: 0.5 },
                        { label: "full", value: 1 },
                    ],
                },
                className: "CustomShaderBlock",
            });
        });

        it("When a const property is changed it should affect the code returned by getShaderProgram()", () => {
            // Arrange
            const blockDefinition = ImportCustomBlockDefinition(glslConstPropertyNoOptions) as SerializedShaderBlockDefinitionV1;
            const customShaderBlock = CustomShaderBlock.Create(smartFilter, "TestBlock", blockDefinition);

            // Act
            (customShaderBlock as any)["cp"] = 2;

            // Assert
            const shaderProgram = customShaderBlock.getShaderProgram();
            expect(shaderProgram.fragment.constPerInstance).toEqual("const float _cp_ = 2.;\n");
        });

        it("When a const property is changed it should not affect the code generated by other instances of the block type", () => {
            // Arrange
            const blockDefinition = ImportCustomBlockDefinition(glslConstPropertyNoOptions) as SerializedShaderBlockDefinitionV1;
            const customShaderBlock1 = CustomShaderBlock.Create(smartFilter, "TestBlock", blockDefinition);
            const customShaderBlock2 = CustomShaderBlock.Create(smartFilter, "TestBlock", blockDefinition);

            // Act
            (customShaderBlock2 as any)["cp"] = 2;
            const shaderProgram1 = customShaderBlock1.getShaderProgram();
            const shaderProgram2 = customShaderBlock2.getShaderProgram();

            // Assert
            expect(shaderProgram1.fragment.constPerInstance).toEqual("const float _cp_ = 1.;\n");
            expect(shaderProgram2.fragment.constPerInstance).toEqual("const float _cp_ = 2.;\n");
        });
    });
});
