import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TreeItemLabelComponent } from "../treeItemLabelComponent";
import { ExtensionsComponent } from "../extensionsComponent";
import * as React from "react";
import type { FrameGraph } from "core/FrameGraph/frameGraph";
import frameGraphIcon from "./ic_fluent_flow_24_filled.svg";

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
        const nrgeIcon = this.props.frameGraph.getLinkedNodeRenderGraph() ? (
            <div
                className="icon"
                onClick={() => {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    this.props.frameGraph.getLinkedNodeRenderGraph()!.edit({ nodeRenderGraphEditorConfig: { hostScene: this.props.frameGraph.scene } });
                }}
                title="Node Render Graph Editor"
            >
                <FontAwesomeIcon icon={faPen} />
            </div>
        ) : null;

        return (
            <div className="frameGraphTools">
                <TreeItemLabelComponent label={this.props.frameGraph.name} onClick={() => this.props.onClick()} iconBase64={frameGraphIcon} color="#6e9189" />
                {<ExtensionsComponent target={this.props.frameGraph} extensibilityGroups={this.props.extensibilityGroups} />}
                {nrgeIcon}
            </div>
        );
    }
}
