import * as React from "react";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import type { GlobalState } from "../../../../../globalState";
import { PopupComponent } from "../../../../../popupComponent";
import { BottomBarComponent } from "./bottomBar/bottomBarComponent";
import type { Context } from "./context";
import { TopBarComponent } from "./topBarComponent";
import { CanvasComponent } from "./graph/canvasComponent";
import { SideBarComponent } from "./sideBar/sideBarComponent";
import type { Animation } from "core/Animations/animation";
import type { TargetedAnimation } from "core/Animations/animationGroup";

import "./scss/curveEditor.scss";

interface IAnimationCurveEditorComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IAnimationCurveEditorComponentState {
    isOpen: boolean;
}

export class AnimationCurveEditorComponent extends React.Component<IAnimationCurveEditorComponentProps, IAnimationCurveEditorComponentState> {
    constructor(props: IAnimationCurveEditorComponentProps) {
        super(props);

        this.state = { isOpen: false };
    }

    onCloseAnimationCurveEditor(window: Window | null) {
        if (window !== null) {
            window.close();
        }
        this.setState({ isOpen: false });
        this.props.context.activeAnimations = [];
        this.props.context.onActiveAnimationChanged.notifyObservers({});
    }

    shouldComponentUpdate(newProps: IAnimationCurveEditorComponentProps, newState: IAnimationCurveEditorComponentState) {
        if (newState.isOpen !== this.state.isOpen) {
            if (newState.isOpen) {
                this.props.context.prepare();
                if (this.props.context.animations && this.props.context.animations.length) {
                    setTimeout(() => {
                        this.props.context.activeAnimations.push(
                            this.props.context.useTargetAnimations
                                ? (this.props.context.animations![0] as TargetedAnimation).animation
                                : (this.props.context.animations![0] as Animation)
                        );
                        this.props.context.onActiveAnimationChanged.notifyObservers({});
                    });
                }
            }

            return true;
        }

        return false;
    }
    private _onKeyDown(evt: KeyboardEvent) {
        switch (evt.key) {
            case "Delete":
                if (this.props.context.activeKeyPoints?.length && !this.props.context.focusedInput) {
                    this.props.context.onDeleteKeyActiveKeyPoints.notifyObservers();
                }
                break;
            case " ":
                if (this.props.context.isPlaying) {
                    this.props.context.stop();
                } else {
                    this.props.context.play(true);
                }
                break;
            case "a":
                if (evt.ctrlKey) {
                    this.props.context.onSelectAllKeys.notifyObservers();
                    this.props.context.onActiveKeyPointChanged.notifyObservers();
                    evt.preventDefault();
                }
                break;
            case "ArrowLeft":
                if (!this.props.context.focusedInput) {
                    this.props.context.onMoveToFrameRequired.notifyObservers(Math.max(0, this.props.context.activeFrame - 1));
                }
                break;
            case "ArrowRight":
                if (!this.props.context.focusedInput) {
                    this.props.context.onMoveToFrameRequired.notifyObservers(Math.min(this.props.context.clipLength, this.props.context.activeFrame + 1));
                }
                break;
            case "ArrowDown": {
                const prevKey = this.props.context.getPrevKey();
                if (prevKey !== null) {
                    this.props.context.onMoveToFrameRequired.notifyObservers(prevKey);
                }
                break;
            }
            case "ArrowUp": {
                const nextKey = this.props.context.getNextKey();
                if (nextKey !== null) {
                    this.props.context.onMoveToFrameRequired.notifyObservers(nextKey);
                }
            }
        }
    }

    public render() {
        return (
            <>
                <ButtonLineComponent
                    label="Edit"
                    onClick={() => {
                        this.setState({ isOpen: true });
                    }}
                />
                {this.state.isOpen && (
                    <PopupComponent
                        id="curve-editor"
                        title="Animation Curve Editor"
                        size={{ width: 1024, height: 512 }}
                        onResize={() => this.props.context.onHostWindowResized.notifyObservers()}
                        onClose={(window: Window) => this.onCloseAnimationCurveEditor(window)}
                        onKeyDown={(evt) => this._onKeyDown(evt)}
                    >
                        <div id="curve-editor">
                            <TopBarComponent globalState={this.props.globalState} context={this.props.context} />
                            <SideBarComponent globalState={this.props.globalState} context={this.props.context} />
                            <CanvasComponent globalState={this.props.globalState} context={this.props.context} />
                            <BottomBarComponent globalState={this.props.globalState} context={this.props.context} />
                        </div>
                    </PopupComponent>
                )}
            </>
        );
    }
}
