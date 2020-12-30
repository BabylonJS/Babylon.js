
import * as React from "react";
import { GlobalState } from '../../globalState';
import { Nullable } from 'babylonjs/types';
import { ButtonLineComponent } from '../../sharedUiComponents/lines/buttonLineComponent';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { FileButtonLineComponent } from '../../sharedUiComponents/lines/fileButtonLineComponent';
import { Tools } from 'babylonjs/Misc/tools';
import { SerializationTools } from '../../serializationTools';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { DataStorage } from 'babylonjs/Misc/dataStorage';
import { GUINode } from '../../diagram/guiNode';
import { SliderLineComponent } from '../../sharedComponents/sliderLineComponent';
import { Engine } from 'babylonjs/Engines/engine';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';
import { Observer } from 'babylonjs/Misc/observable';
import { TextLineComponent } from "../../sharedUiComponents/lines/textLineComponent";
import { StringTools } from "../../stringTools";
import { AdvancedDynamicTexture } from "babylonjs-gui/2D/index";
//import { SceneExplorerComponent } from "../sceneExplorer/sceneExplorerComponent";

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

    save() {
        let json = JSON.stringify(this.props.globalState.guiTexture.serializeContent());
        StringTools.DownloadAsFile(this.props.globalState.hostDocument, json, "guiTexture.json");
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
        var adt = this.props.globalState.guiTexture;
        let content = JSON.stringify(adt.serializeContent());

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState == 4) {
                if (xmlHttp.status == 200) {
                    var snippet = JSON.parse(xmlHttp.responseText);
                    const oldId = adt.snippetId || "_BLANK";
                    adt.snippetId = snippet.id;
                    if (snippet.version && snippet.version != "0") {
                        adt.snippetId += "#" + snippet.version;
                    }
                    this.forceUpdate();
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(adt.snippetId);
                    }

                    let windowAsAny = window as any;

                    if (windowAsAny.Playground && oldId) {
                        windowAsAny.Playground.onRequestCodeChangeObservable.notifyObservers({
                            regex: new RegExp(`parseFromSnippetAsync\\("${oldId}`, "g"),
                            replace: `parseFromSnippetAsync("${adt.snippetId}`
                        });
                    }

                    alert("GUI saved with ID: " + adt.snippetId + " (please note that the id was also saved to your clipboard)");
                }
                else {
                    alert("Unable to save your GUI");
                }
            }
        }

        xmlHttp.open("POST", AdvancedDynamicTexture.SnippetUrl + (adt.snippetId ? "/" + adt.snippetId : ""), true);
        xmlHttp.setRequestHeader("Content-Type", "application/json");

        var dataToSend = {
            payload : JSON.stringify({
                gui: content
            }),
            name: "",
            description: "",
            tags: ""
        };

        xmlHttp.send(JSON.stringify(dataToSend));
    }

    loadFromSnippet() {

        let snippedID = window.prompt("Please enter the snippet ID to use");

        if (!snippedID) {
            return;
        }
        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
        this.props.globalState.guiTexture.parseFromSnippetAsync(snippedID);
    }

    render() {

        //var myScene=this.props.globalState.guiTexture.getScene();
        if (this.state.currentNode) {
            return (
                <div id="propertyTab">
                    <div id="header">
                        <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                        <div id="title">
                            GUI EDITOR
                        </div>
                    </div>
                    {//myScene && <SceneExplorerComponent globalState={this.props.globalState} scene={myScene}></SceneExplorerComponent>
                    }
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
                    </LineContainerComponent>
                    {
                        
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