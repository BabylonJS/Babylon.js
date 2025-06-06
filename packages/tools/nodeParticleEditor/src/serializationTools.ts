import type { NodeParticleSystemSet } from "core/Particles/Node/nodeParticleSystemSet";
import type { GlobalState } from "./globalState";
import type { Nullable } from "core/types";
import type { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import type { NodeParticleBlock } from "core/Particles/Node/nodeParticleBlock";

export class SerializationTools {
    public static UpdateLocations(particleSet: NodeParticleSystemSet, globalState: GlobalState, frame?: Nullable<GraphFrame>) {
        particleSet.editorData = {
            locations: [],
        };

        // Store node locations
        const blocks: NodeParticleBlock[] = frame ? frame.nodes.map((n) => n.content.data) : particleSet.attachedBlocks;

        for (const block of blocks) {
            const node = globalState.onGetNodeFromBlock(block);

            particleSet.editorData.locations.push({
                blockId: block.uniqueId,
                x: node ? node.x : 0,
                y: node ? node.y : 0,
                isCollapsed: node ? node.isCollapsed : false,
            });
        }

        globalState.storeEditorData(particleSet.editorData, frame);
    }

    public static Serialize(particleSet: NodeParticleSystemSet, globalState: GlobalState, frame?: Nullable<GraphFrame>) {
        this.UpdateLocations(particleSet, globalState, frame);

        const selectedBlocks = frame ? frame.nodes.map((n) => n.content.data) : undefined;

        const serializationObject = particleSet.serialize(selectedBlocks);

        return JSON.stringify(serializationObject, undefined, 2);
    }

    public static Deserialize(serializationObject: any, globalState: GlobalState) {
        globalState.nodeParticleSet.parseSerializedObject(serializationObject);
        globalState.onIsLoadingChanged.notifyObservers(false);
    }

    public static AddFrameToParticleSystemSet(serializationObject: any, globalState: GlobalState, currentSystemSet: NodeParticleSystemSet) {
        this.UpdateLocations(currentSystemSet, globalState);
        globalState.nodeParticleSet.parseSerializedObject(serializationObject, true);
        globalState.onImportFrameObservable.notifyObservers(serializationObject);
        globalState.onIsLoadingChanged.notifyObservers(false);
    }
}
