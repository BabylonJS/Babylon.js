import * as React from "react";
import { GUINode } from "../diagram/guiNode";
import { OptionsLineComponent } from "../sharedUiComponents/lines/optionsLineComponent";
import { LineContainerComponent } from "../sharedUiComponents/lines/lineContainerComponent";
import { GlobalState } from "../globalState";

interface IParentingPropertyGridComponentProps {
    guiNode: GUINode
    guiNodes: GUINode[]
    globalState: GlobalState
}

export class ParentingPropertyGridComponent extends React.Component<IParentingPropertyGridComponentProps> {
    constructor(props: IParentingPropertyGridComponentProps) {
        super(props);
    }
    public parentIndex : number = 0;
    render() {

        var parentOptions = [
            { label: "None", value: 0 },
        ];
        var containerNodes : GUINode[] = [];

        this.props.guiNodes.forEach(node => {
            if(node.isContainer() && node != this.props.guiNode) {
                var name = node.guiControl.name? node.guiControl.name : "";
                parentOptions.push(
                    {label: name, value: parentOptions.length}
                )
                containerNodes.push(node);
            }
        });

        var parent = this.props.guiNode.parent;
        if(parent) {
            for(let i = 0; i < containerNodes.length; ++i) {
                if(parent == containerNodes[i]) {
                    this.parentIndex = i+1;
                }
            }
        }

        return (     
            <div className="pane">
                <LineContainerComponent title="PARENTING">
                <OptionsLineComponent label="Parent Container" options={parentOptions} target={this} propertyName={"parentIndex"}
                            noDirectUpdate={true}
                            onSelect={(value: any) => {
                                this.parentIndex = value;
                                if(this.props.guiNode.parent){
                                    this.props.guiNode.parent.removeChildGui(this.props.guiNode);
                                }
                                if(value != 0){
                                    var parent = containerNodes[value-1];
                                    parent.addChildGui(this.props.guiNode);
                                }
                                this.forceUpdate();
                            }} />
                </LineContainerComponent>
            </div>
        );
    }
}