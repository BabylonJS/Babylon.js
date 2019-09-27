import * as React from "react";
import { DefaultNodeModel } from './defaultNodeModel';
import { DefaultPortModel } from './port/defaultPortModel';
import { Nullable } from 'babylonjs/types';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
import { DefaultPortWidget } from './port/defaultPortWidget';
import { BlockTools } from '../../blockTools';


export class PortHelper {
    private static _GetPortTypeIndicator(connection: NodeMaterialConnectionPoint): Nullable<JSX.Element> {
        switch (connection.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
            case NodeMaterialBlockConnectionPointTypes.Int:
                return <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IxPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48Y2lyY2xlIGNsYXNzPSJjbHMtMSIgY3g9IjEwLjUiIGN5PSIxMC41IiByPSI3LjUiLz48L2c+PC9zdmc+"></img>;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IyPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zLDEwLjVhNy41Miw3LjUyLDAsMCwwLDYuNSw3LjQzVjMuMDdBNy41Miw3LjUyLDAsMCwwLDMsMTAuNVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMS41LDMuMDdWMTcuOTNhNy41LDcuNSwwLDAsMCwwLTE0Ljg2WiIvPjwvZz48L3N2Zz4="></img>;
            case NodeMaterialBlockConnectionPointTypes.Vector3:
            case NodeMaterialBlockConnectionPointTypes.Color3:
                return <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3IzPC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0zLjU3LDEzLjMxLDkuNSw5Ljg5VjNBNy41MSw3LjUxLDAsMCwwLDMsMTAuNDYsNy4zMiw3LjMyLDAsMCwwLDMuNTcsMTMuMzFaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMTYuNDMsMTUsMTAuNSwxMS42Miw0LjU3LDE1YTcuNDgsNy40OCwwLDAsMCwxMS44NiwwWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE4LDEwLjQ2QTcuNTEsNy41MSwwLDAsMCwxMS41LDNWOS44OWw1LjkzLDMuNDJBNy4zMiw3LjMyLDAsMCwwLDE4LDEwLjQ2WiIvPjwvZz48L3N2Zz4="></img>;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5WZWN0b3I0PC90aXRsZT48ZyBpZD0iTGF5ZXJfNSIgZGF0YS1uYW1lPSJMYXllciA1Ij48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMS41LDExLjV2Ni40M2E3LjUxLDcuNTEsMCwwLDAsNi40My02LjQzWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMy4wN1Y5LjVoNi40M0E3LjUxLDcuNTEsMCwwLDAsMTEuNSwzLjA3WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTkuNSwxNy45M1YxMS41SDMuMDdBNy41MSw3LjUxLDAsMCwwLDkuNSwxNy45M1oiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LjUsMy4wN0E3LjUxLDcuNTEsMCwwLDAsMy4wNyw5LjVIOS41WiIvPjwvZz48L3N2Zz4="></img>;
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                return <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMSAyMSI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5NYXRyaXg8L3RpdGxlPjxnIGlkPSJMYXllcl81IiBkYXRhLW5hbWU9IkxheWVyIDUiPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsNi4xMVY5LjVoMy4zOUE0LjUxLDQuNTEsMCwwLDAsMTEuNSw2LjExWiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMTQuODlhNC41MSw0LjUxLDAsMCwwLDMuMzktMy4zOUgxMS41WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTExLjUsMy4wN3YyQTUuNTQsNS41NCwwLDAsMSwxNS45Miw5LjVoMkE3LjUxLDcuNTEsMCwwLDAsMTEuNSwzLjA3WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE1LjkyLDExLjVhNS41NCw1LjU0LDAsMCwxLTQuNDIsNC40MnYyYTcuNTEsNy41MSwwLDAsMCw2LjQzLTYuNDNaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNS4wOCwxMS41aC0yQTcuNTEsNy41MSwwLDAsMCw5LjUsMTcuOTN2LTJBNS41NCw1LjU0LDAsMCwxLDUuMDgsMTEuNVoiLz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05LjUsMy4wN0E3LjUxLDcuNTEsMCwwLDAsMy4wNyw5LjVoMkE1LjU0LDUuNTQsMCwwLDEsOS41LDUuMDhaIi8+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNOS41LDExLjVINi4xMUE0LjUxLDQuNTEsMCwwLDAsOS41LDE0Ljg5WiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTkuNSw2LjExQTQuNTEsNC41MSwwLDAsMCw2LjExLDkuNUg5LjVaIi8+PC9nPjwvc3ZnPg=="></img>;
        }

        return null;
    }

    static _GetPortStyle(type: NodeMaterialBlockConnectionPointTypes) {
        return {
            background: BlockTools.GetColorFromConnectionNodeType(type)
        };
    }

    public static GenerateOutputPorts(node: Nullable<DefaultNodeModel>, ignoreLabel: boolean) {
        if (!node) {
            return new Array<JSX.Element>();
        }
        let outputPorts = [];
        for (var key in node.ports) {
            let port = node.ports[key] as DefaultPortModel;
            if (port.position === "output") {
                let typeIndicator = this._GetPortTypeIndicator(port.connection!);

                let style = this._GetPortStyle(port.connection!.type);

                outputPorts.push(
                    <div key={key}                                    
				        title={port.name}
                        className="output-port">
                        {
                            !ignoreLabel &&
                            <div className="output-port-label">
                                {port.connection!.name}
                            </div>
                        }
                        <div className="output-port-plug">
                            <DefaultPortWidget key={key} name={port.name} node={node} style={style} />
                            <div className="output-port-type"> 
                                {
                                    typeIndicator
                                }                                
                            </div>
                        </div>
                    </div>
                );
            }
        }

        return outputPorts;
    }

    public static GenerateInputPorts(node: Nullable<DefaultNodeModel>, includeOnly?: string[], ignoreLabel: boolean = false) {
        if (!node) {
            return new Array<JSX.Element>();
        }
        let inputPorts = [];
        for (var key in node.ports) {
            let port = node.ports[key] as DefaultPortModel;
            if (port.position === "input") {                
                let typeIndicator = this._GetPortTypeIndicator(port.connection!);
                let style = this._GetPortStyle(port.connection!.type);

                if (!includeOnly || includeOnly.indexOf(port.name) !== -1) {
                    inputPorts.push(
                        <div key={key}                         
				            title={port.name}
                            className="input-port">
                            <div className="input-port-plug">
                                <DefaultPortWidget key={key} name={port.name} node={node} style={style}/>
                                <div className="input-port-type"> 
                                    {
                                        typeIndicator
                                    }                                
                                </div>                         
                            </div>
                            {
                                !ignoreLabel &&
                                <div className="input-port-label">
                                    {port.connection!.name}
                                </div>   
                            }
                        </div>
                    );
                }
            }
        }

        return inputPorts;
    }
}