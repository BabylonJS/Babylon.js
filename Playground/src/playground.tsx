import * as React from "react";
import * as ReactDOM from "react-dom";
import { MonacoComponent } from './components/monacoComponent';
import { RenderingComponent } from './components/rendererComponent';
//import { GlobalState } from './globalState';

require("./scss/main.scss");
const Split = require('split.js').default;

interface IPlaygroundProps {
}

export class Playground extends React.Component<IPlaygroundProps, {errorMessage: string}> {    
    private splitRef: React.RefObject<HTMLDivElement>;
    private monacoRef: React.RefObject<HTMLDivElement>;
    private renderingRef: React.RefObject<HTMLDivElement>;

    //private _globalState: GlobalState;
    
    public constructor(props: IPlaygroundProps) {
        super(props);
       // this._globalState = new GlobalState();

       this.splitRef = React.createRef();
       this.monacoRef = React.createRef();
       this.renderingRef = React.createRef();

       this.state = {errorMessage: ""};
    }

    componentDidMount() {
        Split([this.monacoRef.current, this.renderingRef.current], {
            direction: "horizontal",
            minSize: [200, 200],
            gutterSize: 4
        });
    }

    public render() {

        return (
            <div id="root">  
                <div ref={this.splitRef} id="split">
                    <MonacoComponent language="JS" className="split-part" refObject={this.monacoRef}/>    
                    <div ref={this.renderingRef} className="split-part">
                        <RenderingComponent />
                    </div>
                </div>
            </div>   
        )
    }

    public static Show(hostElement: HTMLElement) {
        const playground = React.createElement(Playground, {});
        
        ReactDOM.render(playground, hostElement);
    }
}