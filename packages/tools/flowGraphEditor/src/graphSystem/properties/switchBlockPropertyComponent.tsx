import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { GeneralPropertyTabComponent, DataConnectionsPropertyTabComponent, GenericPropertyTabComponent } from "./genericNodePropertyComponent";
import type { FlowGraphSwitchBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphSwitchBlock";
import type { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { RemoveSignalOutput } from "./blockMutationHelper";
import { getNumericValue } from "core/FlowGraph/utils";

interface ISwitchBlockPropertyState {
    newCaseValue: number;
}

/**
 * Property panel for FlowGraphSwitchBlock.
 * Shows the list of case values with add/remove controls.
 */
export class SwitchBlockPropertyComponent extends React.Component<IPropertyComponentProps, ISwitchBlockPropertyState> {
    constructor(props: IPropertyComponentProps) {
        super(props);
        const block = this._getBlock();
        const cases = block.config.cases || [];
        const max = cases.length > 0 ? Math.max(...cases.map((c: any) => getNumericValue(c))) : -1;
        this.state = { newCaseValue: max + 1 };
    }

    private _getBlock(): FlowGraphSwitchBlock<any> {
        return this.props.nodeData.data as FlowGraphSwitchBlock<any>;
    }

    private _addCase() {
        const block = this._getBlock();
        const value = this.state.newCaseValue;

        // addCase handles config.cases, _caseToOutputFlow map, and signal output registration
        block.addCase(value);

        // Auto-suggest next value
        this.setState({ newCaseValue: value + 1 });

        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block as unknown as FlowGraphBlock);
    }

    private _removeCase(caseValue: any) {
        const block = this._getBlock();

        // removeCase only cleans config.cases and _caseToOutputFlow — the signal output stays.
        // We must remove the signal output port explicitly first.
        RemoveSignalOutput(block as unknown as FlowGraphBlock, `out_${caseValue}`);

        block.removeCase(caseValue);

        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block as unknown as FlowGraphBlock);
        this.forceUpdate();
    }

    override render() {
        const { stateManager, nodeData } = this.props;
        const block = this._getBlock();
        const cases: any[] = block.config.cases || [];

        return (
            <>
                <GeneralPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />

                <LineContainerComponent title="CASES">
                    {cases.map((caseVal: any, idx: number) => {
                        const numVal = getNumericValue(caseVal);
                        return (
                            <div key={`case-${numVal}`} style={{ display: "flex", alignItems: "center", padding: "0 4px" }}>
                                <span style={{ flex: 1, color: "#ccc", fontSize: "12px", paddingLeft: "8px" }}>Case: {numVal}</span>
                                <button
                                    onClick={() => this._removeCase(caseVal)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        color: "#f55",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        padding: "2px 6px",
                                    }}
                                    title="Remove case"
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}
                    {cases.length === 0 && <div style={{ padding: "4px 8px", color: "#888", fontSize: "11px" }}>No cases defined.</div>}
                    <FloatLineComponent
                        label="New case value"
                        lockObject={stateManager.lockObject}
                        digits={0}
                        step={"1"}
                        isInteger={true}
                        target={this.state}
                        propertyName="newCaseValue"
                        onChange={(v) => this.setState({ newCaseValue: v })}
                    />
                    <ButtonLineComponent label="Add Case" onClick={() => this._addCase()} />
                </LineContainerComponent>

                <DataConnectionsPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />
                <GenericPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />
            </>
        );
    }
}
