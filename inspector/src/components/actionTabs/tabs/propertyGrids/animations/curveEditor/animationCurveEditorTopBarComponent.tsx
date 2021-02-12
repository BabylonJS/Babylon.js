import * as React from "react";
import { GlobalState } from "../../../../../globalState";
import { AnimationCurveEditorContext } from "./animationCurveEditorContext";

const logoIcon = require("./assets/babylonLogo.svg");

interface IAnimationCurveEditorTopBarComponentProps {
    globalState: GlobalState;
    context: AnimationCurveEditorContext;
}

interface IAnimationCurveEditorTopBarComponentState {
}

export class AnimationCurveEditorTopBarComponent extends React.Component<
IAnimationCurveEditorTopBarComponentProps,
IAnimationCurveEditorTopBarComponentState
> {

    constructor(props: IAnimationCurveEditorTopBarComponentProps) {
        super(props);

        this.state = { };
    }

    public render() {
        return (
            <div id="top-bar">
                <logoIcon
            </div>
        );
    }
}