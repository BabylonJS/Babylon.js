import * as React from "react";
import { OptionsLineComponent } from "../sharedUiComponents/lines/optionsLineComponent";
import { LineContainerComponent } from "../sharedUiComponents/lines/lineContainerComponent";
import { GlobalState } from "../globalState";
import { Control } from "babylonjs-gui/2D/controls/control";
import { Container } from "babylonjs-gui/2D/controls/container";

interface IParentingPropertyGridComponentProps {
    guiNode: Control;
    guiNodes: Control[];
    globalState: GlobalState;
}

export class ParentingPropertyGridComponent extends React.Component<IParentingPropertyGridComponentProps> {
    constructor(props: IParentingPropertyGridComponentProps) {
        super(props);
    }
    public parentIndex: number = 0;

    public addChildGui(childNode: Control, parentNode: Control) {
        this.props.globalState.guiTexture.removeControl(childNode);
        (parentNode as Container).addControl(childNode);
    }

    public removeChildGui(childNode: Control, parentNode: Control) {
        (parentNode as Container).removeControl(childNode);
        this.props.globalState.guiTexture.addControl(childNode);
    }

    render() {
        var parentOptions = [{ label: "None", value: 0 }];
        var containerNodes: Control[] = [];

        this.props.guiNodes.forEach((node) => {
            if (this.props.globalState.workbench.isContainer(node) && node != this.props.guiNode) {
                var name = node.name ? node.name : "";
                parentOptions.push({ label: name, value: parentOptions.length });
                containerNodes.push(node);
            }
        });

        var parent = this.props.guiNode.parent;
        if (parent) {
            for (let i = 0; i < containerNodes.length; ++i) {
                if (parent == containerNodes[i]) {
                    this.parentIndex = i + 1;
                }
            }
        }

        return (
            <div className="pane">
                <LineContainerComponent title="PARENTING">
                    <OptionsLineComponent
                        label="Parent Container"
                        options={parentOptions}
                        target={this}
                        propertyName={"parentIndex"}
                        noDirectUpdate={true}
                        onSelect={(value: any) => {
                            this.parentIndex = value;
                            if (this.props.guiNode.parent) {
                                this.removeChildGui(this.props.guiNode, this.props.guiNode.parent);
                            }
                            if (value != 0) {
                                var parent = containerNodes[value - 1];
                                this.addChildGui(this.props.guiNode, parent);
                            }
                            this.forceUpdate();
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
