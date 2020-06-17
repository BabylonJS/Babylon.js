import * as React from 'react';
import { IAnimationKey } from 'babylonjs/Animations/animationKey';
import { Controls } from './controls';

interface ITimelineProps {
  keyframes: IAnimationKey[] | null;
  selected: IAnimationKey | null;
  currentFrame: number;
  onCurrentFrameChange: (frame: number) => void;
  dragKeyframe: (frame: number, index: number) => void;
  playPause: (direction: number) => void;
  isPlaying: boolean;
}

export class Timeline extends React.Component<
  ITimelineProps,
  { selected: IAnimationKey; activeKeyframe: number | null }
> {
  readonly _frames: object[] = Array(300).fill({});
  private _scrollable: React.RefObject<HTMLDivElement>;
  private _scrollbarHandle: React.RefObject<HTMLDivElement>;
  private _direction: number;
  private _scrolling: boolean;
  private _shiftX: number;
  constructor(props: ITimelineProps) {
    super(props);
    if (this.props.selected !== null) {
      this.state = { selected: this.props.selected, activeKeyframe: null };
    }
    this._scrollable = React.createRef();
    this._scrollbarHandle = React.createRef();
    this._direction = 0;
    this._scrolling = false;
    this._shiftX = 0;
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

  handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.props.onCurrentFrameChange(parseInt(event.target.value));
    event.preventDefault();
  }

  nextFrame(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    this.props.onCurrentFrameChange(this.props.currentFrame + 1);
    (this._scrollable.current as HTMLDivElement).scrollLeft =
      this.props.currentFrame * 5;
  }

  previousFrame(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    if (this.props.currentFrame !== 0) {
      this.props.onCurrentFrameChange(this.props.currentFrame - 1);
      (this._scrollable.current as HTMLDivElement).scrollLeft = -(
        this.props.currentFrame * 5
      );
    }
  }

  nextKeyframe(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    if (this.props.keyframes !== null) {
      let first = this.props.keyframes.find(
        (kf) => kf.frame > this.props.currentFrame
      );
      if (first) {
        this.props.onCurrentFrameChange(first.frame);
        this.setState({ selected: first });
        (this._scrollable.current as HTMLDivElement).scrollLeft =
          first.frame * 5;
      }
    }
  }

  previousKeyframe(event: React.MouseEvent<HTMLDivElement>) {
    event.preventDefault();
    if (this.props.keyframes !== null) {
      let keyframes = [...this.props.keyframes];
      let first = keyframes
        .reverse()
        .find((kf) => kf.frame < this.props.currentFrame);
      if (first) {
        this.props.onCurrentFrameChange(first.frame);
        this.setState({ selected: first });
        (this._scrollable.current as HTMLDivElement).scrollLeft = -(
          first.frame * 5
        );
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
      if (
        this.state.activeKeyframe === parseInt(e.target.id.replace('kf_', ''))
      ) {
        let updatedKeyframe = this.props.keyframes[this.state.activeKeyframe];
        if (this._direction > e.clientX) {
          console.log(`Dragging left ${this.state.activeKeyframe}`);
          let used = this.isFrameBeingUsed(updatedKeyframe.frame - 1, -1);
          if (used) {
            updatedKeyframe.frame = used;
          }
        } else {
          console.log(`Dragging Right ${this.state.activeKeyframe}`);
          let used = this.isFrameBeingUsed(updatedKeyframe.frame + 1, 1);
          if (used) {
            updatedKeyframe.frame = used;
          }
        }

        this.props.dragKeyframe(
          updatedKeyframe.frame,
          this.state.activeKeyframe
        );
      }
    }
  }

  isFrameBeingUsed(frame: number, direction: number) {
    let used = this.props.keyframes?.find((kf) => kf.frame === frame);
    if (used) {
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
    this.setState({ activeKeyframe: null });
  }

  scrollDragStart(e: React.TouchEvent<HTMLDivElement>): void;
  scrollDragStart(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
  scrollDragStart(e: any) {
    e.preventDefault();
    if ((e.target.class = 'scrollbar') && this._scrollbarHandle.current) {
      this._scrolling = true;
      this._shiftX =
        e.clientX - this._scrollbarHandle.current.getBoundingClientRect().left;
      this._scrollbarHandle.current.style.left = e.pageX - this._shiftX + 'px';
    }
  }

  scrollDrag(e: React.TouchEvent<HTMLDivElement>): void;
  scrollDrag(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
  scrollDrag(e: any) {
    e.preventDefault();
    if (this._scrolling && this._scrollbarHandle.current) {
      let moved = e.pageX - this._shiftX;
      if (moved > 233 && moved < 630) {
        this._scrollbarHandle.current.style.left = moved + 'px';
        (this._scrollable.current as HTMLDivElement).scrollLeft = moved + 10;
      }
    }
  }

  scrollDragEnd(e: React.TouchEvent<HTMLDivElement>): void;
  scrollDragEnd(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
  scrollDragEnd(e: any) {
    e.preventDefault();
    this._scrolling = false;
    this._shiftX = 0;
  }

  render() {
    return (
      <>
        <div className='timeline'>
          <Controls
            keyframes={this.props.keyframes}
            selected={this.props.selected}
            currentFrame={this.props.currentFrame}
            onCurrentFrameChange={this.props.onCurrentFrameChange}
            playPause={this.props.playPause}
            isPlaying={this.props.isPlaying}
            scrollable={this._scrollable}
          />
          <div className='timeline-wrapper'>
            <div ref={this._scrollable} className='display-line'>
              <svg
                viewBox='0 0 2010 40'
                style={{ width: 2000, height: 40, backgroundColor: '#222222' }}
                onMouseMove={(e) => this.drag(e)}
                onTouchMove={(e) => this.drag(e)}
                onTouchStart={(e) => this.dragStart(e)}
                onTouchEnd={(e) => this.dragEnd(e)}
                onMouseDown={(e) => this.dragStart(e)}
                onMouseUp={(e) => this.dragEnd(e)}
                onMouseLeave={(e) => this.dragEnd(e)}
                onDragStart={() => false}
              >
                <line
                  x1={this.props.currentFrame * 10}
                  y1='0'
                  x2={this.props.currentFrame * 10}
                  y2='40'
                  style={{ stroke: '#12506b', strokeWidth: 6 }}
                />
                {this.props.keyframes &&
                  this.props.keyframes.map((kf, i) => {
                    return (
                      <svg
                        key={`kf_${i}`}
                        style={{ cursor: 'pointer' }}
                        tabIndex={i + 40}
                      >
                        <line
                          id={`kf_${i.toString()}`}
                          x1={kf.frame * 10}
                          y1='0'
                          x2={kf.frame * 10}
                          y2='40'
                          style={{ stroke: 'red', strokeWidth: 6 }}
                        />
                      </svg>
                    );
                  })}
                {this._frames.map((frame, i) => {
                  return (
                    <svg key={`tl_${i}`}>
                      {i % 5 === 0 ? (
                        <>
                          <text
                            x={i * 5 - 3}
                            y='18'
                            style={{ fontSize: 10, fill: '#555555' }}
                          >
                            {i}
                          </text>
                          <line
                            x1={i * 5}
                            y1='22'
                            x2={i * 5}
                            y2='40'
                            style={{ stroke: '#555555', strokeWidth: 0.5 }}
                          />
                        </>
                      ) : null}
                    </svg>
                  );
                })}
              </svg>
            </div>

            <div className='timeline-scroll-handle'>
              <div className='scroll-handle'>
                <div
                  className='handle'
                  ref={this._scrollbarHandle}
                  style={{ width: 300 }}
                >
                  <div className='left-grabber'>
                    <div className='grabber'></div>
                    <div className='grabber'></div>
                    <div className='grabber'></div>
                    <div className='text'>20</div>
                  </div>
                  <div
                    className='scrollbar'
                    onMouseMove={(e) => this.scrollDrag(e)}
                    onTouchMove={(e) => this.scrollDrag(e)}
                    onTouchStart={(e) => this.scrollDragStart(e)}
                    onTouchEnd={(e) => this.scrollDragEnd(e)}
                    onMouseDown={(e) => this.scrollDragStart(e)}
                    onMouseUp={(e) => this.scrollDragEnd(e)}
                    onMouseLeave={(e) => this.scrollDragEnd(e)}
                    onDragStart={() => false}
                  ></div>

                  <div className='right-grabber'>
                    <div className='text'>100</div>
                    <div className='grabber'></div>
                    <div className='grabber'></div>
                    <div className='grabber'></div>
                  </div>
                </div>
              </div>
              <div className='input-frame'>
                <input
                  type='number'
                  value={this.props.currentFrame}
                  onChange={(e) => this.handleInputChange(e)}
                ></input>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
