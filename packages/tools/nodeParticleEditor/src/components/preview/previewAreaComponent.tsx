import * as React from "react";
import type { GlobalState } from "../../globalState";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";

interface IPreviewAreaComponentProps {
    globalState: GlobalState;
    onMounted?: () => void;
}

export class PreviewAreaComponent extends React.Component<IPreviewAreaComponentProps, { isLoading: boolean }> {
    private _onIsLoadingChangedObserver: Nullable<Observer<boolean>>;
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;

    constructor(props: IPreviewAreaComponentProps) {
        super(props);
        this.state = { isLoading: true };

        this._onIsLoadingChangedObserver = this.props.globalState.onIsLoadingChanged.add((state) => {
            this.setState({ isLoading: state });
        });

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    override componentWillUnmount() {
        this.props.globalState.onIsLoadingChanged.remove(this._onIsLoadingChangedObserver);
        this.props.globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
    }

    override componentDidMount() {
        this.props.onMounted?.();
    }

    _onPointerOverCanvas = () => {
        this.props.globalState.pointerOverCanvas = true;
    };

    _onPointerOutCanvas = () => {
        this.props.globalState.pointerOverCanvas = false;
    };

    override render() {
        return (
            <>
                <div id="preview">
                    <canvas onPointerOver={this._onPointerOverCanvas} onPointerOut={this._onPointerOutCanvas} id="preview-canvas" />
                    {<div className={"waitPanel" + (this.state.isLoading ? "" : " hidden")}>Please wait, loading...</div>}
                </div>
            </>
        );
    }
}
