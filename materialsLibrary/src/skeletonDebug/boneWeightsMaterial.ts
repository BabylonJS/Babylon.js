import { Scene } from "babylonjs/scene";
import { _TypeStore } from 'babylonjs/Misc/typeStore';
//import "./boneWeights.fragment";
//import "./boneWeights.vertex";

import { IBoneWeightsMaterialOptions } from "./IBoneWeightsMaterial";
import { Skeleton, Color3, ShaderMaterial, Material } from 'babylonjs';

export class BoneWeightsMaterial extends ShaderMaterial{   

    public skeleton: Skeleton;
    public colorBase: Color3;
    public colorZero: Color3;
    public colorQuarter: Color3;
    public colorHalf: Color3;
    public colorFull: Color3;
    public targetBoneIndex: number; 
    private _shader: ShaderMaterial;

    get shader(){
        return this._shader
    }
   
    constructor(name: string, options:IBoneWeightsMaterialOptions, scene: Scene) {
        super(name, scene,
            {
            vertexSource:
            `precision highp float;

            attribute vec3 position;
            attribute vec2 uv;

            uniform mat4 view;
            uniform mat4 projection;
            uniform mat4 worldViewProjection;

            #include<bonesDeclaration>
            #include<instancesDeclaration>

            varying vec3 vColor;

            uniform vec3 colorBase;
            uniform vec3 colorZero;
            uniform vec3 colorQuarter;
            uniform vec3 colorHalf;
            uniform vec3 colorFull;

            uniform float targetBoneIndex;

            void main() {
                vec3 positionUpdated = position;

                #include<instancesVertex>
                #include<bonesVertex>

                vec4 worldPos = finalWorld * vec4(positionUpdated, 1.0);

                vec3 color = colorBase;
                float totalWeight = 0.;
                if(matricesIndices[0] == targetBoneIndex && matricesWeights[0] > 0.){
                    totalWeight += matricesWeights[0];
                }
                if(matricesIndices[1] == targetBoneIndex && matricesWeights[1] > 0.){
                    totalWeight += matricesWeights[1];
                }
                if(matricesIndices[2] == targetBoneIndex && matricesWeights[2] > 0.){
                    totalWeight += matricesWeights[2];
                }
                if(matricesIndices[3] == targetBoneIndex && matricesWeights[3] > 0.){
                    totalWeight += matricesWeights[3];
                }

                color = mix(color, colorZero, smoothstep(0., 0.25, totalWeight));
                color = mix(color, colorQuarter, smoothstep(0.25, 0.5, totalWeight));
                color = mix(color, colorHalf, smoothstep(0.5, 0.75, totalWeight));
                color = mix(color, colorFull, smoothstep(0.75, 1.0, totalWeight));


                gl_Position = projection * view * worldPos;
            }`,
            fragmentSource:
            `
            precision highp float;
            varying vec3 vPosition;

            varying vec3 vColor;

            void main() {
                vec4 color = vec4(vColor, 1.0);
                gl_FragColor = color;
            }
            `
        },
        {
            attributes: ['position', 'normal'],
            uniforms: [
                'world', 'worldView', 'worldViewProjection', 'view', 'projection', 'viewProjection',
                'colorBase', 'colorZero', 'colorQuarter', 'colorHalf', 'colorFull', 'targetBoneIndex'
            ]
        })
        this.skeleton = options.skeleton;
        this.colorBase = options.colorBase ?? Color3.Black();
        this.colorZero = options.colorZero ?? Color3.Blue();
        this.colorQuarter = options.colorQuarter ?? Color3.Green();
        this.colorHalf = options.colorHalf ?? Color3.Yellow();
        this.colorFull = options.colorFull ?? Color3.Red();
        this.targetBoneIndex = options.targetBoneIndex ?? 0;        

        this.setColor3('colorBase', this.colorBase);
        this.setColor3('colorZero', this.colorZero);
        this.setColor3('colorQuarter', this.colorQuarter);
        this.setColor3('colorHalf', this.colorHalf);
        this.setColor3('colorFull', this.colorFull);
        this.setFloat('targetBoneIndex', this.targetBoneIndex);
        this.transparencyMode = Material.MATERIAL_OPAQUE;
    }

    public dispose(): void {
        this.shader.dispose()
    }

    public getClassName(): string {
        return "BoneWeightsMaterial";
    }

}

_TypeStore.RegisteredTypes["BABYLON.BoneWeightsMaterial"] = BoneWeightsMaterial;