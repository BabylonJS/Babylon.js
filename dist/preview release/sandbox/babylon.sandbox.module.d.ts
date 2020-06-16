/// <reference types="react" />
declare module "babylonjs-sandbox/sandbox" {
    import * as React from "react";
    interface ISandboxProps {
    }
    export class Sandbox extends React.Component<ISandboxProps> {
        render(): null;
        static Show(hostElement: HTMLElement): void;
    }
}
declare module "babylonjs-sandbox/index" {
    export * from "babylonjs-sandbox/sandbox";
}
declare module "babylonjs-sandbox/legacy/legacy" {
    export * from "babylonjs-sandbox/index";
}
declare module "babylonjs-sandbox" {
    export * from "babylonjs-sandbox/legacy/legacy";
}
/// <reference types="react" />
declare module SANDBOX {
    interface ISandboxProps {
    }
    export class Sandbox extends React.Component<ISandboxProps> {
        render(): null;
        static Show(hostElement: HTMLElement): void;
    }
}