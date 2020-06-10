
import * as React from "react";
import { IAnimatable } from 'babylonjs/Animations/animatable.interface';
import { TargetedAnimation } from "babylonjs/Animations/animationGroup";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../../components/propertyChangedEvent";
import { Animation } from 'babylonjs/Animations/animation';
import { IconButtonLineComponent } from '../../../lines/iconButtonLineComponent';
import { Nullable } from 'babylonjs/types';

interface IAnimationListTreeProps {
    isTargetedAnimation: boolean;
    entity: IAnimatable | TargetedAnimation;
    selected: Animation | null
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    selectAnimation: (selected: Animation, coordinate?: SelectedCoordinate) => void;
    empty: () => void;
}

interface Item {
    index: number;
    name: string;
    property: string;
    selected: boolean;
    open: boolean;
}

export enum SelectedCoordinate {
    x = 0,
    y = 1,
    z = 2,
    w = 3,
    r = 0,
    g = 1,
    b = 2,
    a = 3,
    width = 0,
    height = 1
}

export class AnimationListTree extends React.Component<IAnimationListTreeProps, { list: Item[], selectedCoordinate: SelectedCoordinate, selectedAnimation: number }>{
    constructor(props: IAnimationListTreeProps) {
        super(props);
        let animationList = (this.props.entity as IAnimatable).animations && (this.props.entity as IAnimatable).animations?.map((animation, i) => {
            return ({ index: i, name: animation.name, property: animation.targetProperty, selected: false, open: false } as Item)
        });
        this.state = { list: animationList ?? [], selectedCoordinate: 0, selectedAnimation: 0 }
    }

    deleteAnimation() {
        let currentSelected = this.props.selected;
        if (this.props.entity instanceof TargetedAnimation) {
            console.log("no animation remove allowed");
        } else {
            let animations = (this.props.entity as IAnimatable).animations;
            if (animations) {
                let updatedAnimations = animations.filter(anim => anim !== currentSelected);
                (this.props.entity as IAnimatable).animations = updatedAnimations as Nullable<Animation[]>;
                this.generateList();
            }
        }
    }

    generateList() {
        let animationList = (this.props.entity as IAnimatable).animations && (this.props.entity as IAnimatable).animations?.map((animation, i) => {
            return ({ index: i, name: animation.name, property: animation.targetProperty, selected: false, open: false } as Item)
        });
        if (animationList?.length === 0) {
            this.props.empty();
        }
        this.setState({ list: animationList ?? [] });
    }

    editAnimation() {
        console.log('Edit animation');// TODO. Implement the edit options here
    }

    toggleProperty(index: number) {
        let item = this.state.list[index];
        item.open = !item.open;
    }

    setSelectedCoordinate(animation: Animation, coordinate: SelectedCoordinate, index: number) {
        this.setState({ selectedCoordinate: coordinate, selectedAnimation: index });
        this.props.selectAnimation(animation, SelectedCoordinate.x)
    }

    setListItem(animation: Animation, i: number) {
        let element;

        switch (animation.dataType) {
            case Animation.ANIMATIONTYPE_FLOAT:
                element = <li className={this.props.selected && this.props.selected.name === animation.name ? 'property active' : 'property'} key={i} onClick={() => this.props.selectAnimation(animation)}>
                    <div className={`animation-bullet`}></div>
                    <p>{animation.targetProperty}</p>
                    <IconButtonLineComponent tooltip="Options" icon="small animation-options" onClick={() => this.editAnimation()} />
                    {!(this.props.entity instanceof TargetedAnimation) ? this.props.selected && this.props.selected.name === animation.name ? <IconButtonLineComponent tooltip="Remove" icon="small animation-delete" onClick={() => this.deleteAnimation()} /> : <div className="spacer"></div> : null}
                </li>
                break;
            case Animation.ANIMATIONTYPE_VECTOR2:
                element = <li className={this.props.selected && this.props.selected.name === animation.name ? 'property active' : 'property'} key={i} onClick={() => this.props.selectAnimation(animation)}>
                    <p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_x`}>Property <strong>X</strong></li>
                        <li key={`${i}_y`}>Property <strong>Y</strong></li>
                    </ul>
                </li>
                break;
            case Animation.ANIMATIONTYPE_VECTOR3:
                element = <li className={this.props.selected && this.props.selected.name === animation.name ? 'property sub active' : 'property sub'} key={i}>
                    <div className={`animation-arrow ${this.state.list[i].open ? '' : 'flip'}`} onClick={() => this.toggleProperty(i)}></div>
                    <p onClick={() => this.props.selectAnimation(animation)}>{animation.targetProperty}</p>
                    <IconButtonLineComponent tooltip="Options" icon="small animation-options" onClick={() => this.editAnimation()} />
                    {!(this.props.entity instanceof TargetedAnimation) ? this.props.selected && this.props.selected.name === animation.name ? <IconButtonLineComponent tooltip="Remove" icon="small animation-delete" onClick={() => this.deleteAnimation()} /> : <div className="spacer"></div> : null}
                    <ul className={`sub-list ${this.state.list[i].open ? '' : 'hidden'}`}>
                        <li key={`${i}_x`} id={`${i}_x`} className="property" style={{ color: '#db3e3e' }} onClick={() => this.setSelectedCoordinate(animation, SelectedCoordinate.x, i)}>
                            <div className={`handle-indicator ${this.state.selectedCoordinate === SelectedCoordinate.x && this.state.selectedAnimation === i ? 'show' : 'hide'}`}></div>
                            {animation.targetProperty} X</li>
                        <li key={`${i}_y`} id={`${i}_y`} className="property" style={{ color: '#51e22d' }} onClick={() => this.setSelectedCoordinate(animation, SelectedCoordinate.y, i)}>
                            <div className={`handle-indicator ${this.state.selectedCoordinate === SelectedCoordinate.y && this.state.selectedAnimation === i ? 'show' : 'hide'}`}></div>
                            {animation.targetProperty} Y</li>
                        <li key={`${i}_z`} id={`${i}_z`} className="property" style={{ color: '#00a3ff' }} onClick={() => this.setSelectedCoordinate(animation, SelectedCoordinate.z, i)}>
                            <div className={`handle-indicator ${this.state.selectedCoordinate === SelectedCoordinate.z && this.state.selectedAnimation === i ? 'show' : 'hide'}`}></div>
                            {animation.targetProperty} Z</li>
                    </ul>
                </li>
                break;
            case Animation.ANIMATIONTYPE_QUATERNION:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_x`}>Property <strong>X</strong></li>
                        <li key={`${i}_y`}>Property <strong>Y</strong></li>
                        <li key={`${i}_z`}>Property <strong>Z</strong></li>
                        <li key={`${i}_w`}>Property <strong>W</strong></li>
                    </ul>
                </li>
                break;
            case Animation.ANIMATIONTYPE_COLOR3:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_r`}>Property <strong>R</strong></li>
                        <li key={`${i}_g`}>Property <strong>G</strong></li>
                        <li key={`${i}_b`}>Property <strong>B</strong></li>
                    </ul>
                </li>
                break;
            case Animation.ANIMATIONTYPE_COLOR4:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_r`}>Property <strong>R</strong></li>
                        <li key={`${i}_g`}>Property <strong>G</strong></li>
                        <li key={`${i}_b`}>Property <strong>B</strong></li>
                        <li key={`${i}_a`}>Property <strong>A</strong></li>
                    </ul>
                </li>
                break;
            case Animation.ANIMATIONTYPE_SIZE:
                element = <li className="property" key={i}><p>{animation.targetProperty}</p>
                    <ul>
                        <li key={`${i}_width`}>Property <strong>Width</strong></li>
                        <li key={`${i}_height`}>Property <strong>Height</strong></li>
                    </ul>
                </li>
                break;
            default: console.log("not recognized");
                element = null;
                break;
        }

        return element;
    }

    render() {
        return (
            <div className="object-tree">
                <ul>
                    {
                        this.props.isTargetedAnimation ? this.setListItem((this.props.entity as TargetedAnimation).animation, 0) :
                            (this.props.entity as IAnimatable).animations && (this.props.entity as IAnimatable).animations?.map((animation, i) => {
                                return this.setListItem(animation, i);
                            })}

                </ul>
            </div>
        )
    }
} 