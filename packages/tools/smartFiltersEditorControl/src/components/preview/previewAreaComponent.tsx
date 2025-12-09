import * as react from "react";
import type { GlobalState } from "../../globalState";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { FillMode, FixedMode, type PreviewSizeMode } from "../../previewSizeManager.js";

interface IPreviewAreaComponentProps {
    globalState: GlobalState;
    allowPreviewFillMode: boolean;
}

interface IPreviewAreaComponentState {
    isLoading: boolean;
    isDragging: boolean;
    dragPointerStartX: number;
    dragPointerStartY: number;
    dragTranslateStartX: number;
    dragTranslateStartY: number;
    deltaX: number;
    deltaY: number;
}

/**
 * Creates the canvas for preview, sets the size based on the PreviewSizeManager's state, and tells the engine to resize
 * when the canvas changes natural size.
 */
export class PreviewAreaComponent extends react.Component<IPreviewAreaComponentProps, IPreviewAreaComponentState> {
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;
    private _onPreviewResetRequiredObserver: Nullable<Observer<void>>;
    private _onModeChangedObserver: Nullable<Observer<PreviewSizeMode>>;
    private _fixedWidthObserver: Nullable<Observer<number>>;
    private _fixedHeightObserver: Nullable<Observer<number>>;
    private _aspectRatioObserver: Nullable<Observer<string>>;
    private _canvasRef = react.createRef<HTMLCanvasElement>();
    private _canvasResizeObserver: ResizeObserver;

    /**
     * Creates a new PreviewAreaComponent.
     * @param props The component props.
     */
    constructor(props: IPreviewAreaComponentProps) {
        super(props);

        this.state = { isLoading: false, isDragging: false, dragPointerStartX: 0, dragPointerStartY: 0, dragTranslateStartX: 0, dragTranslateStartY: 0, deltaX: 0, deltaY: 0 };

        this._canvasResizeObserver = new ResizeObserver(() => {
            if (this.props.globalState.engine) {
                setTimeout(() => {
                    this.props.globalState.engine?.resize();
                }, 0);
            }
        });

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable.add(() => {
            this.forceUpdate();
        });
        this._onPreviewResetRequiredObserver = this.props.globalState.onPreviewResetRequiredObservable.add(() => {
            this.forceUpdate();
        });
        this._onModeChangedObserver = this.props.globalState.previewSizeManager.mode.onChangedObservable.add(() => {
            this.forceUpdate();
        });
        this._fixedWidthObserver = this.props.globalState.previewSizeManager.fixedWidth.onChangedObservable.add(() => {
            this.forceUpdate();
        });
        this._fixedHeightObserver = this.props.globalState.previewSizeManager.fixedHeight.onChangedObservable.add(() => {
            this.forceUpdate();
        });
        this._aspectRatioObserver = this.props.globalState.previewSizeManager.aspectRatio.onChangedObservable.add(() => {
            this.forceUpdate();
        });
    }

    /**
     * When the component mounts, attach the observer if the canvas is ready.
     */
    override componentDidMount() {
        this._attachObserverToCanvas();
    }

    /**
     * When the component updates, ensure the observer is attached to the canvas.
     */
    override componentDidUpdate() {
        this._attachObserverToCanvas();
    }

    /**
     * Lifecycle cleanup for observers.
     */
    override componentWillUnmount() {
        this.props.globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
        this.props.globalState.onPreviewResetRequiredObservable.remove(this._onPreviewResetRequiredObserver);
        this.props.globalState.previewSizeManager.mode.onChangedObservable.remove(this._onModeChangedObserver);
        this.props.globalState.previewSizeManager.fixedWidth.onChangedObservable.remove(this._fixedWidthObserver);
        this.props.globalState.previewSizeManager.fixedHeight.onChangedObservable.remove(this._fixedHeightObserver);
        this.props.globalState.previewSizeManager.aspectRatio.onChangedObservable.remove(this._aspectRatioObserver);

        if (this._canvasRef.current) {
            this._canvasResizeObserver.unobserve(this._canvasRef.current);
        }
    }

    /**
     * Renders the preview area and canvas.
     * @returns The preview JSX element.
     */
    override render() {
        let divStyle: any;
        let canvasStyle: any;

        switch (this.props.globalState.previewSizeManager.mode.value) {
            case FillMode:
                canvasStyle = { width: "100%", height: "100%" };
                break;
            case FixedMode:
                divStyle = {
                    height: "100%",
                };
                canvasStyle = {
                    width: this.props.globalState.previewSizeManager.fixedWidth.value + "px",
                    height: this.props.globalState.previewSizeManager.fixedHeight.value + "px",
                    position: "relative",
                    transform: `translate(${this.state.deltaX}px, ${this.state.deltaY}px)`,
                };
                break;
            case "aspectRatio":
                canvasStyle = divStyle = { aspectRatio: this.props.globalState.previewSizeManager.aspectRatio.value };
                break;
        }

        return (
            <>
                <div
                    id="preview"
                    style={divStyle}
                    onPointerDown={this._onPointerDown}
                    onDoubleClick={this._onDoubleClick}
                    onPointerMove={this._onPointerMove}
                    onPointerUp={this._onPointerUp}
                    onPointerCancel={this._onPointerCancel}
                >
                    <canvas id="sfe-preview-canvas" style={canvasStyle} className={"preview-background-" + this.props.globalState.previewBackground} ref={this._canvasRef} />
                    {!this.props.globalState.smartFilter ? <div className={"waitPanel" + (this.state.isLoading ? "" : " hidden")}>Please wait, loading...</div> : <></>}
                </div>
            </>
        );
    }

    private _attachObserverToCanvas() {
        const canvas = this._canvasRef.current;

        if (canvas) {
            this._canvasResizeObserver.observe(canvas);
        }
    }

    private _onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!this._isDragSupported()) {
            return;
        }
        this.setState({
            isDragging: true,
            dragPointerStartX: event.clientX,
            dragPointerStartY: event.clientY,
            dragTranslateStartX: this.state.deltaX,
            dragTranslateStartY: this.state.deltaY,
        });
        event.preventDefault();
        this._canvasRef.current?.setPointerCapture(event.pointerId);
    };

    private _onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!this._isDragSupported()) {
            return;
        }
        if (this.state.isDragging) {
            const deltaX = this.state.dragTranslateStartX + (event.clientX - this.state.dragPointerStartX);
            const deltaY = this.state.dragTranslateStartY + (event.clientY - this.state.dragPointerStartY);
            this.setState({ deltaX, deltaY });
        }
    };

    private _onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!this._isDragSupported()) {
            return;
        }
        this.setState({ isDragging: false });
        this._canvasRef.current?.releasePointerCapture(event.pointerId);
    };

    private _onPointerCancel = () => {
        if (!this._isDragSupported()) {
            return;
        }
        this.setState({ isDragging: false });
    };

    private _onDoubleClick = () => {
        if (!this._isDragSupported()) {
            return;
        }
        this.setState({ isDragging: false, deltaX: 0, deltaY: 0 });
    };

    private _isDragSupported() {
        return this.props.globalState.previewSizeManager.mode.value === FixedMode;
    }
}
