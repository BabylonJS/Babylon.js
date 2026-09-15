import { GetClass } from "core/Misc/typeStore";
import { type NodeGeometryBlock } from "core/Meshes/Node/nodeGeometryBlock";
import { type TeleportInBlock } from "core/Meshes/Node/Blocks/Teleport/teleportInBlock";
import { type TeleportOutBlock } from "core/Meshes/Node/Blocks/Teleport/teleportOutBlock";
import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes/Node/Enums/nodeGeometryConnectionPointTypes";
import { type GraphCanvasComponent } from "shared-ui-components/nodeGraphSystem/graphCanvas";
import { type GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import { type IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";
import { type ISerializedBlock, type ISerializedConnectionPoint, type ISerializedGeometry } from "@tools/nge-mcp-common";

import { type GlobalState } from "./globalState";

/**
 * Applies validated WebMCP graph changes directly to the live editor.
 */
export class NodeGeometryWebMcpEditor {
    public constructor(
        private readonly _globalState: GlobalState,
        private readonly _graphCanvas: GraphCanvasComponent,
        private readonly _appendBlock: (block: NodeGeometryBlock) => GraphNode,
        private readonly _requestRender: () => void
    ) {}

    /**
     * Applies one validated logical-document update without replacing the editor document.
     * @param before - Logical document before the mutation.
     * @param after - Logical document after the mutation.
     * @param logicalToRuntime - Current logical-to-runtime block id mapping.
     * @returns The updated logical-to-runtime block id mapping.
     */
    public applyIncrementalUpdate(before: ISerializedGeometry, after: ISerializedGeometry, logicalToRuntime: ReadonlyMap<number, number>): ReadonlyMap<number, number> {
        this._validateDocument(after);
        const updatedMapping = new Map(logicalToRuntime);
        const beforeById = new Map(before.blocks.map((block) => [block.id, block]));
        const afterById = new Map(after.blocks.map((block) => [block.id, block]));
        const changedInputs = this._findChangedInputs(beforeById, afterById);
        const selectedNodes = this._graphCanvas.selectedNodes.slice();
        const selectedLink = this._graphCanvas.selectedLink;

        for (const { blockId, inputName } of changedInputs) {
            const runtimeId = updatedMapping.get(blockId);
            const block = runtimeId === undefined ? undefined : this._findRuntimeBlock(runtimeId);
            const node = block && this._graphCanvas.findNodeFromData(block);
            const input = node?.content.inputs.find((candidate) => candidate.internalName === inputName);
            if (node && input) {
                for (const link of node.getLinksForPortData(input).slice()) {
                    link.dispose();
                }
            }
        }

        for (const logicalId of beforeById.keys()) {
            if (afterById.has(logicalId)) {
                continue;
            }

            const runtimeId = updatedMapping.get(logicalId);
            const block = runtimeId === undefined ? undefined : this._findRuntimeBlock(runtimeId);
            if (block) {
                const node = this._graphCanvas.findNodeFromData(block);
                this._detachTeleportBlock(block);
                this._globalState.nodeGeometry.removeBlock(block);
                if (node) {
                    node.dispose();
                    this._graphCanvas.removeDataFromCache(block);
                }
            }
            updatedMapping.delete(logicalId);
        }

        let nextX = this._graphCanvas.nodes.reduce((maximum, node) => Math.max(maximum, node.x), -340) + 340;
        let nextY = 0;
        for (const serializedBlock of after.blocks) {
            if (beforeById.has(serializedBlock.id)) {
                continue;
            }

            const block = this._createRuntimeBlock(serializedBlock);
            const node = this._appendBlock(block);
            node.x = nextX;
            node.y = nextY;
            node.cleanAccumulation();
            nextX += 340;
            nextY += 40;
            updatedMapping.set(serializedBlock.id, block.uniqueId);
        }

        for (const serializedBlock of after.blocks) {
            const runtimeId = updatedMapping.get(serializedBlock.id);
            const block = runtimeId === undefined ? undefined : this._findRuntimeBlock(runtimeId);
            if (!block) {
                throw new Error(`Unable to find runtime block for logical block ${serializedBlock.id}.`);
            }

            const beforeBlock = beforeById.get(serializedBlock.id);
            if (beforeBlock && this._hasBlockDataChanged(beforeBlock, serializedBlock)) {
                block._deserialize(serializedBlock);
                this._graphCanvas.findNodeFromData(block)?.refresh();
            }
        }

        this._resolveTeleportRelationships(after, (logicalId) => {
            const runtimeId = updatedMapping.get(logicalId);
            return runtimeId === undefined ? undefined : this._findRuntimeBlock(runtimeId);
        });

        const affectedBlockIds = new Set(changedInputs.map(({ blockId }) => blockId));
        for (const serializedBlock of after.blocks) {
            const beforeBlock = beforeById.get(serializedBlock.id);
            if (!beforeBlock || this._hasBlockDataChanged(beforeBlock, serializedBlock)) {
                affectedBlockIds.add(serializedBlock.id);
            }
        }
        this._applyConnectionsAndRefreshDownstreamTypes(after, updatedMapping, affectedBlockIds, changedInputs);

        const outputRuntimeId = updatedMapping.get(after.outputNodeId);
        this._globalState.nodeGeometry.outputBlock =
            outputRuntimeId === undefined ? null : (this._findRuntimeBlock(outputRuntimeId) as typeof this._globalState.nodeGeometry.outputBlock);

        const survivingSelectedNodes = selectedNodes.filter((node) => this._graphCanvas.nodes.includes(node));
        if (survivingSelectedNodes.length !== selectedNodes.length || (selectedLink && !this._graphCanvas.links.includes(selectedLink))) {
            this._globalState.stateManager.onSelectionChangedObservable.notifyObservers(null);
            for (const node of survivingSelectedNodes) {
                this._globalState.stateManager.onSelectionChangedObservable.notifyObservers({ selection: node, forceKeepSelection: true });
            }
        }

        this._requestRender();
        this._globalState.stateManager.onRebuildRequiredObservable.notifyObservers();
        return updatedMapping;
    }

    private _findRuntimeBlock(runtimeId: number): NodeGeometryBlock | undefined {
        return this._globalState.nodeGeometry.attachedBlocks.find((block) => block.uniqueId === runtimeId);
    }

    private _validateDocument(geometry: ISerializedGeometry): void {
        const blocks = new Map<number, NodeGeometryBlock>();
        const serializedBlocks = new Map(geometry.blocks.map((block) => [block.id, block]));
        for (const serializedBlock of geometry.blocks) {
            blocks.set(serializedBlock.id, this._createRuntimeBlock(serializedBlock));
        }

        this._resolveTeleportRelationships(geometry, (logicalId) => blocks.get(logicalId));

        const connections: Array<{
            output: NodeGeometryBlock["outputs"][number];
            input: NodeGeometryBlock["inputs"][number];
            serializedBlock: ISerializedBlock;
            serializedInput: ISerializedConnectionPoint;
        }> = [];
        const connectedBlockIds = new Set<number>();
        const connectingBlockIds = new Set<number>();
        const connectBlock = (serializedBlock: ISerializedBlock): void => {
            if (connectedBlockIds.has(serializedBlock.id)) {
                return;
            }
            if (connectingBlockIds.has(serializedBlock.id)) {
                throw new Error("Unable to validate connection types because the graph is cyclic.");
            }

            connectingBlockIds.add(serializedBlock.id);
            const targetBlock = blocks.get(serializedBlock.id)!;
            if (serializedBlock.customType === "BABYLON.TeleportOutBlock" && typeof serializedBlock.entryPoint === "number") {
                connectBlock(serializedBlocks.get(serializedBlock.entryPoint)!);
            }
            for (const serializedInput of serializedBlock.inputs) {
                if (serializedInput.targetBlockId === undefined || !serializedInput.targetConnectionName) {
                    continue;
                }

                const sourceSerializedBlock = serializedBlocks.get(serializedInput.targetBlockId);
                const sourceBlock = blocks.get(serializedInput.targetBlockId);
                const output = sourceBlock?.outputs.find((candidate) => candidate.name === serializedInput.targetConnectionName);
                const input = targetBlock.inputs.find((candidate) => candidate.name === serializedInput.name);
                if (!sourceSerializedBlock || !sourceBlock || !output || !input) {
                    throw new Error(
                        `Unable to resolve the connection from ${serializedInput.targetBlockId}.${serializedInput.targetConnectionName} to ${serializedBlock.id}.${serializedInput.name}.`
                    );
                }
                connectBlock(sourceSerializedBlock);
                connections.push({ output, input, serializedBlock, serializedInput });
                output.connectTo(input, true);
            }

            connectingBlockIds.delete(serializedBlock.id);
            connectedBlockIds.add(serializedBlock.id);
        };

        for (const serializedBlock of geometry.blocks) {
            connectBlock(serializedBlock);
        }

        for (const { output, input, serializedBlock, serializedInput } of connections) {
            if (!this._areConnectionTypesCompatible(output, input)) {
                throw new Error(
                    `The connection from ${serializedInput.targetBlockId}.${serializedInput.targetConnectionName} to ${serializedBlock.id}.${serializedInput.name} is incompatible.`
                );
            }
        }
    }

    private _areConnectionTypesCompatible(output: NodeGeometryBlock["outputs"][number], input: NodeGeometryBlock["inputs"][number]): boolean {
        if (output.type !== input.type && input.innerType !== NodeGeometryBlockConnectionPointTypes.AutoDetect) {
            return input.acceptedConnectionPointTypes.includes(output.type);
        }
        return !input.excludedConnectionPointTypes.includes(output.type);
    }

    private _createRuntimeBlock(serializedBlock: ISerializedBlock): NodeGeometryBlock {
        const constructor = GetClass(serializedBlock.customType);
        if (!constructor) {
            throw new Error(`Node Geometry block type "${serializedBlock.customType}" is not registered.`);
        }

        const block = new constructor(serializedBlock.name) as NodeGeometryBlock;
        block._deserialize(serializedBlock);
        return block;
    }

    private _resolveTeleportRelationships(geometry: ISerializedGeometry, findBlock: (logicalId: number) => NodeGeometryBlock | undefined): void {
        for (const serializedBlock of geometry.blocks) {
            if (serializedBlock.customType !== "BABYLON.TeleportOutBlock") {
                continue;
            }

            const endpoint = findBlock(serializedBlock.id) as TeleportOutBlock | undefined;
            if (!endpoint?.isTeleportOut) {
                throw new Error(`Unable to resolve TeleportOutBlock ${serializedBlock.id}.`);
            }

            if (serializedBlock.entryPoint === undefined || serializedBlock.entryPoint === null || serializedBlock.entryPoint === "") {
                endpoint.detach();
                continue;
            }
            if (typeof serializedBlock.entryPoint !== "number") {
                throw new Error(`TeleportOutBlock ${serializedBlock.id}.entryPoint must be a block ID.`);
            }

            const entryPoint = findBlock(serializedBlock.entryPoint) as TeleportInBlock | undefined;
            if (!entryPoint?.isTeleportIn) {
                throw new Error(`TeleportOutBlock ${serializedBlock.id}.entryPoint must reference a TeleportInBlock.`);
            }
            entryPoint.attachToEndpoint(endpoint);
        }
    }

    private _detachTeleportBlock(block: NodeGeometryBlock): void {
        if (block.isTeleportOut) {
            (block as TeleportOutBlock).detach();
        } else if (block.isTeleportIn) {
            for (const endpoint of (block as TeleportInBlock).endpoints.slice()) {
                endpoint.detach();
            }
        }
    }

    private _hasBlockDataChanged(before: ISerializedBlock, after: ISerializedBlock): boolean {
        const { inputs: _beforeInputs, id: _beforeId, ...beforeData } = before;
        const { inputs: _afterInputs, id: _afterId, ...afterData } = after;
        return JSON.stringify(beforeData) !== JSON.stringify(afterData);
    }

    private _findChangedInputs(beforeById: ReadonlyMap<number, ISerializedBlock>, afterById: ReadonlyMap<number, ISerializedBlock>): Array<{ blockId: number; inputName: string }> {
        const changed: Array<{ blockId: number; inputName: string }> = [];

        for (const [blockId, afterBlock] of afterById) {
            const beforeBlock = beforeById.get(blockId);
            for (const afterInput of afterBlock.inputs) {
                const beforeInput = beforeBlock?.inputs.find((candidate) => candidate.name === afterInput.name);
                if (!beforeInput || beforeInput.targetBlockId !== afterInput.targetBlockId || beforeInput.targetConnectionName !== afterInput.targetConnectionName) {
                    changed.push({ blockId, inputName: afterInput.name });
                }
            }
        }

        return changed;
    }

    private _applyConnectionsAndRefreshDownstreamTypes(
        geometry: ISerializedGeometry,
        logicalToRuntime: ReadonlyMap<number, number>,
        affectedBlockIds: ReadonlySet<number>,
        changedInputs: ReadonlyArray<{ blockId: number; inputName: string }>
    ): void {
        const downstream = new Map<number, Array<{ targetBlockId: number; input?: ISerializedConnectionPoint }>>();
        const incoming = new Map<number, Array<{ sourceBlockId: number; input: ISerializedConnectionPoint }>>();
        const addDownstream = (sourceBlockId: number, targetBlockId: number, input?: ISerializedConnectionPoint) => {
            const entries = downstream.get(sourceBlockId) ?? [];
            entries.push({ targetBlockId, input });
            downstream.set(sourceBlockId, entries);
            if (input) {
                const incomingEntries = incoming.get(targetBlockId) ?? [];
                incomingEntries.push({ sourceBlockId, input });
                incoming.set(targetBlockId, incomingEntries);
            }
        };

        for (const targetBlock of geometry.blocks) {
            if (targetBlock.customType === "BABYLON.TeleportOutBlock" && typeof targetBlock.entryPoint === "number") {
                addDownstream(targetBlock.entryPoint, targetBlock.id);
            }
            for (const input of targetBlock.inputs) {
                if (input.targetBlockId !== undefined && input.targetConnectionName) {
                    addDownstream(input.targetBlockId, targetBlock.id, input);
                }
            }
        }

        const affected = new Set<number>();
        const pending = [...affectedBlockIds];
        while (pending.length > 0) {
            const sourceLogicalId = pending.shift()!;
            if (affected.has(sourceLogicalId)) {
                continue;
            }
            affected.add(sourceLogicalId);
            pending.push(...(downstream.get(sourceLogicalId)?.map(({ targetBlockId }) => targetBlockId) ?? []));
        }

        const changedInputKeys = new Set(changedInputs.map(({ blockId, inputName }) => `${blockId}:${inputName}`));
        const incomingCount = new Map([...affected].map((blockId) => [blockId, 0]));
        for (const sourceBlockId of affected) {
            for (const { targetBlockId } of downstream.get(sourceBlockId) ?? []) {
                if (affected.has(targetBlockId)) {
                    incomingCount.set(targetBlockId, incomingCount.get(targetBlockId)! + 1);
                }
            }
        }

        const ready = [...incomingCount].filter(([, count]) => count === 0).map(([blockId]) => blockId);
        let processedCount = 0;
        while (ready.length > 0) {
            const sourceLogicalId = ready.shift()!;
            processedCount++;

            for (const { sourceBlockId, input: serializedInput } of incoming.get(sourceLogicalId) ?? []) {
                if (changedInputKeys.has(`${sourceLogicalId}:${serializedInput.name}`)) {
                    this._connectInput(logicalToRuntime, sourceLogicalId, serializedInput);
                    continue;
                }
                if (!affected.has(sourceBlockId)) {
                    continue;
                }

                const sourceRuntimeId = logicalToRuntime.get(sourceBlockId);
                const targetRuntimeId = logicalToRuntime.get(sourceLogicalId);
                const sourceBlock = sourceRuntimeId === undefined ? undefined : this._findRuntimeBlock(sourceRuntimeId);
                const targetBlock = targetRuntimeId === undefined ? undefined : this._findRuntimeBlock(targetRuntimeId);
                const output = sourceBlock?.outputs.find((candidate) => candidate.name === serializedInput.targetConnectionName);
                const input = targetBlock?.inputs.find((candidate) => candidate.name === serializedInput.name);
                if (!output || !input || input.connectedPoint !== output) {
                    throw new Error(
                        `Unable to refresh the connection from ${sourceBlockId}.${serializedInput.targetConnectionName} to ${sourceLogicalId}.${serializedInput.name}.`
                    );
                }
                output.disconnectFrom(input);
                output.connectTo(input, true);
            }

            for (const { targetBlockId } of downstream.get(sourceLogicalId) ?? []) {
                if (affected.has(targetBlockId)) {
                    const remaining = incomingCount.get(targetBlockId)! - 1;
                    incomingCount.set(targetBlockId, remaining);
                    if (remaining === 0) {
                        ready.push(targetBlockId);
                    }
                }
            }
        }

        if (processedCount !== affected.size) {
            throw new Error("Unable to refresh downstream connection types because the affected graph is cyclic.");
        }
    }

    private _connectInput(logicalToRuntime: ReadonlyMap<number, number>, targetLogicalId: number, serializedInput: ISerializedConnectionPoint): void {
        const sourceRuntimeId = logicalToRuntime.get(serializedInput.targetBlockId!);
        const targetRuntimeId = logicalToRuntime.get(targetLogicalId);
        const sourceBlock = sourceRuntimeId === undefined ? undefined : this._findRuntimeBlock(sourceRuntimeId);
        const targetBlock = targetRuntimeId === undefined ? undefined : this._findRuntimeBlock(targetRuntimeId);
        const sourceNode = sourceBlock && this._graphCanvas.findNodeFromData(sourceBlock);
        const targetNode = targetBlock && this._graphCanvas.findNodeFromData(targetBlock);
        const output = sourceNode?.content.outputs.find((candidate) => candidate.internalName === serializedInput.targetConnectionName);
        const input = targetNode?.content.inputs.find((candidate) => candidate.internalName === serializedInput.name);

        if (!sourceNode || !targetNode || !output || !input) {
            throw new Error(
                `Unable to connect logical block ${serializedInput.targetBlockId}.${serializedInput.targetConnectionName} to ${targetLogicalId}.${serializedInput.name}.`
            );
        }
        if (!this._canConnect(output, input)) {
            throw new Error(
                `The connection from ${serializedInput.targetBlockId}.${serializedInput.targetConnectionName} to ${targetLogicalId}.${serializedInput.name} is incompatible.`
            );
        }

        this._graphCanvas.connectNodes(sourceNode, output, targetNode, input);
    }

    private _canConnect(output: IPortData, input: IPortData): boolean {
        return output.canConnectTo(input) && (!output.needDualDirectionValidation && !input.needDualDirectionValidation ? true : input.canConnectTo(output));
    }
}
