import { IExplorerExtensibilityGroup } from "babylonjs/Debug/debugLayer";
import { PostProcessRenderPipeline } from 'babylonjs/PostProcesses/RenderPipeline/postProcessRenderPipeline';

import { faMagic } from '@fortawesome/free-solid-svg-icons';
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from 'react';

interface IRenderPipelineItemComponenttProps {
    renderPipeline: PostProcessRenderPipeline,
    extensibilityGroups?: IExplorerExtensibilityGroup[],
    onClick: () => void
}

export class RenderingPipelineItemComponent extends React.Component<IRenderPipelineItemComponenttProps> {
    constructor(props: IRenderPipelineItemComponenttProps) {
        super(props);
    }

    render() {
        return (
            <div className="postProcessTools">
                <TreeItemLabelComponent label={this.props.renderPipeline.name} onClick={() => this.props.onClick()} icon={faMagic} color="orangered" />
                {
                    <ExtensionsComponent target={this.props.renderPipeline} extensibilityGroups={this.props.extensibilityGroups} />
                }
            </div>
        )
    }
}