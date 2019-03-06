import { NodeMaterialConnectionPoint } from './nodeMaterialBlockConnectionPoint';
import { NodeMaterialBlockConnectionPointTypes } from './nodeMaterialBlockConnectionPointTypes';
import { NodeMaterialCompilationState } from './nodeMaterialCompilationState';

export class NodeMaterialBlock {
    public _entryPoints = new Array<NodeMaterialConnectionPoint>();
    public _exitPoints = new Array<NodeMaterialConnectionPoint>();

    /**
     * Gets or sets the name of the block
     */
    public name: string;

    /**
     * Gets the list of entry points
     */
    public get entryPoints(): NodeMaterialConnectionPoint[] {
        return this._entryPoints;
    }

    /** Gets the list of exit points */
    public get exitPoints(): NodeMaterialConnectionPoint[] {
        return this._exitPoints;
    }

    /**
     * Find an entry point by its name
     * @param name defines the name of the entry point to look for
     * @returns the entry point or null if not found
     */
    public getEntryPointByName(name: string) {
        let filter = this._entryPoints.filter(e => e.name === name);

        if (filter.length) {
            return filter[0];
        }

        return null;
    }

    /**
     * Find an exit point by its name
     * @param name defines the name of the exit point to look for
     * @returns the exit point or null if not found
     */
    public getExitPointByName(name: string) {
        let filter = this._exitPoints.filter(e => e.name === name);

        if (filter.length) {
            return filter[0];
        }

        return null;
    }

    public constructor(name: string) {
        this.name = name;
    }

    public getClassName() {
        return "NodeMaterialBlock";
    }

    public registerEntryPoint(name: string, type: NodeMaterialBlockConnectionPointTypes) {
        let point = new NodeMaterialConnectionPoint(name, this);
        point.type = type;

        this._entryPoints.push(point);
    }

    public registerExitPoint(name: string, type: NodeMaterialBlockConnectionPointTypes) {
        let point = new NodeMaterialConnectionPoint(name, this);
        point.type = type;

        this._exitPoints.push(point);
    }

    /**
     * Will return the first available entry point e.g. the first one which is not an uniform or an attribute
     */
    public getFirstAvailableEntryPoint() {
        for (var entryPoint of this._entryPoints) {
            if (!entryPoint.isUniform && !entryPoint.isAttribute) {
                return entryPoint;
            }
        }

        return null;
    }

    /**
     * Connect current block with another block
     * @param other defines the block to connect with
     * @param entryPointName define the name of the other block entry point (will take the first available one if not defined)
     * @param exitPointName define the name of current block exit point (will take the first one if not defined)
     */
    public connectTo(other: NodeMaterialBlock, entryPointName?: string, exitPointName?: string) {
        if (this._exitPoints.length === 0) {
            return;
        }

        let output = exitPointName ? this.getExitPointByName(exitPointName) : this._exitPoints[0];
        let input = entryPointName ? other.getEntryPointByName(entryPointName) : other.getFirstAvailableEntryPoint();

        if (output && input) {
            output.connectTo(input);
        }
    }

    /**
     * Compile the current node and generate the shader code
     * @param state defines the current compilation state (uniforms, samplers, current string)
     */
    public compile(state: NodeMaterialCompilationState) {
        for (var entryPoint of this._entryPoints) {
            state.emitUniformOrAttributes(entryPoint);
        }

        for (var exitPoint of this._exitPoints) {
            exitPoint.associatedVariableName = state.getFreeVariableName(exitPoint.name);
            state.emitVaryings(exitPoint);
        }
    }

    public compileChildren(state: NodeMaterialCompilationState) {
        // Compile blocks
        for (var exitPoint of this._exitPoints) {
            let block = exitPoint.connectedBlock;

            if (block) {
                block.compile(state);
            }
        }

        // Compile children
        for (var exitPoint of this._exitPoints) {
            let block = exitPoint.connectedBlock;

            if (block) {
                block.compileChildren(state);
            }
        }
    }
}