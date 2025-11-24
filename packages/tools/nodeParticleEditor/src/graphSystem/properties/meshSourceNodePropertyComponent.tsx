import * as React from "react";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { LoadSceneAsync } from "core/Loading/sceneLoader";
import { EngineStore } from "core/Engines/engineStore";
import type { Nullable } from "core/types";
import type { Scene } from "core/scene";
import type { Mesh } from "core/Meshes/mesh";
import { MeshSourceBlock } from "core/Particles/Node/Blocks";
import type { Observer } from "core/Misc/observable";

export class MeshSourcePropertyTabComponent extends React.Component<IPropertyComponentProps, { isLoading: boolean }> {
    private _onValueChangedObserver: Nullable<Observer<MeshSourceBlock>> = null;

    constructor(props: IPropertyComponentProps) {
        super(props);
        this.state = { isLoading: false };
    }

    override componentDidMount(): void {
        const block = this.props.nodeData.data as MeshSourceBlock;
        this._onValueChangedObserver = block.onValueChangedObservable.add(() => {
            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
            this.forceUpdate();
        });
    }

    private _getNodeScene(): Nullable<Scene> {
        return (this.props.nodeData as any).__spsMeshScene || null;
    }

    private _setNodeScene(scene: Nullable<Scene>) {
        const nodeData = this.props.nodeData as any;
        if (nodeData.__spsMeshScene) {
            nodeData.__spsMeshScene.dispose();
        }
        nodeData.__spsMeshScene = scene || null;
    }

    async loadMesh(file: File) {
        if (!EngineStore.LastCreatedEngine) {
            return;
        }
        this.setState({ isLoading: true });
        const scene = await LoadSceneAsync(file, EngineStore.LastCreatedEngine);
        this.setState({ isLoading: false });

        if (!scene) {
            return;
        }

        this._setNodeScene(scene);

        const meshes = scene.meshes.filter((m) => !!m.name && m.getTotalVertices() > 0) as Mesh[];
        if (meshes.length) {
            const block = this.props.nodeData.data as MeshSourceBlock;
            block.setCustomMesh(meshes[0]);
            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        }

        this.forceUpdate();
    }

    removeData() {
        const block = this.props.nodeData.data as MeshSourceBlock;
        block.clearCustomMesh();
        this._setNodeScene(null);
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.forceUpdate();
    }

    applyMesh(mesh: Nullable<Mesh>) {
        const block = this.props.nodeData.data as MeshSourceBlock;
        block.setCustomMesh(mesh ?? null);
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.forceUpdate();
    }

    override componentWillUnmount(): void {
        const scene = this._getNodeScene();
        if (scene) {
            scene.dispose();
        }
        (this.props.nodeData as any).__spsMeshScene = null;
        const block = this.props.nodeData.data as MeshSourceBlock;
        if (this._onValueChangedObserver) {
            block.onValueChangedObservable.remove(this._onValueChangedObserver);
            this._onValueChangedObserver = null;
        }
    }

    override render() {
        const block = this.props.nodeData.data as MeshSourceBlock;
        const scene = this._getNodeScene();

        const meshes = scene ? (scene.meshes.filter((m) => !!m.name && m.getTotalVertices() > 0) as Mesh[]) : [];
        const meshOptions = [{ label: "None", value: -1 }];
        meshOptions.push(
            ...meshes.map((mesh, index) => ({
                label: mesh.name,
                value: index,
            }))
        );

        const selectedMeshIndex = block.hasCustomMesh ? meshes.findIndex((m) => m.name === block.customMeshName) : -1;

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="CUSTOM MESH">
                    {block.hasCustomMesh ? <TextLineComponent label="Active" value={block.customMeshName || "Custom mesh"} /> : <TextLineComponent label="Active" value="None" />}
                    {this.state.isLoading && <TextLineComponent label="Status" value="Loading..." ignoreValue={true} />}
                    {!this.state.isLoading && <FileButtonLine label="Load" accept=".glb,.gltf,.babylon" onClick={async (file) => await this.loadMesh(file)} />}
                    {scene && meshOptions.length > 1 && (
                        <OptionsLine
                            label="Loaded Mesh"
                            options={meshOptions}
                            target={{ meshIndex: selectedMeshIndex }}
                            propertyName="meshIndex"
                            noDirectUpdate={true}
                            extractValue={() => selectedMeshIndex}
                            onSelect={(value) => {
                                const index = value as number;
                                if (index === -1) {
                                    this.applyMesh(null);
                                    return;
                                }
                                this.applyMesh(meshes[index]);
                                this.forceUpdate();
                            }}
                        />
                    )}
                    {block.hasCustomMesh && <ButtonLineComponent label="Remove custom mesh" onClick={() => this.removeData()} />}
                </LineContainerComponent>
            </div>
        );
    }
}
