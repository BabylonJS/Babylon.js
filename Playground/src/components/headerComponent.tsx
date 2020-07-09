import * as React from "react";
import { GlobalState } from '../globalState';

import LogoImage from "../imgs/logo.svg";
import { Engine } from 'babylonjs/Engines/engine';
import { CommandBarComponent } from './commandBarComponent';

require("../scss/header.scss");

interface IHeaderComponentProps {
    globalState: GlobalState;
}

export class HeaderComponent extends React.Component<IHeaderComponentProps> {    
    private _refVersionNumber: React.RefObject<HTMLSpanElement>;
    
    public constructor(props: IHeaderComponentProps) {
        super(props);

        this._refVersionNumber = React.createRef();
    }

    componentDidMount() {
        this._refVersionNumber.current!.innerHTML = Engine.Version;
    }
    
    public render() {
        return (
            <div id="header">   
                <div className="logo-area">
                    <LogoImage />
                    <div className="version">Playground&nbsp;<span className="version-number" ref={this._refVersionNumber}></span></div>
                </div>
                <div className="command-bar">
                    {
                        this.props.globalState.language === "JS" &&
                        <>                        
                            <div className="language-button active background-ts">TS</div>
                            <div className="language-button background-js">Javascript</div>
                        </>
                    }
                    {
                        this.props.globalState.language === "TS" &&
                        <>                        
                            <div className="language-button active background-js">JS</div>
                            <div className="language-button background-ts">TypeScript</div>
                        </>
                    }                    
                    <CommandBarComponent globalState={this.props.globalState} />
                </div>
            </div>   
        )
    }
}