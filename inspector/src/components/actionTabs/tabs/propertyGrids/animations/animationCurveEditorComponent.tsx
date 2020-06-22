import * as React from 'react';
import { Animation } from 'babylonjs/Animations/animation';
import { Vector2, Vector3, Quaternion } from 'babylonjs/Maths/math.vector';
import { Color3, Color4 } from 'babylonjs/Maths/math.color';
import { Size } from 'babylonjs/Maths/math.size';
import { EasingFunction } from 'babylonjs/Animations/easing';
import { IAnimationKey } from 'babylonjs/Animations/animationKey';
import { IKeyframeSvgPoint } from './keyframeSvgPoint';
import { SvgDraggableArea } from './svgDraggableArea';
import { Timeline } from './timeline';
import { Playhead } from './playhead';
import { Notification } from './notification';
import { GraphActionsBar } from './graphActionsBar';
import { Scene } from 'babylonjs/scene';
import { IAnimatable } from 'babylonjs/Animations/animatable.interface';
import { Animatable } from 'babylonjs/Animations/animatable';
import { TargetedAnimation } from 'babylonjs/Animations/animationGroup';
import { EditorControls } from './editorControls';
import { SelectedCoordinate } from './animationListTree';
import { LockObject } from '../lockObject';
import { GlobalState } from '../../../../globalState';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';

require('./curveEditor.scss');

interface IAnimationCurveEditorComponentProps {
  close: (event: any) => void;
  playOrPause?: () => void;
  scene: Scene;
  entity: IAnimatable | TargetedAnimation;
  lockObject: LockObject;
  globalState: GlobalState;
}

interface ICanvasAxis {
  value: number;
  label: number;
}

interface ICurveData {
  pathData: string;
  pathLength: number;
  domCurve: React.RefObject<SVGPathElement>;
  color: string;
  id: string;
}

export class AnimationCurveEditorComponent extends React.Component<
  IAnimationCurveEditorComponentProps,
  {
    isOpen: boolean;
    selected: Animation | null;
    svgKeyframes: IKeyframeSvgPoint[] | undefined;
    currentFrame: number;
    currentValue: number;
    frameAxisLength: ICanvasAxis[];
    valueAxisLength: ICanvasAxis[];
    isFlatTangentMode: boolean;
    isTangentMode: boolean;
    isBrokenMode: boolean;
    lerpMode: boolean;
    scale: number;
    playheadOffset: number;
    notification: string;
    currentPoint: SVGPoint | undefined;
    playheadPos: number;
    isPlaying: boolean;
    selectedPathData: ICurveData[] | undefined;
    selectedCoordinate: number;
    animationLimit: number;
  }
> {
  private _snippetUrl = 'https://snippet.babylonjs.com';
  // Height scale *Review this functionaliy
  private _heightScale: number = 100;
  // Canvas Length *Review this functionality
  readonly _entityName: string;
  readonly _canvasLength: number = 20;
  private _svgKeyframes: IKeyframeSvgPoint[] = [];
  private _isPlaying: boolean = false;
  private _graphCanvas: React.RefObject<HTMLDivElement>;
  //private _selectedCurve: React.RefObject<SVGPathElement>;
  private _svgCanvas: React.RefObject<SvgDraggableArea>;
  private _isTargetedAnimation: boolean;

  private _onBeforeRenderObserver: Nullable<Observer<Scene>>;
  private _mainAnimatable: Nullable<Animatable>;
  constructor(props: IAnimationCurveEditorComponentProps) {
    super(props);
    this._entityName = (this.props.entity as any).id;
    // Review is we really need this refs
    this._graphCanvas = React.createRef();
    //this._selectedCurve = React.createRef();
    this._svgCanvas = React.createRef();

    console.log(this.props.entity instanceof TargetedAnimation);

    let initialSelection;
    let initialPathData;
    let initialLerpMode;
    if (this.props.entity instanceof TargetedAnimation) {
      this._isTargetedAnimation = true;
      initialSelection = this.props.entity.animation;
      initialLerpMode =
        initialSelection !== undefined
          ? this.analizeAnimationForLerp(initialSelection)
          : false;
      initialPathData =
        initialSelection !== undefined
          ? this.getPathData(initialSelection)
          : undefined;
    } else {
      this._isTargetedAnimation = false;

      let hasAnimations =
        this.props.entity.animations !== undefined ||
        this.props.entity.animations !== null
          ? this.props.entity.animations
          : false;
      initialSelection =
        hasAnimations !== false ? hasAnimations && hasAnimations[0] : null;

      initialLerpMode =
        initialSelection !== undefined
          ? this.analizeAnimationForLerp(
              this.props.entity.animations && initialSelection
            )
          : false;
      initialPathData = initialSelection && this.getPathData(initialSelection);
      initialPathData =
        initialPathData === null || initialPathData === undefined
          ? undefined
          : initialPathData;
    }

    // will update this until we have a top scroll/zoom feature
    let valueInd = [2, 1.8, 1.6, 1.4, 1.2, 1, 0.8, 0.6, 0.4, 0.2, 0];
    this.state = {
      selected: initialSelection,
      isOpen: true,
      svgKeyframes: this._svgKeyframes,
      currentFrame: 0,
      currentValue: 1,
      isFlatTangentMode: false,
      isTangentMode: false,
      isBrokenMode: false,
      lerpMode: initialLerpMode,
      playheadOffset: this._graphCanvas.current
        ? this._graphCanvas.current.children[0].clientWidth /
          (this._canvasLength * 10)
        : 0,
      frameAxisLength: new Array(this._canvasLength).fill(0).map((s, i) => {
        return { value: i * 10, label: i * 10 };
      }),
      valueAxisLength: new Array(10).fill(0).map((s, i) => {
        return { value: i * 10, label: valueInd[i] };
      }),
      notification: '',
      currentPoint: undefined,
      scale: 1,
      playheadPos: 0,
      isPlaying: this.isAnimationPlaying(),
      selectedPathData: initialPathData,
      selectedCoordinate: 0,
      animationLimit: 100,
    };
  }

  componentDidMount() {
    setTimeout(() => this.resetPlayheadOffset(), 500);
  }

  /**
   * Notifications
   * To add notification we set the state and clear to make the notification bar hide.
   */
  clearNotification() {
    this.setState({ notification: '' });
  }

  /**
   * Zoom and Scroll
   * This section handles zoom and scroll
   * of the graph area.
   */
  zoom(e: React.WheelEvent<HTMLDivElement>) {
    e.nativeEvent.stopImmediatePropagation();
    //console.log(e.deltaY);
    let scaleX = 1;
    if (Math.sign(e.deltaY) === -1) {
      scaleX = this.state.scale - 0.01;
    } else {
      scaleX = this.state.scale + 0.01;
    }

    this.setState({ scale: scaleX }, this.setAxesLength);
  }

  setAxesLength() {
    let length = 20;
    let newlength = Math.round(this._canvasLength * this.state.scale); // Check Undefined, or NaN
    if (!isNaN(newlength) || newlength !== undefined) {
      length = newlength;
    }
    let highestFrame = 100;
    if (this.state.selected !== null && this.state.selected !== undefined) {
      highestFrame = this.state.selected.getHighestFrame();
    }

    if (length < (highestFrame * 2) / 10) {
      length = Math.round((highestFrame * 2) / 10);
    }

    let valueLines = Math.round((this.state.scale * this._heightScale) / 10);
    console.log(highestFrame);
    let newFrameLength = new Array(length).fill(0).map((s, i) => {
      return { value: i * 10, label: i * 10 };
    });
    let newValueLength = new Array(valueLines).fill(0).map((s, i) => {
      return { value: i * 10, label: this.getValueLabel(i * 10) };
    });
    this.setState({
      frameAxisLength: newFrameLength,
      valueAxisLength: newValueLength,
    });
    this.resetPlayheadOffset();
  }

  getValueLabel(i: number) {
    // Need to update this when Y axis grows
    let label = 0;
    if (i === 0) {
      label = 2;
    }
    if (i === 50) {
      label = 1;
    } else {
      label = (100 - i * 2) * 0.01 + 1;
    }
    return label;
  }

  resetPlayheadOffset() {
    if (this._graphCanvas && this._graphCanvas.current) {
      this.setState({
        playheadOffset:
          this._graphCanvas.current.children[0].clientWidth /
          (this._canvasLength * 10 * this.state.scale),
      });
    }
  }

  /**
   * Keyframe Manipulation
   * This section handles events from SvgDraggableArea.
   */
  selectKeyframe(id: string) {
    let updatedKeyframes = this.state.svgKeyframes?.map((kf) => {
      if (kf.id === id) {
        kf.selected = !kf.selected;
      }
      return kf;
    });
    this.setState({ svgKeyframes: updatedKeyframes });
  }

  selectedControlPoint(type: string, id: string) {
    let updatedKeyframes = this.state.svgKeyframes?.map((kf) => {
      if (kf.id === id) {
        this.setState({ isFlatTangentMode: false });
        if (type === 'left') {
          kf.isLeftActive = !kf.isLeftActive;
          kf.isRightActive = false;
        }
        if (type === 'right') {
          kf.isRightActive = !kf.isRightActive;
          kf.isLeftActive = false;
        }
      }
      return kf;
    });
    this.setState({ svgKeyframes: updatedKeyframes });
  }

  updateValuePerCoordinate(
    dataType: number,
    value: number | Vector2 | Vector3 | Color3 | Color4 | Size | Quaternion,
    newValue: number,
    coordinate?: number
  ) {
    if (dataType === Animation.ANIMATIONTYPE_FLOAT) {
      value = newValue;
    }

    if (dataType === Animation.ANIMATIONTYPE_VECTOR2) {
      switch (coordinate) {
        case SelectedCoordinate.x:
          (value as Vector2).x = newValue;
          break;
        case SelectedCoordinate.y:
          (value as Vector2).y = newValue;
          break;
      }
    }

    if (dataType === Animation.ANIMATIONTYPE_VECTOR3) {
      switch (coordinate) {
        case SelectedCoordinate.x:
          (value as Vector3).x = newValue;
          break;
        case SelectedCoordinate.y:
          (value as Vector3).y = newValue;
          break;
        case SelectedCoordinate.z:
          (value as Vector3).z = newValue;
          break;
      }
    }

    if (dataType === Animation.ANIMATIONTYPE_QUATERNION) {
      switch (coordinate) {
        case SelectedCoordinate.x:
          (value as Quaternion).x = newValue;
          break;
        case SelectedCoordinate.y:
          (value as Quaternion).y = newValue;
          break;
        case SelectedCoordinate.z:
          (value as Quaternion).z = newValue;
          break;
        case SelectedCoordinate.w:
          (value as Quaternion).w = newValue;
          break;
      }
    }

    if (dataType === Animation.ANIMATIONTYPE_COLOR3) {
      switch (coordinate) {
        case SelectedCoordinate.r:
          (value as Color3).r = newValue;
          break;
        case SelectedCoordinate.g:
          (value as Color3).g = newValue;
          break;
        case SelectedCoordinate.b:
          (value as Color3).b = newValue;
          break;
      }
    }

    if (dataType === Animation.ANIMATIONTYPE_COLOR4) {
      switch (coordinate) {
        case SelectedCoordinate.r:
          (value as Color4).r = newValue;
          break;
        case SelectedCoordinate.g:
          (value as Color4).g = newValue;
          break;
        case SelectedCoordinate.b:
          (value as Color4).b = newValue;
          break;
        case SelectedCoordinate.a:
          (value as Color4).a = newValue;
          break;
      }
    }

    if (dataType === Animation.ANIMATIONTYPE_SIZE) {
      switch (coordinate) {
        case SelectedCoordinate.width:
          (value as Size).width = newValue;
          break;
        case SelectedCoordinate.g:
          (value as Size).height = newValue;
          break;
      }
    }

    return value;
  }

  renderPoints(updatedSvgKeyFrame: IKeyframeSvgPoint, id: string) {
    let animation = this.state.selected as Animation;
    // Bug: After play/stop we get an extra keyframe at 0
    let index = parseInt(id.split('_')[3]);

    let coordinate = parseInt(id.split('_')[2]);

    let keys = [...animation.getKeys()];

    let newFrame = 0;
    if (updatedSvgKeyFrame.keyframePoint.x !== 0) {
      if (
        updatedSvgKeyFrame.keyframePoint.x > 0 &&
        updatedSvgKeyFrame.keyframePoint.x < 1
      ) {
        newFrame = 1;
      } else {
        newFrame = Math.round(updatedSvgKeyFrame.keyframePoint.x);
      }
    }

    keys[index].frame = newFrame; // This value comes as percentage/frame/time

    // Calculate value for Vector3...

    let updatedValue =
      ((this._heightScale - updatedSvgKeyFrame.keyframePoint.y) /
        this._heightScale) *
      2; // this value comes inverted svg from 0 = 100 to 100 = 0

    keys[index].value = this.updateValuePerCoordinate(
      animation.dataType,
      keys[index].value,
      updatedValue,
      coordinate
    );

    if (updatedSvgKeyFrame.isLeftActive) {
      if (updatedSvgKeyFrame.leftControlPoint !== null) {
        // Rotate
        let newValue =
          ((this._heightScale - updatedSvgKeyFrame.leftControlPoint.y) /
            this._heightScale) *
          2;

        let keyframeValue =
          ((this._heightScale - updatedSvgKeyFrame.keyframePoint.y) /
            this._heightScale) *
          2;

        let updatedValue = keyframeValue - newValue;

        keys[index].inTangent = this.updateValuePerCoordinate(
          animation.dataType,
          keys[index].inTangent,
          updatedValue,
          coordinate
        );

        if (!this.state.isBrokenMode) {
          // Right control point if exists
          if (updatedSvgKeyFrame.rightControlPoint !== null) {
            // Sets opposite value
            keys[index].outTangent = keys[index].inTangent * -1;
          }
        }
      }
    }

    if (updatedSvgKeyFrame.isRightActive) {
      if (updatedSvgKeyFrame.rightControlPoint !== null) {
        // Rotate
        let newValue =
          ((this._heightScale - updatedSvgKeyFrame.rightControlPoint.y) /
            this._heightScale) *
          2;

        let keyframeValue =
          ((this._heightScale - updatedSvgKeyFrame.keyframePoint.y) /
            this._heightScale) *
          2;

        let updatedValue = keyframeValue - newValue;

        keys[index].outTangent = this.updateValuePerCoordinate(
          animation.dataType,
          keys[index].outTangent,
          updatedValue,
          coordinate
        );

        if (!this.state.isBrokenMode) {
          if (updatedSvgKeyFrame.leftControlPoint !== null) {
            // Sets opposite value
            keys[index].inTangent = keys[index].outTangent * -1;
          }
        }
      }
    }

    animation.setKeys(keys);

    this.selectAnimation(animation, coordinate);
  }

  /**
   * Actions
   * This section handles events from GraphActionsBar.
   */
  handleFrameChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.preventDefault();
    this.changeCurrentFrame(parseInt(event.target.value));
  }

  handleValueChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.preventDefault();
    this.setState({ currentValue: parseFloat(event.target.value) }, () => {
      if (this.state.selected !== null) {
        let animation = this.state.selected;
        let keys = animation.getKeys();

        let isKeyframe = keys.find((k) => k.frame === this.state.currentFrame);
        if (isKeyframe) {
          let updatedKeys = keys.map((k) => {
            if (k.frame === this.state.currentFrame) {
              k.value = this.state.currentValue;
            }
            return k;
          });
          this.state.selected.setKeys(updatedKeys);
          this.selectAnimation(animation);
        }
      }
    });
  }

  setFlatTangent() {
    if (this.state.selected !== null) {
      let animation = this.state.selected;
      this.setState({ isFlatTangentMode: !this.state.isFlatTangentMode }, () =>
        this.selectAnimation(animation)
      );
    }
  }

  // Use this for Bezier curve mode
  setTangentMode() {
    if (this.state.selected !== null) {
      let animation = this.state.selected;
      this.setState({ isTangentMode: !this.state.isTangentMode }, () =>
        this.selectAnimation(animation)
      );
    }
  }

  setBrokenMode() {
    if (this.state.selected !== null) {
      let animation = this.state.selected;
      this.setState({ isBrokenMode: !this.state.isBrokenMode }, () =>
        this.selectAnimation(animation)
      );
    }
  }

  setLerpMode() {
    if (this.state.selected !== null) {
      let animation = this.state.selected;
      this.setState({ lerpMode: !this.state.lerpMode }, () =>
        this.selectAnimation(animation)
      );
    }
  }

  addKeyframeClick() {
    if (this.state.selected !== null) {
      let currentAnimation = this.state.selected;

      if (currentAnimation.dataType === Animation.ANIMATIONTYPE_FLOAT) {
        let keys = currentAnimation.getKeys();
        let x = this.state.currentFrame;
        let y = this.state.currentValue;

        keys.push({ frame: x, value: y, inTangent: 0, outTangent: 0 });
        keys.sort((a, b) => a.frame - b.frame);

        currentAnimation.setKeys(keys);

        this.selectAnimation(currentAnimation);
      }
    }
  }

  removeKeyframeClick() {
    if (this.state.selected !== null) {
      let currentAnimation = this.state.selected;

      if (currentAnimation.dataType === Animation.ANIMATIONTYPE_FLOAT) {
        let keys = currentAnimation.getKeys();
        let x = this.state.currentFrame;
        let filteredKeys = keys.filter((kf) => kf.frame !== x);

        currentAnimation.setKeys(filteredKeys);

        this.selectAnimation(currentAnimation);
      }
    }
  }

  addKeyFrame(event: React.MouseEvent<SVGSVGElement>) {
    event.preventDefault();

    if (this.state.selected !== null) {
      var svg = event.target as SVGSVGElement;

      var pt = svg.createSVGPoint();

      pt.x = event.clientX;
      pt.y = event.clientY;

      var inverse = svg.getScreenCTM()?.inverse();

      var cursorpt = pt.matrixTransform(inverse);

      var currentAnimation = this.state.selected;

      var keys = currentAnimation.getKeys();

      var height = 100;
      var middle = height / 2;

      var keyValue;

      if (cursorpt.y < middle) {
        keyValue = 1 + (100 / cursorpt.y) * 0.1;
      }

      if (cursorpt.y > middle) {
        keyValue = 1 - (100 / cursorpt.y) * 0.1;
      }

      keys.push({ frame: cursorpt.x, value: keyValue });

      currentAnimation.setKeys(keys);

      this.selectAnimation(currentAnimation);
    }
  }

  /**
   * Curve Rendering Functions
   * This section handles how to render curves.
   */
  linearInterpolation(
    keyframes: IAnimationKey[],
    data: string,
    middle: number
  ): string {
    keyframes.forEach((key, i) => {
      // identify type of value and split...
      var point = new Vector2(0, 0);
      point.x = key.frame;
      point.y = this._heightScale - key.value * middle;
      this.setKeyframePointLinear(point, i);

      if (i !== 0) {
        data += ` L${point.x} ${point.y}`;
      }
    });
    return data;
  }

  setKeyframePointLinear(point: Vector2, index: number) {
    // here set the ID to a unique id
    let svgKeyframe = {
      keyframePoint: point,
      rightControlPoint: null,
      leftControlPoint: null,
      id: index.toString(),
      selected: false,
      isLeftActive: false,
      isRightActive: false,
    };
    this._svgKeyframes.push(svgKeyframe);
  }

  flatTangents(keyframes: IAnimationKey[], dataType: number) {
    // Checks if Flat Tangent is active (tangents are set to zero)
    let flattened;
    if (this.state && this.state.isFlatTangentMode) {
      flattened = keyframes.map((kf) => {
        if (kf.inTangent !== undefined) {
          kf.inTangent = this.returnZero(dataType);
        }

        if (kf.outTangent !== undefined) {
          kf.outTangent = this.returnZero(dataType);
        }
        return kf;
      });
    } else {
      flattened = keyframes;
    }
    return flattened;
  }

  returnZero(dataType: number) {
    let type;
    switch (dataType) {
      case Animation.ANIMATIONTYPE_FLOAT:
        type = 0;
        break;
      case Animation.ANIMATIONTYPE_VECTOR3:
        type = Vector3.Zero();
        break;
      case Animation.ANIMATIONTYPE_VECTOR2:
        type = Vector2.Zero();
        break;
      case Animation.ANIMATIONTYPE_QUATERNION:
        type = Quaternion.Zero();
        break;
      case Animation.ANIMATIONTYPE_COLOR3:
        type = new Color3(0, 0, 0);
        break;
      case Animation.ANIMATIONTYPE_COLOR4:
        type = new Color4(0, 0, 0, 0);
        break;
      case Animation.ANIMATIONTYPE_SIZE:
        type = new Size(0, 0);
        break;
    }
    return type;
  }

  getValueAsArray(
    valueType: number,
    value: number | Vector2 | Vector3 | Color3 | Color4 | Size | Quaternion
  ) {
    let valueAsArray: number[] = [];
    switch (valueType) {
      case Animation.ANIMATIONTYPE_FLOAT:
        valueAsArray = [value as number];
        break;
      case Animation.ANIMATIONTYPE_VECTOR3:
        valueAsArray = (value as Vector3).asArray();
        break;
      case Animation.ANIMATIONTYPE_VECTOR2:
        valueAsArray = (value as Vector2).asArray();
        break;
      case Animation.ANIMATIONTYPE_QUATERNION:
        valueAsArray = (value as Quaternion).asArray();
        break;
      case Animation.ANIMATIONTYPE_COLOR3:
        valueAsArray = (value as Color3).asArray();
        break;
      case Animation.ANIMATIONTYPE_COLOR4:
        valueAsArray = (value as Color4).asArray();
        break;
      case Animation.ANIMATIONTYPE_SIZE:
        valueAsArray = [(value as Size).width, (value as Size).height];
        break;
    }
    return valueAsArray;
  }

  getPathData(animation: Animation | null) {
    if (animation === null) {
      return undefined;
    }

    var keyframes = animation.getKeys();

    if (keyframes === undefined) {
      return undefined;
    } else {
      const {
        easingMode,
        easingType,
        usesTangents,
        valueType,
        highestFrame,
        name,
        targetProperty,
      } = this.getAnimationData(animation);

      keyframes = this.flatTangents(keyframes, valueType);
      const startKey = keyframes[0];
      let middle = this._heightScale / 2;
      let collection: ICurveData[] = [];
      const colors = ['red', 'green', 'blue', 'white', '#7a4ece'];
      const startValue = this.getValueAsArray(valueType, startKey.value);

      for (var d = 0; d < startValue.length; d++) {
        const id = `${name}_${targetProperty}_${d}`;

        const curveColor =
          valueType === Animation.ANIMATIONTYPE_FLOAT ? colors[4] : colors[d];
        // START OF LINE/CURVE
        let data: string | undefined = `M${startKey.frame}, ${
          this._heightScale - startValue[d] * middle
        }`; //

        if (this.state && this.state.lerpMode) {
          data = this.linearInterpolation(keyframes, data, middle);
        } else {
          if (usesTangents) {
            data = this.curvePathWithTangents(
              keyframes,
              data,
              middle,
              valueType,
              d,
              id
            );
          } else {
            if (easingType !== undefined && easingMode !== undefined) {
              let easingFunction = animation.getEasingFunction();
              data = this.curvePath(
                keyframes,
                data,
                middle,
                easingFunction as EasingFunction
              );
            } else {
              if (this.state !== undefined) {
                let emptyTangents = keyframes.map((kf, i) => {
                  if (i === 0) {
                    kf.outTangent = this.returnZero(valueType);
                  } else if (i === keyframes.length - 1) {
                    kf.inTangent = this.returnZero(valueType);
                  } else {
                    kf.inTangent = this.returnZero(valueType);
                    kf.outTangent = this.returnZero(valueType);
                  }
                  return kf;
                });
                data = this.curvePathWithTangents(
                  emptyTangents,
                  data,
                  middle,
                  valueType,
                  d,
                  id
                );
              } else {
                data = this.linearInterpolation(keyframes, data, middle);
              }
            }
          }
        }

        collection.push({
          pathData: data,
          pathLength: highestFrame,
          domCurve: React.createRef(),
          color: curveColor,
          id: id,
        });
      }

      return collection;
    }
  }

  getAnimationData(animation: Animation) {
    // General Props
    let loopMode = animation.loopMode;
    let name = animation.name;
    let blendingSpeed = animation.blendingSpeed;
    let targetProperty = animation.targetProperty;
    let targetPropertyPath = animation.targetPropertyPath;
    let framesPerSecond = animation.framePerSecond;
    let highestFrame = animation.getHighestFrame();
    //let serialized = animation.serialize();
    let usesTangents =
      animation
        .getKeys()
        .find(
          (kf) =>
            kf.hasOwnProperty('inTangent') || kf.hasOwnProperty('outTangent')
        ) !== undefined
        ? true
        : false;
    let valueType = animation.dataType;
    // easing properties
    let easingType, easingMode;
    let easingFunction: EasingFunction = animation.getEasingFunction() as EasingFunction;
    if (easingFunction === undefined) {
      easingType = undefined;
      easingMode = undefined;
    } else {
      easingType = easingFunction.constructor.name;
      easingMode = easingFunction.getEasingMode();
    }

    return {
      loopMode,
      name,
      blendingSpeed,
      targetPropertyPath,
      targetProperty,
      framesPerSecond,
      highestFrame,
      usesTangents,
      easingType,
      easingMode,
      valueType,
    };
  }

  curvePathWithTangents(
    keyframes: IAnimationKey[],
    data: string,
    middle: number,
    type: number,
    coordinate: number,
    animationName: string
  ) {
    keyframes.forEach((key, i) => {
      // Create a unique id for curve
      const curveId = animationName + '_' + i;

      // identify type of value and split...
      const keyframe_valueAsArray = this.getValueAsArray(type, key.value)[
        coordinate
      ];

      let svgKeyframe;
      let outTangent;
      let inTangent;
      let defaultWeight = 5;

      var inT =
        key.inTangent === undefined
          ? null
          : this.getValueAsArray(type, key.inTangent)[coordinate];
      var outT =
        key.outTangent === undefined
          ? null
          : this.getValueAsArray(type, key.outTangent)[coordinate];

      let y = this._heightScale - keyframe_valueAsArray * middle;

      let nextKeyframe = keyframes[i + 1];
      let prevKeyframe = keyframes[i - 1];
      if (nextKeyframe !== undefined) {
        let distance = keyframes[i + 1].frame - key.frame;
        defaultWeight = distance * 0.33;
      }

      if (prevKeyframe !== undefined) {
        let distance = key.frame - keyframes[i - 1].frame;
        defaultWeight = distance * 0.33;
      }

      if (inT !== null) {
        let valueIn = y * inT + y;
        inTangent = new Vector2(key.frame - defaultWeight, valueIn);
      } else {
        inTangent = null;
      }

      if (outT !== null) {
        let valueOut = y * outT + y;
        outTangent = new Vector2(key.frame + defaultWeight, valueOut);
      } else {
        outTangent = null;
      }

      if (i === 0) {
        svgKeyframe = {
          keyframePoint: new Vector2(
            key.frame,
            this._heightScale - keyframe_valueAsArray * middle
          ),
          rightControlPoint: outTangent,
          leftControlPoint: null,
          id: curveId,
          selected: false,
          isLeftActive: false,
          isRightActive: false,
        };
        if (outTangent !== null) {
          data += ` C${outTangent.x} ${outTangent.y} `;
        }
      } else {
        svgKeyframe = {
          keyframePoint: new Vector2(
            key.frame,
            this._heightScale - keyframe_valueAsArray * middle
          ),
          rightControlPoint: outTangent,
          leftControlPoint: inTangent,
          id: curveId,
          selected: false,
          isLeftActive: false,
          isRightActive: false,
        };

        if (outTangent !== null && inTangent !== null) {
          data += ` ${inTangent.x} ${inTangent.y} ${svgKeyframe.keyframePoint.x} ${svgKeyframe.keyframePoint.y} C${outTangent.x} ${outTangent.y} `;
        } else if (inTangent !== null) {
          data += ` ${inTangent.x} ${inTangent.y} ${svgKeyframe.keyframePoint.x} ${svgKeyframe.keyframePoint.y} `;
        }
      }

      if (this.state) {
        let prev = this.state.svgKeyframes?.find((kf) => kf.id === curveId);
        if (prev) {
          svgKeyframe.isLeftActive = prev?.isLeftActive;
          svgKeyframe.isRightActive = prev?.isRightActive;
          svgKeyframe.selected = prev?.selected;
        }
      }

      this._svgKeyframes.push(svgKeyframe);
    }, this);

    return data;
  }

  curvePath(
    keyframes: IAnimationKey[],
    data: string,
    middle: number,
    easingFunction: EasingFunction
  ) {
    // This will get 1/4 and 3/4 of points in eased curve
    const u = 0.25;
    const v = 0.75;

    keyframes.forEach((key, i) => {
      // identify type of value and split...

      // Gets previous initial point of curve segment
      var pointA = new Vector2(0, 0);
      if (i === 0) {
        pointA.x = key.frame;
        pointA.y = this._heightScale - key.value * middle;

        this.setKeyframePoint([pointA], i, keyframes.length);
      } else {
        pointA.x = keyframes[i - 1].frame;
        pointA.y = this._heightScale - keyframes[i - 1].value * middle;

        // Gets the end point of this curve segment
        var pointB = new Vector2(
          key.frame,
          this._heightScale - key.value * middle
        );

        // Get easing value of percentage to get the bezier control points below
        let du = easingFunction.easeInCore(u); // What to do here, when user edits the curve? Option 1: Modify the curve with the new control points as BezierEaseCurve(x,y,z,w)
        let dv = easingFunction.easeInCore(v); // Option 2: Create a easeInCore function and adapt it with the new control points values... needs more revision.

        // Direction of curve up/down
        let yInt25 = 0;
        if (pointB.y > pointA.y) {
          // if pointB.y > pointA.y = goes down
          yInt25 = (pointB.y - pointA.y) * du + pointA.y;
        } else if (pointB.y < pointA.y) {
          // if pointB.y < pointA.y = goes up
          yInt25 = pointA.y - (pointA.y - pointB.y) * du;
        }

        let yInt75 = 0;
        if (pointB.y > pointA.y) {
          yInt75 = (pointB.y - pointA.y) * dv + pointA.y;
        } else if (pointB.y < pointA.y) {
          yInt75 = pointA.y - (pointA.y - pointB.y) * dv;
        }

        // Intermediate points in curve
        let intermediatePoint25 = new Vector2(
          (pointB.x - pointA.x) * u + pointA.x,
          yInt25
        );
        let intermediatePoint75 = new Vector2(
          (pointB.x - pointA.x) * v + pointA.x,
          yInt75
        );

        // Gets the four control points of bezier curve
        let controlPoints = this.interpolateControlPoints(
          pointA,
          intermediatePoint25,
          u,
          intermediatePoint75,
          v,
          pointB
        );

        if (controlPoints === undefined) {
          console.log('error getting bezier control points');
        } else {
          this.setKeyframePoint(controlPoints, i, keyframes.length);

          data += ` C${controlPoints[1].x} ${controlPoints[1].y} ${controlPoints[2].x} ${controlPoints[2].y} ${controlPoints[3].x} ${controlPoints[3].y}`;
        }
      }
    });

    return data;
  }

  setKeyframePoint(
    controlPoints: Vector2[],
    index: number,
    keyframesCount: number
  ) {
    let svgKeyframe;
    if (index === 0) {
      svgKeyframe = {
        keyframePoint: controlPoints[0],
        rightControlPoint: null,
        leftControlPoint: null,
        id: index.toString(),
        selected: false,
        isLeftActive: false,
        isRightActive: false,
      };
    } else {
      this._svgKeyframes[index - 1].rightControlPoint = controlPoints[1];
      svgKeyframe = {
        keyframePoint: controlPoints[3],
        rightControlPoint: null,
        leftControlPoint: controlPoints[2],
        id: index.toString(),
        selected: false,
        isLeftActive: false,
        isRightActive: false,
      };
    }

    this._svgKeyframes.push(svgKeyframe);
  }

  interpolateControlPoints(
    p0: Vector2,
    p1: Vector2,
    u: number,
    p2: Vector2,
    v: number,
    p3: Vector2
  ): Vector2[] | undefined {
    let a = 0.0;
    let b = 0.0;
    let c = 0.0;
    let d = 0.0;
    let det = 0.0;
    let q1: Vector2 = new Vector2();
    let q2: Vector2 = new Vector2();
    let controlA: Vector2 = p0;
    let controlB: Vector2 = new Vector2();
    let controlC: Vector2 = new Vector2();
    let controlD: Vector2 = p3;

    if (u <= 0.0 || u >= 1.0 || v <= 0.0 || v >= 1.0 || u >= v) {
      return undefined;
    }

    a = 3 * (1 - u) * (1 - u) * u;
    b = 3 * (1 - u) * u * u;
    c = 3 * (1 - v) * (1 - v) * v;
    d = 3 * (1 - v) * v * v;
    det = a * d - b * c;

    if (det == 0.0) return undefined;

    q1.x = p1.x - ((1 - u) * (1 - u) * (1 - u) * p0.x + u * u * u * p3.x);
    q1.y = p1.y - ((1 - u) * (1 - u) * (1 - u) * p0.y + u * u * u * p3.y);

    q2.x = p2.x - ((1 - v) * (1 - v) * (1 - v) * p0.x + v * v * v * p3.x);
    q2.y = p2.y - ((1 - v) * (1 - v) * (1 - v) * p0.y + v * v * v * p3.y);

    controlB.x = (d * q1.x - b * q2.x) / det;
    controlB.y = (d * q1.y - b * q2.y) / det;

    controlC.x = (-c * q1.x + a * q2.x) / det;
    controlC.y = (-c * q1.y + a * q2.y) / det;

    return [controlA, controlB, controlC, controlD];
  }

  /**
   * Core functions
   * This section handles main Curve Editor Functions.
   */
  selectAnimation(animation: Animation, coordinate?: SelectedCoordinate) {
    this._svgKeyframes = [];
    let updatedPath;
    let filteredSvgKeys;
    let selectedCurve = 0;

    if (coordinate === undefined) {
      this.playStopAnimation();

      updatedPath = this.getPathData(animation);

      if (updatedPath === undefined) {
        console.log('no keyframes in this animation');
      }
    } else {
      let curves = this.getPathData(animation);
      if (curves === undefined) {
        console.log('no keyframes in this animation');
      }

      updatedPath = [];

      filteredSvgKeys = this._svgKeyframes?.filter((curve) => {
        let id = parseInt(curve.id.split('_')[2]);
        if (id === coordinate) {
          return true;
        } else {
          return false;
        }
      });

      curves?.map((curve) => {
        let id = parseInt(curve.id.split('_')[2]);
        if (id === coordinate) {
          updatedPath.push(curve);
        }
      });

      selectedCurve = coordinate;
    }

    // check for empty svgKeyframes, lastframe, selected
    this.setState({
      selected: animation,
      svgKeyframes:
        coordinate !== undefined ? filteredSvgKeys : this._svgKeyframes,
      selectedPathData: updatedPath,
      selectedCoordinate: selectedCurve,
    });
  }

  isAnimationPlaying() {
    let target = this.props.entity;
    if (this.props.entity instanceof TargetedAnimation) {
      target = this.props.entity.target;
    }

    return this.props.scene.getAllAnimatablesByTarget(target).length > 0;
  }

  playStopAnimation() {
    let target = this.props.entity;
    if (this.props.entity instanceof TargetedAnimation) {
      target = this.props.entity.target;
    }
    this._isPlaying =
      this.props.scene.getAllAnimatablesByTarget(target).length > 0;
    if (this._isPlaying) {
      this.props.playOrPause && this.props.playOrPause();
      return true;
    } else {
      this._isPlaying = false;
      return false;
    }
  }

  analizeAnimationForLerp(animation: Animation | null) {
    if (animation !== null) {
      const { easingMode, easingType, usesTangents } = this.getAnimationData(
        animation
      );
      if (
        easingType === undefined &&
        easingMode === undefined &&
        !usesTangents
      ) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Timeline
   * This section controls the timeline.
   */
  changeCurrentFrame(frame: number) {
    let currentValue;
    if (this.state.selectedPathData) {
      let selectedCurve = this.state.selectedPathData[
        this.state.selectedCoordinate
      ].domCurve.current;
      if (selectedCurve) {
        var curveLength = selectedCurve.getTotalLength();

        let frameValue = (frame * curveLength) / 100;
        let currentP = selectedCurve.getPointAtLength(frameValue);
        let middle = this._heightScale / 2;

        let offset =
          (currentP?.y * this._heightScale - this._heightScale ** 2 / 2) /
          middle /
          this._heightScale;

        let unit = Math.sign(offset);
        currentValue = unit === -1 ? Math.abs(offset + unit) : unit - offset;

        this.setState({
          currentFrame: frame,
          currentValue: currentValue,
          currentPoint: currentP,
        });
      }
    }
  }

  changeAnimationLimit(limit: number) {
    this.setState({
      animationLimit: limit,
    });
  }

  updateFrameInKeyFrame(frame: number, index: number) {
    if (this.state && this.state.selected) {
      let animation = this.state.selected;
      let keys = [...animation.getKeys()];

      keys[index].frame = frame;

      animation.setKeys(keys);

      this.selectAnimation(animation);
    }
  }

  playPause(direction: number) {
    this.registerObs();
    if (this.state.selected) {
      let target = this.props.entity;
      if (this.props.entity instanceof TargetedAnimation) {
        target = this.props.entity.target;
      }
      if (this.state.isPlaying) {
        this.props.scene.stopAnimation(target);
        this.setState({ isPlaying: false });
        this._isPlaying = false;
        this.forceUpdate();
      } else {
        let keys = this.state.selected.getKeys();
        let firstFrame = keys[0].frame;
        let LastFrame = keys[keys.length - 1].frame;
        if (direction === 1) {
          this._mainAnimatable = this.props.scene.beginAnimation(
            target,
            firstFrame,
            LastFrame,
            true
          );
        }
        if (direction === -1) {
          this._mainAnimatable = this.props.scene.beginAnimation(
            target,
            LastFrame,
            firstFrame,
            true
          );
        }
        this._isPlaying = true;
        this.setState({ isPlaying: true });
        this.forceUpdate();
      }
    }
  }

  moveFrameTo(e: React.MouseEvent<SVGRectElement, MouseEvent>) {
    var svg = e.currentTarget as SVGRectElement;
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

  registerObs() {
    this._onBeforeRenderObserver = this.props.scene.onBeforeRenderObservable.add(
      () => {
        if (!this._isPlaying || !this._mainAnimatable) {
          return;
        }
        this.setState({
          currentFrame: Math.round(this._mainAnimatable.masterFrame),
        });
      }
    );
  }

  componentWillUnmount() {
    if (this._onBeforeRenderObserver) {
      this.props.scene.onBeforeRenderObservable.remove(
        this._onBeforeRenderObserver
      );
      this._onBeforeRenderObserver = null;
    }
  }

  render() {
    return (
      <div id='animation-curve-editor'>
        <Notification
          message={this.state.notification}
          open={this.state.notification !== '' ? true : false}
          close={() => this.clearNotification()}
        />
        <GraphActionsBar
          enabled={
            this.state.selected === null || this.state.selected === undefined
              ? false
              : true
          }
          title={this._entityName}
          close={this.props.close}
          currentValue={this.state.currentValue}
          currentFrame={this.state.currentFrame}
          handleFrameChange={(e) => this.handleFrameChange(e)}
          handleValueChange={(e) => this.handleValueChange(e)}
          addKeyframe={() => this.addKeyframeClick()}
          removeKeyframe={() => this.removeKeyframeClick()}
          brokenMode={this.state.isBrokenMode}
          brokeTangents={() => this.setBrokenMode()}
          lerpMode={this.state.lerpMode}
          setLerpMode={() => this.setLerpMode()}
          flatTangent={() => this.setFlatTangent()}
        />

        <div className='content'>
          <div className='row'>
            <EditorControls
              selectAnimation={(
                animation: Animation,
                axis?: SelectedCoordinate
              ) => this.selectAnimation(animation, axis)}
              isTargetedAnimation={this._isTargetedAnimation}
              entity={this.props.entity}
              selected={this.state.selected}
              lockObject={this.props.lockObject}
              setNotificationMessage={(message: string) => {
                this.setState({ notification: message });
              }}
              globalState={this.props.globalState}
              snippetServer={this._snippetUrl}
            />

            <div
              ref={this._graphCanvas}
              className='graph-chart'
              onWheel={(e) => this.zoom(e)}
            >
              {this.state.svgKeyframes && (
                <SvgDraggableArea
                  ref={this._svgCanvas}
                  selectKeyframe={(id: string) => this.selectKeyframe(id)}
                  viewBoxScale={this.state.frameAxisLength.length}
                  scale={this.state.scale}
                  keyframeSvgPoints={this.state.svgKeyframes}
                  selectedControlPoint={(type: string, id: string) =>
                    this.selectedControlPoint(type, id)
                  }
                  updatePosition={(
                    updatedSvgKeyFrame: IKeyframeSvgPoint,
                    id: string
                  ) => this.renderPoints(updatedSvgKeyFrame, id)}
                >
                  {/* Multiple Curves  */}
                  {this.state.selectedPathData?.map((curve, i) => (
                    <path
                      key={i}
                      ref={curve.domCurve}
                      pathLength={curve.pathLength}
                      id='curve'
                      d={curve.pathData}
                      style={{
                        stroke: curve.color,
                        fill: 'none',
                        strokeWidth: '0.5',
                      }}
                    ></path>
                  ))}

                  <svg>
                    <rect
                      x='-4%'
                      y='0%'
                      width='5%'
                      height='101%'
                      fill='#222'
                    ></rect>
                  </svg>

                  {this.state.valueAxisLength.map((f, i) => {
                    return (
                      <svg key={i}>
                        <text
                          x='-4'
                          y={f.value}
                          dx='0'
                          dy='1'
                          style={{ fontSize: `${0.2 * this.state.scale}em` }}
                        >
                          {f.label.toFixed(1)}
                        </text>
                        <line x1='0' y1={f.value} x2='105%' y2={f.value}></line>
                      </svg>
                    );
                  })}

                  <rect
                    onClick={(e) => this.moveFrameTo(e)}
                    x='0%'
                    y='91%'
                    width='105%'
                    height='10%'
                    fill='#222'
                    style={{ cursor: 'pointer' }}
                  ></rect>

                  {this.state.frameAxisLength.map((f, i) => (
                    <svg key={i} x='0' y='96%'>
                      <text
                        x={f.value}
                        y='0'
                        dx='2px'
                        style={{ fontSize: `${0.2 * this.state.scale}em` }}
                      >
                        {f.value}
                      </text>
                      <line x1={f.value} y1='0' x2={f.value} y2='5%'></line>
                    </svg>
                  ))}
                </SvgDraggableArea>
              )}

              {this.state.selected === null ||
              this.state.selected === undefined ? null : (
                <Playhead
                  frame={this.state.currentFrame}
                  offset={this.state.playheadOffset}
                  onCurrentFrameChange={(frame: number) =>
                    this.changeCurrentFrame(frame)
                  }
                />
              )}
            </div>
          </div>
          <div className='row-bottom'>
            <Timeline
              currentFrame={this.state.currentFrame}
              playPause={(direction: number) => this.playPause(direction)}
              isPlaying={this.state.isPlaying}
              dragKeyframe={(frame: number, index: number) =>
                this.updateFrameInKeyFrame(frame, index)
              }
              onCurrentFrameChange={(frame: number) =>
                this.changeCurrentFrame(frame)
              }
              onAnimationLimitChange={(limit: number) =>
                this.changeAnimationLimit(limit)
              }
              animationLimit={this.state.animationLimit}
              keyframes={this.state.selected && this.state.selected.getKeys()}
              selected={this.state.selected && this.state.selected.getKeys()[0]}
            ></Timeline>
          </div>
        </div>
      </div>
    );
  }
}
