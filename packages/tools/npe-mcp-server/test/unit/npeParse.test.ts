/**
 * Node Particle MCP Server – Babylon.js Parse Validation
 *
 * Tests that JSON produced by the Node Particle MCP server can be parsed by Babylon.js's
 * NodeParticleSystemSet.parseSerializedObject() without errors. This proves the JSON
 * structure is valid and all block types are recognized by Babylon.js.
 *
 * Note: We skip build() because it actually _evaluates_ the particle graph,
 * which requires a running scene/engine. The MCP server's responsibility is
 * producing structurally valid JSON — not runtime evaluation.
 */
import { NodeParticleSystemSet } from "core/Particles/Node/nodeParticleSystemSet";

// Side-effect imports: register ALL NPE block types via RegisterClass
import "core/Particles/Node/index";

import * as fs from "fs";
import * as path from "path";

const NPE_SERVER_DIR = path.resolve(__dirname, "../..");
const EXAMPLES_DIR = path.resolve(NPE_SERVER_DIR, "examples");

function readExampleJson(filename: string): string {
    return fs.readFileSync(path.join(EXAMPLES_DIR, filename), "utf-8");
}

describe("Node Particle MCP Server – Babylon.js Parse", () => {
    const exampleFiles = ["BasicParticles.json", "ColoredParticles.json", "ConeFountain.json", "MathParticles.json", "MultiSystemParticles.json"];

    for (const file of exampleFiles) {
        it(`should parse example particle system: ${file}`, () => {
            let jsonStr: string;
            try {
                jsonStr = readExampleJson(file);
            } catch {
                console.warn(`Skipping ${file}: not found (run generateExamples.test.ts first)`);
                return;
            }

            const source = JSON.parse(jsonStr);

            // Use parseSerializedObject to validate structure
            // without executing the particle graph
            const nodeParticleSet = new NodeParticleSystemSet(file.replace(".json", ""));
            nodeParticleSet.parseSerializedObject(source);

            expect(nodeParticleSet.attachedBlocks.length).toBeGreaterThan(0);

            // Verify block count matches
            expect(nodeParticleSet.attachedBlocks.length).toBe(source.blocks.length);

            nodeParticleSet.dispose();
        });
    }
});
