import { Tools } from "core/Misc/tools";
import * as React from "react";
import type { GlobalState } from "../../../../../../globalState";
import type { Context } from "../context";
import { Animation } from "core/Animations/animation";

interface ILoadAnimationComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface ILoadAnimationComponentState {}

export class LoadAnimationComponent extends React.Component<ILoadAnimationComponentProps, ILoadAnimationComponentState> {
    private _root: React.RefObject<HTMLDivElement>;
    private _textInput: React.RefObject<HTMLInputElement>;

    constructor(props: ILoadAnimationComponentProps) {
        super(props);

        this.state = {};

        this._root = React.createRef();
        this._textInput = React.createRef();
    }

    public loadFromFile(evt: React.ChangeEvent<HTMLInputElement>) {
        const files = evt.target.files;
        if (!files || !files.length) {
            return;
        }

        const file = files[0];
        Tools.ReadFile(
            file,
            (data) => {
                const context = this.props.context;
                const decoder = new TextDecoder("utf-8");
                const parsedAnimations = JSON.parse(decoder.decode(data)).animations;
                context.animations = [];

                const animations = context.animations as Animation[];

                for (const parsedAnimation of parsedAnimations) {
                    animations.push(Animation.Parse(parsedAnimation));
                }

                context.stop();

                context.target!.animations = animations;
                context.activeAnimations = animations.length ? animations : [];
                context.prepare();
                context.onAnimationsLoaded.notifyObservers();
                context.onActiveAnimationChanged.notifyObservers({});
            },
            undefined,
            true
        );

        evt.target.value = "";
    }

    public loadFromSnippetServer() {
        const context = this.props.context;
        const snippetId = this._textInput.current!.value;

        Animation.ParseFromSnippetAsync(snippetId)
            .then((animations) => {
                context.snippetId = snippetId;

                if ((animations as Animation[]).length !== undefined) {
                    context.animations = animations as Animation[];
                } else {
                    context.animations = [animations as Animation];
                }

                context.stop();

                context.target!.animations = context.animations;
                context.activeAnimations = context.animations.length ? context.animations : [];
                context.prepare();
                context.onAnimationsLoaded.notifyObservers();
                context.onActiveAnimationChanged.notifyObservers({});
            })
            .catch((err) => {
                this._root.current?.ownerDocument.defaultView!.alert("Unable to load your animations: " + err);
            });
    }

    public render() {
        return (
            <div id="load-animation-pane" ref={this._root}>
                <div id="load-animation-snippet-id-label">Snippet Id</div>
                <div id="load-animation-local-file-label">Local File</div>
                <input type="text" id="load-snippet-id" ref={this._textInput} />
                <button className="simple-button" id="load-snippet" type="button" onClick={() => this.loadFromSnippetServer()}>
                    Load
                </button>
                <label htmlFor="upload-snippet" id="file-snippet-label" className="simple-button">
                    Browse
                </label>
                <input id="upload-snippet" type="file" accept=".json" onChange={(evt) => this.loadFromFile(evt)} />
                {this.props.context.snippetId && <div id="load-animation-snippet">Snippet ID: {this.props.context.snippetId}</div>}
            </div>
        );
    }
}
