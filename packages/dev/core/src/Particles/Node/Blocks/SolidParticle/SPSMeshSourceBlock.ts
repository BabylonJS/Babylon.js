import { RegisterClass } from "../../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../../nodeParticleBuildState";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { CreateSphere } from "core/Meshes/Builders/sphereBuilder";
import { CreateCylinder } from "core/Meshes/Builders/cylinderBuilder";
import { CreatePlane } from "core/Meshes/Builders/planeBuilder";
import { SPSMeshShapeType } from "./SPSMeshShapeType";

/**
 * Block used to provide mesh source for SPS
 */
export class SPSMeshSourceBlock extends NodeParticleBlock {
    @editableInPropertyPage("Shape Type", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Box", value: SPSMeshShapeType.Box },
            { label: "Sphere", value: SPSMeshShapeType.Sphere },
            { label: "Cylinder", value: SPSMeshShapeType.Cylinder },
            { label: "Plane", value: SPSMeshShapeType.Plane },
            { label: "Custom", value: SPSMeshShapeType.Custom },
        ],
    })
    public shapeType = SPSMeshShapeType.Box;

    @editableInPropertyPage("Size", PropertyTypeForEdition.Float, "ADVANCED", {
        embedded: true,
        min: 0.01,
    })
    public size = 1;

    @editableInPropertyPage("Segments", PropertyTypeForEdition.Int, "ADVANCED", {
        embedded: true,
        min: 1,
    })
    public segments = 16;

    public constructor(name: string) {
        super(name);

        this.registerInput("customMesh", NodeParticleBlockConnectionPointTypes.Mesh, true);
        this.registerOutput("mesh", NodeParticleBlockConnectionPointTypes.Mesh);
    }

    public override getClassName() {
        return "SPSMeshSourceBlock";
    }

    public get customMesh(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get mesh(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        let mesh;

        if (this.shapeType === SPSMeshShapeType.Custom) {
            if (this.customMesh.isConnected) {
                const customMesh = this.customMesh.getConnectedValue(state);
                if (customMesh) {
                    mesh = customMesh;
                } else {
                    mesh = CreateBox("sps_mesh_source", { size: this.size }, state.scene);
                }
            } else {
                mesh = CreateBox("sps_mesh_source", { size: this.size }, state.scene);
            }
        } else {
            switch (this.shapeType) {
                case SPSMeshShapeType.Box:
                    mesh = CreateBox("sps_mesh_source", { size: this.size }, state.scene);
                    break;
                case SPSMeshShapeType.Sphere:
                    mesh = CreateSphere("sps_mesh_source", { diameter: this.size, segments: this.segments }, state.scene);
                    break;
                case SPSMeshShapeType.Cylinder:
                    mesh = CreateCylinder("sps_mesh_source", { height: this.size, diameter: this.size, tessellation: this.segments }, state.scene);
                    break;
                case SPSMeshShapeType.Plane:
                    mesh = CreatePlane("sps_mesh_source", { size: this.size }, state.scene);
                    break;
                default:
                    mesh = CreateBox("sps_mesh_source", { size: this.size }, state.scene);
                    break;
            }
        }

        this.mesh._storedValue = mesh;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.shapeType = this.shapeType;
        serializationObject.size = this.size;
        serializationObject.segments = this.segments;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.shapeType = serializationObject.shapeType || SPSMeshShapeType.Box;
        this.size = serializationObject.size || 1;
        this.segments = serializationObject.segments || 16;
    }
}

RegisterClass("BABYLON.SPSMeshSourceBlock", SPSMeshSourceBlock);
