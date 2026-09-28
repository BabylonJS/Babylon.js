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
import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";

// Side-effect import: register ALL block types via RegisterClass
import "core/Meshes/Node/index";

import { BlockRegistry } from "../../src/blockRegistry";

describe("Node Geometry MCP Server – Registry Drift", () => {
    it("registry connection metadata matches the real Babylon blocks", () => {
        const problems: string[] = [];
        const typeNames = NodeGeometryBlockConnectionPointTypes as unknown as Record<number, string>;

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

            for (const direction of ["inputs", "outputs"] as const) {
                const realPorts = block[direction] ?? [];
                const registryPorts = info[direction];
                expect(
                    registryPorts.map((port) => port.name),
                    `${info.className}.${direction} names`
                ).toEqual(realPorts.map((port: any) => port.name));

                for (let index = 0; index < realPorts.length; index++) {
                    const realPort = realPorts[index];
                    const registryPort = registryPorts[index];
                    const comparisons: Array<[string, unknown, unknown]> = [
                        ["type", registryPort.type, typeNames[realPort.innerType]],
                        [
                            "acceptedConnectionPointTypes",
                            registryPort.acceptedConnectionPointTypes ?? [],
                            realPort.acceptedConnectionPointTypes.map((type: number) => typeNames[type]),
                        ],
                        [
                            "excludedConnectionPointTypes",
                            registryPort.excludedConnectionPointTypes ?? [],
                            realPort.excludedConnectionPointTypes.map((type: number) => typeNames[type]),
                        ],
                        ["typeConnectionSource", registryPort.typeConnectionSource, realPort._typeConnectionSource?.name],
                        ["linkedConnectionSource", registryPort.linkedConnectionSource, realPort._linkedConnectionSource?.name],
                        ["defaultConnectionPointType", registryPort.defaultConnectionPointType, typeNames[realPort._defaultConnectionPointType]],
                        ["isMainLinkSource", registryPort.isMainLinkSource ?? false, realPort._isMainLinkSource],
                    ];
                    for (const [field, registryValue, realValue] of comparisons) {
                        if (JSON.stringify(registryValue) !== JSON.stringify(realValue)) {
                            problems.push(
                                `${info.className}.${direction}.${realPort.name}.${field}: registry=${JSON.stringify(registryValue)}, runtime=${JSON.stringify(realValue)}`
                            );
                        }
                    }
                }
            }
        }

        expect(problems, `Registry drift detected:\n${problems.join("\n")}`).toEqual([]);
    });

    it("has machine-readable metadata for every declared mutable property", () => {
        for (const [key, info] of Object.entries(BlockRegistry)) {
            const declaredProperties = ["name", "comments", "visibleOnFrame", ...Object.keys(info.properties ?? {})].sort();
            expect(Object.keys(info.propertyMetadata ?? {}).sort(), `${key} property metadata`).toEqual(declaredProperties);
        }
    });
});
