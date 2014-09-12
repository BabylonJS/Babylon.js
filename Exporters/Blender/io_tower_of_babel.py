bl_info = {
    'name': 'Tower of Babel',
    'author': 'David Catuhe, Jeff Palmer',
    'version': (1, 0, 0),
    'blender': (2, 69, 0),
    'location': 'File > Export > Tower of Babel [.babylon + .js + .ts + .html(s)]',
    'description': 'Produce Babylon scene file (.babylon), Translate to inline JavaScript & TypeScript',
    'warning': "Holy crap batman!  You've been warned!",
    'wiki_url': 'https://github.com/BabylonJS/Babylon.js/wiki/13-Blender',
    'tracker_url': '',
    'category': 'Import-Export'}
    
import bpy
import bpy_extras.io_utils
import gpu # for experimental use in Materials constructor:   shader = gpu.export_shader(scene, material), (currently commented out)
import math
import mathutils
import os
import shutil
import sys, traceback # for writing errors to log file
#===============================================================================
# Registration the calling of the INFO_MT_file_export file selector
def menu_func(self, context):
    self.layout.operator(TowerOfBabel.bl_idname, text = 'Tower of Babel [.babylon + .js + .ts + .html(s)]')

# store keymaps here to access after registration (commented out for now)
#addon_keymaps = []

def register():
    bpy.utils.register_module(__name__)
    bpy.types.INFO_MT_file_export.append(menu_func)
    
    # create the hotkey
#    kc = bpy.context.window_manager.keyconfigs.addon
#    km = kc.keymaps.new(name='3D View', space_type='VIEW_3D')
#    kmi = km.keymap_items.new('wm.call_menu', 'W', 'PRESS', alt=True)
#    kmi.properties.name = TowerOfBabel.bl_idname
#    kmi.active = True
#    addon_keymaps.append((km, kmi))
    
def unregister():
    bpy.utils.unregister_module(__name__)
    bpy.types.INFO_MT_file_export.remove(menu_func)
    
#    for km, kmi in addon_keymaps:
#        km.keymap_items.remove(kmi)
#    addon_keymaps.clear()
    
if __name__ == '__main__':
    register()
#===============================================================================
# output related constants
MAX_VERTEX_ELEMENTS = 65535
VERTEX_OUTPUT_PER_LINE = 1000
MAX_FLOAT_PRECISION = '%.4f'
MAX_INFLUENCERS_PER_VERTEX = 4
INTERNAL_NS_VAR = 'internal'
MATERIALS_PATH_VAR = 'materialsRootDir'

# used in World constructor, defined in BABYLON.Scene
#FOGMODE_NONE = 0
#FOGMODE_EXP = 1
#FOGMODE_EXP2 = 2
FOGMODE_LINEAR = 3

# used in Mesh & Node constructors, defined in BABYLON.AbstractMesh
BILLBOARDMODE_NONE = 0
#BILLBOARDMODE_X = 1
#BILLBOARDMODE_Y = 2
#BILLBOARDMODE_Z = 4
BILLBOARDMODE_ALL = 7

# used in Mesh constructor, defined in BABYLON.PhysicsEngine
SPHERE_IMPOSTER = 1
BOX_IMPOSTER = 2
#PLANE_IMPOSTER = 3
MESH_IMPOSTER = 4
CAPSULE_IMPOSTER = 5
CONE_IMPOSTER = 6
CYLINDER_IMPOSTER = 7
CONVEX_HULL_IMPOSTER = 8

# used in Light constructor never formally defined in Babylon, but used in babylonFileLoader
POINT_LIGHT = 0
DIRECTIONAL_LIGHT = 1
SPOT_LIGHT = 2
HEMI_LIGHT = 3

# used in Texture constructor, defined in BABYLON.Texture
CLAMP_ADDRESSMODE = 0
WRAP_ADDRESSMODE = 1
MIRROR_ADDRESSMODE = 2

# used in Texture constructor, defined in BABYLON.Texture
EXPLICIT_MODE = 0
SPHERICAL_MODE = 1
#PLANAR_MODE = 2
CUBIC_MODE = 3
#PROJECTION_MODE = 4
#SKYBOX_MODE = 5

# passed to Animation constructor from animatable objects, defined in BABYLON.Animation
#ANIMATIONTYPE_FLOAT = 0
ANIMATIONTYPE_VECTOR3 = 1
#ANIMATIONTYPE_QUATERNION = 2
ANIMATIONTYPE_MATRIX = 3
#ANIMATIONTYPE_COLOR3 = 4

# passed to Animation constructor from animatable objects, defined in BABYLON.Animation
#ANIMATIONLOOPMODE_RELATIVE = 0
ANIMATIONLOOPMODE_CYCLE = 1
#ANIMATIONLOOPMODE_CONSTANT = 2
#===============================================================================
class TowerOfBabel(bpy.types.Operator, bpy_extras.io_utils.ExportHelper):  
    bl_idname = 'unknown.use'          # module will not load with out it, also must have a dot
    bl_label = 'TOB Export'            # used on the label of the actual 'save' button
    filename_ext = '.js'               # required to have one, although not really used

    filepath = bpy.props.StringProperty(subtype = 'FILE_PATH') # assigned once the file selector returns
    log_handler = None  # assigned in execute
    nameSpace   = None  # assigned in execute
    versionCheckCode = 'if (typeof(BABYLON.Engine.Version) === "undefined" || Number(BABYLON.Engine.Version.substr(0, 4)) < 1.14) throw "Babylon version too old";\n'
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    export_onlyCurrentLayer = bpy.props.BoolProperty(
        name="Export only current layer",
        description="Export only current layer",
        default = False,
        )
    
    export_javaScript = bpy.props.BoolProperty(
        name="Export Javascript (.js) File",
        description="Produce an inline JavaScript (xxx.js) File",
        default = True,
        )
    
    export_typeScript = bpy.props.BoolProperty(
        name="Export Typescript (.ts) File",
        description="Produce an inline TypeScript (xxx.ts) File",
        default = True,
        )
    
    export_json = bpy.props.BoolProperty(
        name="Export JSON (.babylon) File",
        description="Produce a JSON (xxx.babylon) File",
        default = True,
        )
    
    export_html = bpy.props.BoolProperty(
        name="Export applicable .html File(s)",
        description="Produce a xxx_JSON.html and/or xxx_inline.html as required by other selections",
        default = True,
        )
    
    def draw(self, context):
        layout = self.layout

        layout.prop(self, 'export_onlyCurrentLayer') 
        layout.prop(self, "export_javaScript")
        layout.prop(self, "export_typeScript")
        layout.prop(self, "export_json")
        layout.prop(self, "export_html")
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
    nWarnings = 0      
    @staticmethod
    def warn(msg, numTabIndent = 1, noNewLine = False):
        TowerOfBabel.log(msg, numTabIndent, noNewLine)
        TowerOfBabel.nWarnings += 1
                  
    @staticmethod
    def log(msg, numTabIndent = 1, noNewLine = False):
        for i in range(numTabIndent):
            TowerOfBabel.log_handler.write('\t')
            
        TowerOfBabel.log_handler.write(msg)
        if not noNewLine: TowerOfBabel.log_handler.write('\n')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    @staticmethod
    def define_static_method(name, is_typescript, loadCheckVar = '', optionalArg = '', optionalTsType = '', optionalDefault = '""'):
        if is_typescript:
            ret = '\n    export function ' + name + '(scene : BABYLON.Scene';
            if len(optionalArg) > 0 : ret += ', ' + optionalArg + ' : ' + optionalTsType + " = " + optionalDefault
            ret += ') : void {\n';
        else:
            ret = '\n    ' + INTERNAL_NS_VAR + '.' + name + ' = function(scene';
            if len(optionalArg) > 0 : ret += ', ' + optionalArg + " = " + optionalDefault
            ret += '){\n';
            
        ret += '        ' + TowerOfBabel.versionCheckCode
        if len(loadCheckVar) > 0 : ret += '        if (' + loadCheckVar + ') return;\n'
        return ret + "        console.log('In " + name + "');\n"
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
    materials = []               
    @staticmethod
    def uvRequiredForMaterial(baseMaterialId):
        fullName = TowerOfBabel.nameSpace + '.' + baseMaterialId
        for material in TowerOfBabel.materials:
            if material.name == fullName and len(material.textures) > 0:
                return True
        return False
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def execute(self, context):
        try:
            filepathDotExtension = self.filepath.rpartition('.')
            self.filepathMinusExtension = filepathDotExtension[0]
            
            # assign nameSpace, based on OS
            if self.filepathMinusExtension.find('\\') != -1:
                TowerOfBabel.nameSpace = legal_js_identifier(self.filepathMinusExtension.rpartition('\\')[2])
            else:
                TowerOfBabel.nameSpace = legal_js_identifier(self.filepathMinusExtension.rpartition('/')[2])

            TowerOfBabel.log_handler = open(self.filepathMinusExtension + '.log', 'w')
            TOB_version = bl_info['version']
            TowerOfBabel.log('Tower of Babel version: ' + str(TOB_version[0]) + '.' + str(TOB_version[1]) +  '.' + str(TOB_version[2]) + 
                             ', Blender version: ' + bpy.app.version_string)

            if bpy.ops.object.mode_set.poll():
                bpy.ops.object.mode_set(mode = 'OBJECT')      

            scene = context.scene   
            TowerOfBabel.log('========= Conversion from Blender to Babylon friendly Python objects =========', 0)
            self.world = World(scene)

            bpy.ops.screen.animation_cancel()
            currentFrame = bpy.context.scene.frame_current
            bpy.context.scene.frame_set(0)

            # Active camera
            if scene.camera != None:
                self.activeCamera = scene.camera.name
            else:
                TowerOfBabel.warn('WARNING: No active camera has been assigned, or is not in a currently selected Blender layer')

            # Materials, static for ease of uvs requirement testing
            stuffs = [mat for mat in bpy.data.materials if mat.users >= 1]
            for material in stuffs:
                TowerOfBabel.materials.append(Material(material, scene, self.filepath)) # need file path incase an image texture

            self.cameras = []
            self.lights = []
            self.shadowGenerators = []
            self.skeletons = []
            skeletonId = 0
            self.meshesAndNodes = []
            self.multiMaterials = []
            for object in [object for object in scene.objects]:
                if object.type == 'CAMERA':
                    if object.is_visible(scene): # no isInSelectedLayer() required, is_visible() handles this for them
                        self.cameras.append(Camera(object))
                    else:
                        TowerOfBabel.warn('WARNING: The following camera not visible in scene thus ignored: ' + object.name)

                elif object.type == 'LAMP':
                    if object.is_visible(scene): # no isInSelectedLayer() required, is_visible() handles this for them
                        bulb = Light(object)
                        self.lights.append(bulb)
                        if object.data.shadowMap != 'NONE':
                            if bulb.light_type == DIRECTIONAL_LIGHT:
                                self.shadowGenerators.append(ShadowGenerator(object, scene))
                            else:
                                TowerOfBabel.warn('WARNING: Only directional (sun) type of lamp is invalid for shadows thus ignored: ' + object.name)                                
                    else:
                        TowerOfBabel.warn('WARNING: The following lamp not visible in scene thus ignored: ' + object.name)

                elif object.type == 'ARMATURE':  #skeleton.pose.bones
                    if object.is_visible(scene):
                        self.skeletons.append(Skeleton(object, scene, skeletonId))
                        skeletonId += 1
                    else:
                        TowerOfBabel.warn('WARNING: The following armature not visible in scene thus ignored: ' + object.name)

                elif object.type == 'MESH':
                    forcedParent = None
                    nameID = ''
                    nextStartFace = 0

                    while True and self.isInSelectedLayer(object, scene):
                        mesh = Mesh(object, scene, self.multiMaterials, nextStartFace, forcedParent, nameID)
                        self.meshesAndNodes.append(mesh)
                        nextStartFace = mesh.offsetFace
                        if nextStartFace == 0:
                            break

                        if forcedParent is None:
                            nameID = 0
                            forcedParent = object
                            TowerOfBabel.warn('WARNING: The following mesh has exceeded the maximum # of vertex elements & will be broken into multiple Babylon meshes: ' + object.name)

                        nameID = nameID + 1
                elif object.type == 'EMPTY':
                    self.meshesAndNodes.append(Node(object))
                    
                else:
                    TowerOfBabel.warn('WARNING: The following object is not currently exportable thus ignored: ' + object.name)

            bpy.context.scene.frame_set(currentFrame)

            # 3 passes of output files
            if (self.export_json      ): self.to_scene_file   ()
            if (self.export_typeScript): self.core_script_file(True)
            if (self.export_javaScript): self.core_script_file(False)
            if (self.export_html):
                TowerOfBabel.log('========= Writing of html files started =========', 0)
                if (self.export_javaScript): self.writeHtmls(True)
                if (self.export_json      ): TowerOfBabel.writeHtmls(self, False)
                TowerOfBabel.log('========= Writing of html files completed =========', 0)
            
        except:# catch *all* exceptions
            ex = sys.exc_info()
            TowerOfBabel.log('========= An error was encountered =========', 0)
            stack = traceback.format_tb(ex[2])
            for line in stack:
               TowerOfBabel.log_handler.write(line) # avoid tabs & extra newlines by not calling log() inside catch
               
            TowerOfBabel.log_handler.write('ERROR:  ' + str(ex[1]) + '\n')
            raise
        
        finally:
            TowerOfBabel.log('========= end of processing =========', 0)
            TowerOfBabel.log_handler.close()
            
            if (TowerOfBabel.nWarnings > 0):
                self.report({'WARNING'}, 'Processing completed, but ' + str(TowerOfBabel.nWarnings) + ' WARNINGS were raised,  see log file.')
        
        return {'FINISHED'}
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def to_scene_file(self):
        TowerOfBabel.log('========= Writing of scene file started =========', 0)
        # Open file
        file_handler = open(self.filepathMinusExtension + '.babylon', 'w')  
        file_handler.write('{')
        self.world.to_scene_file(file_handler)
        
        # Materials
        file_handler.write(',\n"materials":[')
        first = True
        for material in TowerOfBabel.materials:
            if first != True:
                file_handler.write(',')

            first = False
            material.to_scene_file(file_handler)
        file_handler.write(']')
        
        # Multi-materials
        file_handler.write(',\n"multiMaterials":[')
        first = True
        for multimaterial in self.multiMaterials:
            if first != True:
                file_handler.write(',')

            first = False
            multimaterial.to_scene_file(file_handler)
        file_handler.write(']')
                
        # Armatures/Bones
        file_handler.write(',\n"skeletons":[')
        first = True
        for skeleton in self.skeletons:
            if first != True:
                file_handler.write(',')

            first = False
            skeleton.to_scene_file(file_handler)
        file_handler.write(']')     

        # Meshes
        file_handler.write(',\n"meshes":[')
        first = True
        for mesh in reversed(self.meshesAndNodes): # reversed for shared vertex instances
            if first != True:
                file_handler.write(',')

            first = False
            mesh.to_scene_file(file_handler, self.meshesAndNodes)
        file_handler.write(']')
        
        # Cameras
        file_handler.write(',\n"cameras":[')
        first = True
        for camera in self.cameras:
            if first != True:
                file_handler.write(',')

            first = False
            camera.to_scene_file(file_handler)
        file_handler.write(']')
                        
        # Active camera
        if hasattr(self, 'activeCamera'):
            write_string(file_handler, 'activeCamera', self.activeCamera)
            
        # Lights
        file_handler.write(',\n"lights":[')
        first = True
        for light in self.lights:
            if first != True:
                file_handler.write(',')

            first = False
            light.to_scene_file(file_handler)
        file_handler.write(']')
        
        # Shadow generators
        file_handler.write(',\n"shadowGenerators":[')
        first = True
        for shadowGen in self.shadowGenerators:
            if first != True:
                file_handler.write(',')

            first = False
            shadowGen.to_scene_file(file_handler)
        file_handler.write(']')
        
        # Closing
        file_handler.write('}')
        file_handler.close()        
        TowerOfBabel.log('========= Writing of scene file completed =========', 0)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def core_script_file(self, is_typescript): 
        indent1 = '    '
        indent2 = '        '
        ns      = ''           if is_typescript else INTERNAL_NS_VAR + '.' 
        close   = '}\n'        if is_typescript else '};\n' 
        name    = 'typescript' if is_typescript else 'javascript'
        ext     = '.ts'        if is_typescript else '.js'
        
        TowerOfBabel.log('========= Writing of ' + name + ' file started =========', 0)
        file_handler = open(self.filepathMinusExtension + ext, 'w') 
        
         # World - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        if is_typescript:
            self.world.to_typescript(file_handler, self.meshesAndNodes)
        else:
            self.world.to_javascript(file_handler, self.meshesAndNodes)   
            
        # Materials - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        file_handler.write('\n' + indent1 + 'var matLoaded = false;')
        file_handler.write(TowerOfBabel.define_static_method('defineMaterials', is_typescript, 'matLoaded', MATERIALS_PATH_VAR, 'string', '"./"'))
        file_handler.write(indent2 + 'if (' + MATERIALS_PATH_VAR + '.lastIndexOf("/") + 1  !== ' + MATERIALS_PATH_VAR + '.length) { ' + MATERIALS_PATH_VAR + '  += "/"; }\n')

        file_handler.write(indent2 + 'var material' + (' : BABYLON.StandardMaterial;\n' if is_typescript else ';\n') )          
        file_handler.write(indent2 + 'var texture'  + (' : BABYLON.Texture;\n'          if is_typescript else ';\n') )           
        for material in TowerOfBabel.materials:
            material.core_script(file_handler, indent2)
        file_handler.write(indent2 + ns + 'defineMultiMaterials(scene);\n')
        file_handler.write(indent2 + 'matLoaded = true;\n')
        file_handler.write(indent1 + close)
        
        # Multi-materials - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        file_handler.write(TowerOfBabel.define_static_method('defineMultiMaterials', is_typescript))
        file_handler.write(indent2 + 'var multiMaterial' + (' : BABYLON.MultiMaterial;\n' if is_typescript else ';\n') )           
        for multimaterial in self.multiMaterials: 
            multimaterial.core_script(file_handler, indent2)
        file_handler.write(indent1 + close)

        # Armatures/Bones - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        file_handler.write('\n' + indent1 + 'var bonesLoaded = false;')
        file_handler.write(TowerOfBabel.define_static_method('defineSkeletons', is_typescript, 'bonesLoaded'))
        file_handler.write(indent2 + 'var skeleton'  + (' : BABYLON.Skeleton;\n'  if is_typescript else ';\n') )          
        file_handler.write(indent2 + 'var bone'      + (' : BABYLON.Bone;\n'      if is_typescript else ';\n') )           
        file_handler.write(indent2 + 'var animation' + (' : BABYLON.Animation;\n' if is_typescript else ';\n') )          
        for skeleton in self.skeletons:
            skeleton.core_script(file_handler, indent2)
        file_handler.write(indent2 + 'bonesLoaded = true;\n')
        file_handler.write(indent1 + close)

        # Meshes and Nodes - - - - - - - - - - - - - - - - - - - - - - - - - - -
        for mesh in self.meshesAndNodes:
            mesh.core_script(file_handler, self.get_kids(mesh), indent1, is_typescript)
        
        # Cameras - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
        file_handler.write(TowerOfBabel.define_static_method('defineCameras', is_typescript))
        file_handler.write(indent2 + 'var camera;\n') # intensionally vague, since sub-classes instances & different specifc propeties set           
        for camera in self.cameras:
            camera.core_script(file_handler, indent2, is_typescript)
            
        if hasattr(self, 'activeCamera'):
            file_handler.write(indent2 + 'scene.setActiveCameraByID("' + self.activeCamera + '");\n')
        file_handler.write(indent1 + close)
        
        # Lights - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        file_handler.write(TowerOfBabel.define_static_method('defineLights', is_typescript))
        file_handler.write(indent2 + 'var light;\n') # intensionally vague, since sub-classes instances & different specifc propeties set          
        for light in self.lights:
            light.core_script(file_handler, indent2, is_typescript)
        file_handler.write(indent1 + close)
                                    
        # Shadow generators - - - - - - - - - - - - - - - - - - - - - - - - - - -
        file_handler.write(TowerOfBabel.define_static_method('defineShadowGen', is_typescript))
        file_handler.write(indent2 + 'var light;\n') # intensionally vague, since scene.getLightByID() returns Light, not DirectionalLight          
        file_handler.write(indent2 + 'var shadowGenerator' + (' : BABYLON.ShadowGenerator;\n' if is_typescript else ';\n') )           
        file_handler.write(indent2 + 'var renderList'      + (' : Array<BABYLON.AbstractMesh>;\n'     if is_typescript else ';\n') )           
        for shadowGen in self.shadowGenerators:
            shadowGen.core_script(file_handler, indent2)
        file_handler.write(indent1 + close)

        # Module closing - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        if is_typescript:
            file_handler.write('\n}')
        else:
            file_handler.write('    return ' + INTERNAL_NS_VAR + ';\n')
            file_handler.write('\n}());')
            
        file_handler.close()        
        TowerOfBabel.log('========= Writing of ' + name + ' file completed =========', 0)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
    def writeHtmls(self, is_javascript): 
        header =  '<head>\n'
        header += '    <meta charset="UTF-8">\n'
        header += '    <title>' + TowerOfBabel.nameSpace + '</title>\n' 
        header += '    <!-- edit path - name of babylon library as required -->\n' 
        header += '    <script src="./babylon.js"></script>\n' 
        if is_javascript: 
            header += '    <script src="./' + TowerOfBabel.nameSpace + '.js"></script>\n' 
        header += '    <style>\n' 
        header += '         html, body   { width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; } \n' 
        header += '         #renderCanvas{ width: 100%; height: 100%; } \n' 
        header += '    </style>\n' 
        header += '</head>\n'
        
        body   =  '<body>\n<canvas id="renderCanvas"></canvas>\n'
        
        scriptStart =  '<script>\n'
        scriptStart += '    if (BABYLON.Engine.isSupported()) {\n'
        scriptStart += '        var canvas = document.getElementById("renderCanvas");\n'
        scriptStart += '        var engine = new BABYLON.Engine(canvas, true);\n'
        scriptStart += '        console.log("Babylon version:  " + BABYLON.Engine.Version);\n\n'

        JSON        =  '        var url = "."; // edit when .babylon / texture files in a different dir than html\n'
        JSON        += '        BABYLON.SceneLoader.Load(url, "' + TowerOfBabel.nameSpace + '.babylon", engine, \n'
        JSON        += '            function (newScene) {\n'
        JSON        += '                newScene.executeWhenReady(function () {\n'
        JSON        += '                    // Attach camera to canvas inputs\n'
        JSON        += '                    newScene.activeCamera.attachControl(canvas);\n\n'
                                        
        JSON        += '                    // Once the scene is loaded, register a render loop\n'
        JSON        +=  '                   engine.runRenderLoop(function () {\n'
        JSON        += '                        newScene.render();\n'
        JSON        += '                    });\n'
        JSON        += '                });\n'
        JSON        += '            },\n'
        JSON        += '            function (progress) {\n'
        JSON        += '                // To do: give progress feedback to user\n'
        JSON        += '            }\n'
        JSON        += '        );\n'
        
        inline      =  '        var scene = new BABYLON.Scene(engine);\n'
        inline      += '        materialsRootDir = "."; // edit when texture files in a different dir than html\n'
        inline      += '        ' + TowerOfBabel.nameSpace + '.initScene(scene, materialsRootDir);\n'
        inline      += '        scene.activeCamera.attachControl(canvas);\n'
        inline      += '        engine.runRenderLoop(function () {\n'
        inline      += '            scene.render();\n'
        inline      += '        });\n'
        
        noWebGL     =  '    }else{\n'
        noWebGL     += '        alert("WebGL not supported in this browser.\\n\\n" + \n'
        noWebGL     += '              "If in Safari browser, check \'Show Develop menu in menu bar\' on the Advanced tab of Preferences.  " +\n'
        noWebGL     += '              "On the \'Develop\' menu, check the \'Enable WebGL\' menu item.");\n'
        noWebGL     += '    }\n\n'

        scriptEnd   =  '    //Resize\n'
        scriptEnd   += '    window.addEventListener("resize", function () {\n'
        scriptEnd   += '        engine.resize();\n'
        scriptEnd   += '    });\n'
        scriptEnd   += '</script>\n'
        
        filename =  self.filepathMinusExtension;
        filename += '_inline.html' if is_javascript else '_JSON.html'
        file_handler = open(filename, 'w') 
        file_handler.write('<html>\n')
        file_handler.write(header)
        file_handler.write(body)
        file_handler.write(scriptStart)
        if is_javascript:
            file_handler.write(inline)
        else:
            file_handler.write(JSON)
        file_handler.write(noWebGL)
        file_handler.write(scriptEnd)
        file_handler.write('</body>\n</html>')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def isInSelectedLayer(self, obj, scene):
        return not self.export_onlyCurrentLayer or obj.layers[scene.active_layer]
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  
    # not relying on python parentObj.children, since would not account for forced parents (those meshes with > MAX_VERTEX_ELEMENTS)
    def get_kids(self, prospectiveParent):
        kids = []
        for mesh in self.meshesAndNodes:
            if hasattr(mesh, 'parentId') and mesh.parentId == prospectiveParent.name:
                kids.append(mesh)
        return kids
#===============================================================================
class World:
    def __init__(self, scene):
        self.autoClear = True
        world = scene.world
        if world:
            self.world_ambient = world.ambient_color
        else:
            self.world_ambient = mathutils.Color((0.2, 0.2, 0.3))

        self.gravity = scene.gravity
        
        if world and world.mist_settings.use_mist:
            self.fogMode = FOGMODE_LINEAR
            self.fogColor = world.horizon_color
            self.fogStart = world.mist_settings.start
            self.fogEnd = world.mist_settings.depth
            self.fogDensity = 0.1
    
        TowerOfBabel.log('Python World class constructor completed')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def to_scene_file(self, file_handler): 
        write_bool(file_handler, 'autoClear', self.autoClear, True)
        write_color(file_handler, 'clearColor', self.world_ambient)
        write_color(file_handler, 'ambientColor', self.world_ambient)
        write_vector(file_handler, 'gravity', self.gravity)
        
        if hasattr(self, 'fogMode'):
            write_int(file_handler, 'fogMode', self.fogMode)
            write_color(file_handler, 'fogColor', self.fogColor)
            write_float(file_handler, 'fogStart', self.fogStart)
            write_float(file_handler, 'fogEnd', self.fogEnd)
            write_float(file_handler, 'fogDensity', self.fogDensity)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def to_javascript(self, file_handler, meshes): 
        file_handler.write('"use strict";\n')
        file_handler.write('var __extends = this.__extends || function (d, b) {\n')
        file_handler.write('    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];\n')
        file_handler.write('    function __() { this.constructor = d; }\n')
        file_handler.write('    __.prototype = b.prototype;\n')
        file_handler.write('    d.prototype = new __();\n')
        file_handler.write('};\n')
        file_handler.write('var '+ TowerOfBabel.nameSpace + ' = (function(){\n')
        file_handler.write('    var ' + INTERNAL_NS_VAR + ' = {};\n')
        file_handler.write('    ' + INTERNAL_NS_VAR + '.initScene = function(scene, ' + MATERIALS_PATH_VAR + ' = "./"){\n')
        self.core_script(file_handler, meshes, '        ', False)
        file_handler.write('    };\n')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -        
    def to_typescript(self, file_handler, meshes): 
        file_handler.write('module ' + TowerOfBabel.nameSpace + '{\n\n')
        file_handler.write('    export function initScene(scene : BABYLON.Scene, ' + MATERIALS_PATH_VAR + ' : string = "./") : void {\n')
        self.core_script(file_handler, meshes, '        ', True)
        file_handler.write('    }\n')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -        
    def core_script(self, file_handler, meshes, indent, is_typescript): 
        ns = '' if is_typescript else INTERNAL_NS_VAR + '.' 
        file_handler.write(indent + TowerOfBabel.versionCheckCode)
        file_handler.write(indent + 'scene.autoClear = ' + format_bool(self.autoClear) + ';\n')
        file_handler.write(indent + 'scene.clearColor    = new BABYLON.Color3(' + format_color(self.world_ambient) + ');\n')
        file_handler.write(indent + 'scene.ambientColor  = new BABYLON.Color3(' + format_color(self.world_ambient) + ');\n')
        file_handler.write(indent + 'scene.gravity = new BABYLON.Vector3(' + format_vector(self.gravity) + ');\n')

        if hasattr(self, 'fogMode'):
            file_handler.write(indent + 'scene.fogMode = ' + self.fogMode + ';\n')
            file_handler.write(indent + 'scene.fogColor = new BABYLON.Color3(' + format_color(self.fogColor) + ');\n')
            file_handler.write(indent + 'scene.fogStart = ' + self.fogStart + ';\n')
            file_handler.write(indent + 'scene.fogEnd = ' + self.fogEnd + ';\n')
            file_handler.write(indent + 'scene.fogDensity = ' + self.fogDensity + ';\n')
            
        file_handler.write('\n' + indent + '// define materials & skeletons before meshes\n')
        file_handler.write(indent + ns + 'defineMaterials(scene, ' + MATERIALS_PATH_VAR + ');\n')
        file_handler.write(indent + ns + 'defineSkeletons(scene);\n')
    
        file_handler.write('\n' + indent + '// instance all root meshes\n')
        for mesh in meshes:
            if not hasattr(mesh, 'parentId'):
                properName = legal_js_identifier(mesh.name)
                file_handler.write(indent + 'new ' + ns + properName + '("' + mesh.name + '", scene);\n')
        
        file_handler.write('\n' + indent + '// define cameras after meshes, incase LockedTarget is in use\n')
        file_handler.write(indent + ns + 'defineCameras  (scene);\n')
        
        file_handler.write('\n' + indent + '// cannot call Shadow Gen prior to all lights & meshes being instanced\n')
        file_handler.write(indent + ns + 'defineLights   (scene);\n')
        file_handler.write(indent + ns + 'defineShadowGen(scene);\n') 
#===============================================================================
class FCurveAnimatable:
    def __init__(self, object, supportsRotation, supportsPosition, supportsScaling, xOffsetForRotation = 0):  
        
        # just because a sub-class can be animatable does not mean it is
        self.animationsPresent = object.animation_data and object.animation_data.action
        
        rotAnim = False
        locAnim = False
        scaAnim = False
        
        if (self.animationsPresent):
            TowerOfBabel.log('FCurve animation processing begun for:  ' + object.name, 1)
            self.animations = []
            for fcurve in object.animation_data.action.fcurves:
                if supportsRotation and fcurve.data_path == 'rotation_euler' and rotAnim == False:
                    self.animations.append(VectorAnimation(object, 'rotation_euler', 'rotation', -1, xOffsetForRotation))
                    rotAnim = True
                elif supportsPosition and fcurve.data_path == 'location' and locAnim == False:
                    self.animations.append(VectorAnimation(object, 'location', 'position', 1))
                    locAnim = True
                elif supportsScaling and fcurve.data_path == 'scale' and scaAnim == False:
                    self.animations.append(VectorAnimation(object, 'scale', 'scaling', 1))
                    scaAnim = True
            #Set Animations
            self.autoAnimate = True
            self.autoAnimateFrom = bpy.context.scene.frame_end
            self.autoAnimateTo =  0
            for animation in self.animations:
                if self.autoAnimateFrom > animation.get_first_frame():
                    self.autoAnimateFrom = animation.get_first_frame()
                if self.autoAnimateTo < animation.get_last_frame():
                    self.autoAnimateTo = animation.get_last_frame()
            self.autoAnimateLoop = True
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def to_scene_file(self, file_handler):     
        if (self.animationsPresent):
            file_handler.write('\n,"animations":[')
            first = True
            for animation in self.animations:
                if first == False:
                    file_handler.write(',')
                animation.to_scene_file(file_handler)
                first = False
            file_handler.write(']')
            
            write_bool(file_handler, 'autoAnimate', self.autoAnimate)
            write_int(file_handler, 'autoAnimateFrom', self.autoAnimateFrom)
            write_int(file_handler, 'autoAnimateTo', self.autoAnimateTo)
            write_bool(file_handler, 'autoAnimateLoop', self.autoAnimateLoop)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -        
    def core_script(self, file_handler, jsVarName, indent, is_typescript): 
        if (self.animationsPresent):
            file_handler.write(indent + 'var animation' + (' : BABYLON.Animation;\n' if is_typescript else ';\n') )          
            for animation in self.animations:
                animation.core_script(file_handler, indent) # assigns the previously declared js variable 'animation'
                file_handler.write(indent + jsVarName + '.animations.push(animation);\n')

            if self.autoAnimate:
                file_handler.write(indent + 'scene.beginAnimation(' + jsVarName + ', ' + 
                                             format_int(self.autoAnimateFrom) + ',' + 
                                             format_int(self.autoAnimateTo) + ',' + 
                                             format_bool(self.autoAnimateLoop) + ', 1.0);\n')
#===============================================================================
class Mesh(FCurveAnimatable):
    def __init__(self, object, scene, multiMaterials, startFace, forcedParent, nameID):
        super().__init__(object, True, True, True)  #Should animations be done when foredParent
        
        self.name = object.name + nameID
        TowerOfBabel.log('processing begun of mesh:  ' + self.name)
        self.isVisible = not object.hide_render
        self.isEnabled = True
        self.useFlatShading = object.data.useFlatShading
        self.checkCollisions = object.data.checkCollisions
        self.receiveShadows = object.data.receiveShadows
        
        # used to support shared vertex instances in later passed
        self.dataName = object.data.name
        self.alreadyExported = False

        if forcedParent is None:     
            if object.parent and object.parent.type != 'ARMATURE':
                self.parentId = object.parent.name
        else:
            self.parentId = forcedParent.name

        # Physics
        if object.rigid_body != None:
            shape_items = {'SPHERE'     : SPHERE_IMPOSTER, 
                           'BOX'        : BOX_IMPOSTER, 
                           'MESH'       : MESH_IMPOSTER, 
                           'CAPSULE'    : CAPSULE_IMPOSTER, 
                           'CONE'       : CONE_IMPOSTER, 
                           'CYLINDER'   : CYLINDER_IMPOSTER, 
                           'CONVEX_HULL': CONVEX_HULL_IMPOSTER}

            shape_type = shape_items[object.rigid_body.collision_shape]
            self.physicsImpostor = shape_type
            mass = object.rigid_body.mass
            if mass < 0.005:
                mass = 0
            self.physicsMass = mass
            self.physicsFriction = object.rigid_body.friction
            self.physicsRestitution = object.rigid_body.restitution
        
        # Geometry, awkward, maybe nuke hasSkeleton test; can there only be one?
        hasSkeleton = True if object.parent and object.parent.type == 'ARMATURE' and len(object.vertex_groups) > 0 else False
        if hasSkeleton:
            # determine the skeleton ID by iterating thru objects counting armatures until parent is found
            i = 0
            for obj in [object for object in scene.objects if object.is_visible(scene)]:
                if (obj.type == 'ARMATURE'):
                    if (obj.name == object.parent.name):
                        self.skeletonId = i
                        break;
                    else:
                        i += 1
         
        # detect if any textures in the material slots, which would mean UV mapping is required                         
        uvRequired = False
        for slot in object.material_slots:
            uvRequired |= TowerOfBabel.uvRequiredForMaterial(slot.name)
           
        if len(object.material_slots) == 1:
            self.materialId = TowerOfBabel.nameSpace + '.' + object.material_slots[0].name           
            self.billboardMode = BILLBOARDMODE_ALL if object.material_slots[0].material.game_settings.face_orientation == 'BILLBOARD' else BILLBOARDMODE_NONE;
                
        elif len(object.material_slots) > 1:
            multimat = MultiMaterial(object.material_slots, len(multiMaterials))
            self.materialId = multimat.name
            multiMaterials.append(multimat)
            self.billboardMode = BILLBOARDMODE_NONE
        else:
            self.billboardMode = BILLBOARDMODE_NONE
            TowerOfBabel.warn('WARNING:  No materials have been assigned: ', 2)
            
        # Get mesh  
        mesh = object.to_mesh(scene, True, 'PREVIEW')
        
        world = object.matrix_world
        if object.parent and not hasSkeleton:
            world *= object.parent.matrix_world.inverted()
            
        # use defaults when not None
        if forcedParent is None:
            loc, rot, scale = world.decompose()
            self.position = loc
            self.rotation = scale_vector(rot.to_euler('XYZ'), -1)
            self.scaling  = scale
        else:
            self.position = mathutils.Vector((0, 0, 0))
            self.rotation = scale_vector(mathutils.Vector((0, 0, 0)), 1) # isn't scaling 0's by 1 same as 0?
            self.scaling  = mathutils.Vector((1, 1, 1))
                                                
        # Triangulate mesh if required
        Mesh.mesh_triangulate(mesh)
        
        # Getting vertices and indices
        self.positions  = []
        self.normals    = []
        self.uvs        = [] # not always used
        self.uvs2       = [] # not always used
        self.colors     = [] # not always used
        self.indices    = []    
        self.subMeshes  = []

        hasUV = len(mesh.tessface_uv_textures) > 0
        if hasUV:
            UVmap = mesh.tessface_uv_textures[0].data
        
        hasUV2 = len(mesh.tessface_uv_textures) > 1     
        if hasUV2:
            UV2map = mesh.tessface_uv_textures[1].data

        hasVertexColor = len(mesh.vertex_colors) > 0
        if hasVertexColor:
            Colormap = mesh.tessface_vertex_colors.active.data

        if hasSkeleton:
            self.skeletonWeights = []
            self.skeletonIndices = []
            self.skeletonIndicesCompressed = []
    
        # used tracking of vertices as they are recieved     
        orderMapToNative = []
        alreadySavedVertices = []
        vertices_UVs = []
        vertices_UV2s = []
        vertices_Colors = []
        vertices_indices = []

        self.offsetFace = 0
                
        for v in range(0, len(mesh.vertices)):
            orderMapToNative.append(-1)
            alreadySavedVertices.append(False)
            vertices_UVs.append([])
            vertices_UV2s.append([])
            vertices_Colors.append([])
            vertices_indices.append([])
                       
        materialsCount = max(1, len(object.material_slots))
        verticesCount = 0
        indicesCount = 0

        for materialIndex in range(materialsCount):
            if self.offsetFace != 0:
                break

            subMeshVerticesStart = verticesCount
            subMeshIndexStart = indicesCount
        
            for faceIndex in range(startFace, len(mesh.tessfaces)):  # For each face
                face = mesh.tessfaces[faceIndex]

                if face.material_index != materialIndex:
                    continue

                if verticesCount + 3 > MAX_VERTEX_ELEMENTS:
                    self.offsetFace = faceIndex
                    break

                for v in range(3): # For each vertex in face
                    vertex_index = face.vertices[v]

                    vertex = mesh.vertices[vertex_index]
                    position = vertex.co
                    normal = vertex.normal

                    #skeletons
                    if hasSkeleton:
                        matricesWeights = []
                        matricesWeights.append(0.0)
                        matricesWeights.append(0.0)
                        matricesWeights.append(0.0)
                        matricesWeights.append(0.0)
                        matricesIndices = []
                        matricesIndices.append(0.0)
                        matricesIndices.append(0.0)
                        matricesIndices.append(0.0)
                        matricesIndices.append(0.0)
                        matricesIndicesCompressed = 0

                        # Getting influences
                        i = 0
                        offset = 0
                        for group in vertex.groups:
                            index = group.group
                            weight = group.weight

                            for boneIndex, bone in enumerate(object.parent.pose.bones):
                                if object.vertex_groups[index].name == bone.name:
                                    if (i == MAX_INFLUENCERS_PER_VERTEX):
                                        TowerOfBabel.warn('WARNING: Maximum # of influencers exceeded for a vertex, extras ignored', 2)
                                        break
                                    matricesWeights[i] = weight
                                    matricesIndices[i] = boneIndex
                                    matricesIndicesCompressed += boneIndex << offset
                                    offset = offset + 8

                                    i = i + 1                                    

                    # Texture coordinates
                    if hasUV:
                        vertex_UV = UVmap[face.index].uv[v]
                        
                    if hasUV2:
                        vertex_UV2 = UV2map[face.index].uv[v]

                    # Vertex color
                    if hasVertexColor:      
                        if v == 0:              
                            vertex_Color = Colormap[face.index].color1
                        if v == 1:              
                            vertex_Color = Colormap[face.index].color2
                        if v == 2:              
                            vertex_Color = Colormap[face.index].color3
                        
                    # Check if the current vertex is already saved                  
                    alreadySaved = alreadySavedVertices[vertex_index] and not hasSkeleton
                    if alreadySaved:
                        alreadySaved = False                      
                    
                        # UV
                        index_UV = 0
                        for savedIndex in vertices_indices[vertex_index]:
                            if hasUV:                                               
                                vUV = vertices_UVs[vertex_index][index_UV]
                                if (vUV[0] != vertex_UV[0] or vUV[1] != vertex_UV[1]):
                                    continue

                            if hasUV2:
                                vUV2 = vertices_UV2s[vertex_index][index_UV]
                                if (vUV2[0] != vertex_UV2[0] or vUV2[1] != vertex_UV2[1]):
                                    continue

                            if hasVertexColor:
                                vColor = vertices_Colors[vertex_index][index_UV]
                                if (vColor.r != vertex_Color.r or vColor.g != vertex_Color.g or vColor.b != vertex_Color.b):
                                    continue

                            if vertices_indices[vertex_index][index_UV] >= subMeshVerticesStart:
                                alreadySaved = True
                                break

                            index_UV += 1                 

                    if (alreadySaved):
                        # Reuse vertex
                        index = vertices_indices[vertex_index][index_UV]
                    else:
                        # Export new one
                        index = verticesCount
                        orderMapToNative[vertex_index] = index
                        alreadySavedVertices[vertex_index] = True
                        if hasUV:
                            vertices_UVs[vertex_index].append(vertex_UV)
                            self.uvs.append(vertex_UV[0])
                            self.uvs.append(vertex_UV[1])
                        if hasUV2:
                            vertices_UV2s[vertex_index].append(vertex_UV2)
                            self.uvs2.append(vertex_UV2[0])
                            self.uvs2.append(vertex_UV2[1])
                        if hasVertexColor:
                            vertices_Colors[vertex_index].append(vertex_Color)
                            self.colors.append(vertex_Color.r)
                            self.colors.append(vertex_Color.g)
                            self.colors.append(vertex_Color.b)
                        if hasSkeleton:
                            self.skeletonWeights.append(matricesWeights[0])
                            self.skeletonWeights.append(matricesWeights[1])
                            self.skeletonWeights.append(matricesWeights[2])
                            self.skeletonWeights.append(matricesWeights[3])
                            self.skeletonIndices.append(matricesIndices[0])
                            self.skeletonIndices.append(matricesIndices[1])
                            self.skeletonIndices.append(matricesIndices[2])
                            self.skeletonIndices.append(matricesIndices[3])
                            self.skeletonIndicesCompressed.append(matricesIndicesCompressed)

                        vertices_indices[vertex_index].append(index)
                        
                        self.positions.append(position)             
                        self.normals.append(normal)                    
                        
                        verticesCount += 1
                    self.indices.append(index)
                    indicesCount += 1           
                    
            self.subMeshes.append(SubMesh(materialIndex, subMeshVerticesStart, subMeshIndexStart, verticesCount - subMeshVerticesStart, indicesCount - subMeshIndexStart))

        TowerOfBabel.log('num positions      :  ' + str(len(self.positions)), 2)
        TowerOfBabel.log('num normals        :  ' + str(len(self.normals  )), 2)
        TowerOfBabel.log('num uvs            :  ' + str(len(self.uvs      )), 2)
        TowerOfBabel.log('num uvs2           :  ' + str(len(self.uvs2     )), 2)
        TowerOfBabel.log('num colors         :  ' + str(len(self.colors   )), 2)
        TowerOfBabel.log('num indices        :  ' + str(len(self.indices  )), 2)
        if hasattr(self, 'skeletonWeights'):
            TowerOfBabel.log('num skeletonWeights:  ' + str(len(self.skeletonWeights)), 2)
            TowerOfBabel.log('num skeletonIndices:  ' + str(len(self.skeletonIndices)), 2)
            
        if uvRequired and len(self.uvs) == 0:
            TowerOfBabel.warn('WARNING: textures being used, but no UV Map found', 2)
        
        # shape keys for mesh 
        if object.data.shape_keys:
            rawShapeKeys = []
            groupNames = []
            for block in object.data.shape_keys.key_blocks:
                # perform name format validation, before processing
                keyName = block.name
                
                # the Basis shape key is a member of all groups, each automatically built from positions, Blender version ignored
                if (keyName == 'Basis'): continue
                
                if (keyName.find('-') <= 0):
                    keyName = 'ENTIRE MESH-' + keyName.upper();
                    TowerOfBabel.log('Key shape not in group-state format, changed to:  ' + keyName, 2)
                    
                temp = keyName.upper().partition('-')
                if len(block.data) != len(self.positions):
                    TowerOfBabel.warn('WARNING: shape key length != positions length, either missing UV map, or mesh too large:  '+ keyName, 2)
                    continue
                        
                rawShapeKeys.append(RawShapeKey(block, temp[0], temp[2], orderMapToNative))
                
                # check for a new group, add to groupNames if so
                newGroup = True
                for group in groupNames:
                    if temp[0] == group:
                        newGroup = False
                        break
                if newGroup:
                    groupNames.append(temp[0])
                    
            # process into ShapeKeyGroups, when rawShapeKeys found
            if (len(groupNames) > 0):
                self.shapeKeyGroups = []
                for group in groupNames:
                    self.shapeKeyGroups.append(ShapeKeyGroup(group, rawShapeKeys, self.positions))
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def get_proper_name(self):
        return legal_js_identifier(self.name)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
    def get_base_class(self):
        return 'BABYLON.Automaton' if hasattr(self, 'shapeKeyGroups') else 'BABYLON.Mesh'
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -      
    @staticmethod
    def mesh_triangulate(mesh):
        try:
            import bmesh
            bm = bmesh.new()
            bm.from_mesh(mesh)
            bmesh.ops.triangulate(bm, faces = bm.faces)
            bm.to_mesh(mesh)
            mesh.calc_tessface()
            bm.free()
        except:
            pass
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -      
    def to_scene_file(self, file_handler, meshesAndNodes): 
        if self.alreadyExported: return
        
        file_handler.write('{')        
        write_string(file_handler, 'name', self.name, True)        
        write_string(file_handler, 'id', self.name) 
        if hasattr(self, 'parentId'): write_string(file_handler, 'parentId', self.parentId)

        if hasattr(self, 'materialId'): write_string(file_handler, 'materialId', self.materialId)        
        write_int(file_handler, 'billboardMode', self.billboardMode)
        write_vector(file_handler, 'position', self.position)
        write_vector(file_handler, 'rotation', self.rotation)
        write_vector(file_handler, 'scaling', self.scaling)
        write_bool(file_handler, 'isVisible', self.isVisible)
        write_bool(file_handler, 'isEnabled', self.isEnabled)
        write_bool(file_handler, 'useFlatShading', self.useFlatShading)
        write_bool(file_handler, 'checkCollisions', self.checkCollisions)
        write_bool(file_handler, 'receiveShadows', self.receiveShadows)

        if hasattr(self, 'physicsImpostor'):
            write_int(file_handler, 'physicsImpostor', self.physicsImpostor)
            write_float(file_handler, 'physicsMass', self.physicsMass)
            write_float(file_handler, 'physicsFriction', self.physicsFriction)
            write_float(file_handler, 'physicsRestitution', self.physicsRestitution)

        # Geometry
        if hasattr(self, 'skeletonId'): write_int(file_handler, 'skeletonId', self.skeletonId)
        write_vector_array(file_handler, 'positions', self.positions)
        write_vector_array(file_handler, 'normals'  , self.normals  )

        if len(self.uvs) > 0:
            write_array(file_handler, 'uvs', self.uvs)

        if len(self.uvs2) > 0:
            write_array(file_handler, 'uvs2', self.uvs2)

        if len(self.colors) > 0:
            write_array(file_handler, 'colors', self.colors)

        if hasattr(self, 'skeletonWeights'):
            write_array(file_handler, 'matricesWeights', self.skeletonWeights)
            write_array(file_handler, 'matricesIndices', self.skeletonIndicesCompressed)

        write_array(file_handler, 'indices', self.indices)

        # Sub meshes
        file_handler.write('\n,"subMeshes":[')
        first = True
        for subMesh in self.subMeshes:
            if first == False:
                file_handler.write(',')
            subMesh.to_scene_file(file_handler)
            first = False
        file_handler.write(']')

        super().to_scene_file(file_handler) # Animations
                
        # Instances
        first = True
        file_handler.write('\n,"instances":[')
        for mesh in meshesAndNodes:
            if hasattr(mesh, 'positions') and mesh.dataName == self.dataName and mesh != self and not mesh.alreadyExported:  # check for positions to be sure not a Node
                mesh.alreadyExported = True
                if first == False:
                    file_handler.write(',')
                file_handler.write('{')

                write_string(file_handler, 'name', mesh.name, True)        
                write_vector(file_handler, 'position', mesh.position)
                write_vector(file_handler, 'rotation', mesh.rotation)
                write_vector(file_handler, 'scaling', mesh.scaling)

                file_handler.write('}')
                first = False
        file_handler.write(']')

        # Shape Key Groups
        isAutomaton = hasattr(self, 'shapeKeyGroups')
        write_bool(file_handler, 'isAutomaton', isAutomaton)
        if (isAutomaton):
            first = True
            file_handler.write('\n,"shapeKeyGroups":[')
            for shapeKeyGroup in self.shapeKeyGroups:
                file_handler.write('\n')
                if first == False:
                    file_handler.write(',')

                shapeKeyGroup.to_scene_file(file_handler)
                first = False
            file_handler.write(']')

        # Close mesh
        file_handler.write('}\n')
        self.alreadyExported = True
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -        
    def core_script(self, file_handler, kids, indent, is_typescript): 
        properName = self.get_proper_name()
        isRootMesh = not hasattr(self, 'parentId')
        isAutomaton = hasattr(self, 'shapeKeyGroups')
        baseClass = self.get_base_class()
        ns = '' if is_typescript else INTERNAL_NS_VAR + '.' 
        var = ''
        indent2 = ''
        if isRootMesh:
            var = 'this'
            indent2 = indent + '        '
            if is_typescript:
                # declaration of class & memeber kids
                file_handler.write('\n' + indent + 'export class ' + properName + ' extends ' + baseClass + ' {\n')
                for kid in kids:
                    file_handler.write(indent + '    public ' + kid.get_proper_name() + ' : ' + kid.get_base_class() + ';\n')    
                
                file_handler.write(indent + '    constructor(name: string, scene: BABYLON.Scene, ' + MATERIALS_PATH_VAR + ': string = "./") {\n')
                file_handler.write(indent2 + 'super(name, scene);\n\n')
                file_handler.write(indent2 + TowerOfBabel.nameSpace + '.defineMaterials(scene, ' + MATERIALS_PATH_VAR + '); //embedded version check\n')
            else:
                file_handler.write('\n' + indent + INTERNAL_NS_VAR + '.' + properName + ' = (function (_super) {\n')
                file_handler.write(indent + '    __extends(' + properName + ', _super);\n')
                file_handler.write(indent + '    function ' + properName + '(name, scene, ' + MATERIALS_PATH_VAR + ' = "./"){\n')
                file_handler.write(indent2 + '_super.call(this, name, scene);\n\n')
                file_handler.write(indent2 + INTERNAL_NS_VAR + '.defineMaterials(scene, ' + MATERIALS_PATH_VAR + '); //embedded version check\n')
        else:
            var = 'ret'
            indent2 = indent + '    '
            if is_typescript:
                file_handler.write('\n' + indent + 'function child_' + properName + '(scene : BABYLON.Scene, parent : any) : ' + baseClass + ' {\n')
            else:
                file_handler.write('\n' + indent + INTERNAL_NS_VAR + '.child_' + properName + ' = function(scene, parent){\n')
                
            file_handler.write(indent2 + TowerOfBabel.versionCheckCode)
            file_handler.write(indent2 + 'var ' + var + ' = new ' + baseClass + '("' + properName + '_" + parent.name, scene);\n')
            file_handler.write(indent2 + 'ret.parent = parent;\n')
        
        file_handler.write(indent2 + "console.log('defining mesh: ' + " + var + ".name);\n")
        
        # not part of root mesh test to allow for nested parenting
        for kid in kids:
            file_handler.write(indent2 + var + '.' + kid.get_proper_name() + ' = ' + ns + 'child_' + kid.get_proper_name() + '(scene, this);\n')    
        file_handler.write('\n')

        if hasattr(self, 'materialId'): file_handler.write(indent2 + var + '.setMaterialByID("' + self.materialId + '");\n')
        file_handler.write(indent2 + var + '.id = ' + var + '.name;\n')
        file_handler.write(indent2 + var + '.billboardMode  = ' + format_int(self.billboardMode) + ';\n')
        file_handler.write(indent2 + var + '.position.x  = ' + format_f(self.position.x) + ';\n')
        file_handler.write(indent2 + var + '.position.y  = ' + format_f(self.position.z) + ';\n')
        file_handler.write(indent2 + var + '.position.z  = ' + format_f(self.position.y) + ';\n')
        file_handler.write(indent2 + var + '.rotation.x  = ' + format_f(self.rotation.x) + ';\n')
        file_handler.write(indent2 + var + '.rotation.y  = ' + format_f(self.rotation.z) + ';\n')
        file_handler.write(indent2 + var + '.rotation.z  = ' + format_f(self.rotation.y) + ';\n')
        file_handler.write(indent2 + var + '.scaling.x   = ' + format_f(self.scaling.x) + ';\n')
        file_handler.write(indent2 + var + '.scaling.y   = ' + format_f(self.scaling.z) + ';\n')
        file_handler.write(indent2 + var + '.scaling.z   = ' + format_f(self.scaling.y) + ';\n')
        file_handler.write(indent2 + var + '.isVisible       = ' + format_bool(self.isVisible) + ';\n')
        file_handler.write(indent2 + var + '.checkCollisions = ' + format_bool(self.checkCollisions) + ';\n')
        file_handler.write(indent2 + var + '.receiveShadows  = ' + format_bool(self.receiveShadows) + ';\n')
        
        if hasattr(self, 'physicsImpostor'):
            file_handler.write(indent2 + 'if (!scene.isPhysicsEnabled()) {\n')
            file_handler.write(indent2 + '\tscene.enablePhysics();\n')
            file_handler.write(indent2 + '}\t')
            file_handler.write(indent2 + var + '.setPhysicsState({ impostor: '    + format_int(self.physicsImpostor) + 
                                                                ', mass: '        + format_f(self.physicsMass) + 
                                                                ', friction: '    + format_f(self.physicsFriction) +
                                                                ', restitution: ' + format_f(self.physicsRestitution) + '});\n')

        # Geometry
        if hasattr(self, 'skeletonId'):
            if is_typescript:
                file_handler.write(indent2 + TowerOfBabel.nameSpace + '.defineSkeletons(scene);\n')
            else:
                file_handler.write('\n' + indent2 + INTERNAL_NS_VAR + '.defineSkeletons(scene);\n')
            file_handler.write(indent2 + var + '.skeleton = scene.getLastSkeletonByID("' + format_int(self.skeletonId) + '");\n\n')
        
        indent3 = indent2 + '    '
        file_handler.write(indent2 + var + '.setVerticesData(BABYLON.VertexBuffer.PositionKind, [\n')
        file_handler.write(indent3 + format_vector_array(self.positions, VERTEX_OUTPUT_PER_LINE, indent3) + '\n')
        file_handler.write(indent2 + '],\n')
        file_handler.write(indent2 + format_bool(isAutomaton) + ');\n\n')
        
        file_handler.write(indent2 + var + '.setVerticesData(BABYLON.VertexBuffer.NormalKind, [\n')
        file_handler.write(indent3 + format_vector_array(self.normals, VERTEX_OUTPUT_PER_LINE, indent3) + '\n')
        file_handler.write(indent2 + '],\n')
        file_handler.write(indent2 + format_bool(isAutomaton) + ');\n\n')

        if len(self.uvs) > 0:
            file_handler.write(indent2 + var + '.setVerticesData(BABYLON.VertexBuffer.UVKind, [\n')
            file_handler.write(indent3 + format_array(self.uvs, VERTEX_OUTPUT_PER_LINE, indent3) + '\n')
            file_handler.write(indent2 + '],\n')
            file_handler.write(indent2 + format_bool(False) + ');\n\n')

        if len(self.uvs2) > 0:
            file_handler.write(indent2 + var + '.setVerticesData(BABYLON.VertexBuffer.UV2Kind, [\n')
            file_handler.write(indent3 + format_array(self.uvs2, VERTEX_OUTPUT_PER_LINE, indent3) + '\n')
            file_handler.write(indent2 + '],\n')
            file_handler.write(indent2 + format_bool(False) + ');\n\n')

        if len(self.colors) > 0:
            file_handler.write(indent2 + var + '.setVerticesData(BABYLON.VertexBuffer.ColorKind, [\n')
            file_handler.write(indent3 + format_array(self.colors, VERTEX_OUTPUT_PER_LINE,indent3) + '\n')
            file_handler.write(indent2 + '],\n')
            file_handler.write(indent2 + format_bool(False) + ');\n\n')

        if hasattr(self, 'skeletonWeights'):
            file_handler.write(indent2 + var + '.setVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind, [\n')
            file_handler.write(indent3 + format_array(self.skeletonWeights, VERTEX_OUTPUT_PER_LINE, indent3) + '\n')
            file_handler.write(indent2 + '],\n')
            file_handler.write(indent2 + format_bool(False) + ');\n\n')

            file_handler.write(indent2 + var + '.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind, [\n')
            file_handler.write(indent3 + format_array(self.skeletonIndices, VERTEX_OUTPUT_PER_LINE, indent3) + '\n')
            file_handler.write(indent2 + '],\n')
            file_handler.write(indent2 + format_bool(False) + ');\n\n')

        file_handler.write(indent2 + var + '.setIndices([\n')
        file_handler.write(indent3 + format_array(self.indices, VERTEX_OUTPUT_PER_LINE, indent3) + '\n')
        file_handler.write(indent2 + ']);\n\n')
        
        # this can be in core, since submesh is same for both JS & TS
        file_handler.write(indent2 + var + '.subMeshes = [];\n')
        for subMesh in self.subMeshes:
            subMesh.core_script(file_handler, var, indent2)
        
        if self.useFlatShading:
            file_handler.write(indent2 + var + '.convertToFlatShadedMesh();\n')
            
        # Update, but not sure why, did not change position, rotation, or scaling objects
        file_handler.write(indent2 + var + '.computeWorldMatrix(true);\n')

        # Octree, cannot predetermine since something in scene; break down and write an if (ERRORS in Typescript)
        if not is_typescript:
            file_handler.write(indent2 + 'if (scene._selectionOctree) {\n')
            file_handler.write(indent3 + 'scene.createOrUpdateSelectionOctree();\n')
            file_handler.write(indent2 + '}\n') 
        
        if (isAutomaton):
            file_handler.write(indent2 + 'var shapeKeyGroup' + (' : BABYLON.ShapeKeyGroup;\n' if is_typescript else ';\n') )
            for shapeKeyGroup in self.shapeKeyGroups:
                shapeKeyGroup.core_script(file_handler, var, indent2) # assigns the previously declared js variable 'shapeKeyGroup'
                file_handler.write(indent2 + 'this.addShapeKeyGroup(shapeKeyGroup);\n')
        
        super().core_script(file_handler, var, indent2, is_typescript) # Animations

        if isRootMesh:
            file_handler.write(indent + '    }\n')
            if is_typescript:
                file_handler.write(indent + '}\n')
            else:
                file_handler.write(indent + '    return ' + properName + ';\n')
                file_handler.write(indent + '})(' + baseClass + ');\n')      
        else:
            file_handler.write(indent + '    return ret;\n')             
            file_handler.write(indent + '}\n') 
#===============================================================================
class Node:
    def __init__(self, node):
        TowerOfBabel.log('processing begun of node:  ' + node.name)
        self.name = node.name        
        
        world = node.matrix_world
        if (node.parent):
            world = node.parent.matrix_world.inverted() * node.matrix_world

        loc, rot, scale = world.decompose()

        if node.parent != None:
            self.parentId = node.parent.name
                   
        self.position = loc
        self.rotation = scale_vector(rot.to_euler('XYZ'), -1)
        self.scaling = scale
        self.isVisible = False
        self.checkCollisions = False
        self.billboardMode = BILLBOARDMODE_NONE
        self.receiveShadows = False
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def get_proper_name(self):
        return legal_js_identifier(self.name)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler, ignored):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)        
        write_string(file_handler, 'id', self.name)        
        if hasattr(self, 'parentId'): write_string(file_handler, 'parentId', self.parentId)
                   
        write_vector(file_handler, 'position', self.position)
        write_vector(file_handler, 'rotation', self.rotation)
        write_vector(file_handler, 'scaling', self.scaling)
        write_bool(file_handler, 'isVisible', self.isVisible)
        write_bool(file_handler, 'checkCollisions', self.checkCollisions)
        write_int(file_handler, 'billboardMode', self.billboardMode)
        write_bool(file_handler, 'receiveShadows', self.receiveShadows)      
        file_handler.write('}')    
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -        
    def core_script(self, file_handler, kids, indent, is_typescript): 
        properName = self.get_proper_name()
        isRootNode = not hasattr(self, 'parentId')
        var = ''
        indent2 = ''
        if isRootNode:
            var = 'this'
            indent2 = indent + '        '
            if is_typescript:
                # declaration of class & memeber kids
                file_handler.write('\n' + indent + 'export class ' + properName + ' extends BABYLON.Mesh {\n')
                for kid in kids:
                    file_handler.write(indent + '    public ' + kid.get_proper_name() + ' : ' + kid.getBaseClass() + ';\n')    
                
                file_handler.write(indent + '    constructor(name: string, scene: BABYLON.Scene) {\n')
                file_handler.write(indent2 + 'super(name, scene);\n\n')
                file_handler.write(indent2 + TowerOfBabel.nameSpace + '.defineMaterials(scene); //embedded version check\n')
            else:
                file_handler.write('\n' + indent + INTERNAL_NS_VAR + '.' + properName + ' = (function (_super) {\n')
                file_handler.write(indent + '    __extends(' + properName + ', _super);\n')
                file_handler.write(indent + '    function ' + properName + '(name, scene){\n')
                file_handler.write(indent2 + '_super.call(this, name, scene);\n\n')
        else:
            var = 'ret'
            indent2 = indent + '    '
            if is_typescript:
                file_handler.write('\n' + indent + 'function child_' + properName + '(scene : BABYLON.Scene, parent : Any) : BABYLON.Mesh {\n')
            else:
                file_handler.write('\n' + indent + INTERNAL_NS_VAR + '.child_' + properName + ' = function(scene, parent){\n')
                
            file_handler.write(indent2 + TowerOfBabel.versionCheckCode)
            file_handler.write(indent2 + 'var ' + var + ' = new BABYLON.Mesh("' + properName + '_"' + 'parent.name, scene);\n')
            file_handler.write(indent2 + 'ret.parent = parent;\n')
        
        file_handler.write(indent2 + TowerOfBabel.versionCheckCode)        
        file_handler.write(indent2 + "console.log('defining node: ' + " + var + ".name);\n")
        
        # not part of root mesh test to allow for nested parenting
        for kid in kids:
            file_handler.write(indent2 + var + '.' + kid.getProperName() + ' = ' + INTERNAL_NS_VAR + '.child_' + kid.getProperName() + '(scene, this);\n')    
        file_handler.write('\n')

        file_handler.write(indent2 + var + '.id = ' + var + '.name;\n')
        file_handler.write(indent2 + var + '.billboardMode  = ' + format_int(self.billboardMode) + ';\n')
        file_handler.write(indent2 + var + '.position.x  = ' + format_f(self.position.x) + ';\n')
        file_handler.write(indent2 + var + '.position.y  = ' + format_f(self.position.z) + ';\n')
        file_handler.write(indent2 + var + '.position.z  = ' + format_f(self.position.y) + ';\n')
        file_handler.write(indent2 + var + '.rotation.x  = ' + format_f(self.rotation.x) + ';\n')
        file_handler.write(indent2 + var + '.rotation.y  = ' + format_f(self.rotation.z) + ';\n')
        file_handler.write(indent2 + var + '.rotation.z  = ' + format_f(self.rotation.y) + ';\n')
        file_handler.write(indent2 + var + '.scaling.x   = ' + format_f(self.scaling.x) + ';\n')
        file_handler.write(indent2 + var + '.scaling.y   = ' + format_f(self.scaling.z) + ';\n')
        file_handler.write(indent2 + var + '.scaling.z  = ' + format_f(self.scaling.y) + ';\n')
        file_handler.write(indent2 + var + '.isVisible       = ' + format_bool(self.isVisible) + ';\n')
        file_handler.write(indent2 + var + '.checkCollisions = ' + format_bool(self.checkCollisions) + ';\n')
        file_handler.write(indent2 + var + '.receiveShadows  = ' + format_bool(self.receiveShadows) + ';\n')

        if isRootNode:
            file_handler.write(indent + '    }\n')
            if is_typescript:
                file_handler.write(indent + '}\n')
            else:
                file_handler.write(indent + '    return ' + properName + ';\n')
                file_handler.write(indent + '})(BABYLON.Mesh);\n')      
        else:
            file_handler.write(indent + '    return ret;\n')             
            file_handler.write(indent + '}\n') 
#===============================================================================
class SubMesh:
    def __init__(self, materialIndex, verticesStart, indexStart, verticesCount, indexCount):
        self.materialIndex = materialIndex
        self.verticesStart = verticesStart
        self.indexStart = indexStart
        self.verticesCount = verticesCount
        self.indexCount = indexCount
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def to_scene_file(self, file_handler):       
        file_handler.write('{')
        write_int(file_handler, 'materialIndex', self.materialIndex, True)
        write_int(file_handler, 'verticesStart', self.verticesStart)
        write_int(file_handler, 'verticesCount', self.verticesCount)
        write_int(file_handler, 'indexStart'   , self.indexStart)
        write_int(file_handler, 'indexCount'   , self.indexCount)
        file_handler.write('}')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
    def core_script(self, file_handler, jsMeshVar, indent):
        file_handler.write(indent + 'new BABYLON.SubMesh(' + 
                          format_int(self.materialIndex) + ', ' + 
                          format_int(self.verticesStart) + ', ' + 
                          format_int(self.verticesCount) + ', ' + 
                          format_int(self.indexStart)    + ', ' + 
                          format_int(self.indexCount)    + ', ' + jsMeshVar + ');\n')
#===============================================================================   
# extract data in Mesh order, no optimization from group analyse yet
class RawShapeKey:
    def __init__(self, keyBlock, group, state, orderMapToNative):
        self.group = group
        self.state = state
        self.vertices = []   

        max_index = len(orderMapToNative)
        for lookingForIdx in range(0, max_index):
            for nativeIdx in range(0, max_index):
                if orderMapToNative[nativeIdx] == lookingForIdx:
                   self.vertices.append(keyBlock.data[nativeIdx].co)
                   break;
#===============================================================================
class ShapeKeyGroup:
    def __init__(self, group, rawShapeKeys, positions):
        self.group = group
        self.stateNames = []
        self.stateVertices = []
        self.affectedIndices = []   

        nRawKeys = len(rawShapeKeys)
        nSize = len(positions)
                
        sameForAll = []
        for i in range(0, nSize):
            sameForAll.append(True)
            
        # first pass to determine which vertices are not the same across all members of a group & also positions
        for i in range(0, nSize):
            for keyA in rawShapeKeys:
                # no need for more checking once 1 difference is found
                if not sameForAll[i]:
                    break;
                    
                # skip key if not member of the current group being processed
                if group != keyA.group:
                    continue;
                    
                # check vertex not different from positions (done before inner loop for performance)
                if not ShapeKeyGroup.same_vertex(keyA.vertices[i],  positions[i]):
                    sameForAll[i] = False
                    break;
                
                # check vertices[i] of keyA against all other keys of this group 
                for keyB in range(0, nRawKeys):
                    # skip keyB if not member of the current group being processed, or itself
                    if group != keyB.group or keyA == keyB:
                         continue;
                         
                    if not ShapeKeyGroup.same_vertex(keyA.vertices[i],  keyB.vertices[i]):
                       sameForAll[i] = False
                       break;
       
        affectedWholeVertices = []
        affectedVertices = []
        # pass to convert sameForAll into self.affectedIndices, build 'BASIS' state at the same time
        for i in range(0, nSize):
            if not sameForAll[i]:
                affectedWholeVertices.append(i)
                self.affectedIndices.append(i * 3 + 0)
                self.affectedIndices.append(i * 3 + 1)
                self.affectedIndices.append(i * 3 + 2)
                affectedVertices.append(positions[i])
                
        self.basisState = affectedVertices
        TowerOfBabel.log('n Affected for ' + group + ': '+ str(len(affectedWholeVertices)) + ', of ' + str(nSize))
                
        # pass to convert rawShapeKeys in this group, to stateVertices of only affected indices
        for key in rawShapeKeys:
            if group != key.group:
                continue;
                
            affectedVertices = []
            for idx in affectedWholeVertices:
                affectedVertices.append(key.vertices[idx])
                
            self.stateNames.append(key.state)
            self.stateVertices.append(affectedVertices)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -        
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'group', self.group, True)
        write_array(file_handler, 'affectedIndices', self.affectedIndices)
        write_vector_array(file_handler, 'basisState', self.basisState)
        
        file_handler.write('\n,"states":[')
        first = True
        for state_idx in range(len(self.stateVertices)):
            if first != True:
                file_handler.write(',')
            first = False
            file_handler.write('\n{')
            write_string(file_handler, 'stateName', self.stateNames[state_idx], True)
            write_vector_array(file_handler, 'state', self.stateVertices[state_idx])
            file_handler.write('\n}')

        file_handler.write(']')   # close states
        file_handler.write('}')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -        
    def core_script(self, file_handler, var, indent):
        indent2 = indent + '    '
        file_handler.write(indent  + 'shapeKeyGroup = new BABYLON.ShapeKeyGroup(' + var + ', "' + self.group + '",[\n')
        file_handler.write(indent2 + format_array(self.affectedIndices, VERTEX_OUTPUT_PER_LINE, indent2) + '\n')
        file_handler.write(indent  + '],[\n')
        file_handler.write(indent2 + format_vector_array(self.basisState, VERTEX_OUTPUT_PER_LINE, indent2) + '\n')
        file_handler.write(indent  + ']);\n')
        
        for state_idx in range(len(self.stateVertices)):
            file_handler.write(indent  + 'shapeKeyGroup.addShapeKey("' + self.stateNames[state_idx] + '",[\n')
            file_handler.write(indent2 + format_vector_array(self.stateVertices[state_idx], VERTEX_OUTPUT_PER_LINE, indent2) + '\n')
            file_handler.write(indent  + ']);\n')
            
    @staticmethod
    def same_vertex(vertA, vertB):
        return vertA.x == vertB.x and vertA.y == vertB.y and vertA.z == vertB.z
#===============================================================================
class Bone:
    def __init__(self, bone, skeleton, scene, index):
        TowerOfBabel.log('processing begun of bone:  ' + bone.name + ', index:  '+ str(index))
        self.name = bone.name
        self.index = index

        matrix_world = skeleton.matrix_world
        self.matrix = Bone.get_matrix(bone, matrix_world)

        parentId = -1
        if (bone.parent):
            for parent in skeleton.pose.bones:
                parentId += 1
                if parent == bone.parent:
                    break;

        self.parentBoneIndex = parentId

        #animation 
        if (skeleton.animation_data):
            TowerOfBabel.log('animation begun of bone:  ' + self.name)
            self.animation = Animation(ANIMATIONTYPE_MATRIX, scene.render.fps, ANIMATIONLOOPMODE_CYCLE, 'anim', '_matrix')

            start_frame = scene.frame_start
            end_frame = scene.frame_end
            previousBoneMatrix = None
            for frame in range(start_frame, end_frame + 1):
                bpy.context.scene.frame_set(frame)
                currentBoneMatrix = Bone.get_matrix(bone, skeleton.matrix_world)

                if (frame != end_frame and currentBoneMatrix == previousBoneMatrix):
                    continue
                    
                self.animation.frames.append(frame)
                self.animation.values.append(Bone.get_matrix(bone, matrix_world))
                previousBoneMatrix = currentBoneMatrix

            bpy.context.scene.frame_set(start_frame)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    @staticmethod
    def get_matrix(bone, matrix_world):
        SystemMatrix = mathutils.Matrix.Scale(-1, 4, mathutils.Vector((0, 0, 1))) * mathutils.Matrix.Rotation(math.radians(-90), 4, 'X')

        if (bone.parent):
            return (SystemMatrix * matrix_world * bone.parent.matrix).inverted() * (SystemMatrix * matrix_world * bone.matrix)
        else:
            return SystemMatrix * matrix_world * bone.matrix
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def to_scene_file(self, file_handler):     
        file_handler.write('\n{')
        write_string(file_handler, 'name', self.name, True)
        write_int(file_handler, 'index', self.index)
        write_matrix4(file_handler, 'matrix', self.matrix)
        write_int(file_handler, 'parentBoneIndex', self.parentBoneIndex)

        #animation
        if hasattr(self, 'animation'): 
            file_handler.write(',"animation":')
            self.animation.to_scene_file(file_handler)
            
        file_handler.write('}') 
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -        
    # assume the following JS variables have already been declared: skeleton, bone, animation
    def core_script(self, file_handler, indent): 
        parentBone = 'skeleton.bones[' + format_int(self.parentBoneIndex) + ']' if self.parentBoneIndex != -1 else 'null' 

        file_handler.write(indent + 'bone = new BABYLON.Bone("' + self.name + '", skeleton,' + parentBone + ', BABYLON.Matrix.FromValues(' + format_matrix4(self.matrix) + '));\n')

        if hasattr(self, 'animation'):
            self.animation.core_script(file_handler, indent) # declares and set the variable animation
            file_handler.write(indent + 'bone.animations.push(animation);\n\n')
#===============================================================================
class Skeleton:
    def __init__(self, skeleton, scene, id):
        TowerOfBabel.log('processing begun of skeleton:  ' + skeleton.name + ', id:  '+ str(id))
        self.name = skeleton.name        
        self.id = id        
        self.bones = []
        
        bones = skeleton.pose.bones
        j = 0
        for bone in bones:
            self.bones.append(Bone(bone, skeleton, scene, j))
            j = j + 1
            
        TowerOfBabel.log('processing complete of skeleton:  ' + skeleton.name)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_int(file_handler, 'id', self.id)
        
        file_handler.write(',"bones":[')
        first = True
        for bone in self.bones:
            if first != True:
                file_handler.write(',')
            first = False

            bone.to_scene_file(file_handler)

        file_handler.write(']')
        file_handler.write('}') 
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -        
    # assume the following JS variables have already been declared: scene, skeleton, bone, animation
    def core_script(self, file_handler, indent): 
        # specifying scene gets skeleton added to scene in constructor
        file_handler.write(indent + "console.log('defining skeleton:  " + self.name + "');\n")
        file_handler.write(indent + 'skeleton = new BABYLON.Skeleton("' + self.name + '", "' + format_int(self.id) + '", scene);\n')

        for bone in self.bones:
            bone.core_script(file_handler, indent)
#===============================================================================
class Camera(FCurveAnimatable):
    def __init__(self, camera):         
        super().__init__(camera, True, True, False, math.pi / 2)
        
        self.name = camera.name        
        TowerOfBabel.log('processing begun of camera:  ' + self.name)
        self.position = camera.location
        self.rotation = mathutils.Vector((-camera.rotation_euler[0] + math.pi / 2, camera.rotation_euler[1], -camera.rotation_euler[2])) # extra parens needed
        self.fov = camera.data.angle
        self.minZ = camera.data.clip_start
        self.maxZ = camera.data.clip_end
        self.speed = 1.0
        self.inertia = 0.9
        self.checkCollisions = camera.data.checkCollisions
        self.applyGravity = camera.data.applyGravity
        self.ellipsoid = camera.data.ellipsoid
        
        for constraint in camera.constraints:
            if constraint.type == 'TRACK_TO':
                self.lockedTargetId = constraint.target.name
                break
            
        self.useFollowCamera = camera.data.useFollowCamera
                
        if self.useFollowCamera:
            self.followHeight = camera.data.followHeight
            self.followDistance = camera.data.followDistance
            self.followRotation = camera.data.followRotation
            if not hasattr(self, 'lockedTargetId'):
                TowerOfBabel.warn('WARNING: Follow Camera specified, but no target to track', 2)
        
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def to_scene_file(self, file_handler):     
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)        
        write_string(file_handler, 'id', self.name)
        write_vector(file_handler, 'position', self.position)
        write_vector(file_handler, 'rotation', self.rotation)
        write_float(file_handler, 'fov', self.fov)
        write_float(file_handler, 'minZ', self.minZ)
        write_float(file_handler, 'maxZ', self.maxZ)
        write_float(file_handler, 'speed', self.speed)
        write_float(file_handler, 'inertia', self.inertia)
        write_bool(file_handler, 'checkCollisions', self.checkCollisions)
        write_bool(file_handler, 'applyGravity', self.applyGravity)
        write_bool(file_handler, 'useFollowCamera', self.useFollowCamera)
        write_array3(file_handler, 'ellipsoid', self.ellipsoid)
        
        if self.useFollowCamera:
            write_int(file_handler, 'heightOffset',  self.followHeight)
            write_int(file_handler, 'radius',  self.followDistance)
            write_int(file_handler, 'rotationOffset',  self.followRotation)
            
        if hasattr(self, 'lockedTargetId'):
            write_string(file_handler, 'lockedTargetId', self.lockedTargetId)

        super().to_scene_file(file_handler) # Animations
        file_handler.write('}')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -        
    def core_script(self, file_handler, indent, is_typescript): 
        cameraClass = 'BABYLON.FollowCamera' if self.useFollowCamera else 'BABYLON.FreeCamera'
        
        file_handler.write(indent + 'camera = new ' + cameraClass + '("' + self.name + '", new BABYLON.Vector3(' + format_vector(self.position) + '), scene);\n')
        file_handler.write(indent + 'camera.id = "' + self.name + '";\n')

        file_handler.write(indent + 'camera.rotation = new BABYLON.Vector3(' + format_vector(self.rotation) + ');\n')

        file_handler.write(indent + 'camera.fov = ' + format_f(self.fov) + ';\n')
        file_handler.write(indent + 'camera.minZ = ' + format_f(self.minZ) + ';\n')
        file_handler.write(indent + 'camera.maxZ = ' + format_f(self.maxZ) + ';\n')

        file_handler.write(indent + 'camera.speed = ' + format_f(self.speed) + ';\n')
        file_handler.write(indent + 'camera.inertia = ' + format(self.inertia) + ';\n')

        file_handler.write(indent + 'camera.checkCollisions = ' + format_bool(self.checkCollisions) + ';\n')
        file_handler.write(indent + 'camera.applyGravity = ' + format_bool(self.applyGravity) + ';\n')
        file_handler.write(indent + 'camera.ellipsoid = new BABYLON.Vector3(' + format_array3(self.ellipsoid) + ');\n')
                 
        if self.useFollowCamera:
            file_handler.write(indent + 'camera.heightOffset = ' + format_int(self.followHeight) + ';\n')
            file_handler.write(indent + 'camera.radius = ' + format_int(self.followDistance) + ';\n')
            file_handler.write(indent + 'camera.rotationOffset = ' + format_int(self.followRotation) + ';\n')
            
        if hasattr(self, 'lockedTargetId'):
            if self.useFollowCamera:
                file_handler.write(indent + 'camera.target = scene.getMeshByID("' + self.lockedTargetId + '");\n')
            else:
                file_handler.write(indent + 'camera.lockedTarget = scene.getMeshByID("' + self.lockedTargetId + '");\n')
            
        super().core_script(file_handler, 'camera', indent, is_typescript) # Animations
#===============================================================================
class Light(FCurveAnimatable):
    def __init__(self, light):      
        super().__init__(light, False, True, False)
        
        self.name = light.name        
        TowerOfBabel.log('processing begun of light:  ' + self.name)
        light_type_items = {'POINT': POINT_LIGHT, 'SUN': DIRECTIONAL_LIGHT, 'SPOT': SPOT_LIGHT, 'HEMI': HEMI_LIGHT, 'AREA': 0}
        self.light_type = light_type_items[light.data.type]
        
        if self.light_type == POINT_LIGHT:
            self.position = light.location
            if light.data.use_sphere:
                self.range = light.data.distance            
            
        elif self.light_type == DIRECTIONAL_LIGHT:
            self.position = light.location
            self.direction = Light.get_direction(light.matrix_world)
            
        elif self.light_type == SPOT_LIGHT:
            self.position = light.location
            self.direction = Light.get_direction(light.matrix_world)
            self.angle = light.data.spot_size
            self.exponent = light.data.spot_blend * 2
            if light.data.use_sphere:
                self.range = light.data.distance            
            
        else:
            matrix_world = light.matrix_world.copy()
            matrix_world.translation = mathutils.Vector((0, 0, 0))
            self.direction = -(mathutils.Vector((0, 0, -1)) * matrix_world)
            self.groundColor = mathutils.Color((0, 0, 0))
            
        self.intensity = light.data.energy        
        self.diffuse   = light.data.color if light.data.use_diffuse  else mathutils.Color((0, 0, 0))
        self.specular  = light.data.color if light.data.use_specular else mathutils.Color((0, 0, 0))
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def to_scene_file(self, file_handler):     
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)        
        write_string(file_handler, 'id', self.name)        
        write_float(file_handler, 'type', self.light_type)
        
        if hasattr(self, 'position'   ): write_vector(file_handler, 'position'   , self.position   )
        if hasattr(self, 'direction'  ): write_vector(file_handler, 'direction'  , self.direction  )
        if hasattr(self, 'angle'      ): write_float (file_handler, 'angle'      , self.angle      )
        if hasattr(self, 'exponent'   ): write_float (file_handler, 'exponent'   , self.exponent   )
        if hasattr(self, 'groundColor'): write_color (file_handler, 'groundColor', self.groundColor)
        if hasattr(self, 'range'      ): write_float (file_handler, 'range'      , self.range      )
            
        write_float(file_handler, 'intensity', self.intensity)
        write_color(file_handler, 'diffuse', self.diffuse)
        write_color(file_handler, 'specular', self.specular)
            
        super().to_scene_file(file_handler) # Animations
        file_handler.write('}')     
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -        
    def core_script(self, file_handler, indent, is_typescript): 
        if self.light_type == POINT_LIGHT:
            file_handler.write(indent + 'light = new BABYLON.PointLight("' + self.name + '", new BABYLON.Vector3(' + format_vector(self.position) + '), scene);\n')

        elif self.light_type == DIRECTIONAL_LIGHT:
            file_handler.write(indent + 'light = new BABYLON.DirectionalLight("' + self.name + '", new BABYLON.Vector3(' + format_vector(self.direction) + '), scene);\n')
            file_handler.write(indent + 'light.position = new BABYLON.Vector3(' + format_vector(self.position) + ');\n')

        elif self.light_type == SPOT_LIGHT:
            file_handler.write(indent + 'light = new BABYLON.SpotLight("' + self.name + '", new BABYLON.Vector3(' + format_vector(self.position) + 
                               '), new BABYLON.Vector3(' + format_vector(self.direction) + '), ' + format_f(self.angle) + ', ' + format_f(self.exponent) + ', scene);\n')

        else:
            file_handler.write(indent + 'light = new BABYLON.HemisphericLight("' + self.name + '", new BABYLON.Vector3(' + format_vector(self.direction) + '), scene);\n')
            file_handler.write(indent + 'light.groundColor = new BABYLON.Color3(' + format_color(self.groundColor) + ');\n')

        file_handler.write(indent + 'light.id = "' + self.name + '";\n')
        file_handler.write(indent + 'light.intensity = ' + format_f(self.intensity) + ';\n')

        if hasattr(self, 'range'):
            file_handler.write(indent + 'light.range = ' + format_f(self.range) + ';\n')

        file_handler.write(indent + 'light.diffuse = new BABYLON.Color3(' + format_color(self.diffuse) + ');\n')
        file_handler.write(indent + 'light.specular = new BABYLON.Color3(' + format_color(self.specular) + ');\n')
        super().core_script(file_handler, 'camera', indent, is_typescript) # Animations

    @staticmethod
    def get_direction(matrix):
        return (matrix.to_3x3() * mathutils.Vector((0.0, 0.0, -1.0))).normalized()
#===============================================================================
class ShadowGenerator:
    def __init__(self, lamp, scene):       
        TowerOfBabel.log('processing begun of shadows for light:  ' + lamp.name)
        self.useVarianceShadowMap = lamp.data.shadowMap == 'VAR' if True else False
        self.mapSize = lamp.data.shadowMapSize  
        self.lightId = lamp.name     
        
        self.shadowCasters = []
        for object in [object for object in scene.objects]:
            if (object.type == 'MESH' and object.data.castShadows):
                self.shadowCasters.append(object.name)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_bool(file_handler, 'useVarianceShadowMap', self.useVarianceShadowMap, True)    
        write_int(file_handler, 'mapSize', self.mapSize)  
        write_string(file_handler, 'lightId', self.lightId)     
        
        file_handler.write(',"renderList":[')
        first = True
        for caster in self.shadowCasters:
            if first != True:
                file_handler.write(',')
            first = False
            
            file_handler.write('"' + caster + '"')
            
        file_handler.write(']')         
        file_handler.write('}') 
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -        
    def core_script(self, file_handler, indent): 
        file_handler.write(indent + 'light = scene.getLightByID("' + self.lightId + '");\n')
        file_handler.write(indent + 'shadowGenerator = new BABYLON.ShadowGenerator(' + format_int(self.mapSize) + ', light);\n')
        file_handler.write(indent + 'shadowGenerator.useVarianceShadowMap = ' + format_bool(self.useVarianceShadowMap) + ';\n')
        file_handler.write(indent + 'renderList = shadowGenerator.getShadowMap().renderList;\n')
        for caster in self.shadowCasters:
           file_handler.write(indent + 'renderList.push(scene.getMeshByID("' + caster + '"));\n')
#===============================================================================
class MultiMaterial:
    def __init__(self, material_slots, idx):
        self.name = TowerOfBabel.nameSpace + '.' + 'Multimaterial#' + str(idx)
        TowerOfBabel.log('processing begun of multimaterial:  ' + self.name)
        self.materials = []

        for mat in material_slots:
            self.materials.append(TowerOfBabel.nameSpace + '.' + mat.name)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def to_scene_file(self, file_handler):       
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_string(file_handler, 'id', self.name)
        
        file_handler.write(',"materials":[')
        first = True
        for materialName in self.materials:
            if first != True:
                file_handler.write(',')
            file_handler.write('"' + materialName +'"')
            first = False
        file_handler.write(']')
        file_handler.write('}')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -        
    def core_script(self, file_handler, indent): 
        file_handler.write(indent + 'multiMaterial = new BABYLON.MultiMaterial("' + self.name + '", scene);\n')
        file_handler.write(indent + 'multiMaterial.id = "' + self.name + '";\n')

        for materialName in self.materials:
            file_handler.write(indent + 'multiMaterial.subMaterials.push(scene.getMaterialByID("' + materialName + '"));\n')
#===============================================================================
class Texture:
    def __init__(self, slot, level, texture, filepath):       
        # Copy image to output
        try:
            image = texture.texture.image
            imageFilepath = os.path.normpath(bpy.path.abspath(image.filepath))
            basename = os.path.basename(imageFilepath)
            targetdir = os.path.dirname(filepath)
            targetpath = os.path.join(targetdir, basename)
            
            if image.packed_file:
                image.save_render(targetpath)
            else:
                sourcepath = bpy.path.abspath(image.filepath)
                shutil.copy(sourcepath, targetdir)
        except:
            ex = sys.exc_info()
            TowerOfBabel.log_handler.write('Error encountered processing image file:  ' + imageFilepath + ', Error:  '+ str(ex[1]) + '\n')
            pass
        
        # Export
        self.slot = slot
        self.name = basename
        self.level = level
        self.hasAlpha = texture.texture.use_alpha
        
        if (texture.mapping == 'CUBE'):
            self.coordinatesMode = CUBIC_MODE
        if (texture.mapping == 'SPHERE'):
            self.coordinatesMode = SPHERICAL_MODE
        else:
            self.coordinatesMode = EXPLICIT_MODE
        
        self.uOffset = texture.offset.x
        self.vOffset = texture.offset.y
        self.uScale  = texture.scale.x
        self.vScale  = texture.scale.y
        self.uAng = 0
        self.vAng = 0     
        self.wAng = 0
        
        if (texture.texture.extension == 'REPEAT'):
            if (texture.texture.use_mirror_x):
                self.wrapU = MIRROR_ADDRESSMODE      
            else:
                self.wrapU = WRAP_ADDRESSMODE 
                
            if (texture.texture.use_mirror_y):	
                self.wrapV = MIRROR_ADDRESSMODE
            else:
                self.wrapV = WRAP_ADDRESSMODE
        else:
            self.wrapU = CLAMP_ADDRESSMODE     
            self.wrapU = CLAMP_ADDRESSMODE
            
        self.coordinatesIndex = 0
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def to_scene_file(self, file_handler):       
        file_handler.write(',"' + self.slot + '":{')
        write_string(file_handler, 'name', self.name, True)
        write_float(file_handler, 'level', self.level)
        write_float(file_handler, 'hasAlpha', self.hasAlpha)       
        write_int(file_handler, 'coordinatesMode', self.coordinatesMode)
        write_float(file_handler, 'uOffset', self.uOffset)
        write_float(file_handler, 'vOffset', self.vOffset)
        write_float(file_handler, 'uScale', self.uScale)
        write_float(file_handler, 'vScale', self.vScale)
        write_float(file_handler, 'uAng', self.uAng)
        write_float(file_handler, 'vAng', self.vAng)     
        write_float(file_handler, 'wAng', self.wAng)
        write_int(file_handler, 'wrapU', self.wrapU)     
        write_int(file_handler, 'wrapV', self.wrapV)
        write_int(file_handler, 'coordinatesIndex', self.coordinatesIndex)    
        file_handler.write('}') 
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -        
    def core_script(self, file_handler, indent): 
        file_handler.write(indent + 'texture = new BABYLON.Texture(' + MATERIALS_PATH_VAR + ' + "' + self.name + '", scene);\n')

        file_handler.write(indent + 'texture.name = ' + MATERIALS_PATH_VAR + ' + "' + self.name + '";\n')
        file_handler.write(indent + 'texture.hasAlpha = ' + format_bool(self.hasAlpha) + ';\n')
        file_handler.write(indent + 'texture.level = ' + format_f(self.level) + ';\n')

        file_handler.write(indent + 'texture.coordinatesIndex = ' + format_int(self.coordinatesIndex) + ';\n')
        file_handler.write(indent + 'texture.coordinatesMode = ' + format_int(self.coordinatesMode) + ';\n')
        file_handler.write(indent + 'texture.uOffset = ' + format_f(self.uOffset) + ';\n')
        file_handler.write(indent + 'texture.vOffset = ' + format_f(self.vOffset) + ';\n')
        file_handler.write(indent + 'texture.uScale = ' + format_f(self.uScale) + ';\n')
        file_handler.write(indent + 'texture.vScale = ' + format_f(self.vScale) + ';\n')
        file_handler.write(indent + 'texture.uAng = ' + format_f(self.uAng) + ';\n')
        file_handler.write(indent + 'texture.vAng = ' + format_f(self.vAng) + ';\n')
        file_handler.write(indent + 'texture.wAng = ' + format_f(self.wAng) + ';\n')

        file_handler.write(indent + 'texture.wrapU = ' + format_int(self.wrapU) + ';\n')
        file_handler.write(indent + 'texture.wrapV = ' + format_int(self.wrapV) + ';\n')
#===============================================================================
class Material:
    def __init__(self, material, scene, filepath):       
        self.name = TowerOfBabel.nameSpace + '.' + material.name        
        TowerOfBabel.log('processing begun of material:  ' + self.name)
        self.ambient = material.ambient * material.diffuse_color
        self.diffuse = material.diffuse_intensity * material.diffuse_color
        self.specular = material.specular_intensity * material.specular_color
        self.emissive = material.emit * material.diffuse_color       
        self.specularPower = material.specular_hardness
        self.alpha = material.alpha
        self.backFaceCulling = material.game_settings.use_backface_culling
                
        # Textures
        self.textures = []
        textures = [mtex for mtex in material.texture_slots if mtex and mtex.texture]
        for mtex in textures:
            if mtex.texture.type == 'IMAGE': 
                if mtex.texture.image:
                    if (mtex.use_map_color_diffuse and (mtex.texture_coords != 'REFLECTION')):
                        # Diffuse
                        self.textures.append(Texture('diffuseTexture', mtex.diffuse_color_factor, mtex, filepath))
                    if mtex.use_map_ambient:
                        # Ambient
                        self.textures.append(Texture('ambientTexture', mtex.ambient_factor, mtex, filepath))
                    if mtex.use_map_alpha:
                        # Opacity
                        self.textures.append(Texture('opacityTexture', mtex.alpha_factor, mtex, filepath))
                    if mtex.use_map_color_diffuse and (mtex.texture_coords == 'REFLECTION'):
                        # Reflection
                        self.textures.append(Texture('reflectionTexture', mtex.diffuse_color_factor, mtex, filepath))
                    if mtex.use_map_emit:
                        # Emissive
                        self.textures.append(Texture('emissiveTexture', mtex.emit_factor, mtex, filepath))     
                    if mtex.use_map_normal:
                        # Bump
                        self.textures.append(Texture('bumpTexture', mtex.emit_factor, mtex, filepath))  
                        
            else: #type ==  'STUCCI' or 'NOISE'
                 TowerOfBabel.warn('WARNING texture type not currently supported:  ' + mtex.texture.type + ', ignored.')
#                glsl_handler = open('/home/jeff/Desktop/' + mtex.texture.type + '.glsl', 'w')  
#                glsl_handler.write(shader['vertex'])                      
#                glsl_handler.write('\n//#############################################################################\n')                      
#                glsl_handler.write(shader['fragment'])
#                glsl_handler.close()
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def to_scene_file(self, file_handler):       
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)      
        write_string(file_handler, 'id', self.name)
        write_color(file_handler, 'ambient', self.ambient)
        write_color(file_handler, 'diffuse', self.diffuse)
        write_color(file_handler, 'specular', self.specular)
        write_color(file_handler, 'emissive', self.emissive)        
        write_float(file_handler, 'specularPower', self.specularPower)
        write_float(file_handler, 'alpha', self.alpha)
        write_bool(file_handler, 'backFaceCulling', self.backFaceCulling)
        first = True
        for texSlot in self.textures:
            if first != True:
                file_handler.write(',')
            first = False
            texSlot.to_scene_file(file_handler)
            
        file_handler.write('}') 
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -        
    def core_script(self, file_handler, indent):       
        file_handler.write(indent + 'material = new BABYLON.StandardMaterial("' + self.name + '", scene);\n')
        file_handler.write(indent + 'material.ambientColor  = new BABYLON.Color3(' + format_color(self.ambient) + ');\n')
        file_handler.write(indent + 'material.diffuseColor  = new BABYLON.Color3(' + format_color(self.diffuse) + ');\n')
        file_handler.write(indent + 'material.specularColor = new BABYLON.Color3(' + format_color(self.specular) + ');\n')
        file_handler.write(indent + 'material.emissiveColor = new BABYLON.Color3(' + format_color(self.emissive) + ');\n')
        file_handler.write(indent + 'material.specularPower = ' + format_f(self.specularPower) + ';\n')
        file_handler.write(indent + 'material.alpha =  '        + format_f(self.alpha        ) + ';\n')
        file_handler.write(indent + 'material.backFaceCulling = ' + format_bool(self.backFaceCulling) + ';\n')             
        for texSlot in self.textures:
            texSlot.core_script(file_handler, indent)
            file_handler.write(indent + 'material.' + texSlot.slot + ' = texture;\n')                      
#===============================================================================
class Animation:
    def __init__(self, dataType, framePerSecond, loopBehavior, name, propertyInBabylon):
        self.dataType = dataType
        self.framePerSecond = framePerSecond
        self.loopBehavior = loopBehavior
        self.name = name
        self.propertyInBabylon = propertyInBabylon
        
        #keys
        self.frames = []
        self.values = [] # vector3 for ANIMATIONTYPE_VECTOR3 & matrices for ANIMATIONTYPE_MATRIX
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    # for auto animate
    def get_first_frame(self): 
        return self.frames[0] if len(self.frames) > 0 else -1
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    # for auto animate
    def get_last_frame(self): 
        return self.frames[len(self.frames) - 1] if len(self.frames) > 0 else -1
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -                
    def to_scene_file(self, file_handler): 
        file_handler.write('{')
        write_int(file_handler, 'dataType', self.dataType, True)
        write_int(file_handler, 'framePerSecond', self.framePerSecond)
        
        file_handler.write(',"keys":[')
        first = True
        for frame_idx in range(len(self.frames)):
            if first != True:
                file_handler.write(',')
            first = False
            file_handler.write('{')
            write_int(file_handler, 'frame', self.frames[frame_idx], True)
            if self.dataType == ANIMATIONTYPE_MATRIX:
                write_matrix4(file_handler, 'values', self.values[frame_idx])
            else:
                write_vector(file_handler, 'values', self.values[frame_idx])
            file_handler.write('}')

        file_handler.write(']')   # close keys
        
        # put this at the end to make less crazy looking ]}]]]}}}}}}}]]]], 
        # since animation is also at the end of the bone, mesh, camera, or light
        write_int(file_handler, 'loopBehavior', self.loopBehavior)
        write_string(file_handler, 'name', self.name)
        write_string(file_handler, 'property', self.propertyInBabylon)
        file_handler.write('}')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  
    # assigns the var 'animation', which the caller has already defined
    # .babylon writes 'values', but the babylonFileLoader reads it, changing it to 'value'
    def core_script(self, file_handler, indent): 
        file_handler.write(indent + 'animation = new BABYLON.Animation("' + self.name + '", "' + 
                                                                             self.propertyInBabylon + '", ' + 
                                                                             format_int(self.framePerSecond) + ', ' + 
                                                                             format_int(self.dataType) + ', ' + 
                                                                             format_int(self.loopBehavior) + ');\n')
        file_handler.write(indent + 'animation.setKeys([\n')
        nFrames = len(self.frames)
        for frame_idx in range(nFrames):
            file_handler.write(indent + '{frame: ' + format_int(self.frames[frame_idx]) + ', value: ')
            if self.dataType == ANIMATIONTYPE_MATRIX:
                file_handler.write('BABYLON.Matrix.FromValues(' + format_matrix4(self.values[frame_idx]) + ')}')
            else:
                file_handler.write('new BABYLON.Vector3(' + format_vector(self.values[frame_idx]) + ')}')

            if frame_idx + 1 < nFrames:
                file_handler.write(',')
            file_handler.write('\n')

        file_handler.write(indent + ']);\n')
#===============================================================================
class VectorAnimation(Animation):
    def __init__(self, object, attrInBlender, propertyInBabylon, mult, xOffset = 0):
        super().__init__(ANIMATIONTYPE_VECTOR3, 30, ANIMATIONLOOPMODE_CYCLE, propertyInBabylon + ' animation', propertyInBabylon)
                    
        # capture  built up from fcurves
        frames = dict() 
        for fcurve in object.animation_data.action.fcurves:
            if fcurve.data_path == attrInBlender:
                for key in fcurve.keyframe_points: 
                    frame = key.co.x 
                    frames[frame] = 1
            
        #for each frame (next step ==> set for key frames)
        for Frame in sorted(frames):
            self.frames.append(Frame)
            bpy.context.scene.frame_set(int(Frame + bpy.context.scene.frame_start))
            self.values.append(scale_vector(getattr(object, attrInBlender), mult, xOffset))
#===============================================================================
#  module level formatting methods, called from multiple classes 
#===============================================================================
def legal_js_identifier(input):
    out = ''
    prefix = ''
    for char in input:
        if len(out) == 0:
            if char in '0123456789':
                # cannot take the chance that leading numbers being chopped of cause name conflicts, e.g (01.R & 02.R)
                prefix += char
                continue
            elif char.upper() not in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
                continue
            
        legal = char if char.upper() in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_' else '_'
        out += legal
        
    if len(prefix) > 0:
        out += '_' + prefix
    return out
    
def format_f(num):
    s = MAX_FLOAT_PRECISION % num # rounds to N decimal places while changing to string
    s = s.rstrip('0') # ignore trailing zeroes
    s = s.rstrip('.') # ignore trailing .
    return '0' if s == '-0' else s

def format_matrix4(matrix):
    tempMatrix = matrix.copy()
    tempMatrix.transpose()

    ret = ''
    first = True
    for vect in tempMatrix:
        if (first != True):
            ret +=','
        first = False;

        ret += format_f(vect[0]) + ',' + format_f(vect[1]) + ',' + format_f(vect[2]) + ',' + format_f(vect[3])

    return ret

def format_array3(array):
    return format_f(array[0]) + ',' + format_f(array[1]) + ',' + format_f(array[2])     

def format_array(array, max_per_line = MAX_VERTEX_ELEMENTS, indent = ''):
    ret = ''
    first = True
    nOnLine = 0
    for element in array:
        if (first != True):
            ret +=','
        first = False;
        
        ret += format_f(element)
        nOnLine += 1
        
        if nOnLine >= max_per_line:
            ret += '\n' + indent
            nOnLine = 0

    return ret

def format_color(color):
    return format_f(color.r) + ',' + format_f(color.g) + ',' + format_f(color.b)

def format_vector(vector):
    return format_f(vector.x) + ',' + format_f(vector.z) + ',' + format_f(vector.y)

def format_vector_array(vectorArray, max_per_line = MAX_VERTEX_ELEMENTS, indent = ''):
    ret = ''
    first = True
    nOnLine = 0
    for vector in vectorArray:
        if (first != True):
            ret +=','
        first = False;

        ret += format_vector(vector)
        nOnLine += 3
        
        if nOnLine >= max_per_line:
            ret += '\n' + indent
            nOnLine = 0

    return ret

def format_quaternion(quaternion):
    return format_f(quaternion.x) + ',' + format_f(quaternion.z) + ',' + format_f(quaternion.y) + ',' + format_f(-quaternion.w)

def format_int(int):
    candidate = str(int) # when int string of an int, if
    if '.' in candidate:
        return format_f(math.floor(int)) # format_f removes un-neccessary precision
    else:
        return candidate

def format_bool(bool):    
    if bool:
        return 'true'
    else:
        return 'false'

def scale_vector(vector, mult, xOffset = 0):
    ret = vector.copy()
    ret.x *= mult
    ret.x += xOffset
    ret.z *= mult
    ret.y *= mult
    return ret
#===============================================================================
# module level methods for writing JSON (.babylon) files
#===============================================================================
def write_matrix4(file_handler, name, matrix):
    file_handler.write(',"' + name + '":[' + format_matrix4(matrix) + ']')

def write_array(file_handler, name, array):
    file_handler.write('\n,"' + name + '":[' + format_array(array) + ']')

def write_array3(file_handler, name, array):
    file_handler.write(',"' + name + '":[' + format_array3(array) + ']')     

def write_color(file_handler, name, color):
    file_handler.write(',"' + name + '":[' + format_color(color) + ']')

def write_vector(file_handler, name, vector):
    file_handler.write(',"' + name + '":[' + format_vector(vector) + ']')

def write_vector_array(file_handler, name, vectorArray):
    file_handler.write('\n,"' + name + '":[' + format_vector_array(vectorArray) + ']')

def write_quaternion(file_handler, name, quaternion):
    file_handler.write(',"' + name  +'":[' + format_quaternion(quaternion) + ']')

def write_string(file_handler, name, string, noComma = False):
    if noComma == False:
        file_handler.write(',')
    file_handler.write('"' + name + '":"' + string + '"')

def write_float(file_handler, name, float):
    file_handler.write(',"' + name + '":' + format_f(float))

def write_int(file_handler, name, int, noComma = False):
    if noComma == False:
        file_handler.write(',')
    file_handler.write('"' + name + '":' + format_int(int))

def write_bool(file_handler, name, bool, noComma = False):    
    if noComma == False:
        file_handler.write(',') 
    file_handler.write('"' + name + '":' + format_bool(bool))
#===============================================================================
# custom properties definition and display 
bpy.types.Mesh.useFlatShading = bpy.props.BoolProperty(
    name='Use Flat Shading', 
    description='',
    default = False
)
bpy.types.Mesh.checkCollisions = bpy.props.BoolProperty(
    name='Check Collisions', 
    description='Indicates mesh should be checked that it does not run into anything.',
    default = False
)
bpy.types.Mesh.castShadows = bpy.props.BoolProperty(
    name='Cast Shadows', 
    description='',
    default = False
)
bpy.types.Mesh.receiveShadows = bpy.props.BoolProperty(
    name='Receive Shadows', 
    description='',
    default = False
)
bpy.types.Camera.checkCollisions = bpy.props.BoolProperty(
    name='Check Collisions', 
    description='',
    default = False
)
bpy.types.Camera.applyGravity = bpy.props.BoolProperty(
    name='Apply Gravity', 
    description='',
    default = False
)    
bpy.types.Camera.useFollowCamera = bpy.props.BoolProperty(
    name='Use Follow Camera', 
    description='',
    default = False
)
bpy.types.Camera.followHeight = bpy.props.IntProperty(
    name='Follow Height', 
    description='how high above the object to maintain the camera',
    default = 0
)    
bpy.types.Camera.followDistance = bpy.props.IntProperty(
    name='Follow Distance', 
    description='how far from the object to follow',
    default = 10
)    
bpy.types.Camera.followRotation = bpy.props.IntProperty(
    name='Follow rotation', 
    description='rotate around the object, use 180 to follow from the front of the object',
    default = 0
)    
bpy.types.Camera.ellipsoid = bpy.props.FloatVectorProperty(
    name='Ellipsoid', 
    description='',
    default = mathutils.Vector((0.2, 0.9, 0.2))
)
bpy.types.Lamp.shadowMap = bpy.props.EnumProperty(
    name='Shadow Map Type', 
    description='',
    items = (('NONE', 'None', 'No Shadow Maps'), ('STD', 'Standard', 'Use Standard Shadow Maps'), ('VAR', 'Variance', 'Use Variance Shadow Maps')),
    default = 'NONE'
) 
bpy.types.Lamp.shadowMapSize = bpy.props.IntProperty(
    name='Shadow Map Size', 
    description='',
    default = 512
)
class ObjectPanel(bpy.types.Panel):
    bl_label = 'Tower of Babel'
    bl_space_type = 'PROPERTIES'
    bl_region_type = 'WINDOW'
    bl_context = 'data'
    
    def draw(self, context):
        ob = context.object
        if not ob or not ob.data:
            return
            
        layout = self.layout
        isMesh = isinstance(ob.data, bpy.types.Mesh)
        isCamera = isinstance(ob.data, bpy.types.Camera)
        isLight = isinstance(ob.data, bpy.types.Lamp)
        
        if isMesh:   
            layout.prop(ob.data, 'useFlatShading') 
            layout.prop(ob.data, 'checkCollisions')     
            layout.prop(ob.data, 'castShadows')     
            layout.prop(ob.data, 'receiveShadows')   
        elif isCamera:
            layout.prop(ob.data, 'checkCollisions')
            layout.prop(ob.data, 'applyGravity')
            layout.prop(ob.data, 'ellipsoid')
            layout.prop(ob.data, 'useFollowCamera')
            layout.prop(ob.data, 'followHeight')
            layout.prop(ob.data, 'followDistance')
            layout.prop(ob.data, 'followRotation')
        elif isLight:
            layout.prop(ob.data, 'shadowMap')
            layout.prop(ob.data, 'shadowMapSize')        
