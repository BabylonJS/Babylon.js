
import * as React from "react";
import { GlobalState } from '../../globalState';
import { Nullable } from 'babylonjs/types';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { StringTools } from '../../stringTools';
import { FileButtonLineComponent } from '../../sharedComponents/fileButtonLineComponent';
import { Tools } from 'babylonjs/Misc/tools';
import { SerializationTools } from '../../serializationTools';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { DataStorage } from '../../dataStorage';
import { GraphNode } from '../../diagram/graphNode';
import { SliderLineComponent } from '../../sharedComponents/sliderLineComponent';
import { GraphFrame } from '../../diagram/graphFrame';
import { TextLineComponent } from '../../sharedComponents/textLineComponent';
import { Engine } from 'babylonjs/Engines/engine';
import { FramePropertyTabComponent } from '../../diagram/properties/framePropertyComponent';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
import { Color3LineComponent } from '../../sharedComponents/color3LineComponent';
import { FloatLineComponent } from '../../sharedComponents/floatLineComponent';
import { Color4LineComponent } from '../../sharedComponents/color4LineComponent';
import { Vector2LineComponent } from '../../sharedComponents/vector2LineComponent';
import { Vector3LineComponent } from '../../sharedComponents/vector3LineComponent';
import { Vector4LineComponent } from '../../sharedComponents/vector4LineComponent';
require("./propertyTab.scss");

interface IPropertyTabComponentProps {
    globalState: GlobalState;
}

export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, { currentNode: Nullable<GraphNode>, currentFrame: Nullable<GraphFrame> }> {
    constructor(props: IPropertyTabComponentProps) {
        super(props)

        this.state = { currentNode: null, currentFrame: null };
    }

    componentDidMount() {
        this.props.globalState.onSelectionChangedObservable.add(selection => {
            if (selection instanceof GraphNode) {
                this.setState({ currentNode: selection, currentFrame: null });
            } else if (selection instanceof GraphFrame) {
                this.setState({ currentNode: null, currentFrame: selection });
            } else {
                this.setState({ currentNode: null, currentFrame: null });
            }
        });
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
                        <div key={block.name}>                            
                            {
                                block.isBoolean &&
                                <CheckBoxLineComponent key={block.name} label={block.name} target={block} propertyName="value" 
                                onValueChanged={() => this.processInputBlockUpdate(block)}/>
                            }
                            {
                                !block.isBoolean && cantDisplaySlider &&
                                <FloatLineComponent key={block.name} label={block.name} target={block} propertyName="value" 
                                onChange={() => this.processInputBlockUpdate(block)}/>
                            }        
                            {
                                !block.isBoolean && !cantDisplaySlider &&
                                <SliderLineComponent key={block.name} label={block.name} target={block} propertyName="value" 
                                step={(block.max - block.min) / 100.0} minimum={block.min} maximum={block.max}
                                onChange={() => this.processInputBlockUpdate(block)}/>
                            }
                        </div>
                    );  
            case NodeMaterialBlockConnectionPointTypes.Color3:
                return (
                    <Color3LineComponent globalState={this.props.globalState} key={block.name} label={block.name} target={block} 
                        propertyName="value" 
                        onChange={() => this.processInputBlockUpdate(block)}
                    />
                )     
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return (
                    <Color4LineComponent globalState={this.props.globalState} key={block.name} label={block.name} target={block} propertyName="value" 
                    onChange={() => this.processInputBlockUpdate(block)}/>
                )                         
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return (
                        <Vector2LineComponent globalState={this.props.globalState} key={block.name} label={block.name} target={block} 
                        propertyName="value" 
                        onChange={() => this.processInputBlockUpdate(block)}/>
                    )                                
            case NodeMaterialBlockConnectionPointTypes.Vector3:
                return (
                    <Vector3LineComponent globalState={this.props.globalState} key={block.name} label={block.name} target={block} 
                    propertyName="value" 
                    onChange={() => this.processInputBlockUpdate(block)}/>
                )
            case NodeMaterialBlockConnectionPointTypes.Vector4:
                return (
                    <Vector4LineComponent globalState={this.props.globalState} key={block.name} label={block.name} target={block} 
                    propertyName="value" 
                    onChange={() => this.processInputBlockUpdate(block)}/>
                )
            }
        return null;
    }

    load(file: File) {
        Tools.ReadFile(file, (data) => {
            let decoder = new TextDecoder("utf-8");
            SerializationTools.Deserialize(JSON.parse(decoder.decode(data)), this.props.globalState);

        }, undefined, true);
    }

    save() {
        let json = SerializationTools.Serialize(this.props.globalState.nodeMaterial, this.props.globalState);
        StringTools.DownloadAsFile(this.props.globalState.hostDocument, json, "nodeMaterial.json");
    }

    customSave() {
        this.props.globalState.onLogRequiredObservable.notifyObservers({message: "Saving your material to Babylon.js snippet server...", isError: false});
        this.props.globalState.customSave!.action(SerializationTools.Serialize(this.props.globalState.nodeMaterial, this.props.globalState)).then(() => {
            this.props.globalState.onLogRequiredObservable.notifyObservers({message: "Material saved successfully", isError: false});
        }).catch(err => {
            this.props.globalState.onLogRequiredObservable.notifyObservers({message: err, isError: true});
        });
    }

    render() {
        if (this.state.currentNode) {
            return (
                <div id="propertyTab">
                    <div id="header">
                        <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                        <div id="title">
                            NODE MATERIAL EDITOR
                        </div>
                    </div>
                    {this.state.currentNode.renderProperties()}
                </div>
            );
        }

        if (this.state.currentFrame) {
            return (
                <FramePropertyTabComponent globalState={this.props.globalState} frame={this.state.currentFrame}/>
            );
        }

        let gridSize = DataStorage.ReadNumber("GridSize", 20);

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
                        <TextLineComponent label="Version" value={Engine.Version}/>
                        <TextLineComponent label="Help" value="doc.babylonjs.com" underline={true} onLink={() => window.open('https://doc.babylonjs.com/how_to/node_material', '_blank')}/>
                        <ButtonLineComponent label="Reset to default" onClick={() => {
                            this.props.globalState.nodeMaterial!.setToDefault();
                            this.props.globalState.onResetRequiredObservable.notifyObservers();
                        }} />
                    </LineContainerComponent>
                    <LineContainerComponent title="UI">
                        <ButtonLineComponent label="Zoom to fit" onClick={() => {
                            this.props.globalState.onZoomToFitRequiredObservable.notifyObservers();
                        }} />
                        <ButtonLineComponent label="Reorganize" onClick={() => {
                            this.props.globalState.onReOrganizedRequiredObservable.notifyObservers();
                        }} />
                    </LineContainerComponent>
                    <LineContainerComponent title="OPTIONS">
                        <CheckBoxLineComponent label="Embed textures when saving" 
                            isSelected={() => DataStorage.ReadBoolean("EmbedTextures", true)}
                            onSelect={(value: boolean) => {
                                DataStorage.StoreBoolean("EmbedTextures", value);
                            }}
                        />
                        <SliderLineComponent label="Grid size" minimum={0} maximum={100} step={5} 
                            decimalCount={0} 
                            directValue={gridSize}
                            onChange={value => {
                                DataStorage.StoreNumber("GridSize", value);                                
                                this.props.globalState.onGridSizeChanged.notifyObservers();
                                this.forceUpdate();
                            }}
                        />
                        <CheckBoxLineComponent label="Show grid" 
                            isSelected={() => DataStorage.ReadBoolean("ShowGrid", true)}
                            onSelect={(value: boolean) => {
                                DataStorage.StoreBoolean("ShowGrid", value);                
                                this.props.globalState.onGridSizeChanged.notifyObservers();
                            }}
                        />
                    </LineContainerComponent>
                    <LineContainerComponent title="FILE">                        
                        <FileButtonLineComponent label="Load" onClick={(file) => this.load(file)} accept=".json" />
                        <ButtonLineComponent label="Save" onClick={() => {
                            this.save();
                        }} />
                        {
                            this.props.globalState.customSave && 
                            <ButtonLineComponent label={this.props.globalState.customSave!.label} onClick={() => {
                                this.customSave();
                            }} />
                        }
                        <ButtonLineComponent label="Generate code" onClick={() => {
                            StringTools.DownloadAsFile(this.props.globalState.hostDocument, this.props.globalState.nodeMaterial!.generateCode(), "code.txt");
                        }} />
                        <ButtonLineComponent label="Export shaders" onClick={() => {
                            StringTools.DownloadAsFile(this.props.globalState.hostDocument, this.props.globalState.nodeMaterial!.compiledShaders, "shaders.txt");
                        }} />
                    </LineContainerComponent>                    
                    <LineContainerComponent title="INPUTS">   
                    {
                        this.props.globalState.nodeMaterial.getInputBlocks().map(ib => {
                            if (!ib.isUniform) {
                                return null;
                            }
                            return this.renderInputBlock(ib);
                        })
                    }
                    </LineContainerComponent>
                </div>
            </div>
        );
    }
}