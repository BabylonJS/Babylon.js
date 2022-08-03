import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import type { IPropertyDescriptionForEdition, IEditablePropertyListOption } from "core/Materials/Node/nodeMaterialDecorator";
import { PropertyTypeForEdition } from "core/Materials/Node/nodeMaterialDecorator";
import { NodeMaterialBlockTargets } from "core/Materials/Node/Enums/nodeMaterialBlockTargets";
import type { Scene } from "core/scene";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";
import type { GlobalState } from "../../globalState";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";

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
        const targetOptions = [
            { label: "Neutral", value: NodeMaterialBlockTargets.Neutral },
            { label: "Vertex", value: NodeMaterialBlockTargets.Vertex },
            { label: "Fragment", value: NodeMaterialBlockTargets.Fragment },
        ];

        const block = this.props.nodeData.data as NodeMaterialBlock;

        return (
            <>
                <LineContainerComponent title="GENERAL">
                    {(!block.isInput || !(block as InputBlock).isAttribute) && (
                        <TextInputLineComponent
                            label="Name"
                            propertyName="name"
                            target={block}
                            lockObject={this.props.stateManager.lockObject}
                            onChange={() => this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block)}
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
                        <OptionsLineComponent
                            label="Target"
                            options={targetOptions}
                            target={block}
                            propertyName="target"
                            onSelect={() => {
                                this.forceUpdate();

                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                                this.props.stateManager.onRebuildRequiredObservable.notifyObservers(true);
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

    forceRebuild(notifiers?: { rebuild?: boolean; update?: boolean; activatePreviewCommand?: boolean; callback?: (scene: Scene) => void }) {
        if (!notifiers || notifiers.update) {
            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.nodeData.data as NodeMaterialBlock);
        }

        if (!notifiers || notifiers.rebuild) {
            this.props.stateManager.onRebuildRequiredObservable.notifyObservers(true);
        }

        if (notifiers?.activatePreviewCommand) {
            (this.props.stateManager.data as GlobalState).onPreviewCommandActivated.notifyObservers(true);
        }

        notifiers?.callback?.((this.props.stateManager.data as GlobalState).nodeMaterial.getScene());
    }

    render() {
        const block = this.props.nodeData.data as NodeMaterialBlock,
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
                        <CheckBoxLineComponent label={displayName} target={block} propertyName={propertyName} onValueChanged={() => this.forceRebuild(options.notifiers)} />
                    );
                    break;
                }
                case PropertyTypeForEdition.Float: {
                    const cantDisplaySlider = isNaN(options.min as number) || isNaN(options.max as number) || options.min === options.max;
                    if (cantDisplaySlider) {
                        components.push(
                            <FloatLineComponent
                                lockObject={this.props.stateManager.lockObject}
                                label={displayName}
                                propertyName={propertyName}
                                target={block}
                                onChange={() => this.forceRebuild(options.notifiers)}
                            />
                        );
                    } else {
                        components.push(
                            <SliderLineComponent
                                lockObject={this.props.stateManager.lockObject}
                                label={displayName}
                                target={block}
                                propertyName={propertyName}
                                step={Math.abs((options.max as number) - (options.min as number)) / 100.0}
                                minimum={Math.min(options.min as number, options.max as number)}
                                maximum={options.max as number}
                                onChange={() => this.forceRebuild(options.notifiers)}
                            />
                        );
                    }
                    break;
                }
                case PropertyTypeForEdition.Int: {
                    components.push(
                        <FloatLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            digits={0}
                            step={"1"}
                            isInteger={true}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            onChange={() => this.forceRebuild(options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Vector2: {
                    components.push(
                        <Vector2LineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            onChange={() => this.forceRebuild(options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.List: {
                    components.push(
                        <OptionsLineComponent
                            label={displayName}
                            options={options.options as IEditablePropertyListOption[]}
                            target={block}
                            propertyName={propertyName}
                            onSelect={() => this.forceRebuild(options.notifiers)}
                        />
                    );
                    break;
                }
            }
        }

        return (
            <>
                {groups.map((group) => (
                    <LineContainerComponent title={group}>{componentList[group]}</LineContainerComponent>
                ))}
            </>
        );
    }
}
