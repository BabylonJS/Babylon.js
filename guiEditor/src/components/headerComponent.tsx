import * as React from "react";
import { GlobalState } from '../globalState';

//import LogoImage from "../imgs/logo.svg";
import { CommandBarComponent } from './commandBarComponent';

require("../scss/header.scss");

interface IHeaderComponentProps {
    globalState: GlobalState;
}

export class HeaderComponent extends React.Component<IHeaderComponentProps> {    

    
    public constructor(props: IHeaderComponentProps) {
        super(props);

    }

    public render() {
        return (
            <div id="pg-header">   
                <div className="command-bar">                   
                    <CommandBarComponent globalState={this.props.globalState} />
                </div>
            </div>   
        )
    }
}