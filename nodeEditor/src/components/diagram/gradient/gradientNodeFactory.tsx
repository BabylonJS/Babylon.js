import * as SRD from "storm-react-diagrams";
import * as React from "react";
import { GlobalState } from '../../../globalState';
import { GradientNodeWidget } from './gradientNodeWidget';
import { GradientNodeModel } from './gradientNodeModel';

export class GradientNodeFactory extends SRD.AbstractNodeFactory {
    private _globalState: GlobalState;

    constructor(globalState: GlobalState) {
        super("gradient");

        this._globalState = globalState;
    }

    generateReactWidget(diagramEngine: SRD.DiagramEngine, node: GradientNodeModel): JSX.Element {
        return <GradientNodeWidget node={node} globalState={this._globalState} />;
    }

    getNewInstance() {
        return new GradientNodeModel();
    }
}