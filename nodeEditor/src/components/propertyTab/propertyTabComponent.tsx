
import * as React from "react";
import { GlobalState } from '../../globalState';
import { Nullable } from 'babylonjs/types';
import { DefaultNodeModel } from '../../components/diagram/defaultNodeModel';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { StringTools } from '../../stringTools';
import { FileButtonLineComponent } from '../../sharedComponents/fileButtonLineComponent';
import { Tools } from 'babylonjs/Misc/tools';
import { SerializationTools } from '../../serializationTools';
import { CheckBoxLineComponent } from '../../sharedComponents/checkBoxLineComponent';
import { DataStorage } from '../../dataStorage';
require("./propertyTab.scss");

interface IPropertyTabComponentProps {
    globalState: GlobalState;
}

export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, { currentNode: Nullable<DefaultNodeModel> }> {

    constructor(props: IPropertyTabComponentProps) {
        super(props)

        this.state = { currentNode: null };
    }

    componentDidMount() {
        this.props.globalState.onSelectionChangedObservable.add(block => {
            this.setState({ currentNode: block });
        });
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
                    {this.state.currentNode.renderProperties(this.props.globalState)}
                </div>
            );
        }

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
                </div>
            </div>
        );
    }
}