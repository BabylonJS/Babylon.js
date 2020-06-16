import * as React from "react";
import { GlobalState } from '../globalState';

require("./footer.scss");
var babylonIdentity = require("../img/babylon-identity.svg");

interface IFooterProps {
    globalState: GlobalState;
}

export class Footer extends React.Component<IFooterProps> {
        
    public constructor(props: IFooterProps) {
        super(props);
    }

    render() {
        return (            
            <div id="footer" className="footer">
                <div className="footerLeft">
                    <img id="logoImg" src={babylonIdentity}/>
                </div>
            </div>
        )
    }
}