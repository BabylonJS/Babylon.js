import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";
import { faDiagramProject, faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";
import type { FrameGraph } from "core/FrameGraph/frameGraph";

interface IFrameGraphItemComponenttProps {
    frameGraph: FrameGraph;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    onClick: () => void;
}

export class FrameGraphTreeItemComponent extends React.Component<IFrameGraphItemComponenttProps> {
    constructor(props: IFrameGraphItemComponenttProps) {
        super(props);
    }

    override render() {
        const nrgeIcon = this.props.frameGraph.linkedNodeRenderGraph ? (
            <div
                className="icon"
                onClick={() => {
                    this.props.frameGraph.linkedNodeRenderGraph!.edit({ nodeRenderGraphEditorConfig: { hostScene: this.props.frameGraph.scene } });
                }}
                title="Node Render Graph Editor"
                color="Green"
            >
                <FontAwesomeIcon icon={faPen} />
            </div>
        ) : null;

        return (
            <div className="frameGraphTools">
                <TreeItemLabelComponent label={this.props.frameGraph.name} onClick={() => this.props.onClick()} icon={faDiagramProject} color="Green" />
                {<ExtensionsComponent target={this.props.frameGraph} extensibilityGroups={this.props.extensibilityGroups} />}
                {nrgeIcon}
            </div>
        );
    }
}
