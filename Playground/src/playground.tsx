import * as React from "react";
import * as ReactDOM from "react-dom";
import { MonacoComponent } from './components/monacoComponent';
import { RenderingComponent } from './components/rendererComponent';
import { GlobalState, EditionMode, RuntimeMode } from './globalState';
import { FooterComponent } from './components/footerComponent';
import { HeaderComponent } from './components/headerComponent';
import { SaveManager } from './tools/saveManager';
import { LoadManager } from './tools/loadManager';
import { WaitRingComponent } from './components/waitRingComponent';
import { MetadataComponent } from './components/metadataComponent';
import { HamburgerMenuComponent } from './components/hamburgerMenu';
import { Utilities } from './tools/utilities';
import { ShortcutManager } from './tools/shortcutManager';
import { ErrorDisplayComponent } from './components/errorDisplayComponent';
import { ExamplesComponent } from './components/examplesComponent';
import { QRCodeComponent } from './components/qrCodeComponent';

require("./scss/main.scss");
const Split = require('split.js').default;

interface IPlaygroundProps {
    runtimeMode: RuntimeMode
}

export class Playground extends React.Component<IPlaygroundProps, {errorMessage: string, mode: EditionMode}> {
    private splitRef: React.RefObject<HTMLDivElement>;
    private monacoRef: React.RefObject<HTMLDivElement>;
    private renderingRef: React.RefObject<HTMLDivElement>;

    private _globalState: GlobalState;
    private _splitInstance: any;

    public saveManager: SaveManager;
    public loadManager: LoadManager;
    public shortcutManager: ShortcutManager;

    public constructor(props: IPlaygroundProps) {
       super(props);
       this._globalState = new GlobalState();

       this._globalState.runtimeMode = props.runtimeMode || RuntimeMode.Editor;

       this.splitRef = React.createRef();
       this.monacoRef = React.createRef();
       this.renderingRef = React.createRef();

       let defaultDesktop = Utilities.ReadBoolFromStore("editor", true) ? EditionMode.Desktop : EditionMode.RenderingOnly;

       this.state = {errorMessage: "", mode: window.innerWidth < this._globalState.MobileSizeTrigger ? this._globalState.mobileDefaultMode : defaultDesktop};

       window.addEventListener("resize", () => {
            let defaultDesktop = Utilities.ReadBoolFromStore("editor", true) ? EditionMode.Desktop : EditionMode.RenderingOnly;
            this.setState({mode: window.innerWidth < this._globalState.MobileSizeTrigger ? this._globalState.mobileDefaultMode : defaultDesktop});
       });

       this._globalState.onMobileDefaultModeChangedObservable.add(() => {
           this.setState({mode: this._globalState.mobileDefaultMode});
       });

       this._globalState.onEditorDisplayChangedObservable.add(value => {
        this.setState({mode: value ? EditionMode.Desktop : EditionMode.RenderingOnly});
       });

       // Managers
       this.saveManager = new SaveManager(this._globalState);
       this.loadManager = new LoadManager(this._globalState);
       this.shortcutManager = new ShortcutManager(this._globalState);
    }

    componentDidMount() {
        this.checkSize();
    }

    componentDidUpdate() {
        this.checkSize();
    }

    checkSize() {
        if (this._globalState.runtimeMode !== RuntimeMode.Editor) {
            return;
        }

        switch(this.state.mode) {
            case EditionMode.CodeOnly:
                this._splitInstance?.destroy();
                this._splitInstance = null;
                this.renderingRef.current!.classList.add("hidden");
                this.monacoRef.current!.classList.remove("hidden");
                this.monacoRef.current!.style.width = "100%";
                break;
            case EditionMode.RenderingOnly:
                this._splitInstance?.destroy();
                this._splitInstance = null;
                this.monacoRef.current!.classList.add("hidden");
                this.renderingRef.current!.classList.remove("hidden");
                this.renderingRef.current!.style.width = "100%";
                break;
            case EditionMode.Desktop:
                if (this._splitInstance) {
                    return;
                }
                this.renderingRef.current!.classList.remove("hidden");
                this.monacoRef.current!.classList.remove("hidden");
                this._splitInstance = Split([this.monacoRef.current, this.renderingRef.current], {
                    direction: "horizontal",
                    minSize: [200, 200],
                    gutterSize: 4
                });
                break;
        }
    }

    public render() {
        if (this._globalState.runtimeMode === RuntimeMode.Full) {
            return (
                <div id="pg-root-full">
                    <RenderingComponent globalState={this._globalState}/>
                    <ErrorDisplayComponent globalState={this._globalState}/>
                    <WaitRingComponent globalState={this._globalState}/>
                </div>
            )
        }

        if (this._globalState.runtimeMode === RuntimeMode.Frame) {
            return (
                <div id="pg-root-frame">
                    <RenderingComponent globalState={this._globalState}/>
                    <FooterComponent globalState={this._globalState}/>
                    <ErrorDisplayComponent globalState={this._globalState}/>
                    <WaitRingComponent globalState={this._globalState}/>
                </div>
            );
        }

        return (
            <div id="pg-root">
                <HeaderComponent globalState={this._globalState}/>
                <div ref={this.splitRef} id="pg-split">
                    <MonacoComponent globalState={this._globalState} className="pg-split-part" refObject={this.monacoRef}/>
                    <div ref={this.renderingRef} className="pg-split-part">
                        <RenderingComponent globalState={this._globalState}/>
                    </div>
                </div>
                {
                    window.innerWidth < 1024 &&
                    <HamburgerMenuComponent globalState={this._globalState}/>
                }
                <ExamplesComponent globalState={this._globalState}/>
                <FooterComponent globalState={this._globalState}/>
                <QRCodeComponent globalState={this._globalState}/>
                <ErrorDisplayComponent globalState={this._globalState}/>
                <WaitRingComponent globalState={this._globalState}/>
                <MetadataComponent globalState={this._globalState}/>
            </div>
        );
    }

    public static Show(hostElement: HTMLElement, mode: RuntimeMode) {
        const playground = React.createElement(Playground, {runtimeMode: mode});

        ReactDOM.render(playground, hostElement);
    }
}