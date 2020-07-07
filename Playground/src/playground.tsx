import * as React from "react";
import * as ReactDOM from "react-dom";
import { MonacoComponent } from './components/monacoComponent';
//import { GlobalState } from './globalState';

require("./scss/main.scss");

interface IPlaygroundProps {
}

export class Playground extends React.Component<IPlaygroundProps, {errorMessage: string}> {
    //private _globalState: GlobalState;
    
    public constructor(props: IPlaygroundProps) {
        super(props);
       // this._globalState = new GlobalState();

       this.state = {errorMessage: ""};
    }

    public render() {

        return (
            <div id="root">  
                <MonacoComponent language="JS"/>    
            </div>   
        )
    }

    public static Show(hostElement: HTMLElement) {
        const playground = React.createElement(Playground, {});
        
        ReactDOM.render(playground, hostElement);
    }
}