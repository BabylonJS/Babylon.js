import type { GraphCanvasComponent } from "./graphCanvas";
import type { GraphNode } from "./graphNode";
import type { NodeLink } from "./nodeLink";
import type { FramePortData } from "./types/framePortData";
import * as localStyles from "./graphNode.module.scss";

export const IsFramePortData = (variableToCheck: any): variableToCheck is FramePortData => {
    if (variableToCheck) {
        return (variableToCheck as FramePortData).port !== undefined;
    } else {
        return false;
    }
};

export const RefreshNode = (node: GraphNode, visitedNodes?: Set<GraphNode>, visitedLinks?: Set<NodeLink>, canvas?: GraphCanvasComponent) => {
    node.refresh();

    const links = node.links;

    if (visitedNodes) {
        // refresh first the nodes so that the right types are assigned to the auto-detect ports
        for (const link of links) {
            const nodeA = link.nodeA,
                nodeB = link.nodeB;

            if (!visitedNodes.has(nodeA)) {
                visitedNodes.add(nodeA);
                RefreshNode(nodeA, visitedNodes, visitedLinks);
            }

            if (nodeB && !visitedNodes.has(nodeB)) {
                visitedNodes.add(nodeB);
                RefreshNode(nodeB, visitedNodes, visitedLinks);
            }
        }
    }

    // Invisible endpoints (for teleport nodes)
    const invisibleEndpoints = node.content.invisibleEndpoints;
    if (invisibleEndpoints && invisibleEndpoints.length) {
        for (const endpoint of invisibleEndpoints) {
            const graphNode = canvas?.findNodeFromData(endpoint);
            if (graphNode) {
                if (visitedNodes) {
                    visitedNodes.add(graphNode);
                }
                RefreshNode(graphNode, visitedNodes, visitedLinks);
            }
        }
    }

    if (!visitedLinks) {
        return;
    }

    // then refresh the links to display the right color between ports
    for (const link of links) {
        if (!visitedLinks.has(link)) {
            visitedLinks.add(link);
            link.update();
        }
    }
};

let idGenerator = 0;
export const BuildFloatUI = (
    container: HTMLDivElement,
    document: Document,
    displayName: string,
    isInteger: boolean,
    source: any,
    propertyName: string,
    onChange: () => void,
    min?: number,
    max?: number,
    visualPropertiesRefresh?: Array<() => void>,
    additionalClassName?: string
) => {
    const cantDisplaySlider = min === undefined || max === undefined || isNaN(min) || isNaN(max) || min === max;
    if (cantDisplaySlider) {
        container.classList.add(localStyles.floatContainer);
        const numberInput = document.createElement("input");
        numberInput.type = "number";
        numberInput.id = `number-${idGenerator++}`;
        if (additionalClassName) {
            numberInput.classList.add(additionalClassName);
        }

        if (visualPropertiesRefresh) {
            visualPropertiesRefresh.push(() => {
                numberInput.value = source[propertyName];
            });
        } else {
            numberInput.value = source[propertyName];
        }
        numberInput.onchange = () => {
            source[propertyName] = parseFloat(numberInput.value);
            onChange();
        };

        if (isInteger) {
            numberInput.step = "1";
        }

        container.appendChild(numberInput);
        const label = document.createElement("div");
        label.innerText = displayName;
        if (additionalClassName) {
            label.classList.add(additionalClassName);
        }
        container.appendChild(label);

        let shouldCapture = false;
        numberInput.onpointerdown = (evt) => {
            shouldCapture = true;
            evt.preventDefault();
        };
        numberInput.onpointerup = (evt) => {
            if (numberInput.hasPointerCapture(evt.pointerId)) {
                numberInput.releasePointerCapture(evt.pointerId);
                shouldCapture = false;
                evt.preventDefault();
            } else {
                numberInput.focus();
                numberInput.select();
            }
        };
        numberInput.onpointermove = (evt) => {
            if (shouldCapture) {
                numberInput.setPointerCapture(evt.pointerId);
            }

            if (numberInput.hasPointerCapture(evt.pointerId)) {
                const delta = isInteger ? Math.sign(evt.movementX) : evt.movementX * 0.01;
                numberInput.value = (parseFloat(numberInput.value) + delta).toFixed(isInteger ? 0 : 2);

                source[propertyName] = isInteger ? parseInt(numberInput.value) : parseFloat(numberInput.value);
                onChange();
                evt.preventDefault();
            }
        };
    } else {
        container.classList.add(localStyles.sliderContainer);
        const label = document.createElement("label");
        container.appendChild(label);
        const value = document.createElement("div");
        container.appendChild(value);
        const slider = document.createElement("input");
        slider.type = "range";
        slider.id = `slider-${idGenerator++}`;
        slider.step = isInteger ? "1" : (Math.abs(max - min) / 100.0).toString();
        slider.min = min.toString();
        slider.max = max.toString();
        container.appendChild(slider);
        label.innerText = displayName;
        label.htmlFor = slider.id;
        if (visualPropertiesRefresh) {
            visualPropertiesRefresh.push(() => {
                slider.value = source[propertyName];
                value.innerText = source[propertyName];
            });
        } else {
            slider.value = source[propertyName];
            value.innerText = source[propertyName];
        }
        slider.oninput = () => {
            source[propertyName] = parseFloat(slider.value);
            value.innerText = source[propertyName];
            onChange();
        };
    }
};

export function GetListOfAcceptedTypes<T extends Record<string, string | number>>(
    types: T,
    allValue: number,
    autoDetectValue: number,
    port: { acceptedConnectionPointTypes: number[]; excludedConnectionPointTypes: number[]; type: number },
    skips: number[] = []
) {
    let acceptedTypes: string[] = [];

    if (port.type !== autoDetectValue) {
        acceptedTypes = [types[port.type] as string];
    }

    if (port.acceptedConnectionPointTypes.length !== 0) {
        acceptedTypes = port.acceptedConnectionPointTypes.filter((t) => t && t !== port.type).map((t) => types[t as number] as string);
    }

    if (skips.indexOf(autoDetectValue) === -1) {
        skips.push(autoDetectValue);
    }

    if (port.excludedConnectionPointTypes.length !== 0) {
        let bitmask = 0;
        let val = 2 ** bitmask;
        const candidates: number[] = [];
        while (val < allValue) {
            if (port.excludedConnectionPointTypes.indexOf(val) === -1 && skips.indexOf(val) === -1) {
                if (candidates.indexOf(val) === -1) {
                    candidates.push(val);
                }
            }
            bitmask++;
            val = 2 ** bitmask;
        }
        acceptedTypes = (Object.values(types) as T[keyof T][])
            .filter((t) => candidates.indexOf(t as number) !== -1 && t !== port.type)
            .map((t) => types[t as number] as string)
            .filter((t) => t);
    }
    return acceptedTypes;
}

export function GetConnectionErrorMessage<T extends Record<string, string | number>>(
    sourceType: number,
    types: T,
    allValue: number,
    autoDetectValue: number,
    port: { acceptedConnectionPointTypes: number[]; excludedConnectionPointTypes: number[]; type: number },
    skips: number[] = []
) {
    const list = GetListOfAcceptedTypes(types, allValue, autoDetectValue, port, skips).join(", ");

    return `Cannot connect two different connection types:\nSource is ${types[sourceType]} but destination only accepts ${list}`;
}
