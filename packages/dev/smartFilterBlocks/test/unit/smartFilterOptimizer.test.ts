import { BaseBlock, ISerializedBlockV1, ShaderBlock, SmartFilter, SmartFilterDeserializer, SmartFilterOptimizer } from "smart-filters";
import { ThinEngine } from "core/Engines/thinEngine.js";
import { Nullable } from "core/types.js";
import { builtInBlockRegistrations } from "../../src/index.js";

import { testCases } from "./smartFilterOptimizerTestCases.js";

/**
 * See the comment in `smartFilterOptimizerTestCases.ts` for instructions on how to add new test cases.
 */

describe("smartFilterOptimizer", () => {
    describe("verify generated optimized shader blocks match expected output", () => {
        const smartFilterDeserializer = new SmartFilterDeserializer(
            async (smartFilter: SmartFilter, engine: ThinEngine, serializedBlock: ISerializedBlockV1, smartFilterDeserializer: SmartFilterDeserializer) => {
                return await blockFactory(smartFilter, engine, serializedBlock, smartFilterDeserializer);
            }
        );

        testCases.forEach((testCase) =>
            it(`${testCase.name}`, async () => {
                // Arrange
                const smartFilter = await smartFilterDeserializer.deserialize({} as ThinEngine, testCase.serializedSmartFilter);
                const optimizer = new SmartFilterOptimizer(smartFilter);

                // Act
                const optimizedSmartFilter = optimizer.optimize()!;

                // Assert
                const shaderBlocks = optimizedSmartFilter.attachedBlocks.filter((b) => b instanceof ShaderBlock) as ShaderBlock[];
                for (let i = 0; i < shaderBlocks.length; i++) {
                    const shaderBlock = shaderBlocks[i];
                    const expectedShaderProgram = testCase.expectedOptimizedBlocks[i];

                    expect(expectedShaderProgram).toBeDefined();

                    const expectedShaderProgramSerialized = JSON.stringify(expectedShaderProgram).replace(/\\n/g, "").replace(/\s/g, "");

                    const shaderProgramSerialized = JSON.stringify(shaderBlock.getShaderProgram()).replace(/\\n/g, "").replace(/\s/g, "");
                    expect(shaderProgramSerialized).toEqual(expectedShaderProgramSerialized);
                }
            })
        );
    });
});

async function blockFactory(
    smartFilter: SmartFilter,
    engine: ThinEngine,
    serializedBlock: ISerializedBlockV1,
    smartFilterDeserializer: SmartFilterDeserializer
): Promise<Nullable<BaseBlock>> {
    let newBlock: Nullable<BaseBlock> = null;

    const registration = builtInBlockRegistrations.find(
        (registration) => registration.blockType === serializedBlock.blockType && (!serializedBlock.namespace || serializedBlock.namespace === registration.namespace)
    );
    if (registration && registration.factory) {
        newBlock = await registration.factory(smartFilter, engine, smartFilterDeserializer, serializedBlock);
    }

    return newBlock;
}
