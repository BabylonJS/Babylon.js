import * as React from "react";
import { GlobalState } from '../globalState';
import { Nullable } from 'babylonjs/types';

require("../scss/metadata.scss");

interface IMetadataComponentProps {
    globalState: GlobalState;
}

export class MetadataComponent extends React.Component<IMetadataComponentProps, {isVisible: boolean}> {    
    private _titleRef: React.RefObject<HTMLInputElement>;
    private _descriptionRef: React.RefObject<HTMLTextAreaElement>;
    private _tagsRef: React.RefObject<HTMLTextAreaElement>;

    public constructor(props: IMetadataComponentProps) {
        super(props);
        this.state = {isVisible: false};

        this._titleRef = React.createRef();
        this._descriptionRef = React.createRef();
        this._tagsRef = React.createRef();

        this.props.globalState.onDisplayMetadataObservable.add(value => {
            this.setState({isVisible: value});
        });
        
        this.props.globalState.onMetadataUpdatedObservable.add(() => {
            let selection: Nullable<HTMLElement>;

            if (this.props.globalState.currentSnippetTitle) {
                selection = document.querySelector('title');
                if (selection) {
                    selection.innerText = (this.props.globalState.currentSnippetTitle + " | Babylon.js Playground");
                }
            }

            if (this.props.globalState.currentSnippetDescription) {
                selection = document.querySelector('meta[name="description"]');
                if (selection) {
                    selection.setAttribute("content", this.props.globalState.currentSnippetDescription + " - Babylon.js Playground");
                }
            }

            if (this.props.globalState.currentSnippetTags) {
                selection = document.querySelector('meta[name="keywords"]');
                if (selection) {
                    selection.setAttribute("content", "babylon.js, game engine, webgl, 3d," + this.props.globalState.currentSnippetTags);
                }
            }
        });
    }

    onOk() {
        this.props.globalState.currentSnippetTitle = this._titleRef.current!.value;
        this.props.globalState.currentSnippetDescription = this._descriptionRef.current!.value;
        this.props.globalState.currentSnippetTags = this._tagsRef.current!.value;
        this.setState({isVisible: false});
        this.props.globalState.onMetadataUpdatedObservable.notifyObservers();
        this.props.globalState.onMetadataWindowHiddenObservable.notifyObservers(true);
    }

    onCancel() {
        this.setState({isVisible: false});
        this.props.globalState.onMetadataWindowHiddenObservable.notifyObservers(false);
    }

    public render() {
        if (!this.state.isVisible) {
            return null;
        }

        return (
            <div id="metadata-editor" className={(this.props.globalState.language === "JS" ? "background-js" : "background-ts")}>
                <label htmlFor="title">TITLE</label>
                <div className="separator"></div>
                <input type="text" maxLength={120} id="title" className="save-form-title" ref={this._titleRef} value={this.props.globalState.currentSnippetTitle}/>

                <label htmlFor="description">DESCRIPTION</label>
                <div className="separator"></div>
                <textarea id="description" rows={4} cols={10} ref={this._descriptionRef} value={this.props.globalState.currentSnippetDescription}></textarea>

                <label htmlFor="tags">TAGS (separated by comma)</label>
                <div className="separator"></div>
                <textarea id="tags" rows={4} cols={10} ref={this._tagsRef} value={this.props.globalState.currentSnippetTags}></textarea>

                <div className="editor-buttons" id="buttons">
                    <div id="ok" onClick={() => this.onOk()}>OK</div>
                    <div id="cancel" onClick={() => this.onCancel()}>Cancel</div>
                </div>
            </div>
        )
    }
}