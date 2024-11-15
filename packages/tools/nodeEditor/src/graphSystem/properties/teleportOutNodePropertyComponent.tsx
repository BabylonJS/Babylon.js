import * as React from "react";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import type { NodeMaterialTeleportOutBlock } from "core/Materials/Node/Blocks/Teleport/teleportOutBlock";
import type { NodeMaterialTeleportInBlock } from "core/Materials/Node/Blocks/Teleport/teleportInBlock";
import type { GlobalState } from "../../globalState";

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
        const block = this.props.nodeData.data as NodeMaterialTeleportOutBlock;

        const options = [{ label: "None", value: -1 }];
        const teleporters: NodeMaterialTeleportInBlock[] = [];

        const nodeGeometry = (this.props.stateManager.data as GlobalState).nodeMaterial;

        for (const block of nodeGeometry.attachedBlocks) {
            if (block.getClassName() === "NodeMaterialTeleportInBlock") {
                teleporters.push(block as NodeMaterialTeleportInBlock);
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
                            // Remove the highlight from the previous entry point
                            if (block.entryPoint) {
                                this.props.stateManager.onHighlightNodeObservable.notifyObservers({ data: block.entryPoint, active: false });
                            }
                            switch (value) {
                                case -1:
                                    block.detach();
                                    break;
                                default: {
                                    const source = teleporters.find((t) => t.uniqueId === value);
                                    source?.attachToEndpoint(block);
                                }
                            }
                            // Highlight the new entry point
                            if (block.entryPoint) {
                                this.props.stateManager.onHighlightNodeObservable.notifyObservers({ data: block.entryPoint, active: true });
                            }
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
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
