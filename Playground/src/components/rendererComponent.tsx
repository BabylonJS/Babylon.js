import * as React from "react";

require("../scss/rendering.scss");

interface IRenderingComponentProps {
}

export class RenderingComponent extends React.Component<IRenderingComponentProps> {

    componentDidMount() {
        
    }

    public render() {
        return (
            <canvas id="renderingCanvas"></canvas>
        )
    }
}