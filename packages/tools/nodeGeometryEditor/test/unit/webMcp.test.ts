import { afterEach, describe, expect, it, vi } from "vitest";

import { GeometryGraphManager, GetNgeEnumsReference, NgeConceptsMarkdown, NgeEnumCatalog, type ISerializedGeometry } from "@tools/nge-mcp-common";
import { type NodeGeometryBlock } from "core/Meshes/Node/nodeGeometryBlock";
import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";
import { GeometryInputBlock } from "core/Meshes/Node/Blocks/geometryInputBlock";
import { TeleportInBlock } from "core/Meshes/Node/Blocks/Teleport/teleportInBlock";
import { TeleportOutBlock } from "core/Meshes/Node/Blocks/Teleport/teleportOutBlock";
import { Vector3 } from "core/Maths/math.vector";

const { mockLoadSnippet } = vi.hoisted(() => ({
    mockLoadSnippet: vi.fn(),
}));

vi.mock("@tools/snippet-loader", () => ({
    LoadSnippet: (...args: unknown[]) => mockLoadSnippet(...args),
    SaveSnippet: vi.fn(),
}));

import { type GlobalState } from "../../src/globalState";
import { DecodeNodeGeometryUrlHash } from "../../src/encodedGeometryUrl";
import { ConnectionPointPortData } from "../../src/graphSystem/connectionPointPortData";
import { SerializationTools } from "../../src/serializationTools";
import { type IWebMcpTool, CreateNodeGeometryWebMcpTools, IsNodeGeometryWebMcpSupported, RegisterNodeGeometryWebMcpToolsAsync } from "../../src/webMcp";
import { NodeGeometryWebMcpEditor } from "../../src/webMcpEditor";

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

    geometry.blocks = geometry.blocks.map((block) => {
        const remappedBlock: ISerializedGeometry["blocks"][number] = {
            ...block,
            id: idMap.get(block.id)!,
            inputs: block.inputs.map((input) => ({
                ...input,
                targetBlockId: input.targetBlockId === undefined ? undefined : (idMap.get(input.targetBlockId) ?? input.targetBlockId),
            })),
        };
        if (remappedBlock.customType === "BABYLON.TeleportOutBlock" && typeof remappedBlock.entryPoint === "number") {
            remappedBlock.entryPoint = idMap.get(remappedBlock.entryPoint) ?? remappedBlock.entryPoint;
        }
        return remappedBlock;
    });
    geometry.outputNodeId = idMap.get(geometry.outputNodeId) ?? -1;
    if (geometry.editorData) {
        geometry.editorData.locations = geometry.editorData.locations.map((location) => ({
            ...location,
            blockId: idMap.get(location.blockId) ?? location.blockId,
        }));
        geometry.editorData.frames = geometry.editorData.frames?.map((frame) => ({
            ...frame,
            blocks: frame.blocks.map((blockId) => idMap.get(blockId) ?? blockId),
        }));
    }
    return geometry;
}

function CreateTeleportGeometry(entryPointId: number): ISerializedGeometry {
    return {
        customType: "BABYLON.NodeGeometry",
        outputNodeId: -1,
        blocks: [
            {
                customType: "BABYLON.TeleportInBlock",
                id: 1,
                name: "First entry",
                inputs: [{ name: "input" }],
                outputs: [],
            },
            {
                customType: "BABYLON.TeleportOutBlock",
                id: 2,
                name: "Exit",
                entryPoint: entryPointId,
                inputs: [],
                outputs: [{ name: "output" }],
            },
            {
                customType: "BABYLON.TeleportInBlock",
                id: 3,
                name: "Second entry",
                inputs: [{ name: "input" }],
                outputs: [],
            },
        ],
        editorData: {
            locations: [
                { blockId: 1, x: 0, y: 0 },
                { blockId: 2, x: 200, y: 0 },
                { blockId: 3, x: 0, y: 200 },
            ],
            frames: [{ blocks: [1, 2], name: "Teleport frame" }],
        },
    };
}

function CreateLiveEditorHarness() {
    const attachedBlocks: NodeGeometryBlock[] = [];
    const links: Array<{
        source: ConnectionPointPortData;
        target: ConnectionPointPortData;
        dispose: ReturnType<typeof vi.fn>;
    }> = [];
    const nodes: Array<{
        x: number;
        y: number;
        content: {
            data: NodeGeometryBlock;
            inputs: ConnectionPointPortData[];
            outputs: ConnectionPointPortData[];
        };
        cleanAccumulation: ReturnType<typeof vi.fn>;
        dispose: ReturnType<typeof vi.fn>;
        refresh: ReturnType<typeof vi.fn>;
        getLinksForPortData: (port: ConnectionPointPortData) => typeof links;
    }> = [];
    const nodeGeometry = {
        attachedBlocks,
        outputBlock: null,
        removeBlock: (block: NodeGeometryBlock) => {
            attachedBlocks.splice(attachedBlocks.indexOf(block), 1);
        },
    };
    const graphCanvas = {
        nodes,
        links,
        selectedNodes: [],
        selectedLink: null,
        findNodeFromData: (block: NodeGeometryBlock) => nodes.find((node) => node.content.data === block),
        removeDataFromCache: vi.fn(),
        connectNodes: (
            _sourceNode: (typeof nodes)[number],
            source: ConnectionPointPortData,
            _targetNode: (typeof nodes)[number],
            target: ConnectionPointPortData
        ) => {
            source.connectTo(target);
            const link = {
                source,
                target,
                dispose: vi.fn(() => {
                    source.disconnectFrom(target);
                    links.splice(links.indexOf(link), 1);
                }),
            };
            links.push(link);
        },
    };
    const globalState = {
        nodeGeometry,
        stateManager: {
            onSelectionChangedObservable: { notifyObservers: vi.fn() },
            onRebuildRequiredObservable: { notifyObservers: vi.fn() },
        },
    };
    const editor = new NodeGeometryWebMcpEditor(
        globalState as unknown as GlobalState,
        graphCanvas as unknown as ConstructorParameters<typeof NodeGeometryWebMcpEditor>[1],
        (block) => {
            attachedBlocks.push(block);
            const inputs = block.inputs.map((input) => new ConnectionPointPortData(input, graphCanvas as unknown as ConstructorParameters<typeof ConnectionPointPortData>[1]));
            const outputs = block.outputs.map((output) => new ConnectionPointPortData(output, graphCanvas as unknown as ConstructorParameters<typeof ConnectionPointPortData>[1]));
            const node = {
                x: 0,
                y: 0,
                content: { data: block, inputs, outputs },
                cleanAccumulation: vi.fn(),
                dispose: vi.fn(),
                refresh: vi.fn(),
                getLinksForPortData: (port: ConnectionPointPortData) => links.filter((link) => link.source === port || link.target === port),
            };
            nodes.push(node);
            return node as unknown as ReturnType<ConstructorParameters<typeof NodeGeometryWebMcpEditor>[2]>;
        },
        vi.fn()
    );
    return { attachedBlocks, editor };
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

    it("preserves Teleport and frame references across replacement round trips", () => {
        const state = CreateTestState([], vi.fn());
        const controller = new AbortController();
        let currentGeometry: ISerializedGeometry = {
            customType: "BABYLON.NodeGeometry",
            outputNodeId: -1,
            blocks: [],
        };
        let nextRuntimeId = 100;
        vi.spyOn(SerializationTools, "Serialize").mockImplementation(() => JSON.stringify(currentGeometry));
        vi.spyOn(SerializationTools, "Deserialize").mockImplementation((value) => {
            currentGeometry = RemapGeometryIds(value, nextRuntimeId);
            nextRuntimeId += 100;
        });

        const tools = CreateNodeGeometryWebMcpTools(state);
        const replaceTool = FindTool(tools, "replace_current_node_geometry");
        const getTool = FindTool(tools, "get_current_node_geometry");
        const logicalGeometry = CreateTeleportGeometry(1);

        expect(replaceTool.execute({ nodeGeometry: logicalGeometry }, { signal: controller.signal })).toMatchObject({ success: true, blockCount: 3 });
        const firstRead = getTool.execute({}, { signal: controller.signal }) as ISerializedGeometry;
        expect(firstRead.blocks.find((block) => block.id === 2)?.entryPoint).toBe(1);
        expect(firstRead.editorData?.frames?.[0].blocks).toEqual([1, 2]);

        expect(replaceTool.execute({ nodeGeometry: firstRead }, { signal: controller.signal })).toMatchObject({ success: true, blockCount: 3 });
        const secondRead = getTool.execute({}, { signal: controller.signal }) as ISerializedGeometry;
        expect(secondRead.blocks.find((block) => block.id === 2)?.entryPoint).toBe(1);
        expect(secondRead.editorData?.frames?.[0].blocks).toEqual([1, 2]);
    });

    it("attaches and retargets Teleport endpoints during live updates", () => {
        const { attachedBlocks, editor } = CreateLiveEditorHarness();
        const emptyGeometry: ISerializedGeometry = {
            customType: "BABYLON.NodeGeometry",
            outputNodeId: -1,
            blocks: [],
        };
        const firstGeometry = CreateTeleportGeometry(1);

        const mapping = editor.applyIncrementalUpdate(emptyGeometry, firstGeometry, new Map());
        const firstEntry = attachedBlocks.find((block) => block.uniqueId === mapping.get(1)) as TeleportInBlock;
        const endpoint = attachedBlocks.find((block) => block.uniqueId === mapping.get(2)) as TeleportOutBlock;
        const secondEntry = attachedBlocks.find((block) => block.uniqueId === mapping.get(3)) as TeleportInBlock;

        expect(firstEntry).toBeInstanceOf(TeleportInBlock);
        expect(endpoint).toBeInstanceOf(TeleportOutBlock);
        expect(secondEntry).toBeInstanceOf(TeleportInBlock);
        expect(endpoint.entryPoint).toBe(firstEntry);
        expect(firstEntry.endpoints).toContain(endpoint);

        const retargetedGeometry = CreateTeleportGeometry(3);
        const retargetedMapping = editor.applyIncrementalUpdate(firstGeometry, retargetedGeometry, mapping);

        expect(endpoint.entryPoint).toBe(secondEntry);
        expect(firstEntry.endpoints).not.toContain(endpoint);
        expect(secondEntry.endpoints).toContain(endpoint);

        const withoutEndpoint = {
            ...retargetedGeometry,
            blocks: retargetedGeometry.blocks.filter((block) => block.id !== 2),
        };
        editor.applyIncrementalUpdate(retargetedGeometry, withoutEndpoint, retargetedMapping);
        expect(secondEntry.endpoints).not.toContain(endpoint);
    });

    it("applies Teleport removal after disconnecting consumers invalidated by dynamic type changes", () => {
        const { attachedBlocks, editor } = CreateLiveEditorHarness();
        const manager = new GeometryGraphManager();
        manager.createGeometry("dynamicRemoval");

        const scalarId = (manager.addBlock("dynamicRemoval", "GeometryInputBlock", "scalar", { type: "Float", value: 1 }) as any).block.id;
        const vectorId = (manager.addBlock("dynamicRemoval", "GeometryInputBlock", "vector", { type: "Vector3", value: { x: 1, y: 2, z: 3 } }) as any).block.id;
        const entryId = (manager.addBlock("dynamicRemoval", "TeleportInBlock", "entry") as any).block.id;
        const endpointId = (manager.addBlock("dynamicRemoval", "TeleportOutBlock", "endpoint", { entryPoint: entryId }) as any).block.id;
        const mathId = (manager.addBlock("dynamicRemoval", "MathBlock", "math") as any).block.id;
        const setPositionsId = (manager.addBlock("dynamicRemoval", "SetPositionsBlock", "set positions") as any).block.id;

        expect(manager.connectBlocks("dynamicRemoval", scalarId, "output", mathId, "left")).toBe("OK");
        expect(manager.connectBlocks("dynamicRemoval", vectorId, "output", entryId, "input")).toBe("OK");
        expect(manager.connectBlocks("dynamicRemoval", endpointId, "output", mathId, "right")).toBe("OK");
        expect(manager.connectBlocks("dynamicRemoval", mathId, "output", setPositionsId, "positions")).toBe("OK");

        const before = JSON.parse(manager.exportJSON("dynamicRemoval")!) as ISerializedGeometry;
        const emptyGeometry: ISerializedGeometry = {
            customType: "BABYLON.NodeGeometry",
            outputNodeId: -1,
            blocks: [],
        };
        const mapping = editor.applyIncrementalUpdate(emptyGeometry, before, new Map());

        expect(manager.removeBlock("dynamicRemoval", entryId)).toBe("OK");
        const after = JSON.parse(manager.exportJSON("dynamicRemoval")!) as ISerializedGeometry;
        expect(() => editor.applyIncrementalUpdate(before, after, mapping)).not.toThrow();

        const math = attachedBlocks.find((block) => block.uniqueId === mapping.get(mathId))!;
        const setPositions = attachedBlocks.find((block) => block.uniqueId === mapping.get(setPositionsId))!;
        expect(math.inputs.find((input) => input.name === "right")?.isConnected).toBe(false);
        expect(setPositions.inputs.find((input) => input.name === "positions")?.isConnected).toBe(false);
    });

    it("preserves live consumers typed through a surviving linked input", () => {
        const { attachedBlocks, editor } = CreateLiveEditorHarness();
        const manager = new GeometryGraphManager();
        manager.createGeometry("linkedInputRemoval");

        const minId = (manager.addBlock("linkedInputRemoval", "GeometryInputBlock", "min", { type: "Vector3", value: { x: 0, y: 0, z: 0 } }) as any).block.id;
        const maxId = (manager.addBlock("linkedInputRemoval", "GeometryInputBlock", "max", { type: "Vector3", value: { x: 1, y: 1, z: 1 } }) as any).block.id;
        const randomId = (manager.addBlock("linkedInputRemoval", "RandomBlock", "random") as any).block.id;
        const setPositionsId = (manager.addBlock("linkedInputRemoval", "SetPositionsBlock", "set positions") as any).block.id;

        expect(manager.connectBlocks("linkedInputRemoval", minId, "output", randomId, "min")).toBe("OK");
        expect(manager.connectBlocks("linkedInputRemoval", maxId, "output", randomId, "max")).toBe("OK");
        expect(manager.connectBlocks("linkedInputRemoval", randomId, "output", setPositionsId, "positions")).toBe("OK");

        const before = JSON.parse(manager.exportJSON("linkedInputRemoval")!) as ISerializedGeometry;
        const emptyGeometry: ISerializedGeometry = {
            customType: "BABYLON.NodeGeometry",
            outputNodeId: -1,
            blocks: [],
        };
        const mapping = editor.applyIncrementalUpdate(emptyGeometry, before, new Map());

        expect(manager.removeBlock("linkedInputRemoval", minId)).toBe("OK");
        const after = JSON.parse(manager.exportJSON("linkedInputRemoval")!) as ISerializedGeometry;
        expect(() => editor.applyIncrementalUpdate(before, after, mapping)).not.toThrow();

        const random = attachedBlocks.find((block) => block.uniqueId === mapping.get(randomId))!;
        const setPositions = attachedBlocks.find((block) => block.uniqueId === mapping.get(setPositionsId))!;
        expect(random.inputs.find((input) => input.name === "max")?.isConnected).toBe(true);
        expect(setPositions.inputs.find((input) => input.name === "positions")?.isConnected).toBe(true);
    });

    it("applies an output default before a surviving linked input", () => {
        const { attachedBlocks, editor } = CreateLiveEditorHarness();
        const manager = new GeometryGraphManager();
        manager.createGeometry("defaultTypeRemoval");

        const trueId = (manager.addBlock("defaultTypeRemoval", "GeometryInputBlock", "true", { type: "Vector3", value: { x: 0, y: 0, z: 0 } }) as any).block.id;
        const falseId = (manager.addBlock("defaultTypeRemoval", "GeometryInputBlock", "false", { type: "Vector3", value: { x: 1, y: 1, z: 1 } }) as any).block.id;
        const conditionId = (manager.addBlock("defaultTypeRemoval", "ConditionBlock", "condition") as any).block.id;
        const setPositionsId = (manager.addBlock("defaultTypeRemoval", "SetPositionsBlock", "set positions") as any).block.id;

        expect(manager.connectBlocks("defaultTypeRemoval", trueId, "output", conditionId, "ifTrue")).toBe("OK");
        expect(manager.connectBlocks("defaultTypeRemoval", falseId, "output", conditionId, "ifFalse")).toBe("OK");
        expect(manager.connectBlocks("defaultTypeRemoval", conditionId, "output", setPositionsId, "positions")).toBe("OK");

        const before = JSON.parse(manager.exportJSON("defaultTypeRemoval")!) as ISerializedGeometry;
        const emptyGeometry: ISerializedGeometry = {
            customType: "BABYLON.NodeGeometry",
            outputNodeId: -1,
            blocks: [],
        };
        const mapping = editor.applyIncrementalUpdate(emptyGeometry, before, new Map());

        expect(manager.removeBlock("defaultTypeRemoval", trueId)).toBe("OK");
        const after = JSON.parse(manager.exportJSON("defaultTypeRemoval")!) as ISerializedGeometry;
        expect(() => editor.applyIncrementalUpdate(before, after, mapping)).not.toThrow();

        const condition = attachedBlocks.find((block) => block.uniqueId === mapping.get(conditionId))!;
        const setPositions = attachedBlocks.find((block) => block.uniqueId === mapping.get(setPositionsId))!;
        expect(condition.inputs.find((input) => input.name === "ifFalse")?.isConnected).toBe(true);
        expect(setPositions.inputs.find((input) => input.name === "positions")?.isConnected).toBe(false);
    });

    it("refreshes downstream live types after an upstream output type changes", () => {
        const { attachedBlocks, editor } = CreateLiveEditorHarness();
        const manager = new GeometryGraphManager();
        manager.createGeometry("chainedTypeRefresh");

        const trueId = (manager.addBlock("chainedTypeRefresh", "GeometryInputBlock", "true", { type: "Vector3", value: { x: 0, y: 0, z: 0 } }) as any).block.id;
        const falseId = (manager.addBlock("chainedTypeRefresh", "GeometryInputBlock", "false", { type: "Vector3", value: { x: 1, y: 1, z: 1 } }) as any).block.id;
        const rightId = (manager.addBlock("chainedTypeRefresh", "GeometryInputBlock", "right", { type: "Vector3", value: { x: 2, y: 2, z: 2 } }) as any).block.id;
        const conditionId = (manager.addBlock("chainedTypeRefresh", "ConditionBlock", "condition") as any).block.id;
        const mathId = (manager.addBlock("chainedTypeRefresh", "MathBlock", "math") as any).block.id;
        const setPositionsId = (manager.addBlock("chainedTypeRefresh", "SetPositionsBlock", "set positions") as any).block.id;

        expect(manager.connectBlocks("chainedTypeRefresh", trueId, "output", conditionId, "ifTrue")).toBe("OK");
        expect(manager.connectBlocks("chainedTypeRefresh", falseId, "output", conditionId, "ifFalse")).toBe("OK");
        expect(manager.connectBlocks("chainedTypeRefresh", conditionId, "output", mathId, "left")).toBe("OK");
        expect(manager.connectBlocks("chainedTypeRefresh", rightId, "output", mathId, "right")).toBe("OK");
        expect(manager.connectBlocks("chainedTypeRefresh", mathId, "output", setPositionsId, "positions")).toBe("OK");

        const before = JSON.parse(manager.exportJSON("chainedTypeRefresh")!) as ISerializedGeometry;
        const emptyGeometry: ISerializedGeometry = {
            customType: "BABYLON.NodeGeometry",
            outputNodeId: -1,
            blocks: [],
        };
        const mapping = editor.applyIncrementalUpdate(emptyGeometry, before, new Map());

        expect(manager.removeBlock("chainedTypeRefresh", trueId)).toBe("OK");
        const afterRemoval = JSON.parse(manager.exportJSON("chainedTypeRefresh")!) as ISerializedGeometry;
        const afterRemovalMapping = editor.applyIncrementalUpdate(before, afterRemoval, mapping);

        const condition = attachedBlocks.find((block) => block.uniqueId === mapping.get(conditionId))!;
        const math = attachedBlocks.find((block) => block.uniqueId === mapping.get(mathId))!;
        const setPositions = attachedBlocks.find((block) => block.uniqueId === mapping.get(setPositionsId))!;
        expect(condition.outputs.find((output) => output.name === "output")?.type).toBe(NodeGeometryBlockConnectionPointTypes.Float);
        expect(math.outputs.find((output) => output.name === "output")?.type).toBe(NodeGeometryBlockConnectionPointTypes.Vector3);
        expect(setPositions.inputs.find((input) => input.name === "positions")?.isConnected).toBe(true);

        const secondSetPositionsId = (manager.addBlock("chainedTypeRefresh", "SetPositionsBlock", "second set positions") as any).block.id;
        expect(manager.connectBlocks("chainedTypeRefresh", mathId, "output", secondSetPositionsId, "positions")).toBe("OK");
        const afterConnection = JSON.parse(manager.exportJSON("chainedTypeRefresh")!) as ISerializedGeometry;
        const afterConnectionMapping = editor.applyIncrementalUpdate(afterRemoval, afterConnection, afterRemovalMapping);

        const secondSetPositions = attachedBlocks.find((block) => block.uniqueId === afterConnectionMapping.get(secondSetPositionsId))!;
        expect(secondSetPositions.inputs.find((input) => input.name === "positions")?.isConnected).toBe(true);
    });

    it("deserializes changed vector inputs as Babylon vector values", () => {
        const { attachedBlocks, editor } = CreateLiveEditorHarness();
        const manager = new GeometryGraphManager();
        manager.createGeometry("input");
        const addResult = manager.addBlock("input", "GeometryInputBlock", "Value", { type: "Float", value: 1 });
        expect(typeof addResult).not.toBe("string");

        const scalarGeometry = JSON.parse(manager.exportJSON("input")!) as ISerializedGeometry;
        const emptyGeometry: ISerializedGeometry = {
            customType: "BABYLON.NodeGeometry",
            outputNodeId: -1,
            blocks: [],
        };
        const mapping = editor.applyIncrementalUpdate(emptyGeometry, scalarGeometry, new Map());

        expect(manager.setBlockProperties("input", scalarGeometry.blocks[0].id, { type: "Vector3", value: { x: 1, y: 2, z: 3 } })).toBe("OK");
        const vectorGeometry = JSON.parse(manager.exportJSON("input")!) as ISerializedGeometry;
        editor.applyIncrementalUpdate(scalarGeometry, vectorGeometry, mapping);

        const input = attachedBlocks[0] as GeometryInputBlock;
        expect(input).toBeInstanceOf(GeometryInputBlock);
        expect(input.value).toBeInstanceOf(Vector3);
        expect(input.value.asArray()).toEqual([1, 2, 3]);
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
