import * as React from "react";
import { PortWidget } from "storm-react-diagrams";
import { DefaultNodeModel } from './defaultNodeModel';
import { DefaultPortModel } from './defaultPortModel';
import { Nullable } from 'babylonjs/types';


export class PortHelper {
    public static GenerateOutputPorts(node: Nullable<DefaultNodeModel>, ignoreLabel: boolean) {
        if (!node) {
            return new Array<JSX.Element>();
        }
        let outputPorts = [];
        for (var key in node.ports) {
            let port = node.ports[key] as DefaultPortModel;
            if (port.position === "output") {
                outputPorts.push(
                    <div key={key} className="output-port">
                        {
                            !ignoreLabel &&
                            <div className="output-port-label">
                                {port.name}
                            </div>
                        }
                        <div className="output-port-plug">
                            <PortWidget key={key} name={port.name} node={node} className={port.connection && port.connection.endpoints.length > 0 ? "connected" : ""} />
                        </div>
                    </div>
                );
            }
        }

        return outputPorts;
    }

    public static GenerateInputPorts(node: Nullable<DefaultNodeModel>, includeOnly?: string[]) {
        if (!node) {
            return new Array<JSX.Element>();
        }
        let inputPorts = [];
        for (var key in node.ports) {
            let port = node.ports[key] as DefaultPortModel;
            if (port.position === "input") {
                if (!includeOnly || includeOnly.indexOf(port.name) !== -1) {
                    inputPorts.push(
                        <div key={key} className="input-port">
                            <div className="input-port-plug">
                                <PortWidget key={key} name={port.name} node={node} className={port.connection && port.connection.connectedPoint ? "connected" : ""} />
                            </div>
                            <div className="input-port-label">
                                {port.name}
                            </div>
                        </div>
                    );
                }
            }
        }

        return inputPorts;
    }
}