
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { OptionsLineComponent } from '../../sharedComponents/optionsLineComponent';
import { IPropertyComponentProps } from './propertyComponentProps';
import { GeneralPropertyTabComponent } from './genericNodePropertyComponent';
import { VectorMergerBlock } from "babylonjs/Materials/Node/Blocks/vectorMergerBlock";

export class VectorMergerPropertyTabComponent extends React.Component<IPropertyComponentProps> {

    constructor(props: IPropertyComponentProps) {
        super(props)
    }

    render() {
        let vectorMergerBlock = this.props.block as VectorMergerBlock;
        
        var targetOptions: {label: string, value: string}[] = [
            {label: "X", value: "x"},
            {label: "Y", value: "y"},
            {label: "Z", value: "z"},
            {label: "W", value: "w"},
        ];
        
        return (
            <div>                
                <GeneralPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
                <LineContainerComponent title="SWIZZLES">  
                    <OptionsLineComponent label="X" options={targetOptions} target={vectorMergerBlock} propertyName="xSwizzle" valuesAreStrings={true} onSelect={(value: any) => {
                        this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                        this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                        this.forceUpdate();
                    }} />           
                    <OptionsLineComponent label="Y" options={targetOptions} target={vectorMergerBlock} propertyName="ySwizzle" valuesAreStrings={true} onSelect={(value: any) => {
                        this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                        this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                        this.forceUpdate();
                    }} />    
                    <OptionsLineComponent label="Z" options={targetOptions} target={vectorMergerBlock} propertyName="zSwizzle" valuesAreStrings={true} onSelect={(value: any) => {
                        this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                        this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                        this.forceUpdate();
                    }} />    
                    <OptionsLineComponent label="W" options={targetOptions} target={vectorMergerBlock} propertyName="wSwizzle" valuesAreStrings={true} onSelect={(value: any) => {
                        this.props.globalState.onUpdateRequiredObservable.notifyObservers(this.props.block);
                        this.props.globalState.onRebuildRequiredObservable.notifyObservers(true);
                        this.forceUpdate();
                    }} />           
                </LineContainerComponent>
            </div>
        );
    }
}
