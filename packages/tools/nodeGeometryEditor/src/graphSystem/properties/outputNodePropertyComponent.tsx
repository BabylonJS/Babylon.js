import * as React from "react";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import type { GeometryOutputBlock } from "core/Meshes/Node/Blocks/geometryOutputBlock";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import type { GlobalState } from "node-geometry-editor/globalState";

export class OutputPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    private _onUpdateRequiredObserver: Nullable<Observer<any>>;

    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override componentDidMount() {
        this._onUpdateRequiredObserver = this.props.stateManager.onUpdateRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    override componentWillUnmount() {
        this.props.stateManager.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
    }

    override render() {
        const outputBlock = this.props.nodeData.data as GeometryOutputBlock;
        const vertexData = outputBlock.currentVertexData;

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                {vertexData && (
                    <LineContainerComponent title="INFO">
                        {vertexData.positions && <TextLineComponent label="Vertices" value={(vertexData.positions?.length / 3).toString()} />}
                        {vertexData.indices && <TextLineComponent label="Faces" value={(vertexData.indices.length / 3).toString()} />}
                        {vertexData.positions && (
                            <TextLineComponent label="Build time" value={(this.props.stateManager.data as GlobalState).nodeGeometry.buildExecutionTime.toFixed(2) + " ms"} />
                        )}
                        <TextLineComponent label="Sub-meshes" value={vertexData.materialInfos?.length.toString()} />
                        <TextLineComponent label="Has normals" value={vertexData.normals ? "Yes" : "No"} />
                        <TextLineComponent label="Has colors" value={vertexData.colors ? "Yes" : "No"} />
                        <TextLineComponent label="Has UV set 0" value={vertexData.uvs ? "Yes" : "No"} />
                        <TextLineComponent label="Has UV set 1" value={vertexData.uvs2 ? "Yes" : "No"} />
                        <TextLineComponent label="Has UV set 2" value={vertexData.uvs3 ? "Yes" : "No"} />
                        <TextLineComponent label="Has UV set 3" value={vertexData.uvs4 ? "Yes" : "No"} />
                        <TextLineComponent label="Has UV set 4" value={vertexData.uvs5 ? "Yes" : "No"} />
                        <TextLineComponent label="Has UV set 5" value={vertexData.uvs6 ? "Yes" : "No"} />
                        <TextLineComponent label="Has tangents" value={vertexData.tangents ? "Yes" : "No"} />
                        <TextLineComponent label="Has matrix weights" value={vertexData.matricesWeights ? "Yes" : "No"} />
                        <TextLineComponent label="Has matrix indices" value={vertexData.matricesIndices ? "Yes" : "No"} />
                    </LineContainerComponent>
                )}
            </div>
        );
    }
}
