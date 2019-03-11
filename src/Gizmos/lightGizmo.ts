import { Nullable } from "../types";
import { Color3 } from "../Maths/math";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { Gizmo } from "./gizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";

import { StandardMaterial } from '../Materials/standardMaterial';
import { Light } from '../Lights/light';
import { Scene } from '../scene';
import { HemisphericLight } from '../Lights/hemisphericLight';
import { DirectionalLight } from '../Lights/directionalLight';
import { SphereBuilder } from '../Meshes/Builders/sphereBuilder';
import { HemisphereBuilder } from '../Meshes/Builders/hemisphereBuilder';
import { SpotLight } from '../Lights/spotLight';

/**
 * Gizmo that enables viewing a light
 */
export class LightGizmo extends Gizmo {
    private _lightMesh: Mesh;
    private static _Scale = 0.02;

    private static _createLightLines = (levels:number, scene:Scene)=>{
        var distFromSphere = 1.2;
        
        var root = new Mesh("root", scene)
        root.rotation.x = Math.PI/2

        // Create the top line, this will be cloned for all other lines
        var linePivot = new Mesh("linePivot", scene)
        linePivot.parent = root;
        var line = Mesh.CreateCylinder("line", 2, 0.2, 0.3, 6, 1, scene)
        line.position.y = line.scaling.y/2 + distFromSphere
        line.parent = linePivot
    
        if(levels < 2){
            return linePivot;
        }
        for(var i = 0;i<4;i++){
            var l = linePivot.clone("lineParentClone");
            l.rotation.z = Math.PI/4
            l.rotation.y = (Math.PI/2)+(Math.PI/2*i);
    
            l.getChildMeshes()[0].scaling.y = 0.5;
            l.getChildMeshes()[0].scaling.x = l.getChildMeshes()[0].scaling.z = 0.8;
            l.getChildMeshes()[0].position.y =l.getChildMeshes()[0].scaling.y/2 + distFromSphere;
        }
    
        if(levels < 3){
            return root;
        }
        for(var i = 0; i < 4; i++){
            var l = linePivot.clone("linePivotClone");
            l.rotation.z = Math.PI/2
            l.rotation.y = (Math.PI/2*i);
        }
    
        if(levels < 4){
            return root;
        }
        for(var i = 0;i<4;i++){
            var l = linePivot.clone("linePivotClone");
            l.rotation.z = Math.PI + (Math.PI/4)
            l.rotation.y = (Math.PI/2)+(Math.PI/2*i);
    
            l.getChildMeshes()[0].scaling.y = 0.5;
            l.getChildMeshes()[0].scaling.x = l.getChildMeshes()[0].scaling.z = 0.8;
            l.getChildMeshes()[0].position.y =l.getChildMeshes()[0].scaling.y/2 + distFromSphere;
        }
    
        if(levels < 5){
            return root;
        }
        var l = linePivot.clone("linePivotClone");
        l.rotation.z = Math.PI

        return root;
    }

    private static _CreateHemisphericLightMesh(scene:Scene){
        var root = new Mesh("hemisphereLight", scene)
        var hemisphere = HemisphereBuilder.CreateHemisphere(root.name, {segments: 10, diameter: 1}, scene);
        hemisphere.position.z = -0.15;
        hemisphere.rotation.x = Math.PI/2;
        hemisphere.parent = root
    
        var lines = this._createLightLines(3, scene);
        lines.parent = root;
        lines.position.z -0.15;

        root.scaling.scaleInPlace(LightGizmo._Scale)
        root.rotation.x = Math.PI/2;
        // var meshes = <Array<Mesh>>root.getChildMeshes(false);
        // var merged = Mesh.MergeMeshes(meshes, true)
        // merged.parent = root;
        
        return root;
    }
    
    private static _CreatePointLightMesh(scene:Scene){
        var root = new Mesh("pointLight", scene)
        var sphere = SphereBuilder.CreateSphere(root.name, {segments: 10, diameter: 1}, scene);
        sphere.rotation.x = Math.PI/2;
        sphere.parent = root
    
        var lines = this._createLightLines(5, scene);
        lines.parent = root;
        root.scaling.scaleInPlace(LightGizmo._Scale)
        root.rotation.x = Math.PI/2;
        
        return root;
    }

    private static _CreateSpotLightMesh(scene:Scene){
        var root = new Mesh("spotLight", scene)
        var sphere = SphereBuilder.CreateSphere(root.name, {segments: 10, diameter: 1}, scene);
        sphere.parent = root

        var hemisphere = HemisphereBuilder.CreateHemisphere(root.name, {segments: 10, diameter: 2}, scene);
        hemisphere.parent = root;
        hemisphere.rotation.x = -Math.PI/2;
    
        var lines = this._createLightLines(2, scene);
        lines.parent = root;
        root.scaling.scaleInPlace(LightGizmo._Scale)
        root.rotation.x = Math.PI/2;
        
        return root;
    }

    private static _CreateDirectionalLightMesh(scene:Scene){
        var root = new Mesh("directionalLight", scene)

        var mesh = new Mesh("", scene)
        mesh.parent = root
        var sphere  = SphereBuilder.CreateSphere("directionalSphere", {diameter: 1.2, segments: 10}, scene)
        sphere.parent = mesh
    
        var line = Mesh.CreateCylinder("directionalCenterLine", 6, 0.3, 0.3, 6, 1, scene)
        line.parent = mesh;
    
        var left = line.clone("directionalLeftLine")
        left.scaling.y = 0.5;
        left.position.x += 1.25;
    
        var right = line.clone("directionalRightLine")
        right.scaling.y = 0.5;
        right.position.x += -1.25;
        
        var arrowHead = Mesh.CreateCylinder("directionalCenterCone", 1, 0, 0.6, 6, 1, scene)
        arrowHead.position.y += 3
        arrowHead.parent = mesh;
    
        var left = arrowHead.clone("directionalLeftCone");
        left.position.y = 1.5
        left.position.x += 1.25;
    
        var right = arrowHead.clone("directionalRightCone");
        right.position.y = 1.5
        right.position.x += -1.25;

        mesh.scaling.scaleInPlace(LightGizmo._Scale)
        mesh.rotation.z = Math.PI/2;
        mesh.rotation.y = Math.PI/2;
        return root;
    }

    /**
     * Creates a LightGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     */
    constructor(gizmoLayer?: UtilityLayerRenderer) {
        super(gizmoLayer);        
        this.attachedMesh = new AbstractMesh("", this.gizmoLayer.utilityLayerScene);
    }
    private _light: Nullable<Light> = null;

    /**
     * The light that the gizmo is attached to
     */
    public set light(light: Nullable<Light>) {
        this._light = light;
        if(light){
            // Create the mesh for the given light type
            if(this._lightMesh){
                this._lightMesh.dispose();
            }
            if(light instanceof HemisphericLight){
                this._lightMesh = LightGizmo._CreateHemisphericLightMesh(this.gizmoLayer.utilityLayerScene);
            }else if(light instanceof DirectionalLight){
                this._lightMesh = LightGizmo._CreateDirectionalLightMesh(this.gizmoLayer.utilityLayerScene);
            }else if(light instanceof SpotLight){
                this._lightMesh = LightGizmo._CreateSpotLightMesh(this.gizmoLayer.utilityLayerScene);
            }else{
                this._lightMesh = LightGizmo._CreatePointLightMesh(this.gizmoLayer.utilityLayerScene);
            }
            this._lightMesh.parent = this._rootMesh;
            
            if ((light as any).position) {
                this.attachedMesh!.position.copyFrom((light as any).position);
            }
            if ((light as any).direction) {
                this._lightMesh.setDirection((light as any).direction);
            }
        }
    }
    public get light() {
        return this._light;
    }

    /**
     * @hidden
     * Updates the gizmo to match the attached mesh's position/rotation
     */
    protected _update() {
        super._update();
        if (!this._light) {
            return;
        }
        if ((this._light as any).position) {
            (this._light as any).position.copyFrom(this.attachedMesh!.position);
        }
        if ((this._light as any).direction) {
            (this._light as any).direction.copyFrom(this._lightMesh.forward);
        }
        // if (!this._light.isEnabled()) {
        //     (this._lightMesh.material as StandardMaterial).emissiveColor.set(0, 0, 0);
        // } else {
        //     (this._lightMesh.material as StandardMaterial).emissiveColor.set(1, 1, 1);
        // }
    }
}