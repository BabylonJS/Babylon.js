import * as react from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent.js";
import { TextInputLineComponent } from "@babylonjs/shared-ui-components/lines/textInputLineComponent.js";
import { TextLineComponent } from "@babylonjs/shared-ui-components/lines/textLineComponent.js";
import type { IPropertyComponentProps } from "@babylonjs/shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import {
    type BaseBlock,
    PropertyTypeForEdition,
    type IEditablePropertyOption,
    type IPropertyDescriptionForEdition,
} from "@babylonjs/smart-filters";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent.js";
import { FloatSliderComponent } from "../../sharedComponents/floatSliderComponent.js";
import { FloatLineComponent } from "@babylonjs/shared-ui-components/lines/floatLineComponent.js";
import { Vector2LineComponent } from "@babylonjs/shared-ui-components/lines/vector2LineComponent.js";
import { OptionsLine } from "@babylonjs/shared-ui-components/lines/optionsLineComponent.js";
import { Observable } from "@babylonjs/core/Misc/observable.js";
import { DynamicOptionsLine } from "../../sharedComponents/dynamicOptionsLineComponent.js";
import { OutputBlockName } from "../../configuration/constants.js";

export class GenericPropertyComponent extends react.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override render() {
        return (
            <>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <GenericPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
            </>
        );
    }
}

export class GeneralPropertyTabComponent extends react.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override render() {
        const block = this.props.nodeData.data as BaseBlock;
        const isOutputBlock = block.blockType === OutputBlockName;

        return (
            <>
                <LineContainerComponent title="GENERAL">
                    {!isOutputBlock && (
                        <TextInputLineComponent
                            label="Name"
                            propertyName="name"
                            target={block}
                            lockObject={this.props.stateManager.lockObject}
                            onChange={() => this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block)}
                            // validator={(newName) => {
                            //     if (!block.validateBlockName(newName)) {
                            //         this.props.stateManager.onErrorMessageDialogRequiredObservable.notifyObservers(`"${newName}" is a reserved name, please choose another`);
                            //         return false;
                            //     }
                            //     return true;
                            // }}
                        />
                    )}
                    <TextLineComponent label="Type" value={block.blockType} />
                    {!isOutputBlock && (
                        <TextInputLineComponent
                            label="Comments"
                            propertyName="comments"
                            lockObject={this.props.stateManager.lockObject}
                            target={block}
                            onChange={() => this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block)}
                        />
                    )}
                </LineContainerComponent>
            </>
        );
    }
}

export class GenericPropertyTabComponent extends react.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    forceRebuild(notifiers?: IEditablePropertyOption["notifiers"]) {
        if (!notifiers || notifiers.update) {
            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.nodeData.data as BaseBlock);
        }

        if (!notifiers || notifiers.rebuild) {
            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        }

        // if (notifiers?.activatePreviewCommand) {
        //     (this.props.stateManager.data as GlobalState).onPreviewCommandActivated.notifyObservers(true);
        // }

        // notifiers?.callback?.((this.props.stateManager.data as GlobalState).engine);
    }

    override componentDidUpdate(prevProps: IPropertyComponentProps) {
        // if (prevProps.nodeData.data !== this.props.nodeData.data) {
        //     this.forceUpdate();
        // }

        // Check if options for a specific block changed
        const currentOptions = (this.props.nodeData.data as any)?._propStore;
        const prevOptions = (prevProps.nodeData.data as any)?._propStore;

        if (JSON.stringify(currentOptions) !== JSON.stringify(prevOptions)) {
            this.forceUpdate();
        }
    }

    override render() {
        const block = this.props.nodeData.data as BaseBlock;
        const propStore: IPropertyDescriptionForEdition[] = (block as any)._propStore;

        if (!propStore) {
            return <></>;
        }

        const componentList: { [groupName: string]: JSX.Element[] } = {};
        const groups: string[] = [];

        const classes: string[] = [];
        let proto = Object.getPrototypeOf(block);
        while (proto) {
            classes.push(proto.constructor.name);
            proto = Object.getPrototypeOf(proto);
        }

        for (const propDescription of propStore) {
            const { displayName, type, groupName, options, className } = propDescription;
            let propertyName = propDescription.propertyName;
            let target: unknown = block;

            // If we are targeting a sub property, update the target and property name we pass to the UI accordingly
            if (options.subPropertyName) {
                target = (block as any)[propertyName];
                propertyName = options.subPropertyName;
            }

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
                            target={target}
                            propertyName={propertyName}
                            onValueChanged={() => this.forceRebuild(options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Float: {
                    components.push(
                        <FloatSliderComponent
                            key={`slider-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            label={displayName}
                            propertyName={propertyName}
                            target={target}
                            min={options.min ?? null}
                            max={options.max ?? null}
                            onChange={() => this.forceRebuild(options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Int: {
                    components.push(
                        <FloatLineComponent
                            key={`float-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            digits={0}
                            step={"1"}
                            isInteger={true}
                            label={displayName}
                            propertyName={propertyName}
                            target={target}
                            onChange={() => this.forceRebuild(options.notifiers)}
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
                            target={target}
                            onChange={() => this.forceRebuild(options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.List: {
                    const props = {
                        key: `list-${propertyName}`,
                        label: displayName,
                        target,
                        propertyName: propertyName,
                        valuesAreStrings: options.valuesAreStrings ?? false,
                        onSelect: () => this.forceRebuild(options.notifiers),
                    };

                    // Observable options use a different, self-managing component
                    // so that several instances of it can be created
                    if (options.options instanceof Observable) {
                        components.push(<DynamicOptionsLine {...props} optionsObservable={options.options} />);
                    } else {
                        components.push(<OptionsLine {...props} options={options.options ?? []} />);
                    }
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
