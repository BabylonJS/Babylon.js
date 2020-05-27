
import * as React from "react";
import { IAnimationKey } from 'babylonjs/Animations/animationKey';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretRight, faCaretLeft, faStepBackward, faStepForward } from "@fortawesome/free-solid-svg-icons";

interface ITimelineProps {
    keyframes: IAnimationKey[] | null;
    selected: IAnimationKey | null;
    currentFrame: number;
    onCurrentFrameChange: (frame: number) => void;
    dragKeyframe: (frame: number, index: number) => void;
}


export class Timeline extends React.Component<ITimelineProps, { selected: IAnimationKey, activeKeyframe: number | null }>{
    readonly _frames: object[] = Array(300).fill({});
    private _scrollable: React.RefObject<HTMLDivElement>;
    private _direction: number;
    constructor(props: ITimelineProps) {
        super(props);
        if (this.props.selected !== null) {
            this.state = { selected: this.props.selected, activeKeyframe: null };
        }
        this._scrollable = React.createRef();
        this._direction = 0;
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
        if (this.props.keyframes !== null) {
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
        if (this.props.keyframes !== null) {
            let first = this.props.keyframes.find(kf => kf.frame < this.props.currentFrame);
            if (first) {
                this.props.onCurrentFrameChange(first.frame);
                this.setState({ selected: first });
                (this._scrollable.current as HTMLDivElement).scrollLeft = -(first.frame * 5);
            }
        }
    }

    dragStart(e: React.TouchEvent<SVGSVGElement>): void;
    dragStart(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
    dragStart(e: any): void {
        e.preventDefault();
        this.setState({ activeKeyframe: parseInt(e.target.id.replace('kf_', '')) });
        this._direction = e.clientX;

    }

    drag(e: React.TouchEvent<SVGSVGElement>): void;
    drag(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
    drag(e: any): void {
        e.preventDefault();
        if (this.props.keyframes) {
            if (this.state.activeKeyframe === parseInt(e.target.id.replace('kf_', ''))) {
                let updatedKeyframe = this.props.keyframes[this.state.activeKeyframe];
                if (this._direction > e.clientX) {
                    console.log(`Dragging left ${this.state.activeKeyframe}`);
                    let used = this.isFrameBeingUsed(updatedKeyframe.frame - 1, -1);
                    if (used){
                        updatedKeyframe.frame = used
                    } 
                    
                } else {
                    console.log(`Dragging Right ${this.state.activeKeyframe}`)
                    let used = this.isFrameBeingUsed(updatedKeyframe.frame + 1, 1);
                    if (used){
                        updatedKeyframe.frame = used
                    } 
                }

                this.props.dragKeyframe(updatedKeyframe.frame, this.state.activeKeyframe);

            }
        }
    }

    isFrameBeingUsed(frame: number, direction: number){
        let used = this.props.keyframes?.find(kf => kf.frame === frame);
        if (used){
            this.isFrameBeingUsed(used.frame + direction, direction);
            return false;
        } else {
            return frame;
        }
    }

    dragEnd(e: React.TouchEvent<SVGSVGElement>): void;
    dragEnd(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
    dragEnd(e: any): void {
        e.preventDefault();
        this._direction = 0;
        this.setState({ activeKeyframe: null })
    }

    render() {
        return (
            <>
                <div className="timeline">
                    <div ref={this._scrollable} className="display-line" >
                        <svg viewBox="0 0 2010 100" style={{ width: 2000 }} onMouseMove={(e) => this.drag(e)}
                                        onTouchMove={(e) => this.drag(e)}
                                        onTouchStart={(e) => this.dragStart(e)}
                                        onTouchEnd={(e) => this.dragEnd(e)}
                                        onMouseDown={(e) => this.dragStart(e)}
                                        onMouseUp={(e) => this.dragEnd(e)}
                                        onMouseLeave={(e) => this.dragEnd(e)}>

                            <line x1={this.props.currentFrame * 10} y1="10" x2={this.props.currentFrame * 10} y2="20" style={{ stroke: '#12506b', strokeWidth: 6 }} />

                            {
                                this.props.keyframes && this.props.keyframes.map((kf, i) => {

                                    return <svg key={`kf_${i}`} style={{ cursor: 'pointer' }} tabIndex={i + 40} >
                                        <line id={`kf_${i.toString()}`} x1={kf.frame * 10} y1="10" x2={kf.frame * 10} y2="20" style={{ stroke: 'red', strokeWidth: 6 }} />
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
