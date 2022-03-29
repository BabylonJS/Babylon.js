import * as React from "react";
import { StringTools } from "shared-ui-components/stringTools";
import type { GlobalState } from "../../../../../../globalState";
import type { Context } from "../context";
import { Animation } from "core/Animations/animation";
import type { TargetedAnimation } from "core/Animations/animationGroup";

interface ISaveAnimationComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface ISaveAnimationComponentState {}

export class SaveAnimationComponent extends React.Component<ISaveAnimationComponentProps, ISaveAnimationComponentState> {
    private _selectedAnimations: Animation[] = [];
    private _root: React.RefObject<HTMLDivElement>;

    constructor(props: ISaveAnimationComponentProps) {
        super(props);

        this.state = {};

        this._root = React.createRef();

        if (this.props.context.animations) {
            if (this.props.context.useTargetAnimations) {
                for (const targetedAnimation of this.props.context.animations as TargetedAnimation[]) {
                    this._selectedAnimations.push(targetedAnimation.animation);
                }
            } else {
                this._selectedAnimations = (this.props.context.animations as Animation[]).slice(0);
            }
        }
    }

    private _getJson() {
        const json: { animations: any[] } = {
            animations: [],
        };

        for (const animation of this._selectedAnimations) {
            json.animations.push(animation.serialize());
        }

        return JSON.stringify(json);
    }

    public saveToSnippetServer() {
        const xmlHttp = new XMLHttpRequest();
        const hostDocument = this._root.current!.ownerDocument;

        const json = this._getJson();

        xmlHttp.onreadystatechange = () => {
            if (xmlHttp.readyState == 4) {
                if (xmlHttp.status == 200) {
                    const snippet = JSON.parse(xmlHttp.responseText);
                    const oldId = this.props.context.snippetId;
                    this.props.context.snippetId = snippet.id;
                    if (snippet.version && snippet.version != "0") {
                        this.props.context.snippetId += "#" + snippet.version;
                    }

                    this.forceUpdate();

                    const windowAsAny = window as any;

                    if (windowAsAny.Playground && oldId) {
                        windowAsAny.Playground.onRequestCodeChangeObservable.notifyObservers({
                            regex: new RegExp(oldId, "g"),
                            replace: this.props.context.snippetId,
                        });
                    }

                    hostDocument.defaultView!.alert("Animations saved with ID: " + this.props.context.snippetId);
                } else {
                    hostDocument.defaultView!.alert(
                        `Unable to save your animations. It may be too large (${(dataToSend.payload.length / 1024).toFixed(
                            2
                        )} KB). Please try reducing the number of animations or the number of keys per animation and try again.`
                    );
                }
            }
        };

        xmlHttp.open("POST", Animation.SnippetUrl + (this.props.context.snippetId ? "/" + this.props.context.snippetId : ""), true);
        xmlHttp.setRequestHeader("Content-Type", "application/json");

        const dataToSend = {
            payload: JSON.stringify({
                animations: json,
            }),
            name: "",
            description: "",
            tags: "",
        };

        xmlHttp.send(JSON.stringify(dataToSend));
    }

    public saveToFile() {
        StringTools.DownloadAsFile(this._root.current!.ownerDocument, this._getJson(), "animations.json");
    }

    public render() {
        return (
            <div id="save-animation-pane" ref={this._root}>
                <div id="save-animation-list">
                    {this.props.context.animations?.map((a: Animation | TargetedAnimation, i: number) => {
                        const animation = this.props.context.useTargetAnimations ? (a as TargetedAnimation).animation : (a as Animation);

                        return (
                            <div className="save-animation-list-entry" key={i}>
                                <input
                                    type="checkbox"
                                    value={animation.name}
                                    defaultChecked={true}
                                    onClick={(evt) => {
                                        if (evt.currentTarget.checked) {
                                            this._selectedAnimations.push(animation);
                                        } else {
                                            const index = this._selectedAnimations.indexOf(animation);

                                            if (index > -1) {
                                                this._selectedAnimations.splice(index, 1);
                                            }
                                        }
                                    }}
                                />
                                {animation.name}
                            </div>
                        );
                    })}
                </div>
                <div id="save-animation-buttons">
                    <button
                        className="simple-button"
                        id="save-snippet"
                        type="button"
                        onClick={() => {
                            this.saveToSnippetServer();
                        }}
                    >
                        Save Snippet
                    </button>
                    <button
                        className="simple-button"
                        id="save-file"
                        type="button"
                        onClick={() => {
                            this.saveToFile();
                        }}
                    >
                        Save File
                    </button>
                </div>
                {this.props.context.snippetId && <div id="save-animation-snippet">Snippet ID: {this.props.context.snippetId}</div>}
            </div>
        );
    }
}
