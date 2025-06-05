import { importCustomBlockDefinition } from "../../dist/serialization/importCustomBlockDefinition.js";
import { CustomShaderBlock } from "../../dist/blockFoundation/customShaderBlock.js";
import { SmartFilter } from "../../dist/smartFilter.js";
import { InputBlock } from "../../dist/blockFoundation/inputBlock.js";
import { ConnectionPointType } from "../../dist/connection/connectionPointType.js";
import { SmartFilterOptimizer } from "../../dist/optimization/smartFilterOptimizer.js";

const annotatedFragmentGeneral = `
// { "smartFilterBlockType": "GeneralBlock", "namespace": "UnitTests" }
uniform sampler2D input; // main
uniform float intensity;

vec4 apply2(vec2 vUV){ // main
    vec4 color = texture2D(input, vUV);
    return color * intensity;
}
`;

describe("importCustomBlockDefinition", () => {
    describe("a block is parsed after a block where the string ends exactly at the end of the function definition", () => {
        const annotatedFragmentEndOfFunctionDefinitionIsEndOfString = `
            // { "smartFilterBlockType": "BlockWhereFunctionEndsAtEndOfString", "namespace": "UnitTests" }
            uniform sampler2D input; // main
            uniform float amount;

            vec4 apply1(vec2 vUV){ // main
                vec4 color = texture2D(input, vUV);
                return color + amount;
            }`;

        const customBlockDefinition1 = importCustomBlockDefinition(
            annotatedFragmentEndOfFunctionDefinitionIsEndOfString
        );
        const customBlockDefinition2 = importCustomBlockDefinition(annotatedFragmentGeneral);
        let smartFilter;

        beforeEach(() => {
            smartFilter = new SmartFilter("test");
            const customBlock1 = CustomShaderBlock.Create(smartFilter, "block1", customBlockDefinition1);
            const customBlock2 = CustomShaderBlock.Create(smartFilter, "block2", customBlockDefinition2);

            const inputTexture = new InputBlock(smartFilter, "inputTexture", ConnectionPointType.Texture, null);
            const inputFloat = new InputBlock(smartFilter, "inputFloat", ConnectionPointType.Float, 1.0);

            inputTexture.output.connectTo(customBlock1.findInput("input"));
            inputFloat.output.connectTo(customBlock1.findInput("amount"));

            customBlock1.output.connectTo(customBlock2.findInput("input"));
            inputFloat.output.connectTo(customBlock2.findInput("intensity"));

            customBlock2.output.connectTo(smartFilter.output);
        });

        it("a smart filter using those blocks can be optimized without error", () => {
            const optimizer = new SmartFilterOptimizer(smartFilter);
            expect(optimizer.optimize()).not.toBeNull();
        });
    });
});
