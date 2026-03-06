import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import {
    GeneralPropertyTabComponent,
    ConstructorVariablesPropertyTabComponent,
    DataConnectionsPropertyTabComponent,
    GenericPropertyTabComponent,
} from "./genericNodePropertyComponent";
import type { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { GlobalState } from "../../globalState";
import type { SceneContext } from "../../sceneContext";
import type { Observer } from "core/Misc/observable";

interface IPointerEventPropertyState {
    sceneContext: SceneContext | null;
}

/**
 * Property panel for pointer event blocks (PointerDown/Up/Move/Over/Out) and MeshPickEventBlock.
 * Adds a mesh picker for the `targetMesh` config field alongside the standard generic sections.
 */
export class PointerEventPropertyComponent extends React.Component<IPropertyComponentProps, IPointerEventPropertyState> {
    private _sceneContextObserver: Observer<SceneContext | null> | null = null;

    constructor(props: IPropertyComponentProps) {
        super(props);
        const globalState = props.stateManager.data as GlobalState;
        this.state = { sceneContext: globalState.sceneContext };
    }

    override componentDidMount() {
        const globalState = this.props.stateManager.data as GlobalState;
        this._sceneContextObserver = globalState.onSceneContextChanged.add((ctx) => {
            if (ctx) {
                this._rebindMeshReference(ctx);
            }
            this.setState({ sceneContext: ctx });
        });
    }

    /**
     * After a scene reset the old mesh objects are disposed and replaced by
     * new ones with different uniqueIds. Re-bind the stored reference by
     * matching on the mesh name so the picker stays in sync.
     */
    private _rebindMeshReference(newCtx: SceneContext) {
        const meshInput = this._getTargetMeshInput();
        if (!meshInput) return;

        const oldMesh = (meshInput as any)._defaultValue;
        if (!oldMesh) return;

        const name: string | undefined = oldMesh.name;
        if (!name) return;

        const newMesh = newCtx.meshes.find((m) => m.name === name);
        if (newMesh) {
            const block = this._getBlock();
            if (!block.config) {
                (block as any).config = {};
            }
            (block.config as any).targetMesh = newMesh;
            (meshInput as any)._defaultValue = newMesh;
        }
    }

    override componentWillUnmount() {
        const globalState = this.props.stateManager.data as GlobalState;
        if (this._sceneContextObserver) {
            globalState.onSceneContextChanged.remove(this._sceneContextObserver);
            this._sceneContextObserver = null;
        }
    }

    private _getBlock(): FlowGraphBlock {
        return this.props.nodeData.data as FlowGraphBlock;
    }

    /** MeshPickEventBlock registers the input as "asset"; pointer blocks use "targetMesh". */
    private _getTargetMeshInput() {
        const block = this._getBlock();
        return block.getDataInput("targetMesh") ?? block.getDataInput("asset");
    }

    private _onMeshChange(uniqueId: number) {
        const block = this._getBlock();
        const meshInput = this._getTargetMeshInput();
        if (!meshInput) return;

        const { sceneContext } = this.state;
        if (!sceneContext) return;

        const mesh = uniqueId === -1 ? undefined : sceneContext.meshes.find((m) => m.uniqueId === uniqueId);

        if (!block.config) {
            (block as any).config = {};
        }
        (block.config as any).targetMesh = mesh;
        (meshInput as any)._defaultValue = mesh;

        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    override render() {
        const { stateManager, nodeData } = this.props;
        const { sceneContext } = this.state;
        const block = this._getBlock();
        const blockId = block.uniqueId;
        const meshInput = this._getTargetMeshInput();
        const currentMesh = meshInput ? (meshInput as any)._defaultValue : undefined;
        const currentUniqueId = currentMesh?.uniqueId ?? -1;

        return (
            <>
                <GeneralPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />
                <ConstructorVariablesPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />

                <LineContainerComponent title="TARGET MESH">
                    {sceneContext ? (
                        <>
                            <OptionsLine
                                key={`mesh-${blockId}-${sceneContext?.scene?.uid ?? "no-scene"}`}
                                label="Mesh"
                                options={[
                                    { label: "(none)", value: -1 },
                                    ...sceneContext.meshes.map((m) => ({
                                        label: m.name || `(id ${m.uniqueId})`,
                                        value: m.uniqueId,
                                    })),
                                ]}
                                target={{}}
                                propertyName="_unused"
                                noDirectUpdate={true}
                                extractValue={() => currentUniqueId}
                                onSelect={(value) => this._onMeshChange(value as number)}
                            />
                            {sceneContext.meshes.length === 0 && <div style={{ padding: "4px 8px", color: "#aaa", fontSize: "11px" }}>No meshes found in the scene.</div>}
                        </>
                    ) : (
                        <div style={{ padding: "4px 8px", color: "#888", fontSize: "11px" }}>Load a scene snippet in the Preview panel to pick meshes by name.</div>
                    )}
                </LineContainerComponent>

                <DataConnectionsPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />
                <GenericPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />
            </>
        );
    }
}
