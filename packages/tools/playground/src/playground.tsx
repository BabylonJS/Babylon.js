import * as React from "react";
import { createRoot } from "react-dom/client";
import { MonacoComponent } from "./components/monacoComponent";
import { RenderingComponent } from "./components/rendererComponent";
import { GlobalState, EditionMode, RuntimeMode } from "./globalState";
import { FooterComponent } from "./components/footerComponent";
import { HeaderComponent } from "./components/headerComponent";
import { SaveManager } from "./tools/saveManager";
import { LoadManager } from "./tools/loadManager";
import { WaitRingComponent } from "./components/waitRingComponent";
import { MetadataComponent } from "./components/metadataComponent";
import { HamburgerMenuComponent } from "./components/hamburgerMenu";
import { Utilities } from "./tools/utilities";
import { ShortcutManager } from "./tools/shortcutManager";
import { ErrorDisplayComponent } from "./components/errorDisplayComponent";
import { ExamplesComponent } from "./components/examplesComponent";
import { QRCodeComponent } from "./components/qrCodeComponent";
import { SplitContainer } from "shared-ui-components/split/splitContainer";
import { Splitter } from "shared-ui-components/split/splitter";

import "./scss/main.scss";
import { ControlledSize, SplitDirection } from "shared-ui-components/split/splitContext";

interface IPlaygroundProps {
    runtimeMode: RuntimeMode;
    version: string;
}

export class Playground extends React.Component<IPlaygroundProps, { errorMessage: string; mode: EditionMode }> {
    private _monacoRef: React.RefObject<HTMLDivElement>;
    private _renderingRef: React.RefObject<HTMLDivElement>;
    private _splitterRef: React.RefObject<HTMLDivElement>;
    private _splitContainerRef: React.RefObject<HTMLDivElement>;

    private _globalState: GlobalState;

    public saveManager: SaveManager;
    public loadManager: LoadManager;
    public shortcutManager: ShortcutManager;

    public constructor(props: IPlaygroundProps) {
        super(props);
        this._globalState = new GlobalState();

        this._globalState.runtimeMode = props.runtimeMode || RuntimeMode.Editor;
        this._globalState.version = props.version;

        this._monacoRef = React.createRef();
        this._renderingRef = React.createRef();
        this._splitterRef = React.createRef();
        this._splitContainerRef = React.createRef();

        const defaultDesktop = Utilities.ReadBoolFromStore("editor", true) ? EditionMode.Desktop : EditionMode.RenderingOnly;

        this.state = { errorMessage: "", mode: window.innerWidth < this._globalState.MobileSizeTrigger ? this._globalState.mobileDefaultMode : defaultDesktop };

        window.addEventListener("resize", () => {
            const defaultDesktop = Utilities.ReadBoolFromStore("editor", true) ? EditionMode.Desktop : EditionMode.RenderingOnly;
            this.setState({ mode: window.innerWidth < this._globalState.MobileSizeTrigger ? this._globalState.mobileDefaultMode : defaultDesktop });
        });

        this._globalState.onMobileDefaultModeChangedObservable.add(() => {
            this.setState({ mode: this._globalState.mobileDefaultMode });
        });

        this._globalState.onEditorDisplayChangedObservable.add((value) => {
            this.setState({ mode: value ? EditionMode.Desktop : EditionMode.RenderingOnly });
        });

        this._globalState.doNotRun = location.search.indexOf("norun") !== -1 || !Utilities.ReadBoolFromStore("auto-run", true);

        // Managers
        this.saveManager = new SaveManager(this._globalState);
        this.loadManager = new LoadManager(this._globalState);
        this.shortcutManager = new ShortcutManager(this._globalState);
    }

    override componentDidMount() {
        this.checkSize();
    }

    override componentDidUpdate() {
        this.checkSize();
    }

    checkSize() {
        if (this._globalState.runtimeMode !== RuntimeMode.Editor) {
            return;
        }

        switch (this.state.mode) {
            case EditionMode.CodeOnly:
                this._splitContainerRef.current!.classList.add("disable-split-code");
                this._splitContainerRef.current!.classList.remove("disable-split-rendering");
                this._renderingRef.current!.classList.add("hidden");
                this._splitterRef.current!.classList.add("hidden");
                this._monacoRef.current!.classList.remove("hidden");
                this._monacoRef.current!.style.width = "100%";
                break;
            case EditionMode.RenderingOnly:
                this._splitContainerRef.current!.classList.add("disable-split-rendering");
                this._splitContainerRef.current!.classList.remove("disable-split-code");
                this._monacoRef.current!.classList.add("hidden");
                this._splitterRef.current!.classList.add("hidden");
                this._renderingRef.current!.classList.remove("hidden");
                this._renderingRef.current!.style.width = "100%";
                break;
            case EditionMode.Desktop:
                this._splitContainerRef.current!.classList.remove("disable-split-code");
                this._splitContainerRef.current!.classList.remove("disable-split-rendering");
                this._renderingRef.current!.classList.remove("hidden");
                this._splitterRef.current!.classList.remove("hidden");
                this._monacoRef.current!.classList.remove("hidden");
                break;
        }
    }

    public override render() {
        if (this._globalState.runtimeMode === RuntimeMode.Full) {
            return (
                <>
                    <MonacoComponent globalState={this._globalState} className="hidden" refObject={this._monacoRef} />
                    <div className="canvasZone" id="pg-root-full">
                        <RenderingComponent globalState={this._globalState} />
                        <ErrorDisplayComponent globalState={this._globalState} />
                        <WaitRingComponent globalState={this._globalState} />
                    </div>
                </>
            );
        }

        if (this._globalState.runtimeMode === RuntimeMode.Frame) {
            return (
                <>
                    <MonacoComponent globalState={this._globalState} className="hidden" refObject={this._monacoRef} />
                    <div className="canvasZone" id="pg-root-frame">
                        <RenderingComponent globalState={this._globalState} />
                        <FooterComponent globalState={this._globalState} />
                        <ErrorDisplayComponent globalState={this._globalState} />
                        <WaitRingComponent globalState={this._globalState} />
                    </div>
                </>
            );
        }

        return (
            <div id="pg-root">
                <HeaderComponent globalState={this._globalState} />
                <SplitContainer id="pg-split" direction={SplitDirection.Horizontal} containerRef={this._splitContainerRef}>
                    <MonacoComponent globalState={this._globalState} refObject={this._monacoRef} />
                    <Splitter size={6} minSize={300} controlledSide={ControlledSize.First} refObject={this._splitterRef} />
                    <div ref={this._renderingRef} id="canvasZone" className="canvasZone">
                        <RenderingComponent globalState={this._globalState} />
                    </div>
                </SplitContainer>
                {window.innerWidth < 1140 && <HamburgerMenuComponent globalState={this._globalState} />}
                <ExamplesComponent globalState={this._globalState} />
                <FooterComponent globalState={this._globalState} />
                <QRCodeComponent globalState={this._globalState} />
                <ErrorDisplayComponent globalState={this._globalState} />
                <WaitRingComponent globalState={this._globalState} />
                <MetadataComponent globalState={this._globalState} />
            </div>
        );
    }

    public static Show(hostElement: HTMLElement, mode: RuntimeMode, version: string) {
        const playground = React.createElement(Playground, { runtimeMode: mode, version });

        const root = createRoot(hostElement);
        root.render(playground);
    }
}
