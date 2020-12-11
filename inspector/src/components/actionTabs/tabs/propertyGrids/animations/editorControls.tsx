import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../../components/propertyChangedEvent";
import { Animation } from "babylonjs/Animations/animation";
import { IconButtonLineComponent } from "../../../../../sharedUiComponents/lines/iconButtonLineComponent";
import { NumericInputComponent } from "../../../../../sharedUiComponents/lines/numericInputComponent";
import { AddAnimation } from "./addAnimation";
import { AnimationListTree, SelectedCoordinate } from "./animationListTree";
import { IAnimatable } from "babylonjs/Animations/animatable.interface";
import { TargetedAnimation } from "babylonjs/Animations/animationGroup";
import { LoadSnippet } from "./loadsnippet";
import { SaveSnippet } from "./saveSnippet";
import { LockObject } from "../lockObject";
import { GlobalState } from "../../../../globalState";

interface IEditorControlsProps {
    // if the entity has a targeted animation
    isTargetedAnimation: boolean;
    // Entity if it is animatable or targeted animation type
    entity: IAnimatable | TargetedAnimation;
    // The current selected animation
    selected: Animation | null;
    // The global lock object
    lockObject: LockObject;
    // The observable
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    // Event to send the message to the notification bar
    setNotificationMessage: (message: string) => void;
    // Event to send the selected animation and the coordinate (x, y, z) axis to render a curve
    selectAnimation: (selected: Animation, axis?: SelectedCoordinate) => void;
    // Event to set the frames per second of the animation
    setFps: (fps: number) => void;
    // Event to set if the animation loops
    setIsLooping: () => void;
    // The global state
    globalState: GlobalState;
    // The snippet server address
    snippetServer: string;
    // Event to deselect an animation
    deselectAnimation: () => void;
    // The frames per second
    fps: number;
}

interface IEditorControlsState {
    // If the add animation tab is currently visible in the editor
    isAnimationTabOpen: boolean;
    // If the edit animation tab is currently visible in the editor
    isEditTabOpen: boolean;
    // If the load animations tab is currently visible in the editor
    isLoadTabOpen: boolean;
    // If the save animations tab is currently visible in the editor
    isSaveTabOpen: boolean;
    // If the loop toggle is active or not.
    isLoopActive: boolean;
    // How many animations we have in the tree
    animationsCount: number;
    // Frames per second of the selected animation
    framesPerSecond: number;
    // The snippet ID the user needs to input to save/load (needs to switch tab)
    snippetId: string;
    // The currently selected animation
    selected: Animation | undefined;
}

/**
 * Renders the Curve Editor controls to create, save, remove, load and edit animations
 */
export class EditorControls extends React.Component<IEditorControlsProps, IEditorControlsState> {
    constructor(props: IEditorControlsProps) {
        super(props);
        let count = this.props.isTargetedAnimation ? 1 : (this.props.entity as IAnimatable).animations?.length ?? 0;
        this.state = {
            isAnimationTabOpen: count === 0 ? true : false,
            isEditTabOpen: count === 0 ? false : true,
            isSaveTabOpen: false,
            isLoadTabOpen: false,
            isLoopActive: true,
            animationsCount: count,
            framesPerSecond: this.props.fps,
            snippetId: "",
            selected: undefined,
        };
    }

    /**
     * Makes sure the frames per second receive the updated prop
     * @param prevProps previous properties
     */
    componentDidUpdate(prevProps: IEditorControlsProps) {
        if (this.props.fps !== prevProps.fps) {
            this.setState({ framesPerSecond: this.props.fps });
        }
    }

    /**
     * Add the nimation, recounts the list and opens the correct tab
     * @param animation The recently empty created animation
     */
    onAnimationAdded = (animation: Animation) => {
        this.setState({
            animationsCount: this.recountAnimations(),
            isEditTabOpen: true,
            isAnimationTabOpen: false,
        });
        this.props.selectAnimation(animation, undefined);
    };

    /**
     * Set state when the animations list has finished updated
     */
    finishedUpdate = () => {
        this.setState({
            isEditTabOpen: true,
            isAnimationTabOpen: false,
            selected: undefined,
        });
    };

    // Recount animations
    recountAnimations() {
        return (this.props.entity as IAnimatable).animations?.length ?? 0;
    }

    /**
     * Toggles loop
     */
    changeLoopBehavior = () => {
        this.setState({
            isLoopActive: !this.state.isLoopActive,
        });
        this.props.setIsLooping();
    };

    /**
     * This avoids using lambda functions in JSX
     */
    handleFirstTab = () => {
        this.handleTabs(0);
    };
    handleSecondTab = () => {
        this.handleTabs(1);
    };
    handleThirdTab = () => {
        this.handleTabs(2);
    };
    handleFourthTab = () => {
        this.handleTabs(3);
    };

    // Opens/Closes the tabs
    handleTabs(tab: number) {
        let state = {
            isAnimationTabOpen: true,
            isLoadTabOpen: false,
            isSaveTabOpen: false,
            isEditTabOpen: false,
        };

        switch (tab) {
            case 0:
                state = {
                    isAnimationTabOpen: true,
                    isLoadTabOpen: false,
                    isSaveTabOpen: false,
                    isEditTabOpen: false,
                };
                break;
            case 1:
                state = {
                    isAnimationTabOpen: false,
                    isLoadTabOpen: true,
                    isSaveTabOpen: false,
                    isEditTabOpen: false,
                };
                break;
            case 2:
                state = {
                    isAnimationTabOpen: false,
                    isLoadTabOpen: false,
                    isSaveTabOpen: true,
                    isEditTabOpen: false,
                };
                break;
            case 3:
                state = {
                    isAnimationTabOpen: false,
                    isLoadTabOpen: false,
                    isSaveTabOpen: false,
                    isEditTabOpen: true,
                };
                break;
        }

        this.setState(state);
    }

    // Set state of FPS and sends the fps to parent
    handleChangeFps = (fps: number) => {
        this.props.setFps(fps);
        this.setState({ framesPerSecond: fps });
        if (this.props.selected) {
            this.props.selected.framePerSecond = fps;
        }
    };

    /**
     * Cleans the list when has been emptied
     */
    onEmptiedList = () => {
        this.setState({
            animationsCount: this.recountAnimations(),
            isEditTabOpen: false,
            isAnimationTabOpen: true,
        });
    };

    /**
     * When animations have been reloaded update tabs
     */
    animationsLoaded = (numberOfAnimations: number) => {
        this.setState({
            animationsCount: numberOfAnimations,
            isEditTabOpen: true,
            isAnimationTabOpen: false,
            isLoadTabOpen: false,
            isSaveTabOpen: false,
        });

        if (this.props.entity instanceof TargetedAnimation) {
            const animation = (this.props.entity as TargetedAnimation).animation;
            this.props.selectAnimation(animation);
        } else {
            const animations = (this.props.entity as IAnimatable).animations;
            if (animations !== null) {
                this.props.selectAnimation(animations[0]);
            }
        }
    };

    /**
     * The currently selected animation to edit it
     * @param selected Selected animation
     */
    editAnimation = (selected: Animation) => {
        this.setState({
            selected: selected,
            isEditTabOpen: false,
            isAnimationTabOpen: true,
            isLoadTabOpen: false,
            isSaveTabOpen: false,
        });
    };

    // Set state of the snippet id
    setSnippetId = (id: string) => {
        this.setState({ snippetId: id });
    };

    /**
     * Marks animation tab closed and hides the tab
     */
    onCloseAddAnimation = () => {
        this.setState({ isAnimationTabOpen: false, isEditTabOpen: true });
    };

    render() {
        return (
            <div className="animation-list">
                <div className="controls-header">
                    {this.props.isTargetedAnimation ? null : (
                        <IconButtonLineComponent
                            active={this.state.isAnimationTabOpen}
                            tooltip="Add Animation"
                            icon="medium add-animation"
                            onClick={this.handleFirstTab}
                        ></IconButtonLineComponent>
                    )}
                    <IconButtonLineComponent
                        active={this.state.isLoadTabOpen}
                        tooltip="Load Animation"
                        icon="medium load"
                        onClick={this.handleSecondTab}
                    ></IconButtonLineComponent>
                    {this.state.animationsCount === 0 ? null : (
                        <IconButtonLineComponent
                            active={this.state.isSaveTabOpen}
                            tooltip="Save Animation"
                            icon="medium save"
                            onClick={this.handleThirdTab}
                        ></IconButtonLineComponent>
                    )}
                    {this.state.animationsCount === 0 ? null : (
                        <IconButtonLineComponent
                            active={this.state.isEditTabOpen}
                            tooltip="Edit Animations"
                            icon="medium animation-edit"
                            onClick={this.handleFourthTab}
                        ></IconButtonLineComponent>
                    )}
                    {this.state.isEditTabOpen ? (
                        <div className="input-fps">
                            <NumericInputComponent
                                label={""}
                                precision={0}
                                value={this.state.framesPerSecond}
                                onChange={this.handleChangeFps}
                            />
                            <p>fps</p>
                        </div>
                    ) : null}
                    {this.state.isEditTabOpen ? (
                        <IconButtonLineComponent
                            tooltip="Loop/Unloop"
                            icon={`medium ${this.state.isLoopActive ? "loop-active last" : "loop-inactive last"}`}
                            onClick={this.changeLoopBehavior}
                        ></IconButtonLineComponent>
                    ) : null}
                </div>
                {this.props.isTargetedAnimation ? null : (
                    <AddAnimation
                        isOpen={this.state.isAnimationTabOpen}
                        close={this.onCloseAddAnimation}
                        entity={this.props.entity as IAnimatable}
                        setNotificationMessage={this.props.setNotificationMessage}
                        addedNewAnimation={this.onAnimationAdded}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        fps={this.state.framesPerSecond}
                        selectedToUpdate={this.state.selected}
                        finishedUpdate={this.finishedUpdate}
                    />
                )}

                {this.state.isLoadTabOpen ? (
                    <LoadSnippet
                        animationsLoaded={this.animationsLoaded}
                        lockObject={this.props.lockObject}
                        animations={[]}
                        snippetServer={this.props.snippetServer}
                        globalState={this.props.globalState}
                        setSnippetId={this.setSnippetId}
                        entity={this.props.entity}
                        setNotificationMessage={this.props.setNotificationMessage}
                    />
                ) : null}

                {this.state.isSaveTabOpen ? (
                    <SaveSnippet
                        lockObject={this.props.lockObject}
                        animations={(this.props.entity as IAnimatable).animations}
                        snippetServer={this.props.snippetServer}
                        globalState={this.props.globalState}
                        snippetId={this.state.snippetId}
                    />
                ) : null}

                {this.state.isEditTabOpen ? (
                    <AnimationListTree
                        deselectAnimation={this.props.deselectAnimation}
                        isTargetedAnimation={this.props.isTargetedAnimation}
                        entity={this.props.entity}
                        selected={this.props.selected}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        empty={this.onEmptiedList}
                        selectAnimation={this.props.selectAnimation}
                        editAnimation={this.editAnimation}
                    />
                ) : null}
            </div>
        );
    }
}
