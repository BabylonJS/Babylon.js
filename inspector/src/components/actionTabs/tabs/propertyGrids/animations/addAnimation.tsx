
import * as React from "react";
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../../components/propertyChangedEvent";
import { Animation } from 'babylonjs/Animations/animation';
import { Vector2, Vector3, Quaternion } from 'babylonjs/Maths/math.vector';
import { Size } from 'babylonjs/Maths/math.size';
import { Color3, Color4 } from 'babylonjs/Maths/math.color';
import { IAnimatable } from 'babylonjs/Animations/animatable.interface';

interface IAddAnimationProps {
   isOpen: boolean;
   close: () => void;
   entity: IAnimatable;
   onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
   setNotificationMessage: (message: string) => void;
}

export class AddAnimation extends React.Component<IAddAnimationProps, {animationName: string, animationTargetProperty: string, animationType:string, loopMode: number, animationTargetPath:string}>{ 
    constructor(props: IAddAnimationProps) {
        super(props);
        this.state = { animationName: "", animationTargetPath: "", animationType: "Float", loopMode: Animation.ANIMATIONLOOPMODE_CYCLE, animationTargetProperty: ""}
    }

    getAnimationTypeofChange(selected: string) {
        let dataType = 0;
        switch (selected) {
            case "Float":
                dataType = Animation.ANIMATIONTYPE_FLOAT;
                break;
            case "Quaternion":
                dataType = Animation.ANIMATIONTYPE_QUATERNION;
                break;
            case "Vector3":
                dataType = Animation.ANIMATIONTYPE_VECTOR3;
                break;
            case "Vector2":
                dataType = Animation.ANIMATIONTYPE_VECTOR2;
                break;
            case "Size":
                dataType = Animation.ANIMATIONTYPE_SIZE;
                break;
            case "Color3":
                dataType = Animation.ANIMATIONTYPE_COLOR3;
                break;
            case "Color4":
                dataType = Animation.ANIMATIONTYPE_COLOR4;
                break;
        }

        return dataType;

    }

    addAnimation() {
        if (this.state.animationName != "" && this.state.animationTargetProperty != "") {

            let matchTypeTargetProperty = this.state.animationTargetProperty.split('.');
            let animationDataType = this.getAnimationTypeofChange(this.state.animationType);
            let matched = false;

            if (matchTypeTargetProperty.length === 1) {
                let match = (this.props.entity as any)[matchTypeTargetProperty[0]];

                if (match) {
                    switch (match.constructor.name) {
                        case "Vector2":
                            animationDataType === Animation.ANIMATIONTYPE_VECTOR2 ? matched = true : matched = false;
                            break;
                        case "Vector3":
                            animationDataType === Animation.ANIMATIONTYPE_VECTOR3 ? matched = true : matched = false;
                            break;
                        case "Quaternion":
                            animationDataType === Animation.ANIMATIONTYPE_QUATERNION ? matched = true : matched = false;
                            break;
                        case "Color3":
                            animationDataType === Animation.ANIMATIONTYPE_COLOR3 ? matched = true : matched = false;
                            break;
                        case "Color4":
                            animationDataType === Animation.ANIMATIONTYPE_COLOR4 ? matched = true : matched = false;
                            break;
                        case "Size":
                            animationDataType === Animation.ANIMATIONTYPE_SIZE ? matched = true : matched = false;
                            break;
                        default: console.log("not recognized");
                            break;
                    }
                } else {
                   this.props.setNotificationMessage(`The selected entity doesn't have a ${matchTypeTargetProperty[0]} property`)
                }
            } else if (matchTypeTargetProperty.length > 1) {
                let match = (this.props.entity as any)[matchTypeTargetProperty[0]][matchTypeTargetProperty[1]];
                if (typeof match === "number") {
                    animationDataType === Animation.ANIMATIONTYPE_FLOAT ? matched = true : matched = false;
                }
            }

            if (matched) {

                let startValue;
                let endValue;
                let outTangent;
                let inTangent;
                // Default start and end values for new animations
                switch (animationDataType) {
                    case Animation.ANIMATIONTYPE_FLOAT:
                        startValue = 1;
                        endValue = 1;
                        outTangent = 0;
                        inTangent = 0;
                        break;
                    case Animation.ANIMATIONTYPE_VECTOR2:
                        startValue = new Vector2(1, 1);
                        endValue = new Vector2(1, 1);
                        outTangent = Vector2.Zero();
                        inTangent = Vector2.Zero();
                        break;
                    case Animation.ANIMATIONTYPE_VECTOR3:
                        startValue = new Vector3(1, 1, 1);
                        endValue = new Vector3(1, 1, 1);
                        outTangent = Vector3.Zero();
                        inTangent = Vector3.Zero();
                        break;
                    case Animation.ANIMATIONTYPE_QUATERNION:
                        startValue = new Quaternion(1, 1, 1, 1);
                        endValue = new Quaternion(1, 1, 1, 1);
                        outTangent = Quaternion.Zero();
                        inTangent = Quaternion.Zero();
                        break;
                    case Animation.ANIMATIONTYPE_COLOR3:
                        startValue = new Color3(1, 1, 1);
                        endValue = new Color3(1, 1, 1);
                        outTangent = new Color3(0, 0, 0);
                        inTangent = new Color3(0, 0, 0);
                        break;
                    case Animation.ANIMATIONTYPE_COLOR4:
                        startValue = new Color4(1, 1, 1, 1);
                        endValue = new Color4(1, 1, 1, 1);
                        outTangent = new Color4(0, 0, 0, 0);
                        inTangent = new Color4(0, 0, 0, 0);
                        break;
                    case Animation.ANIMATIONTYPE_SIZE:
                        startValue = new Size(1, 1);
                        endValue = new Size(1, 1);
                        outTangent = Size.Zero();
                        inTangent = Size.Zero();
                        break;
                    default: console.log("not recognized");
                        break;
                }

                let alreadyAnimatedProperty = (this.props.entity as IAnimatable).animations?.find(anim =>
                    anim.targetProperty === this.state.animationTargetProperty
                    , this);

                let alreadyAnimationName = (this.props.entity as IAnimatable).animations?.find(anim =>
                    anim.name === this.state.animationName
                    , this);

                if (alreadyAnimatedProperty) {
                    this.props.setNotificationMessage(`The property "${this.state.animationTargetProperty}" already has an animation`);
                } else if (alreadyAnimationName) {
                    this.props.setNotificationMessage(`There is already an animation with the name: "${this.state.animationName}"`);
                } else {

                    let animation = new Animation(this.state.animationName, this.state.animationTargetProperty, 30, animationDataType);

                    // Start with two keyframes
                    var keys = [];
                    keys.push({
                        frame: 0,
                        value: startValue,
                        outTangent: outTangent
                    });

                    keys.push({
                        inTangent: inTangent,
                        frame: 100,
                        value: endValue
                    });

                    animation.setKeys(keys);

                    if (this.props.entity.animations){
                        const store = this.props.entity.animations;
                        const updatedCollection = [...this.props.entity.animations, animation]
                        this.raiseOnPropertyChanged(updatedCollection, store);
                        this.props.entity.animations = updatedCollection;
                        this.props.close();
                    }   
                }
            } else {
                this.props.setNotificationMessage(`The property "${this.state.animationTargetProperty}" is not a "${this.state.animationType}" type`);
            }
        } else {
            this.props.setNotificationMessage(`You need to provide a name and target property.`);
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
            initialValue: previousValue
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
        <div className="new-animation" style={{ display: this.props.isOpen ? "block" : "none" }}>
            <div className="sub-content">
            <div className="label-input">
                <label>Target Path</label>
                <input type="text" value={this.state.animationTargetPath} onChange={(e) => this.handlePathChange(e)}></input>
            </div>
            <div className="label-input">
                <label>Display Name</label>
                <input type="text" value={this.state.animationName} onChange={(e) => this.handleNameChange(e)}></input>
            </div>
            <div className="label-input">
                <label>Property</label>
                <input type="text" value={this.state.animationTargetProperty} onChange={(e) => this.handlePropertyChange(e)}></input>
            </div>
            <div className="label-input">
                <label>Type</label>
                <select onChange={(e) => this.handleTypeChange(e)} value={this.state.animationType}>
                    <option value="Float">Float</option>
                    <option value="Vector3">Vector3</option>
                    <option value="Vector2">Vector2</option>
                    <option value="Quaternion">Quaternion</option>
                    <option value="Color3">Color3</option>
                    <option value="Color4">Color4</option>
                    <option value="Size">Size</option>
                </select>
            </div>
            <div className="label-input">
                <label>Loop Mode</label>
                <select onChange={(e) => this.handleLoopModeChange(e)} value={this.state.loopMode}>
                    <option value={Animation.ANIMATIONLOOPMODE_CYCLE}>Cycle</option>
                    <option value={Animation.ANIMATIONLOOPMODE_RELATIVE}>Relative</option>
                    <option value={Animation.ANIMATIONLOOPMODE_CONSTANT}>Constant</option>
                </select>
            </div>
           <div className="confirm-buttons">
            <ButtonLineComponent label={"Create"} onClick={() => this.addAnimation()} />
            </div>
            </div>
        </div>
        )
    }
} 
