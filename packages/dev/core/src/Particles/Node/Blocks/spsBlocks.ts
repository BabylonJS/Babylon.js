import { RegisterClass } from "../../../Misc/typeStore";
import { NodeParticleBlockConnectionPointTypes } from "../Enums/nodeParticleBlockConnectionPointTypes";
import { NodeParticleBlock } from "../nodeParticleBlock";
import type { NodeParticleConnectionPoint } from "../nodeParticleBlockConnectionPoint";
import type { NodeParticleBuildState } from "../nodeParticleBuildState";
import { editableInPropertyPage, PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { SolidParticleSystem } from "core/Particles/solidParticleSystem";
import type { SolidParticle } from "core/Particles/solidParticle";
import { Vector3 } from "core/Maths/math.vector";
import { Color4 } from "core/Maths/math.color";
import type { Mesh } from "core/Meshes/mesh";
import type { Material } from "core/Materials/material";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { CreateSphere } from "core/Meshes/Builders/sphereBuilder";
import { CreateCylinder } from "core/Meshes/Builders/cylinderBuilder";
import { CreatePlane } from "core/Meshes/Builders/planeBuilder";

// ============================================================================
// SPSMeshSourceBlock - Источник меша для SPS
// ============================================================================

/**
 * Mesh shape types for SPS
 */
export enum SPSMeshShapeType {
    Box = 0,
    Sphere = 1,
    Cylinder = 2,
    Plane = 3,
    Custom = 4,
}

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

    /**
     * Create a new SPSMeshSourceBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("customMesh", NodeParticleBlockConnectionPointTypes.Mesh, true);
        this.registerOutput("mesh", NodeParticleBlockConnectionPointTypes.Mesh);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SPSMeshSourceBlock";
    }

    /**
     * Gets the customMesh input component
     */
    public get customMesh(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the mesh output component
     */
    public get mesh(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * @internal
     */
    public override _build(state: NodeParticleBuildState) {
        let mesh: Mesh;

        if (this.shapeType === SPSMeshShapeType.Custom) {
            // Use custom mesh from input
            const customMesh = this.customMesh.getConnectedValue(state) as Mesh;
            if (customMesh) {
                mesh = customMesh;
            } else {
                // Fallback to box if custom mesh not provided
                mesh = CreateBox("sps_mesh_source", { size: this.size }, state.scene);
            }
        } else {
            // Create built-in shape
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

// ============================================================================
// SPSCreateBlock - Создание SPS (аналог CreateParticleBlock)
// ============================================================================

/**
 * Block used to create SPS with base mesh
 */
export class SPSCreateBlock extends NodeParticleBlock {
    /**
     * Create a new SPSCreateBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("baseMesh", NodeParticleBlockConnectionPointTypes.Mesh);
        this.registerInput("particleCount", NodeParticleBlockConnectionPointTypes.Int, true, 100);

        this.registerOutput("solidParticle", NodeParticleBlockConnectionPointTypes.SolidParticle);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SPSCreateBlock";
    }

    /**
     * Gets the baseMesh input component
     */
    public get baseMesh(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the particleCount input component
     */
    public get particleCount(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the solidParticle output component
     */
    public get solidParticle(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * @internal
     */
    public override _build(state: NodeParticleBuildState) {
        const sps = new SolidParticleSystem(this.name, state.scene);

        const baseMesh = this.baseMesh.getConnectedValue(state) as Mesh;
        if (baseMesh) {
            const count = this.particleCount.getConnectedValue(state) as number;
            sps.addShape(baseMesh, count);
        }

        this.solidParticle._storedValue = sps;
    }
}

// ============================================================================
// SPSSystemBlock - Настройка SPS (аналог SystemBlock)
// ============================================================================

/**
 * Block used to configure Solid Particle System
 */
export class SPSSystemBlock extends NodeParticleBlock {
    private static _IdCounter = 0;

    @editableInPropertyPage("Capacity", PropertyTypeForEdition.Int, "ADVANCED", {
        embedded: true,
        notifiers: { rebuild: true },
        min: 0,
        max: 100000,
    })
    public capacity = 1000;

    @editableInPropertyPage("Billboard", PropertyTypeForEdition.Boolean, "ADVANCED", {
        embedded: true,
        notifiers: { rebuild: true },
    })
    public billboard = false;

    /** @internal */
    public _internalId = SPSSystemBlock._IdCounter++;

    /**
     * Create a new SPSSystemBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this._isSystem = true;

        this.registerInput("solidParticle", NodeParticleBlockConnectionPointTypes.SolidParticle);
        this.registerInput("material", NodeParticleBlockConnectionPointTypes.Material, true);
        this.registerInput("onStart", NodeParticleBlockConnectionPointTypes.System, true);
        this.registerInput("onEnd", NodeParticleBlockConnectionPointTypes.System, true);
        this.registerOutput("system", NodeParticleBlockConnectionPointTypes.System);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SPSSystemBlock";
    }

    /**
     * Gets the solidParticle input component
     */
    public get solidParticle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the material input component
     */
    public get material(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the onStart input component
     */
    public get onStart(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the onEnd input component
     */
    public get onEnd(): NodeParticleConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the system output component
     */
    public get system(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * Builds the block and return a functional SPS
     * @param state defines the building state
     * @returns the built SPS
     */
    public createSystem(state: NodeParticleBuildState): SolidParticleSystem {
        state.capacity = this.capacity;
        state.buildId = this._buildId++;

        this.build(state);

        const sps = this.solidParticle.getConnectedValue(state) as SolidParticleSystem;

        if (!sps) {
            throw new Error("SPSSystemBlock: solidParticle input must be connected to SPSCreateBlock");
        }

        sps.billboard = this.billboard;
        sps.name = this.name;

        const material = this.material.getConnectedValue(state) as Material;
        if (material) {
            sps.mesh.material = material;
        }

        sps.buildMesh();

        // Initialize particles with default positions
        sps.initParticles();

        // Start automatic updates
        sps.start();

        this.system._storedValue = this;

        this.onDisposeObservable.addOnce(() => {
            sps.dispose();
        });

        return sps;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.capacity = this.capacity;
        serializationObject.billboard = this.billboard;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.capacity = serializationObject.capacity;
        this.billboard = !!serializationObject.billboard;
    }
}

// ============================================================================
// SPSInitParticleBlock - Инициализация updateParticle функции
// ============================================================================

/**
 * Block used to initialize updateParticle function for specific particle range
 */
export class SPSInitParticleBlock extends NodeParticleBlock {
    @editableInPropertyPage("Start Index", PropertyTypeForEdition.Int, "ADVANCED", {
        embedded: true,
        min: 0,
    })
    public startIndex = 0;

    @editableInPropertyPage("End Index", PropertyTypeForEdition.Int, "ADVANCED", {
        embedded: true,
        min: -1,
    })
    public endIndex = -1; // -1 means all particles

    /**
     * Create a new SPSInitParticleBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("system", NodeParticleBlockConnectionPointTypes.System);
        this.registerInput("updateFunction", NodeParticleBlockConnectionPointTypes.SolidParticle, true);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.System);
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "SPSInitParticleBlock";
    }

    /**
     * Gets the system input component
     */
    public get system(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the updateFunction input component
     */
    public get updateFunction(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    /**
     * @internal
     */
    public override _build(state: NodeParticleBuildState) {
        const systemBlock = this.system.getConnectedValue(state) as SPSSystemBlock;

        if (!systemBlock) {
            return;
        }

        const sps = systemBlock.solidParticle.getConnectedValue(state) as SolidParticleSystem;

        if (!sps) {
            return;
        }

        // Store the old updateParticle function
        const oldUpdateParticle = sps.updateParticle.bind(sps);

        // Create new updateParticle that includes this range
        sps.updateParticle = (particle: SolidParticle): SolidParticle => {
            // Call previous updateParticle functions
            oldUpdateParticle(particle);

            const start = this.startIndex;
            const end = this.endIndex === -1 ? sps.nbParticles - 1 : this.endIndex;

            // Only update particles in this range
            if (particle.idx >= start && particle.idx <= end) {
                state.particleContext = particle as any;
                state.spsContext = sps;

                if (this.updateFunction.isConnected) {
                    this.updateFunction.getConnectedValue(state);
                }
            }

            return particle;
        };

        this.output._storedValue = systemBlock;
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.startIndex = this.startIndex;
        serializationObject.endIndex = this.endIndex;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.startIndex = serializationObject.startIndex || 0;
        this.endIndex = serializationObject.endIndex || -1;
    }
}

// ============================================================================
// SPSUpdatePositionBlock - Обновление позиции частицы
// ============================================================================

/**
 * Block used to update particle position
 */
export class SPSUpdatePositionBlock extends NodeParticleBlock {
    /**
     * Create a new SPSUpdatePositionBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.SolidParticle);
        this.registerInput("position", NodeParticleBlockConnectionPointTypes.Vector3);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.SolidParticle);
    }

    public override getClassName() {
        return "SPSUpdatePositionBlock";
    }

    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get position(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const particle = state.particleContext as any as SolidParticle;

        if (!particle) {
            return;
        }

        const newPosition = this.position.getConnectedValue(state) as Vector3;
        if (newPosition) {
            particle.position.copyFrom(newPosition);
        }

        this.output._storedValue = particle;
    }
}

// ============================================================================
// SPSUpdateRotationBlock - Обновление вращения частицы
// ============================================================================

/**
 * Block used to update particle rotation
 */
export class SPSUpdateRotationBlock extends NodeParticleBlock {
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.SolidParticle);
        this.registerInput("rotation", NodeParticleBlockConnectionPointTypes.Vector3);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.SolidParticle);
    }

    public override getClassName() {
        return "SPSUpdateRotationBlock";
    }

    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get rotation(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const particle = state.particleContext as any as SolidParticle;

        if (!particle) {
            return;
        }

        const newRotation = this.rotation.getConnectedValue(state) as Vector3;
        if (newRotation) {
            particle.rotation.copyFrom(newRotation);
        }

        this.output._storedValue = particle;
    }
}

// ============================================================================
// SPSUpdateScalingBlock - Обновление масштаба частицы
// ============================================================================

/**
 * Block used to update particle scaling
 */
export class SPSUpdateScalingBlock extends NodeParticleBlock {
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.SolidParticle);
        this.registerInput("scaling", NodeParticleBlockConnectionPointTypes.Vector3);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.SolidParticle);
    }

    public override getClassName() {
        return "SPSUpdateScalingBlock";
    }

    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get scaling(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const particle = state.particleContext as any as SolidParticle;

        if (!particle) {
            return;
        }

        const newScaling = this.scaling.getConnectedValue(state) as Vector3;
        if (newScaling) {
            particle.scaling.copyFrom(newScaling);
        }

        this.output._storedValue = particle;
    }
}

// ============================================================================
// SPSUpdateColorBlock - Обновление цвета частицы
// ============================================================================

/**
 * Block used to update particle color
 */
export class SPSUpdateColorBlock extends NodeParticleBlock {
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.SolidParticle);
        this.registerInput("color", NodeParticleBlockConnectionPointTypes.Color4);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.SolidParticle);
    }

    public override getClassName() {
        return "SPSUpdateColorBlock";
    }

    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get color(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const particle = state.particleContext as any as SolidParticle;

        if (!particle) {
            return;
        }

        const newColor = this.color.getConnectedValue(state) as Color4;
        if (newColor) {
            if (!particle.color) {
                particle.color = new Color4(1, 1, 1, 1);
            }
            particle.color.copyFrom(newColor);
        }

        this.output._storedValue = particle;
    }
}

// ============================================================================
// SPSUpdateVelocityBlock - Обновление скорости частицы
// ============================================================================

/**
 * Block used to update particle velocity
 */
export class SPSUpdateVelocityBlock extends NodeParticleBlock {
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.SolidParticle);
        this.registerInput("velocity", NodeParticleBlockConnectionPointTypes.Vector3);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.SolidParticle);
    }

    public override getClassName() {
        return "SPSUpdateVelocityBlock";
    }

    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get velocity(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const particle = state.particleContext as any as SolidParticle;

        if (!particle) {
            return;
        }

        const newVelocity = this.velocity.getConnectedValue(state) as Vector3;
        if (newVelocity) {
            particle.velocity.copyFrom(newVelocity);
        }

        this.output._storedValue = particle;
    }
}

// ============================================================================
// SPSPhysicsBlock - Физика для частицы
// ============================================================================

/**
 * Block used to apply physics to SPS particle
 */
export class SPSPhysicsBlock extends NodeParticleBlock {
    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.SolidParticle);
        this.registerInput("gravity", NodeParticleBlockConnectionPointTypes.Vector3, true, new Vector3(0, -9.81, 0));
        this.registerInput("damping", NodeParticleBlockConnectionPointTypes.Float, true, 0.99);
        this.registerInput("forces", NodeParticleBlockConnectionPointTypes.Vector3, true);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.SolidParticle);
    }

    public override getClassName() {
        return "SPSPhysicsBlock";
    }

    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get gravity(): NodeParticleConnectionPoint {
        return this._inputs[1];
    }

    public get damping(): NodeParticleConnectionPoint {
        return this._inputs[2];
    }

    public get forces(): NodeParticleConnectionPoint {
        return this._inputs[3];
    }

    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const particle = state.particleContext as any as SolidParticle;

        if (!particle) {
            return;
        }

        const deltaTime = (state as any).deltaTime || 0.016;

        const gravity = this.gravity.getConnectedValue(state) as Vector3;
        if (gravity) {
            particle.velocity.addInPlace(gravity.scale(deltaTime));
        }

        const forces = this.forces.getConnectedValue(state) as Vector3;
        if (forces) {
            particle.velocity.addInPlace(forces.scale(deltaTime));
        }

        const damping = this.damping.getConnectedValue(state) as number;
        if (damping !== undefined && damping !== null) {
            particle.velocity.scaleInPlace(damping);
        }

        particle.position.addInPlace(particle.velocity.scale(deltaTime));

        this.output._storedValue = particle;
    }
}

// ============================================================================
// SPSGetParticlePropertyBlock - Получение свойств частицы
// ============================================================================

/**
 * Block used to get particle properties (position, rotation, etc)
 */
export class SPSGetParticlePropertyBlock extends NodeParticleBlock {
    @editableInPropertyPage("Property", PropertyTypeForEdition.List, "ADVANCED", {
        notifiers: { rebuild: true },
        embedded: true,
        options: [
            { label: "Position", value: 0 },
            { label: "Rotation", value: 1 },
            { label: "Scaling", value: 2 },
            { label: "Velocity", value: 3 },
            { label: "Index", value: 4 },
            { label: "Alive", value: 5 },
            { label: "Visible", value: 6 },
        ],
    })
    public property = 0;

    public constructor(name: string) {
        super(name);

        this.registerInput("particle", NodeParticleBlockConnectionPointTypes.SolidParticle);
        this.registerOutput("output", NodeParticleBlockConnectionPointTypes.AutoDetect);
    }

    public override getClassName() {
        return "SPSGetParticlePropertyBlock";
    }

    public get particle(): NodeParticleConnectionPoint {
        return this._inputs[0];
    }

    public get output(): NodeParticleConnectionPoint {
        return this._outputs[0];
    }

    public override _build(state: NodeParticleBuildState) {
        const particle = state.particleContext as any as SolidParticle;

        if (!particle) {
            return;
        }

        switch (this.property) {
            case 0: // Position
                this.output._storedValue = particle.position;
                break;
            case 1: // Rotation
                this.output._storedValue = particle.rotation;
                break;
            case 2: // Scaling
                this.output._storedValue = particle.scaling;
                break;
            case 3: // Velocity
                this.output._storedValue = particle.velocity;
                break;
            case 4: // Index
                this.output._storedValue = particle.idx;
                break;
            case 5: // Alive
                this.output._storedValue = particle.alive;
                break;
            case 6: // Visible
                this.output._storedValue = particle.isVisible;
                break;
        }
    }

    public override serialize(): any {
        const serializationObject = super.serialize();
        serializationObject.property = this.property;
        return serializationObject;
    }

    public override _deserialize(serializationObject: any) {
        super._deserialize(serializationObject);
        this.property = serializationObject.property || 0;
    }
}

// ============================================================================
// REGISTRATION
// ============================================================================

RegisterClass("BABYLON.SPSMeshSourceBlock", SPSMeshSourceBlock);
RegisterClass("BABYLON.SPSCreateBlock", SPSCreateBlock);
RegisterClass("BABYLON.SPSSystemBlock", SPSSystemBlock);
RegisterClass("BABYLON.SPSInitParticleBlock", SPSInitParticleBlock);
RegisterClass("BABYLON.SPSUpdatePositionBlock", SPSUpdatePositionBlock);
RegisterClass("BABYLON.SPSUpdateRotationBlock", SPSUpdateRotationBlock);
RegisterClass("BABYLON.SPSUpdateScalingBlock", SPSUpdateScalingBlock);
RegisterClass("BABYLON.SPSUpdateColorBlock", SPSUpdateColorBlock);
RegisterClass("BABYLON.SPSUpdateVelocityBlock", SPSUpdateVelocityBlock);
RegisterClass("BABYLON.SPSPhysicsBlock", SPSPhysicsBlock);
RegisterClass("BABYLON.SPSGetParticlePropertyBlock", SPSGetParticlePropertyBlock);
