import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";
import type { PostProcessRenderPipeline } from "core/PostProcesses/RenderPipeline/postProcessRenderPipeline";

import { faMagic } from "@fortawesome/free-solid-svg-icons";
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";

interface IRenderPipelineItemComponentProps {
    renderPipeline: PostProcessRenderPipeline;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onClick: () => void;
}

export class RenderingPipelineItemComponent extends React.Component<IRenderPipelineItemComponentProps> {
    constructor(props: IRenderPipelineItemComponentProps) {
        super(props);
    }

    render() {
        return (
            <div className="postProcessTools">
                <TreeItemLabelComponent label={this.props.renderPipeline.name} onClick={() => this.props.onClick()} icon={faMagic} color="orangered" />
                {<ExtensionsComponent target={this.props.renderPipeline} extensibilityGroups={this.props.extensibilityGroups} />}
            </div>
        );
    }
}
