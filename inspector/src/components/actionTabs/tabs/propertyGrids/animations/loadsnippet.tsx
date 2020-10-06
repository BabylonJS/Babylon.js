import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../../components/propertyChangedEvent";
import { Animation } from "babylonjs/Animations/animation";
import { ButtonLineComponent } from "../../../lines/buttonLineComponent";
import { FileButtonLineComponent } from "../../../lines/fileButtonLineComponent";
import { TextInputLineComponent } from "../../../lines/textInputLineComponent";
import { LockObject } from "../lockObject";
import { Tools } from "babylonjs/Misc/tools";
import { GlobalState } from "../../../../globalState";
import { ReadFileError } from "babylonjs/Misc/fileTools";
import { IAnimatable } from "babylonjs/Animations/animatable.interface";
import { TargetedAnimation } from "babylonjs/Animations/animationGroup";

interface ILoadSnippetProps {
    animations: Animation[];
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    lockObject: LockObject;
    globalState: GlobalState;
    snippetServer: string;
    setSnippetId: (id: string) => void;
    entity: IAnimatable | TargetedAnimation;
    setNotificationMessage: (message: string) => void;
    animationsLoaded: (numberOfAnimations: number) => void;
}

/**
 * Loads animation locally or from the Babylon.js Snippet Server
 */
export class LoadSnippet extends React.Component<ILoadSnippetProps, { snippetId: string }> {
    private _serverAddress: string;
    constructor(props: ILoadSnippetProps) {
        super(props);
        this._serverAddress = this.props.snippetServer;
        this.state = { snippetId: "" };
    }

    change = (value: string) => {
        this.setState({ snippetId: value });
        this.props.setSnippetId(value);
    };

    loadFromFile = (file: File) => {
        Tools.ReadFile(
            file,
            (data) => {
                let decoder = new TextDecoder("utf-8");
                let jsonObject = JSON.parse(decoder.decode(data));
                var result: Animation[] = [];

                for (var i in jsonObject) {
                    result.push(Animation.Parse(jsonObject[i]));
                }

                if (this.props.entity) {
                    (this.props.entity as IAnimatable).animations = result;
                    var e = new PropertyChangedEvent();
                    e.object = this.props.entity;
                    e.property = "animations";
                    e.value = (this.props.entity as IAnimatable).animations;
                    this.props.globalState.onPropertyChangedObservable.notifyObservers(e);
                    this.props.animationsLoaded(result.length);
                }
            },
            undefined,
            true,
            (error: ReadFileError) => {
                console.log(error.message);
            }
        );
    };

    loadFromSnippet = () => {
        if (this.state.snippetId !== "") {
            //Notify observers
            Animation.CreateFromSnippetAsync(this.state.snippetId)
                .then((newAnimations) => {
                    // Explore how observers are notified from snippet
                    if (newAnimations instanceof Array) {
                        (this.props.entity as IAnimatable).animations = newAnimations;
                    }

                    if (newAnimations instanceof Animation) {
                        (this.props.entity as IAnimatable).animations?.push(newAnimations);
                    }
                })
                .catch((err) => {
                    this.props.setNotificationMessage(`Unable to load your animations: ${err}`);
                });
        } else {
            this.props.setNotificationMessage(`You need to add an snippet id`);
        }
    };

    render() {
        return (
            <div className="load-container">
                <TextInputLineComponent
                    label="Snippet Id"
                    lockObject={this.props.lockObject}
                    value={this.state.snippetId}
                    onChange={this.change}
                />
                <ButtonLineComponent label="Load from snippet server" onClick={this.loadFromSnippet} />
                <div className="load-browse">
                    <p>Local File</p>
                    <FileButtonLineComponent label="Load" onClick={this.loadFromFile} accept=".json" />
                </div>
                <div className="load-server">
                    <p>Snippet Server: </p>&nbsp;
                    <p> {this._serverAddress ?? "-"}</p>
                </div>
            </div>
        );
    }
}
