/**
 * Node Geometry MCP Server – Registry Drift Guard
 *
 * Constructs every real Babylon.js block referenced by the MCP block registry and
 * verifies that the registry's declared input/output connection point NAMES match
 * the block's actual ports. Port names are the wiring contract the AI agent relies
 * on (connect_blocks matches by name), so any drift here means the agent cannot
 * wire a real port — or worse, produces a dangling connection that silently drops.
 *
 * This test exists because registries are hand-maintained (see
 * .github/instructions/mcp-server-coverage.instructions.md) and previously drifted
 * out of sync with the real blocks without anything catching it.
 */
import { GetClass } from "core/Misc/typeStore";

// Side-effect import: register ALL block types via RegisterClass
import "core/Meshes/Node/index";

import { BlockRegistry } from "../../src/blockRegistry";

describe("Node Geometry MCP Server – Registry Drift", () => {
    it("registry input/output port names match the real Babylon blocks", () => {
        const problems: string[] = [];

        for (const [key, info] of Object.entries(BlockRegistry)) {
            const ctor = GetClass(`BABYLON.${info.className}`);
            if (!ctor) {
                problems.push(`${key}: no class registered as "BABYLON.${info.className}"`);
                continue;
            }

            let block: any;
            try {
                block = new ctor(`${info.className}_drift`);
            } catch (e) {
                problems.push(`${info.className}: could not construct to verify ports (${(e as Error).message})`);
                continue;
            }

            const realInputs: string[] = (block.inputs ?? []).map((c: any) => c.name);
            const realOutputs: string[] = (block.outputs ?? []).map((c: any) => c.name);
            const regInputs = info.inputs.map((i) => i.name);
            const regOutputs = info.outputs.map((o) => o.name);

            const missingInputs = realInputs.filter((n) => !regInputs.includes(n));
            const extraInputs = regInputs.filter((n) => !realInputs.includes(n));
            const missingOutputs = realOutputs.filter((n) => !regOutputs.includes(n));
            const extraOutputs = regOutputs.filter((n) => !realOutputs.includes(n));

            const details: string[] = [];
            if (missingInputs.length) {
                details.push(`inputs missing from registry: [${missingInputs.join(", ")}]`);
            }
            if (extraInputs.length) {
                details.push(`inputs in registry but not on block: [${extraInputs.join(", ")}]`);
            }
            if (missingOutputs.length) {
                details.push(`outputs missing from registry: [${missingOutputs.join(", ")}]`);
            }
            if (extraOutputs.length) {
                details.push(`outputs in registry but not on block: [${extraOutputs.join(", ")}]`);
            }
            if (details.length) {
                problems.push(`${info.className}: ${details.join("; ")}`);
            }
        }

        expect(problems, `Registry drift detected:\n${problems.join("\n")}`).toEqual([]);
    });
});
