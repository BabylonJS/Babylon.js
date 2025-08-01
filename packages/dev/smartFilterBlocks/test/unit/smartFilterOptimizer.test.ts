/* eslint-disable no-console */

import { ShaderBlock, SmartFilterOptimizer } from "smart-filters";
import { singleBlockTestCase } from "./optimizerTestCases/singleBlock.js";
import { OptimizationTestCase } from "./testCases.js";

describe("smartFilterOptimizer", () => {
    describe("verify generated optimized shader blocks match expected output", () => {
        const testCases: OptimizationTestCase[] = [singleBlockTestCase];

        testCases.forEach((testCase) =>
            it(`${testCase.name}`, () => {
                const smartFilter = testCase.smartFilterFactory();
                const optimizer = new SmartFilterOptimizer(smartFilter);
                const optimizedSmartFilter = optimizer.optimize()!;

                const shaderBlocks = optimizedSmartFilter.attachedBlocks.filter((b) => b instanceof ShaderBlock) as ShaderBlock[];
                for (let i = 0; i < shaderBlocks.length; i++) {
                    const shaderBlock = shaderBlocks[i];
                    let expectedShaderProgram = testCase.expectedOptimizedBlocks[i];

                    expect(expectedShaderProgram).toBeDefined();

                    expectedShaderProgram = JSON.stringify(JSON.parse(expectedShaderProgram));

                    const shaderProgram = JSON.stringify(shaderBlock.getShaderProgram());
                    if (shaderProgram !== expectedShaderProgram) {
                        console.log(`Actual shader program:\n\n*******\n${shaderProgram}\n*******`);
                    }
                    expect(shaderProgram).toEqual(expectedShaderProgram);
                }
            })
        );
    });
});
