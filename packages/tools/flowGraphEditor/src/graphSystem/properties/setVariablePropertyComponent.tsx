import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import {
    GeneralPropertyTabComponent,
    ConstructorVariablesPropertyTabComponent,
    DataConnectionsPropertyTabComponent,
    GenericPropertyTabComponent,
} from "./genericNodePropertyComponent";
import { type FlowGraphSetVariableBlock, type IFlowGraphSetVariableBlockConfiguration } from "core/FlowGraph/Blocks/Execution/flowGraphSetVariableBlock";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import { RemoveDataInput } from "./blockMutationHelper";
import { type GlobalState } from "../../globalState";
import { AutoCompleteInputComponent } from "../../sharedComponents/autoCompleteInputComponent";
import { GatherVariableNames } from "../../variableUtils";

/**
 * Property panel for FlowGraphSetVariableBlock.
 * Handles both single-variable mode (via ConstructorVariablesPropertyTabComponent) and
 * multi-variable mode (shows a dynamic list of variable names with add/remove).
 */
export class SetVariablePropertyComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
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

    /**
     * Gathers variable names defined elsewhere in the graph (excluding ones
     * already added to this block) for the multi-variable picker.
     * @returns an array of variable names available to pick from other blocks and contexts in the graph.
     */
    private _getPickableVariableNames(): string[] {
        const globalState = this.props.stateManager.data as GlobalState;
        const fg = globalState.flowGraph;
        if (!fg) {
            return [];
        }

        const currentBlock = this._getBlock() as unknown as FlowGraphBlock;
        const config = this._getConfig();
        const alreadyAdded = new Set(config.variables ?? []);

        const allNames = GatherVariableNames(fg, currentBlock);
        return allNames.filter((name) => !alreadyAdded.has(name));
    }

    private _addExistingVariable(name: string) {
        if (!name) {
            return;
        }

        const block = this._getBlock();
        const config = this._getConfig();
        if (!config.variables) {
            return;
        }

        if (config.variables.includes(name)) {
            return;
        }

        config.variables.push(name);
        block.registerDataInput(name, RichTypeAny);

        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block as unknown as FlowGraphBlock);
        this.forceUpdate();
    }

    override render() {
        const { stateManager, nodeData } = this.props;
        const isMulti = this._isMultiMode();
        const config = this._getConfig();
        const pickableVars = isMulti ? this._getPickableVariableNames() : [];

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
                        <AutoCompleteInputComponent
                            label="Add variable"
                            value=""
                            suggestions={pickableVars}
                            lockObject={stateManager.lockObject}
                            onChange={(v) => {
                                if (v) {
                                    this._addExistingVariable(v);
                                }
                            }}
                        />
                    </LineContainerComponent>
                )}

                <DataConnectionsPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />
                <GenericPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />
            </>
        );
    }
}
