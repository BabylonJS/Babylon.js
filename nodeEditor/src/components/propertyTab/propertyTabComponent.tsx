
import * as React from "react";
import { GlobalState } from '../../globalState';
import { Nullable } from 'babylonjs/types';
import { DefaultNodeModel } from '../../components/diagram/defaultNodeModel';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { StringTools } from '../../stringTools';
import { FileButtonLineComponent } from '../../sharedComponents/fileButtonLineComponent';
import { Tools } from 'babylonjs/Misc/tools';
require("./propertyTab.scss");

interface IPropertyTabComponentProps {
    globalState: GlobalState;
}

export class PropertyTabComponent extends React.Component<IPropertyTabComponentProps, { currentNode: Nullable<DefaultNodeModel> }> {

    constructor(props: IPropertyTabComponentProps) {
        super(props)

        this.state = { currentNode: null };
    }

    componentWillMount() {
        this.props.globalState.onSelectionChangedObservable.add(block => {
            this.setState({ currentNode: block });
        });
    }

    load(file: File) {
        Tools.ReadFile(file, (data) => {
            let decoder = new TextDecoder("utf-8");
            let serializationObject = JSON.parse(decoder.decode(data));

            this.props.globalState.nodeMaterial!.loadFromSerialization(serializationObject, "");
            
            this.props.globalState.onResetRequiredObservable.notifyObservers();
        }, undefined, true);
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
                    <LineContainerComponent title="PROPERTIES">
                    </LineContainerComponent>
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
                    <LineContainerComponent title="FILE">                        
                        <FileButtonLineComponent label="Load" onClick={(file) => this.load(file)} accept=".json" />
                        <ButtonLineComponent label="Save" onClick={() => {
                            let json = JSON.stringify(this.props.globalState.nodeMaterial!.serialize());
                            StringTools.DownloadAsFile(json, "nodeMaterial.json");
                        }} />
                        <ButtonLineComponent label="Export shaders" onClick={() => {
                            StringTools.DownloadAsFile(this.props.globalState.nodeMaterial!.compiledShaders, "shaders.txt");
                        }} />
                    </LineContainerComponent>
                </div>
            </div>
        );
    }
}