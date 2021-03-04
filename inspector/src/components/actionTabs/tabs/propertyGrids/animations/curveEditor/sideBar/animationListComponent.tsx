import * as React from "react";
import { GlobalState } from "../../../../../../globalState";
import { Context } from "../context";
import { AnimationEntryComponent } from "./animationEntryComponent";

interface IAnimationListComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IAnimationListComponentState {
}

export class AnimationListComponent extends React.Component<
IAnimationListComponentProps,
IAnimationListComponentState
> {

    constructor(props: IAnimationListComponentProps) {
        super(props);

        this.state = { };
    }

    public render() {
        return (
            <div id="animation-list">
                {
                    this.props.context.animations?.map((a, i) => {
                        return (
                            <AnimationEntryComponent key={i} globalState={this.props.globalState} context={this.props.context} animation={a}/>
                        );
                    })
                }
            </div>
        );
    }
}