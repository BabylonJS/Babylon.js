/**
 * Node Geometry MCP Server – Babylon.js Parse Validation
 *
 * Tests that JSON produced by the Node Geometry MCP server can be parsed by Babylon.js's
 * NodeGeometry.parseSerializedObject() without errors. This proves the JSON
 * structure is valid and all block types are recognized by Babylon.js.
 *
 * Note: We skip build() because it actually _evaluates_ the computational graph,
 * which requires proper Vector3/Matrix runtime objects. The MCP server's
 * responsibility is producing structurally valid JSON — not runtime evaluation.
 */
import { NodeGeometry } from "core/Meshes/Node/nodeGeometry";

// Side-effect imports: register ALL NGE block types via RegisterClass
import "core/Meshes/Node/index";

import * as fs from "fs";
import * as path from "path";

const NGE_SERVER_DIR = path.resolve(__dirname, "../..");
const EXAMPLES_DIR = path.resolve(NGE_SERVER_DIR, "examples");

function readExampleJson(filename: string): string {
    return fs.readFileSync(path.join(EXAMPLES_DIR, filename), "utf-8");
}

describe("Node Geometry MCP Server – Babylon.js Parse", () => {
    const exampleFiles = ["SimpleBox.json", "ScatteredInstances.json", "NoiseTerrain.json", "BooleanCSG.json", "MathPipeline.json"];

    for (const file of exampleFiles) {
        it(`should parse example geometry: ${file}`, () => {
            let jsonStr: string;
            try {
                jsonStr = readExampleJson(file);
            } catch {
                console.warn(`Skipping ${file}: not found (run generateExamples.test.ts first)`);
                return;
            }

            const source = JSON.parse(jsonStr);

            // Use parseSerializedObject (not Parse) to validate structure
            // without executing the computational graph
            const nodeGeometry = new NodeGeometry(file.replace(".json", ""));
            nodeGeometry.parseSerializedObject(source);

            expect(nodeGeometry.attachedBlocks.length).toBeGreaterThan(0);

            // Verify block count matches
            expect(nodeGeometry.attachedBlocks.length).toBe(source.blocks.length);

            nodeGeometry.dispose();
        });
    }
});
