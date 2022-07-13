import * as React from "react";

import type { Observable } from "core/Misc/observable";

import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import type { Sound } from "core/Audio/sound";
import type { IExplorerExtensibilityGroup } from "core/Debug/debugLayer";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";

interface ISoundPropertyGridComponentProps {
    globalState: GlobalState;
    sound: Sound;
    extensibilityGroups?: IExplorerExtensibilityGroup[];
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class SoundPropertyGridComponent extends React.Component<ISoundPropertyGridComponentProps> {
    constructor(props: ISoundPropertyGridComponentProps) {
        super(props);
    }

    render() {
        const sound = this.props.sound;

        return (
            <div className="pane">
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextLineComponent label="Class" value={sound.getClassName()} />
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Name"
                        target={sound}
                        propertyName="name"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextLineComponent label="Status" value={sound.isPaused ? "Paused" : sound.isPlaying ? "Playing" : "Stopped"} />
                    {/* {
                        postProcess.width &&
                        <TextLineComponent label="Width" value={postProcess.width.toString()} />
                    }
                    {
                        postProcess.height &&
                        <TextLineComponent label="Height" value={postProcess.height.toString()} />
                    }
                    <CheckBoxLineComponent label="Auto clear" target={postProcess} propertyName="autoClear" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    {
                        postProcess.clearColor &&
                        <Color3LineComponent label="Clear color" target={postProcess} propertyName="clearColor" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    }
                    <CheckBoxLineComponent label="Pixel perfect" target={postProcess} propertyName="enablePixelPerfectMode" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Fullscreen viewport" target={postProcess} propertyName="forceFullscreenViewport" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <SliderLineComponent label="Samples" target={postProcess} propertyName="samples" minimum={1} maximum={8} step={1} decimalCount={0} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <ButtonLineComponent label="Dispose" onClick={() => {
                        postProcess.dispose();
                        this.props.globalState.onSelectionChangedObservable.notifyObservers(null);
                    }} />                       */}
                </LineContainerComponent>
                <LineContainerComponent title="COMMANDS" selection={this.props.globalState}>
                    {sound.isPlaying && (
                        <ButtonLineComponent
                            label="Pause"
                            onClick={() => {
                                sound.pause();
                                this.forceUpdate();
                            }}
                        />
                    )}
                    {!sound.isPlaying && (
                        <ButtonLineComponent
                            label="Play"
                            onClick={() => {
                                sound.play();
                                this.forceUpdate();
                            }}
                        />
                    )}
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Samples"
                        target={sound}
                        directValue={sound.getVolume()}
                        onChange={(value) => {
                            sound.setVolume(value);
                            this.forceUpdate();
                        }}
                        minimum={0}
                        maximum={5}
                        step={0.1}
                        decimalCount={1}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent label="Loop" target={sound} propertyName="loop" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
            </div>
        );
    }
}
