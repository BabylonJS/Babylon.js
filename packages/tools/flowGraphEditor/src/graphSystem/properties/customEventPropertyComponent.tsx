import * as React from "react";
import { type IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { LineContainer } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { StringDropdown, type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { Body1, makeStyles, tokens } from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";

import { RenderGeneralSection, RenderConstructorVariablesSection, RenderDataConnectionsSection, RenderGenericPropStoreSections } from "./genericNodePropertyComponent";
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

const useStyles = makeStyles({
    entryRow: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        padding: `0 ${tokens.spacingHorizontalXS}`,
        width: "100%",
    },
    entryName: {
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    entryTypePicker: {
        width: "120px",
    },
    empty: {
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        color: tokens.colorNeutralForeground3,
        fontStyle: "italic",
    },
});

const TypeOptions: DropdownOption<string>[] = FLOW_GRAPH_TYPE_OPTIONS.map((opt) => ({ label: opt.label, value: opt.value }));

const EntryRow: React.FunctionComponent<{ name: string; typeName: string; onChangeType: (typeName: string) => void; onRemove: () => void }> = ({
    name,
    typeName,
    onChangeType,
    onRemove,
}) => {
    const classes = useStyles();
    return (
        <LineContainer uniqueId={`event-data-${name}`}>
            <div className={classes.entryRow}>
                <Body1 className={classes.entryName}>{name}</Body1>
                <div className={classes.entryTypePicker}>
                    <StringDropdown options={TypeOptions} value={typeName} onChange={onChangeType} />
                </div>
                <Button title={`Remove ${name}`} appearance="subtle" icon={DismissRegular} onClick={onRemove} />
            </div>
        </LineContainer>
    );
};

const EventDataContent: React.FunctionComponent<{
    keys: string[];
    eventData: Record<string, { type: any }>;
    newKeyName: string;
    newKeyType: string;
    canAdd: boolean;
    onChangeNewKeyName: (value: string) => void;
    onChangeNewKeyType: (value: string) => void;
    onChangeEntryType: (key: string, typeName: string) => void;
    onAddEntry: () => void;
    onRemoveEntry: (key: string) => void;
}> = ({ keys, eventData, newKeyName, newKeyType, canAdd, onChangeNewKeyName, onChangeNewKeyType, onChangeEntryType, onAddEntry, onRemoveEntry }) => {
    const classes = useStyles();
    return (
        <>
            {keys.map((key) => (
                <EntryRow
                    key={key}
                    name={key}
                    typeName={eventData[key].type?.typeName || "any"}
                    onChangeType={(t) => onChangeEntryType(key, t)}
                    onRemove={() => onRemoveEntry(key)}
                />
            ))}
            {keys.length === 0 && <Body1 className={classes.empty}>No event data defined.</Body1>}
            <TextInputPropertyLine label="Name" value={newKeyName} onChange={onChangeNewKeyName} />
            <StringDropdownPropertyLine label="Type" options={TypeOptions} value={newKeyType} onChange={onChangeNewKeyType} />
            <Button label="Add Entry" title="Add entry" disabled={!canAdd} onClick={onAddEntry} />
        </>
    );
};

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
        const eventData = this._getEventData();
        const keys = Object.keys(eventData);
        const isReceive = this._isReceiveBlock();

        return (
            <Accordion uniqueId="FlowGraphCustomEventProperties" enablePinnedItems enableSearchItems>
                {RenderGeneralSection(this.props)}
                {RenderConstructorVariablesSection(this.props)}

                <AccordionSection title={isReceive ? "Event Data Outputs" : "Event Data Inputs"} collapseByDefault={false}>
                    <EventDataContent
                        keys={keys}
                        eventData={eventData}
                        newKeyName={this.state.newKeyName}
                        newKeyType={this.state.newKeyType}
                        canAdd={!!this.state.newKeyName.trim()}
                        onChangeNewKeyName={(v) => this.setState({ newKeyName: v })}
                        onChangeNewKeyType={(v) => this.setState({ newKeyType: v })}
                        onChangeEntryType={(k, t) => this._changeEntryType(k, t)}
                        onAddEntry={() => this._addEntry()}
                        onRemoveEntry={(k) => this._removeEntry(k)}
                    />
                </AccordionSection>

                {RenderDataConnectionsSection(this.props)}
                {RenderGenericPropStoreSections(this.props)}
            </Accordion>
        );
    }
}
