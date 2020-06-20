
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { OptionsLineComponent } from '../../sharedComponents/optionsLineComponent';
import { TrigonometryBlockOperations, TrigonometryBlock } from 'babylonjs/Materials/Node/Blocks/trigonometryBlock';
import { IPropertyComponentProps } from './propertyComponentProps';
import { GeneralPropertyTabComponent } from './genericNodePropertyComponent';

export class TrigonometryPropertyTabComponent extends React.Component<IPropertyComponentProps> {

    constructor(props: IPropertyComponentProps) {
        super(props)
    }

    render() {
        let trigonometryBlock = this.props.block as TrigonometryBlock;
        
        var operationOptions: {label: string, value: TrigonometryBlockOperations}[] = [
            {label: "Cos", value: TrigonometryBlockOperations.Cos},
            {label: "Sin", value: TrigonometryBlockOperations.Sin},
            {label: "Abs", value: TrigonometryBlockOperations.Abs},
            {label: "Exp", value: TrigonometryBlockOperations.Exp},
            {label: "Exp2", value: TrigonometryBlockOperations.Exp2},
            {label: "Round", value: TrigonometryBlockOperations.Round},
            {label: "Ceiling", value: TrigonometryBlockOperations.Ceiling},
            {label: "Floor", value: TrigonometryBlockOperations.Floor},
            {label: "ArcCos", value: TrigonometryBlockOperations.ArcCos},
            {label: "ArcSin", value: TrigonometryBlockOperations.ArcSin},
            {label: "ArcTan", value: TrigonometryBlockOperations.ArcTan},
            {label: "Tan", value: TrigonometryBlockOperations.Tan},
            {label: "Log", value: TrigonometryBlockOperations.Log},
            {label: "Fract", value: TrigonometryBlockOperations.Fract},
            {label: "Sign", value: TrigonometryBlockOperations.Sign},
            {label: "Radians to degrees", value: TrigonometryBlockOperations.Degrees},
            {label: "Degrees to radians", value: TrigonometryBlockOperations.Radians}
        ];

        operationOptions.sort((a, b) => {
            return a.label.localeCompare(b.label);
        })
        
        return (
            <div>                
                <GeneralPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
                <LineContainerComponent title="PROPERTIES">  
                    <OptionsLineComponent label="Operation" options={operationOptions} target={trigonometryBlock} propertyName="operation" onSelect={(value: any) => {
                        this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                        this.forceUpdate();
                    }} />                  
                </LineContainerComponent>
            </div>
        );
    }
}