import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import {
    GeneralPropertyTabComponent,
    ConstructorVariablesPropertyTabComponent,
    DataConnectionsPropertyTabComponent,
    GenericPropertyTabComponent,
} from "./genericNodePropertyComponent";
import type { FlowGraphSetVariableBlock } from "core/FlowGraph/Blocks/Execution/flowGraphSetVariableBlock";
import type { IFlowGraphSetVariableBlockConfiguration } from "core/FlowGraph/Blocks/Execution/flowGraphSetVariableBlock";
import type { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import { RemoveDataInput } from "./blockMutationHelper";

interface ISetVariablePropertyState {
    newVarName: string;
}

/**
 * Property panel for FlowGraphSetVariableBlock.
 * Handles both single-variable mode (via ConstructorVariablesPropertyTabComponent) and
 * multi-variable mode (shows a dynamic list of variable names with add/remove).
 */
export class SetVariablePropertyComponent extends React.Component<IPropertyComponentProps, ISetVariablePropertyState> {
    constructor(props: IPropertyComponentProps) {
        super(props);
        this.state = { newVarName: "" };
    }

    private _getBlock(): FlowGraphSetVariableBlock<any> {
        return this.props.nodeData.data as FlowGraphSetVariableBlock<any>;
    }

    private _getConfig(): IFlowGraphSetVariableBlockConfiguration {
        return this._getBlock().config as IFlowGraphSetVariableBlockConfiguration;
    }

    private _isMultiMode(): boolean {
        return !!this._getConfig().variables;
    }

    private _addVariable() {
        const name = this.state.newVarName.trim();
        if (!name) {
            return;
        }

        const block = this._getBlock();
        const config = this._getConfig();
        if (!config.variables) {
            return;
        }

        // Prevent duplicate
        if (config.variables.includes(name)) {
            return;
        }

        config.variables.push(name);
        block.registerDataInput(name, RichTypeAny);

        this.setState({ newVarName: "" });
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block as unknown as FlowGraphBlock);
    }

    private _removeVariable(name: string) {
        const block = this._getBlock();
        const config = this._getConfig();
        if (!config.variables) {
            return;
        }

        const idx = config.variables.indexOf(name);
        if (idx === -1) {
            return;
        }

        config.variables.splice(idx, 1);
        RemoveDataInput(block as unknown as FlowGraphBlock, name);

        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block as unknown as FlowGraphBlock);
        this.forceUpdate();
    }

    override render() {
        const { stateManager, nodeData } = this.props;
        const isMulti = this._isMultiMode();
        const config = this._getConfig();

        return (
            <>
                <GeneralPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />

                {/* Single-variable mode: handled by the standard constructor config UI */}
                {!isMulti && <ConstructorVariablesPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />}

                {/* Multi-variable mode: dynamic list */}
                {isMulti && (
                    <LineContainerComponent title="VARIABLES">
                        {(config.variables || []).map((varName: string) => (
                            <div key={varName} style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
                                <span style={{ flex: 1, color: "#ccc", fontSize: "12px", paddingLeft: "8px" }}>{varName}</span>
                                <button
                                    onClick={() => this._removeVariable(varName)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#f55",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        padding: "2px 6px",
                                    }}
                                    title="Remove variable"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        {(config.variables || []).length === 0 && <div style={{ padding: "4px 8px", color: "#888", fontSize: "11px" }}>No variables defined.</div>}
                        <TextInputLineComponent
                            label="New variable"
                            lockObject={stateManager.lockObject}
                            target={this.state}
                            propertyName="newVarName"
                            throttlePropertyChangedNotification={true}
                            onChange={(v) => this.setState({ newVarName: v })}
                        />
                        <ButtonLineComponent label="Add Variable" onClick={() => this._addVariable()} isDisabled={!this.state.newVarName.trim()} />
                    </LineContainerComponent>
                )}

                <DataConnectionsPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />
                <GenericPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />
            </>
        );
    }
}
