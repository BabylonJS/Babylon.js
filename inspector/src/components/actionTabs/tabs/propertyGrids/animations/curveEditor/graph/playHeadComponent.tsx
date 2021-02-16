import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";

interface IPlayHeadComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IPlayHeadComponentState {
}

export class PlayHeadComponent extends React.Component<
IPlayHeadComponentProps,
IPlayHeadComponentState
> {

    constructor(props: IPlayHeadComponentProps) {
        super(props);

        this.state = { };

        this.props.context.onActiveAnimationChanged.add(() => {
            this.forceUpdate();
        });        
    }

    public render() {
        if (this.props.context.activeAnimation === null) {
            return null;
        }

        return (
            <div id="play-head-area">
                <div id="play-head">
                    <div id="play-head-bar"></div>
                    <div id="play-head-circle">
                        {                           
                        }
                    </div>
                </div>
            </div>
        );
    }
}