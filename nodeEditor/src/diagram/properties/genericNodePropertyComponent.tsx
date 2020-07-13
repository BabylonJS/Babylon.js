
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { TextLineComponent } from '../../sharedComponents/textLineComponent';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { FloatLineComponent } from '../../sharedComponents/floatLineComponent';
import { SliderLineComponent } from '../../sharedComponents/sliderLineComponent';
import { Vector2LineComponent } from '../../sharedComponents/vector2LineComponent';
import { OptionsLineComponent } from '../../sharedComponents/optionsLineComponent';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { PropertyTypeForEdition, IPropertyDescriptionForEdition, IEditablePropertyListOption } from 'babylonjs/Materials/Node/nodeMaterialDecorator';

export class GenericPropertyComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    render() {
        return (
            <>
                <GeneralPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
                <GenericPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
            </>
        );
    }
}

export class GeneralPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    render() {
        return (
            <>
                <LineContainerComponent title="GENERAL">
                    {
                        (!this.props.block.isInput || !(this.props.block as InputBlock).isAttribute) &&
                        <TextInputLineComponent globalState={this.props.globalState} label="Name" propertyName="name" target={this.props.block}
                            onChange={ newName => 
                            {if(!this.props.block.validateBlockName(newName)){ 
                                this.props.globalState.onErrorMessageDialogRequiredObservable.notifyObservers(`"${newName}" is a reserved name, please choose another`); 
                                //revert name back to original?
                            }
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                            }} />
                    }
                    <TextLineComponent label="Type" value={this.props.block.getClassName()} />
                    <TextInputLineComponent globalState={this.props.globalState} label="Comments" propertyName="comments" target={this.props.block}
                            onChange={() => this.props.globalState.onUpdateRequiredObservable.notifyObservers()} />
                </LineContainerComponent>
            </>
        );
    }
}

export class GenericPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    forceRebuild(notifiers?: { "rebuild"?: boolean; "update"?: boolean; }) {
        if (!notifiers || notifiers.update) {
            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
        }

        if (!notifiers || notifiers.rebuild) {
            this.props.globalState.onRebuildRequiredObservable.notifyObservers();
        }
    }

    render() {
        const block = this.props.block,
              propStore: IPropertyDescriptionForEdition[] = (block as any)._propStore;

        if (!propStore) {
            return (
                <>
                </>
            );
        }

        const componentList: { [groupName: string]: JSX.Element[]} = {},
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
                        <CheckBoxLineComponent label={displayName} target={this.props.block} propertyName={propertyName} onValueChanged={() => this.forceRebuild(options.notifiers)} />
                    );
                    break;
                }
                case PropertyTypeForEdition.Float: {
                    let cantDisplaySlider = (isNaN(options.min as number) || isNaN(options.max as number) || options.min === options.max);
                    if (cantDisplaySlider) {
                        components.push(
                            <FloatLineComponent globalState={this.props.globalState} label={displayName} propertyName={propertyName} target={this.props.block} onChange={() => this.forceRebuild(options.notifiers)} />
                        );
                    } else {
                        components.push(
                            <SliderLineComponent label={displayName} target={this.props.block} propertyName={propertyName} step={Math.abs((options.max as number) - (options.min as number)) / 100.0} minimum={Math.min(options.min as number, options.max as number)} maximum={options.max as number} onChange={() => this.forceRebuild(options.notifiers)}/>
                        );
                    }
                    break;
                }
                case PropertyTypeForEdition.Vector2: {
                    components.push(
                        <Vector2LineComponent globalState={this.props.globalState} label={displayName} propertyName={propertyName} target={this.props.block} onChange={() => this.forceRebuild(options.notifiers)} />
                    );
                    break;
                }
                case PropertyTypeForEdition.List: {
                    components.push(
                        <OptionsLineComponent label={displayName} options={options.options as IEditablePropertyListOption[]} target={this.props.block} propertyName={propertyName} onSelect={() => this.forceRebuild(options.notifiers)} />
                    );
                    break;
                }
            }
        }

        return (
            <>
            {
                groups.map((group) =>
                    <LineContainerComponent title={group}>
                        {componentList[group]}
                    </LineContainerComponent>
                )
            }
            </>
        );
    }
}