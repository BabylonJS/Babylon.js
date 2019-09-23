
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { TrigonometryNodeModel } from './trigonometryNodeModel';
import { TextLineComponent } from '../../../sharedComponents/textLineComponent';
import { LineContainerComponent } from '../../../sharedComponents/lineContainerComponent';
import { TextInputLineComponent } from '../../../sharedComponents/textInputLineComponent';
import { OptionsLineComponent } from '../../../sharedComponents/optionsLineComponent';
import { TrigonometryBlockOperations } from 'babylonjs/Materials/Node/Blocks/trigonometryBlock';

interface ITrigonometryTabComponentProps {
    globalState: GlobalState;
    trigonometryNode: TrigonometryNodeModel;
}

export class TrigonometryPropertyTabComponentProps extends React.Component<ITrigonometryTabComponentProps> {

    constructor(props: ITrigonometryTabComponentProps) {
        super(props)
    }

    render() {
        let trigonometryBlock = this.props.trigonometryNode.trigonometryBlock;
        
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
                <LineContainerComponent title="GENERAL">
                    <TextInputLineComponent globalState={this.props.globalState} label="Name" propertyName="name" target={trigonometryBlock} onChange={() => {
                        this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                    }} />
                    <TextLineComponent label="Type" value={trigonometryBlock.getClassName()} />
                </LineContainerComponent>
                <LineContainerComponent title="PROPERTIES">  
                    <OptionsLineComponent label="Operation" options={operationOptions} target={trigonometryBlock} propertyName="operation" onSelect={(value: any) => {
                        this.forceUpdate();
                        this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                    }} />                  
                </LineContainerComponent>
            </div>
        );
    }
}