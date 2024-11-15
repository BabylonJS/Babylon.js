import * as React from "react";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";
import { SceneLoader } from "core/Loading/sceneLoader";
import { EngineStore } from "core/Engines/engineStore";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import type { MeshBlock } from "core/Meshes/Node/Blocks/Sources/meshBlock";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Mesh } from "core/Meshes/mesh";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";

export class MeshPropertyTabComponent extends React.Component<IPropertyComponentProps, { isLoading: boolean }> {
    constructor(props: IPropertyComponentProps) {
        super(props);

        this.state = { isLoading: false };
    }

    async loadMesh(file: File) {
        this.setState({ isLoading: true });
        const scene = await SceneLoader.LoadAsync("file:", file, EngineStore.LastCreatedEngine);

        if (!scene) {
            return;
        }

        this.setState({ isLoading: false });

        const nodeData = this.props.nodeData as any;

        if (nodeData.__scene) {
            nodeData.__scene.dispose();
        }
        nodeData.__scene = scene;

        const meshes = scene.meshes.filter((m) => !!m.name && m.getTotalVertices() > 0);

        if (meshes.length) {
            const block = this.props.nodeData.data as MeshBlock;
            block.mesh = meshes[0] as Mesh;

            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        }

        this.forceUpdate();
    }

    removeData() {
        const block = this.props.nodeData.data as MeshBlock;
        block.cleanData();
        this.forceUpdate();
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
    }

    override render() {
        const scene = (this.props.nodeData as any).__scene as Nullable<Scene>;
        const meshOptions = [{ label: "None", value: -1 }];
        let meshes: AbstractMesh[] = [];

        if (scene) {
            meshes = scene.meshes.filter((m) => !!m.name && m.getTotalVertices() > 0);
            meshes.sort((a, b) => a.name.localeCompare(b.name));

            meshes.sort((a, b) => a.name.localeCompare(b.name));

            meshOptions.push(
                ...meshes.map((v, i) => {
                    return { label: v.name, value: i };
                })
            );
        }
        const block = this.props.nodeData.data as MeshBlock;

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="SOURCE">
                    {this.state.isLoading && <TextLineComponent ignoreValue={true} label="Loading..." />}
                    {!this.state.isLoading && <FileButtonLine label="Load" onClick={(file) => this.loadMesh(file)} accept=".glb, .babylon" />}
                    {scene && (
                        <OptionsLine
                            label="Mesh"
                            options={meshOptions}
                            target={block}
                            propertyName="mesh"
                            noDirectUpdate={true}
                            onSelect={(value) => {
                                switch (value) {
                                    case -1:
                                        block.mesh = null;
                                        break;
                                    default:
                                        block.mesh = meshes[value as number] as Mesh;
                                }

                                this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                                this.forceUpdate();
                            }}
                            extractValue={() => {
                                if (!block.mesh) {
                                    return -1;
                                }

                                const meshIndex = meshes.indexOf(block.mesh);

                                if (meshIndex > -1) {
                                    return meshIndex;
                                }

                                return -1;
                            }}
                        />
                    )}
                    {!scene && !!block.mesh && <TextLineComponent ignoreValue={true} label={`Mesh ${block.mesh.name} defined by code`} />}
                    {!scene && !!block.isUsingCachedData && <TextLineComponent ignoreValue={true} label={`Block is using cached data`} />}
                    {!this.state.isLoading && (!!block.mesh || !!block.isUsingCachedData) && <ButtonLineComponent label="Remove" onClick={() => this.removeData()} />}
                </LineContainerComponent>
                <LineContainerComponent title="ADVANCED">
                    <CheckBoxLineComponent
                        label="Serialized cached data"
                        target={block}
                        propertyName="serializedCachedData"
                        onValueChanged={() => {
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
