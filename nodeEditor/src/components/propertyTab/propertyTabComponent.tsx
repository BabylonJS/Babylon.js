
import * as React from "react";
import { GlobalState } from '../../globalState';
import { Nullable } from 'babylonjs/types';
import { DefaultNodeModel } from '../../components/diagram/defaultNodeModel';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { StringTools } from '../../stringTools';
import { FileButtonLineComponent } from '../../sharedComponents/fileButtonLineComponent';
import { Tools } from 'babylonjs/Misc/tools';
import { INodeLocationInfo } from '../../nodeLocationInfo';
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
            let serializationObject = JSON.parse(decoder.decode(data));

            this.props.globalState.nodeMaterial!.loadFromSerialization(serializationObject, "");

            // Check for id mapping
            if (serializationObject.locations && serializationObject.map) {
                let map: {[key: number]: number} = serializationObject.map;
                let locations: INodeLocationInfo[] = serializationObject.locations;

                for (var location of locations) {
                    location.blockId = map[location.blockId];
                }
            }
            
            this.props.globalState.onResetRequiredObservable.notifyObservers(serializationObject.locations);
        }, undefined, true);
    }

    save() {
        let material = this.props.globalState.nodeMaterial;
        let serializationObject = material.serialize();

        // Store node locations
        for (var block of material.attachedBlocks) {
            let node = this.props.globalState.onGetNodeFromBlock(block);

            if (!serializationObject.locations) {
                serializationObject.locations = [];
            }

            serializationObject.locations.push({
                blockId: block.uniqueId,
                x: node ? node.x : 0,
                y: node ? node.y : 0
            });
        }

        // Output
        let json = JSON.stringify(serializationObject, undefined, 2);
        StringTools.DownloadAsFile(this.props.globalState.hostDocument, json, "nodeMaterial.json");
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
                            this.props.globalState.onResetRequiredObservable.notifyObservers(null);
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
                                this.props.globalState.customSave!.callback(this.props.globalState.nodeMaterial);
                            }} />
                        }
                    </LineContainerComponent>
                </div>
            </div>
        );
    }
}