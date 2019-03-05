import { NodeMaterialBlock } from './nodeMaterialBlock';
import { Material } from '../material';
import { Scene } from '../../scene';
import { AbstractMesh } from '../../Meshes/abstractMesh';
import { Matrix } from '../../Maths/math';
import { Mesh } from '../../Meshes/mesh';

export interface INodeMaterialOptions {
    needAlphaBlending: boolean,
    needAlphaTesting: boolean
}

export class NodeMaterial extends Material {
    private _options: INodeMaterialOptions;
    private _renderId: number;

    /**
     * Gets or sets the root node of the material
     */
    public rootNode: NodeMaterialBlock;

    /** Gets or sets options to control the node material overall behavior */
    public get options() {
        return this._options;
    }

    public set options(options: INodeMaterialOptions) {
        this._options = options;
    }

    constructor(name: string, scene: Scene, options: Partial<INodeMaterialOptions> = {}) {
        super(name, scene);

        this._options = {
            needAlphaBlending: false,
            needAlphaTesting: false,
            ...options
        };
    }


    /**
     * Gets the current class name of the material e.g. "NodeMaterial"
     * @returns the class name
     */
    public getClassName(): string {
        return "NodeMaterial";
    }

    /**
     * Compile the material and generates the inner effect
     */
    public compile() {

    }

    /**
     * Checks if the material is ready to render the requested mesh
     * @param mesh Define the mesh to render
     * @param useInstances Define whether or not the material is used with instances
     * @returns true if ready, otherwise false
     */
    public isReady(mesh?: AbstractMesh, useInstances?: boolean): boolean {
        var scene = this.getScene();
        //var engine = scene.getEngine();

        if (!this.checkReadyOnEveryCall) {
            if (this._renderId === scene.getRenderId()) {
                // if (this._checkCache(mesh, useInstances)) {
                return true;
                // }
            }
        }

        return true;
    }

    /**
     * Binds the world matrix to the material
     * @param world defines the world transformation matrix
     */
    public bindOnlyWorldMatrix(world: Matrix): void {
        //  var scene = this.getScene();

        if (!this._effect) {
            return;
        }

        // if (this._options.uniforms.indexOf("world") !== -1) {
        //     this._effect.setMatrix("world", world);
        // }

        // if (this._options.uniforms.indexOf("worldView") !== -1) {
        //     world.multiplyToRef(scene.getViewMatrix(), this._cachedWorldViewMatrix);
        //     this._effect.setMatrix("worldView", this._cachedWorldViewMatrix);
        // }

        // if (this._options.uniforms.indexOf("worldViewProjection") !== -1) {
        //     this._effect.setMatrix("worldViewProjection", world.multiply(scene.getTransformMatrix()));
        // }
    }

    /**
     * Binds the material to the mesh
     * @param world defines the world transformation matrix
     * @param mesh defines the mesh to bind the material to
     */
    public bind(world: Matrix, mesh?: Mesh): void {
        // Std values
        this.bindOnlyWorldMatrix(world);
    }

}