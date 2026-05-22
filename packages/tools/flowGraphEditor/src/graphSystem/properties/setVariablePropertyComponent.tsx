import * as React from "react";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { LineContainer } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { ComboBoxPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/comboBoxPropertyLine";
import { Body1, makeStyles, tokens } from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";

import { RenderGeneralSection, RenderConstructorVariablesSection, RenderDataConnectionsSection, RenderGenericPropStoreSections } from "./genericNodePropertyComponent";
import { type FlowGraphSetVariableBlock, type IFlowGraphSetVariableBlockConfiguration } from "core/FlowGraph/Blocks/Execution/flowGraphSetVariableBlock";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";
import { RemoveDataInput } from "./blockMutationHelper";
import { type GlobalState } from "../../globalState";
import { GatherVariableNames } from "../../variableUtils";

const useStyles = makeStyles({
    row: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        padding: `0 ${tokens.spacingHorizontalXS}`,
        width: "100%",
    },
    name: { flex: 1 },
    empty: {
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        color: tokens.colorNeutralForeground3,
        fontStyle: "italic",
    },
});

const VariableRow: React.FunctionComponent<{ name: string; onRemove: () => void }> = ({ name, onRemove }) => {
    const classes = useStyles();
    return (
        <LineContainer uniqueId={`variable-${name}`}>
            <div className={classes.row}>
                <Body1 className={classes.name}>{name}</Body1>
                <Button title="Remove variable" appearance="subtle" icon={DismissRegular} onClick={onRemove} />
            </div>
        </LineContainer>
    );
};

const VariablesSectionContent: React.FunctionComponent<{
    variables: string[];
    pickableVars: string[];
    onAddVariable: (name: string) => void;
    onRemoveVariable: (name: string) => void;
}> = ({ variables, pickableVars, onAddVariable, onRemoveVariable }) => {
    const classes = useStyles();
    const [draftName, setDraftName] = React.useState("");
    return (
        <>
            {variables.map((name) => (
                <VariableRow key={name} name={name} onRemove={() => onRemoveVariable(name)} />
            ))}
            {variables.length === 0 && <Body1 className={classes.empty}>No variables defined.</Body1>}
            <ComboBoxPropertyLine
                label="Add variable"
                value={draftName}
                options={pickableVars.map((n) => ({ label: n, value: n }))}
                onChange={(value) => {
                    if (value) {
                        onAddVariable(value);
                        setDraftName("");
                    } else {
                        setDraftName(value);
                    }
                }}
            />
        </>
    );
};

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
        const isMulti = this._isMultiMode();
        const config = this._getConfig();
        const pickableVars = isMulti ? this._getPickableVariableNames() : [];

        return (
            <Accordion uniqueId="FlowGraphSetVariableProperties" enablePinnedItems enableSearchItems>
                {RenderGeneralSection(this.props)}

                {/* Single-variable mode: handled by the standard constructor config UI */}
                {!isMulti && RenderConstructorVariablesSection(this.props)}

                {/* Multi-variable mode: dynamic list */}
                {isMulti && (
                    <AccordionSection title="Variables" collapseByDefault={false}>
                        <VariablesSectionContent
                            variables={config.variables ?? []}
                            pickableVars={pickableVars}
                            onAddVariable={(name) => this._addExistingVariable(name)}
                            onRemoveVariable={(name) => this._removeVariable(name)}
                        />
                    </AccordionSection>
                )}

                {RenderDataConnectionsSection(this.props)}
                {RenderGenericPropStoreSections(this.props)}
            </Accordion>
        );
    }
}
