import { DefaultLinkFactory, DefaultLinkWidget } from 'storm-react-diagrams';
import * as React from 'react';
import { DefaultPortModel } from '../port/defaultPortModel';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';
import { AdvancedLinkModel } from './advancedLinkModel';
import { BlockTools } from '../../../blockTools';

export class AdvancedLinkFactory extends DefaultLinkFactory {
	constructor() {
		super();
		this.type = "advanced";
	}

	getNewInstance(initialConfig?: any): AdvancedLinkModel {
		return new AdvancedLinkModel();
	}

	generateLinkSegment(model: AdvancedLinkModel, widget: DefaultLinkWidget, selected: boolean, path: string) {
        const portModel = (model.getSourcePort() || model.getTargetPort()) as DefaultPortModel;
        const type = portModel.connection!.type;
		let color = BlockTools.GetColorFromConnectionNodeType(type);
		let width = 1;

        // Color
        switch (type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
				width = 1;
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector2:                
				width = 2;
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector3:                
				width = 3;
                break;
            case NodeMaterialBlockConnectionPointTypes.Vector4:                
				width = 4;
                break;
            case NodeMaterialBlockConnectionPointTypes.Color3:                
				width = 3;
                break;
            case NodeMaterialBlockConnectionPointTypes.Color4:                
				width = 4;
                break;
            case NodeMaterialBlockConnectionPointTypes.Matrix:                
				width = 6;
                break;
        }


		return (
			<path
				className={selected ? widget.bem("--path-selected") : ""}
				strokeWidth={width}
				stroke={color}
				d={path}
			/>
		);
	}
}