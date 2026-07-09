/**
 * Smart Filters MCP Server – Registry Drift Guard
 *
 * Verifies that the MCP block registry's declared input/output connection point NAMES
 * match the real Smart Filter blocks. Port names are the wiring contract the AI agent
 * relies on (connectBlocks matches by name), so any drift means the agent cannot wire a
 * real port — or produces a connection that is silently dropped on parse.
 *
 * Smart Filter blocks come in a few flavours, each with a different authoritative source:
 *   - Annotated-GLSL blocks (*.block.glsl): parsed with ImportCustomBlockDefinition.
 *   - Hand-written TS shader/aggregate blocks: constructed via their real factory.
 *   - Input blocks and the graph OutputBlock: fixed framework invariants.
 *   - Blocks whose shader is generated from a *.fragment.glsl at build time cannot be
 *     constructed in the source test environment, so they are presence-checked only.
 *
 * This test exists because the registry is hand-maintained (see
 * .github/instructions/mcp-server-coverage.instructions.md) and can silently drift.
 */
import fs from "fs";
import path from "path";
import { NullEngine } from "core/Engines/nullEngine";
import { SmartFilter, SmartFilterDeserializer, ImportCustomBlockDefinition } from "smart-filters";
import { BuiltInBlockRegistrations } from "smart-filters-blocks/registration/builtInBlockRegistrations";
import { DirectionalBlurBlock } from "smart-filters-blocks/blocks/babylon/demo/effects/directionalBlurBlock";
import { BlockRegistry } from "../../src/blockRegistry";

// Blocks whose shader is generated from a *.fragment.glsl at build time and therefore
// cannot be constructed in the source test environment. Their presence in the registry
// is still verified, but their ports are not compared against a constructed block.
const CODEGEN_ONLY = new Set(["CompositionBlock", "SpritesheetBlock"]);

// The single output of every Smart Filter shader block is named "output".
const SHADER_OUTPUTS = ["output"];

/**
 * Connection points that exist on a real block but are never exposed for agent wiring:
 *  - "disabled": the block-disable connection point (managed via block properties).
 *  - autoBind inputs: values the framework binds automatically (e.g. output aspect ratio).
 */
function isHiddenInput(name: string, autoBind?: unknown): boolean {
    return name === "disabled" || !!autoBind;
}

function walkGlsl(dir: string): string[] {
    let result: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            result = result.concat(walkGlsl(full));
        } else if (entry.name.endsWith(".block.glsl")) {
            result.push(full);
        }
    }
    return result;
}

function diff(label: string, real: string[], registry: string[]): string[] {
    const missing = real.filter((n) => !registry.includes(n));
    const extra = registry.filter((n) => !real.includes(n));
    const details: string[] = [];
    if (missing.length) {
        details.push(`${label} missing from registry: [${missing.join(", ")}]`);
    }
    if (extra.length) {
        details.push(`${label} in registry but not on block: [${extra.join(", ")}]`);
    }
    return details;
}

describe("Smart Filters MCP Server – Registry Drift", () => {
    it("registry input/output port names match the real Smart Filter blocks", async () => {
        const problems: string[] = [];

        // Authoritative ports for annotated-GLSL blocks, keyed by blockType.
        const glslInputs = new Map<string, string[]>();
        const blocksRoot = path.resolve(process.cwd(), "packages/dev/smartFilterBlocks/src/blocks");
        for (const file of walkGlsl(blocksRoot)) {
            const def: any = ImportCustomBlockDefinition(fs.readFileSync(file, "utf8"));
            const inputs = (def.inputConnectionPoints ?? []).filter((c: any) => !isHiddenInput(c.name, c.autoBind)).map((c: any) => c.name);
            glslInputs.set(def.blockType, inputs);
        }

        const engine = new NullEngine();
        const deserializer = new SmartFilterDeserializer(() => async () => {
            throw new Error("no factory");
        });
        const registrationsByType = new Map(BuiltInBlockRegistrations.map((r) => [r.blockType, r]));

        // Blocks that are constructable but not exposed as top-level BuiltInBlockRegistrations
        // (e.g. DirectionalBlurBlock is used internally by the BlurBlock aggregate).
        const directConstructors: Record<string, (sf: SmartFilter) => any> = {
            DirectionalBlurBlock: (sf) => new DirectionalBlurBlock(sf, "drift"),
        };

        for (const [key, info] of Object.entries(BlockRegistry)) {
            const regInputs = info.inputs.map((i) => i.name);
            const regOutputs = info.outputs.map((o) => o.name);

            // Input blocks: no inputs, a single "output" (InputBlock invariant).
            if (info.isInput) {
                problems.push(...diff("inputs", [], regInputs).map((d) => `${key}: ${d}`));
                problems.push(...diff("outputs", ["output"], regOutputs).map((d) => `${key}: ${d}`));
                continue;
            }

            // The graph output block: a single "input", no outputs (OutputBlock invariant).
            if (key === "OutputBlock") {
                problems.push(...diff("inputs", ["input"], regInputs).map((d) => `${key}: ${d}`));
                problems.push(...diff("outputs", [], regOutputs).map((d) => `${key}: ${d}`));
                continue;
            }

            // Annotated-GLSL blocks.
            if (glslInputs.has(key)) {
                problems.push(...diff("inputs", glslInputs.get(key)!, regInputs).map((d) => `${key}: ${d}`));
                problems.push(...diff("outputs", SHADER_OUTPUTS, regOutputs).map((d) => `${key}: ${d}`));
                continue;
            }

            // Codegen-only blocks: presence verified above (they are in BlockRegistry); ports skipped.
            if (CODEGEN_ONLY.has(key)) {
                continue;
            }

            // Hand-written TS shader/aggregate blocks: construct via their real factory
            // (or a direct constructor for blocks not exposed as a top-level registration).
            let block: any;
            try {
                const sf = new SmartFilter("drift");
                if (directConstructors[key]) {
                    block = directConstructors[key](sf);
                } else {
                    const registration: any = registrationsByType.get(key);
                    if (!registration?.factory) {
                        problems.push(`${key}: no annotated-GLSL source and no constructable factory found`);
                        continue;
                    }
                    block = await registration.factory(sf, engine, deserializer, undefined, { suppressAutomaticInputBlocks: true });
                }
            } catch (e) {
                problems.push(`${key}: could not construct to verify ports (${(e as Error).message})`);
                continue;
            }
            const realInputs = (block.inputs ?? []).map((c: any) => c.name).filter((n: string) => !isHiddenInput(n));
            const realOutputs = (block.outputs ?? []).map((c: any) => c.name);
            problems.push(...diff("inputs", realInputs, regInputs).map((d) => `${key}: ${d}`));
            problems.push(...diff("outputs", realOutputs, regOutputs).map((d) => `${key}: ${d}`));
        }

        expect(problems, `Registry drift detected:\n${problems.join("\n")}`).toEqual([]);
    });
});
