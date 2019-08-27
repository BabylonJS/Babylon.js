import * as React from "react";
import { DefaultNodeModel } from './defaultNodeModel';
import { DefaultPortModel } from './port/defaultPortModel';
import { Nullable } from 'babylonjs/types';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';
import { DefaultPortWidget } from './port/defaultPortWidget';
import { BlockTools } from '../../blockTools';


export class PortHelper {
    private static _GetPortTypeIndicator(connection: NodeMaterialConnectionPoint): Nullable<JSX.Element> {
        switch (connection.type) {
            case NodeMaterialBlockConnectionPointTypes.Float:
            case NodeMaterialBlockConnectionPointTypes.Int:
                return <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABESURBVDhPY/z//z8DJYAJSpMNRg3Ab4APEL+GYhAbK8AXjSCNIhAmwxsgFoUwUQFNvZAJxCCbQRjExgpGU+LAG8DAAAA+ghAthzG18wAAAABJRU5ErkJggg=="></img>;
            case NodeMaterialBlockConnectionPointTypes.Vector2:
                return <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABHSURBVDhPY/z//z8DJYAJSpMN8BngA8SvoRjExgrweQGkUQTCZHgDxKIQJiqgqRcygRhkMwiD2FjB4I4FosBoNA6DaGRgAABqpx09dHGG2QAAAABJRU5ErkJggg=="></img>;
            case NodeMaterialBlockConnectionPointTypes.Vector3:
            case NodeMaterialBlockConnectionPointTypes.Color3:
                return <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABHSURBVDhPY/z//z8DJYAJSmMDPkD8GopBbKwAnwtAGkUgTIY3QCwKYaICfC4gCuAzIBOIQTaDMIiNFYwG4mgggsCQD0QGBgD0QypNGzDYqQAAAABJRU5ErkJggg=="></img>;
            case NodeMaterialBlockConnectionPointTypes.Vector4:
            case NodeMaterialBlockConnectionPointTypes.Color4:
                return <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABRSURBVDhPY/z//z8DJYAJSpMN0A3wAeLXUAxiwwAucQYGkBeQ8GsghgEQm5A45V6AmwTFIUAMsgGEQWxC4gyDLxZIBqPpAAiQTQPiIZcOGBgAyCDrTTmX3gcAAAAASUVORK5CYII="></img>;
            case NodeMaterialBlockConnectionPointTypes.Matrix:
                return <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsIAAA7CARUoSoAAAABuSURBVDhPY/z//z8DJYAJSpMN0A3wAeLXUAxiwwAucQZ0L4AUiECYOMEbIBaFMGnghUwoDQKhQMwIxSA2DCCrwfACCMAEQBqRAVZxqnuBZEB1A9DjHgZwsQdpOgDZAMLo6QAmTjAdkAQo9AIDAwD62SHFU/Hk8QAAAABJRU5ErkJggg=="></img>;
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
                    <div key={key} className="output-port">
                        {
                            !ignoreLabel &&
                            <div className="output-port-label">
                                {port.connection!.name}
                            </div>
                        }
                        <div className="output-port-plug">
                            <div className="output-port-border">                                
                            </div>
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
                        <div key={key} className="input-port">
                            <div className="input-port-plug">
                                <div className="input-port-border">                                
                                </div>
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