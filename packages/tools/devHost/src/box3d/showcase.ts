// Larger Box3D showcase scenes, ported from Erin Catto's box3d samples.

import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Mesh } from "core/Meshes/mesh";
import { TransformNode } from "core/Meshes/transformNode";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector";
import { Color3 } from "core/Maths/math.color";
import { PhysicsBody } from "core/Physics/v2/physicsBody";
import { PhysicsAggregate } from "core/Physics/v2/physicsAggregate";
import { PhysicsShapeBox, PhysicsShapeCapsule, PhysicsShapeSphere, PhysicsShape } from "core/Physics/v2/physicsShape";
import { BallAndSocketConstraint, DistanceConstraint, HingeConstraint, type PhysicsConstraint } from "core/Physics/v2/physicsConstraint";
import { PhysicsShapeType, PhysicsMotionType, PhysicsConstraintAxis, PhysicsConstraintAxisLimitMode, PhysicsConstraintMotorType } from "core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsRaycastResult } from "core/Physics/physicsRaycastResult";
import { type Box3DWheelJoint } from "core/Physics/v2/Plugins/box3dPlugin";
import { Ground, Palette, Param, type IDemoContext } from "./common";
import { HumanBones } from "./human";
import "core/Meshes/thinInstanceMesh";

const DegToRad = Math.PI / 180;

// ------------------------------------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------------------------------------

// A dynamic body made of thin instances of one box mesh.
function InstancedBoxes(ctx: IDemoContext, name: string, size: Vector3, matrices: Float32Array, colors: Float32Array, density: number, friction = 0.6): PhysicsBody {
    const mesh = MeshBuilder.CreateBox(name, { width: size.x, height: size.y, depth: size.z }, ctx.scene);
    // dynamic buffer (staticBuffer = false) so physics updates reach the GPU
    mesh.thinInstanceSetBuffer("matrix", matrices, 16, false);
    mesh.thinInstanceSetBuffer("color", colors, 4);
    const mat = new StandardMaterial(name + "Mat", ctx.scene);
    mat.specularColor = new Color3(0.1, 0.1, 0.1);
    mesh.material = mat;
    ctx.watch(mesh);
    const body = new PhysicsBody(mesh, PhysicsMotionType.DYNAMIC, false, ctx.scene);
    const shape = new PhysicsShapeBox(Vector3.Zero(), Quaternion.Identity(), size, ctx.scene);
    shape.density = density;
    shape.material = { friction, restitution: 0 };
    body.shape = shape;
    return body;
}

function ColorAt(colors: Float32Array, index: number, hex: string, shade = 1): void {
    const c = Color3.FromHexString(hex);
    colors[index * 4] = c.r * shade;
    colors[index * 4 + 1] = c.g * shade;
    colors[index * 4 + 2] = c.b * shade;
    colors[index * 4 + 3] = 1;
}

// Pick the physics point under the pointer.
function PickPhysics(ctx: IDemoContext): Vector3 | null {
    const ray = ctx.scene.createPickingRay(ctx.scene.pointerX, ctx.scene.pointerY, null, ctx.camera);
    const result = new PhysicsRaycastResult();
    ctx.plugin.raycast(ray.origin, ray.origin.add(ray.direction.scale(500)), result);
    return result.hasHit ? result.hitPointWorld.clone() : null;
}

function ExplosionFlash(ctx: IDemoContext, position: Vector3, radius: number): void {
    const flash = MeshBuilder.CreateSphere("flash", { diameter: 1, segments: 12 }, ctx.scene);
    flash.position.copyFrom(position);
    const mat = new StandardMaterial("flashMat", ctx.scene);
    mat.emissiveColor = new Color3(1, 0.7, 0.3);
    mat.disableLighting = true;
    mat.alpha = 0.8;
    flash.material = mat;
    let t = 0;
    const obs = ctx.scene.onBeforeRenderObservable.add(() => {
        t += ctx.scene.getEngine().getDeltaTime() / 1000;
        const s = Math.min(1, t / 0.35);
        flash.scaling.setAll(0.2 + radius * 2 * s);
        mat.alpha = 0.8 * (1 - s);
        if (s >= 1) {
            ctx.scene.onBeforeRenderObservable.remove(obs);
            flash.dispose();
            mat.dispose();
        }
    });
}

// Left tap explodes at the picked point (or shoots a ball when nothing is hit).
export function ExplodeOnTap(ctx: IDemoContext, radius: number, impulsePerArea: number, shoot: () => void): void {
    ctx.scene.onPointerObservable.add((info) => {
        if (info.type !== 32 /* POINTERTAP */ || info.event.button !== 0) {
            return;
        }
        const hit = PickPhysics(ctx);
        if (!hit) {
            shoot();
            return;
        }
        ctx.plugin.explode(hit, radius, impulsePerArea, radius * 0.5);
        ExplosionFlash(ctx, hit, radius);
    });
}

export function ShootBall(ctx: IDemoContext, mass: number, speed: number, diameter = 1): PhysicsAggregate {
    const ray = ctx.scene.createPickingRay(ctx.scene.pointerX, ctx.scene.pointerY, null, ctx.camera);
    const ball = MeshBuilder.CreateSphere("shot", { diameter }, ctx.scene);
    ball.position.copyFrom(ray.origin).addInPlace(ray.direction.scale(2));
    ball.material = ctx.material(0);
    ctx.watch(ball);
    const agg = new PhysicsAggregate(ball, PhysicsShapeType.SPHERE, { mass, restitution: 0.2, friction: 0.5 }, ctx.scene);
    agg.body.setLinearVelocity(ray.direction.scale(speed));
    return agg;
}

// ------------------------------------------------------------------------------------------------
// pyramid: Box3D "Large Pyramid" benchmark with thin instances
// ------------------------------------------------------------------------------------------------
export function BuildPyramid(ctx: IDemoContext): void {
    const rows = Math.max(2, Math.min(150, Math.round(Param(ctx, "rows", 50))));
    const count = (rows * (rows + 1)) / 2;
    ctx.help = `${count} boxes in a ${rows} row pyramid (add &rows=100 for 5050) · click: explode · space: cannonball`;
    Ground(ctx, Math.max(80, rows * 2 + 40), 0.6);

    const matrices = new Float32Array(count * 16);
    const colors = new Float32Array(count * 4);
    let k = 0;
    const h = 0.5;
    for (let i = 0; i < rows; i++) {
        const y = (2 * i + 1) * h;
        for (let j = i; j < rows; j++) {
            const x = (i + 1) * h + 2 * (j - i) * h - h * rows;
            Matrix.TranslationToRef(x, y, 0, Matrix.IdentityReadOnly.clone()).copyToArray(matrices, k * 16);
            ColorAt(colors, k, Palette[i % Palette.length], 0.85 + 0.15 * Math.random());
            k++;
        }
    }
    InstancedBoxes(ctx, "pyramid", new Vector3(1, 1, 1), matrices, colors, 100);

    ctx.camera.setTarget(new Vector3(0, rows * 0.4, 0));
    ctx.camera.radius = rows * 1.6 + 10;
    ctx.camera.alpha = -Math.PI / 2 + 0.6;
    ctx.camera.beta = Math.PI / 2.6;

    ExplodeOnTap(ctx, 6, 2500, () => ShootBall(ctx, 3000, 40, 2));
    ctx.scene.onKeyboardObservable.add((info) => {
        if (info.type === 1 && info.event.key === " ") {
            ShootBall(ctx, 3000, 45, 2);
        }
    });
}

// ------------------------------------------------------------------------------------------------
// ragdolls: Box3D human ragdoll tumbling down a staircase
// ------------------------------------------------------------------------------------------------
interface IHuman {
    root: TransformNode;
    bodies: PhysicsBody[];
    nodes: TransformNode[];
}

const SkinColors = ["#ffdead", "#ffffe0", "#cd853f", "#d2b48c"];

export function CreateHuman(ctx: IDemoContext, position: Vector3, groupIndex: number, frictionTorque = 5, scale = 1): IHuman {
    const scene = ctx.scene;
    const plugin = ctx.plugin;
    const root = new TransformNode("human" + groupIndex, scene);
    const nodes: TransformNode[] = [];
    const bodies: PhysicsBody[] = [];
    const shirt = new StandardMaterial("shirt" + groupIndex, scene);
    shirt.diffuseColor = Color3.FromHexString(Palette[groupIndex % Palette.length]);
    const pants = new StandardMaterial("pants" + groupIndex, scene);
    pants.diffuseColor = Color3.FromHexString("#277da1").scale(0.8 + 0.4 * ((groupIndex % 3) / 3));
    const skin = new StandardMaterial("skin" + groupIndex, scene);
    skin.diffuseColor = Color3.FromHexString(SkinColors[groupIndex % 4]);
    const materials = { shirt, pant: pants, skin };

    for (const bone of HumanBones) {
        const node = new TransformNode(bone.name, scene);
        node.position.set(bone.frame[0] * scale, bone.frame[1] * scale, bone.frame[2] * scale).addInPlace(position);
        node.rotationQuaternion = new Quaternion(bone.frame[3], bone.frame[4], bone.frame[5], bone.frame[6]).normalize();

        const c1 = new Vector3(bone.capsule[0], bone.capsule[1], bone.capsule[2]).scaleInPlace(scale);
        const c2 = new Vector3(bone.capsule[3], bone.capsule[4], bone.capsule[5]).scaleInPlace(scale);
        const radius = bone.capsule[6] * scale;
        const axis = c2.subtract(c1);
        const length = axis.length();
        const mesh = MeshBuilder.CreateCapsule(bone.name + "Mesh", { radius, height: length + 2 * radius, tessellation: 12, subdivisions: 1, capSubdivisions: 4 }, scene);
        mesh.parent = node;
        mesh.position.copyFrom(c1).addInPlace(c2).scaleInPlace(0.5);
        mesh.rotationQuaternion = length > 1e-6 ? Quaternion.FromUnitVectorsToRef(Vector3.UpReadOnly, axis.scale(1 / length), new Quaternion()) : Quaternion.Identity();
        mesh.material = materials[bone.color];
        ctx.watch(mesh);

        const body = new PhysicsBody(node, PhysicsMotionType.DYNAMIC, false, scene);
        const shape = new PhysicsShapeCapsule(c1, c2, radius, scene);
        shape.material = { friction: 0.6, restitution: 0 };
        plugin.setShapeRollingResistance(shape, 0.2);
        if (bone.group) {
            plugin.setShapeFilterGroup(shape, -groupIndex);
        }
        body.shape = shape;
        body.setAngularDamping(0.1);
        nodes.push(node);
        bodies.push(body);
    }

    for (let i = 0; i < HumanBones.length; i++) {
        const bone = HumanBones[i];
        if (bone.parent < 0 || !bone.frameA || !bone.frameB) {
            continue;
        }
        const qA = new Quaternion(bone.frameA[3], bone.frameA[4], bone.frameA[5], bone.frameA[6]).normalize();
        const qB = new Quaternion(bone.frameB[3], bone.frameB[4], bone.frameB[5], bone.frameB[6]).normalize();
        const pivotA = new Vector3(bone.frameA[0], bone.frameA[1], bone.frameA[2]).scaleInPlace(scale);
        const pivotB = new Vector3(bone.frameB[0], bone.frameB[1], bone.frameB[2]).scaleInPlace(scale);
        // the plugin maps axis -> box3d frame z and perpAxis -> frame x
        const axisA = Vector3.Forward().applyRotationQuaternion(qA);
        const perpA = Vector3.Right().applyRotationQuaternion(qA);
        const axisB = Vector3.Forward().applyRotationQuaternion(qB);
        const perpB = Vector3.Right().applyRotationQuaternion(qB);
        let constraint: PhysicsConstraint;
        if (bone.joint === "spherical") {
            constraint = new BallAndSocketConstraint(pivotA, pivotB, axisA, axisB, scene);
        } else {
            constraint = new HingeConstraint(pivotA, pivotB, axisA, axisB, scene);
        }
        constraint.options.perpAxisA = perpA;
        constraint.options.perpAxisB = perpB;
        bodies[bone.parent].addConstraint(bodies[i], constraint);
        const maxTorque = bone.friction * frictionTorque;
        if (bone.joint === "spherical") {
            // cone (swing) about the joint axis, twist limits about it, friction motor
            plugin.setAxisMode(constraint, PhysicsConstraintAxis.ANGULAR_Y, PhysicsConstraintAxisLimitMode.LIMITED);
            plugin.setAxisMinLimit(constraint, PhysicsConstraintAxis.ANGULAR_Y, -bone.swing * DegToRad);
            plugin.setAxisMaxLimit(constraint, PhysicsConstraintAxis.ANGULAR_Y, bone.swing * DegToRad);
            plugin.setAxisMode(constraint, PhysicsConstraintAxis.ANGULAR_X, PhysicsConstraintAxisLimitMode.LIMITED);
            plugin.setAxisMinLimit(constraint, PhysicsConstraintAxis.ANGULAR_X, bone.twist[0] * DegToRad);
            plugin.setAxisMaxLimit(constraint, PhysicsConstraintAxis.ANGULAR_X, bone.twist[1] * DegToRad);
            plugin.setAxisMotorType(constraint, PhysicsConstraintAxis.ANGULAR_Y, PhysicsConstraintMotorType.VELOCITY);
            plugin.setAxisMotorTarget(constraint, PhysicsConstraintAxis.ANGULAR_Y, 0);
            plugin.setAxisMotorMaxForce(constraint, PhysicsConstraintAxis.ANGULAR_Y, maxTorque);
        } else {
            plugin.setAxisMode(constraint, PhysicsConstraintAxis.ANGULAR_X, PhysicsConstraintAxisLimitMode.LIMITED);
            plugin.setAxisMinLimit(constraint, PhysicsConstraintAxis.ANGULAR_X, bone.twist[0] * DegToRad);
            plugin.setAxisMaxLimit(constraint, PhysicsConstraintAxis.ANGULAR_X, bone.twist[1] * DegToRad);
            plugin.setAxisMotorType(constraint, PhysicsConstraintAxis.ANGULAR_X, PhysicsConstraintMotorType.VELOCITY);
            plugin.setAxisMotorTarget(constraint, PhysicsConstraintAxis.ANGULAR_X, 0);
            plugin.setAxisMotorMaxForce(constraint, PhysicsConstraintAxis.ANGULAR_X, maxTorque);
        }
    }
    return { root, bodies, nodes };
}

export function BuildRagdolls(ctx: IDemoContext): void {
    const scene = ctx.scene;
    const total = Math.max(1, Math.min(200, Math.round(Param(ctx, "count", 30))));
    ctx.help = `${total} Box3D human ragdolls (add &count=60) · click: throw one · space: explode the pile`;
    Ground(ctx, 60, 0.7);

    // a slippery chute with side rails, ragdolls tumble down it into a pile
    const chuteLength = 26;
    const chuteAngle = 0.62;
    const chute = (name: string, size: Vector3, offset: Vector3, color: number) => {
        const m = MeshBuilder.CreateBox(name, { width: size.x, height: size.y, depth: size.z }, scene);
        m.rotationQuaternion = Quaternion.FromEulerAngles(chuteAngle, 0, 0);
        m.position.set(0, (chuteLength / 2) * Math.sin(chuteAngle) + 0.5, -(chuteLength / 2) * Math.cos(chuteAngle) - 2);
        m.position.addInPlace(offset.applyRotationQuaternion(m.rotationQuaternion));
        m.material = ctx.material(color);
        m.receiveShadows = true;
        ctx.watch(m);
        new PhysicsAggregate(m, PhysicsShapeType.BOX, { mass: 0, friction: 0.05 }, scene);
    };
    chute("chuteFloor", new Vector3(8, 0.5, chuteLength), new Vector3(0, -0.25, 0), 6);
    chute("chuteLeft", new Vector3(0.4, 2, chuteLength), new Vector3(-4.2, 1, 0), 7);
    chute("chuteRight", new Vector3(0.4, 2, chuteLength), new Vector3(4.2, 1, 0), 7);
    const stop = MeshBuilder.CreateBox("stop", { width: 16, height: 1.5, depth: 0.5 }, scene);
    stop.position.set(0, 0.75, 12);
    stop.material = ctx.material(7);
    ctx.watch(stop);
    new PhysicsAggregate(stop, PhysicsShapeType.BOX, { mass: 0, friction: 0.7 }, scene);
    const spawn = new Vector3(0, chuteLength * Math.sin(chuteAngle) + 3, -chuteLength * Math.cos(chuteAngle) + 1);

    ctx.camera.setTarget(new Vector3(0, 6, -6));
    ctx.camera.radius = 40;
    ctx.camera.alpha = -Math.PI / 2 + 1.2;
    ctx.camera.beta = Math.PI / 3;

    let spawned = 0;
    let timer = 0;
    const humans: IHuman[] = [];
    scene.onBeforeRenderObservable.add(() => {
        timer += scene.getEngine().getDeltaTime() / 1000;
        if (spawned < total && timer > 0.45) {
            timer = 0;
            const human = CreateHuman(ctx, spawn.add(new Vector3(Math.random() * 4 - 2, 0, Math.random())), ++spawned);
            for (const body of human.bodies) {
                body.setLinearVelocity(new Vector3(Math.random() * 2 - 1, -2, 5 + Math.random() * 2));
            }
            human.bodies[0].applyAngularImpulse(new Vector3(Math.random() * 60 - 30, Math.random() * 60 - 30, Math.random() * 60 - 30));
            humans.push(human);
        }
    });

    scene.onPointerObservable.add((info) => {
        if (info.type !== 32 || info.event.button !== 0) {
            return;
        }
        const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, null, ctx.camera);
        const human = CreateHuman(ctx, ray.origin.add(ray.direction.scale(3)), ++spawned);
        for (const body of human.bodies) {
            body.setLinearVelocity(ray.direction.scale(18));
        }
        humans.push(human);
    });
    scene.onKeyboardObservable.add((info) => {
        if (info.type === 1 && info.event.key === " ") {
            const at = new Vector3(0, 0.5, 8);
            ctx.plugin.explode(at, 7, 600, 3);
            ExplosionFlash(ctx, at, 6);
        }
    });
}

// ------------------------------------------------------------------------------------------------
// car: Box3D "Driving" sample, wheel joints with suspension and steering
// ------------------------------------------------------------------------------------------------
export function BuildCar(ctx: IDemoContext): void {
    const scene = ctx.scene;
    const plugin = ctx.plugin;
    ctx.help = "W/S: throttle · A/D: steer · space: brake · R: reset · click: explode";

    // wavy height field
    const size = 120;
    const subdivisions = 80;
    const ground = MeshBuilder.CreateGround("terrain", { width: size, height: size, subdivisions, updatable: true }, scene);
    const positions = ground.getVerticesData("position")!;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        const d = Math.hypot(x, z);
        const flat = Math.max(0, Math.min(1, (d - 12) / 10));
        positions[i + 1] = flat * (1.2 * Math.sin(x * 0.18) * Math.cos(z * 0.14) + 0.8 * Math.sin(z * 0.35 + x * 0.1));
    }
    ground.updateVerticesData("position", positions);
    ground.createNormals(true);
    const groundMat = new StandardMaterial("terrainMat", scene);
    groundMat.diffuseColor = new Color3(0.5, 0.62, 0.42);
    groundMat.specularColor = Color3.Black();
    ground.material = groundMat;
    ground.receiveShadows = true;
    const groundBody = new PhysicsBody(ground, PhysicsMotionType.STATIC, false, scene);
    groundBody.shape = new PhysicsShape({ type: PhysicsShapeType.HEIGHTFIELD, parameters: { groundMesh: ground } }, scene);
    groundBody.shape.material = { friction: 0.8 };

    // ramps and a box pile to smash
    for (const [x, z, rot] of [
        [18, 0, 0],
        [-18, 0, Math.PI],
        [0, 22, Math.PI / 2],
    ]) {
        const ramp = MeshBuilder.CreateBox("ramp", { width: 8, height: 0.4, depth: 6 }, scene);
        ramp.position.set(x, 1.2, z);
        ramp.rotationQuaternion = Quaternion.FromEulerAngles(0, rot, 0.28);
        ramp.material = ctx.material(6);
        ctx.watch(ramp);
        new PhysicsAggregate(ramp, PhysicsShapeType.BOX, { mass: 0, friction: 0.8 }, scene);
    }
    {
        const n = 6;
        const matrices = new Float32Array(n * n * n * 16);
        const colors = new Float32Array(n * n * n * 4);
        let k = 0;
        for (let x = 0; x < n; x++) {
            for (let y = 0; y < n; y++) {
                for (let z = 0; z < n; z++) {
                    Matrix.TranslationToRef(-3 + x * 1.02, 0.5 + y * 1.02, -20 + z * 1.02, new Matrix()).copyToArray(matrices, k * 16);
                    ColorAt(colors, k, Palette[(x + y + z) % Palette.length]);
                    k++;
                }
            }
        }
        InstancedBoxes(ctx, "crates", new Vector3(1, 1, 1), matrices, colors, 60);
    }

    // chassis
    const chassisMesh = MeshBuilder.CreateBox("chassis", { width: 4, height: 1, depth: 2 }, scene);
    chassisMesh.position.set(0, 2.5, 0);
    chassisMesh.material = ctx.material(0);
    ctx.watch(chassisMesh);
    const cabin = MeshBuilder.CreateBox("cabin", { width: 1.8, height: 0.8, depth: 1.7 }, scene);
    cabin.parent = chassisMesh;
    cabin.position.set(-0.4, 0.9, 0);
    cabin.material = ctx.material(7);
    ctx.watch(cabin);
    const chassis = new PhysicsBody(chassisMesh, PhysicsMotionType.DYNAMIC, false, scene);
    const chassisShape = new PhysicsShapeBox(Vector3.Zero(), Quaternion.Identity(), new Vector3(4, 1, 2), scene);
    chassisShape.density = 500;
    chassisShape.material = { friction: 0.5 };
    chassis.shape = chassisShape;
    chassis.setMassProperties({ mass: 250, centerOfMass: new Vector3(0, -0.3, 0) });

    // keep the car mostly upright with a soft parallel joint (like the box3d sample)
    plugin.createParallelJoint(groundBody, chassis, Vector3.Up(), Vector3.Up(), 0.5, 1, 4000);

    // wheels: sphere colliders, cylinder visuals, spin about the wheel's local y (axle along world z)
    const wheelRadius = 0.45;
    const wheelRotation = Quaternion.FromUnitVectorsToRef(Vector3.Up(), Vector3.Forward(), new Quaternion());
    const tire = new StandardMaterial("tire", scene);
    tire.diffuseColor = new Color3(0.12, 0.12, 0.12);
    const wheels: { joint: Box3DWheelJoint; steer: boolean; drive: boolean; body: PhysicsBody; node: TransformNode }[] = [];
    for (const [x, z] of [
        [1.5, 0.8],
        [1.5, -0.8],
        [-1.5, 0.8],
        [-1.5, -0.8],
    ]) {
        const node = new TransformNode("wheel", scene);
        node.position.set(x, 2, z);
        node.rotationQuaternion = wheelRotation.clone();
        const rim = MeshBuilder.CreateCylinder("rim", { diameter: wheelRadius * 2, height: 0.35, tessellation: 20 }, scene);
        rim.parent = node;
        rim.material = tire;
        ctx.watch(rim);
        const hub = MeshBuilder.CreateBox("hub", { width: wheelRadius * 1.2, height: 0.36, depth: 0.12 }, scene);
        hub.parent = node;
        hub.material = ctx.material(3);
        const body = new PhysicsBody(node, PhysicsMotionType.DYNAMIC, false, scene);
        const shape = new PhysicsShapeSphere(Vector3.Zero(), wheelRadius, scene);
        shape.density = 2000;
        shape.material = { friction: 3, restitution: 0 };
        body.shape = shape;
        body.setMassProperties({ mass: 15 });
        plugin.setAllowFastRotation(body, true);
        const front = x > 0;
        const joint = plugin.createWheelJoint(chassis, body, {
            pivotA: new Vector3(x, -0.5, z),
            axisA: Vector3.Up(),
            axleA: Vector3.Forward(),
            suspensionHertz: 4,
            suspensionDampingRatio: 0.7,
            suspensionLimits: [-0.25, 0.25],
            enableSpinMotor: !front,
            maxSpinTorque: 1500,
            enableSteering: front,
            steeringHertz: 10,
            steeringDampingRatio: 0.7,
            maxSteeringTorque: 800,
            steeringLimits: [-Math.PI / 4, Math.PI / 4],
        });
        wheels.push({ joint, steer: front, drive: !front, body, node });
    }

    ctx.camera.radius = 16;
    ctx.camera.beta = Math.PI / 3.2;
    const spinSpeed = 60;
    let reverse = 1;
    scene.onBeforeRenderObservable.add(() => {
        let throttle = 0;
        let steer = 0;
        if (ctx.keys.has("w") || ctx.keys.has("arrowup")) {
            throttle += 1;
        }
        if (ctx.keys.has("s") || ctx.keys.has("arrowdown")) {
            throttle -= 1;
        }
        if (ctx.keys.has("a") || ctx.keys.has("arrowleft")) {
            steer += 1;
        }
        if (ctx.keys.has("d") || ctx.keys.has("arrowright")) {
            steer -= 1;
        }
        const brake = ctx.keys.has(" ");
        for (const w of wheels) {
            if (w.drive) {
                w.joint.setMaxSpinTorque(brake ? 4000 : 1500);
                w.joint.setSpinSpeed(brake ? 0 : -spinSpeed * throttle * reverse);
            }
            if (w.steer) {
                w.joint.setSteeringAngle((Math.PI / 4) * steer * reverse);
            }
        }
        if (ctx.keys.has("r")) {
            chassisMesh.position.set(0, 3, 0);
            chassisMesh.rotationQuaternion = Quaternion.Identity();
            chassis.disablePreStep = false;
            chassis.setLinearVelocity(Vector3.Zero());
            chassis.setAngularVelocity(Vector3.Zero());
            wheels.forEach((w, i) => {
                w.node.position.set(i < 2 ? 1.5 : -1.5, 2.5, i % 2 === 0 ? 0.8 : -0.8);
                w.node.rotationQuaternion = wheelRotation.clone();
                w.body.disablePreStep = false;
                w.body.setLinearVelocity(Vector3.Zero());
                w.body.setAngularVelocity(Vector3.Zero());
            });
            scene.onAfterPhysicsObservable.addOnce(() => {
                chassis.disablePreStep = true;
                wheels.forEach((w) => (w.body.disablePreStep = true));
            });
        }
        // chase camera
        ctx.camera.target = Vector3.Lerp(ctx.camera.target, chassisMesh.position, 0.15);
    });
    // flip drive direction if the car goes backwards on W (depends on handedness of the scene)
    (window as any).box3dCarReverse = () => (reverse = -reverse);

    ExplodeOnTap(ctx, 5, 2000, () => ShootBall(ctx, 200, 30));
}

// ------------------------------------------------------------------------------------------------
// destruction: brick tower, wrecking ball, explosions
// ------------------------------------------------------------------------------------------------
export function BuildDestruction(ctx: IDemoContext): void {
    const scene = ctx.scene;
    const floors = Math.max(2, Math.min(40, Math.round(Param(ctx, "floors", 14))));
    Ground(ctx, 120, 0.7);

    // hollow tower of bricks with floor slabs
    const w = 10;
    const d = 8;
    const brick = new Vector3(1, 0.5, 1);
    const cells: number[][] = [];
    for (let f = 0; f < floors; f++) {
        for (let level = 0; level < 4; level++) {
            const y = 0.25 + (f * 4 + level) * 0.5;
            const shift = level % 2 === 0 ? 0 : 0.5;
            for (let x = 0; x < w; x++) {
                cells.push([x - w / 2 + 0.5 + shift, y, -d / 2 + 0.5]);
                cells.push([x - w / 2 + 0.5 - shift, y, d / 2 - 0.5]);
            }
            for (let z = 1; z < d - 1; z++) {
                cells.push([-w / 2 + 0.5, y, z - d / 2 + 0.5 + shift]);
                cells.push([w / 2 - 0.5, y, z - d / 2 + 0.5 - shift]);
            }
        }
    }
    const matrices = new Float32Array(cells.length * 16);
    const colors = new Float32Array(cells.length * 4);
    cells.forEach((c, i) => {
        Matrix.TranslationToRef(c[0], c[1], c[2], new Matrix()).copyToArray(matrices, i * 16);
        ColorAt(colors, i, i % 7 === 0 ? "#b5651d" : "#c9784a", 0.8 + 0.2 * Math.random());
    });
    InstancedBoxes(ctx, "bricks", brick, matrices, colors, 40, 0.5);

    // floor slabs
    const slabs: number[][] = [];
    for (let f = 1; f <= floors; f++) {
        slabs.push([0, f * 2 - 0.125, 0]);
    }
    const slabMatrices = new Float32Array(slabs.length * 16);
    const slabColors = new Float32Array(slabs.length * 4);
    slabs.forEach((c, i) => {
        Matrix.TranslationToRef(c[0], c[1], c[2], new Matrix()).copyToArray(slabMatrices, i * 16);
        ColorAt(slabColors, i, "#9aa5b1");
    });
    InstancedBoxes(ctx, "slabs", new Vector3(w - 2, 0.25, d - 2), slabMatrices, slabColors, 40, 0.5);

    // wrecking ball on a crane
    const craneHeight = floors * 2 + 8;
    const crane = MeshBuilder.CreateBox("crane", { width: 1, height: 1, depth: 1 }, scene);
    crane.position.set(0, craneHeight, 0);
    crane.material = ctx.material(3);
    new PhysicsAggregate(crane, PhysicsShapeType.BOX, { mass: 0 }, scene);
    const arm = MeshBuilder.CreateBox("arm", { width: 30, height: 0.6, depth: 0.6 }, scene);
    arm.position.set(0, craneHeight, 0);
    arm.material = ctx.material(3);
    ctx.watch(arm);
    const ball = MeshBuilder.CreateSphere("wreckingBall", { diameter: 4 }, scene);
    const ropeLength = craneHeight - floors * 1.2;
    ball.position.set(ropeLength, craneHeight, d / 2 + 2);
    ball.material = ctx.material(6);
    ctx.watch(ball);
    const ballAgg = new PhysicsAggregate(ball, PhysicsShapeType.SPHERE, { mass: 40000, friction: 0.3 }, scene);
    const craneAgg = crane.physicsBody!;
    const rope = new DistanceConstraint(ropeLength, scene);
    craneAgg.addConstraint(ballAgg.body, rope);
    ballAgg.body.setLinearVelocity(new Vector3(0, 0, -4));
    // let the ball start swinging: give it a bit of time before it reaches the tower
    scene.onKeyboardObservable.add((info) => {
        if (info.type === 1 && info.event.key.toLowerCase() === "b") {
            ball.position.set(ropeLength, craneHeight, d / 2 + 2);
            ballAgg.body.disablePreStep = false;
            ballAgg.body.setLinearVelocity(new Vector3(0, 0, -4));
            ballAgg.body.setAngularVelocity(Vector3.Zero());
            scene.onAfterPhysicsObservable.addOnce(() => (ballAgg.body.disablePreStep = true));
        }
    });
    const ropeLine = MeshBuilder.CreateLines("rope", { points: [crane.position, ball.position], updatable: true }, scene);
    scene.onBeforeRenderObservable.add(() => {
        MeshBuilder.CreateLines("rope", { points: [crane.position, ball.position], instance: ropeLine }, scene);
    });

    ctx.help = `${cells.length + slabs.length} bricks, ${floors} floors (add &floors=24) · click: explode · space: cannonball · B: swing the ball again`;
    ctx.camera.setTarget(new Vector3(0, floors, 0));
    ctx.camera.radius = floors * 3 + 20;
    ctx.camera.alpha = -Math.PI / 2 + 0.8;
    ctx.camera.beta = Math.PI / 2.4;

    ExplodeOnTap(ctx, 5, 1200, () => ShootBall(ctx, 4000, 45, 2));
    scene.onKeyboardObservable.add((info) => {
        if (info.type === 1 && info.event.key === " ") {
            ShootBall(ctx, 4000, 50, 2);
        }
    });
}
