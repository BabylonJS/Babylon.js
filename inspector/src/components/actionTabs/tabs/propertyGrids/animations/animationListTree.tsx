import * as React from "react";
import { IAnimatable } from "babylonjs/Animations/animatable.interface";
import { TargetedAnimation } from "babylonjs/Animations/animationGroup";
import { Observable } from "babylonjs/Misc/observable";
import { PropertyChangedEvent } from "../../../../../components/propertyChangedEvent";
import { Animation } from "babylonjs/Animations/animation";
import { IconButtonLineComponent } from "../../../lines/iconButtonLineComponent";
import { Nullable } from "babylonjs/types";

interface IAnimationListTreeProps {
    isTargetedAnimation: boolean;
    entity: IAnimatable | TargetedAnimation;
    selected: Animation | null;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    selectAnimation: (selected: Animation, coordinate?: SelectedCoordinate) => void;
    empty: () => void;
    editAnimation: (selected: Animation) => void;
    deselectAnimation: () => void;
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
    height = 1,
}

interface ItemCoordinate {
    id: string;
    color: string;
    coordinate: SelectedCoordinate;
}

export class AnimationListTree extends React.Component<
    IAnimationListTreeProps,
    {
        selectedCoordinate: SelectedCoordinate;
        selectedAnimation: number;
        animationList: Item[] | null;
    }
> {
    constructor(props: IAnimationListTreeProps) {
        super(props);

        this.state = {
            selectedCoordinate: 0,
            selectedAnimation: 0,
            animationList: this.generateList(),
        };
    }

    deleteAnimation() {
        let currentSelected = this.props.selected;
        if (this.props.entity instanceof TargetedAnimation) {
            console.log("no animation remove allowed");
        } else {
            let animations = (this.props.entity as IAnimatable).animations;
            if (animations) {
                let updatedAnimations = animations.filter((anim) => anim !== currentSelected);
                (this.props.entity as IAnimatable).animations = updatedAnimations as Nullable<Animation[]>;
                this.props.deselectAnimation();
                this.setState({ animationList: this.generateList() });
            }
        }
    }

    generateList() {
        let animationList =
            (this.props.entity as IAnimatable).animations &&
            (this.props.entity as IAnimatable).animations?.map((animation, i) => {
                return {
                    index: i,
                    name: animation.name,
                    property: animation.targetProperty,
                    selected: false,
                    open: false,
                } as Item;
            });
        if (animationList?.length === 0) {
            this.props.empty();
        }
        return animationList ?? null;
    }

    toggleProperty(index: number) {
        if (this.state.animationList) {
            const updated = this.state.animationList.map((a) => {
                if (a.index === index) {
                    a.open = !a.open;
                }
                return a;
            });
            this.setState({ animationList: updated });
        }
    }

    setSelectedCoordinate(animation: Animation, coordinate: SelectedCoordinate, index: number) {
        this.setState({ selectedCoordinate: coordinate, selectedAnimation: index });
        this.props.selectAnimation(animation, coordinate);
    }

    coordinateItem(i: number, animation: Animation, coordinate: string, color: string, selectedCoordinate: SelectedCoordinate) {
        return (
            <li key={`${i}_${coordinate}`} id={`${i}_${coordinate}`} className="property" style={{ color: color }} onClick={() => this.setSelectedCoordinate(animation, selectedCoordinate, i)}>
                <div className={`handle-indicator ${this.state.selectedCoordinate === selectedCoordinate && this.state.selectedAnimation === i ? "show" : "hide"}`}></div>
                {animation.targetProperty} {coordinate.toUpperCase()}
            </li>
        );
    }

    typeAnimationItem(animation: Animation, i: number, childrenElements: ItemCoordinate[]) {
        return (
            <li className={this.props.selected && this.props.selected.name === animation.name ? "property sub active" : "property sub"} key={i}>
                <div className={`animation-arrow ${this.state.animationList && this.state.animationList[i].open ? "" : "flip"}`} onClick={() => this.toggleProperty(i)}></div>
                <p onClick={() => this.props.selectAnimation(animation)}>{animation.targetProperty}</p>
                <IconButtonLineComponent tooltip="Options" icon="small animation-options" onClick={() => this.props.editAnimation(animation)} />
                {!(this.props.entity instanceof TargetedAnimation) ? this.props.selected && this.props.selected.name === animation.name ? <IconButtonLineComponent tooltip="Remove" icon="small animation-delete" onClick={() => this.deleteAnimation()} /> : <div className="spacer"></div> : null}
                <ul className={`sub-list ${this.state.animationList && this.state.animationList[i].open ? "" : "hidden"}`}>{childrenElements.map((c) => this.coordinateItem(i, animation, c.id, c.color, c.coordinate))}</ul>
            </li>
        );
    }

    setListItem(animation: Animation, i: number) {
        switch (animation.dataType) {
            case Animation.ANIMATIONTYPE_FLOAT:
                return (
                    <li className={this.props.selected && this.props.selected.name === animation.name ? "property active" : "property"} key={i} onClick={() => this.props.selectAnimation(animation, 0)}>
                        <div className={`animation-bullet`}></div>
                        <p>{animation.targetProperty}</p>
                        <IconButtonLineComponent tooltip="Options" icon="small animation-options" onClick={() => this.props.editAnimation(animation)} />
                        {!(this.props.entity instanceof TargetedAnimation) ? this.props.selected && this.props.selected.name === animation.name ? <IconButtonLineComponent tooltip="Remove" icon="small animation-delete" onClick={() => this.deleteAnimation()} /> : <div className="spacer"></div> : null}
                    </li>
                );
            case Animation.ANIMATIONTYPE_VECTOR2:
                return this.typeAnimationItem(animation, i, [
                    { id: "x", color: "#db3e3e", coordinate: SelectedCoordinate.x },
                    { id: "y", color: "#51e22d", coordinate: SelectedCoordinate.y },
                ]);
            case Animation.ANIMATIONTYPE_VECTOR3:
                return this.typeAnimationItem(animation, i, [
                    { id: "x", color: "#db3e3e", coordinate: SelectedCoordinate.x },
                    { id: "y", color: "#51e22d", coordinate: SelectedCoordinate.y },
                    { id: "z", color: "#00a3ff", coordinate: SelectedCoordinate.z },
                ]);
            case Animation.ANIMATIONTYPE_QUATERNION:
                return this.typeAnimationItem(animation, i, [
                    { id: "x", color: "#db3e3e", coordinate: SelectedCoordinate.x },
                    { id: "y", color: "#51e22d", coordinate: SelectedCoordinate.y },
                    { id: "z", color: "#00a3ff", coordinate: SelectedCoordinate.z },
                    { id: "w", color: "#7a4ece", coordinate: SelectedCoordinate.w },
                ]);
            case Animation.ANIMATIONTYPE_COLOR3:
                return this.typeAnimationItem(animation, i, [
                    { id: "r", color: "#db3e3e", coordinate: SelectedCoordinate.r },
                    { id: "g", color: "#51e22d", coordinate: SelectedCoordinate.g },
                    { id: "b", color: "#00a3ff", coordinate: SelectedCoordinate.b },
                ]);
            case Animation.ANIMATIONTYPE_COLOR4:
                return this.typeAnimationItem(animation, i, [
                    { id: "r", color: "#db3e3e", coordinate: SelectedCoordinate.r },
                    { id: "g", color: "#51e22d", coordinate: SelectedCoordinate.g },
                    { id: "b", color: "#00a3ff", coordinate: SelectedCoordinate.b },
                    { id: "a", color: "#7a4ece", coordinate: SelectedCoordinate.a },
                ]);
            case Animation.ANIMATIONTYPE_SIZE:
                return this.typeAnimationItem(animation, i, [
                    {
                        id: "width",
                        color: "#db3e3e",
                        coordinate: SelectedCoordinate.width,
                    },
                    {
                        id: "height",
                        color: "#51e22d",
                        coordinate: SelectedCoordinate.height,
                    },
                ]);
            default:
                return null;
        }
    }

    render() {
        return (
            <div className="object-tree">
                <ul>
                    {this.props.isTargetedAnimation
                        ? this.setListItem((this.props.entity as TargetedAnimation).animation, 0)
                        : (this.props.entity as IAnimatable).animations &&
                          (this.props.entity as IAnimatable).animations?.map((animation, i) => {
                              return this.setListItem(animation, i);
                          })}
                </ul>
            </div>
        );
    }
}
