import * as React from 'react';
import { Vector2 } from 'babylonjs/Maths/math.vector';

interface IPlayheadProps {
  frame: number;
  offset: number;
  onCurrentFrameChange: (frame: number) => void;
}

export class Playhead extends React.Component<IPlayheadProps> {
  private _direction: number;
  private _active: boolean;
  constructor(props: IPlayheadProps) {
    super(props);
  }

  dragStart(e: React.TouchEvent<HTMLDivElement>): void;
  dragStart(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
  dragStart(e: any) {
    e.preventDefault();
    this._direction = e.clientX;
    this._active = true;
  }

  drag(e: React.TouchEvent<HTMLDivElement>): void;
  drag(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
  drag(e: any) {
    e.preventDefault();
    if (this._active) {
      let moved = e.pageX - this._direction;

      let framesToMove = Math.round(Math.abs(moved) / 2);
      console.log(framesToMove);
      if (Math.sign(moved) === -1) {
        this.props.onCurrentFrameChange(this.props.frame - 1);
      } else {
        this.props.onCurrentFrameChange(this.props.frame + 1);
      }
    }
  }

  dragEnd(e: React.TouchEvent<HTMLDivElement>): void;
  dragEnd(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
  dragEnd(e: any) {
    e.preventDefault();
    this._direction = 0;
    this._active = false;
  }

  calculateMove() {
    return `calc(${this.props.frame * this.props.offset}px - 13px)`;
  }

  moveFrameTo(e: any) {
    var svg = e.currentTarget as SVGSVGElement;
    var CTM = svg.getScreenCTM();
    let position;
    if (CTM) {
      position = new Vector2(
        (e.clientX - CTM.e) / CTM.a,
        (e.clientY - CTM.f) / CTM.d
      );
      let selectedFrame = Math.round(position.x);
      this.setState({ currentFrame: selectedFrame });
    }
  }

  render() {
    return (
      <div
        className='playhead-wrapper'
        id='playhead'
        style={{
          left: this.calculateMove(),
        }}
      >
        <div className='playhead-line'></div>
        <div
          className='playhead-handle'
          onMouseMove={(e) => this.drag(e)}
          onTouchMove={(e) => this.drag(e)}
          onTouchStart={(e) => this.dragStart(e)}
          onTouchEnd={(e) => this.dragEnd(e)}
          onMouseDown={(e) => this.dragStart(e)}
          onMouseUp={(e) => this.dragEnd(e)}
          onMouseLeave={(e) => this.dragEnd(e)}
          onDragStart={() => false}
        >
          <div className='playhead-circle'></div>
          <div className='playhead'>{this.props.frame}</div>
        </div>
      </div>
    );
  }
}
