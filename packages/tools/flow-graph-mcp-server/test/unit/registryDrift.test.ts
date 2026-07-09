/**
 * Flow Graph MCP Server – Registry Drift Guard
 *
 * Loads every real Babylon.js block referenced by the MCP block registry (via the same
 * async blockFactory the Babylon parser uses) and verifies that the registry's declared
 * signal/data connection NAMES match the block's actual connections. Connection names are
 * the wiring contract the AI agent relies on (connections are matched by name), so any
 * drift here means the agent cannot wire a real connection — or produces a dangling
 * connection that silently drops on parse. A className the factory cannot resolve is even
 * worse: the exported graph fails to parse at runtime.
 *
 * Notes:
 * - The guard compares NAMES only (not rich types): the registry uses human-readable type
 *   labels that intentionally differ from the internal RichType instances.
 * - Several blocks generate NUMBERED ports from their configuration (e.g. out_0, in_1,
 *   value_2). The registry documents these in the block's `config` prose rather than as
 *   fixed ports, so numbered ports (names ending in _<digits>) are excluded from the diff.
 */
import { blockFactory } from "core/FlowGraph/Blocks/flowGraphBlockFactory";

// Side-effect import: make the Flow Graph block modules (and the factory) available.
import "core/FlowGraph/index";

import { FlowGraphBlockRegistry } from "../../src/blockRegistry";

/**
 * Config used to construct blocks that read required fields in their constructor. Everything
 * else is constructed with an empty config object (blocks whose constructor reads optional
 * config fields tolerate `{}`). Configs are chosen to avoid generating numbered ports.
 */
const CONSTRUCTION_CONFIG: Record<string, object> = {
    FlowGraphConstantBlock: { value: 0 },
    FlowGraphJsonPointerParserBlock: { jsonPointer: "/test", outputValue: true },
};

// Numbered ports (out_0, in_1, value_2, ...) are generated from config and documented in prose.
const isDynamicPort = (name: string): boolean => /_\d+$/.test(name);

describe("Flow Graph MCP Server – Registry Drift", () => {
    it("registry signal/data connection names match the real Babylon blocks", async () => {
        const problems: string[] = [];

        const diff = (label: string, real: string[], reg: string[]): string[] => {
            // Numbered ports are excluded from BOTH sides: some blocks omit them from the
            // registry (documented in `config` prose), while others list a fixed numbered set
            // (e.g. CombineVector3 → input_0..input_2). Verifying them consistently either way
            // would be brittle, so the contract check covers fixed-name ports only.
            const realStatic = real.filter((n) => !isDynamicPort(n));
            const regStatic = reg.filter((n) => !isDynamicPort(n));
            const missing = realStatic.filter((n) => !regStatic.includes(n));
            const extra = regStatic.filter((n) => !realStatic.includes(n));
            const parts: string[] = [];
            if (missing.length) {
                parts.push(`${label} missing from registry: [${missing.join(", ")}]`);
            }
            if (extra.length) {
                parts.push(`${label} in registry but not on block: [${extra.join(", ")}]`);
            }
            return parts;
        };

        for (const [key, info] of Object.entries(FlowGraphBlockRegistry)) {
            let ctor: any;
            try {
                ctor = await blockFactory(info.className)();
            } catch (e) {
                problems.push(`${key}: className "${info.className}" is not resolvable by the Babylon block factory (${(e as Error).message})`);
                continue;
            }

            let block: any;
            try {
                block = new ctor(CONSTRUCTION_CONFIG[info.className] ?? {});
            } catch (e) {
                problems.push(`${info.className}: could not construct to verify connections (${(e as Error).message})`);
                continue;
            }

            const realSignalIn: string[] = (block.signalInputs ?? []).map((c: any) => c.name);
            const realSignalOut: string[] = (block.signalOutputs ?? []).map((c: any) => c.name);
            const realDataIn: string[] = (block.dataInputs ?? []).map((c: any) => c.name);
            const realDataOut: string[] = (block.dataOutputs ?? []).map((c: any) => c.name);

            const details = [
                ...diff(
                    "signal inputs",
                    realSignalIn,
                    info.signalInputs.map((i) => i.name)
                ),
                ...diff(
                    "signal outputs",
                    realSignalOut,
                    info.signalOutputs.map((o) => o.name)
                ),
                ...diff(
                    "data inputs",
                    realDataIn,
                    info.dataInputs.map((i) => i.name)
                ),
                ...diff(
                    "data outputs",
                    realDataOut,
                    info.dataOutputs.map((o) => o.name)
                ),
            ];
            if (details.length) {
                problems.push(`${info.className}: ${details.join("; ")}`);
            }
        }

        expect(problems, `Registry drift detected:\n${problems.join("\n")}`).toEqual([]);
    });
});
