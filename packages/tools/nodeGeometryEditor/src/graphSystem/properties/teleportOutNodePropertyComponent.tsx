import * as React from "react";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import type { TeleportOutBlock } from "core/Meshes/Node/Blocks/Teleport/teleportOutBlock";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";
import type { GlobalState } from "node-geometry-editor/globalState";
import type { TeleportInBlock } from "core/Meshes/Node/Blocks/Teleport/teleportInBlock";

export class TeleportOutPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    private _onUpdateRequiredObserver: Nullable<Observer<any>>;

    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    componentDidMount() {
        this._onUpdateRequiredObserver = this.props.stateManager.onUpdateRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        this.props.stateManager.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
    }

    render() {
        const block = this.props.nodeData.data as TeleportOutBlock;

        const options = [{ label: "None", value: -1 }];
        const teleporters = new Array<TeleportInBlock>();

        const nodeGeometry = (this.props.stateManager.data as GlobalState).nodeGeometry;

        for (const block of nodeGeometry.attachedBlocks) {
            if (block.getClassName() === "TeleportInBlock") {
                teleporters.push(block as TeleportInBlock);
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
                    <OptionsLineComponent
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
