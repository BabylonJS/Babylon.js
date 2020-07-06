
import * as React from "react";
import { GlobalState } from '../../globalState';
import { FloatLineComponent } from '../../sharedComponents/floatLineComponent';
import { FloatPropertyTabComponent } from '../../components/propertyTab/properties/floatPropertyTabComponent';
import { SliderLineComponent } from '../../sharedComponents/sliderLineComponent';
import { Vector2PropertyTabComponent } from '../../components/propertyTab/properties/vector2PropertyTabComponent';
import { Color3PropertyTabComponent } from '../../components/propertyTab/properties/color3PropertyTabComponent';
import { Vector3PropertyTabComponent } from '../../components/propertyTab/properties/vector3PropertyTabComponent';
import { Vector4PropertyTabComponent } from '../../components/propertyTab/properties/vector4PropertyTabComponent';
import { MatrixPropertyTabComponent } from '../../components/propertyTab/properties/matrixPropertyTabComponent';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { OptionsLineComponent } from '../../sharedComponents/optionsLineComponent';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialSystemValues } from 'babylonjs/Materials/Node/Enums/nodeMaterialSystemValues';
import { AnimatedInputBlockTypes } from 'babylonjs/Materials/Node/Blocks/Input/animatedInputBlockTypes';
import { IPropertyComponentProps } from './propertyComponentProps';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { GeneralPropertyTabComponent } from './genericNodePropertyComponent';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { Color4PropertyTabComponent } from '../../components/propertyTab/properties/color4PropertyTabComponent';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';

export class InputPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    
    private onValueChangedObserver: Nullable<Observer<InputBlock>>;

    constructor(props: IPropertyComponentProps) {
        super(props)
    }

    componentDidMount() {        
        let inputBlock = this.props.block as InputBlock;
        this.onValueChangedObserver = inputBlock.onValueChangedObservable.add(() => {
            this.forceUpdate()
            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
        });
    }

    componentWillUnmount() {
        
        let inputBlock = this.props.block as InputBlock;
        if (this.onValueChangedObserver) {
            inputBlock.onValueChangedObservable.remove(this.onValueChangedObserver);
            this.onValueChangedObserver = null;
        }
    }    

    renderValue(globalState: GlobalState) {
        let inputBlock = this.props.block as InputBlock;
        switch (inputBlock.type) {
            case NodeMaterialBlockConnectionPointTypes.Float: {
                let cantDisplaySlider = (isNaN(inputBlock.min) || isNaN(inputBlock.max) || inputBlock.min === inputBlock.max);            
                return (
                    <>
                        <CheckBoxLineComponent label="Is boolean" target={inputBlock} propertyName="isBoolean" />
                        {
                            inputBlock.isBoolean &&
                            <CheckBoxLineComponent label="Value" isSelected={() => {
                                return inputBlock.value === 1
                            }} onSelect={(value) => {
                                inputBlock.value = value ? 1 : 0;
                                if (inputBlock.isConstant) {
                                    this.props.globalState.onRebuildRequiredObservable.notifyObservers();    
                                }
                                this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                            }}/>
                        }
                        {
                            !inputBlock.isBoolean &&
                            <FloatLineComponent globalState={this.props.globalState} label="Min" target={inputBlock} propertyName="min" onChange={() => this.forceUpdate()}></FloatLineComponent>
                        }
                        {
                            !inputBlock.isBoolean &&
                            <FloatLineComponent globalState={this.props.globalState} label="Max" target={inputBlock} propertyName="max" onChange={() => this.forceUpdate()}></FloatLineComponent>      
                        }
                        {
                            !inputBlock.isBoolean && cantDisplaySlider &&
                            <FloatPropertyTabComponent globalState={globalState} inputBlock={inputBlock} />
                        }        
                        {
                            !inputBlock.isBoolean && !cantDisplaySlider &&
                            <SliderLineComponent label="Value" target={inputBlock} propertyName="value" step={Math.abs(inputBlock.max - inputBlock.min) / 100.0} minimum={Math.min(inputBlock.min, inputBlock.max)} maximum={inputBlock.max} onChange={() => {
                                if (inputBlock.isConstant) {
                                    this.props.globalState.onRebuildRequiredObservable.notifyObservers();    
                                }
                            }}/>
                        }
                    </>
                );
            }
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return (
                    <Vector2PropertyTabComponent globalState={globalState} inputBlock={inputBlock} />
                );
            case NodeMaterialBlockConnectionPointTypes.Color3:
                return (
                    <Color3PropertyTabComponent globalState={globalState} inputBlock={inputBlock} />
                );
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return (
                    <Color4PropertyTabComponent globalState={globalState} inputBlock={inputBlock} />
                );
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                return (
                    <Vector3PropertyTabComponent globalState={globalState} inputBlock={inputBlock} />
                );            
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                return (
                    <Vector4PropertyTabComponent globalState={globalState} inputBlock={inputBlock} />
                );
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                return (
                    <MatrixPropertyTabComponent globalState={globalState} inputBlock={inputBlock} />
                );                
        }

        return null;
    }

    setDefaultValue() {
        let inputBlock = this.props.block as InputBlock;
        inputBlock.setDefaultValue();
    }

    render() {
        let inputBlock = this.props.block as InputBlock;

        var systemValuesOptions: {label: string, value: NodeMaterialSystemValues}[] = [];
        var attributeOptions: {label: string, value: string}[] = [];
        var animationOptions: {label: string, value: AnimatedInputBlockTypes}[] = [];

        switch(inputBlock.type) {      
            case NodeMaterialBlockConnectionPointTypes.Float:
                animationOptions = [
                    { label: "None", value: AnimatedInputBlockTypes.None },
                    { label: "Time", value: AnimatedInputBlockTypes.Time },
                ];
                systemValuesOptions = [ 
                    { label: "Delta time", value: NodeMaterialSystemValues.DeltaTime }
                ]
                break;      
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                systemValuesOptions = [
                    { label: "World", value: NodeMaterialSystemValues.World },
                    { label: "World x View", value: NodeMaterialSystemValues.WorldView },
                    { label: "World x ViewxProjection", value: NodeMaterialSystemValues.WorldViewProjection },
                    { label: "View", value: NodeMaterialSystemValues.View },
                    { label: "View x Projection", value: NodeMaterialSystemValues.ViewProjection },
                    { label: "Projection", value: NodeMaterialSystemValues.Projection }
                ];
                break;
            case NodeMaterialBlockConnectionPointTypes.Color3:
                systemValuesOptions = [
                    { label: "Fog color", value: NodeMaterialSystemValues.FogColor }
                ];
                break;
            case NodeMaterialBlockConnectionPointTypes.Color4:
                attributeOptions = [
                    { label: "color", value: "color" }
                ];
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                attributeOptions = [
                    { label: "uv", value: "uv" },
                    { label: "uv2", value: "uv2" },
                ];
                break;                
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                systemValuesOptions = [
                    { label: "Camera position", value: NodeMaterialSystemValues.CameraPosition }
                ];
                attributeOptions = [
                    { label: "position", value: "position" },
                    { label: "normal", value: "normal" },
                    { label: "tangent", value: "tangent" },        
                ];
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                    attributeOptions = [
                        { label: "matricesIndices", value: "matricesIndices" },
                        { label: "matricesWeights", value: "matricesWeights" }
                    ];
                    break;                
        }

        var modeOptions = [
            { label: "User-defined", value: 0 }
        ];

        if (attributeOptions.length > 0) {
            modeOptions.push({ label: "Mesh attribute", value: 1 });
        }

        if (systemValuesOptions.length > 0) {
            modeOptions.push({ label: "System value", value: 2 });
        }

        var typeOptions = [
            { label: "None", value: 0 },
            { label: "Visible in the inspector", value: 1 },
            { label: "Constant", value: 2 }
        ];

        return (
            <div>
                <GeneralPropertyTabComponent globalState={this.props.globalState} block={this.props.block}/>
                <LineContainerComponent title="PROPERTIES">
                    {
                        inputBlock.isUniform && !inputBlock.isSystemValue && inputBlock.animationType === AnimatedInputBlockTypes.None &&
                        <OptionsLineComponent label="Type" options={typeOptions} target={inputBlock} 
                            noDirectUpdate={true}
                            getSelection={(block) => {
                                if (block.visibleInInspector) {
                                    return 1;
                                }

                                if (block.isConstant) {
                                    return 2;
                                }

                                return 0;
                            }}
                            onSelect={(value: any) => {
                                switch (value) {
                                    case 0:
                                        inputBlock.visibleInInspector = false;
                                        inputBlock.isConstant = false;
                                        break;
                                    case 1:
                                        inputBlock.visibleInInspector = true;
                                        inputBlock.isConstant = false;
                                        break;
                                    case 2:
                                        inputBlock.visibleInInspector = false;
                                        inputBlock.isConstant = true;
                                        break;
                                }
                                this.forceUpdate();
                                this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                                this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                            }} />                        
                    }      
                    {
                        inputBlock.visibleInInspector &&
                        <TextInputLineComponent globalState={this.props.globalState} label="Group" propertyName="groupInInspector" target={this.props.block} 
                            onChange={() => {
                                this.forceUpdate();
                                this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                                this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                            }} />
                    }     
                    <OptionsLineComponent label="Mode" options={modeOptions} target={inputBlock} 
                        noDirectUpdate={true}
                        getSelection={(block) => {
                            if (block.isAttribute) {
                                return 1;
                            }

                            if (block.isSystemValue) {
                                return 2;
                            }

                            return 0;
                        }}
                        onSelect={(value: any) => {
                            switch (value) {
                                case 0:
                                    inputBlock.isUniform = true;
                                    inputBlock.setAsSystemValue(null);
                                    this.setDefaultValue();
                                    break;
                                case 1:
                                    inputBlock.setAsAttribute(attributeOptions[0].value);
                                    break;
                                case 2:
                                    inputBlock.setAsSystemValue(systemValuesOptions[0].value);
                                    break;
                            }
                            this.forceUpdate();                            
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                        }} />
                    {
                        inputBlock.isAttribute &&
                        <OptionsLineComponent label="Attribute" valuesAreStrings={true} options={attributeOptions} target={inputBlock} propertyName="name" onSelect={(value: any) => {
                            inputBlock.setAsAttribute(value);
                            this.forceUpdate();
                            
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                        }} />
                    }
                    {
                        inputBlock.isUniform && animationOptions.length > 0 &&
                        <OptionsLineComponent label="Animation type" options={animationOptions} target={inputBlock} propertyName="animationType" onSelect={(value: any) => {
                            this.forceUpdate();
                            
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                        }} />
                    }   
                    {
                        inputBlock.isUniform && !inputBlock.isSystemValue && inputBlock.animationType === AnimatedInputBlockTypes.None &&
                        this.renderValue(this.props.globalState)
                    }
                    {
                        inputBlock.isUniform && inputBlock.isSystemValue &&
                        <OptionsLineComponent label="System value" options={systemValuesOptions} target={inputBlock} propertyName="systemValue" onSelect={(value: any) => {
                            inputBlock.setAsSystemValue(value);
                            this.forceUpdate();
                            
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();
                            this.props.globalState.onRebuildRequiredObservable.notifyObservers();
                        }} />
                    }
                </LineContainerComponent>
            </div>
        );
    }
}