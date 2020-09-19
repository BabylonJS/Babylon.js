import * as React from "react";
import { GlobalState } from '../globalState';

import CoreLogo from "../imgs/coreLogo.svg";
import Spinner from "../imgs/spinner.svg";

require("../scss/waitRing.scss");

interface IWaitRingProps {
    globalState: GlobalState;
}

export class WaitRingComponent extends React.Component<IWaitRingProps, {isVisible: boolean}> {
    public constructor(props: IWaitRingProps) {
        super(props);
        this.state = {isVisible: true};

        this.props.globalState.onDisplayWaitRingObservable.add(value => {
            this.setState({isVisible: value});
        })
    }

    public render() {
        if (!this.state.isVisible) {
            return null;
        }

        return (
            <div id="wait-ring">
                <div id="logo-part">
                    <div id="waitLogo">
                        <CoreLogo />
                    </div>
                    <div id="waitSpinner">
                        <Spinner />
                    </div>
                </div>
            </div>
        )
    }
}