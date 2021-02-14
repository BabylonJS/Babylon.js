import * as React from "react";
import { ButtonLineComponent } from "../../../../../../sharedUiComponents/lines/buttonLineComponent";
import { GlobalState } from "../../../../../globalState";
import { PopupComponent } from "../../../../../popupComponent";
import { AnimationCurveEditorBottomBarComponent } from "./animationCurveEditorBottomBarComponent";
import { AnimationCurveEditorContext } from "./animationCurveEditorContext";
import { AnimationCurveEditorTopBarComponent } from "./animationCurveEditorTopBarComponent";
import { AnimationCurveEditorCanvasComponent } from "./graph/animationCurveEditorCanvasComponent";
import { AnimationCurveEditorSideBarComponent } from "./sideBar/animationCurveEditorSideBarComponent";

require("./scss/curveEditor.scss");

interface IAnimationCurveEditorComponentProps {
    globalState: GlobalState;
    context: AnimationCurveEditorContext;
}

interface IAnimationCurveEditorComponentState {
    isOpen: boolean;
}

export class AnimationCurveEditorComponent extends React.Component<
    IAnimationCurveEditorComponentProps,
    IAnimationCurveEditorComponentState
> {

    constructor(props: IAnimationCurveEditorComponentProps) {
        super(props);

        this.state = { isOpen: false };
    }

    onCloseAnimationCurveEditor(window: Window | null) {
        if (window !== null) {
            window.close();
        }
        this.setState({isOpen: false});
        this.props.context.activeAnimation = null;
        this.props.context.onActiveAnimationChanged.notifyObservers();
    }

    shouldComponentUpdate(newProps: IAnimationCurveEditorComponentProps, newState: IAnimationCurveEditorComponentState) {
        return newState.isOpen !== this.state.isOpen;
    }

    public render() {
        return (
            <>
                <ButtonLineComponent label="Edit" onClick={() => this.setState({isOpen: true})} />
                {
                    this.state.isOpen &&
                    <PopupComponent
                        id="curve-editor"
                        title="Animation Curve Editor"
                        size={{ width: 1024, height: 512 }}
                        onResize={() => this.props.context.onHostWindowResized.notifyObservers()}
                        onClose={(window: Window) => this.onCloseAnimationCurveEditor(window)}
                    >
                        <div id="curve-editor">
                            <AnimationCurveEditorTopBarComponent globalState={this.props.globalState} context={this.props.context}/>
                            <AnimationCurveEditorSideBarComponent globalState={this.props.globalState} context={this.props.context}/>
                            <AnimationCurveEditorCanvasComponent globalState={this.props.globalState} context={this.props.context}/>
                            <AnimationCurveEditorBottomBarComponent globalState={this.props.globalState} context={this.props.context}/>
                        </div>
                    </PopupComponent>
        }
            </>
        );
    }

}