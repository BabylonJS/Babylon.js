import * as React from "react";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { LineContainer } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { Body1, makeStyles, tokens } from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";

import { RenderGeneralSection, RenderConstructorVariablesSection, RenderDataConnectionsSection, RenderGenericPropStoreSections } from "./genericNodePropertyComponent";
import { type FlowGraphDataSwitchBlock } from "core/FlowGraph/Blocks/Data/flowGraphDataSwitchBlock";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import { RemoveDataInput } from "./blockMutationHelper";
import { getNumericValue } from "core/FlowGraph/utils";

interface IDataSwitchPropertyState {
    newCaseValue: number;
}

const useStyles = makeStyles({
    caseRow: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        padding: `0 ${tokens.spacingHorizontalXS}`,
        width: "100%",
    },
    caseLabel: {
        flex: 1,
    },
    empty: {
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        color: tokens.colorNeutralForeground3,
        fontStyle: "italic",
    },
});

const CaseRow: React.FunctionComponent<{ value: number; onRemove: () => void }> = ({ value, onRemove }) => {
    const classes = useStyles();
    return (
        <LineContainer uniqueId={`case-${value}`}>
            <div className={classes.caseRow}>
                <Body1 className={classes.caseLabel}>Case: {value}</Body1>
                <Button title="Remove case" appearance="subtle" icon={DismissRegular} onClick={onRemove} />
            </div>
        </LineContainer>
    );
};

const DataSwitchCasesContent: React.FunctionComponent<{
    cases: { display: number; raw: any }[];
    newCaseValue: number;
    onNewCaseValueChange: (value: number) => void;
    onAddCase: () => void;
    onRemoveCase: (caseValue: any) => void;
}> = ({ cases, newCaseValue, onNewCaseValueChange, onAddCase, onRemoveCase }) => {
    const classes = useStyles();
    return (
        <>
            {cases.map(({ display, raw }) => (
                <CaseRow key={`case-${display}`} value={display} onRemove={() => onRemoveCase(raw)} />
            ))}
            {cases.length === 0 && <Body1 className={classes.empty}>No cases defined.</Body1>}
            <NumberInputPropertyLine label="New case value" value={newCaseValue} step={1} onChange={onNewCaseValueChange} />
            <Button label="Add Case" title="Add case" onClick={onAddCase} />
        </>
    );
};

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
        const block = this._getBlock();
        const rawCases: any[] = block.config.cases || [];
        const cases = rawCases.map((c: any) => {
            let display = getNumericValue(c);
            if (block.config.treatCasesAsIntegers) {
                display = display | 0;
            }
            return { display, raw: c };
        });

        return (
            <Accordion uniqueId="FlowGraphDataSwitchProperties" enablePinnedItems enableSearchItems>
                {RenderGeneralSection(this.props)}
                {RenderConstructorVariablesSection(this.props)}

                <AccordionSection title="Cases" collapseByDefault={false}>
                    <DataSwitchCasesContent
                        cases={cases}
                        newCaseValue={this.state.newCaseValue}
                        onNewCaseValueChange={(v) => this.setState({ newCaseValue: v | 0 })}
                        onAddCase={() => this._addCase()}
                        onRemoveCase={(caseVal) => this._removeCase(caseVal)}
                    />
                </AccordionSection>

                {RenderDataConnectionsSection(this.props)}
                {RenderGenericPropStoreSections(this.props)}
            </Accordion>
        );
    }
}
