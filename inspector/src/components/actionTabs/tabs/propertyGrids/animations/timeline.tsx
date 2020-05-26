
import * as React from "react";
import { IAnimationKey } from 'babylonjs/Animations/animationKey';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretRight, faCaretLeft, faStepBackward, faStepForward } from "@fortawesome/free-solid-svg-icons";

interface ITimelineProps {
    keyframes: IAnimationKey[] | null;
    selected: IAnimationKey | null;
    currentFrame: number;
    onCurrentFrameChange: (frame: number) => void;
}


export class Timeline extends React.Component<ITimelineProps, { selected: IAnimationKey }>{
    readonly _frames: object[] = Array(300).fill({});
    private _scrollable: React.RefObject<HTMLDivElement>;
    constructor(props: ITimelineProps) {
        super(props);
        if (this.props.selected !== null){
        this.state = { selected: this.props.selected };
        }
        this._scrollable = React.createRef();
    }

    handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.props.onCurrentFrameChange(parseInt(event.target.value));
        event.preventDefault();
    }

    nextFrame(event: React.MouseEvent<HTMLDivElement>) {
        event.preventDefault();
        this.props.onCurrentFrameChange(this.props.currentFrame + 1);
        (this._scrollable.current as HTMLDivElement).scrollLeft = this.props.currentFrame * 5;
    }

    previousFrame(event: React.MouseEvent<HTMLDivElement>) {
        event.preventDefault();
        if (this.props.currentFrame !== 0) {
            this.props.onCurrentFrameChange(this.props.currentFrame - 1);
            (this._scrollable.current as HTMLDivElement).scrollLeft = -(this.props.currentFrame * 5);
        }
    }

    nextKeyframe(event: React.MouseEvent<HTMLDivElement>) {
        event.preventDefault();
        if (this.props.keyframes !== null){
        let first = this.props.keyframes.find(kf => kf.frame > this.props.currentFrame);
        if (first) {
            this.props.onCurrentFrameChange(first.frame);
            this.setState({ selected: first });
            (this._scrollable.current as HTMLDivElement).scrollLeft = first.frame * 5;
        }
    }
    }

    previousKeyframe(event: React.MouseEvent<HTMLDivElement>) {
        event.preventDefault();
        if (this.props.keyframes !== null){
        let first = this.props.keyframes.find(kf => kf.frame < this.props.currentFrame);
        if (first) {
            this.props.onCurrentFrameChange(first.frame);
            this.setState({ selected: first });
            (this._scrollable.current as HTMLDivElement).scrollLeft = -(first.frame * 5);
        }
    }
    }

    render() {
        return (
            <>
                <div className="timeline">
                    <div ref={this._scrollable} className="display-line">
                        <svg viewBox="0 0 2010 100" style={{ width: 2000 }}>

                            <line x1={this.props.currentFrame * 10} y1="10" x2={this.props.currentFrame * 10} y2="20" style={{ stroke: '#12506b', strokeWidth: 6 }} />

                            {
                                this.props.keyframes && this.props.keyframes.map((kf, i) => {

                                    return <svg key={`kf_${i}`}>
                                        <line x1={kf.frame * 10} y1="10" x2={kf.frame * 10} y2="20" style={{ stroke: 'red', strokeWidth: 6 }} />
                                    </svg>

                                })
                            }

                            {
                                this._frames.map((frame, i) => {

                                    return <svg key={`tl_${i}`}>
                                        {i % 10 === 0 ? <text x={(i * 10) - 3} y="8" style={{ fontSize: 10 }}>{i}</text> : null}
                                        <line x1={i * 10} y1="10" x2={i * 10} y2="20" style={{ stroke: 'black', strokeWidth: 0.5 }} />
                                    </svg>

                                })
                            }

                        </svg>
                    </div>
                    <div className="controls">
                        <div className="input-frame">
                            <input type="number" value={this.props.currentFrame} onChange={(e) => this.handleInputChange(e)}></input>
                        </div>
                        <div className="previous-frame button" onClick={(e) => this.previousFrame(e)}>
                            <FontAwesomeIcon icon={faCaretLeft} />
                        </div>
                        <div className="previous-key-frame button" onClick={(e) => this.previousKeyframe(e)}>
                            <FontAwesomeIcon icon={faStepBackward} />
                        </div>
                        <div className="next-key-frame button" onClick={(e) => this.nextKeyframe(e)}>
                            <FontAwesomeIcon icon={faStepForward} />
                        </div>
                        <div className="next-frame button" onClick={(e) => this.nextFrame(e)}>
                            <FontAwesomeIcon icon={faCaretRight} />
                        </div>
                    </div>
                </div>
            </>
        )
    }
} 
