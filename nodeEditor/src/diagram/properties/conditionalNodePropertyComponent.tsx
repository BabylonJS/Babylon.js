
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { OptionsLineComponent } from '../../sharedComponents/optionsLineComponent';
import { ConditionalBlockConditions, ConditionalBlock } from 'babylonjs/Materials/Node/Blocks/conditionalBlock';
import { IPropertyComponentProps } from './propertyComponentProps';
import { GeneralPropertyTabComponent } from './genericNodePropertyComponent';

export class ConditionalPropertyTabComponent extends React.Component<IPropertyComponentProps> {

    constructor(props: IPropertyComponentProps) {
        super(props)
    }

    render() {
        let conditionBlock = this.props.block as ConditionalBlock;
        
        var conditionOptions: {label: string, value: ConditionalBlockConditions}[] = [
            {label: "Equal", value: ConditionalBlockConditions.Equal},
            {label: "NotEqual", value: ConditionalBlockConditions.NotEqual},
            {label: "LessThan", value: ConditionalBlockConditions.LessThan},
            {label: "GreaterThan", value: ConditionalBlockConditions.GreaterThan},
            {label: "LessOrEqual", value: ConditionalBlockConditions.LessOrEqual},
            {label: "GreaterOrEqual", value: ConditionalBlockConditions.GreaterOrEqual},
            {label: "Xor", value: ConditionalBlockConditions.Xor},
            {label: "Or", value: ConditionalBlockConditions.Or},
            {label: "And", value: ConditionalBlockConditions.And}
        ];

        conditionOptions.sort((a, b) => {
            return a.label.localeCompare(b.label);
        })
        
        return (
            <div>                
                <GeneralPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
                <LineContainerComponent title="PROPERTIES">  
                    <OptionsLineComponent label="Condition" options={conditionOptions} target={conditionBlock} propertyName="condition" onSelect={(value: any) => {
                        this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                        this.forceUpdate();
                    }} />                  
                </LineContainerComponent>
            </div>
        );
    }
}