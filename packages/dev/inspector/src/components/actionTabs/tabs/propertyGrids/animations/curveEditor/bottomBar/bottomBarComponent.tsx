import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import * as React from "react";
import type { GlobalState } from "../../../../../../globalState";
import type { Context, IActiveAnimationChangedOptions } from "../context";
import { TextInputComponent } from "../controls/textInputComponent";
import { MediaPlayerComponent } from "./mediaPlayerComponent";
import { RangeSelectorComponent } from "./rangeSelectorComponent";

import "../scss/bottomBar.scss";

interface IBottomBarComponentProps {
    globalState: GlobalState;
    context: Context;
}

interface IBottomBarComponentState {
    clipLength: string;
}

export class BottomBarComponent extends React.Component<IBottomBarComponentProps, IBottomBarComponentState> {
    private _onAnimationsLoadedObserver: Nullable<Observer<void>>;
    private _onActiveAnimationChangedObserver: Nullable<Observer<IActiveAnimationChangedOptions>>;
    private _onClipLengthIncreasedObserver: Nullable<Observer<number>>;
    private _onClipLengthDecreasedObserver: Nullable<Observer<number>>;

    constructor(props: IBottomBarComponentProps) {
        super(props);

        this.state = { clipLength: this.props.context.clipLength ? this.props.context.clipLength.toFixed(0) : this.props.context.referenceMaxFrame.toFixed(0) };

        this._onAnimationsLoadedObserver = this.props.context.onAnimationsLoaded.add(() => {
            this.forceUpdate();
        });

        this._onActiveAnimationChangedObserver = this.props.context.onActiveAnimationChanged.add(() => {
            this.forceUpdate();
        });

        this._onClipLengthIncreasedObserver = this.props.context.onClipLengthIncreased.add((newClipLength) => {
            // New clip length is greater than current clip length: add a key frame at the new clip length location with the same value as the previous frame
            this.props.context.clipLength = newClipLength;

            this.props.context.onMoveToFrameRequired.notifyObservers(newClipLength);
            const keyAlreadyExists = this.props.context.getKeyAtAnyFrameIndex(newClipLength) !== null;
            if (!keyAlreadyExists) {
                this.props.context.onCreateOrUpdateKeyPointRequired.notifyObservers();
            }

            this.setState({ clipLength: newClipLength.toFixed(0) });
        });

        this._onClipLengthIncreasedObserver = this.props.context.onClipLengthDecreased.add((newClipLength) => {
            // New clip length is smaller than current clip length: move the playing range to the new clip length
            this.props.context.clipLength = newClipLength;

            this.props.context.onMoveToFrameRequired.notifyObservers(newClipLength);
            const keyAlreadyExists = this.props.context.getKeyAtAnyFrameIndex(newClipLength) !== null;
            if (!keyAlreadyExists) {
                this.props.context.onCreateOrUpdateKeyPointRequired.notifyObservers();
            }

            this.props.context.toKey = Math.min(this.props.context.toKey, this.props.context.clipLength);
            this.props.context.onRangeUpdated.notifyObservers();

            this.setState({ clipLength: newClipLength.toFixed(0) });
        });
    }

    private _changeClipLength(newClipLength: number) {
        const currClipLength = this.props.context.clipLength || this.props.context.referenceMaxFrame;
        if (currClipLength < newClipLength) {
            this.props.context.onClipLengthIncreased.notifyObservers(newClipLength);
        } else if (currClipLength > newClipLength) {
            this.props.context.onClipLengthDecreased.notifyObservers(newClipLength);
        }
        this.setState({ clipLength: newClipLength.toFixed(0) });
    }

    componentWillUnmount() {
        if (this._onAnimationsLoadedObserver) {
            this.props.context.onAnimationsLoaded.remove(this._onAnimationsLoadedObserver);
        }

        if (this._onActiveAnimationChangedObserver) {
            this.props.context.onActiveAnimationChanged.remove(this._onActiveAnimationChangedObserver);
        }

        if (this._onClipLengthDecreasedObserver) {
            this.props.context.onClipLengthDecreased.remove(this._onClipLengthDecreasedObserver);
        }

        if (this._onClipLengthIncreasedObserver) {
            this.props.context.onClipLengthDecreased.remove(this._onClipLengthIncreasedObserver);
        }
    }

    public render() {
        return (
            <div id="bottom-bar">
                <MediaPlayerComponent globalState={this.props.globalState} context={this.props.context} />
                <RangeSelectorComponent globalState={this.props.globalState} context={this.props.context} />
                {this.props.context.activeAnimations.length > 0 && (
                    <div id="bottom-bar-total">
                        <TextInputComponent
                            isNumber={true}
                            value={this.state.clipLength}
                            tooltip="Clip Length"
                            id="clip-range"
                            onValueAsNumberChanged={(newValue, isFocused) => {
                                !isFocused && this._changeClipLength(newValue);
                            }}
                            globalState={this.props.globalState}
                            context={this.props.context}
                        />
                    </div>
                )}
            </div>
        );
    }
}
