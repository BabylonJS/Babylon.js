import * as SRD from "storm-react-diagrams";
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { ClampNodeWidget } from './clampNodeWidget';
import { ClampNodeModel } from './clampNodeModel';

export class ClampNodeFactory extends SRD.AbstractNodeFactory {
    private _globalState: GlobalState;

    constructor(globalState: GlobalState) {
        super("clamp");

        this._globalState = globalState;
    }

    generateReactWidget(diagramEngine: SRD.DiagramEngine, node: ClampNodeModel): JSX.Element {
        return <ClampNodeWidget node={node} globalState={this._globalState} />;
    }

    getNewInstance() {
        return new ClampNodeModel();
    }
}