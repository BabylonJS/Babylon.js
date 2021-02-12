import * as React from "react";
import { ButtonLineComponent } from "../../../../../../sharedUiComponents/lines/buttonLineComponent";
import { GlobalState } from "../../../../../globalState";
import { PopupComponent } from "../../../../../popupComponent";
import { AnimationCurveEditorBottomBarComponent } from "./animationCurveEditorBottomBarComponent";
import { AnimationCurveEditorContext } from "./animationCurveEditorContext";
import { AnimationCurveEditorGraphComponent } from "./animationCurveEditorGraphComponent";
import { AnimationCurveEditorSidebarComponent } from "./animationCurveEditorSidebarComponent";
import { AnimationCurveEditorTopBarComponent } from "./animationCurveEditorTopBarComponent";

require("./curveEditor.scss");

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
    }

    public render() {
        return (
            <>
                <ButtonLineComponent label="Edit" onClick={() => this.setState({isOpen: true})} />
                {
                    this.state.isOpen &&
                    <PopupComponent
                        id="curve-editor"
                        title="Curve Animation Editor"
                        size={{ width: 1024, height: 512 }}
                        onOpen={(window: Window) => {}}
                        onClose={(window: Window) => this.onCloseAnimationCurveEditor(window)}
                    >
                        <div id="curve-editor">
                            <AnimationCurveEditorTopBarComponent globalState={this.props.globalState} context={this.props.context}/>
                            <AnimationCurveEditorSidebarComponent globalState={this.props.globalState} context={this.props.context}/>
                            <AnimationCurveEditorGraphComponent globalState={this.props.globalState} context={this.props.context}/>
                            <AnimationCurveEditorBottomBarComponent globalState={this.props.globalState} context={this.props.context}/>
                        </div>
                    </PopupComponent>
        }
            </>
        );
    }

}