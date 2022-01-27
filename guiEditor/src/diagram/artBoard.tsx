import * as React from "react";
import { GlobalState } from "../globalState";
import { CoordinateHelper, Rect } from "./coordinateHelper";

interface IArtBoardProps {
    globalState: GlobalState
}

interface IArtBoardState {
    bounds: Rect;
}

export class ArtBoardComponent extends React.Component<IArtBoardProps, IArtBoardState> {
    constructor(props: IArtBoardProps) {
        super(props);
        this.state = {
            bounds: new Rect(0,0,0,0)
        }
        this.props.globalState.onArtBoardUpdateRequiredObservable.add(() => this.update());
    }

    update() {
        const visibleRegion = this.props.globalState.workbench.visibleRegionContainer;
        if (!visibleRegion) return;
        const localBounds = CoordinateHelper.computeLocalBounds(visibleRegion);
        const topLeftRTT = CoordinateHelper.nodeToRTTSpace(visibleRegion, localBounds.top, localBounds.left, undefined);
        const topLeftCanvas = CoordinateHelper.rttToCanvasSpace(topLeftRTT.x, topLeftRTT.y);
        const bottomRightRTT = CoordinateHelper.nodeToRTTSpace(visibleRegion, localBounds.bottom, localBounds.right, undefined);
        const bottomRightCanvas = CoordinateHelper.rttToCanvasSpace(bottomRightRTT.x, bottomRightRTT.y);
        this.setState({
            bounds: new Rect(topLeftCanvas.x, topLeftCanvas.y, bottomRightCanvas.x, bottomRightCanvas.y)
        })
        console.log(this.state);
    }


    render() {
        return <div className="artboard" style={{
            top: `${this.state.bounds.top}px`,
            left: `${this.state.bounds.left}px`,
            width: `${this.state.bounds.width}px`,
            height: `${this.state.bounds.height}px`
        }}>
        </div>
    }
}