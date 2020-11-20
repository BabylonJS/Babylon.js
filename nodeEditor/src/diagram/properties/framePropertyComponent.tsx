
import * as React from "react";
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { GraphFrame } from '../graphFrame';
import { GlobalState } from '../../globalState';
import { Color3LineComponent } from '../../sharedComponents/color3LineComponent';
import { TextInputLineComponent } from '../../sharedComponents/textInputLineComponent';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';
import { InputBlock, NodeMaterialBlockConnectionPointTypes } from 'babylonjs';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { FloatLineComponent } from '../../sharedComponents/floatLineComponent';
import { SliderLineComponent } from '../../sharedComponents/sliderLineComponent';
import { Vector3LineComponent } from '../../sharedComponents/vector3LineComponent';
import { Vector4LineComponent } from '../../sharedComponents/vector4LineComponent';
import { Vector2LineComponent } from '../../sharedComponents/vector2LineComponent';
import { Color4LineComponent } from '../../sharedComponents/color4LineComponent';

export interface IFramePropertyTabComponentProps {
    globalState: GlobalState
    frame: GraphFrame;
}

export class FramePropertyTabComponent extends React.Component<IFramePropertyTabComponentProps> {
    private onFrameExpandStateChangedObserver: Nullable<Observer<GraphFrame>>;

    constructor(props: IFramePropertyTabComponentProps) {
        super(props)
    }


    componentDidMount() {
        this.onFrameExpandStateChangedObserver = this.props.frame.onExpandStateChanged.add(() => this.forceUpdate());
    }

    componentWillUnmount() {
        if (this.onFrameExpandStateChangedObserver) {
            this.props.frame.onExpandStateChanged.remove(this.onFrameExpandStateChangedObserver);
            this.onFrameExpandStateChangedObserver = null;
        }
    }
    
    renderInputBlock(block: InputBlock) {
        switch (block.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
                    let cantDisplaySlider = (isNaN(block.min) || isNaN(block.max) || block.min === block.max);
                    return (
                        <div key={block.name}>                            
                            {
                                block.isBoolean &&
                                <CheckBoxLineComponent key={block.name} label={block.name} target={block} propertyName="value" onValueChanged={() => {
                                    this.props.globalState.onUpdateRequiredObservable.notifyObservers();}} />
                            }
                            {
                                !block.isBoolean && cantDisplaySlider &&
                                <FloatLineComponent key={block.name} label={block.name} target={block} propertyName="value" 
                                    globalState={this.props.globalState} onChange={() => {
                                        this.props.globalState.onUpdateRequiredObservable.notifyObservers();}}
                                />
                            }        
                            {
                                !block.isBoolean && !cantDisplaySlider &&
                                <SliderLineComponent globalState={this.props.globalState} key={block.name} 
                                label={block.name} target={block} propertyName="value" step={(block.max - block.min) / 100.0} minimum={block.min} maximum={block.max}
                                onChange={() => {this.props.globalState.onUpdateRequiredObservable.notifyObservers();}}/>
                            }
                        </div>
                    );  
            case NodeMaterialBlockConnectionPointTypes.Color3:
                return (
                    <Color3LineComponent key={block.name} label={block.name} target={block} propertyName="value" 
                    globalState={this.props.globalState} onChange={() => {
                        this.props.globalState.onUpdateRequiredObservable.notifyObservers();}}/>
                )     
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return (
                    <Color4LineComponent key={block.name} label={block.name} target={block} propertyName="value" 
                    globalState={this.props.globalState} onChange={() => {
                        this.props.globalState.onUpdateRequiredObservable.notifyObservers();}}/>
                )                         
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return (
                        <Vector2LineComponent key={block.name} label={block.name} target={block} propertyName="value" 
                        globalState={this.props.globalState}onChange={() => {
                            this.props.globalState.onUpdateRequiredObservable.notifyObservers();}}/>
                    )                                
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                return (
                    <Vector3LineComponent key={block.name} label={block.name} target={block} propertyName="value" 
                    globalState={this.props.globalState} onChange={() => {
                        this.props.globalState.onUpdateRequiredObservable.notifyObservers();}} />
                )
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                return (
                    <Vector4LineComponent key={block.name} label={block.name} target={block} propertyName="value" 
                    globalState={this.props.globalState} onChange={() => {
                        this.props.globalState.onUpdateRequiredObservable.notifyObservers();}}/>
                )
            }
        return null;
    }
    
    renderInputValues() {
        let configurableInputBlocks = this.props.frame.nodes.filter(node => {
            return node.block.isInput && node.block.visibleOnFrame
        }).sort( (a, b) => {
            return a.name.localeCompare(b.name);
        });

        let namedGroups: string[] = [];
        configurableInputBlocks.forEach(block => {
            if (!(block.block as InputBlock).groupInInspector) {
                return;
            }

            if (namedGroups.indexOf((block.block as InputBlock).groupInInspector) === -1) {
                namedGroups.push((block.block as InputBlock).groupInInspector);
            }
        });
        namedGroups.sort();
        

        let inputBlockContainer = configurableInputBlocks.length > 0 ?
            <LineContainerComponent title="INPUTS"> {
                configurableInputBlocks.filter(block => !(block.block as InputBlock).groupInInspector).map(block => {
                    return this.renderInputBlock(block.block as InputBlock);
                })
            }
            </LineContainerComponent> : null;

        return (           
            <>
                {inputBlockContainer}
                {
                    namedGroups.map((name, i) => {
                        return (
                            <LineContainerComponent key={"inputValue" + i} title={name.toUpperCase()}>
                            {
                                configurableInputBlocks.filter(block => (block.block as InputBlock).groupInInspector === name).map(block => {
                                    return this.renderInputBlock(block.block as InputBlock);
                                })
                            }
                            </LineContainerComponent>
                        )
                    })   
                }
          </>
        );
    }


    render() {      
        return (
            <div id="propertyTab">
            <div id="header">
                <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                <div id="title">
                    NODE MATERIAL EDITOR
                </div>
            </div>
            <div>
                <LineContainerComponent title="GENERAL">
                    <TextInputLineComponent globalState={this.props.globalState} label="Name" propertyName="name" target={this.props.frame} />
                    <Color3LineComponent globalState={this.props.globalState} label="Color" target={this.props.frame} propertyName="color"></Color3LineComponent>
                    <TextInputLineComponent globalState={this.props.globalState} label="Comments" propertyName="comments" target={this.props.frame}/>
                    {
                        !this.props.frame.isCollapsed &&
                        <ButtonLineComponent label="Collapse" onClick={() => {
                                this.props.frame!.isCollapsed = true;
                            }} />
                    }
                    {
                        this.props.frame.isCollapsed &&
                        <ButtonLineComponent label="Expand" onClick={() => {
                                this.props.frame!.isCollapsed = false;
                            }} />
                    }
                    <ButtonLineComponent label="Export" onClick={() => {
                                this.props.frame!.export();
                            }} />
                </LineContainerComponent>
                {this.renderInputValues()}
            </div>
        </div>
        );
    }
}