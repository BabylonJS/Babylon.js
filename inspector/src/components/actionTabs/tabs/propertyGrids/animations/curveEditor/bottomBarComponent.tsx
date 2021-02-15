import * as React from "react";
import { GlobalState } from "../../../../../globalState";
import { Context } from "./context";

interface IBottomBarComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IBottomBarComponentState {
}

export class BottomBarComponent extends React.Component<
IBottomBarComponentProps,
IBottomBarComponentState
> {

    constructor(props: IBottomBarComponentProps) {
        super(props);

        this.state = { };
    }

    public render() {
        return (
            <div id="bottom-bar">
            </div>
        );
    }
}