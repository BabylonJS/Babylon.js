import { GraphCanvasComponent } from './graphCanvas';
import { GraphNode } from './graphNode';

export class NodeLink {   
    private _graphCanvas: GraphCanvasComponent;
    private _portA: HTMLDivElement;
    private _portB?: HTMLDivElement;
    private _nodeA: GraphNode;
    private _nodeB?: GraphNode;
    private _path: SVGPathElement;

    public get portA() {
        return this._portA;
    }

    public get portB() {
        return this._portB;
    }

    public update(endX = 0, endY = 0, straight = false) {   
        const rectA = this._portA.getBoundingClientRect();
        const rootRect = this._graphCanvas.canvasContainer.getBoundingClientRect();
        const zoom = this._graphCanvas.zoom;
        const xOffset = rootRect.left;
        const yOffset = rootRect.top;
       
        var startX = (rectA.left - xOffset + 0.5 * rectA.width) / zoom;
        var startY = (rectA.top - yOffset + 0.5 * rectA.height) / zoom;  

        if (this._portB) {
            const rectB = this._portB.getBoundingClientRect();
            endX = (rectB.left - xOffset + 0.5 * rectB.width) / zoom;
            endY = (rectB.top - yOffset + 0.5 * rectB.height) / zoom;  
        } else {

        }
    
        if (straight) {
            this._path.setAttribute("d",  `M${startX},${startY} L${endX},${endY}`);      
            this._path.setAttribute("stroke-dasharray", "10, 10");
            this._path.setAttribute("stroke-linecap", "round");
        } else {
            this._path.setAttribute("d",  `M${startX},${startY} C${startX + 80},${startY} ${endX - 80},${endY} ${endX},${endY}`);        
        }
        this._path.setAttribute("stroke", this._portA.style.backgroundColor!);
    }

    public constructor(graphCanvas: GraphCanvasComponent, portA: HTMLDivElement, nodeA: GraphNode, portB?: HTMLDivElement, nodeB?: GraphNode) {
        this._portA = portA;
        this._portB = portB;
        this._nodeA = nodeA;
        this._nodeB = nodeB;
        this._graphCanvas = graphCanvas;

        var document = portA.ownerDocument!;
        var svg = document.getElementById("graph-svg-container")!;

        // Create path
        this._path = document.createElementNS('http://www.w3.org/2000/svg',"path"); 
        this._path.setAttribute("fill", "none");
        this._path.setAttribute("stroke-width", "4px");

        svg.appendChild(this._path);

        // Update
        this.update();
    }

    public dispose() {
        if (this._path.parentElement) {
            this._path.parentElement.removeChild(this._path);
        }

        if (this._nodeB) {
            this._nodeA.links.splice(this._nodeA.links.indexOf(this), 1);
            this._nodeB.links.splice(this._nodeB.links.indexOf(this), 1);
            this._graphCanvas.links.splice(this._graphCanvas.links.indexOf(this), 1);
        }
    }   
}