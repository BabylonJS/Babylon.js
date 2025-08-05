import * as pixelateSmartFilter from "./optimizerTestCases/pixelate.json";
import { optimizedSmartFilterBlocks as pixelateOptimizedBlocks } from "./optimizerTestCases/pixelate.optimized.js";

import * as pixelateAndTintSmartFilter from "./optimizerTestCases/pixelateAndTint.json";
import { optimizedSmartFilterBlocks as pixelateAndTintOptimizedBlocks } from "./optimizerTestCases/pixelateAndTint.optimized.js";

import * as doubleTintAndWipeSmartFilter from "./optimizerTestCases/doubleTintAndWipe.json";
import { optimizedSmartFilterBlocks as doubleTintAndWipeOptimizedBlocks } from "./optimizerTestCases/doubleTintAndWipe.optimized.js";

import * as contrastTintAndBlurSmartFilter from "./optimizerTestCases/contrastTintAndBlur.json";
import { optimizedSmartFilterBlocks as contrastTintAndBlurOptimizedBlocks } from "./optimizerTestCases/contrastTintAndBlur.optimized.js";

/**
 * To add test cases you need to store the serialized Smart Filter to optimize as well as the
 * expected output of the optimizer.
 *
 * To get the serializedSmartFilter:
 *   1. Create a Smart Filter in the Smart Filter Editor (SFE) using the default built in blocks
 *      (those are the only ones the test will know how to instantiate).
 *   2. In SFE, click "Copy to Clipboard" to get the serialized Smart Filter.
 *   3. Create a file in the optimizerTestCases folder, e.g. `pixelate.json`, and paste the serialized Smart Filter in it.
 *
 * To get the expectedOptimizedBlocks:
 *   1. In SFE, ensure the "Optimize Smart Filter" checkbox is checked.
 *   2. Open the developer tools in the browser, go to the console, and type: getOptimizedShaderBlocks()
 *   3. You will see a message that they have been copied to the clipboard.
 *   4. Create a file in the optimizerTestCases folder, e.g. `pixelate.optimized.ts`, and paste the output in it.
 *
 * To add the test case:
 *   1. Create a new entry in the `testCases` array below.
 *   2. Set the `name` to a meaningful name for the test case.
 *   3. Set the `serializedSmartFilter` to the imported JSON you created above, giving it a meaningful name.
 *   4. Set the `expectedOptimizedBlocks` to the imported optimized blocks you created above, giving it a meaningful name.
 *
 * To update the expected result of a test case, follow the steps for getting the expectedOptimizedBlocks again.
 */

export const testCases: OptimizationTestCase[] = [
    {
        name: "Single Block (tests simple case of a single block)",
        serializedSmartFilter: pixelateSmartFilter,
        expectedOptimizedBlocks: pixelateOptimizedBlocks,
    },
    {
        name: "Two Simple Blocks (tests simple case of combining two blocks)",
        serializedSmartFilter: pixelateAndTintSmartFilter,
        expectedOptimizedBlocks: pixelateAndTintOptimizedBlocks,
    },
    {
        name: "Double Tint and Wipe (tests multiple instances of the same block)",
        serializedSmartFilter: doubleTintAndWipeSmartFilter,
        expectedOptimizedBlocks: doubleTintAndWipeOptimizedBlocks,
    },
    {
        name: "Contrast, Tint and Blur (tests non-optimizable sections)",
        serializedSmartFilter: contrastTintAndBlurSmartFilter,
        expectedOptimizedBlocks: contrastTintAndBlurOptimizedBlocks,
    },
];

export type OptimizationTestCase = {
    name: string;
    serializedSmartFilter: any;
    expectedOptimizedBlocks: any;
};
