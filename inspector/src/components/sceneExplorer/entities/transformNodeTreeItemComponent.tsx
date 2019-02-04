import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { faCodeBranch } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";

interface ITransformNodeItemComponentProps {
    transformNode: TransformNode,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
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
                <TreeItemLabelComponent label={transformNode.name} onClick={() => this.props.onClick()} icon={faCodeBranch} color="cornflowerblue" />
                {
                    <ExtensionsComponent target={transformNode} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}