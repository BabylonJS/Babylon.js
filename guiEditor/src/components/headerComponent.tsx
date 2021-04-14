import * as React from "react";
import { GlobalState } from '../globalState';

//import LogoImage from "../imgs/logo.svg";
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

    updateDescription() {
    }

    componentDidMount() {
        this.updateDescription();
    }
    
    public render() {
        return (
            <div id="pg-header">   
                <div className="logo-area">
                </div>
                <div className="command-bar">                   
                    <CommandBarComponent globalState={this.props.globalState} />
                </div>
            </div>   
        )
    }
}