import { Nullable } from '../types';
import { Skeleton, Bone } from '../Bones';
import { AbstractMesh } from '../Meshes';
import { DynamicTexture } from '../Materials';
import { Scene } from '../scene';
import { Color3 } from '../Maths';


interface IBoneWeightOptions{
    name: Nullable<string>
    skeleton: Skeleton
    mesh: AbstractMesh    
    renderingMode: number

    //0-1 number, then a color3 in duplet for Selected node weights
    selectedColorKnots : (number|Color3)[]
    //0-1 number, then a color3 in duplet for skeleton color map
    mapColorKnots : (number|Color3)[]
}

/*interface IBoneWeightShaderGradientCache{
    selectedWeight: Nullable<number[]>|DynamicTexture
    colorMap: Nullable<number[]>|DynamicTexture
}*/

export class BoneWeightShader{    
    public name?: Nullable<string>    
    public skeleton: Skeleton
    public mesh: AbstractMesh
    private _scene: Scene  
    //private _renderingMode: number
    //private _gradientCache: Nullable<number[]> 

    constructor(
        public options: Partial<IBoneWeightOptions> = {}
    ){

        this.options.renderingMode = options.renderingMode || BoneWeightShader.MODE_SELECTED_WEIGHT 
        this.options.selectedColorKnots = options.selectedColorKnots || [0.25, Color3.Blue(), 0.5, Color3.Green(), 0.75, Color3.Yellow(), 1, Color3.Red()],
        this.options.mapColorKnots = options.mapColorKnots || [0.25, Color3.Purple(), 0.5, (Color3.Red().add(Color3.Yellow())).scale(0.5), 0.75, Color3.Green(), 1, Color3.Teal()] 

        this._scene = this.skeleton.getScene()
        //this._renderingMode = this.options.renderingMode      
    }

    _prep(){
        let dt = new DynamicTexture('temp-boi', {width:this.bones.length, height:1}, this.scene, false)
        let ctx = dt.getContext() 
        let grad = ctx.createLinearGradient(0, 0, this.bones.length, 0)
        
        let colorKnots = this.options.mapColorKnots       
        if(colorKnots){
            grad.addColorStop(0, (colorKnots[1] as Color3).toHexString())
            for(let i = 0; i < this.bones.length; i+=2){
                let pos = (colorKnots[i] as number)
                let col = (colorKnots[i+1] as Color3).toHexString()
                grad.addColorStop(pos, col)
            }
        }
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, this.bones.length, 0)
        dt.update()    
    }

    build(){
        //let vxString: string;
        //let fxString: string;      
    }

    get scene():Scene{
        return this._scene
    }
    get bones():Bone[]{
        return this.skeleton.bones
    }

    public static readonly MODE_SELECTED_WEIGHT = 0
    public static readonly MODE_SKELETON_COLOR_MAP = 1
}

