import * as React from "react";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { PointListBlock } from "core/Meshes";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { Vector3 } from "core/Maths";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

export class PointListPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    addPoint() {
        const block = this.props.nodeData.data as PointListBlock;
        block.points.push(Vector3.Zero());
        this.forceUpdate();
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
    }

    removePoint(index: number) {
        const block = this.props.nodeData.data as PointListBlock;
        block.points.splice(index, 1);
        this.forceUpdate();
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
    }

    override render() {
        const block = this.props.nodeData.data as PointListBlock;

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="POINTS">
                    <ButtonLineComponent label="Add point" onClick={() => this.addPoint()} />
                    <div className="point-list">
                        {block.points.map((point, i) => {
                            return (
                                <Vector3LineComponent
                                    onChange={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                    lockObject={this.props.stateManager.lockObject}
                                    directValue={point}
                                    label={`#${i}:`}
                                    key={i}
                                    additionalCommands={[
                                        <div className="delete hoverIcon" onClick={() => this.removePoint(i)} title="Delete">
                                            <FontAwesomeIcon icon={faTrash} />
                                        </div>,
                                    ]}
                                />
                            );
                        })}
                    </div>
                </LineContainerComponent>
            </div>
        );
    }
}
