import * as React from "react";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { LineContainer } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { Body1, makeStyles, tokens } from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";

import { RenderGeneralSection, RenderDataConnectionsSection, RenderGenericPropStoreSections } from "./genericNodePropertyComponent";
import { type FlowGraphSwitchBlock } from "core/FlowGraph/Blocks/Execution/ControlFlow/flowGraphSwitchBlock";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { RemoveSignalOutput } from "./blockMutationHelper";
import { getNumericValue } from "core/FlowGraph/utils";

interface ISwitchBlockPropertyState {
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
        const block = this._getBlock();
        const cases: any[] = block.config.cases || [];

        return (
            <Accordion uniqueId="FlowGraphSwitchProperties" enablePinnedItems enableSearchItems>
                {RenderGeneralSection(this.props)}

                <AccordionSection title="Cases" collapseByDefault={false}>
                    <SwitchCasesContent
                        cases={cases}
                        newCaseValue={this.state.newCaseValue}
                        onNewCaseValueChange={(v) => this.setState({ newCaseValue: Math.trunc(v) })}
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

const SwitchCasesContent: React.FunctionComponent<{
    cases: any[];
    newCaseValue: number;
    onNewCaseValueChange: (value: number) => void;
    onAddCase: () => void;
    onRemoveCase: (caseValue: any) => void;
}> = ({ cases, newCaseValue, onNewCaseValueChange, onAddCase, onRemoveCase }) => {
    const classes = useStyles();
    return (
        <>
            {cases.map((caseVal: any) => {
                const numVal = getNumericValue(caseVal);
                return <CaseRow key={`case-${numVal}`} value={numVal} onRemove={() => onRemoveCase(caseVal)} />;
            })}
            {cases.length === 0 && <Body1 className={classes.empty}>No cases defined.</Body1>}
            <NumberInputPropertyLine label="New case value" value={newCaseValue} step={1} onChange={onNewCaseValueChange} />
            <Button label="Add Case" title="Add case" onClick={onAddCase} />
        </>
    );
};
