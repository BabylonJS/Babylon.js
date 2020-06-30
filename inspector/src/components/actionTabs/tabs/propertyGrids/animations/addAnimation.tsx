import * as React from 'react';
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';
import { Observable } from 'babylonjs/Misc/observable';
import { PropertyChangedEvent } from '../../../../../components/propertyChangedEvent';
import { Animation } from 'babylonjs/Animations/animation';
import { Vector2, Vector3, Quaternion } from 'babylonjs/Maths/math.vector';
import { Size } from 'babylonjs/Maths/math.size';
import { Color3, Color4 } from 'babylonjs/Maths/math.color';
import { IAnimatable } from 'babylonjs/Animations/animatable.interface';
import { IAnimationKey } from 'babylonjs/Animations/animationKey';

interface IAddAnimationProps {
  isOpen: boolean;
  close: () => void;
  entity: IAnimatable;
  onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
  setNotificationMessage: (message: string) => void;
  finishedUpdate: () => void;
  addedNewAnimation: () => void;
  fps: number;
  selectedToUpdate?: Animation | undefined;
}

export class AddAnimation extends React.Component<
  IAddAnimationProps,
  {
    animationName: string;
    animationTargetProperty: string;
    animationType: string;
    loopMode: number;
    animationTargetPath: string;
    isUpdating: boolean;
  }
> {
  constructor(props: IAddAnimationProps) {
    super(props);

    if (this.props.selectedToUpdate !== undefined) {
      this.setInitialEditingState(this.props.selectedToUpdate);
    } else {
      this.setInitialState();
    }
  }

  setInitialState() {
    this.state = {
      animationName: '',
      animationTargetPath: '',
      animationType: 'Float',
      loopMode: Animation.ANIMATIONLOOPMODE_CYCLE,
      animationTargetProperty: '',
      isUpdating: this.props.selectedToUpdate ? true : false,
    };
  }

  setInitialEditingState(editingAnimation: Animation) {
    this.state = {
      animationName: editingAnimation.name,
      animationTargetPath: '',
      animationType: this.getTypeAsString(editingAnimation.dataType),
      loopMode: editingAnimation.loopMode ?? Animation.ANIMATIONLOOPMODE_CYCLE,
      animationTargetProperty: editingAnimation.targetProperty,
      isUpdating: true,
    };
  }

  componentWillReceiveProps(nextProps: IAddAnimationProps) {
    if (
      nextProps.selectedToUpdate !== undefined &&
      nextProps.selectedToUpdate !== this.props.selectedToUpdate
    ) {
      this.setInitialEditingState(nextProps.selectedToUpdate);
    } else {
      if (nextProps.isOpen === true && nextProps.isOpen !== this.props.isOpen)
        this.setInitialState();
    }
  }

  updateAnimation() {
    if (this.props.selectedToUpdate !== undefined) {
      const oldNameValue = this.props.selectedToUpdate.name;
      this.props.selectedToUpdate.name = this.state.animationName;
      this.raiseOnPropertyUpdated(
        oldNameValue,
        this.state.animationName,
        'name'
      );

      const oldLoopModeValue = this.props.selectedToUpdate.loopMode;
      this.props.selectedToUpdate.loopMode = this.state.loopMode;
      this.raiseOnPropertyUpdated(
        oldLoopModeValue,
        this.state.loopMode,
        'loopMode'
      );

      const oldTargetPropertyValue = this.props.selectedToUpdate.targetProperty;
      this.props.selectedToUpdate.targetProperty = this.state.animationTargetProperty;
      this.raiseOnPropertyUpdated(
        oldTargetPropertyValue,
        this.state.animationTargetProperty,
        'targetProperty'
      );

      this.props.finishedUpdate();
    }
  }

  getAnimationTypeofChange(selected: string) {
    switch (selected) {
      case 'Float':
        return Animation.ANIMATIONTYPE_FLOAT;
      case 'Quaternion':
        return Animation.ANIMATIONTYPE_QUATERNION;
      case 'Vector3':
        return Animation.ANIMATIONTYPE_VECTOR3;
      case 'Vector2':
        return Animation.ANIMATIONTYPE_VECTOR2;
      case 'Size':
        return Animation.ANIMATIONTYPE_SIZE;
      case 'Color3':
        return Animation.ANIMATIONTYPE_COLOR3;
      case 'Color4':
        return Animation.ANIMATIONTYPE_COLOR4;
      default:
        return 0;
    }
  }

  getTypeAsString(type: number) {
    switch (type) {
      case Animation.ANIMATIONTYPE_FLOAT:
        return 'Float';
      case Animation.ANIMATIONTYPE_QUATERNION:
        return 'Quaternion';
      case Animation.ANIMATIONTYPE_VECTOR3:
        return 'Vector3';
      case Animation.ANIMATIONTYPE_VECTOR2:
        return 'Vector2';
      case Animation.ANIMATIONTYPE_SIZE:
        return 'Size';
      case Animation.ANIMATIONTYPE_COLOR3:
        return 'Color3';
      case Animation.ANIMATIONTYPE_COLOR4:
        return 'Color4';
      default:
        return 'Float';
    }
  }

  addAnimation() {
    if (
      this.state.animationName != '' &&
      this.state.animationTargetProperty != ''
    ) {
      let matchTypeTargetProperty = this.state.animationTargetProperty.split(
        '.'
      );
      let animationDataType = this.getAnimationTypeofChange(
        this.state.animationType
      );
      let matched = false;

      if (matchTypeTargetProperty.length === 1) {
        let match = (this.props.entity as any)[matchTypeTargetProperty[0]];

        if (match) {
          switch (match.constructor.name) {
            case 'Vector2':
              animationDataType === Animation.ANIMATIONTYPE_VECTOR2
                ? (matched = true)
                : (matched = false);
              break;
            case 'Vector3':
              animationDataType === Animation.ANIMATIONTYPE_VECTOR3
                ? (matched = true)
                : (matched = false);
              break;
            case 'Quaternion':
              animationDataType === Animation.ANIMATIONTYPE_QUATERNION
                ? (matched = true)
                : (matched = false);
              break;
            case 'Color3':
              animationDataType === Animation.ANIMATIONTYPE_COLOR3
                ? (matched = true)
                : (matched = false);
              break;
            case 'Color4':
              animationDataType === Animation.ANIMATIONTYPE_COLOR4
                ? (matched = true)
                : (matched = false);
              break;
            case 'Size':
              animationDataType === Animation.ANIMATIONTYPE_SIZE
                ? (matched = true)
                : (matched = false);
              break;
            default:
              console.log('not recognized');
              break;
          }
        } else {
          this.props.setNotificationMessage(
            `The selected entity doesn't have a ${matchTypeTargetProperty[0]} property`
          );
        }
      } else if (matchTypeTargetProperty.length > 1) {
        let matchProp = (this.props.entity as any)[matchTypeTargetProperty[0]];
        if (matchProp) {
          let match = matchProp[matchTypeTargetProperty[1]];
          if (typeof match === 'number') {
            animationDataType === Animation.ANIMATIONTYPE_FLOAT
              ? (matched = true)
              : (matched = false);
          }
        }
      }

      if (matched) {
        let startValue;
        let outTangent;

        // Default start and end values for new animations
        switch (animationDataType) {
          case Animation.ANIMATIONTYPE_FLOAT:
            startValue = 1;
            outTangent = 0;
            break;
          case Animation.ANIMATIONTYPE_VECTOR2:
            startValue = new Vector2(1, 1);
            outTangent = Vector2.Zero();
            break;
          case Animation.ANIMATIONTYPE_VECTOR3:
            startValue = new Vector3(1, 1, 1);
            outTangent = Vector3.Zero();
            break;
          case Animation.ANIMATIONTYPE_QUATERNION:
            startValue = new Quaternion(1, 1, 1, 1);
            outTangent = Quaternion.Zero();
            break;
          case Animation.ANIMATIONTYPE_COLOR3:
            startValue = new Color3(1, 1, 1);
            outTangent = new Color3(0, 0, 0);
            break;
          case Animation.ANIMATIONTYPE_COLOR4:
            startValue = new Color4(1, 1, 1, 1);
            outTangent = new Color4(0, 0, 0, 0);
            break;
          case Animation.ANIMATIONTYPE_SIZE:
            startValue = new Size(1, 1);
            outTangent = Size.Zero();
            break;
          default:
            console.log('not recognized');
            break;
        }

        let alreadyAnimatedProperty = (this.props
          .entity as IAnimatable).animations?.find(
          (anim) => anim.targetProperty === this.state.animationTargetProperty,
          this
        );

        let alreadyAnimationName = (this.props
          .entity as IAnimatable).animations?.find(
          (anim) => anim.name === this.state.animationName,
          this
        );

        if (alreadyAnimatedProperty) {
          this.props.setNotificationMessage(
            `The property "${this.state.animationTargetProperty}" already has an animation`
          );
        } else if (alreadyAnimationName) {
          this.props.setNotificationMessage(
            `There is already an animation with the name: "${this.state.animationName}"`
          );
        } else {
          let animation = new Animation(
            this.state.animationName,
            this.state.animationTargetProperty,
            this.props.fps,
            animationDataType
          );

          // Start with two keyframes
          var keys: IAnimationKey[] = [];
          keys.push({
            frame: 0,
            value: startValue,
            outTangent: outTangent,
          });

          animation.setKeys(keys);

          if (this.props.entity.animations) {
            const store = this.props.entity.animations;
            const updatedCollection = [
              ...this.props.entity.animations,
              animation,
            ];
            this.raiseOnPropertyChanged(updatedCollection, store);
            this.props.entity.animations = updatedCollection;
            this.props.addedNewAnimation();
            //Cleaning form fields
            this.setState({
              animationName: '',
              animationTargetPath: '',
              animationType: 'Float',
              loopMode: Animation.ANIMATIONLOOPMODE_CYCLE,
              animationTargetProperty: '',
            });
          }
        }
      } else {
        this.props.setNotificationMessage(
          `The property "${this.state.animationTargetProperty}" is not a "${this.state.animationType}" type`
        );
      }
    } else {
      this.props.setNotificationMessage(
        `You need to provide a name and target property.`
      );
    }
  }

  raiseOnPropertyChanged(newValue: Animation[], previousValue: Animation[]) {
    if (!this.props.onPropertyChangedObservable) {
      return;
    }

    this.props.onPropertyChangedObservable.notifyObservers({
      object: this.props.entity,
      property: 'animations',
      value: newValue,
      initialValue: previousValue,
    });
  }

  raiseOnPropertyUpdated(
    newValue: string | number | undefined,
    previousValue: string | number,
    property: string
  ) {
    if (!this.props.onPropertyChangedObservable) {
      return;
    }

    this.props.onPropertyChangedObservable.notifyObservers({
      object: this.props.selectedToUpdate,
      property: property,
      value: newValue,
      initialValue: previousValue,
    });
  }

  handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.preventDefault();
    this.setState({ animationName: event.target.value.trim() });
  }

  handlePathChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.preventDefault();
    this.setState({ animationTargetPath: event.target.value.trim() });
  }

  handleTypeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    event.preventDefault();
    this.setState({ animationType: event.target.value });
  }

  handlePropertyChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.preventDefault();
    this.setState({ animationTargetProperty: event.target.value });
  }

  handleLoopModeChange(event: React.ChangeEvent<HTMLSelectElement>) {
    event.preventDefault();
    this.setState({ loopMode: parseInt(event.target.value) });
  }

  render() {
    return (
      <div
        className='new-animation'
        style={{ display: this.props.isOpen ? 'block' : 'none' }}
      >
        <div className='sub-content'>
          {this.state.isUpdating ? null : (
            <div className='label-input'>
              <label>Target Path</label>
              <input
                type='text'
                value={this.state.animationTargetPath}
                onChange={(e) => this.handlePathChange(e)}
                disabled
              ></input>
            </div>
          )}
          <div className='label-input'>
            <label>Display Name</label>
            <input
              type='text'
              value={this.state.animationName}
              onChange={(e) => this.handleNameChange(e)}
            ></input>
          </div>
          <div className='label-input'>
            <label>Property</label>
            <input
              type='text'
              value={this.state.animationTargetProperty}
              onChange={(e) => this.handlePropertyChange(e)}
            ></input>
          </div>
          {this.state.isUpdating ? null : (
            <div className='label-input'>
              <label>Type</label>
              <select
                onChange={(e) => this.handleTypeChange(e)}
                value={this.state.animationType}
              >
                <option value='Float'>Float</option>
                <option value='Vector3'>Vector3</option>
                <option value='Vector2'>Vector2</option>
                <option value='Quaternion'>Quaternion</option>
                <option value='Color3'>Color3</option>
                <option value='Color4'>Color4</option>
                <option value='Size'>Size</option>
              </select>
            </div>
          )}
          <div className='label-input'>
            <label>Loop Mode</label>
            <select
              onChange={(e) => this.handleLoopModeChange(e)}
              value={this.state.loopMode}
            >
              <option value={Animation.ANIMATIONLOOPMODE_CYCLE}>Cycle</option>
              <option value={Animation.ANIMATIONLOOPMODE_RELATIVE}>
                Relative
              </option>
              <option value={Animation.ANIMATIONLOOPMODE_CONSTANT}>
                Constant
              </option>
            </select>
          </div>
          <div className='confirm-buttons'>
            <ButtonLineComponent
              label={this.state.isUpdating ? 'Update' : 'Create'}
              onClick={
                this.state.isUpdating
                  ? () => this.updateAnimation()
                  : () => this.addAnimation()
              }
            />
          </div>
        </div>
      </div>
    );
  }
}
