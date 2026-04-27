import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import {
    GeneralPropertyTabComponent,
    ConstructorVariablesPropertyTabComponent,
    DataConnectionsPropertyTabComponent,
    GenericPropertyTabComponent,
} from "./genericNodePropertyComponent";
import { FLOW_GRAPH_TYPE_OPTIONS } from "./constructorConfigRegistry";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { getRichTypeByFlowGraphType } from "core/FlowGraph/flowGraphRichTypes";
import { RemoveDataInput, RemoveDataOutput } from "./blockMutationHelper";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import { ConnectionPointPortData } from "../connectionPointPortData";
import { type BlockNodeData } from "../blockNodeData";

interface ICustomEventPropertyState {
    newKeyName: string;
    newKeyType: string;
}

/**
 * Property panel for FlowGraphReceiveCustomEventBlock and FlowGraphSendCustomEventBlock.
 * Shows the eventId (via ConstructorVariables) and a dynamic editor for eventData entries.
 *
 * ReceiveCustomEvent creates data OUTPUTS per eventData key.
 * SendCustomEvent creates data INPUTS per eventData key.
 */
export class CustomEventPropertyComponent extends React.Component<IPropertyComponentProps, ICustomEventPropertyState> {
    constructor(props: IPropertyComponentProps) {
        super(props);
        this.state = { newKeyName: "", newKeyType: "number" };
    }

    private _getBlock(): FlowGraphBlock {
        return this.props.nodeData.data as FlowGraphBlock;
    }

    private _isReceiveBlock(): boolean {
        return this._getBlock().getClassName() === FlowGraphBlockNames.ReceiveCustomEvent;
    }

    private _getEventData(): { [key: string]: { type: any; value?: any } } {
        const config = this._getBlock().config as any;
        return config?.eventData || {};
    }

    private _addEntry() {
        const name = this.state.newKeyName.trim();
        if (!name) {
            return;
        }

        const block = this._getBlock();
        const config = block.config as any;
        const eventData = config.eventData || {};

        // Prevent duplicate keys
        if (name in eventData) {
            return;
        }

        const richType = getRichTypeByFlowGraphType(this.state.newKeyType);
        eventData[name] = { type: richType };
        config.eventData = eventData;

        // Register the port on the block and update nodeData so the visual node picks it up
        const blockNodeData = this.props.nodeData as BlockNodeData;
        const nodeData = this.props.nodeData;
        if (this._isReceiveBlock()) {
            const newPort = block.registerDataOutput(name, richType);
            nodeData.outputs.push(new ConnectionPointPortData(newPort, blockNodeData.nodeContainer, "data"));
        } else {
            const newPort = block.registerDataInput(name, richType);
            nodeData.inputs.push(new ConnectionPointPortData(newPort, blockNodeData.nodeContainer, "data"));
        }

        this.setState({ newKeyName: "" });
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        if (this._isReceiveBlock()) {
            nodeData.onOutputCountChanged?.();
        } else {
            nodeData.onInputCountChanged?.();
        }
    }

    private _removeEntry(key: string) {
        const block = this._getBlock();
        const config = block.config as any;
        const eventData = config.eventData;
        if (!eventData || !(key in eventData)) {
            return;
        }

        delete eventData[key];

        const nodeData = this.props.nodeData;
        if (this._isReceiveBlock()) {
            const portIndex = nodeData.outputs.findIndex((p) => p.name === key);
            RemoveDataOutput(block, key);
            if (portIndex !== -1) {
                nodeData.outputs.splice(portIndex, 1);
                nodeData.onOutputRemoved?.(portIndex);
            }
        } else {
            const portIndex = nodeData.inputs.findIndex((p) => p.name === key);
            RemoveDataInput(block, key);
            if (portIndex !== -1) {
                nodeData.inputs.splice(portIndex, 1);
                nodeData.onInputRemoved?.(portIndex);
            }
        }

        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.forceUpdate();
    }

    private _getTypeName(entry: { type: any }): string {
        return entry.type?.typeName || "any";
    }

    private _changeEntryType(key: string, newTypeName: string) {
        const block = this._getBlock();
        const config = block.config as any;
        const eventData = config.eventData;
        if (!eventData || !(key in eventData)) {
            return;
        }

        const richType = getRichTypeByFlowGraphType(newTypeName);
        eventData[key].type = richType;

        // Update the richType on the matching data connection so port colours refresh
        if (this._isReceiveBlock()) {
            const output = block.getDataOutput(key);
            if (output) {
                (output as any).richType = richType;
            }
        } else {
            const input = block.getDataInput(key);
            if (input) {
                (input as any).richType = richType;
            }
        }

        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
        this.forceUpdate();
    }

    override render() {
        const { stateManager, nodeData } = this.props;
        const eventData = this._getEventData();
        const keys = Object.keys(eventData);
        const isReceive = this._isReceiveBlock();

        return (
            <>
                <GeneralPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />
                <ConstructorVariablesPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />

                <LineContainerComponent title={isReceive ? "EVENT DATA OUTPUTS" : "EVENT DATA INPUTS"}>
                    {keys.map((key) => {
                        const typeName = this._getTypeName(eventData[key]);
                        return (
                            <div key={key} style={{ display: "flex", alignItems: "center", padding: "0 4px", gap: "4px" }}>
                                <span style={{ color: "#ccc", fontSize: "12px", paddingLeft: "8px", minWidth: "60px" }}>{key}</span>
                                <OptionsLine
                                    label=""
                                    options={FLOW_GRAPH_TYPE_OPTIONS as any}
                                    target={eventData[key]}
                                    propertyName="type"
                                    valuesAreStrings={true}
                                    noDirectUpdate={true}
                                    extractValue={() => typeName}
                                    onSelect={(v) => this._changeEntryType(key, v as string)}
                                />
                                <button
                                    onClick={() => this._removeEntry(key)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#f55",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        padding: "2px 6px",
                                    }}
                                    title={`Remove ${key}`}
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}
                    {keys.length === 0 && <div style={{ padding: "4px 8px", color: "#888", fontSize: "11px" }}>No event data defined.</div>}

                    {/* New entry form */}
                    <TextInputLineComponent
                        label="Name"
                        lockObject={stateManager.lockObject}
                        target={this.state}
                        propertyName="newKeyName"
                        throttlePropertyChangedNotification={true}
                        onChange={(v) => this.setState({ newKeyName: v })}
                    />
                    <OptionsLine
                        label="Type"
                        options={FLOW_GRAPH_TYPE_OPTIONS as any}
                        target={this.state}
                        propertyName="newKeyType"
                        valuesAreStrings={true}
                        noDirectUpdate={true}
                        extractValue={() => this.state.newKeyType}
                        onSelect={(v) => this.setState({ newKeyType: v as string })}
                    />
                    <ButtonLineComponent label="Add Entry" onClick={() => this._addEntry()} isDisabled={!this.state.newKeyName.trim()} />
                </LineContainerComponent>

                <DataConnectionsPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />
                <GenericPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />
            </>
        );
    }
}
