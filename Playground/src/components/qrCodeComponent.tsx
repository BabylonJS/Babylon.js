import * as React from "react";
import { GlobalState } from '../globalState';

require("../scss/qrCode.scss");

declare var $: any;

interface IQRCodeComponentProps {
    globalState: GlobalState;
}

export class QRCodeComponent extends React.Component<IQRCodeComponentProps, {isVisible: boolean}> {    
  
    public constructor(props: IQRCodeComponentProps) {
        super(props);
        this.state = {isVisible: false};

        this.props.globalState.onQRCodeRequiredObservable.add(value => {
            this.setState({isVisible: value});
        })
    }    

    componentDidUpdate() {
        this._syncQRCOde();
    }

    private _syncQRCOde() {
        if (!this.state.isVisible) {
            return;
        }

        document.getElementById("qr-code-image")!.innerHTML = "";
        $("#qr-code-image").qrcode({ text: "https://playground.babylonjs.com/frame.html" + location.hash });

    }

    public render() {
        if (!this.state.isVisible) {
            return null;
        }
        return (
            <div className="qr-code" onClick={() => this.setState({isVisible: false})}>
                <div id="qr-code-image">
                </div>
            </div>
        )
    }
}