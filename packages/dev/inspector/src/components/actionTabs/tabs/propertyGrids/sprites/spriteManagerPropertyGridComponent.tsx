import * as React from "react";

import type { Observable } from "core/Misc/observable";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { GlobalState } from "../../../../globalState";
import { SpriteManager } from "core/Sprites/spriteManager";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { RenderingManager } from "core/Rendering/renderingManager";
import { TextureLinkLineComponent } from "../../../lines/textureLinkLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { Sprite } from "core/Sprites/sprite";
import { Tools } from "core/Misc/tools";
import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";
import { Constants } from "core/Engines/constants";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { alphaModeOptions } from "shared-ui-components/constToOptionsMaps";

interface ISpriteManagerPropertyGridComponentProps {
    globalState: GlobalState;
    spriteManager: SpriteManager;
    lockObject: LockObject;
    onSelectionChangedObservable?: Observable<any>;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class SpriteManagerPropertyGridComponent extends React.Component<ISpriteManagerPropertyGridComponentProps> {
    private _snippetUrl = Constants.SnippetUrl;

    constructor(props: ISpriteManagerPropertyGridComponentProps) {
        super(props);
    }

    addNewSprite() {
        const spriteManager = this.props.spriteManager;
        const newSprite = new Sprite("new sprite", spriteManager);

        this.props.onSelectionChangedObservable?.notifyObservers(newSprite);
    }

    disposeManager() {
        const spriteManager = this.props.spriteManager;
        spriteManager.dispose();

        this.props.onSelectionChangedObservable?.notifyObservers(null);
    }

    saveToFile() {
        const spriteManager = this.props.spriteManager;
        const content = JSON.stringify(spriteManager.serialize(true));

        Tools.Download(new Blob([content]), "spriteManager.json");
    }

    loadFromFile(file: File) {
        const spriteManager = this.props.spriteManager;
        const scene = spriteManager.scene;

        Tools.ReadFile(
            file,
            (data) => {
                const decoder = new TextDecoder("utf-8");
                const jsonObject = JSON.parse(decoder.decode(data));

                spriteManager.dispose();
                this.props.globalState.onSelectionChangedObservable.notifyObservers(null);

                const newManager = SpriteManager.Parse(jsonObject, scene, "");
                this.props.globalState.onSelectionChangedObservable.notifyObservers(newManager);
            },
            undefined,
            true
        );
    }

    loadFromSnippet() {
        const spriteManager = this.props.spriteManager;
        const scene = spriteManager.scene;

        const snippedId = window.prompt("Please enter the snippet ID to use");

        if (!snippedId) {
            return;
        }

        spriteManager.dispose();
        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);

        SpriteManager.ParseFromSnippetAsync(snippedId, scene)
            .then((newManager) => {
                this.props.globalState.onSelectionChangedObservable.notifyObservers(newManager);
            })
            .catch((err) => {
                alert("Unable to load your sprite manager: " + err);
            });
    }

    saveToSnippet() {
        const spriteManager = this.props.spriteManager;
        const content = JSON.stringify(spriteManager.serialize(true));

        const xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState == 4) {
                if (xmlHttp.status == 200) {
                    const snippet = JSON.parse(xmlHttp.responseText);
                    const oldId = spriteManager.snippetId || "_BLANK";
                    spriteManager.snippetId = snippet.id;
                    if (snippet.version && snippet.version != "0") {
                        spriteManager.snippetId += "#" + snippet.version;
                    }
                    this.forceUpdate();
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(spriteManager.snippetId);
                    }

                    const windowAsAny = window as any;

                    if (windowAsAny.Playground && oldId) {
                        windowAsAny.Playground.onRequestCodeChangeObservable.notifyObservers({
                            regex: new RegExp(`SpriteManager.ParseFromSnippetAsync\\("${oldId}`, "g"),
                            replace: `SpriteManager.ParseFromSnippetAsync("${spriteManager.snippetId}`,
                        });
                    }

                    alert("Sprite manager saved with ID: " + spriteManager.snippetId + " (please note that the id was also saved to your clipboard)");
                } else {
                    alert("Unable to save your sprite manager");
                }
            }
        };

        xmlHttp.open("POST", this._snippetUrl + (spriteManager.snippetId ? "/" + spriteManager.snippetId : ""), true);
        xmlHttp.setRequestHeader("Content-Type", "application/json");

        const dataToSend = {
            payload: JSON.stringify({
                spriteManager: content,
            }),
            name: "",
            description: "",
            tags: "",
        };

        xmlHttp.send(JSON.stringify(dataToSend));
    }

    override render() {
        const spriteManager = this.props.spriteManager;

        return (
            <>
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Name"
                        target={spriteManager}
                        propertyName="name"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextLineComponent label="Unique ID" value={spriteManager.uniqueId.toString()} />
                    <TextLineComponent label="Capacity" value={spriteManager.capacity.toString()} />
                    <TextureLinkLineComponent label="Texture" texture={spriteManager.texture} onSelectionChangedObservable={this.props.onSelectionChangedObservable} />
                    {spriteManager.sprites.length < spriteManager.capacity && <ButtonLineComponent label="Add new sprite" onClick={() => this.addNewSprite()} />}
                    <ButtonLineComponent label="Dispose" onClick={() => this.disposeManager()} />
                </LineContainerComponent>
                <LineContainerComponent title="FILE" selection={this.props.globalState}>
                    <FileButtonLine label="Load" onClick={(file) => this.loadFromFile(file)} accept=".json" />
                    <ButtonLineComponent label="Save" onClick={() => this.saveToFile()} />
                </LineContainerComponent>
                <LineContainerComponent title="SNIPPET" selection={this.props.globalState}>
                    {spriteManager.snippetId && <TextLineComponent label="Snippet ID" value={spriteManager.snippetId} />}
                    <ButtonLineComponent label="Load from snippet server" onClick={() => this.loadFromSnippet()} />
                    <ButtonLineComponent label="Save to snippet server" onClick={() => this.saveToSnippet()} />
                </LineContainerComponent>
                <LineContainerComponent title="PROPERTIES" selection={this.props.globalState}>
                    <CheckBoxLineComponent label="Pickable" target={spriteManager} propertyName="isPickable" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent
                        label="Fog enabled"
                        target={spriteManager}
                        propertyName="fogEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent
                        label="No depth write"
                        target={spriteManager}
                        propertyName="disableDepthWrite"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Rendering group ID"
                        decimalCount={0}
                        target={spriteManager}
                        propertyName="renderingGroupId"
                        minimum={RenderingManager.MIN_RENDERINGGROUPS}
                        maximum={RenderingManager.MAX_RENDERINGGROUPS - 1}
                        step={1}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <OptionsLine
                        label="Alpha mode"
                        options={alphaModeOptions}
                        target={spriteManager}
                        propertyName="blendMode"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onSelect={(value) => this.setState({ blendMode: value })}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="CELLS" selection={this.props.globalState}>
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Cell width"
                        isInteger={true}
                        target={spriteManager}
                        propertyName="cellWidth"
                        min={0}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        lockObject={this.props.lockObject}
                        label="Cell height"
                        isInteger={true}
                        target={spriteManager}
                        propertyName="cellHeight"
                        min={0}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
            </>
        );
    }
}
