/* eslint-disable github/no-then */
/* eslint-disable no-console */
import { ShaderBlock, type BaseBlock, type ShaderProgram } from "smart-filters";

/**
 * This file contains functions which help in the dev inner loop of Smart Filter optimizer unit test cases.
 * See the instructions in `smartFilterOptimizerTestCases.ts` for how to add new test cases.
 */

/**
 * Creates the javascript code that describes the optimized shader blocks contents for use as unit test output.
 * @param attachedBlocks - The list of blocks to generate the code for.
 */
export function RegisterOptimizedShaderBlockCodeForUnitTests(attachedBlocks: readonly BaseBlock[]) {
    const optimizedShaderProgramList = attachedBlocks
        .map((block: BaseBlock) => {
            if (block instanceof ShaderBlock) {
                return block.getShaderProgram();
            }
            return null;
        })
        .filter((shaderProgram) => shaderProgram !== null);

    (window as any).getOptimizedShaderBlocks = () => {
        const code = GetCode(optimizedShaderProgramList);

        // Copy the code to the clipboard
        navigator.clipboard.writeText(code).catch((err) => {
            console.error("Failed to copy optimized shader blocks code to clipboard:", err);
        });
        console.log("The code for the optimized shader blocks has been copied to the clipboard.");
    };
    console.log("To get the optimized shader blocks code, type getOptimizedShaderBlocks() in the console.");
}

function GetCode(optimizedShaderProgramList: ShaderProgram[]): string {
    return (
        "export const optimizedSmartFilterBlocks = [" +
        optimizedShaderProgramList
            .map((shaderProgram) => {
                return `{
    fragment: {
        defines: ${JSON.stringify(shaderProgram.fragment.defines || [])},
        const: \`
${shaderProgram.fragment.const}\`,
        uniform: \`
${shaderProgram.fragment.uniform}\`,
        mainFunctionName: \`${shaderProgram.fragment.mainFunctionName}\`,
        functions: [

        ${shaderProgram.fragment.functions
            .map((func) => {
                return `{
            name: \`${func.name}\`,
            params: \`${func.params}\`,
            code: \`
${func.code}
\`}`;
            })
            .join(",\n")}
        ]
    }
}`;
            })
            .join(",\n") +
        "]"
    );
}
