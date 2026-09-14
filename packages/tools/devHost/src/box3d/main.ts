/* eslint-disable no-console */
// Box3D physics showcase: http://localhost:1338/?exp=box3d&demo=pyramid
// demo = pyramid | ragdolls | car | destruction | stack | joints | terrain | compound

import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { DirectionalLight } from "core/Lights/directionalLight";
import { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { type Mesh } from "core/Meshes/mesh";
import { Vector3, Quaternion } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";
import { PointerEventTypes } from "core/Events/pointerEvents";
import { KeyboardEventTypes } from "core/Events/keyboardEvents";
import { Box3DPlugin } from "core/Physics/v2/Plugins/box3dPlugin";
import { PhysicsAggregate } from "core/Physics/v2/physicsAggregate";
import { PhysicsBody } from "core/Physics/v2/physicsBody";
import { PhysicsShapeType, PhysicsMotionType, PhysicsConstraintAxis, PhysicsConstraintMotorType, PhysicsEventType } from "core/Physics/v2/IPhysicsEnginePlugin";
import {
    PhysicsShapeBox,
    PhysicsShapeSphere,
    PhysicsShapeCylinder,
    PhysicsShapeContainer,
    PhysicsShapeMesh,
    PhysicsShapeConvexHull,
    PhysicsShape,
} from "core/Physics/v2/physicsShape";
import { HingeConstraint, BallAndSocketConstraint, DistanceConstraint, LockConstraint, PrismaticConstraint } from "core/Physics/v2/physicsConstraint";
import "core/Physics/joinedPhysicsEngineComponent";
import "core/Culling/ray";
import "core/Lights/Shadows/shadowGeneratorSceneComponent";
import { Ground, LoadBox3D, MakeMaterialFactory, Palette, type IDemoContext } from "./common";
import { BuildCar, BuildDestruction, BuildPyramid, BuildRagdolls } from "./showcase";

const Demos = ["pyramid", "ragdolls", "car", "destruction", "stack", "joints", "terrain", "compound"] as const;
type Demo = (typeof Demos)[number];

// ------------------------------------------------------------------------------------------------
// stack: pyramid of boxes plus random debris, click to shoot balls
// ------------------------------------------------------------------------------------------------
function BuildStack(ctx: IDemoContext): void {
    ctx.help = "click: shoot a ball · drag: orbit";
    Ground(ctx);
    const rows = 12;
    const size = 1;
    for (let row = 0; row < rows; row++) {
        const count = rows - row;
        for (let i = 0; i < count; i++) {
            const box = MeshBuilder.CreateBox("box", { size }, ctx.scene);
            box.position.set((i - (count - 1) / 2) * (size * 1.02), size / 2 + row * size * 1.02, 0);
            box.material = ctx.material(row);
            ctx.watch(box);
            new PhysicsAggregate(box, PhysicsShapeType.BOX, { mass: 1, friction: 0.6 }, ctx.scene);
        }
    }
    for (let i = 0; i < 40; i++) {
        const kind = i % 3;
        let mesh: Mesh;
        let type: PhysicsShapeType;
        if (kind === 0) {
            mesh = MeshBuilder.CreateSphere("s", { diameter: 0.8 }, ctx.scene);
            type = PhysicsShapeType.SPHERE;
        } else if (kind === 1) {
            mesh = MeshBuilder.CreateCapsule("c", { radius: 0.3, height: 1.4 }, ctx.scene);
            type = PhysicsShapeType.CAPSULE;
        } else {
            mesh = MeshBuilder.CreateCylinder("cy", { diameter: 0.8, height: 0.8 }, ctx.scene);
            type = PhysicsShapeType.CYLINDER;
        }
        mesh.position.set(Math.random() * 16 - 8, 14 + i * 0.6, Math.random() * 16 - 8);
        mesh.rotationQuaternion = Quaternion.FromEulerAngles(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        mesh.material = ctx.material();
        ctx.watch(mesh);
        new PhysicsAggregate(mesh, type, { mass: 0.5, friction: 0.5, restitution: 0.2 }, ctx.scene);
    }
    Shooter(ctx);
}

// ------------------------------------------------------------------------------------------------
// joints: hinge bridge, ball and socket rope, motorized paddle, prismatic piston, distance and lock
// ------------------------------------------------------------------------------------------------
function BuildJoints(ctx: IDemoContext): void {
    ctx.help = "click: shoot a ball · drag: orbit";
    Ground(ctx);
    const scene = ctx.scene;

    const staticBox = (name: string, pos: Vector3, size: Vector3): PhysicsAggregate => {
        const m = MeshBuilder.CreateBox(name, { width: size.x, height: size.y, depth: size.z }, scene);
        m.position.copyFrom(pos);
        m.material = ctx.material(6);
        ctx.watch(m);
        return new PhysicsAggregate(m, PhysicsShapeType.BOX, { mass: 0 }, scene);
    };
    const dynamicBox = (name: string, pos: Vector3, size: Vector3, mass = 1, color?: number): PhysicsAggregate => {
        const m = MeshBuilder.CreateBox(name, { width: size.x, height: size.y, depth: size.z }, scene);
        m.position.copyFrom(pos);
        m.material = ctx.material(color);
        ctx.watch(m);
        return new PhysicsAggregate(m, PhysicsShapeType.BOX, { mass, friction: 0.6 }, scene);
    };

    // 1. hinge bridge between two posts (hinge axis = z)
    {
        const left = staticBox("postL", new Vector3(-8, 4, 0), new Vector3(1, 8, 3));
        const right = staticBox("postR", new Vector3(8, 4, 0), new Vector3(1, 8, 3));
        const plankCount = 12;
        const plankLength = 15 / plankCount;
        let prev = left;
        let prevPivot = new Vector3(0.5, 4, 0);
        for (let i = 0; i < plankCount; i++) {
            const x = -7.5 + plankLength * (i + 0.5);
            const plank = dynamicBox("plank" + i, new Vector3(x, 8, 0), new Vector3(plankLength * 0.98, 0.25, 2.5), 2, 4);
            const hinge = new HingeConstraint(prevPivot, new Vector3(-plankLength / 2, 0, 0), new Vector3(0, 0, 1), new Vector3(0, 0, 1), scene);
            prev.body.addConstraint(plank.body, hinge);
            prev = plank;
            prevPivot = new Vector3(plankLength / 2, 0, 0);
        }
        const last = new HingeConstraint(prevPivot, new Vector3(-0.5, 4, 0), new Vector3(0, 0, 1), new Vector3(0, 0, 1), scene);
        prev.body.addConstraint(right.body, last);
        const weight = MeshBuilder.CreateSphere("weight", { diameter: 1.6 }, scene);
        weight.position.set(0, 12, 0);
        weight.material = ctx.material(0);
        ctx.watch(weight);
        new PhysicsAggregate(weight, PhysicsShapeType.SPHERE, { mass: 6, friction: 0.5 }, scene);
    }

    // 2. ball and socket rope
    {
        const anchor = staticBox("ropeAnchor", new Vector3(-4, 12, -8), new Vector3(0.6, 0.6, 0.6));
        let prev: PhysicsAggregate = anchor;
        let prevPivot = new Vector3(0, -0.3, 0);
        for (let i = 0; i < 10; i++) {
            const bead = MeshBuilder.CreateSphere("bead" + i, { diameter: 0.5 }, scene);
            bead.position.set(-4 + (i + 1) * 0.55, 12, -8);
            bead.material = ctx.material(3);
            ctx.watch(bead);
            const agg = new PhysicsAggregate(bead, PhysicsShapeType.SPHERE, { mass: 0.3 }, scene);
            const joint = new BallAndSocketConstraint(prevPivot, new Vector3(-0.3, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 1, 0), scene);
            prev.body.addConstraint(agg.body, joint);
            prev = agg;
            prevPivot = new Vector3(0.3, 0, 0);
        }
        const bob = MeshBuilder.CreateBox("bob", { size: 1.2 }, scene);
        bob.position.set(2.2, 12, -8);
        bob.material = ctx.material(1);
        ctx.watch(bob);
        const bobAgg = new PhysicsAggregate(bob, PhysicsShapeType.BOX, { mass: 2 }, scene);
        prev.body.addConstraint(bobAgg.body, new BallAndSocketConstraint(prevPivot, new Vector3(-0.6, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 1, 0), scene));
    }

    // 3. motorized paddle wheel (hinge with velocity motor about y)
    {
        const base = staticBox("paddleBase", new Vector3(6, 0.75, -8), new Vector3(1, 1.5, 1));
        const paddle = dynamicBox("paddle", new Vector3(6, 2.2, -8), new Vector3(6, 0.3, 0.6), 2, 2);
        const blade = MeshBuilder.CreateBox("blade", { width: 0.6, height: 0.3, depth: 6 }, scene);
        blade.position.set(6, 2.2, -8);
        blade.material = ctx.material(2);
        ctx.watch(blade);
        const bladeAgg = new PhysicsAggregate(blade, PhysicsShapeType.BOX, { mass: 2 }, scene);
        paddle.body.addConstraint(bladeAgg.body, new LockConstraint(Vector3.Zero(), Vector3.Zero(), new Vector3(0, 1, 0), new Vector3(0, 1, 0), scene));
        const motor = new HingeConstraint(new Vector3(0, 1.45, 0), Vector3.Zero(), new Vector3(0, 1, 0), new Vector3(0, 1, 0), scene);
        base.body.addConstraint(paddle.body, motor);
        // axis helpers live on Physics6DoFConstraint in Babylon, so talk to the plugin directly here
        ctx.plugin.setAxisMotorType(motor, PhysicsConstraintAxis.ANGULAR_X, PhysicsConstraintMotorType.VELOCITY);
        ctx.plugin.setAxisMotorMaxForce(motor, PhysicsConstraintAxis.ANGULAR_X, 500);
        ctx.plugin.setAxisMotorTarget(motor, PhysicsConstraintAxis.ANGULAR_X, 2);
        for (let i = 0; i < 12; i++) {
            const crate = dynamicBox("crate" + i, new Vector3(6 + (i % 4) * 1.1 - 1.6, 5 + Math.floor(i / 4) * 1.2, -8), new Vector3(0.8, 0.8, 0.8), 0.5);
            crate.body.setAngularDamping(0.2);
        }
    }

    // 4. prismatic piston with a position spring
    {
        const rail = staticBox("rail", new Vector3(-8, 0.5, 8), new Vector3(1, 1, 1));
        const slider = dynamicBox("slider", new Vector3(-8, 2, 8), new Vector3(1.2, 1.2, 1.2), 1, 5);
        const prismatic = new PrismaticConstraint(new Vector3(0, 1.5, 0), Vector3.Zero(), new Vector3(0, 1, 0), new Vector3(0, 1, 0), scene);
        rail.body.addConstraint(slider.body, prismatic);
        ctx.plugin.setAxisMinLimit(prismatic, PhysicsConstraintAxis.LINEAR_X, 0);
        ctx.plugin.setAxisMaxLimit(prismatic, PhysicsConstraintAxis.LINEAR_X, 6);
        ctx.plugin.setAxisMotorType(prismatic, PhysicsConstraintAxis.LINEAR_X, PhysicsConstraintMotorType.POSITION);
        let t = 0;
        scene.onBeforeRenderObservable.add(() => {
            t += scene.getEngine().getDeltaTime() / 1000;
            ctx.plugin.setAxisMotorTarget(prismatic, PhysicsConstraintAxis.LINEAR_X, 3 + 3 * Math.sin(t * 1.5));
        });
        const rider = dynamicBox("rider", new Vector3(-8, 3.5, 8), new Vector3(0.8, 0.8, 0.8), 0.3, 0);
        rider.body.setAngularDamping(0.5);
    }

    // 5. distance constraint pendulum
    {
        const hook = staticBox("hook", new Vector3(0, 12, 8), new Vector3(0.5, 0.5, 0.5));
        const ball = MeshBuilder.CreateSphere("pendulum", { diameter: 1.5 }, scene);
        ball.position.set(5, 12, 8);
        ball.material = ctx.material(7);
        ctx.watch(ball);
        const agg = new PhysicsAggregate(ball, PhysicsShapeType.SPHERE, { mass: 3 }, scene);
        hook.body.addConstraint(agg.body, new DistanceConstraint(5, scene));
    }

    // 6. lock constraint: an L made of two boxes
    {
        const a = dynamicBox("lockA", new Vector3(6, 6, 8), new Vector3(2, 0.5, 0.5), 1, 6);
        const b = dynamicBox("lockB", new Vector3(7, 7, 8), new Vector3(0.5, 2, 0.5), 1, 7);
        a.body.addConstraint(b.body, new LockConstraint(new Vector3(1, 0.25, 0), new Vector3(0, -1, 0), new Vector3(1, 0, 0), new Vector3(1, 0, 0), scene));
    }
    Shooter(ctx);
}

// ------------------------------------------------------------------------------------------------
// terrain: height field ground, static mesh trough, convex hull rocks, trigger zone
// ------------------------------------------------------------------------------------------------
function BuildTerrain(ctx: IDemoContext): void {
    ctx.help = "click: shoot a ball · drag: orbit";
    const scene = ctx.scene;
    const size = 60;
    const subdivisions = 48;
    const ground = MeshBuilder.CreateGround("terrain", { width: size, height: size, subdivisions, updatable: true }, scene);
    const positions = ground.getVerticesData("position")!;
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        positions[i + 1] = 1.5 * Math.sin(x * 0.25) * Math.cos(z * 0.2) + 0.03 * (x * x + z * z) ** 0.9 * 0.25;
    }
    ground.updateVerticesData("position", positions);
    ground.createNormals(true);
    const mat = new StandardMaterial("terrainMat", scene);
    mat.diffuseColor = new Color3(0.55, 0.7, 0.45);
    mat.specularColor = Color3.Black();
    ground.material = mat;
    ground.receiveShadows = true;
    const groundBody = new PhysicsBody(ground, PhysicsMotionType.STATIC, false, scene);
    groundBody.shape = new PhysicsShape({ type: PhysicsShapeType.HEIGHTFIELD, parameters: { groundMesh: ground } }, scene);

    // a static concave mesh: a half pipe trough built from a ribbon (single sided, so this also checks winding)
    const trough = (() => {
        const radius = 5;
        const paths: Vector3[][] = [];
        for (let i = 0; i <= 24; i++) {
            const angle = Math.PI + (Math.PI * i) / 24;
            const path: Vector3[] = [];
            for (let j = 0; j <= 8; j++) {
                path.push(new Vector3(radius * Math.cos(angle), radius + radius * Math.sin(angle), -6 + (12 * j) / 8));
            }
            paths.push(path);
        }
        const mesh = MeshBuilder.CreateRibbon("trough", { pathArray: paths, sideOrientation: 1 }, scene);
        mesh.position.set(-12, 0.5, 12);
        const troughMat = new StandardMaterial("troughMat", scene);
        troughMat.diffuseColor = Color3.FromHexString(Palette[6]);
        troughMat.backFaceCulling = false;
        troughMat.twoSidedLighting = true;
        mesh.material = troughMat;
        mesh.receiveShadows = true;
        mesh.computeWorldMatrix(true);
        return mesh;
    })();
    const troughBody = new PhysicsBody(trough, PhysicsMotionType.STATIC, false, scene);
    troughBody.shape = new PhysicsShapeMesh(trough, scene);
    troughBody.shape.material = { friction: 0.4, restitution: 0.1 };

    for (let i = 0; i < 30; i++) {
        const rock = MeshBuilder.CreatePolyhedron("rock" + i, { type: (i % 6) + 1, size: 0.5 + Math.random() * 0.6 }, scene);
        rock.position.set(-12 + Math.random() * 6 - 3, 12 + i * 0.7, 12 + Math.random() * 4 - 2);
        rock.material = ctx.material();
        ctx.watch(rock);
        const body = new PhysicsBody(rock, PhysicsMotionType.DYNAMIC, false, scene);
        body.shape = new PhysicsShapeConvexHull(rock, scene);
        body.shape.material = { friction: 0.5, restitution: 0.1 };
        body.setMassProperties({ mass: 1 });
    }

    for (let i = 0; i < 8; i++) {
        const knot = MeshBuilder.CreateTorusKnot("knot" + i, { radius: 0.6, tube: 0.2, radialSegments: 32, tubularSegments: 8 }, scene);
        knot.position.set(8 + Math.random() * 6, 10 + i * 1.5, -6 + Math.random() * 6);
        knot.material = ctx.material(i);
        ctx.watch(knot);
        new PhysicsAggregate(knot, PhysicsShapeType.CONVEX_HULL, { mass: 1, friction: 0.5 }, scene);
    }

    for (let i = 0; i < 60; i++) {
        const marble = MeshBuilder.CreateSphere("marble" + i, { diameter: 0.6 }, scene);
        marble.position.set(Math.random() * 40 - 20, 8 + Math.random() * 6, Math.random() * 40 - 20);
        marble.material = ctx.material(i);
        ctx.watch(marble);
        new PhysicsAggregate(marble, PhysicsShapeType.SPHERE, { mass: 0.3, friction: 0.3, restitution: 0.3 }, scene);
    }

    // anything that rolls off the edge comes back from above
    scene.onBeforeRenderObservable.add(() => {
        for (const mesh of scene.meshes) {
            const body = (mesh as Mesh).physicsBody;
            if (!body || body.getMotionType() !== PhysicsMotionType.DYNAMIC || mesh.position.y > -20) {
                continue;
            }
            mesh.position.set(Math.random() * 30 - 15, 15, Math.random() * 30 - 15);
            body.disablePreStep = false;
            body.setLinearVelocity(Vector3.Zero());
            body.setAngularVelocity(Vector3.Zero());
            scene.onAfterPhysicsObservable.addOnce(() => (body.disablePreStep = true));
        }
    });

    // trigger zone that lights up while something is inside
    const zone = MeshBuilder.CreateBox("zone", { width: 8, height: 4, depth: 8 }, scene);
    zone.position.set(10, 2, 10);
    const zoneMat = new StandardMaterial("zoneMat", scene);
    zoneMat.diffuseColor = new Color3(0.2, 0.6, 1);
    zoneMat.alpha = 0.25;
    zone.material = zoneMat;
    const zoneBody = new PhysicsBody(zone, PhysicsMotionType.STATIC, false, scene);
    const zoneShape = new PhysicsShapeBox(Vector3.Zero(), Quaternion.Identity(), new Vector3(8, 4, 8), scene);
    zoneShape.isTrigger = true;
    zoneBody.shape = zoneShape;
    let inside = 0;
    ctx.plugin.onTriggerCollisionObservable.add((event) => {
        if (event.collider !== zoneBody) {
            return;
        }
        inside += event.type === PhysicsEventType.TRIGGER_ENTERED ? 1 : -1;
        zoneMat.diffuseColor = inside > 0 ? new Color3(1, 0.5, 0.2) : new Color3(0.2, 0.6, 1);
        zoneMat.alpha = inside > 0 ? 0.45 : 0.25;
    });
    Shooter(ctx);
}

// ------------------------------------------------------------------------------------------------
// compound: container shapes made of several primitives
// ------------------------------------------------------------------------------------------------
function BuildCompound(ctx: IDemoContext): void {
    ctx.help = "click: shoot a ball · drag: orbit";
    const scene = ctx.scene;
    Ground(ctx);

    const dumbbell = (index: number) => {
        const root = MeshBuilder.CreateCylinder("bar" + index, { diameter: 0.3, height: 2.4 }, scene);
        root.rotationQuaternion = Quaternion.FromEulerAngles(Math.random() * 3, Math.random() * 3, Math.random() * 3);
        root.position.set(Math.random() * 10 - 5, 6 + index * 1.4, Math.random() * 10 - 5);
        root.material = ctx.material(index);
        const left = MeshBuilder.CreateSphere("l" + index, { diameter: 1 }, scene);
        left.parent = root;
        left.position.y = 1.2;
        left.material = root.material;
        const right = MeshBuilder.CreateSphere("r" + index, { diameter: 1 }, scene);
        right.parent = root;
        right.position.y = -1.2;
        right.material = root.material;
        ctx.watch(root);
        ctx.watch(left);
        ctx.watch(right);

        const container = new PhysicsShapeContainer(scene);
        container.addChild(new PhysicsShapeCylinder(new Vector3(0, -1.2, 0), new Vector3(0, 1.2, 0), 0.15, scene));
        container.addChild(new PhysicsShapeSphere(new Vector3(0, 1.2, 0), 0.5, scene));
        container.addChild(new PhysicsShapeSphere(new Vector3(0, -1.2, 0), 0.5, scene));
        container.material = { friction: 0.6, restitution: 0.1 };
        const body = new PhysicsBody(root, PhysicsMotionType.DYNAMIC, false, scene);
        body.shape = container;
        body.setMassProperties({ mass: 2 });
    };

    const table = (index: number) => {
        const top = MeshBuilder.CreateBox("top" + index, { width: 3, height: 0.2, depth: 2 }, scene);
        top.position.set(Math.random() * 10 - 5, 12 + index * 2, Math.random() * 10 - 5);
        top.rotationQuaternion = Quaternion.FromEulerAngles(Math.random(), Math.random() * 3, Math.random());
        top.material = ctx.material(index + 4);
        ctx.watch(top);
        const container = new PhysicsShapeContainer(scene);
        container.addChild(new PhysicsShapeBox(Vector3.Zero(), Quaternion.Identity(), new Vector3(3, 0.2, 2), scene));
        for (const [x, z] of [
            [-1.3, -0.8],
            [1.3, -0.8],
            [-1.3, 0.8],
            [1.3, 0.8],
        ]) {
            const leg = MeshBuilder.CreateBox("leg", { width: 0.2, height: 1.4, depth: 0.2 }, scene);
            leg.parent = top;
            leg.position.set(x, -0.8, z);
            leg.material = top.material;
            ctx.watch(leg);
            container.addChild(new PhysicsShapeBox(new Vector3(x, -0.8, z), Quaternion.Identity(), new Vector3(0.2, 1.4, 0.2), scene));
        }
        container.material = { friction: 0.6 };
        const body = new PhysicsBody(top, PhysicsMotionType.DYNAMIC, false, scene);
        body.shape = container;
        body.setMassProperties({ mass: 3 });
    };

    for (let i = 0; i < 10; i++) {
        dumbbell(i);
    }
    for (let i = 0; i < 6; i++) {
        table(i);
    }
    Shooter(ctx);
}

// ------------------------------------------------------------------------------------------------

function Shooter(ctx: IDemoContext): void {
    const scene = ctx.scene;
    let count = 0;
    scene.onPointerObservable.add((info) => {
        if (info.type !== PointerEventTypes.POINTERTAP || info.event.button !== 0) {
            return;
        }
        const ray = scene.createPickingRay(scene.pointerX, scene.pointerY, null, ctx.camera);
        const ball = MeshBuilder.CreateSphere("shot" + count++, { diameter: 1 }, scene);
        ball.position.copyFrom(ray.origin).addInPlace(ray.direction.scale(2));
        ball.material = ctx.material(count);
        ctx.watch(ball);
        const agg = new PhysicsAggregate(ball, PhysicsShapeType.SPHERE, { mass: 4, restitution: 0.3, friction: 0.5 }, scene);
        agg.body.setLinearVelocity(ray.direction.scale(40));
    });
}

function Hud(ctx: IDemoContext, demo: Demo): void {
    const hud = document.createElement("div");
    hud.style.cssText =
        "position:absolute;left:12px;top:12px;padding:10px 14px;background:rgba(20,20,30,0.75);color:#eee;font:13px/1.5 system-ui,sans-serif;border-radius:8px;pointer-events:auto;white-space:pre;";
    const links = Demos.map((d) => (d === demo ? `<b>${d}</b>` : `<a style="color:#8cf" href="?exp=box3d&demo=${d}">${d}</a>`)).join(" · ");
    const stats = document.createElement("div");
    hud.innerHTML = `<div style="margin-bottom:6px">Box3D ⇄ Babylon.js &nbsp; ${links}</div><div style="opacity:.7">${ctx.help}</div>`;
    hud.appendChild(stats);
    document.body.appendChild(hud);
    const engine = ctx.scene.getEngine();
    let accum = 0;
    let stepAccum = 0;
    let frames = 0;
    ctx.scene.onAfterRenderObservable.add(() => {
        accum += engine.getDeltaTime();
        stepAccum += ctx.plugin.lastStepTimeMs;
        frames++;
        if (accum < 250) {
            return;
        }
        const s = ctx.plugin.getStats();
        stats.textContent = `bodies ${s.bodies}  shapes ${s.shapes}  contacts ${s.contacts}  joints ${s.joints}  islands ${s.islands}\nphysics ${(stepAccum / frames).toFixed(2)} ms/step  fps ${engine.getFps().toFixed(0)}`;
        accum = 0;
        stepAccum = 0;
        frames = 0;
    });
}

/**
 * Entry point for the Box3D showcase.
 * @param searchParams query string parameters (keys lower cased)
 */
export async function Main(searchParams: URLSearchParams): Promise<void> {
    const demo = (searchParams.get("demo") ?? "pyramid") as Demo;
    const mainDiv = document.getElementById("main-div") as HTMLDivElement;
    const canvas = document.createElement("canvas");
    canvas.id = "babylon-canvas";
    canvas.style.cssText = "width:100%;height:100%;outline:none;";
    canvas.tabIndex = 1;
    mainDiv.appendChild(canvas);

    const engine = new Engine(canvas, true, { adaptToDeviceRatio: true });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.12, 0.13, 0.17, 1);

    const box3d = await LoadBox3D();
    console.log("Box3D version", box3d._bx_GetVersion());
    const plugin = new Box3DPlugin(true, box3d);
    scene.enablePhysics(new Vector3(0, -9.81, 0), plugin);

    const camera = new ArcRotateCamera("camera", -Math.PI / 2.5, Math.PI / 3, 40, new Vector3(0, 4, 0), scene);
    camera.attachControl(canvas, true);
    camera.wheelPrecision = 20;
    camera.lowerRadiusLimit = 3;
    camera.upperRadiusLimit = 400;
    camera.minZ = 0.1;
    camera.maxZ = 2000;

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.6;
    const sun = new DirectionalLight("sun", new Vector3(-0.5, -1, 0.4), scene);
    sun.position.set(40, 80, -40);
    sun.intensity = 0.9;
    const shadows = new ShadowGenerator(2048, sun);
    shadows.useBlurExponentialShadowMap = true;
    shadows.blurKernel = 16;
    sun.autoUpdateExtends = true;

    const keys = new Set<string>();
    scene.onKeyboardObservable.add((info) => {
        const key = info.event.key.toLowerCase();
        if (info.type === KeyboardEventTypes.KEYDOWN) {
            keys.add(key);
        } else {
            keys.delete(key);
        }
    });
    window.addEventListener("blur", () => keys.clear());

    const ctx: IDemoContext = {
        scene,
        plugin,
        camera,
        shadows,
        params: searchParams,
        keys,
        material: MakeMaterialFactory(scene),
        watch: (mesh) => {
            shadows.addShadowCaster(mesh);
            mesh.receiveShadows = true;
        },
        help: "",
    };

    switch (demo) {
        case "ragdolls":
            BuildRagdolls(ctx);
            break;
        case "car":
            BuildCar(ctx);
            break;
        case "destruction":
            BuildDestruction(ctx);
            break;
        case "stack":
            BuildStack(ctx);
            break;
        case "joints":
            BuildJoints(ctx);
            break;
        case "terrain":
            BuildTerrain(ctx);
            break;
        case "compound":
            BuildCompound(ctx);
            break;
        default:
            BuildPyramid(ctx);
            break;
    }
    if (searchParams.get("ui") !== "0") {
        Hud(ctx, demo);
    }

    (window as any).box3dDemo = { scene, plugin, box3d, keys };
    engine.runRenderLoop(() => scene.render());
    window.addEventListener("resize", () => engine.resize());
}
