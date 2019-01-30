import * as React from "react";

import { Vector3, Tmp } from "babylonjs/Maths/math";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { AxesViewer } from "babylonjs/Debug/axesViewer";

import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { UtilityLayerRenderer } from 'babylonjs/Rendering/utilityLayerRenderer';

interface IAxisViewerComponentProps {
    node: TransformNode;
}

export class AxesViewerComponent extends React.Component<IAxisViewerComponentProps, { displayAxis: boolean }> {
    constructor(props: IAxisViewerComponentProps) {
        super(props);
        const node = this.props.node;

        if (!node.reservedDataStore) {
            node.reservedDataStore = {};
        }

        this.state = { displayAxis: (node.reservedDataStore && node.reservedDataStore.axisViewer) ? true : false };
    }

    shouldComponentUpdate(nextProps: IAxisViewerComponentProps, nextState: { displayAxis: boolean }) {
        if (nextProps.node !== this.props.node) {
            nextState.displayAxis = (nextProps.node.reservedDataStore && nextProps.node.reservedDataStore.axisViewer) ? true : false;
        }

        return true;
    }

    displayAxes() {
        const node = this.props.node;
        const scene = UtilityLayerRenderer.DefaultUtilityLayer.utilityLayerScene;

        if (node.reservedDataStore.axisViewer) {
            node.reservedDataStore.axisViewer.dispose();
            node.reservedDataStore.axisViewer = null;

            scene.onBeforeRenderObservable.remove(node.reservedDataStore.onBeforeRenderObserver);
            node.reservedDataStore.onBeforeRenderObserver = null;

            this.setState({ displayAxis: false });

            return;
        }

        const viewer = new AxesViewer(scene);
        node.reservedDataStore.axisViewer = viewer;
        const x = new Vector3(1, 0, 0);
        const y = new Vector3(0, 1, 0);
        const z = new Vector3(0, 0, 1);

        viewer.xAxis.reservedDataStore = { hidden: true };
        viewer.yAxis.reservedDataStore = { hidden: true };
        viewer.zAxis.reservedDataStore = { hidden: true };

        node.reservedDataStore.onBeforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
            let cameraMatrix = scene.activeCamera!.getWorldMatrix();
            let matrix = node.getWorldMatrix();
            let extend = Tmp.Vector3[0];
            Vector3.TransformCoordinatesFromFloatsToRef(0, 0, 1, cameraMatrix, extend);

            viewer.scaleLines = extend.length() / 10;
            viewer.update(node.getAbsolutePosition(), Vector3.TransformNormal(x, matrix), Vector3.TransformNormal(y, matrix), Vector3.TransformNormal(z, matrix));
        });

        this.setState({ displayAxis: true });
    }

    render() {
        return (
            <CheckBoxLineComponent label="Display axes" isSelected={() => this.state.displayAxis} onSelect={() => this.displayAxes()} />
        );
    }
}