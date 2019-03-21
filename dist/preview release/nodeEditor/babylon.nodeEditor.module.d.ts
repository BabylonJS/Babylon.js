/// <reference types="react" />
declare module "babylonjs-nodeEditor/globalState" {
    export class GlobalState {
    }
}
declare module "babylonjs-nodeEditor/components/graphEditor" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-nodeEditor/globalState";
    interface IGraphEditorProps {
        globalState: GlobalState;
    }
    export class GraphEditor extends React.Component<IGraphEditorProps> {
        constructor(props: IGraphEditorProps);
        render(): JSX.Element;
    }
}
declare module "babylonjs-nodeEditor/nodeEditor" {
    /**
     * Interface used to specify creation options for the node editor
     */
    export interface INodeEditorOptions {
        /**
         * Defines the DOM element that will host the node editor
         */
        hostElement: HTMLDivElement;
    }
    /**
     * Class used to create a node editor
     */
    export class NodeEditor {
        /**
         * Show the node editor
         * @param options defines the options to use to configure the node editor
         */
        static Show(options: INodeEditorOptions): void;
    }
}
declare module "babylonjs-nodeEditor/index" {
    export * from "babylonjs-nodeEditor/nodeEditor";
}
declare module "babylonjs-nodeEditor/legacy/legacy" {
    export * from "babylonjs-nodeEditor/index";
}
declare module "babylonjs-nodeEditor" {
    export * from "babylonjs-nodeEditor/legacy/legacy";
}
/// <reference types="react" />
declare module NODEEDITOR {
    export class GlobalState {
    }
}
declare module NODEEDITOR {
    interface IGraphEditorProps {
        globalState: GlobalState;
    }
    export class GraphEditor extends React.Component<IGraphEditorProps> {
        constructor(props: IGraphEditorProps);
        render(): JSX.Element;
    }
}
declare module NODEEDITOR {
    /**
     * Interface used to specify creation options for the node editor
     */
    export interface INodeEditorOptions {
        /**
         * Defines the DOM element that will host the node editor
         */
        hostElement: HTMLDivElement;
    }
    /**
     * Class used to create a node editor
     */
    export class NodeEditor {
        /**
         * Show the node editor
         * @param options defines the options to use to configure the node editor
         */
        static Show(options: INodeEditorOptions): void;
    }
}