import * as React from "react";

import { Observable } from "babylonjs/Misc/observable";

import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LockObject } from "../lockObject";
import { LineContainerComponent } from '../../../lineContainerComponent';
import { GlobalState } from '../../../../globalState';
import { SpriteManager } from 'babylonjs/Sprites/spriteManager';
import { TextInputLineComponent } from '../../../lines/textInputLineComponent';
import { TextLineComponent } from '../../../lines/textLineComponent';
import { CheckBoxLineComponent } from '../../../lines/checkBoxLineComponent';
import { FloatLineComponent } from '../../../lines/floatLineComponent';
import { SliderLineComponent } from '../../../lines/sliderLineComponent';
import { RenderingManager } from 'babylonjs/Rendering/renderingManager';
import { TextureLinkLineComponent } from '../../../lines/textureLinkLineComponent';
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';
import { Sprite } from 'babylonjs/Sprites/sprite';
import { Tools } from 'babylonjs/Misc/tools';
import { FileButtonLineComponent } from '../../../lines/fileButtonLineComponent';
import { Constants } from 'babylonjs/Engines/constants';
import { OptionsLineComponent } from '../../../lines/optionsLineComponent';

interface ISpriteManagerPropertyGridComponentProps {
    globalState: GlobalState;
    spriteManager: SpriteManager;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class SpriteManagerPropertyGridComponent extends React.Component<ISpriteManagerPropertyGridComponentProps> {
    private _snippetUrl = "https://snippet.babylonjs.com";


    constructor(props: ISpriteManagerPropertyGridComponentProps) {
        super(props);
    }

    addNewSprite() {
        const spriteManager = this.props.spriteManager;
        var newSprite = new Sprite("new sprite", spriteManager);

        this.props.onSelectionChangedObservable?.notifyObservers(newSprite);
    }

    disposeManager() {
        const spriteManager = this.props.spriteManager;
        spriteManager.dispose();

        this.props.onSelectionChangedObservable?.notifyObservers(null);
    }

    saveToFile() {        
        const spriteManager = this.props.spriteManager;
        let content = JSON.stringify(spriteManager.serialize(true));

        Tools.Download(new Blob([content]), "spriteManager.json");
    }

    loadFromFile(file: File) {
        const spriteManager = this.props.spriteManager;
        const scene = spriteManager.scene;

        Tools.ReadFile(file, (data) => {
            let decoder = new TextDecoder("utf-8");
            let jsonObject = JSON.parse(decoder.decode(data));
            
            spriteManager.dispose();            
            this.props.globalState.onSelectionChangedObservable.notifyObservers(null);

            let newManager = SpriteManager.Parse(jsonObject, scene, "");
            this.props.globalState.onSelectionChangedObservable.notifyObservers(newManager);
        }, undefined, true);
    }

    loadFromSnippet() {
        const spriteManager = this.props.spriteManager;
        const scene = spriteManager.scene;

        let snippedID = window.prompt("Please enter the snippet ID to use");

        if (!snippedID) {
            return;
        }
        
        spriteManager.dispose();            
        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);

        SpriteManager.CreateFromSnippetAsync(snippedID, scene).then((newManager) => {
            this.props.globalState.onSelectionChangedObservable.notifyObservers(newManager);
        }).catch(err => {
            alert("Unable to load your sprite manager: " + err);
        });
    }

    saveToSnippet() {
        const spriteManager = this.props.spriteManager;
        let content = JSON.stringify(spriteManager.serialize(true));

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState == 4) {
                if (xmlHttp.status == 200) {
                    var snippet = JSON.parse(xmlHttp.responseText);
                    const oldId = spriteManager.snippetId || "_BLANK";
                    spriteManager.snippetId = snippet.id;
                    if (snippet.version && snippet.version != "0") {
                        spriteManager.snippetId += "#" + snippet.version;
                    }
                    this.forceUpdate();
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(spriteManager.snippetId);
                    }

                    let windowAsAny = window as any;

                    if (windowAsAny.Playground && oldId) {
                        windowAsAny.Playground.onRequestCodeChangeObservable.notifyObservers({
                            regex: new RegExp(`SpriteManager.CreateFromSnippetAsync\\("${oldId}`, "g"),
                            replace: `SpriteManager.CreateFromSnippetAsync("${spriteManager.snippetId}`
                        });
                    }

                    alert("Sprite manager saved with ID: " + spriteManager.snippetId + " (please note that the id was also saved to your clipboard)");
                }
                else {
                    alert("Unable to save your sprite manager");
                }
            }
        }

        xmlHttp.open("POST", this._snippetUrl + (spriteManager.snippetId ? "/" + spriteManager.snippetId : ""), true);
        xmlHttp.setRequestHeader("Content-Type", "application/json");

        var dataToSend = {
            payload : JSON.stringify({
                spriteManager: content
            }),
            name: "",
            description: "",
            tags: ""
        };

        xmlHttp.send(JSON.stringify(dataToSend));
    }

    render() {
        const spriteManager = this.props.spriteManager;

        var alphaModeOptions = [
            { label: "Combine", value: Constants.ALPHA_COMBINE },
            { label: "One one", value: Constants.ALPHA_ONEONE },
            { label: "Add", value: Constants.ALPHA_ADD },
            { label: "Subtract", value: Constants.ALPHA_SUBTRACT },
            { label: "Multiply", value: Constants.ALPHA_MULTIPLY },
            { label: "Maximized", value: Constants.ALPHA_MAXIMIZED },
            { label: "Pre-multiplied", value: Constants.ALPHA_PREMULTIPLIED },
        ];        

        return (
            <div className="pane">
                <LineContainerComponent globalState={this.props.globalState} title="GENERAL">
                    <TextInputLineComponent lockObject={this.props.lockObject} label="Name" target={spriteManager} propertyName="name" onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    <TextLineComponent label="Unique ID" value={spriteManager.uniqueId.toString()} />
                    <TextLineComponent label="Capacity" value={spriteManager.capacity.toString()} />
                    <TextureLinkLineComponent label="Texture" texture={spriteManager.texture} onSelectionChangedObservable={this.props.onSelectionChangedObservable}/>
                    {
                        spriteManager.sprites.length < spriteManager.capacity &&
                        <ButtonLineComponent label="Add new sprite" onClick={() => this.addNewSprite()} />
                    }
                    <ButtonLineComponent label="Dispose" onClick={() => this.disposeManager()} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="FILE">
                    <FileButtonLineComponent label="Load" onClick={(file) => this.loadFromFile(file)} accept=".json" />
                    <ButtonLineComponent label="Save" onClick={() => this.saveToFile()} />
                </LineContainerComponent>                
                <LineContainerComponent globalState={this.props.globalState} title="SNIPPET">
                    {
                        spriteManager.snippetId &&
                        <TextLineComponent label="Snippet ID" value={spriteManager.snippetId} />
                    }
                    <ButtonLineComponent label="Load from snippet server" onClick={() => this.loadFromSnippet()} />
                    <ButtonLineComponent label="Save to snippet server" onClick={() => this.saveToSnippet()} />
                </LineContainerComponent>  
                <LineContainerComponent globalState={this.props.globalState} title="PROPERTIES">
                    <CheckBoxLineComponent label="Pickable" target={spriteManager} propertyName="isPickable" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Fog enabled" target={spriteManager} propertyName="fogEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="No depth write" target={spriteManager} propertyName="disableDepthWrite" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Rendering group ID" decimalCount={0} target={spriteManager} propertyName="renderingGroupId" minimum={RenderingManager.MIN_RENDERINGGROUPS} maximum={RenderingManager.MAX_RENDERINGGROUPS - 1} step={1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <OptionsLineComponent label="Alpha mode" options={alphaModeOptions} target={spriteManager} propertyName="blendMode" 
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable} 
                        onSelect={(value) => this.setState({ blendMode: value })} />                                       
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="CELLS">
                    <FloatLineComponent label="Cell width" isInteger={true} target={spriteManager} propertyName="cellWidth" min={0} onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                    <FloatLineComponent label="Cell height" isInteger={true} target={spriteManager} propertyName="cellHeight" min={0} onPropertyChangedObservable={this.props.onPropertyChangedObservable}/>
                </LineContainerComponent>
            </div>
        );
    }
}