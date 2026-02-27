import * as React from "react";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import type { IPropertyDescriptionForEdition, IEditablePropertyListOption } from "core/Decorators/nodeDecorator";
import { PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { NodeMaterialBlockTargets } from "core/Materials/Node/Enums/nodeMaterialBlockTargets";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { ForceRebuild } from "shared-ui-components/nodeGraphSystem/automaticProperties";
import { PropertyTabComponentBase } from "shared-ui-components/components/propertyTabComponentBase";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import type { INodeData } from "shared-ui-components/nodeGraphSystem/interfaces/nodeData";

export class DefaultPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override render() {
        return (
            <PropertyTabComponentBase>
                {GetGeneralProperties({ stateManager: this.props.stateManager, nodeData: this.props.nodeData })}
                {GetGenericProperties({ stateManager: this.props.stateManager, nodeData: this.props.nodeData })}
            </PropertyTabComponentBase>
        );
    }
}

/**
 * NOTE This is intentionally a function to avoid another wrapper JSX element around the lineContainerComponent, and will ensure
 * the lineContainerComponent gets properly rendered as a child of the Accordion
 * @param props
 * @returns
 */
export function GetGeneralProperties(props: IPropertyComponentProps) {
    return (
        <LineContainerComponent title="GENERAL">
            <GeneralPropertiesContent stateManager={props.stateManager} nodeData={props.nodeData} />
        </LineContainerComponent>
    );
}

class GeneralPropertiesContent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override render() {
        const targetOptions = [
            { label: "Neutral", value: NodeMaterialBlockTargets.Neutral },
            { label: "Vertex", value: NodeMaterialBlockTargets.Vertex },
            { label: "Fragment", value: NodeMaterialBlockTargets.Fragment },
        ];

        const block = this.props.nodeData.data as NodeMaterialBlock;

        return (
            <>
                {(!block.isInput || !(block as InputBlock).isAttribute) && (
                    <TextInputLineComponent
                        label="Name"
                        propertyName="name"
                        target={block}
                        lockObject={this.props.stateManager.lockObject}
                        onChange={() => this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block)}
                        throttlePropertyChangedNotification={true}
                        validator={(newName) => {
                            if (!block.validateBlockName(newName)) {
                                this.props.stateManager.onErrorMessageDialogRequiredObservable.notifyObservers(`"${newName}" is a reserved name, please choose another`);
                                return false;
                            }
                            return true;
                        }}
                    />
                )}
                {block._originalTargetIsNeutral && (
                    <OptionsLine
                        label="Target"
                        options={targetOptions}
                        target={block}
                        propertyName="target"
                        onSelect={() => {
                            this.forceUpdate();

                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                        }}
                    />
                )}
                {!block._originalTargetIsNeutral && <TextLineComponent label="Target" value={NodeMaterialBlockTargets[block.target]} />}
                <TextLineComponent label="Type" value={block.getClassName()} />
                <TextInputLineComponent
                    label="Comments"
                    propertyName="comments"
                    lockObject={this.props.stateManager.lockObject}
                    target={block}
                    onChange={() => this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block)}
                    throttlePropertyChangedNotification={true}
                />
            </>
        );
    }
}

/**
 * NOTE This is intentionally a function to avoid another wrapper JSX element around the lineContainerComponent, and will ensure
 * the lineContainerComponent gets properly rendered as a child of the Accordion
 * @param props
 * @returns
 */
export function GetGenericProperties(props: IPropertyComponentProps) {
    const content = GetGenericPropertiesContent(props.stateManager, props.nodeData);
    if (!content) {
        return <></>;
    }
    const { groups, componentList } = content;

    return (
        <>
            {groups.map((group) => (
                <LineContainerComponent key={`group-${group}`} title={group}>
                    {componentList[group]}
                </LineContainerComponent>
            ))}
        </>
    );
}

type GenericContent = {
    componentList: { [groupName: string]: JSX.Element[] };
    groups: string[];
};
function GetGenericPropertiesContent(stateManager: StateManager, nodeData: INodeData): GenericContent | undefined {
    const block = nodeData.data as NodeMaterialBlock,
        propStore: IPropertyDescriptionForEdition[] = (block as any)._propStore;

    if (!propStore) {
        return undefined;
    }

    const componentList: { [groupName: string]: JSX.Element[] } = {},
        groups: string[] = [];

    const classes: string[] = [];

    let proto = Object.getPrototypeOf(block);
    while (proto && proto.getClassName) {
        classes.push(proto.getClassName());
        proto = Object.getPrototypeOf(proto);
    }

    for (const { propertyName, displayName, type, groupName, options, className } of propStore) {
        let components = componentList[groupName];

        if (classes.indexOf(className) === -1) {
            continue;
        }

        if (!components) {
            components = [];
            componentList[groupName] = components;
            groups.push(groupName);
        }

        switch (type) {
            case PropertyTypeForEdition.Boolean: {
                components.push(
                    <CheckBoxLineComponent
                        key={`checkBox-${propertyName}`}
                        label={displayName}
                        target={block}
                        propertyName={propertyName}
                        onValueChanged={() => ForceRebuild(block, stateManager, propertyName, options.notifiers)}
                    />
                );
                break;
            }
            case PropertyTypeForEdition.Float: {
                const cantDisplaySlider = isNaN(options.min as number) || isNaN(options.max as number) || options.min === options.max;
                if (cantDisplaySlider) {
                    components.push(
                        <FloatLineComponent
                            key={`float-${propertyName}`}
                            lockObject={stateManager.lockObject}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            onChange={() => ForceRebuild(block, stateManager, propertyName, options.notifiers)}
                        />
                    );
                } else {
                    components.push(
                        <SliderLineComponent
                            key={`slider-${propertyName}`}
                            lockObject={stateManager.lockObject}
                            label={displayName}
                            target={block}
                            propertyName={propertyName}
                            step={Math.abs((options.max as number) - (options.min as number)) / 100.0}
                            minimum={Math.min(options.min as number, options.max as number)}
                            maximum={options.max as number}
                            onChange={() => ForceRebuild(block, stateManager, propertyName, options.notifiers)}
                        />
                    );
                }
                break;
            }
            case PropertyTypeForEdition.Int: {
                components.push(
                    <FloatLineComponent
                        key={`int-${propertyName}`}
                        lockObject={stateManager.lockObject}
                        digits={0}
                        step={"1"}
                        isInteger={true}
                        label={displayName}
                        propertyName={propertyName}
                        target={block}
                        onChange={() => ForceRebuild(block, stateManager, propertyName, options.notifiers)}
                    />
                );
                break;
            }
            case PropertyTypeForEdition.Vector2: {
                components.push(
                    <Vector2LineComponent
                        key={`vector2-${propertyName}`}
                        lockObject={stateManager.lockObject}
                        label={displayName}
                        propertyName={propertyName}
                        target={block}
                        onChange={() => ForceRebuild(block, stateManager, propertyName, options.notifiers)}
                    />
                );
                break;
            }
            case PropertyTypeForEdition.List: {
                components.push(
                    <OptionsLine
                        key={`options-${propertyName}`}
                        label={displayName}
                        options={options.options as IEditablePropertyListOption[]}
                        target={block}
                        propertyName={propertyName}
                        onSelect={() => ForceRebuild(block, stateManager, propertyName, options.notifiers)}
                    />
                );
                break;
            }
        }
    }
    return {
        componentList,
        groups,
    };
}
