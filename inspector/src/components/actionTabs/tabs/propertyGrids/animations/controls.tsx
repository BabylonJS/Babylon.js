import * as React from "react";
import { IAnimationKey } from "babylonjs/Animations/animationKey";
import { IconButtonLineComponent } from "../../../lines/iconButtonLineComponent";

interface IControlsProps {
    keyframes: IAnimationKey[] | null;
    selected: IAnimationKey | null;
    currentFrame: number;
    onCurrentFrameChange: (frame: number) => void;
    repositionCanvas: (frame: number) => void;
    playPause: (direction: number) => void;
    isPlaying: boolean;
    scrollable: React.RefObject<HTMLDivElement>;
}

export class Controls extends React.Component<IControlsProps, { selected: IAnimationKey; playingType: string }> {
    readonly _sizeOfKeyframe: number = 5;
    constructor(props: IControlsProps) {
        super(props);
        if (this.props.selected !== null) {
            this.state = { selected: this.props.selected, playingType: "" };
        }
    }

    playBackwards() {
        this.setState({ playingType: "reverse" });
        this.props.playPause(-1);
    }

    play() {
        this.setState({ playingType: "forward" });
        this.props.playPause(1);
    }

    pause() {
        if (this.props.isPlaying) {
            this.setState({ playingType: "" });
            this.props.playPause(0);
        }
    }

    moveToAnimationStart() {
        const start = this.props.keyframes && this.props.keyframes[0].frame;
        if (start !== undefined && typeof start === "number") {
            this.props.onCurrentFrameChange(start);
            this.props.repositionCanvas(start);
        }
    }

    moveToAnimationEnd() {
        const end = this.props.keyframes && this.props.keyframes[this.props.keyframes.length - 1].frame;
        if (end !== undefined && typeof end === "number") {
            this.props.onCurrentFrameChange(end);
            this.props.repositionCanvas(end);
        }
    }

    nextKeyframe() {
        if (this.props.keyframes !== null) {
            let first = this.props.keyframes.find((kf) => kf.frame > this.props.currentFrame);
            if (first) {
                this.props.onCurrentFrameChange(first.frame);
                this.props.repositionCanvas(first.frame);
                this.setState({ selected: first });
                (this.props.scrollable.current as HTMLDivElement).scrollLeft = first.frame * this._sizeOfKeyframe;
            }
        }
    }

    previousKeyframe() {
        if (this.props.keyframes !== null) {
            let keyframes = [...this.props.keyframes];
            let first = keyframes.reverse().find((kf) => kf.frame < this.props.currentFrame);
            if (first) {
                this.props.onCurrentFrameChange(first.frame);
                this.props.repositionCanvas(first.frame);
                this.setState({ selected: first });
                (this.props.scrollable.current as HTMLDivElement).scrollLeft = -(first.frame * this._sizeOfKeyframe);
            }
        }
    }

    render() {
        return (
            <div className="controls">
                <IconButtonLineComponent tooltip="Animation Start" icon="animation-start" onClick={() => this.moveToAnimationStart()}></IconButtonLineComponent>
                <IconButtonLineComponent tooltip="Previous Keyframe" icon="animation-lastkey" onClick={() => this.previousKeyframe()}></IconButtonLineComponent>
                {this.props.isPlaying ? (
                    <div className="stop-container">
                        {this.state.playingType === "reverse" ? (
                            <>
                                <IconButtonLineComponent tooltip="Pause" icon="animation-stop" onClick={() => this.pause()}></IconButtonLineComponent>
                                <IconButtonLineComponent tooltip="Play Forward" icon="animation-playfwd" onClick={() => this.play()}></IconButtonLineComponent>
                            </>
                        ) : (
                            <>
                                <IconButtonLineComponent tooltip="Play Reverse" icon="animation-playrev" onClick={() => this.playBackwards()}></IconButtonLineComponent>
                                <IconButtonLineComponent tooltip="Pause" icon="animation-stop" onClick={() => this.pause()}></IconButtonLineComponent>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="stop-container">
                        <IconButtonLineComponent tooltip="Play Reverse" icon="animation-playrev" onClick={() => this.playBackwards()}></IconButtonLineComponent>
                        <IconButtonLineComponent tooltip="Play Forward" icon="animation-playfwd" onClick={() => this.play()}></IconButtonLineComponent>
                    </div>
                )}
                <IconButtonLineComponent tooltip="Next Keyframe" icon="animation-nextkey" onClick={() => this.nextKeyframe()}></IconButtonLineComponent>
                <IconButtonLineComponent tooltip="Animation End" icon="animation-end" onClick={() => this.moveToAnimationEnd()}></IconButtonLineComponent>
            </div>
        );
    }
}
