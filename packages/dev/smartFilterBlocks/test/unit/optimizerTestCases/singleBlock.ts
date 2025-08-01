import { ConnectionPoint, ConnectionPointType, InputBlock, SmartFilter } from "smart-filters";
import { OptimizationTestCase } from "../testCases.js";
import { createBlackAndWhiteBlock } from "./testBlocks/blackAndWhiteBlock.js";

export const singleBlockTestCase: OptimizationTestCase = {
    name: "Single Block",
    smartFilterFactory: () => {
        const smartFilter = new SmartFilter("Test");
        const blackAndWhiteBlock = createBlackAndWhiteBlock(smartFilter, "bw");
        const textureInputBlock = new InputBlock(smartFilter, "texture", ConnectionPointType.Texture, null);

        textureInputBlock.output.connectTo(blackAndWhiteBlock.inputs.find((input) => input.name === "input") as ConnectionPoint<ConnectionPointType.Texture>);
        blackAndWhiteBlock.output.connectTo(smartFilter.output);

        return smartFilter;
    },
    expectedOptimizedBlocks: [
        `{"fragment":{"defines":[],"const":"","uniform":"uniform sampler2D _input_;\\n","mainFunctionName":"_blackAndWhite_","functions":[{"name":"_blackAndWhite_","params":"","code":"vec4 _blackAndWhite_(vec2 vUV) { \\n    vec4 color = texture2D(_input_, vUV);\\n\\n    float luminance = dot(color.rgb, vec3(0.3, 0.59, 0.11));\\n    vec3 bg = vec3(luminance, luminance, luminance);\\n\\n    return vec4(bg, color.a);\\n}\\n\\n"}]}}`,
    ],
};
