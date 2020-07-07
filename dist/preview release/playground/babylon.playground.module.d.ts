/// <reference types="react" />
declare module "babylonjs-playground/globalState" {
    export class GlobalState {
    }
}
declare module "babylonjs-playground/playground" {
    import * as React from "react";
    interface IPlaygroundProps {
    }
    export class Playground extends React.Component<IPlaygroundProps, {
        isFooterVisible: boolean;
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
    interface IPlaygroundProps {
    }
    export class Playground extends React.Component<IPlaygroundProps, {
        isFooterVisible: boolean;
        errorMessage: string;
    }> {
        constructor(props: IPlaygroundProps);
        render(): JSX.Element;
        static Show(hostElement: HTMLElement): void;
    }
}