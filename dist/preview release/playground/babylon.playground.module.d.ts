/// <reference types="react" />
declare module "babylonjs-playground/globalState" {
    export class GlobalState {
    }
}
declare module "babylonjs-playground/components/monacoComponent" {
    import * as React from "react";
    interface IMonacoComponentProps {
        language: "JS" | "TS";
    }
    export class MonacoComponent extends React.Component<IMonacoComponentProps> {
        private _hostReference;
        private _editor;
        private _definitionWorker;
        private _deprecatedCandidates;
        constructor(props: IMonacoComponentProps);
        setupMonaco(): Promise<void>;
        setupMonacoColorProvider(): void;
        setupMonacoCompilationPipeline(libContent: string): void;
        setupDefinitionWorker(libContent: string): void;
        analyzeCode(): Promise<void>;
        isDeprecatedEntry(details: any): any;
        isDeprecatedTag(tag: any): boolean;
        componentDidMount(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-playground/playground" {
    import * as React from "react";
    interface IPlaygroundProps {
    }
    export class Playground extends React.Component<IPlaygroundProps, {
        errorMessage: string;
    }> {
        constructor(props: IPlaygroundProps);
        render(): JSX.Element;
        static Show(hostElement: HTMLElement): void;
    }
}
declare module "babylonjs-playground/index" {
    export * from "babylonjs-playground/playground";
}
declare module "babylonjs-playground/legacy/legacy" {
    export * from "babylonjs-playground/index";
}
declare module "babylonjs-playground" {
    export * from "babylonjs-playground/legacy/legacy";
}
/// <reference types="react" />
declare module PLAYGROUND {
    export class GlobalState {
    }
}
declare module PLAYGROUND {
    interface IMonacoComponentProps {
        language: "JS" | "TS";
    }
    export class MonacoComponent extends React.Component<IMonacoComponentProps> {
        private _hostReference;
        private _editor;
        private _definitionWorker;
        private _deprecatedCandidates;
        constructor(props: IMonacoComponentProps);
        setupMonaco(): Promise<void>;
        setupMonacoColorProvider(): void;
        setupMonacoCompilationPipeline(libContent: string): void;
        setupDefinitionWorker(libContent: string): void;
        analyzeCode(): Promise<void>;
        isDeprecatedEntry(details: any): any;
        isDeprecatedTag(tag: any): boolean;
        componentDidMount(): void;
        render(): JSX.Element;
    }
}
declare module PLAYGROUND {
    interface IPlaygroundProps {
    }
    export class Playground extends React.Component<IPlaygroundProps, {
        errorMessage: string;
    }> {
        constructor(props: IPlaygroundProps);
        render(): JSX.Element;
        static Show(hostElement: HTMLElement): void;
    }
}