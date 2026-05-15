import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import {
    GeneralPropertyTabComponent,
    ConstructorVariablesPropertyTabComponent,
    DataConnectionsPropertyTabComponent,
    GenericPropertyTabComponent,
} from "./genericNodePropertyComponent";
import { type FlowGraphDataSwitchBlock } from "core/FlowGraph/Blocks/Data/flowGraphDataSwitchBlock";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import { RemoveDataInput } from "./blockMutationHelper";
import { getNumericValue } from "core/FlowGraph/utils";

interface IDataSwitchPropertyState {
    newCaseValue: number;
}

/**
 * Property panel for FlowGraphDataSwitchBlock.
 * Shows the list of case values with add/remove controls using in-place port mutation.
 */
export class DataSwitchPropertyComponent extends React.Component<IPropertyComponentProps, IDataSwitchPropertyState> {
    constructor(props: IPropertyComponentProps) {
        super(props);
        const block = this._getBlock();
        const cases: any[] = block.config.cases || [];
        const max = cases.length > 0 ? Math.max(...cases.map((c: any) => getNumericValue(c))) : -1;
        this.state = { newCaseValue: max + 1 };
    }

    private _getBlock(): FlowGraphDataSwitchBlock<any> {
        return this.props.nodeData.data as FlowGraphDataSwitchBlock<any>;
    }

    private _addCase() {
        const block = this._getBlock();
        let value = this.state.newCaseValue;

        if (block.config.treatCasesAsIntegers) {
            value = value | 0;
        }

        // Check for duplicate
        const existing = block.config.cases.map((c: any) => {
            let v = getNumericValue(c);
            if (block.config.treatCasesAsIntegers) {
                v = v | 0;
            }
            return v;
        });
        if (existing.includes(value)) {
            return;
        }

        // Mutate the block in place: add to config.cases, register data input, update internal map
        block.config.cases.push(value);
        const newInput = block.registerDataInput(`in_${value}`, RichTypeAny);
        (block as any)._inputCases.set(value, newInput);

        this.setState({ newCaseValue: value + 1 });
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block as unknown as FlowGraphBlock);
    }

    private _removeCase(caseValue: any) {
        const block = this._getBlock();
        let numVal = getNumericValue(caseValue);
        if (block.config.treatCasesAsIntegers) {
            numVal = numVal | 0;
        }

        // Remove data input port, internal map entry, and config entry
        RemoveDataInput(block as unknown as FlowGraphBlock, `in_${numVal}`);
        (block as any)._inputCases.delete(numVal);
        const idx = block.config.cases.findIndex((c: any) => {
            let v = getNumericValue(c);
            if (block.config.treatCasesAsIntegers) {
                v = v | 0;
            }
            return v === numVal;
        });
        if (idx !== -1) {
            block.config.cases.splice(idx, 1);
        }

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
                <ConstructorVariablesPropertyTabComponent stateManager={stateManager} nodeData={nodeData} />

                <LineContainerComponent title="CASES">
                    {cases.map((caseVal: any, idx: number) => {
                        let numVal = getNumericValue(caseVal);
                        if (block.config.treatCasesAsIntegers) {
                            numVal = numVal | 0;
                        }
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
