import * as React from "react";
import { IAnimationKey } from "babylonjs/Animations/animationKey";
import { IconButtonLineComponent } from "../../../../../sharedUiComponents/lines/iconButtonLineComponent";

interface IControlsProps {
    // Keyframes to choose start or end of animation playback
    keyframes: IAnimationKey[] | null;
    // The currently selected animation keyframe
    selected: IAnimationKey | null;
    // The current frame number
    currentFrame: number;
    // Event to change the current frame
    onCurrentFrameChange: (frame: number) => void;
    // Event to communicate canvas repposition
    repositionCanvas: (keyframe: IAnimationKey) => void;
    // Event to play, pause or play backwards the animation
    playPause: (direction: number) => void;
    // If the animation is playing
    isPlaying: boolean;
    // The reference to the scrollable dom object to set its position
    scrollable: React.RefObject<HTMLDivElement>;
}

/**
 * The playback controls for the animation editor
 */
export class Controls extends React.Component<IControlsProps, { selected: IAnimationKey; playingType: string }> {
    readonly _sizeOfKeyframe: number = 5;
    constructor(props: IControlsProps) {
        super(props);
        if (this.props.selected !== null) {
            this.state = { selected: this.props.selected, playingType: "" };
        }
    }

    playBackwards = () => {
        this.setState({ playingType: "reverse" });
        this.props.playPause(-1);
    };

    play = () => {
        this.setState({ playingType: "forward" });
        this.props.playPause(1);
    };

    pause = () => {
        if (this.props.isPlaying) {
            this.setState({ playingType: "" });
            this.props.playPause(0);
        }
    };

    /**
     * Set animation to initial keyframe
     */
    moveToAnimationStart = () => {
        const startKeyframe = this.props.keyframes && this.props.keyframes[0];
        if (startKeyframe !== null) {
            if (typeof startKeyframe.frame === "number") {
                this.props.onCurrentFrameChange(startKeyframe.frame);
            }
        }
    };

    /**
     * Set animation to the last keyframe
     */
    moveToAnimationEnd = () => {
        const endKeyframe = this.props.keyframes && this.props.keyframes[this.props.keyframes.length - 1];
        if (endKeyframe !== null) {
            if (typeof endKeyframe.frame === "number") {
                this.props.onCurrentFrameChange(endKeyframe.frame);
            }
        }
    };

    /** Move to next keyframe */
    nextKeyframe = () => {
        if (this.props.keyframes !== null) {
            let first = this.props.keyframes.find((kf) => kf.frame > this.props.currentFrame);
            if (first) {
                this.props.onCurrentFrameChange(first.frame);
                this.setState({ selected: first });
                (this.props.scrollable.current as HTMLDivElement).scrollLeft = first.frame * this._sizeOfKeyframe;
            }
        }
    };

    /** Move to previous keyframe */
    previousKeyframe = () => {
        if (this.props.keyframes !== null) {
            let keyframes = [...this.props.keyframes];
            let first = keyframes.reverse().find((kf) => kf.frame < this.props.currentFrame);
            if (first) {
                this.props.onCurrentFrameChange(first.frame);
                this.setState({ selected: first });
                (this.props.scrollable.current as HTMLDivElement).scrollLeft = -(first.frame * this._sizeOfKeyframe);
            }
        }
    };

    render() {
        return (
            <div className="controls">
                <IconButtonLineComponent
                    tooltip="Animation Start"
                    icon="animation-start"
                    onClick={this.moveToAnimationStart}
                ></IconButtonLineComponent>
                <IconButtonLineComponent
                    tooltip="Previous Keyframe"
                    icon="animation-lastkey"
                    onClick={this.previousKeyframe}
                ></IconButtonLineComponent>
                {this.props.isPlaying ? (
                    <div className="stop-container">
                        {this.state.playingType === "reverse" ? (
                            <>
                                <IconButtonLineComponent
                                    tooltip="Pause"
                                    icon="animation-stop"
                                    onClick={this.pause}
                                ></IconButtonLineComponent>
                                <IconButtonLineComponent
                                    tooltip="Play Forward"
                                    icon="animation-playfwd"
                                    onClick={this.play}
                                ></IconButtonLineComponent>
                            </>
                        ) : (
                            <>
                                <IconButtonLineComponent
                                    tooltip="Play Reverse"
                                    icon="animation-playrev"
                                    onClick={this.playBackwards}
                                ></IconButtonLineComponent>
                                <IconButtonLineComponent
                                    tooltip="Pause"
                                    icon="animation-stop"
                                    onClick={this.pause}
                                ></IconButtonLineComponent>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="stop-container">
                        <IconButtonLineComponent
                            tooltip="Play Reverse"
                            icon="animation-playrev"
                            onClick={this.playBackwards}
                        ></IconButtonLineComponent>
                        <IconButtonLineComponent
                            tooltip="Play Forward"
                            icon="animation-playfwd"
                            onClick={this.play}
                        ></IconButtonLineComponent>
                    </div>
                )}
                <IconButtonLineComponent
                    tooltip="Next Keyframe"
                    icon="animation-nextkey"
                    onClick={this.nextKeyframe}
                ></IconButtonLineComponent>
                <IconButtonLineComponent
                    tooltip="Animation End"
                    icon="animation-end"
                    onClick={this.moveToAnimationEnd}
                ></IconButtonLineComponent>
            </div>
        );
    }
}
