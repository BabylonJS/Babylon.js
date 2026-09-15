import { afterEach, describe, expect, it, vi } from "vitest";

import { GetNgeEnumsReference, NgeConceptsMarkdown, NgeEnumCatalog, type ISerializedGeometry } from "@tools/nge-mcp-common";

const { mockLoadSnippet } = vi.hoisted(() => ({
    mockLoadSnippet: vi.fn(),
}));

vi.mock("@tools/snippet-loader", () => ({
    LoadSnippet: (...args: unknown[]) => mockLoadSnippet(...args),
    SaveSnippet: vi.fn(),
}));

import { type GlobalState } from "../../src/globalState";
import { DecodeNodeGeometryUrlHash } from "../../src/encodedGeometryUrl";
import { SerializationTools } from "../../src/serializationTools";
import { type IWebMcpTool, CreateNodeGeometryWebMcpTools, IsNodeGeometryWebMcpSupported, RegisterNodeGeometryWebMcpToolsAsync } from "../../src/webMcp";

interface IRegistration {
    tool: IWebMcpTool;
    signal: AbortSignal;
}

function CreateTestState(registrations: IRegistration[], rebuild: () => void): GlobalState {
    const observable = {
        notifyObservers: vi.fn(),
    };

    return {
        hostDocument: {
            modelContext: {
                registerTool: vi.fn(async (tool: IWebMcpTool, options: { signal: AbortSignal }) => {
                    registrations.push({ tool, signal: options.signal });
                }),
            },
        },
        hostWindow: {
            btoa,
            atob,
        },
        nodeGeometry: {
            attachedBlocks: [],
        },
        mcpSessionConnected: false,
        stateManager: {
            onRebuildRequiredObservable: {
                notifyObservers: rebuild,
            },
            onSelectionChangedObservable: observable,
        },
        onResetRequiredObservable: observable,
        onFrame: observable,
        onClearUndoStack: observable,
        onZoomToFitRequiredObservable: observable,
        onIsLoadingChanged: observable,
    } as unknown as GlobalState;
}

function FindTool(tools: readonly IWebMcpTool[], name: string): IWebMcpTool {
    const tool = tools.find((candidate) => candidate.name === name);
    if (!tool) {
        throw new Error(`Tool "${name}" was not registered.`);
    }
    return tool;
}

function RemapGeometryIds(value: unknown, firstId: number): ISerializedGeometry {
    const geometry = JSON.parse(JSON.stringify(value)) as ISerializedGeometry;
    const idMap = new Map(geometry.blocks.map((block, index) => [block.id, firstId + index]));

    geometry.blocks = geometry.blocks.map((block) => ({
        ...block,
        id: idMap.get(block.id)!,
        inputs: block.inputs.map((input) => ({
            ...input,
            targetBlockId: input.targetBlockId === undefined ? undefined : (idMap.get(input.targetBlockId) ?? input.targetBlockId),
        })),
    }));
    geometry.outputNodeId = idMap.get(geometry.outputNodeId) ?? -1;
    if (geometry.editorData) {
        geometry.editorData.locations = geometry.editorData.locations.map((location) => ({
            ...location,
            blockId: idMap.get(location.blockId) ?? location.blockId,
        }));
    }
    return geometry;
}

describe("Node Geometry WebMCP", () => {
    afterEach(() => {
        vi.restoreAllMocks();
        mockLoadSnippet.mockReset();
    });

    it("reports whether the browser exposes WebMCP", () => {
        expect(IsNodeGeometryWebMcpSupported({} as Document)).toBe(false);
        expect(
            IsNodeGeometryWebMcpSupported({
                modelContext: {
                    registerTool: vi.fn(),
                },
            } as unknown as Document)
        ).toBe(true);
    });

    it("registers the complete current-document tool set with one lifetime signal", async () => {
        const registrations: IRegistration[] = [];
        const state = CreateTestState(registrations, vi.fn());
        const controller = new AbortController();

        await expect(RegisterNodeGeometryWebMcpToolsAsync(state, controller.signal)).resolves.toBe(true);

        expect(registrations.map(({ tool }) => tool.name)).toEqual([
            "get_current_node_geometry",
            "create_current_node_geometry",
            "replace_current_node_geometry",
            "rebuild_current_node_geometry",
            "add_block",
            "add_blocks_batch",
            "remove_block",
            "set_block_properties",
            "connect_blocks",
            "connect_blocks_batch",
            "disconnect_input",
            "describe_current_node_geometry",
            "describe_block",
            "list_block_types",
            "get_block_type_info",
            "get_node_geometry_enums",
            "get_node_geometry_concepts",
            "validate_current_node_geometry",
            "import_current_node_geometry_from_snippet",
            "save_current_node_geometry_snippet",
            "get_current_node_geometry_url",
        ]);
        expect(registrations.every(({ signal }) => signal === controller.signal)).toBe(true);
        expect(registrations[0].tool.annotations).toEqual({
            readOnlyHint: true,
            untrustedContentHint: true,
        });
        expect(registrations[15].tool.execute({}, { signal: new AbortController().signal })).toEqual({
            catalog: NgeEnumCatalog,
            markdown: GetNgeEnumsReference(),
        });
    });

    it("exposes the shared NGE reference data", () => {
        const state = CreateTestState([], vi.fn());
        const controller = new AbortController();
        const tools = CreateNodeGeometryWebMcpTools(state);

        expect(FindTool(tools, "get_node_geometry_enums").execute({}, { signal: controller.signal })).toEqual({
            catalog: NgeEnumCatalog,
            markdown: GetNgeEnumsReference(),
        });
        expect(FindTool(tools, "get_node_geometry_concepts").execute({}, { signal: controller.signal })).toEqual({
            markdown: NgeConceptsMarkdown,
        });
    });

    it("continues editing after creating an empty geometry", () => {
        const state = CreateTestState([], vi.fn());
        const controller = new AbortController();
        let currentGeometry: Record<string, unknown> = {
            customType: "BABYLON.NodeGeometry",
            outputNodeId: 1,
            blocks: [],
        };
        vi.spyOn(SerializationTools, "Serialize").mockImplementation(() => {
            const serializedGeometry = { ...currentGeometry };
            if (serializedGeometry.outputNodeId === -1) {
                delete serializedGeometry.outputNodeId;
            }
            return JSON.stringify(serializedGeometry);
        });
        vi.spyOn(SerializationTools, "Deserialize").mockImplementation((value) => {
            currentGeometry = value as Record<string, unknown>;
        });
        state.webMcpEditor = {
            applyIncrementalUpdate: vi.fn((_before, after) => {
                currentGeometry = after as unknown as Record<string, unknown>;
                return new Map(after.blocks.map((block) => [block.id, block.id]));
            }),
        } as unknown as GlobalState["webMcpEditor"];

        const tools = CreateNodeGeometryWebMcpTools(state);
        expect(FindTool(tools, "create_current_node_geometry").execute({}, { signal: controller.signal })).toEqual({
            success: true,
            blockCount: 0,
        });
        expect(FindTool(tools, "get_current_node_geometry").execute({}, { signal: controller.signal })).toMatchObject({
            outputNodeId: -1,
            blocks: [],
        });
        expect(FindTool(tools, "add_block").execute({ blockType: "BoxBlock" }, { signal: controller.signal })).toMatchObject({
            success: true,
            blockCount: 1,
        });
    });

    it("reads and incrementally edits the current geometry", () => {
        const registrations: IRegistration[] = [];
        const state = CreateTestState(registrations, vi.fn());
        const controller = new AbortController();
        let currentGeometry: ISerializedGeometry = {
            customType: "BABYLON.NodeGeometry",
            outputNodeId: -1,
            blocks: [],
        };
        let nextRuntimeId = 100;
        vi.spyOn(SerializationTools, "Serialize").mockImplementation(() => JSON.stringify(currentGeometry));
        const deserialize = vi.spyOn(SerializationTools, "Deserialize").mockImplementation((value) => {
            currentGeometry = RemapGeometryIds(value, nextRuntimeId);
            nextRuntimeId += currentGeometry.blocks.length + 1;
        });
        state.webMcpEditor = {
            applyIncrementalUpdate: vi.fn((_before, after) => {
                currentGeometry = RemapGeometryIds(after, nextRuntimeId);
                nextRuntimeId += currentGeometry.blocks.length + 1;
                return new Map(after.blocks.map((block, index) => [block.id, currentGeometry.blocks[index].id]));
            }),
        } as unknown as GlobalState["webMcpEditor"];

        const tools = CreateNodeGeometryWebMcpTools(state);
        const getTool = FindTool(tools, "get_current_node_geometry");
        const addTool = FindTool(tools, "add_block");
        const connectTool = FindTool(tools, "connect_blocks");

        expect(getTool.execute({}, { signal: controller.signal })).toEqual(currentGeometry);
        expect(addTool.execute({ blockType: "BoxBlock", name: "Box" }, { signal: controller.signal })).toMatchObject({
            success: true,
            blockCount: 1,
            block: {
                id: 1,
                name: "Box",
                customType: "BABYLON.BoxBlock",
            },
        });
        currentGeometry.blocks[0].name = "Box renamed by user";
        currentGeometry.editorData = {
            locations: [{ blockId: currentGeometry.blocks[0].id, x: 125, y: 75 }],
        };
        expect(getTool.execute({}, { signal: controller.signal })).toMatchObject({
            blocks: [{ id: 1, name: "Box renamed by user" }],
            editorData: {
                locations: [{ blockId: 1, x: 125, y: 75 }],
            },
        });
        expect(addTool.execute({ blockType: "GeometryOutputBlock", name: "Output" }, { signal: controller.signal })).toMatchObject({
            success: true,
            blockCount: 2,
            block: {
                id: 2,
                customType: "BABYLON.GeometryOutputBlock",
            },
        });
        expect(
            connectTool.execute(
                {
                    sourceBlockId: 1,
                    outputName: "geometry",
                    targetBlockId: 2,
                    inputName: "geometry",
                },
                { signal: controller.signal }
            )
        ).toMatchObject({
            success: true,
            blockCount: 2,
        });

        const exposedGeometry = getTool.execute({}, { signal: controller.signal }) as ISerializedGeometry;
        expect(exposedGeometry.outputNodeId).toBe(2);
        expect(exposedGeometry.blocks).toHaveLength(2);
        expect(exposedGeometry.blocks[1].inputs[0]).toMatchObject({
            targetBlockId: 1,
            targetConnectionName: "geometry",
        });
        expect(currentGeometry.outputNodeId).not.toBe(exposedGeometry.outputNodeId);
        expect(deserialize).not.toHaveBeenCalled();
    });

    it("preserves logical ids when editor history remaps runtime ids", () => {
        const state = CreateTestState([], vi.fn());
        const controller = new AbortController();
        let currentGeometry: ISerializedGeometry = {
            customType: "BABYLON.NodeGeometry",
            outputNodeId: -1,
            blocks: [
                {
                    customType: "BABYLON.BoxBlock",
                    id: 100,
                    name: "Box",
                    inputs: [],
                    outputs: [{ name: "geometry" }],
                },
            ],
        };
        vi.spyOn(SerializationTools, "Serialize").mockImplementation(() => JSON.stringify(currentGeometry));

        const getTool = FindTool(CreateNodeGeometryWebMcpTools(state), "get_current_node_geometry");
        expect((getTool.execute({}, { signal: controller.signal }) as ISerializedGeometry).blocks[0].id).toBe(100);

        currentGeometry = {
            ...currentGeometry,
            blocks: [{ ...currentGeometry.blocks[0], id: 500 }],
            editorData: {
                locations: [{ blockId: 500, x: 10, y: 20 }],
                map: { 100: 500 },
            } as ISerializedGeometry["editorData"],
        };

        const afterHistoryUpdate = getTool.execute({}, { signal: controller.signal }) as ISerializedGeometry;
        expect(afterHistoryUpdate.blocks[0].id).toBe(100);
        expect(afterHistoryUpdate.editorData?.locations[0].blockId).toBe(100);
        expect((afterHistoryUpdate.editorData as { map?: Record<string, number> }).map).toBeUndefined();
    });

    it("returns a URL whose fragment decodes to the current geometry", () => {
        const state = CreateTestState([], vi.fn());
        const controller = new AbortController();
        const geometry: ISerializedGeometry = {
            customType: "BABYLON.NodeGeometry",
            outputNodeId: -1,
            blocks: [],
            comment: "Unicode survives: \u03c0",
        };
        vi.spyOn(SerializationTools, "Serialize").mockReturnValue(JSON.stringify(geometry));

        const result = FindTool(CreateNodeGeometryWebMcpTools(state), "get_current_node_geometry_url").execute({}, { signal: controller.signal }) as { url: string };
        const url = new URL(result.url);

        expect(url.hash).toMatch(/^#nge=/u);
        expect(DecodeNodeGeometryUrlHash(url.hash, state.hostWindow)).toEqual(geometry);
    });

    it("keeps reads available while a legacy session owns mutations", () => {
        const state = CreateTestState([], vi.fn());
        const controller = new AbortController();
        const serializedGeometry = {
            customType: "BABYLON.NodeGeometry",
            outputNodeId: -1,
            blocks: [],
        };
        state.mcpSessionConnected = true;
        vi.spyOn(SerializationTools, "Serialize").mockReturnValue(JSON.stringify(serializedGeometry));

        const tools = CreateNodeGeometryWebMcpTools(state);
        expect(FindTool(tools, "get_current_node_geometry").execute({}, { signal: controller.signal })).toEqual(serializedGeometry);
        expect(() =>
            FindTool(tools, "add_block").execute(
                {
                    blockType: "BoxBlock",
                },
                { signal: controller.signal }
            )
        ).toThrow("connected to a legacy MCP session");
    });

    it("re-checks mutation ownership after loading a snippet", async () => {
        const state = CreateTestState([], vi.fn());
        const controller = new AbortController();
        const deserialize = vi.spyOn(SerializationTools, "Deserialize").mockImplementation(() => {});
        let resolveLoad!: (result: unknown) => void;
        mockLoadSnippet.mockReturnValue(
            new Promise((resolve) => {
                resolveLoad = resolve;
            })
        );

        const importPromise = Promise.resolve(
            FindTool(CreateNodeGeometryWebMcpTools(state), "import_current_node_geometry_from_snippet").execute({ snippetId: "ABC123" }, { signal: controller.signal })
        );
        state.mcpSessionConnected = true;
        resolveLoad({
            snippetId: "ABC123",
            type: "nodeGeometry",
            metadata: {
                name: "",
                description: "",
                tags: "",
            },
            data: {
                customType: "BABYLON.NodeGeometry",
                outputNodeId: -1,
                blocks: [],
            },
        });

        await expect(importPromise).rejects.toThrow("connected to a legacy MCP session");
        expect(deserialize).not.toHaveBeenCalled();
    });

    it("rejects malformed or unsupported replacement blocks without changing the editor", () => {
        const state = CreateTestState([], vi.fn());
        const controller = new AbortController();
        const deserialize = vi.spyOn(SerializationTools, "Deserialize").mockImplementation(() => {});
        const replaceTool = FindTool(CreateNodeGeometryWebMcpTools(state), "replace_current_node_geometry");

        expect(() => replaceTool.execute({ nodeGeometry: {} }, { signal: controller.signal })).toThrow('nodeGeometry.customType must be "BABYLON.NodeGeometry".');
        expect(() =>
            replaceTool.execute(
                {
                    nodeGeometry: {
                        customType: "BABYLON.NodeGeometry",
                        blocks: [
                            {
                                customType: "BABYLON.UnsupportedBlock",
                                id: 1,
                                name: "Unsupported",
                                inputs: [],
                                outputs: [],
                            },
                        ],
                    },
                },
                { signal: controller.signal }
            )
        ).toThrow("nodeGeometry.blocks[0].customType must identify a supported Node Geometry block.");
        expect(() =>
            replaceTool.execute(
                {
                    nodeGeometry: {
                        customType: "BABYLON.NodeGeometry",
                        blocks: [
                            {
                                customType: "BABYLON.BoxBlock",
                                id: 1,
                                name: "Malformed",
                                inputs: [],
                            },
                        ],
                    },
                },
                { signal: controller.signal }
            )
        ).toThrow("nodeGeometry.blocks[0].outputs must be an array.");
        expect(deserialize).not.toHaveBeenCalled();
    });
});
