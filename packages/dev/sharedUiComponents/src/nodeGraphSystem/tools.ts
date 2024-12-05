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
        links.forEach((link) => {
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
        });
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
    links.forEach((link) => {
        if (!visitedLinks.has(link)) {
            visitedLinks.add(link);
            link.update();
        }
    });
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
    visualPropertiesRefresh?: Array<() => void>
) => {
    const cantDisplaySlider = min === undefined || max === undefined || isNaN(min) || isNaN(max) || min === max;
    if (cantDisplaySlider) {
        container.classList.add(localStyles.floatContainer);
        const numberInput = document.createElement("input");
        numberInput.type = "number";
        numberInput.id = `number-${idGenerator++}`;

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
