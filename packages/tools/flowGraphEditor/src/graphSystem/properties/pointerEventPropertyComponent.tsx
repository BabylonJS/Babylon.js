import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import {
    GeneralPropertyTabComponent,
    ConstructorVariablesPropertyTabComponent,
    DataConnectionsPropertyTabComponent,
    GenericPropertyTabComponent,
} from "./genericNodePropertyComponent";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { type GlobalState } from "../../globalState";
import { type SceneContext } from "../../sceneContext";
import { type Observer } from "core/Misc/observable";

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
            this.setState({ sceneContext: ctx });
        });
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

    /**
     * MeshPickEventBlock registers the input as "asset"; pointer blocks use "targetMesh".
     * @returns The data input for the target mesh, or null if not found.
     */
    private _getTargetMeshInput() {
        const block = this._getBlock();
        return block.getDataInput("targetMesh") ?? block.getDataInput("asset");
    }

    private _onMeshChange(uniqueId: number) {
        const block = this._getBlock();
        const meshInput = this._getTargetMeshInput();
        if (!meshInput) {
            return;
        }

        const { sceneContext } = this.state;
        if (!sceneContext) {
            return;
        }

        const mesh = uniqueId === -1 ? undefined : sceneContext.meshes.find((m) => m.uniqueId === uniqueId);

        if (!block.config) {
            (block as any).config = {};
        }
        (block.config as any).targetMesh = mesh;
        (block.config as any)._meshName = mesh?.name;
        (meshInput as any)._defaultValue = mesh;

        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    /**
     * Resolve the current mesh uniqueId, rebinding by saved name when the
     * stored reference is stale (e.g. after a scene reset that creates new
     * objects with different uniqueIds).
     * @param sceneContext - The current scene context, or null if unavailable.
     * @returns The uniqueId of the current mesh, or -1 if none.
     */
    private _resolveCurrentMeshId(sceneContext: SceneContext | null): number {
        const meshInput = this._getTargetMeshInput();
        const currentMesh = meshInput ? (meshInput as any)._defaultValue : undefined;
        if (!sceneContext) {
            return currentMesh?.uniqueId ?? -1;
        }

        if (currentMesh && typeof currentMesh === "object") {
            const uid = currentMesh.uniqueId;
            // If the stored uniqueId still matches a mesh in the scene, use it
            if (sceneContext.meshes.some((m) => m.uniqueId === uid)) {
                return uid;
            }
        }

        // Stale or missing reference — try to rebind by the saved name
        const block = this._getBlock();
        const savedName: string | undefined = (block.config as any)?._meshName ?? (currentMesh && typeof currentMesh === "object" ? currentMesh.name : undefined);
        if (savedName) {
            const match = sceneContext.meshes.find((m) => m.name === savedName);
            if (match) {
                if (!block.config) {
                    (block as any).config = {};
                }
                (block.config as any).targetMesh = match;
                (meshInput as any)._defaultValue = match;
                return match.uniqueId;
            }
        }

        return -1;
    }

    override render() {
        const { stateManager, nodeData } = this.props;
        const { sceneContext } = this.state;
        const block = this._getBlock();
        const blockId = block.uniqueId;
        const currentUniqueId = this._resolveCurrentMeshId(sceneContext);

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
