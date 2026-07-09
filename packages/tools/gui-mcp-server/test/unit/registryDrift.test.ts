/**
 * GUI MCP Server – Catalog Drift Guard
 *
 * Constructs every real Babylon.js GUI control referenced by the MCP control catalog
 * and verifies that each property NAME declared in the catalog actually exists as a
 * member on the real control (own field or accessor anywhere up the prototype chain).
 * Property names are the contract the AI agent relies on (set_control_properties writes
 * them into the serialized GUI JSON), so a catalog property that does not exist on the
 * real control is silently dropped on parse — the agent believes it configured the
 * control but nothing happened.
 *
 * This test exists because the catalog is hand-maintained (see
 * .github/instructions/mcp-server-coverage.instructions.md) and previously drifted
 * out of sync with the real controls without anything catching it.
 */
import { GetClass } from "core/Misc/typeStore";

// Side-effect import: register ALL GUI control classes via RegisterClass
import "gui/2D/index";

import { ControlRegistry, BaseControlProperties } from "../../src/catalog";

describe("GUI MCP Server – Catalog Drift", () => {
    it("catalog control class names and property names match the real Babylon GUI controls", () => {
        const problems: string[] = [];

        for (const [key, info] of Object.entries(ControlRegistry)) {
            const ctor = GetClass(`BABYLON.GUI.${info.className}`);
            if (!ctor) {
                problems.push(`${key}: no class registered as "BABYLON.GUI.${info.className}"`);
                continue;
            }

            let control: any;
            try {
                control = new ctor(`${info.className}_drift`);
            } catch {
                try {
                    control = new ctor();
                } catch (e) {
                    problems.push(`${info.className}: could not construct to verify properties (${(e as Error).message})`);
                    continue;
                }
            }

            // Every catalog property (base + control-specific) must exist as a real
            // member on the control instance (own field or accessor up the prototype chain).
            const catalogProps = { ...BaseControlProperties, ...info.properties };
            const missing = Object.keys(catalogProps).filter((p) => !(p in control));
            if (missing.length) {
                problems.push(`${info.className}: catalog properties not found on the real control: [${missing.join(", ")}]`);
            }
        }

        expect(problems, `Catalog drift detected:\n${problems.join("\n")}`).toEqual([]);
    });
});
