/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON { 

  export class CustomShaderHelper{
 
  }

   export interface ICustomMaterialBuilder {
         (builder:CustomShaderHelper , name: string ,mainPart: string , diffusePart:string ,vertexPositionPart:string ): string;
   } 
 
   export class CustomMaterial extends StandardMaterial  {
        
        public builder: ICustomMaterialBuilder;
        private _mainPart = 'void main(void) {';
        private _diffusePart = 'vec3 diffuseColor=vDiffuseColor.rgb;';
        private _vertexPositionPart = 'gl_Position=viewProjection*finalWorld*vec4(position,1.0);';
        
        constructor (name: string, builder:ICustomMaterialBuilder, scene: Scene) {
            super(name, scene);  
            this.builder = builder;             

            this.customShaderNameResolve = (shaderName) => {
                return this.builder(
                         new CustomShaderHelper(),
                         shaderName, 
                         this._mainPart,
                         this._diffusePart, 
                         this._vertexPositionPart ); 
            }
        }           
    }
}
     
