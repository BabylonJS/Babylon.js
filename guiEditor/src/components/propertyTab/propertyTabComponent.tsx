
import * as React from "react";
import { GlobalState } from '../../globalState';
import { Nullable } from 'babylonjs/types';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { FileButtonLineComponent } from '../../sharedComponents/fileButtonLineComponent';
import { Tools } from 'babylonjs/Misc/tools';
import { SerializationTools } from '../../serializationTools';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { DataStorage } from 'babylonjs/Misc/dataStorage';
import { GUINode } from '../../diagram/guiNode';
import { SliderLineComponent } from '../../sharedComponents/sliderLineComponent';
import { TextLineComponent } from '../../sharedComponents/textLineComponent';
import { Engine } from 'babylonjs/Engines/engine';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { Observer } from 'babylonjs/Misc/observable';

require("./propertyTab.scss");

interface IPropertyTabComponentProps {
    globalState: GlobalState;
}

interface IPropertyTabComponentState {
    currentNode: Nullable<GUINode>;
 }

export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, IPropertyTabComponentState> {
    private _onBuiltObserver: Nullable<Observer<void>>;

    constructor(props: IPropertyTabComponentProps) {
        super(props);

        this.state = { currentNode: null};
    }

    componentDidMount() {
        this.props.globalState.onSelectionChangedObservable.add((selection) => {
            if (selection instanceof GUINode) {
                this.setState({ currentNode: selection});
            } else {
                this.setState({ currentNode: null });
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


    load(file: File) {
        Tools.ReadFile(file, (data) => {
            let decoder = new TextDecoder("utf-8");
            SerializationTools.Deserialize(JSON.parse(decoder.decode(data)), this.props.globalState);


            this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
        }, undefined, true);
    }

    loadFrame(file: File) {
        Tools.ReadFile(file, (data) => {
            // get Frame Data from file
            //let decoder = new TextDecoder("utf-8");
           // const frameData = JSON.parse(decoder.decode(data));
           // SerializationTools.AddFrameToMaterial(frameData, this.props.globalState, this.props.globalState.nodeMaterial);
        }, undefined, true);
    }

    save() {
        //let json = SerializationTools.Serialize(this.props.globalState.nodeMaterial, this.props.globalState);
        //StringTools.DownloadAsFile(this.props.globalState.hostDocument, json, "nodeMaterial.json");
    }

    customSave() {
        /*this.props.globalState.onLogRequiredObservable.notifyObservers({message: "Saving your material to Babylon.js snippet server...", isError: false});
        this.props.globalState.customSave!.action(SerializationTools.Serialize(this.props.globalState.nodeMaterial, this.props.globalState)).then(() => {
            this.props.globalState.onLogRequiredObservable.notifyObservers({message: "Material saved successfully", isError: false});
        }).catch((err) => {
            this.props.globalState.onLogRequiredObservable.notifyObservers({message: err, isError: true});
        });*/
    }

    saveToSnippetServer() {
        /*const material = this.props.globalState.nodeMaterial;
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

        xmlHttp.send(JSON.stringify(dataToSend));*/
    }

    loadFromSnippet() {
        /*const material = this.props.globalState.nodeMaterial;
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
        });*/
    }


    render() {
        if (this.state.currentNode) {
            return (
                <div id="propertyTab">
                    <div id="header">
                        <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                        <div id="title">
                            GUI EDITOR
                        </div>
                    </div>
                    {this.state.currentNode?.renderProperties()}
                </div>
            );
        }

        let gridSize = DataStorage.ReadNumber("GridSize", 20);

        return (
            <div id="propertyTab">
                <div id="header">
                    <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                    <div id="title">
                        GUI EDITOR
                    </div>
                </div>
                <div>
                    <LineContainerComponent title="GENERAL">
                        <TextLineComponent label="Version" value={Engine.Version}/>
                        <TextLineComponent label="Help" value="doc.babylonjs.com" underline={true} onLink={() => window.open('https://doc.babylonjs.com/how_to/node_material', '_blank')}/>
                        <ButtonLineComponent label="Reset to default" onClick={() => {
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
                            decimalCount={0} globalState={this.props.globalState}
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
                            <ButtonLineComponent label="Load from snippet server" onClick={() => this.loadFromSnippet()} />
                            <ButtonLineComponent label="Save to snippet server" onClick={() => {
                                this.saveToSnippetServer();
                            }} />
                        </LineContainerComponent>
                    }
                </div>
            </div>
        );
    }
}