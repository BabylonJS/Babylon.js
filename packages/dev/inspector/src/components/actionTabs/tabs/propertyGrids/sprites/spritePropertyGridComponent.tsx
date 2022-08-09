/* eslint-disable @typescript-eslint/naming-convention */
import * as React from "react";

import type { Observable } from "core/Misc/observable";
import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { GlobalState } from "../../../../globalState";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { Sprite } from "core/Sprites/sprite";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { TextureHelper } from "../../../../../textureHelper";
import type { Nullable } from "core/types";
import { Color4LineComponent } from "shared-ui-components/lines/color4LineComponent";

interface ISpritePropertyGridComponentProps {
    globalState: GlobalState;
    sprite: Sprite;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
    onSelectionChangedObservable?: Observable<any>;
}

export class SpritePropertyGridComponent extends React.Component<ISpritePropertyGridComponentProps> {
    private _canvasRef: React.RefObject<HTMLCanvasElement>;
    private _imageData: Nullable<Uint8Array> = null;
    private _cachedCellIndex = -1;

    constructor(props: ISpritePropertyGridComponentProps) {
        super(props);

        this._canvasRef = React.createRef();
    }

    onManagerLink() {
        if (!this.props.onSelectionChangedObservable) {
            return;
        }

        const sprite = this.props.sprite;
        this.props.onSelectionChangedObservable.notifyObservers(sprite.manager);
    }

    switchPlayStopState() {
        const sprite = this.props.sprite;

        if (sprite.animationStarted) {
            sprite.stopAnimation();
        } else {
            sprite.playAnimation(sprite.fromIndex, sprite.toIndex, sprite.loopAnimation, sprite.delay, () => {});
        }

        this.forceUpdate();
    }

    disposeSprite() {
        const sprite = this.props.sprite;
        sprite.dispose();

        this.props.onSelectionChangedObservable?.notifyObservers(null);
    }

    componentDidMount() {
        this.updatePreview();
    }

    componentDidUpdate() {
        this.updatePreview();
    }

    shouldComponentUpdate(nextProps: ISpritePropertyGridComponentProps) {
        if (nextProps.sprite !== this.props.sprite) {
            this._imageData = null;
        }

        return true;
    }

    updatePreview() {
        const sprite = this.props.sprite;
        const manager = sprite.manager;
        const texture = manager.texture;
        const size = texture.getSize();

        if (!this._imageData) {
            TextureHelper.GetTextureDataAsync(texture, size.width, size.height, 0, { R: true, G: true, B: true, A: true }, this.props.globalState).then((data) => {
                this._imageData = data;
                this.forceUpdate();
            });

            return;
        }

        if (this._cachedCellIndex === sprite.cellIndex) {
            return;
        }

        this._cachedCellIndex = sprite.cellIndex;

        const previewCanvas = this._canvasRef.current as HTMLCanvasElement;
        previewCanvas.width = manager.cellWidth;
        previewCanvas.height = manager.cellHeight;
        const context = previewCanvas.getContext("2d");

        if (context) {
            // Copy the pixels to the preview canvas
            const imageData = context.createImageData(manager.cellWidth, manager.cellHeight);
            const castData = imageData.data;

            const rowLength = (size.width / manager.cellWidth) | 0;
            const offsetY = (sprite.cellIndex / rowLength) | 0;
            const offsetX = sprite.cellIndex - offsetY * rowLength;
            const offset = (offsetX + offsetY * size.width) * 4 * manager.cellWidth;

            for (let x = 0; x < manager.cellWidth; x++) {
                for (let y = 0; y < manager.cellHeight; y++) {
                    const targetCoord = (x + y * manager.cellWidth) * 4;
                    const sourceCoord = (x + y * size.width) * 4;
                    castData[targetCoord] = this._imageData[offset + sourceCoord];
                    castData[targetCoord + 1] = this._imageData[offset + sourceCoord + 1];
                    castData[targetCoord + 2] = this._imageData[offset + sourceCoord + 2];
                    castData[targetCoord + 3] = this._imageData[offset + sourceCoord + 3];
                }
            }

            context.putImageData(imageData, 0, 0);
        }
    }

    render() {
        const sprite = this.props.sprite;
        const manager = sprite.manager;
        const textureSize = manager.texture.getSize();
        let maxCellCount = 0;

        if (!textureSize.width || !textureSize.height) {
            maxCellCount = Math.max(sprite.fromIndex, sprite.toIndex);
        } else {
            maxCellCount = (textureSize.width / manager.cellWidth) * (textureSize.height / manager.cellHeight);
        }

        return (
            <div className="pane">
                <LineContainerComponent title="GENERAL" selection={this.props.globalState}>
                    <TextInputLineComponent
                        lockObject={this.props.lockObject}
                        label="Name"
                        target={sprite}
                        propertyName="name"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <TextLineComponent label="Unique ID" value={sprite.uniqueId.toString()} />
                    <TextLineComponent label="Link to manager" value={manager.name} onLink={() => this.onManagerLink()} />
                    <CheckBoxLineComponent label="Visible" target={sprite} propertyName="isVisible" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <ButtonLineComponent label="Dispose" onClick={() => this.disposeSprite()} />
                </LineContainerComponent>
                <LineContainerComponent title="PROPERTIES" selection={this.props.globalState}>
                    <Vector3LineComponent
                        lockObject={this.props.lockObject}
                        label="Position"
                        target={sprite}
                        propertyName="position"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent label="Pickable" target={sprite} propertyName="isPickable" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent
                        label="Use alpha for picking"
                        target={sprite}
                        propertyName="useAlphaForPicking"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <Color4LineComponent
                        lockObject={this.props.lockObject}
                        label="Color"
                        target={sprite}
                        propertyName="color"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        useEuler={this.props.globalState.onlyUseEulers}
                        label="Angle"
                        target={sprite}
                        propertyName="angle"
                        minimum={0}
                        maximum={2 * Math.PI}
                        step={0.01}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="CELL" selection={this.props.globalState}>
                    <canvas
                        ref={this._canvasRef}
                        className="preview"
                        style={{
                            margin: "auto",
                            marginTop: "4px",
                            marginBottom: "4px",
                            display: "grid",
                            height: "108px",
                        }}
                    />
                    <SliderLineComponent
                        lockObject={this.props.lockObject}
                        label="Cell index"
                        decimalCount={0}
                        target={sprite}
                        propertyName="cellIndex"
                        minimum={0}
                        maximum={maxCellCount}
                        step={1}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        onChange={() => this.forceUpdate()}
                    />
                    <CheckBoxLineComponent label="Invert U axis" target={sprite} propertyName="invertU" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <CheckBoxLineComponent label="Invert V axis" target={sprite} propertyName="invertV" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                <LineContainerComponent title="SCALE" selection={this.props.globalState}>
                    <FloatLineComponent
                        label="Width"
                        lockObject={this.props.lockObject}
                        target={sprite}
                        propertyName="width"
                        min={0}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        label="Height"
                        lockObject={this.props.lockObject}
                        target={sprite}
                        propertyName="height"
                        min={0}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                </LineContainerComponent>
                <LineContainerComponent title="ANIMATION" selection={this.props.globalState}>
                    <FloatLineComponent
                        label="Start cell"
                        isInteger={true}
                        lockObject={this.props.lockObject}
                        target={sprite}
                        propertyName="fromIndex"
                        min={0}
                        max={maxCellCount}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <FloatLineComponent
                        label="End cell"
                        isInteger={true}
                        lockObject={this.props.lockObject}
                        target={sprite}
                        propertyName="toIndex"
                        min={0}
                        max={maxCellCount}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <CheckBoxLineComponent label="Loop" target={sprite} propertyName="loopAnimation" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent
                        label="Delay"
                        lockObject={this.props.lockObject}
                        target={sprite}
                        propertyName="delay"
                        digits={0}
                        min={0}
                        isInteger={true}
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    <ButtonLineComponent label={sprite.animationStarted ? "Stop" : "Start"} onClick={() => this.switchPlayStopState()} />
                </LineContainerComponent>
            </div>
        );
    }
}
