import * as React from "react";
import { IAnimationKey } from "babylonjs/Animations/animationKey";
import { Controls } from "./controls";

interface ITimelineProps {
    keyframes: IAnimationKey[] | null;
    selected: IAnimationKey | null;
    currentFrame: number;
    onCurrentFrameChange: (frame: number) => void;
    onAnimationLimitChange: (limit: number) => void;
    dragKeyframe: (frame: number, index: number) => void;
    playPause: (direction: number) => void;
    isPlaying: boolean;
    animationLimit: number;
    fps: number;
    repositionCanvas: (keyframe: IAnimationKey) => void;
}

export class Timeline extends React.Component<
    ITimelineProps,
    {
        selected: IAnimationKey;
        activeKeyframe: number | null;
        start: number;
        end: number;
        scrollWidth: number | undefined;
        selectionLength: number[];
        limitValue: number;
    }
> {
    private _scrollable: React.RefObject<HTMLDivElement>;
    private _scrollbarHandle: React.RefObject<HTMLDivElement>;
    private _scrollContainer: React.RefObject<HTMLDivElement>;
    private _inputAnimationLimit: React.RefObject<HTMLInputElement>;
    private _direction: number;
    private _scrolling: boolean;
    private _shiftX: number;
    private _active: string = "";
    readonly _marginScrollbar: number;

    constructor(props: ITimelineProps) {
        super(props);

        this._scrollable = React.createRef();
        this._scrollbarHandle = React.createRef();
        this._scrollContainer = React.createRef();
        this._inputAnimationLimit = React.createRef();
        this._direction = 0;
        this._scrolling = false;
        this._shiftX = 0;
        this._marginScrollbar = 3;

        const limit = Math.round(this.props.animationLimit / 2);

        if (this.props.selected !== null) {
            this.state = {
                selected: this.props.selected,
                activeKeyframe: null,
                start: 0,
                end: limit,
                scrollWidth: this.calculateScrollWidth(0, limit),
                selectionLength: this.range(0, limit),
                limitValue: this.props.animationLimit,
            };
        }
    }

    componentDidMount() {
        this.setState({
            scrollWidth: this.calculateScrollWidth(this.state.start, this.state.end),
        });

        this._inputAnimationLimit.current?.addEventListener("keyup", this.isEnterKeyUp.bind(this));
    }

    componentWillUnmount() {
        this._inputAnimationLimit.current?.removeEventListener("keyup", this.isEnterKeyUp.bind(this));
    }

    isEnterKeyUp(event: KeyboardEvent) {
        event.preventDefault();

        if (event.key === "Enter") {
            this.setControlState();
        }
    }

    onInputBlur(event: React.FocusEvent<HTMLInputElement>) {
        event.preventDefault();
        this.setControlState();
    }

    setControlState() {
        this.props.onAnimationLimitChange(this.state.limitValue);
        const newEnd = Math.round(this.state.limitValue / 2);
        this.setState(
            {
                start: 0,
                end: newEnd,
                selectionLength: this.range(0, newEnd),
            },
            () => {
                this.setState({
                    scrollWidth: this.calculateScrollWidth(0, newEnd),
                });
                if (this._scrollbarHandle.current && this._scrollContainer.current) {
                    this._scrollbarHandle.current.style.left = `${this._scrollContainer.current.getBoundingClientRect().left + this._marginScrollbar}px`;
                }
            }
        );
    }

    calculateScrollWidth(start: number, end: number) {
        if (this._scrollContainer.current && this.props.animationLimit !== 0) {
            const containerMarginLeftRight = this._marginScrollbar * 2;
            const containerWidth = this._scrollContainer.current.clientWidth - containerMarginLeftRight;
            const scrollFrameLimit = this.props.animationLimit;
            const scrollFrameLength = end - start;
            const widthPercentage = Math.round((scrollFrameLength * 100) / scrollFrameLimit);
            const scrollPixelWidth = Math.round((widthPercentage * containerWidth) / 100);
            if (scrollPixelWidth === Infinity || scrollPixelWidth > containerWidth) {
                return containerWidth;
            }
            return scrollPixelWidth;
        } else {
            return undefined;
        }
    }

    playBackwards(event: React.MouseEvent<HTMLDivElement>) {
        this.props.playPause(-1);
    }

    play(event: React.MouseEvent<HTMLDivElement>) {
        this.props.playPause(1);
    }

    pause(event: React.MouseEvent<HTMLDivElement>) {
        if (this.props.isPlaying) {
            this.props.playPause(1);
        }
    }

    setCurrentFrame = (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (this._scrollable.current) {
            const containerWidth = this._scrollable.current?.clientWidth;
            const unit = Math.round(containerWidth / this.state.selectionLength.length);
            const frame = Math.round((event.clientX - 233) / unit) + this.state.start;
            this.props.onCurrentFrameChange(frame);
        }
    };

    handleLimitChange(event: React.ChangeEvent<HTMLInputElement>) {
        event.preventDefault();
        let newLimit = parseInt(event.target.value);
        if (isNaN(newLimit)) {
            newLimit = 0;
        }
        this.setState({
            limitValue: newLimit,
        });
    }

    dragStart = (e: React.MouseEvent<SVGSVGElement, MouseEvent>): void => {
        e.preventDefault();
        this.setState({ activeKeyframe: parseInt((e.target as SVGSVGElement).id.replace("kf_", "")) });
        this._direction = e.clientX;
    };

    drag = (e: React.MouseEvent<SVGSVGElement, MouseEvent>): void => {
        e.preventDefault();
        if (this.props.keyframes) {
            if (this.state.activeKeyframe === parseInt((e.target as SVGSVGElement).id.replace("kf_", ""))) {
                let updatedKeyframe = this.props.keyframes[this.state.activeKeyframe];
                if (this._direction > e.clientX) {
                    let used = this.isFrameBeingUsed(updatedKeyframe.frame - 1, -1);
                    if (used) {
                        updatedKeyframe.frame = used;
                    }
                } else {
                    let used = this.isFrameBeingUsed(updatedKeyframe.frame + 1, 1);
                    if (used) {
                        updatedKeyframe.frame = used;
                    }
                }

                this.props.dragKeyframe(updatedKeyframe.frame, this.state.activeKeyframe);
            }
        }
    };

    isFrameBeingUsed(frame: number, direction: number) {
        let used = this.props.keyframes?.find((kf) => kf.frame === frame);
        if (used) {
            this.isFrameBeingUsed(used.frame + direction, direction);
            return false;
        } else {
            return frame;
        }
    }

    dragEnd = (e: React.MouseEvent<SVGSVGElement, MouseEvent>): void => {
        e.preventDefault();
        this._direction = 0;
        this.setState({ activeKeyframe: null });
    };

    scrollDragStart = (e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
        e.preventDefault();
        if ((e.target as HTMLDivElement).className === "scrollbar") {
            if (this._scrollbarHandle.current) {
                this._scrolling = true;
                this._shiftX = e.clientX - this._scrollbarHandle.current.getBoundingClientRect().left;
                this._scrollbarHandle.current.style.left = e.pageX - this._shiftX + "px";
            }
        }

        if ((e.target as HTMLDivElement).className === "left-draggable" && this._scrollbarHandle.current) {
            this._active = "leftDraggable";
            this._shiftX = e.clientX - this._scrollbarHandle.current.getBoundingClientRect().left;
        }

        if ((e.target as HTMLDivElement).className === "right-draggable" && this._scrollbarHandle.current) {
            this._active = "rightDraggable";
            this._shiftX = e.clientX - this._scrollbarHandle.current.getBoundingClientRect().left;
        }
    };

    scrollDrag = (e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
        e.preventDefault();
        if ((e.target as HTMLDivElement).className === "scrollbar") {
            this.moveScrollbar(e.pageX);
        }

        if (this._active === "leftDraggable") {
            this.resizeScrollbarLeft(e.clientX);
        }

        if (this._active === "rightDraggable") {
            this.resizeScrollbarRight(e.clientX);
        }
    };

    scrollDragEnd = (e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
        e.preventDefault();
        this._scrolling = false;
        this._active = "";
        this._shiftX = 0;
    };

    moveScrollbar(pageX: number) {
        if (this._scrolling && this._scrollbarHandle.current && this._scrollContainer.current) {
            const moved = pageX - this._shiftX;
            const scrollContainerWith = this._scrollContainer.current.clientWidth;
            const startPixel = moved - this._scrollContainer.current.getBoundingClientRect().left;
            const limitRight = scrollContainerWith - (this.state.scrollWidth || 0) - this._marginScrollbar;

            if (moved > 233 && startPixel < limitRight) {
                this._scrollbarHandle.current.style.left = moved + "px";
                (this._scrollable.current as HTMLDivElement).scrollLeft = moved + 10;

                const startPixelPercent = (startPixel * 100) / scrollContainerWith;

                const selectionStartFrame = Math.round((startPixelPercent * this.props.animationLimit) / 100);

                const selectionEndFrame = this.state.selectionLength.length + selectionStartFrame;

                this.setState({
                    start: selectionStartFrame,
                    end: selectionEndFrame,
                    selectionLength: this.range(selectionStartFrame, selectionEndFrame),
                });
            }
        }
    }

    resizeScrollbarRight(clientX: number) {
        if (this._scrollContainer.current && this._scrollbarHandle.current) {
            const moving = clientX - this._scrollContainer.current.getBoundingClientRect().left;

            const unit = this._scrollContainer.current.clientWidth / this.props.animationLimit;
            const priorLastFrame = this.state.end * unit;
            const mouseMoved = moving - priorLastFrame;

            let framesTo = 0;
            if (Math.sign(mouseMoved) !== -1) {
                framesTo = Math.round(mouseMoved / unit) + this.state.end;
            } else {
                framesTo = this.state.end - Math.round(Math.abs(mouseMoved) / unit);
            }

            if (!(framesTo <= this.state.start + 20)) {
                if (framesTo <= this.props.animationLimit) {
                    this.setState({
                        end: framesTo,
                        scrollWidth: this.calculateScrollWidth(this.state.start, framesTo),
                        selectionLength: this.range(this.state.start, framesTo),
                    });
                }
            }
        }
    }

    resizeScrollbarLeft(clientX: number) {
        if (this._scrollContainer.current && this._scrollbarHandle.current) {
            const moving = clientX - this._scrollContainer.current.getBoundingClientRect().left;

            const unit = this._scrollContainer.current.clientWidth / this.props.animationLimit;
            const priorFirstFrame = this.state.start !== 0 ? this.state.start * unit : 0;
            const mouseMoved = moving - priorFirstFrame;

            let framesTo = 0;

            if (Math.sign(mouseMoved) !== -1) {
                framesTo = Math.round(mouseMoved / unit) + this.state.start;
            } else {
                framesTo = this.state.start !== 0 ? this.state.start - Math.round(Math.abs(mouseMoved) / unit) : 0;
            }

            if (!(framesTo >= this.state.end - 20)) {
                let toleft = framesTo * unit + this._scrollContainer.current.getBoundingClientRect().left + this._marginScrollbar * 2;
                if (this._scrollbarHandle.current) {
                    this._scrollbarHandle.current.style.left = toleft + "px";
                }
                this.setState({
                    start: framesTo,
                    scrollWidth: this.calculateScrollWidth(framesTo, this.state.end),
                    selectionLength: this.range(framesTo, this.state.end),
                });
            }
        }
    }

    range(start: number, end: number) {
        return Array.from({ length: end - start }, (_, i) => start + i * 1);
    }

    getKeyframe(frame: number) {
        if (this.props.keyframes) {
            return this.props.keyframes.find((x) => x.frame === frame);
        } else {
            return false;
        }
    }

    getCurrentFrame(frame: number) {
        if (this.props.currentFrame === frame) {
            return true;
        } else {
            return false;
        }
    }

    dragDomFalse = () => false;

    render() {
        return (
            <>
                <div className="timeline">
                    <Controls
                        keyframes={this.props.keyframes}
                        selected={this.props.selected}
                        currentFrame={this.props.currentFrame}
                        onCurrentFrameChange={this.props.onCurrentFrameChange}
                        repositionCanvas={this.props.repositionCanvas}
                        playPause={this.props.playPause}
                        isPlaying={this.props.isPlaying}
                        scrollable={this._scrollable}
                    />
                    <div className="timeline-wrapper">
                        <div ref={this._scrollable} className="display-line" onClick={this.setCurrentFrame}>
                            <svg
                                style={{
                                    width: "100%",
                                    height: 40,
                                    backgroundColor: "#222222",
                                }}
                                onMouseMove={this.drag}
                                onMouseDown={this.dragStart}
                                onMouseUp={this.dragEnd}
                                onMouseLeave={this.dragEnd}
                            >
                                {this.state.selectionLength.map((frame, i) => {
                                    return (
                                        <svg key={`tl_${frame}`}>
                                            {
                                                <>
                                                    {frame % Math.round(this.state.selectionLength.length / 20) === 0 ? (
                                                        <>
                                                            <text x={(i * 100) / this.state.selectionLength.length + "%"} y="18" style={{ fontSize: 10, fill: "#555555" }}>
                                                                {frame}
                                                            </text>
                                                            <line x1={(i * 100) / this.state.selectionLength.length + "%"} y1="22" x2={(i * 100) / this.state.selectionLength.length + "%"} y2="40" style={{ stroke: "#555555", strokeWidth: 0.5 }} />
                                                        </>
                                                    ) : null}
                                                    {this.getCurrentFrame(frame) ? (
                                                        <svg x={this._scrollable.current ? this._scrollable.current.clientWidth / this.state.selectionLength.length / 2 : 1}>
                                                            <line
                                                                x1={(i * 100) / this.state.selectionLength.length + "%"}
                                                                y1="0"
                                                                x2={(i * 100) / this.state.selectionLength.length + "%"}
                                                                y2="40"
                                                                style={{
                                                                    stroke: "rgba(18, 80, 107, 0.26)",
                                                                    strokeWidth: this._scrollable.current ? this._scrollable.current.clientWidth / this.state.selectionLength.length : 1,
                                                                }}
                                                            />
                                                        </svg>
                                                    ) : null}

                                                    {this.getKeyframe(frame) ? (
                                                        <svg key={`kf_${i}`} tabIndex={i + 40}>
                                                            <line id={`kf_${i.toString()}`} x1={(i * 100) / this.state.selectionLength.length + "%"} y1="0" x2={(i * 100) / this.state.selectionLength.length + "%"} y2="40" style={{ stroke: "#ffc017", strokeWidth: 1 }} />
                                                        </svg>
                                                    ) : null}
                                                </>
                                            }
                                        </svg>
                                    );
                                })}
                            </svg>
                        </div>

                        <div className="timeline-scroll-handle" onMouseMove={this.scrollDrag} onMouseDown={this.scrollDragStart} onMouseUp={this.scrollDragEnd} onMouseLeave={this.scrollDragEnd} onDragStart={this.dragDomFalse}>
                            <div className="scroll-handle" ref={this._scrollContainer}>
                                <div className="handle" ref={this._scrollbarHandle} style={{ width: this.state.scrollWidth }}>
                                    <div className="left-grabber">
                                        <div className="left-draggable">
                                            <div className="grabber"></div>
                                            <div className="grabber"></div>
                                            <div className="grabber"></div>
                                        </div>
                                        <div className="text">{this.state.start}</div>
                                    </div>
                                    <div className="scrollbar"></div>

                                    <div className="right-grabber">
                                        <div className="text">{this.state.end}</div>
                                        <div className="right-draggable">
                                            <div className="grabber"></div>
                                            <div className="grabber"></div>
                                            <div className="grabber"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="input-frame">
                            <input ref={this._inputAnimationLimit} type="number" value={this.state.limitValue} onChange={(e) => this.handleLimitChange(e)} onBlur={(e) => this.onInputBlur(e)}></input>
                        </div>
                    </div>
                </div>
            </>
        );
    }
}
