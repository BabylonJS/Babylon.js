import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { PostProcess } from 'babylonjs/PostProcesses/postProcess';

import { faMagic } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from 'react';

interface IPostProcessItemComponentProps {
    postProcess: PostProcess,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    onClick: () => void
}

export class PostProcessItemComponent extends React.Component<IPostProcessItemComponentProps> {
    constructor(props: IPostProcessItemComponentProps) {
        super(props);
    }

    render() {
        return (
            <div className="postProcessTools">
                <TreeItemLabelComponent label={this.props.postProcess.name} onClick={() => this.props.onClick()} icon={faMagic} color="red" />
                {
                    <ExtensionsComponent target={this.props.postProcess} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}