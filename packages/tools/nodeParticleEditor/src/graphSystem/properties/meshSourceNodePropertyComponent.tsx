import { Component } from "react";
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
import type { MeshSourceBlock } from "core/Particles/Node/Blocks/SolidParticle/meshSourceBlock";
import type { Observer } from "core/Misc/observable";

export class MeshSourcePropertyTabComponent extends Component<IPropertyComponentProps, { isLoading: boolean }> {
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

    private _getLoadedMeshes(): Mesh[] {
        return (this.props.nodeData as any).__spsLoadedMeshes || [];
    }

    private _setNodeScene(scene: Nullable<Scene>) {
        const nodeData = this.props.nodeData as any;
        if (nodeData.__spsMeshScene) {
            nodeData.__spsMeshScene.dispose();
        }
        nodeData.__spsMeshScene = scene || null;

        // Store meshes from loaded scene
        if (scene) {
            nodeData.__spsLoadedMeshes = scene.meshes.filter((m) => !!m.name && m.getTotalVertices() > 0) as Mesh[];
        } else {
            nodeData.__spsLoadedMeshes = [];
        }
    }

    async loadMeshAsync(file: File) {
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
        const nodeData = this.props.nodeData as any;
        this._setNodeScene(null);
        nodeData.__spsLoadedMeshes = [];
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
        const nodeData = this.props.nodeData as any;
        nodeData.__spsMeshScene = null;
        nodeData.__spsLoadedMeshes = null;
        const block = this.props.nodeData.data as MeshSourceBlock;
        if (this._onValueChangedObserver) {
            block.onValueChangedObservable.remove(this._onValueChangedObserver);
            this._onValueChangedObserver = null;
        }
    }

    override render() {
        const block = this.props.nodeData.data as MeshSourceBlock;
        const loadedMeshes = this._getLoadedMeshes();

        const meshOptions = [{ label: "None", value: -1 }];
        meshOptions.push(
            ...loadedMeshes.map((mesh, index) => ({
                label: mesh.name,
                value: index,
            }))
        );

        const selectedMeshIndex = block.hasCustomMesh ? loadedMeshes.findIndex((m) => m.name === block.customMeshName) : -1;

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="CUSTOM MESH">
                    {block.hasCustomMesh ? <TextLineComponent label="Active" value={block.customMeshName || "Custom mesh"} /> : <TextLineComponent label="Active" value="None" />}
                    {this.state.isLoading && <TextLineComponent label="Status" value="Loading..." ignoreValue={true} />}
                    {!this.state.isLoading && <FileButtonLine label="Load" accept=".glb,.gltf,.babylon" onClick={async (file) => await this.loadMeshAsync(file)} />}
                    {loadedMeshes.length > 0 && meshOptions.length > 1 && (
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
                                this.applyMesh(loadedMeshes[index]);
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
