
The BabylonJS Managed Scene Component API uses a component object model to create and manage a scene component's life-cycle.

Scene Manager Static Helpers:

1... BABYLON.SceneManager.CreateScene       - Creates a new scene and attaches a manager object.
2... BABYLON.SceneManager.LoadScene         - Calls BABYLON.SceneLoader.Load and parses the scene metadata (attaches a manager object to loaded scene)
3... BABYLON.SceneManager.ImportMesh        - Call BABYLON.SceneLoader.ImportMesh and parses mesh metadata (a manager object is already attached)
4... BABYLON.SceneManager.RegisterLoader    - Registers the page level scene loader (allows for re-loading scenes using 'loadLevel')
5... BABYLON.SceneManager.GetInstance       - Get the currently attached manager object on the scene

All scene level functionallity is exposed via the BABYLON.SceneManager and BABYLON.SceneComponent instances.

To Create A Scene Controller At Runtime: manager.createSceneController("PROJECT.NewSceneController");

To Add A Scene Component At Runtime: manager.addSceneComponent(mesh | light | camera, "PROJECT.NewMeshComponent");

===============================
Example Scene Controller Class:
===============================

module PROJECT {
    export class NewSceneController extends BABYLON.SceneController {

        public ready() :void {
            // Scene execute when ready
            this.scene.activeCamera.attachControl(this.engine.getRenderingCanvas());
        }

        public start() :void {
            // Start component function
        }

        public update() :void {
            // Update render loop function
        }

        public after() :void {
            // After render loop function
        }

        public destroy() :void {
            // Destroy component function
        }
    }
}

=============================
Example Mesh Component Class:
=============================

module PROJECT {
    export class NewMeshComponent extends BABYLON.MeshComponent {

        public start() :void {
            // Start component function
        }

        public update() :void {
            // Update render loop function
        }

        public after() :void {
            // After render loop function
        }

        public destroy() :void {
            // Destroy component function
        }
    }
}

=============================
Example Ligh Component Class:
=============================

module PROJECT {
    export class NewLightComponent extends BABYLON.LightComponent {

        public start() :void {
            // Start component function
        }

        public update() :void {
            // Update render loop function
        }

        public after() :void {
            // After render loop function
        }

        public destroy() :void {
            // Destroy component function
        }
    }
}

===============================
Example Camera Component Class:
===============================

module PROJECT {
    export class NewCameraComponent extends BABYLON.CameraComponent {

        public start() :void {
            // Start component function
        }

        public update() :void {
            // Update render loop function
        }

        public after() :void {
            // After render loop function
        }

        public destroy() :void {
            // Destroy component function
        }
    }
}

==================================
Build Babylon.manager.js with Gulp
==================================

Build Babylon.manager.js with [gulp](http://gulpjs.com/ "gulp") and npm ([nodejs](http://nodejs.org/ "nodejs")), easy and cross-platform

(Paths in this file are relative to this file location.)

# How to use it

From the /Tools/Gulp folder:

### First install gulp :
```
npm install -g gulp
```

### Install some dependencies :
```
npm install
```

### Update dependencies if necessary :
```
npm update
```

## From the javascript source
### Build Babylon.manager.js:

```
gulp SceneManager
```
Will be generated in dist/preview release/scenemanager:
- babylon.manager.min.js
- babylon.manager.js (unminified)
- babylon.manager.d.ts

### Build the changed files for debug when you save a typescript or shader file:
```
gulp watch
```

### Watch and run a web server for debug purpose:
```
gulp run
```

