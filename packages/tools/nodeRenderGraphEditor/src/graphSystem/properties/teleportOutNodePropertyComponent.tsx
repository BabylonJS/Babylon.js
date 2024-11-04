import * as React from "react";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import type { NodeRenderGraphTeleportOutBlock } from "core/FrameGraph/Node/Blocks/Teleport/teleportOutBlock";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import type { GlobalState } from "node-render-graph-editor/globalState";
import type { NodeRenderGraphTeleportInBlock } from "core/FrameGraph/Node/Blocks/Teleport/teleportInBlock";

export class TeleportOutPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    private _onUpdateRequiredObserver: Nullable<Observer<any>>;

    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override componentDidMount() {
        this._onUpdateRequiredObserver = this.props.stateManager.onUpdateRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    override componentWillUnmount() {
        this.props.stateManager.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
    }

    override render() {
        const block = this.props.nodeData.data as NodeRenderGraphTeleportOutBlock;

        const options = [{ label: "None", value: -1 }];
        const teleporters: NodeRenderGraphTeleportInBlock[] = [];

        const nodeRenderGraph = (this.props.stateManager.data as GlobalState).nodeRenderGraph;

        for (const block of nodeRenderGraph.attachedBlocks) {
            if (block.getClassName() === "NodeRenderGraphTeleportInBlock") {
                teleporters.push(block as NodeRenderGraphTeleportInBlock);
            }
        }

        teleporters.sort((a, b) => a.name.localeCompare(b.name));

        for (const block of teleporters) {
            options.push({ label: block.name, value: block.uniqueId });
        }

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    <OptionsLine
                        label="Entry point"
                        options={options}
                        target={block}
                        propertyName="entryPoint"
                        noDirectUpdate={true}
                        onSelect={(value) => {
                            switch (value) {
                                case -1:
                                    block.detach();
                                    break;
                                default: {
                                    const source = teleporters.find((t) => t.uniqueId === value);
                                    source?.attachToEndpoint(block);
                                }
                            }

                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            this.forceUpdate();
                        }}
                        extractValue={() => {
                            if (!block.entryPoint) {
                                return -1;
                            }

                            return block.entryPoint?.uniqueId;
                        }}
                    />
                </LineContainerComponent>
            </div>
        );
    }
}
