
CustomMaterial
==============

### CustomMaterial is a StandardMaterial with some customizable Options 
1- manage part of current shader
> CustomMaterial put some part of shader in special part of current shader and make new shader in ShaderStore 
 > shaders struct  :
 >
 >   [ Begin ]
 >
 >   . // includes  extensions  varyng uniforms attributes  special functions 
 >  
 >   [ Definations ]
 >
 >   void main(){
 >   
 >       [ Main Begin ]  
 >  
 >       .
 >       .
 >       .
 >  
 >       [  ]
 >   
 >   }  



method : SelectVersion(ver:string) 
> Custom material for now Supported just ver 3.0.0 of BabylonJs and this is default of currentVersion for now
> Add other old version in Progress %
  

method : AddUniform(name:string,kind:string,param:any):CustomMaterial 
> for append dynamic setting and manage 
> this method Add Unforn in bouth of shaders(Fragment and Vertex)
> Usage : new CustomMaterial(...).AddUniform('time','float')
>       : new CustomMaterial(...).AddUniform('direction','vec3',new BABYLON.Vector3(0.,0.,0.))
>       : new CustomMaterial(...).AddUniform('txt1','sampler2D', new BABYLON.Texture("path",scene))

method : Fragment_Begin(shaderPart:string):CustomMaterial 
> shaderPart is Shader Structure append in start of main function in fragment shader

method : Fragment_Definations(shaderPart:string):CustomMaterial
> shaderPart is Shader Structure append in befor of the main function in fragment shader
> you can define your varyng and functions from this 
> * dont try use uniform with this function





         public Fragment_MainBegin(shaderPart:string):CustomMaterial{            
            this.CustomParts.Fragment_MainBegin = shaderPart;
            return this;
         }
         public Fragment_Custom_Deffiuse(shaderPart:string):CustomMaterial{            
            this.CustomParts.Fragment_Custom_Deffiuse = shaderPart.replace("result","diffuseColor");
            return this;
         }
         public Fragment_Custom_Alpha(shaderPart:string):CustomMaterial{            
            this.CustomParts.Fragment_Custom_Alpha = shaderPart.replace("result","alpha");
            return this;
         }
         public Fragment_Before_FragColor(shaderPart:string):CustomMaterial{            
            this.CustomParts.Fragment_Before_FragColor = shaderPart.replace("result","color");
            return this;
         }
         public Vertex_Begin(shaderPart:string):CustomMaterial{            
            this.CustomParts.Vertex_Begin = shaderPart;
            return this;
         }
         public Vertex_Definations(shaderPart:string):CustomMaterial{            
            this.CustomParts.Vertex_Definations = shaderPart;
            return this;
         }
         public Vertex_MainBegin(shaderPart:string):CustomMaterial{            
            this.CustomParts.Vertex_MainBegin = shaderPart;
            return this;
         }
         public Vertex_Befor_PositionUpdated(shaderPart:string):CustomMaterial{            
            this.CustomParts.Vertex_Befor_PositionUpdated = shaderPart.replace("result","positionUpdated");
            return this;
         } 
         
          public Vertex_Befor_NormalUpdated(shaderPart:string):CustomMaterial{            
            this.CustomParts.Vertex_Befor_NormalUpdated = shaderPart.replace("result","normalUpdated");
            return this;
         } 
