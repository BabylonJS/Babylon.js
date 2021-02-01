import * as React from "react";
import { GlobalState } from '../../globalState';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { SliderLineComponent } from '../../sharedComponents/sliderLineComponent';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
import { Color3LineComponent } from '../../sharedComponents/color3LineComponent';
import { FloatLineComponent } from '../../sharedComponents/floatLineComponent';
import { Color4LineComponent } from '../../sharedComponents/color4LineComponent';
import { Vector2LineComponent } from '../../sharedComponents/vector2LineComponent';
import { Vector3LineComponent } from '../../sharedComponents/vector3LineComponent';
import { Vector4LineComponent } from '../../sharedComponents/vector4LineComponent';

require("./propertyTab.scss");

interface IInputsPropertyTabComponentProps {
    globalState: GlobalState;
    inputs: InputBlock[];
}

export class InputsPropertyTabComponent extends React.Component<IInputsPropertyTabComponentProps> {

    constructor(props: IInputsPropertyTabComponentProps) {
        super(props);
    }

    processInputBlockUpdate(ib: InputBlock) {
        this.props.globalState.onUpdateRequiredObservable.notifyObservers();

        if (ib.isConstant) {
            this.props.globalState.onRebuildRequiredObservable.notifyObservers();
        }
    }

    renderInputBlock(block: InputBlock) {
        switch (block.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                    let cantDisplaySlider = (isNaN(block.min) || isNaN(block.max) || block.min === block.max);
                    return (
                        <div key={block.uniqueId} >
                            {
                                block.isBoolean &&
                                <CheckBoxLineComponent key={block.uniqueId} label={block.name} target={block} propertyName="value"
                                onValueChanged={() => {
                                    this.processInputBlockUpdate(block);
                                }}/>
                            }
                            {
                                !block.isBoolean && cantDisplaySlider &&
                                <FloatLineComponent globalState={this.props.globalState} key={block.uniqueId} label={block.name} target={block} propertyName="value"
                                onChange={() => this.processInputBlockUpdate(block)}/>
                            }
                            {
                                !block.isBoolean && !cantDisplaySlider &&
                                <SliderLineComponent key={block.uniqueId} label={block.name} target={block} propertyName="value"
                                step={(block.max - block.min) / 100.0} minimum={block.min} maximum={block.max} globalState={this.props.globalState}
                                onChange={() => this.processInputBlockUpdate(block)}/>
                            }
                        </div>
                    );
            case NodeMaterialBlockConnectionPointTypes.Color3:
                return (
                    <Color3LineComponent globalState={this.props.globalState} key={block.uniqueId} label={block.name} target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                );
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return (
                    <Color4LineComponent globalState={this.props.globalState} key={block.uniqueId} label={block.name} target={block} propertyName="value"
                    onChange={() => this.processInputBlockUpdate(block)}/>
                );
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return (
                        <Vector2LineComponent globalState={this.props.globalState} key={block.uniqueId} label={block.name} target={block}
                        propertyName="value"
                        onChange={() => this.processInputBlockUpdate(block)}/>
                );
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                return (
                    <Vector3LineComponent globalState={this.props.globalState} key={block.uniqueId} label={block.name} target={block}
                    propertyName="value"
                    onChange={() => this.processInputBlockUpdate(block)}/>
                );
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                return (
                    <Vector4LineComponent globalState={this.props.globalState} key={block.uniqueId} label={block.name} target={block}
                    propertyName="value"
                    onChange={() => this.processInputBlockUpdate(block)}/>
                );
            }
        return null;
    }

    render() {
        return (
                <LineContainerComponent title="INPUTS">
                {
                    this.props.inputs.map((ib) => {
                    if (!ib.isUniform || ib.isSystemValue || !ib.name) {
                        return null;
                        }
                        return this.renderInputBlock(ib);
                    })
                }
                </LineContainerComponent>
        );
    }
}