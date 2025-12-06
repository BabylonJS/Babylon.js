import type { NodeParticleSystemSet } from "core/Particles/Node/nodeParticleSystemSet";
import type { GlobalState } from "./globalState";
import type { Nullable } from "core/types";
import type { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import type { NodeParticleBlock } from "core/Particles/Node/nodeParticleBlock";
import { NodeParticleModes } from "./nodeParticleModes";

export class SerializationTools {
    public static UpdateLocations(particleSet: NodeParticleSystemSet, globalState: GlobalState, frame?: Nullable<GraphFrame>) {
        if (!particleSet.editorData) {
            particleSet.editorData = {};
        }
        particleSet.editorData.locations = [];

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

        if (!serializationObject.editorData) {
            serializationObject.editorData = {};
        }
        serializationObject.editorData.mode = globalState.mode;

        return JSON.stringify(serializationObject, undefined, 2);
    }

    public static Deserialize(serializationObject: any, globalState: GlobalState) {
        const savedMode = serializationObject.editorData?.mode;
        if (savedMode !== undefined && savedMode !== null) {
            globalState.mode = savedMode;
        } else {
            globalState.mode = NodeParticleModes.Particle;
        }

        globalState.nodeParticleSet.parseSerializedObject(serializationObject);
        globalState.onIsLoadingChanged.notifyObservers(false);
    }

    public static AddFrameToParticleSystemSet(serializationObject: any, globalState: GlobalState, currentSystemSet: NodeParticleSystemSet) {
        const savedMode = serializationObject.editorData?.mode;
        if (savedMode !== undefined && savedMode !== null) {
            globalState.mode = savedMode;
        }

        this.UpdateLocations(currentSystemSet, globalState);
        globalState.nodeParticleSet.parseSerializedObject(serializationObject, true);
        globalState.onImportFrameObservable.notifyObservers(serializationObject);
        globalState.onIsLoadingChanged.notifyObservers(false);
    }
}
