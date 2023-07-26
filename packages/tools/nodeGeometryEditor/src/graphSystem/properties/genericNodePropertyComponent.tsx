import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import type { NodeGeometryBlock } from "core/Meshes/Node/nodeGeometryBlock";
import { PropertyTypeForEdition } from "core/Meshes/Node/Interfaces/nodeGeometryDecorator";
import type { IEditablePropertyOption, IPropertyDescriptionForEdition, IEditablePropertyListOption } from "core/Meshes/Node/Interfaces/nodeGeometryDecorator";

export class GenericPropertyComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    render() {
        return (
            <>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <GenericPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
            </>
        );
    }
}

export class GeneralPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    render() {
        const block = this.props.nodeData.data as NodeGeometryBlock;

        return (
            <>
                <LineContainerComponent title="GENERAL">
                    {(!block.isInput) && (
                        <TextInputLineComponent
                            label="Name"
                            propertyName="name"
                            target={block}
                            lockObject={this.props.stateManager.lockObject}
                            onChange={() => this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block)}
                            throttlePropertyChangedNotification={true}
                            validator={() => {
                                return true;
                            }}
                        />
                    )}
                    <TextLineComponent label="Type" value={block.getClassName()} />
                    <TextInputLineComponent
                        label="Comments"
                        propertyName="comments"
                        lockObject={this.props.stateManager.lockObject}
                        target={block}
                        onChange={() => this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block)}
                        throttlePropertyChangedNotification={true}
                    />
                </LineContainerComponent>
            </>
        );
    }
}

export class GenericPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    forceRebuild(propertyName: string, notifiers?: IEditablePropertyOption["notifiers"]) {
        if (notifiers?.onValidation && !notifiers?.onValidation(this.props.nodeData.data as NodeGeometryBlock, propertyName)) {
            return;
        }

        if (!notifiers || notifiers.update) {
            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.nodeData.data as NodeGeometryBlock);
        }

        if (!notifiers || notifiers.rebuild) {
            this.props.stateManager.onRebuildRequiredObservable.notifyObservers(true);
        }

        const rebuild = notifiers?.callback?.(this.props.nodeData.data as NodeGeometryBlock) ?? false;

        if (rebuild) {
            this.props.stateManager.onRebuildRequiredObservable.notifyObservers(true);
        }
    }

    render() {
        const block = this.props.nodeData.data as NodeGeometryBlock,
            propStore: IPropertyDescriptionForEdition[] = (block as any)._propStore;

        if (!propStore) {
            return <></>;
        }

        const componentList: { [groupName: string]: JSX.Element[] } = {},
            groups: string[] = [];

        for (const { propertyName, displayName, type, groupName, options } of propStore) {
            let components = componentList[groupName];

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
                            onValueChanged={() => this.forceRebuild(propertyName, options.notifiers)}
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
                                lockObject={this.props.stateManager.lockObject}
                                label={displayName}
                                propertyName={propertyName}
                                target={block}
                                onChange={() => this.forceRebuild(propertyName, options.notifiers)}
                            />
                        );
                    } else {
                        components.push(
                            <SliderLineComponent
                                key={`slider-${propertyName}`}
                                lockObject={this.props.stateManager.lockObject}
                                label={displayName}
                                target={block}
                                propertyName={propertyName}
                                step={Math.abs((options.max as number) - (options.min as number)) / 100.0}
                                minimum={Math.min(options.min as number, options.max as number)}
                                maximum={options.max as number}
                                onChange={() => this.forceRebuild(propertyName, options.notifiers)}
                            />
                        );
                    }
                    break;
                }
                case PropertyTypeForEdition.Int: {
                    components.push(
                        <FloatLineComponent
                            key={`int-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            digits={0}
                            step={"1"}
                            isInteger={true}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            onChange={() => this.forceRebuild(propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Vector2: {
                    components.push(
                        <Vector2LineComponent
                            key={`vector2-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            onChange={() => this.forceRebuild(propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.List: {
                    components.push(
                        <OptionsLineComponent
                            key={`options-${propertyName}`}
                            label={displayName}
                            options={options.options as IEditablePropertyListOption[]}
                            target={block}
                            propertyName={propertyName}
                            onSelect={() => this.forceRebuild(propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
            }
        }

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
}
