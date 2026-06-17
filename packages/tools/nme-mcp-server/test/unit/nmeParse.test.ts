/**
 * Node Material MCP Server – Babylon.js Parse Validation
 *
 * Tests that JSON produced by the Node Material MCP server can be parsed by Babylon.js's
 * NodeMaterial.Parse() without errors. This is the definitive end-to-end test:
 * if Parse() + build() succeeds, the material is valid for the NME editor.
 */
import { NullEngine } from "core/Engines";
import { Scene } from "core/scene";
import { NodeMaterial } from "core/Materials/Node/nodeMaterial";

// Side-effect imports to register ALL NME block types via RegisterClass
import "core/Materials/Node/Blocks/index";

import * as fs from "fs";
import * as path from "path";

const NME_SERVER_DIR = path.resolve(__dirname, "../..");

/**
 * Helper: read a JSON file relative to the nme-mcp-server directory.
 */
function readNmeJson(relativePath: string): string {
    const fullPath = path.resolve(NME_SERVER_DIR, relativePath);
    return fs.readFileSync(fullPath, "utf-8");
}

describe("Node Material MCP Server – Babylon.js Parse", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // ── Sample materials from the nme-mcp-server directory ──────────────

    const sampleFiles = ["bricks.json", "grass.json", "psychedelic.json", "purple-fire.json", "purple-fire-bricks.json"];

    for (const file of sampleFiles) {
        it(`should parse sample material: ${file}`, () => {
            let jsonStr: string;
            try {
                jsonStr = readNmeJson(file);
            } catch {
                // File might not exist — skip
                console.warn(`Skipping ${file}: not found`);
                return;
            }

            const source = JSON.parse(jsonStr);
            const material = NodeMaterial.Parse(source, scene);

            expect(material).toBeDefined();
            expect(material.attachedBlocks.length).toBeGreaterThan(0);

            // The material should have parsed all blocks from the JSON
            const expectedBlockCount = source.blocks.length;
            expect(material.attachedBlocks.length).toBe(expectedBlockCount);

            material.dispose();
        });
    }

    // ── MCP-generated fixtures (created by graphManager.test.ts) ────────

    const fixtureFiles = ["simpleColor.json", "pbrMaterial.json"];

    for (const file of fixtureFiles) {
        it(`should parse MCP-generated fixture: ${file}`, () => {
            let jsonStr: string;
            try {
                jsonStr = readNmeJson(`test/fixtures/${file}`);
            } catch {
                console.warn(`Skipping fixture ${file}: not found (run graphManager.test.ts first)`);
                return;
            }

            const source = JSON.parse(jsonStr);
            const material = NodeMaterial.Parse(source, scene);

            expect(material).toBeDefined();
            expect(material.attachedBlocks.length).toBeGreaterThan(0);
            expect(material.attachedBlocks.length).toBe(source.blocks.length);

            material.dispose();
        });
    }

    // ── Round-trip fixtures ──────────────────────────────────────────────

    for (const file of sampleFiles) {
        it(`should parse round-tripped material: roundtrip-${file}`, () => {
            let jsonStr: string;
            try {
                jsonStr = readNmeJson(`test/fixtures/roundtrip-${file}`);
            } catch {
                console.warn(`Skipping roundtrip-${file}: not found (run graphManager.test.ts first)`);
                return;
            }

            const source = JSON.parse(jsonStr);
            const material = NodeMaterial.Parse(source, scene);

            expect(material).toBeDefined();
            expect(material.attachedBlocks.length).toBeGreaterThan(0);
            expect(material.attachedBlocks.length).toBe(source.blocks.length);

            material.dispose();
        });
    }

    // ── MCP-generated example materials ─────────────────────────────────

    const exampleFiles = ["BricksAndMortar.json", "CheckeredBoard.json", "Water.json", "HumanSkin.json", "Psychedelic.json"];

    for (const file of exampleFiles) {
        it(`should parse example material: ${file}`, () => {
            let jsonStr: string;
            try {
                jsonStr = readNmeJson(`examples/${file}`);
            } catch {
                console.warn(`Skipping example ${file}: not found`);
                return;
            }

            const source = JSON.parse(jsonStr);
            const material = NodeMaterial.Parse(source, scene);

            expect(material).toBeDefined();
            expect(material.attachedBlocks.length).toBeGreaterThan(0);
            expect(material.attachedBlocks.length).toBe(source.blocks.length);

            material.dispose();
        });
    }

    // ── Inline minimal material (always runs, no file dependency) ────────

    it("should parse a minimal inline material", () => {
        const minimalMaterial = {
            ignoreAlpha: false,
            maxSimultaneousLights: 4,
            mode: 0,
            forceAlphaBlending: false,
            blocks: [
                {
                    customType: "BABYLON.InputBlock",
                    id: 1,
                    name: "position",
                    target: 1,
                    inputs: [],
                    outputs: [{ name: "output", displayName: "output" }],
                    mode: 1,
                    min: 0,
                    max: 0,
                    isBoolean: false,
                    matrixMode: 0,
                    isConstant: false,
                    groupInInspector: "",
                    convertToGammaSpace: false,
                    convertToLinearSpace: false,
                    animationType: 0,
                    type: 8, // Vector3
                    value: [0, 0, 0],
                    valueType: "BABYLON.Vector3",
                },
                {
                    customType: "BABYLON.InputBlock",
                    id: 2,
                    name: "worldViewProjection",
                    target: 1,
                    inputs: [],
                    outputs: [{ name: "output", displayName: "output" }],
                    mode: 0,
                    min: 0,
                    max: 0,
                    isBoolean: false,
                    matrixMode: 0,
                    isConstant: false,
                    groupInInspector: "",
                    convertToGammaSpace: false,
                    convertToLinearSpace: false,
                    animationType: 0,
                    type: 128, // Matrix
                    systemValue: 6, // WorldViewProjection
                },
                {
                    customType: "BABYLON.TransformBlock",
                    id: 3,
                    name: "worldPos",
                    target: 1,
                    inputs: [
                        { name: "vector", displayName: "vector", targetBlockId: 1, targetConnectionName: "output" },
                        { name: "transform", displayName: "transform", targetBlockId: 2, targetConnectionName: "output" },
                    ],
                    outputs: [
                        { name: "output", displayName: "output" },
                        { name: "xyz", displayName: "xyz" },
                    ],
                    complementZ: 0,
                    complementW: 1,
                },
                {
                    customType: "BABYLON.VertexOutputBlock",
                    id: 4,
                    name: "vertexOutput",
                    target: 1,
                    inputs: [{ name: "vector", displayName: "vector", targetBlockId: 3, targetConnectionName: "output" }],
                    outputs: [],
                },
                {
                    customType: "BABYLON.InputBlock",
                    id: 5,
                    name: "color",
                    target: 2,
                    inputs: [],
                    outputs: [{ name: "output", displayName: "output" }],
                    mode: 0,
                    min: 0,
                    max: 0,
                    isBoolean: false,
                    matrixMode: 0,
                    isConstant: false,
                    groupInInspector: "",
                    convertToGammaSpace: false,
                    convertToLinearSpace: false,
                    animationType: 0,
                    type: 32, // Color3
                    value: [1, 0, 0],
                    valueType: "BABYLON.Color3",
                },
                {
                    customType: "BABYLON.FragmentOutputBlock",
                    id: 6,
                    name: "fragmentOutput",
                    target: 2,
                    inputs: [
                        { name: "rgba", displayName: "rgba" },
                        { name: "rgb", displayName: "rgb", targetBlockId: 5, targetConnectionName: "output" },
                        { name: "a", displayName: "a" },
                    ],
                    outputs: [],
                    convertToGammaSpace: false,
                    convertToLinearSpace: false,
                    useLogarithmicDepth: false,
                },
            ],
            outputNodes: [4, 6],
        };

        const material = NodeMaterial.Parse(minimalMaterial, scene);

        expect(material).toBeDefined();
        expect(material.attachedBlocks.length).toBe(6);

        material.dispose();
    });

    // ── Deep validation of example materials ────────────────────────────

    const deepExamples = ["BricksAndMortar.json", "CheckeredBoard.json", "Water.json"];

    for (const file of deepExamples) {
        it(`should build and have connections: ${file}`, () => {
            let jsonStr: string;
            try {
                jsonStr = readNmeJson(`examples/${file}`);
            } catch {
                console.warn(`Skipping deep test for ${file}: not found`);
                return;
            }

            const source = JSON.parse(jsonStr);
            const material = NodeMaterial.Parse(source, scene);

            expect(material).toBeDefined();
            expect(material.attachedBlocks.length).toBe(source.blocks.length);

            // Check that connections have been restored
            let connectedInputCount = 0;
            for (const block of material.attachedBlocks) {
                for (const inp of block.inputs) {
                    if (inp.isConnected) {
                        connectedInputCount++;
                    }
                }
            }

            // Count expected connections from the source JSON
            let expectedConnections = 0;
            for (const b of source.blocks) {
                for (const inp of b.inputs ?? []) {
                    if (inp.targetBlockId !== undefined && inp.targetBlockId !== null) {
                        expectedConnections++;
                    }
                }
            }

            console.log(`${file}: ${connectedInputCount}/${expectedConnections} connections restored, ${material.attachedBlocks.length} blocks`);

            // All connections from the JSON should be restored in the parsed material
            expect(connectedInputCount).toBe(expectedConnections);

            // Try building the material (shader compilation)
            expect(() => {
                material.build(false);
            }).not.toThrow();

            material.dispose();
        });
    }
});
