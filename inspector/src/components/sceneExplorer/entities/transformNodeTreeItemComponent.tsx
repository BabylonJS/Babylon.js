import { TransformNode } from "babylonjs";
import { faCube } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { IExtensibilityGroup } from "../../../inspector";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";

interface ITransformNodeItemComponentProps {
    transformNode: TransformNode,
    extensibilityGroups?: IExtensibilityGroup[],
    onClick: () => void
}

export class TransformNodeItemComponent extends React.Component<ITransformNodeItemComponentProps> {
    constructor(props: ITransformNodeItemComponentProps) {
        super(props);
    }


    render() {
        const transformNode = this.props.transformNode;
        return (
            <div className="transformNodeTools">
                <TreeItemLabelComponent label={transformNode.name} onClick={() => this.props.onClick()} icon={faCube} color="cornflowerblue" />
                {
                    <ExtensionsComponent target={transformNode} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}