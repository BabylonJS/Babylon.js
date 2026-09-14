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
        expect(registrations[15].tool.execute({}, new AbortController().signal)).toEqual({
            catalog: NgeEnumCatalog,
            markdown: GetNgeEnumsReference(),
        });
    });

    it("exposes the shared NGE reference data", () => {
        const state = CreateTestState([], vi.fn());
        const controller = new AbortController();
        const tools = CreateNodeGeometryWebMcpTools(state);

        expect(FindTool(tools, "get_node_geometry_enums").execute({}, controller.signal)).toEqual({
            catalog: NgeEnumCatalog,
            markdown: GetNgeEnumsReference(),
        });
        expect(FindTool(tools, "get_node_geometry_concepts").execute({}, controller.signal)).toEqual({
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

        const tools = CreateNodeGeometryWebMcpTools(state);
        expect(FindTool(tools, "create_current_node_geometry").execute({}, controller.signal)).toEqual({
            success: true,
            blockCount: 0,
        });
        expect(FindTool(tools, "get_current_node_geometry").execute({}, controller.signal)).toMatchObject({
            outputNodeId: -1,
            blocks: [],
        });
        expect(FindTool(tools, "add_block").execute({ blockType: "BoxBlock" }, controller.signal)).toMatchObject({
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

        const tools = CreateNodeGeometryWebMcpTools(state);
        const getTool = FindTool(tools, "get_current_node_geometry");
        const addTool = FindTool(tools, "add_block");
        const connectTool = FindTool(tools, "connect_blocks");

        expect(getTool.execute({}, controller.signal)).toEqual(currentGeometry);
        expect(addTool.execute({ blockType: "BoxBlock", name: "Box" }, controller.signal)).toMatchObject({
            success: true,
            blockCount: 1,
            block: {
                id: 1,
                name: "Box",
                customType: "BABYLON.BoxBlock",
            },
        });
        expect(addTool.execute({ blockType: "GeometryOutputBlock", name: "Output" }, controller.signal)).toMatchObject({
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
                controller.signal
            )
        ).toMatchObject({
            success: true,
            blockCount: 2,
        });

        const exposedGeometry = getTool.execute({}, controller.signal) as ISerializedGeometry;
        expect(exposedGeometry.outputNodeId).toBe(2);
        expect(exposedGeometry.blocks).toHaveLength(2);
        expect(exposedGeometry.blocks[1].inputs[0]).toMatchObject({
            targetBlockId: 1,
            targetConnectionName: "geometry",
        });
        expect(currentGeometry.outputNodeId).not.toBe(exposedGeometry.outputNodeId);
        expect(deserialize).toHaveBeenCalledTimes(3);
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
        expect(FindTool(tools, "get_current_node_geometry").execute({}, controller.signal)).toEqual(serializedGeometry);
        expect(() =>
            FindTool(tools, "add_block").execute(
                {
                    blockType: "BoxBlock",
                },
                controller.signal
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
            FindTool(CreateNodeGeometryWebMcpTools(state), "import_current_node_geometry_from_snippet").execute({ snippetId: "ABC123" }, controller.signal)
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

        expect(() => replaceTool.execute({ nodeGeometry: {} }, controller.signal)).toThrow('nodeGeometry.customType must be "BABYLON.NodeGeometry".');
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
                controller.signal
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
                controller.signal
            )
        ).toThrow("nodeGeometry.blocks[0].outputs must be an array.");
        expect(deserialize).not.toHaveBeenCalled();
    });
});
