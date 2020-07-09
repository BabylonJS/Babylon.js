import * as React from "react";
import * as ReactDOM from "react-dom";
import { MonacoComponent } from './components/monacoComponent';
import { RenderingComponent } from './components/rendererComponent';
import { GlobalState, EditionMode } from './globalState';
import { FooterComponent } from './components/footerComponent.';

require("./scss/main.scss");
const Split = require('split.js').default;

interface IPlaygroundProps {
}

export class Playground extends React.Component<IPlaygroundProps, {errorMessage: string, mode: EditionMode}> {    
    private splitRef: React.RefObject<HTMLDivElement>;
    private monacoRef: React.RefObject<HTMLDivElement>;
    private renderingRef: React.RefObject<HTMLDivElement>;

    private _globalState: GlobalState;
    private _splitInstance: any;
    
    public constructor(props: IPlaygroundProps) {
       super(props);
       this._globalState = new GlobalState();

       this.splitRef = React.createRef();
       this.monacoRef = React.createRef();
       this.renderingRef = React.createRef();

       this.state = {errorMessage: "", mode: window.innerWidth < this._globalState.MobileSizeTrigger ? this._globalState.mobileDefaultMode : EditionMode.Desktop};

       window.addEventListener("resize", () => {
           this.setState({mode: window.innerWidth < this._globalState.MobileSizeTrigger ? this._globalState.mobileDefaultMode : EditionMode.Desktop});
       });

       this._globalState.onMobileDefaultModeChangedObservable.add(() => {
           this.setState({mode: this._globalState.mobileDefaultMode});
       })
    }

    componentDidMount() {
        this.checkSize();
    }

    componentDidUpdate() {
        this.checkSize();
    }

    checkSize() {
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

        return (
            <div id="root">  
                <div ref={this.splitRef} id="split">
                    <MonacoComponent globalState={this._globalState} className="split-part" refObject={this.monacoRef}/>    
                    <div ref={this.renderingRef} className="split-part">
                        <RenderingComponent globalState={this._globalState}/>
                    </div>
                </div>
                <FooterComponent globalState={this._globalState}/>
            </div>   
        )
    }

    public static Show(hostElement: HTMLElement) {
        const playground = React.createElement(Playground, {});
        
        ReactDOM.render(playground, hostElement);
    }
}