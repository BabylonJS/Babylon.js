import * as React from "react";
import * as ReactDOM from "react-dom";
import { GlobalState } from './globalState';
import { GraphEditor } from './components/graphEditor';

/**
 * Interface used to specify creation options for the node editor
 */
export interface INodeEditorOptions {
    /**
     * Defines the DOM element that will host the node editor
     */
    hostElement: HTMLDivElement
}

/**
 * Class used to create a node editor
 */
export class NodeEditor {
    /**
     * Show the node editor
     * @param options defines the options to use to configure the node editor
     */
    public static Show(options: INodeEditorOptions) {
        let globalState = new GlobalState();

        const graphEditor = React.createElement(GraphEditor, {
            globalState: globalState
        });

        ReactDOM.render(graphEditor, options.hostElement);
    }
}

