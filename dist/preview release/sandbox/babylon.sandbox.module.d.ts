/// <reference types="react" />
declare module "babylonjs-sandbox/globalState" {
    import { Observable } from 'babylonjs/Misc/observable';
    import { Scene } from 'babylonjs/scene';
    import { FilesInput } from 'babylonjs/Misc/filesInput';
    export class GlobalState {
        currentScene: Scene;
        onSceneLoaded: Observable<{
            scene: Scene;
            filename: string;
        }>;
        onError: Observable<{
            scene?: Scene | undefined;
            message?: string | undefined;
        }>;
        onEnvironmentChanged: Observable<string>;
        onRequestClickInterceptor: Observable<void>;
        onClickInterceptorClicked: Observable<void>;
        filesInput: FilesInput;
        isDebugLayerEnabled: boolean;
        showDebugLayer(): void;
        hideDebugLayer(): void;
    }
}
declare module "babylonjs-sandbox/tools/localStorageHelper" {
    export class LocalStorageHelper {
        static ReadLocalStorageValue(key: string, defaultValue: number): number;
    }
}
declare module "babylonjs-sandbox/tools/environmentTools" {
    import { HDRCubeTexture } from 'babylonjs/Materials/Textures/hdrCubeTexture';
    import { CubeTexture } from 'babylonjs/Materials/Textures/cubeTexture';
    import { Scene } from 'babylonjs/scene';
    import { GlobalState } from "babylonjs-sandbox/globalState";
    export class EnvironmentTools {
        static SkyboxPath: string;
        static Skyboxes: string[];
        static SkyboxesNames: string[];
        static LoadSkyboxPathTexture(scene: Scene): HDRCubeTexture | CubeTexture;
        static HookWithEnvironmentChange(globalState: GlobalState): void;
    }
}
declare module "babylonjs-sandbox/components/renderingZone" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-sandbox/globalState";
    import { Vector3 } from 'babylonjs/Maths/math.vector';
    interface IRenderingZoneProps {
        globalState: GlobalState;
        assetUrl?: string;
        cameraPosition?: Vector3;
        expanded: boolean;
    }
    export class RenderingZone extends React.Component<IRenderingZoneProps> {
        private _currentPluginName;
        private _engine;
        private _scene;
        private _canvas;
        constructor(props: IRenderingZoneProps);
        initEngine(): void;
        prepareCamera(): void;
        handleErrors(): void;
        prepareLighting(): void;
        onSceneLoaded(filename: string): void;
        loadAssetFromUrl(): void;
        loadAsset(): void;
        componentDidMount(): void;
        shouldComponentUpdate(nextProps: IRenderingZoneProps): boolean;
        render(): JSX.Element;
    }
}
declare module "babylonjs-sandbox/components/footerButton" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-sandbox/globalState";
    interface IFooterButtonProps {
        globalState: GlobalState;
        enabled: boolean;
        onClick: () => void;
        icon: any;
        label: string;
    }
    export class FooterButton extends React.Component<IFooterButtonProps> {
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-sandbox/components/dropUpButton" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-sandbox/globalState";
    interface IDropUpButtonProps {
        globalState: GlobalState;
        enabled: boolean;
        icon: any;
        label: string;
        options: string[];
        onOptionPicked: (option: string) => void;
    }
    export class DropUpButton extends React.Component<IDropUpButtonProps, {
        isOpen: boolean;
    }> {
        private _onClickInterceptorClickedObserver;
        constructor(props: IDropUpButtonProps);
        componentWillUnmount(): void;
        switchDropUp(): void;
        clickOption(option: string): void;
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-sandbox/components/footerFileButton" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-sandbox/globalState";
    interface IFooterFileButtonProps {
        globalState: GlobalState;
        enabled: boolean;
        icon: any;
        label: string;
        onFilesPicked: (evt: Event, files: FileList | null) => void;
    }
    export class FooterFileButton extends React.Component<IFooterFileButtonProps> {
        onFilePicked(evt: React.ChangeEvent<HTMLInputElement>): void;
        render(): JSX.Element | null;
    }
}
declare module "babylonjs-sandbox/components/footer" {
    import * as React from "react";
    import { GlobalState } from "babylonjs-sandbox/globalState";
    interface IFooterProps {
        globalState: GlobalState;
    }
    export class Footer extends React.Component<IFooterProps> {
        constructor(props: IFooterProps);
        showInspector(): void;
        render(): JSX.Element;
    }
}
declare module "babylonjs-sandbox/sandbox" {
    import * as React from "react";
    interface ISandboxProps {
    }
    export class Sandbox extends React.Component<ISandboxProps, {
        isFooterVisible: boolean;
        errorMessage: string;
    }> {
        private _globalState;
        private _assetUrl?;
        private _cameraPosition?;
        private _logoRef;
        private _dropTextRef;
        private _clickInterceptorRef;
        constructor(props: ISandboxProps);
        checkUrl(): void;
        componentDidUpdate(): void;
        render(): JSX.Element;
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
    export class GlobalState {
        currentScene: BABYLON.Scene;
        onSceneLoaded: BABYLON.Observable<{
            scene: BABYLON.Scene;
            filename: string;
        }>;
        onError: BABYLON.Observable<{
            scene?: BABYLON.Scene | undefined;
            message?: string | undefined;
        }>;
        onEnvironmentChanged: BABYLON.Observable<string>;
        onRequestClickInterceptor: BABYLON.Observable<void>;
        onClickInterceptorClicked: BABYLON.Observable<void>;
        filesInput: BABYLON.FilesInput;
        isDebugLayerEnabled: boolean;
        showDebugLayer(): void;
        hideDebugLayer(): void;
    }
}
declare module SANDBOX {
    export class LocalStorageHelper {
        static ReadLocalStorageValue(key: string, defaultValue: number): number;
    }
}
declare module SANDBOX {
    export class EnvironmentTools {
        static SkyboxPath: string;
        static Skyboxes: string[];
        static SkyboxesNames: string[];
        static LoadSkyboxPathTexture(scene: BABYLON.Scene): BABYLON.HDRCubeTexture | BABYLON.CubeTexture;
        static HookWithEnvironmentChange(globalState: GlobalState): void;
    }
}
declare module SANDBOX {
    interface IRenderingZoneProps {
        globalState: GlobalState;
        assetUrl?: string;
        cameraPosition?: BABYLON.Vector3;
        expanded: boolean;
    }
    export class RenderingZone extends React.Component<IRenderingZoneProps> {
        private _currentPluginName;
        private _engine;
        private _scene;
        private _canvas;
        constructor(props: IRenderingZoneProps);
        initEngine(): void;
        prepareCamera(): void;
        handleErrors(): void;
        prepareLighting(): void;
        onSceneLoaded(filename: string): void;
        loadAssetFromUrl(): void;
        loadAsset(): void;
        componentDidMount(): void;
        shouldComponentUpdate(nextProps: IRenderingZoneProps): boolean;
        render(): JSX.Element;
    }
}
declare module SANDBOX {
    interface IFooterButtonProps {
        globalState: GlobalState;
        enabled: boolean;
        onClick: () => void;
        icon: any;
        label: string;
    }
    export class FooterButton extends React.Component<IFooterButtonProps> {
        render(): JSX.Element | null;
    }
}
declare module SANDBOX {
    interface IDropUpButtonProps {
        globalState: GlobalState;
        enabled: boolean;
        icon: any;
        label: string;
        options: string[];
        onOptionPicked: (option: string) => void;
    }
    export class DropUpButton extends React.Component<IDropUpButtonProps, {
        isOpen: boolean;
    }> {
        private _onClickInterceptorClickedObserver;
        constructor(props: IDropUpButtonProps);
        componentWillUnmount(): void;
        switchDropUp(): void;
        clickOption(option: string): void;
        render(): JSX.Element | null;
    }
}
declare module SANDBOX {
    interface IFooterFileButtonProps {
        globalState: GlobalState;
        enabled: boolean;
        icon: any;
        label: string;
        onFilesPicked: (evt: Event, files: FileList | null) => void;
    }
    export class FooterFileButton extends React.Component<IFooterFileButtonProps> {
        onFilePicked(evt: React.ChangeEvent<HTMLInputElement>): void;
        render(): JSX.Element | null;
    }
}
declare module SANDBOX {
    interface IFooterProps {
        globalState: GlobalState;
    }
    export class Footer extends React.Component<IFooterProps> {
        constructor(props: IFooterProps);
        showInspector(): void;
        render(): JSX.Element;
    }
}
declare module SANDBOX {
    interface ISandboxProps {
    }
    export class Sandbox extends React.Component<ISandboxProps, {
        isFooterVisible: boolean;
        errorMessage: string;
    }> {
        private _globalState;
        private _assetUrl?;
        private _cameraPosition?;
        private _logoRef;
        private _dropTextRef;
        private _clickInterceptorRef;
        constructor(props: ISandboxProps);
        checkUrl(): void;
        componentDidUpdate(): void;
        render(): JSX.Element;
        static Show(hostElement: HTMLElement): void;
    }
}