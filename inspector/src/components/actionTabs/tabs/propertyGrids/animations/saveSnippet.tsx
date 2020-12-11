import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../../components/propertyChangedEvent";
import { ButtonLineComponent } from "../../../../../sharedUiComponents/lines/buttonLineComponent";
import { Tools } from "babylonjs/Misc/tools";
import { Animation } from "babylonjs/Animations/animation";
import { LockObject } from "../lockObject";
import { Nullable } from "babylonjs/types";
import { GlobalState } from "../../../../globalState";

interface ISaveSnippetProps {
    // Animation to save
    animations: Nullable<Animation[]>;
    // Observable
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    // Global lock object
    lockObject: LockObject;
    // Global state
    globalState: GlobalState;
    // Snippet server address
    snippetServer: string;
    // Snippert id to save the snippet
    snippetId: string;
}

export interface Snippet {
    url: string;
    id: string;
}
interface SelectedAnimation {
    id: string;
    name: string;
    index: number;
    selected: boolean;
}

/**
 * Saves the animation snippet to the Babylon.js site or downloads the animation file locally
 */
export class SaveSnippet extends React.Component<ISaveSnippetProps, { selectedAnimations: SelectedAnimation[] }> {
    constructor(props: ISaveSnippetProps) {
        super(props);
        let animList = this.props.animations?.map((animation, i) => {
            return {
                id: `${animation.name}_${animation.targetProperty}`,
                name: animation.name,
                index: i,
                selected: false,
            };
        });
        this.state = { selectedAnimations: animList ?? [] };
    }

    /**
     * Set the selected animations to save
     * @param e Input event
     */
    handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        let index = parseInt(e.target.id.replace("save_", ""));

        let updated = this.state.selectedAnimations?.map((item) => {
            if (item.index === index) {
                item.selected = !item.selected;
            }
            return item;
        });

        this.setState({ selectedAnimations: updated });
    };

    /**
     * Stringify the selected animation
     */
    stringifySelectedAnimations() {
        const content: string[] = [];
        this.state.selectedAnimations.forEach((animation) => {
            if (animation.selected) {
                const selected = this.props.animations && this.props.animations[animation.index];
                if (selected) {
                    content.push(selected.serialize());
                }
            }
        });
        return JSON.stringify(content);
    }

    /**
     * Save the selected animations to a local file
     */
    saveToFile = () => {
        const content = this.stringifySelectedAnimations();
        Tools.Download(new Blob([content]), "animations.json");
    };

    /**
     * Save the selected animations if a snippet ID is set
     */
    saveToSnippet = () => {
        if (this.props.snippetId !== "") {
            let serverId = this.props.snippetId;
            const serverUrl = this.props.snippetServer;
            const content = this.stringifySelectedAnimations();

            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = () => {
                if (xmlHttp.readyState == 4) {
                    if (xmlHttp.status == 200) {
                        var snippet = JSON.parse(xmlHttp.responseText);
                        const oldId = serverId;
                        serverId = snippet.id;
                        if (snippet.version && snippet.version != "0") {
                            serverId += "#" + snippet.version;
                        }
                        this.forceUpdate();
                        if (navigator.clipboard) {
                            navigator.clipboard.writeText(serverId);
                        }

                        let windowAsAny = window as any;

                        if (windowAsAny.Playground && oldId) {
                            windowAsAny.Playground.onRequestCodeChangeObservable.notifyObservers({
                                regex: new RegExp(oldId, "g"),
                                replace: serverId,
                            });
                        }

                        alert(
                            "Animations saved with ID: " +
                                serverId +
                                " (please note that the id was also saved to your clipboard)"
                        );
                    } else {
                        alert("Unable to save your animations");
                    }
                }
            };

            xmlHttp.open("POST", serverUrl + (serverId ? "/" + serverId : ""), true);
            xmlHttp.setRequestHeader("Content-Type", "application/json");

            var dataToSend = {
                payload: JSON.stringify({
                    animations: content,
                }),
                name: "",
                description: "",
                tags: "",
            };

            xmlHttp.send(JSON.stringify(dataToSend));
        }
    };

    render() {
        return (
            <div className="save-container">
                <div className="item-list">
                    <ul>
                        {this.props.animations?.map((animation, i) => {
                            return (
                                <li key={i}>
                                    <div>
                                        <label>
                                            <input
                                                id={`save_${i}`}
                                                name={`save_${animation?.name}`}
                                                type="checkbox"
                                                checked={this.state.selectedAnimations[i].selected}
                                                onChange={this.handleCheckboxChange}
                                            />
                                            {animation?.name}
                                        </label>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div className="save-buttons">
                    {this.props.snippetId && (
                        <ButtonLineComponent label="Save to snippet server" onClick={this.saveToSnippet} />
                    )}
                    <ButtonLineComponent label="Save" onClick={this.saveToFile} />
                </div>
                <div className="save-server">
                    <p>Snippet Server: </p>&nbsp;
                    <p> {this.props.snippetServer ?? "-"}</p>
                </div>
            </div>
        );
    }
}
