
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
import { DataStorage } from 'babylonjs/Misc/dataStorage';
import { GraphNode } from '../../diagram/graphNode';
import { SliderLineComponent } from '../../sharedComponents/sliderLineComponent';
import { GraphFrame } from '../../diagram/graphFrame';
import { TextLineComponent } from '../../sharedComponents/textLineComponent';
import { Engine } from 'babylonjs/Engines/engine';
import { FramePropertyTabComponent } from '../../diagram/properties/framePropertyComponent';
import { FrameNodePortPropertyTabComponent } from '../../diagram/properties/frameNodePortPropertyComponent';
import { NodePortPropertyTabComponent } from '../../diagram/properties/nodePortPropertyComponent';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
import { Color3LineComponent } from '../../sharedComponents/color3LineComponent';
import { FloatLineComponent } from '../../sharedComponents/floatLineComponent';
import { Color4LineComponent } from '../../sharedComponents/color4LineComponent';
import { Vector2LineComponent } from '../../sharedComponents/vector2LineComponent';
import { Vector3LineComponent } from '../../sharedComponents/vector3LineComponent';
import { Vector4LineComponent } from '../../sharedComponents/vector4LineComponent';
import { Observer } from 'babylonjs/Misc/observable';
import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
import { FrameNodePort } from '../../diagram/frameNodePort';
import { NodePort } from '../../diagram/nodePort';
import { isFramePortData } from '../../diagram/graphCanvas';
import { OptionsLineComponent } from '../../sharedComponents/optionsLineComponent';
import { NodeMaterialModes } from 'babylonjs/Materials/Node/Enums/nodeMaterialModes';
import { PreviewType } from '../preview/previewType';
require("./propertyTab.scss");

interface IPropertyTabComponentProps {
    globalState: GlobalState;
}

interface IPropertyTabComponentState {
    currentNode: Nullable<GraphNode>;
    currentFrame: Nullable<GraphFrame>;
    currentFrameNodePort: Nullable<FrameNodePort>;
    currentNodePort: Nullable<NodePort>;
 }

export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, IPropertyTabComponentState> {
    private _onBuiltObserver: Nullable<Observer<void>>;
    private _modeSelect: React.RefObject<OptionsLineComponent>;

    constructor(props: IPropertyTabComponentProps) {
        super(props);

        this.state = { currentNode: null, currentFrame: null, currentFrameNodePort: null, currentNodePort: null };

        this._modeSelect = React.createRef();
    }

    componentDidMount() {
        this.props.globalState.onSelectionChangedObservable.add((selection) => {
            if (selection instanceof GraphNode) {
                this.setState({ currentNode: selection, currentFrame: null, currentFrameNodePort: null, currentNodePort: null });
            } else if (selection instanceof GraphFrame) {
                this.setState({ currentNode: null, currentFrame: selection, currentFrameNodePort: null, currentNodePort: null });
            } else if (isFramePortData(selection)) {
                this.setState({ currentNode: null, currentFrame: selection.frame, currentFrameNodePort: selection.port, currentNodePort: null });
            } else if (selection instanceof NodePort && selection.hasLabel()) {
                this.setState({ currentNode: null, currentFrame: null, currentFrameNodePort: null, currentNodePort: selection});
            } else {
                this.setState({ currentNode: null, currentFrame: null, currentFrameNodePort: null, currentNodePort: null });
            }
        });

        this._onBuiltObserver = this.props.globalState.onBuiltObservable.add(() => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        this.props.globalState.onBuiltObservable.remove(this._onBuiltObserver);
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
                                step={(block.max - block.min) / 100.0} minimum={block.min} maximum={block.max}
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

    load(file: File) {
        Tools.ReadFile(file, (data) => {
            let decoder = new TextDecoder("utf-8");
            SerializationTools.Deserialize(JSON.parse(decoder.decode(data)), this.props.globalState);

            if (!this.changeMode(this.props.globalState.nodeMaterial!.mode, true, false)) {
                this.props.globalState.onResetRequiredObservable.notifyObservers();
            }
            this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
        }, undefined, true);
    }

    loadFrame(file: File) {
        Tools.ReadFile(file, (data) => {
            // get Frame Data from file
            let decoder = new TextDecoder("utf-8");
            const frameData = JSON.parse(decoder.decode(data));
            SerializationTools.AddFrameToMaterial(frameData, this.props.globalState, this.props.globalState.nodeMaterial);
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
        }).catch((err) => {
            this.props.globalState.onLogRequiredObservable.notifyObservers({message: err, isError: true});
        });
    }

    saveToSnippetServer() {
        const material = this.props.globalState.nodeMaterial;
        const xmlHttp = new XMLHttpRequest();

        let json = SerializationTools.Serialize(material, this.props.globalState);

        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState == 4) {
                if (xmlHttp.status == 200) {
                    var snippet = JSON.parse(xmlHttp.responseText);
                    const oldId = material.snippetId;
                    material.snippetId = snippet.id;
                    if (snippet.version && snippet.version != "0") {
                        material.snippetId += "#" + snippet.version;
                    }

                    this.forceUpdate();
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(material.snippetId);
                    }

                    let windowAsAny = window as any;

                    if (windowAsAny.Playground && oldId) {
                        windowAsAny.Playground.onRequestCodeChangeObservable.notifyObservers({
                            regex: new RegExp(oldId, "g"),
                            replace: material.snippetId
                        });
                    }

                    this.props.globalState.hostDocument.defaultView!.alert("NodeMaterial saved with ID: " + material.snippetId + " (please note that the id was also saved to your clipboard)");

                }
                else {
                    this.props.globalState.hostDocument.defaultView!.alert(`Unable to save your node material. It may be too large (${(dataToSend.payload.length / 1024).toFixed(2)} KB) because of embedded textures. Please reduce texture sizes or point to a specific url instead of embedding them and try again.`);
                }
            }
        };

        xmlHttp.open("POST", NodeMaterial.SnippetUrl + (material.snippetId ? "/" + material.snippetId : ""), true);
        xmlHttp.setRequestHeader("Content-Type", "application/json");

        var dataToSend = {
            payload : JSON.stringify({
                nodeMaterial: json
            }),
            name: "",
            description: "",
            tags: ""
        };

        xmlHttp.send(JSON.stringify(dataToSend));
    }

    loadFromSnippet() {
        const material = this.props.globalState.nodeMaterial;
        const scene = material.getScene();

        let snippedID = window.prompt("Please enter the snippet ID to use");

        if (!snippedID) {
            return;
        }

        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);

        NodeMaterial.ParseFromSnippetAsync(snippedID, scene, "", material).then(() => {
            material.build();
            if (!this.changeMode(this.props.globalState.nodeMaterial!.mode, true, false)) {
                this.props.globalState.onResetRequiredObservable.notifyObservers();
            }
        }).catch((err) => {
            this.props.globalState.hostDocument.defaultView!.alert("Unable to load your node material: " + err);
        });
    }

    changeMode(value: any, force = false, loadDefault = true): boolean {
        if (this.props.globalState.mode === value) {
            return false;
        }

        if (!force && !this.props.globalState.hostDocument.defaultView!.confirm('Are your sure? You will lose your current changes (if any) if they are not saved!')) {
            this._modeSelect.current?.setValue(this.props.globalState.mode);
            return false;
        }

        if (force) {
            this._modeSelect.current?.setValue(value);
        }

        if (loadDefault) {
            switch (value) {
                case NodeMaterialModes.Material:
                    this.props.globalState.nodeMaterial!.setToDefault();
                    break;
                case NodeMaterialModes.PostProcess:
                    this.props.globalState.nodeMaterial!.setToDefaultPostProcess();
                    break;
                case NodeMaterialModes.Particle:
                    this.props.globalState.nodeMaterial!.setToDefaultParticle();
                    break;
                case NodeMaterialModes.ProceduralTexture:
                    this.props.globalState.nodeMaterial!.setToDefaultProceduralTexture();
                    break;
            }
        }

        switch (value) {
            case NodeMaterialModes.Material:
                this.props.globalState.previewType = PreviewType.Sphere;
                break;
            case NodeMaterialModes.Particle:
                this.props.globalState.previewType = PreviewType.Bubbles;
                break;
        }

        this.props.globalState.listOfCustomPreviewFiles = [];
        (this.props.globalState.previewFile as any) = undefined;

        DataStorage.WriteNumber("PreviewType", this.props.globalState.previewType);

        this.props.globalState.mode = value as NodeMaterialModes;

        this.props.globalState.onResetRequiredObservable.notifyObservers();

        return true;
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
                    {this.state.currentNode?.renderProperties() || this.state.currentNodePort?.node.renderProperties()}
                </div>
            );
        }

        if (this.state.currentFrameNodePort && this.state.currentFrame) {
            return (
                <FrameNodePortPropertyTabComponent globalState={this.props.globalState} frame={this.state.currentFrame} frameNodePort={this.state.currentFrameNodePort}/>
            );
        }

        if (this.state.currentNodePort) {
            return (
                <NodePortPropertyTabComponent globalState={this.props.globalState} nodePort={this.state.currentNodePort}/>
            );
        }

        if (this.state.currentFrame) {
            return (
                <FramePropertyTabComponent globalState={this.props.globalState} frame={this.state.currentFrame}/>
            );
        }

        let gridSize = DataStorage.ReadNumber("GridSize", 20);

        const modeList = [
            { label: "Material", value: NodeMaterialModes.Material },
            { label: "Post Process", value: NodeMaterialModes.PostProcess },
            { label: "Particle", value: NodeMaterialModes.Particle },
            { label: "Procedural", value: NodeMaterialModes.ProceduralTexture },
        ];

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
                        <OptionsLineComponent ref={this._modeSelect} label="Mode" target={this} getSelection={(target) => this.props.globalState.mode} options={modeList} onSelect={(value) => this.changeMode(value)} />
                        <TextLineComponent label="Version" value={Engine.Version}/>
                        <TextLineComponent label="Help" value="doc.babylonjs.com" underline={true} onLink={() => window.open('https://doc.babylonjs.com/how_to/node_material', '_blank')}/>
                        <ButtonLineComponent label="Reset to default" onClick={() => {
                            switch (this.props.globalState.mode) {
                                case NodeMaterialModes.Material:
                                    this.props.globalState.nodeMaterial!.setToDefault();
                                    break;
                                case NodeMaterialModes.PostProcess:
                                    this.props.globalState.nodeMaterial!.setToDefaultPostProcess();
                                    break;
                                case NodeMaterialModes.Particle:
                                    this.props.globalState.nodeMaterial!.setToDefaultParticle();
                                    break;
                                case NodeMaterialModes.ProceduralTexture:
                                    this.props.globalState.nodeMaterial!.setToDefaultProceduralTexture();
                                    break;
                            }
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
                                DataStorage.WriteBoolean("EmbedTextures", value);
                            }}
                        />
                        <SliderLineComponent label="Grid size" minimum={0} maximum={100} step={5}
                            decimalCount={0}
                            directValue={gridSize}
                            onChange={(value) => {
                                DataStorage.WriteNumber("GridSize", value);
                                this.props.globalState.onGridSizeChanged.notifyObservers();
                                this.forceUpdate();
                            }}
                        />
                        <CheckBoxLineComponent label="Show grid"
                            isSelected={() => DataStorage.ReadBoolean("ShowGrid", true)}
                            onSelect={(value: boolean) => {
                                DataStorage.WriteBoolean("ShowGrid", value);
                                this.props.globalState.onGridSizeChanged.notifyObservers();
                            }}
                        />
                    </LineContainerComponent>
                    <LineContainerComponent title="FILE">
                        <FileButtonLineComponent label="Load" onClick={(file) => this.load(file)} accept=".json" />
                        <ButtonLineComponent label="Save" onClick={() => {
                            this.save();
                        }} />
                        <ButtonLineComponent label="Generate code" onClick={() => {
                            StringTools.DownloadAsFile(this.props.globalState.hostDocument, this.props.globalState.nodeMaterial!.generateCode(), "code.txt");
                        }} />
                        <ButtonLineComponent label="Export shaders" onClick={() => {
                            StringTools.DownloadAsFile(this.props.globalState.hostDocument, this.props.globalState.nodeMaterial!.compiledShaders, "shaders.txt");
                        }} />
                        {
                            this.props.globalState.customSave &&
                            <ButtonLineComponent label={this.props.globalState.customSave!.label} onClick={() => {
                                this.customSave();
                            }} />
                        }
                        <FileButtonLineComponent label="Load Frame" uploadName={'frame-upload'} onClick={(file) => this.loadFrame(file)} accept=".json" />
                    </LineContainerComponent>
                    {
                        !this.props.globalState.customSave &&
                        <LineContainerComponent title="SNIPPET">
                            {
                                this.props.globalState.nodeMaterial!.snippetId &&
                                <TextLineComponent label="Snippet ID" value={this.props.globalState.nodeMaterial!.snippetId} />
                            }
                            <ButtonLineComponent label="Load from snippet server" onClick={() => this.loadFromSnippet()} />
                            <ButtonLineComponent label="Save to snippet server" onClick={() => {
                                this.saveToSnippetServer();
                            }} />
                        </LineContainerComponent>
                    }
                    <LineContainerComponent title="INPUTS">
                    {
                        this.props.globalState.nodeMaterial.getInputBlocks().map((ib) => {
                            if (!ib.isUniform || ib.isSystemValue || !ib.name) {
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