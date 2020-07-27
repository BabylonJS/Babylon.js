import * as React from "react";
import { GlobalState } from '../globalState';
import { DropUpButton } from './dropUpButton';
import { Scene } from 'babylonjs/scene';
import { Observer } from 'babylonjs/Misc/observable';
import { Nullable } from 'babylonjs/types';
import { AnimationGroup } from 'babylonjs/Animations/animationGroup';

var iconPlay = require("../img/icon-play.svg");
var iconPause = require("../img/icon-pause.svg");

require("../scss/animationBar.scss");

interface IAnimationBarProps {
    globalState: GlobalState;
    enabled: boolean;
}

export class AnimationBar extends React.Component<IAnimationBarProps, {groupIndex: number}> {
    private _currentScene: Scene;
    private _sliderSyncObserver: Nullable<Observer<Scene>>;
    private _currentGroup: Nullable<AnimationGroup>;
    private _sliderRef: React.RefObject<HTMLInputElement>;
    private _currentPlayingState: boolean;

    public constructor(props: IAnimationBarProps) {    
        super(props);

        this._sliderRef = React.createRef();

        this.state = {groupIndex: 0};

        props.globalState.onSceneLoaded.add(info => {
            this.registerBeforeRender(info.scene);
        });

        if (this.props.globalState.currentScene) {
            this.registerBeforeRender(this.props.globalState.currentScene); 
        }
    }

    getCurrentPosition() {
        if (!this._currentGroup) {
            return "0";

        }
        let targetedAnimations = this._currentGroup.targetedAnimations;
        if (targetedAnimations.length > 0) {
            let runtimeAnimations = this._currentGroup.targetedAnimations[0].animation.runtimeAnimations;
            if (runtimeAnimations.length > 0) {
                return runtimeAnimations[0].currentFrame.toString();
            }
        }

        return "0";
    }

    registerBeforeRender(newScene: Scene) {
        if (this._currentScene) {
            this._currentScene.onBeforeRenderObservable.remove(this._sliderSyncObserver);
        }

        this._currentScene = newScene;
        this._sliderSyncObserver = this._currentScene.onBeforeRenderObservable.add(() => {
            if (this._currentGroup && this._sliderRef.current) {
                this._sliderRef.current.value = this.getCurrentPosition();

                if (this._currentPlayingState !== this._currentGroup.isPlaying) {
                    this.forceUpdate();
                }
            }
        });
    }

    pause() {
        if (!this._currentGroup) {
            return;
        }

        this._currentGroup.pause();
        this.forceUpdate();
    }

    play() {
        if (!this._currentGroup) {
            return;
        }

        this._currentGroup.play();
        this.forceUpdate();
    }

    sliderInput(evt: React.FormEvent<HTMLInputElement>) {
        if (!this._currentGroup) {
            return;
        }

        let value = parseFloat((evt.target as HTMLInputElement).value);

        if (!this._currentGroup.isPlaying) {
            this._currentGroup.play(true);
            this._currentGroup.goToFrame(value);
            this._currentGroup.pause();
        } else {
            this._currentGroup.goToFrame(value);
        }
    }

    public render() {
        if (!this.props.enabled) {
            this._currentGroup = null;
            return null;
        }
        let scene = this.props.globalState.currentScene;
        
        if (scene.animationGroups.length === 0) {
            this._currentGroup = null;
            return null;
        }
        
        let groupNames = scene.animationGroups.map(g => g.name);

        this._currentGroup = scene.animationGroups[this.state.groupIndex];
        this._currentPlayingState = this._currentGroup.isPlaying;

        return (
            <div className="animationBar">
                <div className="row">
                    <button id="playBtn">
                        {
                            this._currentGroup.isPlaying &&
                            <img id="pauseImg" src={iconPause} onClick={() => this.pause()}/>
                        }
                        {
                            !this._currentGroup.isPlaying &&
                            <img id="playImg" src={iconPlay} onClick={() => this.play()}/>
                        }
                    </button>
                    <input ref={this._sliderRef} className="slider" type="range" 
                        onInput={evt => this.sliderInput(evt)}
                        min={this._currentGroup.from} 
                        max={this._currentGroup.to} 
                        onChange={() => {}}
                        value={this.getCurrentPosition()} step="any"></input>
                </div>
                <DropUpButton globalState={this.props.globalState} 
                                    label="Active animation group"
                                    options={groupNames}
                                    selectedOption={this._currentGroup.name}
                                    onOptionPicked={option => {
                                        this._currentGroup!.stop();

                                        let newIndex = groupNames.indexOf(option);
                                        this.setState({groupIndex: newIndex});

                                        scene.animationGroups[newIndex].play(true);
                                    }}
                                    enabled={true}/>
            </div>            
        )
    }
}