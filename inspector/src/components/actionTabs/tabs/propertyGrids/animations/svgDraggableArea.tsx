import * as React from 'react';
import { Vector2 } from 'babylonjs/Maths/math.vector';
import { KeyframeSvgPoint, IKeyframeSvgPoint } from './keyframeSvgPoint';

interface ISvgDraggableAreaProps {
  keyframeSvgPoints: IKeyframeSvgPoint[];
  updatePosition: (updatedKeyframe: IKeyframeSvgPoint, id: string) => void;
  scale: number;
  viewBoxScale: number;
  selectKeyframe: (id: string, multiselect: boolean) => void;
  selectedControlPoint: (type: string, id: string) => void;
  deselectKeyframes: () => void;
  removeSelectedKeyframes: (points: IKeyframeSvgPoint[]) => void;
  panningY: (panningY: number) => void;
  panningX: (panningX: number) => void;
}

export class SvgDraggableArea extends React.Component<
  ISvgDraggableAreaProps,
  { panX: number; panY: number }
> {
  private _active: boolean;
  private _isCurrentPointControl: string;
  private _currentPointId: string;
  private _draggableArea: React.RefObject<SVGSVGElement>;
  private _panStart: Vector2;
  private _panStop: Vector2;

  constructor(props: ISvgDraggableAreaProps) {
    super(props);
    this._currentPointId = '';
    this._isCurrentPointControl = '';
    this._draggableArea = React.createRef();
    this._panStart = new Vector2(0, 0);
    this._panStop = new Vector2(0, 0);

    this.state = { panX: 0, panY: 0 };
  }

  componentDidMount() {
    this._draggableArea.current?.addEventListener(
      'keydown',
      this.keyDown.bind(this)
    );
    this._draggableArea.current?.addEventListener(
      'keyup',
      this.keyUp.bind(this)
    );
    setTimeout(() => {
      this._draggableArea.current?.clientWidth !== undefined
        ? this._draggableArea.current?.clientWidth
        : 0;
    }, 500);
  }

  dragStart(e: React.TouchEvent<SVGSVGElement>): void;
  dragStart(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
  dragStart(e: any): void {
    e.preventDefault();
    if (e.target.classList.contains('draggable')) {
      this._active = true;
      this._currentPointId = e.target.getAttribute('data-id');

      if (e.target.classList.contains('control-point')) {
        this._isCurrentPointControl = e.target.getAttribute('type');
      }
    }

    if (e.target.classList.contains('pannable')) {
      this._active = true;
      this._panStart.set(e.clientX, e.clientY);
    }
  }

  drag(e: React.TouchEvent<SVGSVGElement>): void;
  drag(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
  drag(e: any): void {
    if (this._active) {
      e.preventDefault();

      var coord = this.getMousePosition(e);

      if (coord !== undefined) {
        if (e.target.classList.contains('pannable')) {
          if (this._panStart.x !== 0 && this._panStart.y !== 0) {
            this._panStop.set(e.clientX, e.clientY);
            this.panDirection();
          }
        } else {
          var newPoints = [...this.props.keyframeSvgPoints];

          let point = newPoints.find((kf) => kf.id === this._currentPointId);
          if (point) {
            // Check for NaN values here.
            if (this._isCurrentPointControl === 'left') {
              point.leftControlPoint = coord;
              point.isLeftActive = true;
            } else if (this._isCurrentPointControl === 'right') {
              point.rightControlPoint = coord;
              point.isRightActive = true;
            } else {
              point.keyframePoint = coord;
            }
            this.props.updatePosition(point, this._currentPointId);
          }
        }
      }
    }
  }

  dragEnd(e: React.TouchEvent<SVGSVGElement>): void;
  dragEnd(e: React.MouseEvent<SVGSVGElement, MouseEvent>): void;
  dragEnd(e: any): void {
    e.preventDefault();
    this._active = false;
    this._currentPointId = '';
    this._isCurrentPointControl = '';
    this._panStart.set(0, 0);
    this._panStop.set(0, 0);
  }

  getMousePosition(e: React.TouchEvent<SVGSVGElement>): Vector2 | undefined;
  getMousePosition(
    e: React.MouseEvent<SVGSVGElement, MouseEvent>
  ): Vector2 | undefined;
  getMousePosition(e: any): Vector2 | undefined {
    if (e.touches) {
      e = e.touches[0];
    }

    if (this._draggableArea.current) {
      var svg = this._draggableArea.current as SVGSVGElement;
      var CTM = svg.getScreenCTM();
      if (CTM) {
        return new Vector2(
          (e.clientX - CTM.e) / CTM.a,
          (e.clientY - CTM.f) / CTM.d
        );
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  panDirection() {
    let movementX = this._panStart.x - this._panStop.x;
    let movementY = this._panStart.y - this._panStop.y;

    let newX = this.state.panX + movementX / 20;
    let newY = this.state.panY + movementY / 20;

    this.setState({
      panX: Math.round(newX),
      panY: Math.round(newY),
    });
    this.props.panningY(Math.round(newY));
    this.props.panningX(Math.round(newX));

    console.log(Math.round(newX));
  }

  panTo(direction: string, value: number) {
    switch (direction) {
      case 'left':
        (this._draggableArea.current
          ?.parentElement as HTMLDivElement).scrollLeft -= value * 1;
        break;
      case 'right':
        (this._draggableArea.current
          ?.parentElement as HTMLDivElement).scrollLeft += value * 1;
        break;
      case 'top':
        break;
      case 'down':
        break;
    }
  }

  keyDown(e: KeyboardEvent) {
    e.preventDefault();
    if (e.keyCode === 17) {
      this._draggableArea.current?.style.setProperty('cursor', 'grab');
    }
  }

  keyUp(e: KeyboardEvent) {
    e.preventDefault();
    if (e.keyCode === 17) {
      this._draggableArea.current?.style.setProperty('cursor', 'initial');
    }

    if (e.keyCode === 8) {
      const pointsToDelete = this.props.keyframeSvgPoints.filter(
        (kf) => kf.selected
      );
      this.props.removeSelectedKeyframes(pointsToDelete);
    }
  }

  focus(e: React.MouseEvent<SVGSVGElement>) {
    e.preventDefault();
    this._draggableArea.current?.focus();

    if ((e.target as SVGSVGElement).className.baseVal == 'linear pannable') {
      if (this.isControlPointActive()) {
        this.props.deselectKeyframes();
      }
    }
  }

  isControlPointActive() {
    const activeControlPoints = this.props.keyframeSvgPoints.filter(
      (x) => x.isLeftActive || x.isRightActive
    );
    if (activeControlPoints.length !== 0) {
      return false;
    } else {
      return true;
    }
  }

  render() {
    return (
      <>
        <svg
          style={{ width: 30, height: 364, position: 'absolute', zIndex: 1 }}
        >
          <rect x='0' y='0' width='30px' height='100%' fill='#ffffff1c'></rect>
        </svg>
        <svg
          className='linear pannable'
          ref={this._draggableArea}
          tabIndex={0}
          onMouseMove={(e) => this.drag(e)}
          onTouchMove={(e) => this.drag(e)}
          onTouchStart={(e) => this.dragStart(e)}
          onTouchEnd={(e) => this.dragEnd(e)}
          onMouseDown={(e) => this.dragStart(e)}
          onMouseUp={(e) => this.dragEnd(e)}
          onMouseLeave={(e) => this.dragEnd(e)}
          onClick={(e) => this.focus(e)}
          viewBox={`${this.state.panX} ${this.state.panY} ${Math.round(
            this.props.scale * 200
          )} ${Math.round(this.props.scale * 100)}`}
        >
          {this.props.children}

          {this.props.keyframeSvgPoints.map((keyframe, i) => (
            <KeyframeSvgPoint
              key={`${keyframe.id}_${i}`}
              id={keyframe.id}
              keyframePoint={keyframe.keyframePoint}
              leftControlPoint={keyframe.leftControlPoint}
              rightControlPoint={keyframe.rightControlPoint}
              isLeftActive={keyframe.isLeftActive}
              isRightActive={keyframe.isRightActive}
              selected={keyframe.selected}
              selectedControlPoint={(type: string, id: string) =>
                this.props.selectedControlPoint(type, id)
              }
              selectKeyframe={(id: string, multiselect: boolean) =>
                this.props.selectKeyframe(id, multiselect)
              }
            />
          ))}
        </svg>
      </>
    );
  }
}
