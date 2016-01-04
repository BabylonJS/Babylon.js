bl_info = {
    'name': 'Babylon.js',
    'author': 'David Catuhe, Jeff Palmer',
    'version': (4, 1, 0),
    'blender': (2, 75, 0),
    'location': 'File > Export > Babylon.js (.babylon)',
    'description': 'Export Babylon.js scenes (.babylon)',
    'wiki_url': 'https://github.com/BabylonJS/Babylon.js/tree/master/Exporters/Blender',
    'tracker_url': '',
    'category': 'Import-Export'}

import base64
import bpy
import bpy_extras.io_utils
import time
import io
import math
import mathutils
import os
import shutil
import sys, traceback # for writing errors to log file
#===============================================================================
# Registration the calling of the INFO_MT_file_export file selector
def menu_func(self, context):
    self.layout.operator(Main.bl_idname, text = 'Babylon.js [.babylon]')

def register():
    bpy.utils.register_module(__name__)
    bpy.types.INFO_MT_file_export.append(menu_func)

def unregister():
    bpy.utils.unregister_module(__name__)
    bpy.types.INFO_MT_file_export.remove(menu_func)

if __name__ == '__main__':
    register()
#===============================================================================
# output related constants
MAX_VERTEX_ELEMENTS = 65535
MAX_VERTEX_ELEMENTS_32Bit = 16777216
VERTEX_OUTPUT_PER_LINE = 100
MAX_FLOAT_PRECISION_INT = 4
MAX_FLOAT_PRECISION = '%.' + str(MAX_FLOAT_PRECISION_INT) + 'f'
COMPRESS_MATRIX_INDICES = True # this is True for .babylon exporter & False for TOB

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

# camera class names, never formally defined in Babylon, but used in babylonFileLoader
ARC_ROTATE_CAM = 'ArcRotateCamera'
DEV_ORIENT_CAM = 'DeviceOrientationCamera'
FOLLOW_CAM = 'FollowCamera'
FREE_CAM = 'FreeCamera'
GAMEPAD_CAM = 'GamepadCamera'
TOUCH_CAM = 'TouchCamera'
V_JOYSTICKS_CAM = 'VirtualJoysticksCamera'
VR_DEV_ORIENT_FREE_CAM ='VRDeviceOrientationFreeCamera'
WEB_VR_FREE_CAM = 'WebVRFreeCamera'

# 3D camera rigs, defined in BABYLON.Camera, must be strings to be in 'dropdown'
RIG_MODE_NONE = '0'
RIG_MODE_STEREOSCOPIC_ANAGLYPH = '10'
RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL = '11'
RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED = '12'
RIG_MODE_STEREOSCOPIC_OVERUNDER = '13'
RIG_MODE_VR = '20'

# used in Light constructor, never formally defined in Babylon, but used in babylonFileLoader
POINT_LIGHT = 0
DIRECTIONAL_LIGHT = 1
SPOT_LIGHT = 2
HEMI_LIGHT = 3

#used in ShadowGenerators
NO_SHADOWS = 'NONE'
STD_SHADOWS = 'STD'
POISSON_SHADOWS = 'POISSON'
VARIANCE_SHADOWS = 'VARIANCE'
BLUR_VARIANCE_SHADOWS = 'BLUR_VARIANCE'

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

DEFAULT_MATERIAL_NAMESPACE = 'Same as Filename'

# passed to Animation constructor from animatable objects, defined in BABYLON.Animation
#ANIMATIONTYPE_FLOAT = 0
ANIMATIONTYPE_VECTOR3 = 1
ANIMATIONTYPE_QUATERNION = 2
ANIMATIONTYPE_MATRIX = 3
#ANIMATIONTYPE_COLOR3 = 4

# passed to Animation constructor from animatable objects, defined in BABYLON.Animation
#ANIMATIONLOOPMODE_RELATIVE = 0
ANIMATIONLOOPMODE_CYCLE = 1
#ANIMATIONLOOPMODE_CONSTANT = 2
#===============================================================================
# Panel displayed in Scene Tab of properties, so settings can be saved in a .blend file
class ExporterSettingsPanel(bpy.types.Panel):
    bl_label = 'Exporter Settings'
    bl_space_type = 'PROPERTIES'
    bl_region_type = 'WINDOW'
    bl_context = 'scene'

    bpy.types.Scene.export_onlySelectedLayer = bpy.props.BoolProperty(
        name="Export only selected layers",
        description="Export only selected layers",
        default = False,
        )
    bpy.types.Scene.export_flatshadeScene = bpy.props.BoolProperty(
        name="Flat shade entire scene",
        description="Use face normals on all meshes.  Increases vertices.",
        default = False,
        )        
    bpy.types.Scene.attachedSound = bpy.props.StringProperty(
        name='Sound',
        description='',
        default = ''
        )
    bpy.types.Scene.loopSound = bpy.props.BoolProperty(
        name='Loop sound',
        description='',
        default = True
        )
    bpy.types.Scene.autoPlaySound = bpy.props.BoolProperty(
        name='Auto play sound',
        description='',
        default = True
        )
    bpy.types.Scene.inlineTextures = bpy.props.BoolProperty(
        name="inline textures",
        description="turn textures into encoded strings, for direct inclusion into source code",
        default = False,
        )

    def draw(self, context):
        layout = self.layout

        scene = context.scene
        layout.prop(scene, "export_onlySelectedLayer")
        layout.prop(scene, "export_flatshadeScene")
        layout.prop(scene, "inlineTextures")

        box = layout.box()
        box.prop(scene, 'attachedSound')
        box.prop(scene, 'autoPlaySound')
        box.prop(scene, 'loopSound')
#===============================================================================
class Main(bpy.types.Operator, bpy_extras.io_utils.ExportHelper):
    bl_idname = 'scene.babylon'         # module will not load with out it, also must have a dot
    bl_label = 'Export Babylon.js scene'            # used on the label of the actual 'save' button
    filename_ext = '.babylon'          # required to have one, although not really used

    filepath = bpy.props.StringProperty(subtype = 'FILE_PATH') # assigned once the file selector returns
    log_handler = None  # assigned in execute
    nameSpace   = None  # assigned in execute
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    nWarnings = 0
    @staticmethod
    def warn(msg, numTabIndent = 1, noNewLine = False):
        Main.log('WARNING: ' + msg, numTabIndent, noNewLine)
        Main.nWarnings += 1

    @staticmethod
    def log(msg, numTabIndent = 1, noNewLine = False):
        for i in range(numTabIndent):
            Main.log_handler.write('\t')

        Main.log_handler.write(msg)
        if not noNewLine: Main.log_handler.write('\n')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def getMaterial(self, baseMaterialId):
        fullName = Main.nameSpace + '.' + baseMaterialId
        for material in self.materials:
            if material.name == fullName:
                return material

        return None
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def getSourceMeshInstance(self, dataName):
        for mesh in self.meshesAndNodes:
            # nodes have no 'dataName', cannot be instanced in any case
            if hasattr(mesh, 'dataName') and mesh.dataName == dataName:
                return mesh

        return None
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def execute(self, context):
        scene = context.scene
        self.scene = scene # reference for passing
        try:
            start_time = time.time()
            filepathDotExtension = self.filepath.rpartition('.')
            self.filepathMinusExtension = filepathDotExtension[0]

            # assign nameSpace, based on OS
            if self.filepathMinusExtension.find('\\') != -1:
                Main.nameSpace = legal_js_identifier(self.filepathMinusExtension.rpartition('\\')[2])
            else:
                Main.nameSpace = legal_js_identifier(self.filepathMinusExtension.rpartition('/')[2])

            # explicitly reset globals, in case there was an earlier export this session
            Main.nWarnings = 0

            Main.log_handler = io.open(self.filepathMinusExtension + '.log', 'w', encoding='utf8')
            version = bl_info['version']
            Main.log('Exporter version: ' + str(version[0]) + '.' + str(version[1]) +  '.' + str(version[2]) +
                             ', Blender version: ' + bpy.app.version_string)

            if bpy.ops.object.mode_set.poll():
                bpy.ops.object.mode_set(mode = 'OBJECT')

            Main.log('========= Conversion from Blender to Babylon.js =========', 0)
            Main.log('Scene settings used:', 1)
            Main.log('selected layers only:  ' + format_bool(scene.export_onlySelectedLayer), 2)
            Main.log('flat shading entire scene:  ' + format_bool(scene.export_flatshadeScene), 2)
            Main.log('inline textures:  ' + format_bool(scene.inlineTextures), 2)
            self.world = World(scene)

            bpy.ops.screen.animation_cancel()
            currentFrame = bpy.context.scene.frame_current
            bpy.context.scene.frame_set(0)

            # Active camera
            if scene.camera != None:
                self.activeCamera = scene.camera.name
            else:
                Main.warn('No active camera has been assigned, or is not in a currently selected Blender layer')

            self.cameras = []
            self.lights = []
            self.shadowGenerators = []
            self.skeletons = []
            skeletonId = 0
            self.meshesAndNodes = []
            self.materials = []
            self.multiMaterials = []
            self.sounds = []

            # Scene level sound
            if scene.attachedSound != '':
                self.sounds.append(Sound(scene.attachedSound, scene.autoPlaySound, scene.loopSound))

            # exclude lamps in this pass, so ShadowGenerator constructor can be passed meshesAnNodes
            for object in [object for object in scene.objects]:
                if object.type == 'CAMERA':
                    if object.is_visible(scene): # no isInSelectedLayer() required, is_visible() handles this for them
                        self.cameras.append(Camera(object))
                    else:
                        Main.warn('The following camera not visible in scene thus ignored: ' + object.name)

                elif object.type == 'ARMATURE':  #skeleton.pose.bones
                    if object.is_visible(scene):
                        self.skeletons.append(Skeleton(object, scene, skeletonId))
                        skeletonId += 1
                    else:
                        Main.warn('The following armature not visible in scene thus ignored: ' + object.name)

                elif object.type == 'MESH':
                    forcedParent = None
                    nameID = ''
                    nextStartFace = 0

                    while True and self.isInSelectedLayer(object, scene):
                        mesh = Mesh(object, scene, nextStartFace, forcedParent, nameID, self)
                        if hasattr(mesh, 'instances'):
                            self.meshesAndNodes.append(mesh)
                        else:
                            break

                        if object.data.attachedSound != '':
                            self.sounds.append(Sound(object.data.attachedSound, object.data.autoPlaySound, object.data.loopSound, object))

                        nextStartFace = mesh.offsetFace
                        if nextStartFace == 0:
                            break

                        if forcedParent is None:
                            nameID = 0
                            forcedParent = object
                            Main.warn('The following mesh has exceeded the maximum # of vertex elements & will be broken into multiple Babylon meshes: ' + object.name)

                        nameID = nameID + 1

                elif object.type == 'EMPTY':
                    self.meshesAndNodes.append(Node(object))

                elif object.type != 'LAMP':
                    Main.warn('The following object (type - ' +  object.type + ') is not currently exportable thus ignored: ' + object.name)

            # Lamp / shadow Generator pass; meshesAnNodes complete & forceParents included
            for object in [object for object in scene.objects]:
                if object.type == 'LAMP':
                    if object.is_visible(scene): # no isInSelectedLayer() required, is_visible() handles this for them
                        bulb = Light(object)
                        self.lights.append(bulb)
                        if object.data.shadowMap != 'NONE':
                            if bulb.light_type == DIRECTIONAL_LIGHT or bulb.light_type == SPOT_LIGHT:
                                self.shadowGenerators.append(ShadowGenerator(object, self.meshesAndNodes, scene))
                            else:
                                Main.warn('Only directional (sun) and spot types of lamp are valid for shadows thus ignored: ' + object.name)
                    else:
                        Main.warn('The following lamp not visible in scene thus ignored: ' + object.name)

            bpy.context.scene.frame_set(currentFrame)

            # output file
            self.to_scene_file   ()

        except:# catch *all* exceptions
            ex = sys.exc_info()
            Main.log('========= An error was encountered =========', 0)
            stack = traceback.format_tb(ex[2])
            for line in stack:
               Main.log_handler.write(line) # avoid tabs & extra newlines by not calling log() inside catch

            Main.log_handler.write('ERROR:  ' + str(ex[1]) + '\n')
            raise

        finally:
            Main.log('========= end of processing =========', 0)
            elapsed_time = time.time() - start_time
            minutes = math.floor(elapsed_time / 60)
            seconds = elapsed_time - (minutes * 60)
            Main.log('elapsed time:  ' + str(minutes) + ' min, ' + format_f(seconds) + ' secs', 0)
            Main.log_handler.close()

            if (Main.nWarnings > 0):
                self.report({'WARNING'}, 'Processing completed, but ' + str(Main.nWarnings) + ' WARNINGS were raised,  see log file.')

        return {'FINISHED'}
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self):
        Main.log('========= Writing of scene file started =========', 0)
        # Open file
        file_handler = io.open(self.filepathMinusExtension + '.babylon', 'w', encoding='utf8')
        file_handler.write('{')
        self.world.to_scene_file(file_handler)

        # Materials
        file_handler.write(',\n"materials":[')
        first = True
        for material in self.materials:
            if first != True:
                file_handler.write(',\n')

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
        for m in range(0, len(self.meshesAndNodes)):
            mesh = self.meshesAndNodes[m]
            if first != True:
                file_handler.write(',')

            first = False
            mesh.to_scene_file(file_handler)
        file_handler.write(']')

        # Cameras
        file_handler.write(',\n"cameras":[')
        first = True
        for camera in self.cameras:
            if hasattr(camera, 'fatalProblem'): continue
            if first != True:
                file_handler.write(',')

            first = False
            camera.update_for_target_attributes(self.meshesAndNodes)
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

        # Sounds
        if len(self.sounds) > 0:
            file_handler.write('\n,"sounds":[')
            first = True
            for sound in self.sounds:
                if first != True:
                    file_handler.write(',')

                first = False
                sound.to_scene_file(file_handler)

            file_handler.write(']')

        # Closing
        file_handler.write('\n}')
        file_handler.close()
        Main.log('========= Writing of scene file completed =========', 0)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def isInSelectedLayer(self, obj, scene):
        if not scene.export_onlySelectedLayer:
            return True

        for l in range(0, len(scene.layers)):
            if obj.layers[l] and scene.layers[l]:
                return True
        return False
#===============================================================================
class World:
    def __init__(self, scene):
        self.autoClear = True
        world = scene.world
        if world:
            self.ambient_color = world.ambient_color
            self.clear_color   = world.horizon_color
        else:
            self.ambient_color = mathutils.Color((0.2, 0.2, 0.3))
            self.clear_color   = mathutils.Color((0.0, 0.0, 0.0))

        self.gravity = scene.gravity

        if world and world.mist_settings.use_mist:
            self.fogMode = FOGMODE_LINEAR
            self.fogColor = world.horizon_color
            self.fogStart = world.mist_settings.start
            self.fogEnd = world.mist_settings.depth
            self.fogDensity = 0.1

        Main.log('Python World class constructor completed')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        write_bool(file_handler, 'autoClear', self.autoClear, True)
        write_color(file_handler, 'clearColor', self.clear_color)
        write_color(file_handler, 'ambientColor', self.ambient_color)
        write_vector(file_handler, 'gravity', self.gravity)

        if hasattr(self, 'fogMode'):
            write_int(file_handler, 'fogMode', self.fogMode)
            write_color(file_handler, 'fogColor', self.fogColor)
            write_float(file_handler, 'fogStart', self.fogStart)
            write_float(file_handler, 'fogEnd', self.fogEnd)
            write_float(file_handler, 'fogDensity', self.fogDensity)

#===============================================================================
class Sound:
    def __init__(self, name, autoplay, loop, connectedMesh = None):
        self.name = name;
        self.autoplay = autoplay
        self.loop = loop
        if connectedMesh != None:
            self.connectedMeshId = connectedMesh.name
            self.maxDistance = connectedMesh.data.maxSoundDistance
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_bool(file_handler, 'autoplay', self.autoplay)
        write_bool(file_handler, 'loop', self.loop)

        if hasattr(self, 'connectedMeshId'):
            write_string(file_handler, 'connectedMeshId', self.connectedMeshId)
            write_float(file_handler, 'maxDistance', self.maxDistance)
        file_handler.write('}')
#===============================================================================
class FCurveAnimatable:
    def __init__(self, object, supportsRotation, supportsPosition, supportsScaling, xOffsetForRotation = 0):

        # just because a sub-class can be animatable does not mean it is
        self.animationsPresent = object.animation_data and object.animation_data.action

        rotAnim = False
        locAnim = False
        scaAnim = False
        useQuat = object.rotation_mode=='QUATERNION'

        if (self.animationsPresent):
            Main.log('FCurve animation processing begun for:  ' + object.name, 1)
            self.animations = []
            for fcurve in object.animation_data.action.fcurves:
                if supportsRotation and fcurve.data_path == 'rotation_euler' and rotAnim == False and useQuat == False:
                    self.animations.append(VectorAnimation(object, 'rotation_euler', 'rotation', -1, xOffsetForRotation))
                    rotAnim = True
                elif supportsRotation and fcurve.data_path == 'rotation_quaternion' and rotAnim == False and useQuat == True:
                    self.animations.append(QuaternionAnimation(object, 'rotation_quaternion', 'rotationQuaternion', 1, xOffsetForRotation))
                    rotAnim = True
                elif supportsPosition and fcurve.data_path == 'location' and locAnim == False:
                    self.animations.append(VectorAnimation(object, 'location', 'position', 1))
                    locAnim = True
                elif supportsScaling and fcurve.data_path == 'scale' and scaAnim == False:
                    self.animations.append(VectorAnimation(object, 'scale', 'scaling', 1))
                    scaAnim = True
            #Set Animations

            if (hasattr(object.data, "autoAnimate") and object.data.autoAnimate):
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

            if (hasattr(self, "autoAnimate") and self.autoAnimate):
                write_bool(file_handler, 'autoAnimate', self.autoAnimate)
                write_int(file_handler, 'autoAnimateFrom', self.autoAnimateFrom)
                write_int(file_handler, 'autoAnimateTo', self.autoAnimateTo)
                write_bool(file_handler, 'autoAnimateLoop', self.autoAnimateLoop)
#===============================================================================
class Mesh(FCurveAnimatable):
    def __init__(self, object, scene, startFace, forcedParent, nameID, exporter):
        super().__init__(object, True, True, True)  #Should animations be done when forcedParent

        self.name = object.name + str(nameID)
        Main.log('processing begun of mesh:  ' + self.name)
        self.isVisible = not object.hide_render
        self.isEnabled = not object.data.loadDisabled
        useFlatShading = scene.export_flatshadeScene or object.data.useFlatShading
        self.checkCollisions = object.data.checkCollisions
        self.receiveShadows = object.data.receiveShadows
        self.castShadows = object.data.castShadows
        self.freezeWorldMatrix = object.data.freezeWorldMatrix

        # hasSkeleton detection & skeletonID determination
        hasSkeleton = False
        objArmature = None      # if there's an armature, this will be the one!
        if len(object.vertex_groups) > 0:
            objArmature = object.find_armature()
            if objArmature != None:
                hasSkeleton = True
                i = 0
                for obj in scene.objects:
                    if obj.type == "ARMATURE":
                        if obj == objArmature:
                            self.skeletonId = i
                            break
                        else:
                            i += 1

        # determine Position, rotation, & scaling
        if forcedParent is None:
            # Use local matrix
            locMatrix = object.matrix_local
            if objArmature != None:
                # unless the armature is the parent
                if object.parent and object.parent == objArmature:
                    locMatrix = object.matrix_world * object.parent.matrix_world.inverted()

            loc, rot, scale = locMatrix.decompose()
            self.position = loc
            if object.rotation_mode == 'QUATERNION':
                self.rotationQuaternion = rot
            else:
                self.rotation = scale_vector(rot.to_euler('XYZ'), -1)
            self.scaling  = scale
        else:
            # use defaults when not None
            self.position = mathutils.Vector((0, 0, 0))
            self.rotation = scale_vector(mathutils.Vector((0, 0, 0)), 1) # isn't scaling 0's by 1 same as 0?
            self.scaling  = mathutils.Vector((1, 1, 1))

        # determine parent & dataName
        if forcedParent is None:
            self.dataName = object.data.name # used to support shared vertex instances in later passed
            if object.parent and object.parent.type != 'ARMATURE':
                self.parentId = object.parent.name
        else:
            self.dataName = self.name
            self.parentId = forcedParent.name

        # Get if this will be an instance of another, before processing materials, to avoid multi-bakes
        sourceMesh = exporter.getSourceMeshInstance(self.dataName)
        if sourceMesh is not None:
            #need to make sure rotation mode matches, since value initially copied in InstancedMesh constructor
            if hasattr(sourceMesh, 'rotationQuaternion'):
                instRot = None
                instRotq = rot
            else:
                instRot = scale_vector(rot.to_euler('XYZ'), -1)
                instRotq = None

            instance = MeshInstance(self.name, self.position, instRot, instRotq, self.scaling, self.freezeWorldMatrix)
            sourceMesh.instances.append(instance)
            Main.log('mesh is an instance of :  ' + sourceMesh.name + '.  Processing halted.', 2)
            return
        else:
            self.instances = []

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

        # process all of the materials required
        maxVerts = MAX_VERTEX_ELEMENTS # change for multi-materials
        recipe = BakingRecipe(object)
        self.billboardMode = recipe.billboardMode

        if recipe.needsBaking:
            if recipe.multipleRenders:
                Main.warn('Mixing of Cycles & Blender Render in same mesh not supported.  No materials exported.', 2)
            else:
                bakedMat = BakedMaterial(exporter, object, recipe)
                exporter.materials.append(bakedMat)
                self.materialId = bakedMat.name

        else:
            bjs_material_slots = []
            for slot in object.material_slots:
                # None will be returned when either the first encounter or must be unique due to baked textures
                material = exporter.getMaterial(slot.name)
                if (material != None):
                    Main.log('registered as also a user of material:  ' + slot.name, 2)
                else:
                    material = StdMaterial(slot, exporter, object)
                    exporter.materials.append(material)

                bjs_material_slots.append(material)

            if len(bjs_material_slots) == 1:
                self.materialId = bjs_material_slots[0].name

            elif len(bjs_material_slots) > 1:
                multimat = MultiMaterial(bjs_material_slots, len(exporter.multiMaterials))
                self.materialId = multimat.name
                exporter.multiMaterials.append(multimat)
                maxVerts = MAX_VERTEX_ELEMENTS_32Bit
            else:
                Main.warn('No materials have been assigned: ', 2)

        # Get mesh
        mesh = object.to_mesh(scene, True, 'PREVIEW')

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
            which = len(mesh.tessface_uv_textures) - 1 if recipe.needsBaking else 0
            UVmap = mesh.tessface_uv_textures[which].data

        hasUV2 = len(mesh.tessface_uv_textures) > 1 and not recipe.needsBaking
        if hasUV2:
            UV2map = mesh.tessface_uv_textures[1].data

        hasVertexColor = len(mesh.vertex_colors) > 0
        if hasVertexColor:
            Colormap = mesh.tessface_vertex_colors.active.data

        if hasSkeleton:
            weightsPerVertex = []
            indicesPerVertex = []
            influenceCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0] # 9, so accessed orign 1; 0 used for all those greater than 8
            totalInfluencers = 0
            highestInfluenceObserved = 0

        # used tracking of vertices as they are received
        alreadySavedVertices = []
        vertices_Normals = []
        vertices_UVs = []
        vertices_UV2s = []
        vertices_Colors = []
        vertices_indices = []
        vertices_sk_weights = []
        vertices_sk_indices = []

        self.offsetFace = 0

        for v in range(0, len(mesh.vertices)):
            alreadySavedVertices.append(False)
            vertices_Normals.append([])
            vertices_UVs.append([])
            vertices_UV2s.append([])
            vertices_Colors.append([])
            vertices_indices.append([])
            vertices_sk_weights.append([])
            vertices_sk_indices.append([])

        materialsCount = 1 if recipe.needsBaking else max(1, len(object.material_slots))
        verticesCount = 0
        indicesCount = 0

        for materialIndex in range(materialsCount):
            if self.offsetFace != 0:
                break

            subMeshVerticesStart = verticesCount
            subMeshIndexStart = indicesCount

            for faceIndex in range(startFace, len(mesh.tessfaces)):  # For each face
                face = mesh.tessfaces[faceIndex]

                if face.material_index != materialIndex and not recipe.needsBaking:
                    continue

                if verticesCount + 3 > maxVerts:
                    self.offsetFace = faceIndex
                    break

                for v in range(3): # For each vertex in face
                    vertex_index = face.vertices[v]

                    vertex = mesh.vertices[vertex_index]
                    position = vertex.co
                    normal = face.normal if useFlatShading else vertex.normal
                    
                    #skeletons
                    if hasSkeleton:
                        matricesWeights = []
                        matricesIndices = []

                        # Getting influences
                        for group in vertex.groups:
                            index = group.group
                            weight = group.weight

                            for boneIndex, bone in enumerate(objArmature.pose.bones):
                                if object.vertex_groups[index].name == bone.name:
                                    matricesWeights.append(weight)
                                    matricesIndices.append(boneIndex)

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
                    alreadySaved = alreadySavedVertices[vertex_index] and not useFlatShading
                    if alreadySaved:
                        alreadySaved = False

                        # UV
                        index_UV = 0
                        for savedIndex in vertices_indices[vertex_index]:
                            vNormal = vertices_Normals[vertex_index][index_UV]
                            if (normal.x != vNormal.x or normal.y != vNormal.y or normal.z != vNormal.z):
                                continue;
                            
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

                            if hasSkeleton:
                                vSkWeight = vertices_sk_weights[vertex_index]
                                vSkIndices = vertices_sk_indices[vertex_index]
                                if not same_array(vSkWeight[index_UV], matricesWeights) or not same_array(vSkIndices[index_UV], matricesIndices):
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
                        alreadySavedVertices[vertex_index] = True
                        
                        vertices_Normals[vertex_index].append(normal)                        
                        self.normals.append(normal)
                        
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
                            self.colors.append(1.0)
                        if hasSkeleton:
                            vertices_sk_weights[vertex_index].append(matricesWeights)
                            vertices_sk_indices[vertex_index].append(matricesIndices)
                            nInfluencers = len(matricesWeights)
                            totalInfluencers += nInfluencers
                            if nInfluencers <= 8:
                                influenceCounts[nInfluencers] += 1
                            else:
                                influenceCounts[0] += 1
                            highestInfluenceObserved = nInfluencers if nInfluencers > highestInfluenceObserved else highestInfluenceObserved
                            weightsPerVertex.append(matricesWeights)
                            indicesPerVertex.append(matricesIndices)

                        vertices_indices[vertex_index].append(index)

                        self.positions.append(position)

                        verticesCount += 1
                    self.indices.append(index)
                    indicesCount += 1

            self.subMeshes.append(SubMesh(materialIndex, subMeshVerticesStart, subMeshIndexStart, verticesCount - subMeshVerticesStart, indicesCount - subMeshIndexStart))

        if verticesCount > MAX_VERTEX_ELEMENTS:
            Main.warn('Due to multi-materials / Shapekeys & this meshes size, 32bit indices must be used.  This may not run on all hardware.', 2)

        BakedMaterial.meshBakingClean(object)

        Main.log('num positions      :  ' + str(len(self.positions)), 2)
        Main.log('num normals        :  ' + str(len(self.normals  )), 2)
        Main.log('num uvs            :  ' + str(len(self.uvs      )), 2)
        Main.log('num uvs2           :  ' + str(len(self.uvs2     )), 2)
        Main.log('num colors         :  ' + str(len(self.colors   )), 2)
        Main.log('num indices        :  ' + str(len(self.indices  )), 2)
        if hasSkeleton:
            Main.log('Skeleton stats:  ', 2)
            self.toFixedInfluencers(weightsPerVertex, indicesPerVertex, object.data.maxInfluencers, highestInfluenceObserved)

            if (COMPRESS_MATRIX_INDICES):
                self.skeletonIndices = Mesh.packSkeletonIndices(self.skeletonIndices)
                if (self.numBoneInfluencers > 4):
                    self.skeletonIndicesExtra = Mesh.packSkeletonIndices(self.skeletonIndicesExtra)
                
            Main.log('Total Influencers:  ' + format_f(totalInfluencers), 3)
            Main.log('Avg # of influencers per vertex:  ' + format_f(totalInfluencers / len(self.positions)), 3)
            Main.log('Highest # of influencers observed:  ' + str(highestInfluenceObserved) + ', num vertices with this:  ' + format_int(influenceCounts[highestInfluenceObserved if highestInfluenceObserved < 9 else 0]), 3)
            Main.log('exported as ' + str(self.numBoneInfluencers) + ' influencers', 3)
            nWeights = len(self.skeletonWeights) + len(self.skeletonWeightsExtra) if hasattr(self, 'skeletonWeightsExtra') else 0
            Main.log('num skeletonWeights and skeletonIndices:  ' + str(nWeights), 3)

        numZeroAreaFaces = self.find_zero_area_faces()
        if numZeroAreaFaces > 0:
            Main.warn('# of 0 area faces found:  ' + str(numZeroAreaFaces), 2)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def find_zero_area_faces(self):
        nFaces = int(len(self.indices) / 3)
        nZeroAreaFaces = 0
        for f in range(0, nFaces):
            faceOffset = f * 3
            p1 = self.positions[self.indices[faceOffset    ]]
            p2 = self.positions[self.indices[faceOffset + 1]]
            p3 = self.positions[self.indices[faceOffset + 2]]

            if same_vertex(p1, p2) or same_vertex(p1, p3) or same_vertex(p2, p3): nZeroAreaFaces += 1

        return nZeroAreaFaces
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
    def toFixedInfluencers(self, weightsPerVertex, indicesPerVertex, maxInfluencers, highestObserved):
        if (maxInfluencers > 8 or maxInfluencers < 1):
            maxInfluencers = 8
            Main.warn('Maximum # of influencers invalid, set to 8', 3)
            
        self.numBoneInfluencers = maxInfluencers if maxInfluencers < highestObserved else highestObserved
        needExtras = self.numBoneInfluencers > 4
        
        maxInfluencersExceeded = 0
        
        fixedWeights = []
        fixedIndices = []
        
        fixedWeightsExtra = []
        fixedIndicesExtra = []
        
        for i in range(len(weightsPerVertex)):
            weights = weightsPerVertex[i]
            indices = indicesPerVertex[i]
            nInfluencers = len(weights)
            
            if (nInfluencers > self.numBoneInfluencers):
                maxInfluencersExceeded += 1
                Mesh.sortByDescendingInfluence(weights, indices)
                
            for j in range(4):
                fixedWeights.append(weights[j] if nInfluencers > j else 0.0)
                fixedIndices.append(indices[j] if nInfluencers > j else 0  )
                
            if needExtras:
                for j in range(4, 8):
                    fixedWeightsExtra.append(weights[j] if nInfluencers > j else 0.0)
                    fixedIndicesExtra.append(indices[j] if nInfluencers > j else 0  )
                            
        self.skeletonWeights = fixedWeights
        self.skeletonIndices = fixedIndices
        
        if needExtras:
            self.skeletonWeightsExtra = fixedWeightsExtra
            self.skeletonIndicesExtra = fixedIndicesExtra
            
        if maxInfluencersExceeded > 0:
            Main.warn('Maximum # of influencers exceeded for ' + format_int(maxInfluencersExceeded) + ' vertices, extras ignored', 3)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # sorts one set of weights & indices by descending weight, by reference
    # not shown to help with MakeHuman, but did not hurt.  In just so it is not lost for future.
    @staticmethod
    def sortByDescendingInfluence(weights, indices):
        notSorted = True
        while(notSorted):
            notSorted = False
            for idx in range(1, len(weights)):
                if weights[idx - 1] < weights[idx]:
                    tmp = weights[idx]
                    weights[idx    ] = weights[idx - 1]
                    weights[idx - 1] = tmp
                    
                    tmp = indices[idx]
                    indices[idx    ] = indices[idx - 1]
                    indices[idx - 1] = tmp
                    
                    notSorted = True    
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # assume that toFixedInfluencers has already run, which ensures indices length is a multiple of 4
    @staticmethod
    def packSkeletonIndices(indices):
        compressedIndices = []

        for i in range(math.floor(len(indices) / 4)):
            idx = i * 4
            matricesIndicesCompressed  = indices[idx    ]
            matricesIndicesCompressed += indices[idx + 1] <<  8
            matricesIndicesCompressed += indices[idx + 2] << 16
            matricesIndicesCompressed += indices[idx + 3] << 24
            
            compressedIndices.append(matricesIndicesCompressed)
            
        return compressedIndices
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_string(file_handler, 'id', self.name)
        if hasattr(self, 'parentId'): write_string(file_handler, 'parentId', self.parentId)

        if hasattr(self, 'materialId'): write_string(file_handler, 'materialId', self.materialId)
        write_int(file_handler, 'billboardMode', self.billboardMode)
        write_vector(file_handler, 'position', self.position)

        if hasattr(self, "rotationQuaternion"):
            write_quaternion(file_handler, 'rotationQuaternion', self.rotationQuaternion)
        else:
            write_vector(file_handler, 'rotation', self.rotation)

        write_vector(file_handler, 'scaling', self.scaling)
        write_bool(file_handler, 'isVisible', self.isVisible)
        write_bool(file_handler, 'freezeWorldMatrix', self.freezeWorldMatrix)
        write_bool(file_handler, 'isEnabled', self.isEnabled)
        write_bool(file_handler, 'checkCollisions', self.checkCollisions)
        write_bool(file_handler, 'receiveShadows', self.receiveShadows)

        if hasattr(self, 'physicsImpostor'):
            write_int(file_handler, 'physicsImpostor', self.physicsImpostor)
            write_float(file_handler, 'physicsMass', self.physicsMass)
            write_float(file_handler, 'physicsFriction', self.physicsFriction)
            write_float(file_handler, 'physicsRestitution', self.physicsRestitution)

        # Geometry
        if hasattr(self, 'skeletonId'): 
            write_int(file_handler, 'skeletonId', self.skeletonId)
            write_int(file_handler, 'numBoneInfluencers', self.numBoneInfluencers)

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
            write_array(file_handler, 'matricesIndices', self.skeletonIndices)

        if hasattr(self, 'skeletonWeightsExtra'):
            write_array(file_handler, 'matricesWeightsExtra', self.skeletonWeightsExtra)
            write_array(file_handler, 'matricesIndicesExtra', self.skeletonIndicesExtra)

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
        for instance in self.instances:
            if first == False:
                file_handler.write(',')

            instance.to_scene_file(file_handler)

            first = False
        file_handler.write(']')

        # Close mesh
        file_handler.write('}\n')
        self.alreadyExported = True
#===============================================================================
class MeshInstance:
     def __init__(self, name, position, rotation, rotationQuaternion, scaling, freezeWorldMatrix):
        self.name = name
        self.position = position
        if rotation is not None:
            self.rotation = rotation
        if rotationQuaternion is not None:
            self.rotationQuaternion = rotationQuaternion
        self.scaling = scaling
        self.freezeWorldMatrix = freezeWorldMatrix
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
     def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_vector(file_handler, 'position', self.position)
        if hasattr(self, 'rotation'):
            write_vector(file_handler, 'rotation', self.rotation)
        else:
            write_quaternion(file_handler, 'rotationQuaternion', self.rotationQuaternion)

        write_vector(file_handler, 'scaling', self.scaling)
        # freeze World Matrix currently ignored for instances
        write_bool(file_handler, 'freezeWorldMatrix', self.freezeWorldMatrix)
        file_handler.write('}')
#===============================================================================
class Node(FCurveAnimatable):
    def __init__(self, node):
        super().__init__(node, True, True, True)  #Should animations be done when forcedParent
        Main.log('processing begun of node:  ' + node.name)
        self.name = node.name

        if node.parent and node.parent.type != 'ARMATURE':
            self.parentId = node.parent.name

        loc, rot, scale = node.matrix_local.decompose()

        self.position = loc
        if node.rotation_mode == 'QUATERNION':
            self.rotationQuaternion = rot
        else:
            self.rotation = scale_vector(rot.to_euler('XYZ'), -1)
        self.scaling = scale
        self.isVisible = False
        self.isEnabled = True
        self.checkCollisions = False
        self.billboardMode = BILLBOARDMODE_NONE
        self.castShadows = False
        self.receiveShadows = False
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_string(file_handler, 'id', self.name)
        if hasattr(self, 'parentId'): write_string(file_handler, 'parentId', self.parentId)

        write_vector(file_handler, 'position', self.position)
        if hasattr(self, "rotationQuaternion"):
            write_quaternion(file_handler, "rotationQuaternion", self.rotationQuaternion)
        else:
            write_vector(file_handler, 'rotation', self.rotation)
        write_vector(file_handler, 'scaling', self.scaling)
        write_bool(file_handler, 'isVisible', self.isVisible)
        write_bool(file_handler, 'isEnabled', self.isEnabled)
        write_bool(file_handler, 'checkCollisions', self.checkCollisions)
        write_int(file_handler, 'billboardMode', self.billboardMode)
        write_bool(file_handler, 'receiveShadows', self.receiveShadows)

        super().to_scene_file(file_handler) # Animations
        file_handler.write('}')
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
#===============================================================================
class Bone:
    def __init__(self, bone, skeleton, scene, index):
        Main.log('processing begun of bone:  ' + bone.name + ', index:  '+ str(index), 2)
        self.name = bone.name
        self.length = bone.length
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
            Main.log('animation begun of bone:  ' + self.name, 3)
            self.animation = Animation(ANIMATIONTYPE_MATRIX, scene.render.fps, ANIMATIONLOOPMODE_CYCLE, 'anim', '_matrix')

            start_frame = scene.frame_start
            end_frame = scene.frame_end
            previousBoneMatrix = None
            for frame in range(start_frame, end_frame + 1):
                bpy.context.scene.frame_set(frame)
                currentBoneMatrix = Bone.get_matrix(bone, matrix_world)

                if (frame != end_frame and same_matrix4(currentBoneMatrix, previousBoneMatrix)):
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
        write_float(file_handler, 'length', self.length)

        #animation
        if hasattr(self, 'animation'):
            file_handler.write(',"animation":')
            self.animation.to_scene_file(file_handler)

        file_handler.write('}')
#===============================================================================
class Skeleton:
    def __init__(self, skeleton, scene, id):
        Main.log('processing begun of skeleton:  ' + skeleton.name + ', id:  '+ str(id))
        self.name = skeleton.name
        self.id = id
        self.bones = []

        bones = skeleton.pose.bones
        j = 0
        for bone in bones:
            self.bones.append(Bone(bone, skeleton, scene, j))
            j = j + 1

        Main.log('processing complete of skeleton:  ' + skeleton.name)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_int(file_handler, 'id', self.id)  # keep int for legacy of original exporter

        file_handler.write(',"bones":[')
        first = True
        for bone in self.bones:
            if first != True:
                file_handler.write(',')
            first = False

            bone.to_scene_file(file_handler)

        file_handler.write(']')
        file_handler.write('}')
#===============================================================================
class Camera(FCurveAnimatable):
    def __init__(self, camera):
        super().__init__(camera, True, True, False, math.pi / 2)

        if camera.parent and camera.parent.type != 'ARMATURE':
            self.parentId = camera.parent.name

        self.CameraType = camera.data.CameraType
        self.name = camera.name
        Main.log('processing begun of camera (' + self.CameraType + '):  ' + self.name)
        self.position = camera.location

        # for quaternions, convert to euler XYZ, otherwise, use the default rotation_euler
        eul = camera.rotation_quaternion.to_euler("XYZ") if camera.rotation_mode == 'QUATERNION' else camera.rotation_euler
        self.rotation = mathutils.Vector((-eul[0] + math.pi / 2, eul[1], -eul[2]))

        self.fov = camera.data.angle
        self.minZ = camera.data.clip_start
        self.maxZ = camera.data.clip_end
        self.speed = 1.0
        self.inertia = 0.9
        self.checkCollisions = camera.data.checkCollisions
        self.applyGravity = camera.data.applyGravity
        self.ellipsoid = camera.data.ellipsoid

        self.Camera3DRig = camera.data.Camera3DRig
        self.interaxialDistance = camera.data.interaxialDistance

        for constraint in camera.constraints:
            if constraint.type == 'TRACK_TO':
                self.lockedTargetId = constraint.target.name
                break


        if self.CameraType == ARC_ROTATE_CAM or self.CameraType == FOLLOW_CAM:
            if not hasattr(self, 'lockedTargetId'):
                Main.warn('Camera type with manditory target specified, but no target to track set.  Ignored', 2)
                self.fatalProblem = True
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def update_for_target_attributes(self, meshesAndNodes):
        if not hasattr(self, 'lockedTargetId'): return

        # find the actual mesh tracking, so properties can be derrived
        targetFound = False
        for mesh in meshesAndNodes:
            if mesh.name == self.lockedTargetId:
                targetMesh = mesh
                targetFound = True
                break;

        xApart = 3 if not targetFound else self.position.x - targetMesh.position.x
        yApart = 3 if not targetFound else self.position.y - targetMesh.position.y
        zApart = 3 if not targetFound else self.position.z - targetMesh.position.z

        distance3D = math.sqrt(xApart * xApart + yApart * yApart + zApart * zApart)

        alpha = math.atan2(yApart, xApart);
        beta  = math.atan2(yApart, zApart);

        if self.CameraType == FOLLOW_CAM:
            self.followHeight   =  zApart
            self.followDistance = distance3D
            self.followRotation =  90 + (alpha * 180 / math.pi)

        elif self.CameraType == self.CameraType == ARC_ROTATE_CAM:
            self.arcRotAlpha  = alpha
            self.arcRotBeta   = beta
            self.arcRotRadius = distance3D
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
        write_array3(file_handler, 'ellipsoid', self.ellipsoid)

        # always assign rig, even when none, Reason:  Could have VR camera with different Rig than default
        write_int(file_handler, 'cameraRigMode', self.Camera3DRig)
        write_float(file_handler, 'interaxial_distance', self.interaxialDistance)

        write_string(file_handler, 'type', self.CameraType)

        if hasattr(self, 'parentId'): write_string(file_handler, 'parentId', self.parentId)

        if self.CameraType == FOLLOW_CAM:
            write_float(file_handler, 'heightOffset',  self.followHeight)
            write_float(file_handler, 'radius',  self.followDistance)
            write_float(file_handler, 'rotationOffset',  self.followRotation)

        elif self.CameraType == ARC_ROTATE_CAM:
            write_float(file_handler, 'alpha', self.arcRotAlpha)
            write_float(file_handler, 'beta', self.arcRotBeta)
            write_float(file_handler, 'radius',  self.arcRotRadius)

        if hasattr(self, 'lockedTargetId'):
            write_string(file_handler, 'lockedTargetId', self.lockedTargetId)

        super().to_scene_file(file_handler) # Animations
        file_handler.write('}')
#===============================================================================
class Light(FCurveAnimatable):
    def __init__(self, light):
        super().__init__(light, False, True, False)

        if light.parent and light.parent.type != 'ARMATURE':
            self.parentId = light.parent.name

        self.name = light.name
        Main.log('processing begun of light (' + light.data.type + '):  ' + self.name)
        light_type_items = {'POINT': POINT_LIGHT, 'SUN': DIRECTIONAL_LIGHT, 'SPOT': SPOT_LIGHT, 'HEMI': HEMI_LIGHT, 'AREA': POINT_LIGHT}
        self.light_type = light_type_items[light.data.type]

        if self.light_type == POINT_LIGHT:
            self.position = light.location
            if hasattr(light.data, 'use_sphere'):
                if light.data.use_sphere:
                    self.range = light.data.distance

        elif self.light_type == DIRECTIONAL_LIGHT:
            self.position = light.location
            self.direction = Light.get_direction(light.matrix_local)

        elif self.light_type == SPOT_LIGHT:
            self.position = light.location
            self.direction = Light.get_direction(light.matrix_local)
            self.angle = light.data.spot_size
            self.exponent = light.data.spot_blend * 2
            if light.data.use_sphere:
                self.range = light.data.distance

        else:
            # Hemi
            matrix_local = light.matrix_local.copy()
            matrix_local.translation = mathutils.Vector((0, 0, 0))
            self.direction = (mathutils.Vector((0, 0, -1)) * matrix_local)
            self.direction = scale_vector(self.direction, -1)
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

        if hasattr(self, 'parentId'   ): write_string(file_handler, 'parentId'   , self.parentId   )
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
    @staticmethod
    def get_direction(matrix):
        return (matrix.to_3x3() * mathutils.Vector((0.0, 0.0, -1.0))).normalized()
#===============================================================================
class ShadowGenerator:
    def __init__(self, lamp, meshesAndNodes, scene):
        Main.log('processing begun of shadows for light:  ' + lamp.name)
        self.lightId = lamp.name
        self.mapSize = lamp.data.shadowMapSize
        self.shadowBias = lamp.data.shadowBias

        if lamp.data.shadowMap == VARIANCE_SHADOWS:
            self.useVarianceShadowMap = True
        elif lamp.data.shadowMap == POISSON_SHADOWS:
            self.usePoissonSampling = True
        elif lamp.data.shadowMap == BLUR_VARIANCE_SHADOWS:
            self.useBlurVarianceShadowMap = True
            self.shadowBlurScale = lamp.data.shadowBlurScale
            self.shadowBlurBoxOffset = lamp.data.shadowBlurBoxOffset

        # .babylon specific section
        self.shadowCasters = []
        for mesh in meshesAndNodes:
            if (mesh.castShadows):
                self.shadowCasters.append(mesh.name)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_int(file_handler, 'mapSize', self.mapSize, True)
        write_string(file_handler, 'lightId', self.lightId)
        write_float(file_handler, 'bias', self.shadowBias)

        if hasattr(self, 'useVarianceShadowMap') :
            write_bool(file_handler, 'useVarianceShadowMap', self.useVarianceShadowMap)
        elif hasattr(self, 'usePoissonSampling'):
            write_bool(file_handler, 'usePoissonSampling', self.usePoissonSampling)
        elif hasattr(self, 'useBlurVarianceShadowMap'):
            write_bool(file_handler, 'useBlurVarianceShadowMap', self.useBlurVarianceShadowMap)
            write_int(file_handler, 'blurScale', self.shadowBlurScale)
            write_int(file_handler, 'blurBoxOffset', self.shadowBlurBoxOffset)

        file_handler.write(',"renderList":[')
        first = True
        for caster in self.shadowCasters:
            if first != True:
                file_handler.write(',')
            first = False

            file_handler.write('"' + caster + '"')

        file_handler.write(']')
        file_handler.write('}')
#===============================================================================
class MultiMaterial:
    def __init__(self, material_slots, idx):
        self.name = Main.nameSpace + '.' + 'Multimaterial#' + str(idx)
        Main.log('processing begun of multimaterial:  ' + self.name, 2)
        self.material_slots = material_slots
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_string(file_handler, 'id', self.name)

        file_handler.write(',"materials":[')
        first = True
        for material in self.material_slots:
            if first != True:
                file_handler.write(',')
            file_handler.write('"' + material.name +'"')
            first = False
        file_handler.write(']')
        file_handler.write('}')
#===============================================================================
class Texture:
    def __init__(self, slot, level, textureOrImage, mesh, exporter):
        wasBaked = not hasattr(textureOrImage, 'uv_layer')
        if wasBaked:
            image = textureOrImage
            texture = None

            repeat = False
            self.hasAlpha = False
            self.coordinatesIndex = 0
        else:
            texture = textureOrImage
            image = texture.texture.image

            repeat = texture.texture.extension == 'REPEAT'
            self.hasAlpha = texture.texture.use_alpha

            usingMap = texture.uv_layer
            if len(usingMap) == 0:
                usingMap = mesh.data.uv_textures[0].name
                
            Main.log('Image texture found, type:  ' + slot + ', mapped using: "' + usingMap + '"', 3)
            if mesh.data.uv_textures[0].name == usingMap:
                self.coordinatesIndex = 0
            elif mesh.data.uv_textures[1].name == usingMap:
                self.coordinatesIndex = 1
            else:
                Main.warn('Texture is not mapped as UV or UV2, assigned 1', 4)
                self.coordinatesIndex = 0

        # always write the file out, since base64 encoding is easiest from a file
        try:
            imageFilepath = os.path.normpath(bpy.path.abspath(image.filepath))
            basename = os.path.basename(imageFilepath)
            targetdir = os.path.dirname(exporter.filepath)

            internalImage = image.packed_file or wasBaked

            # when coming from either a packed image or a baked image, then save_render
            if internalImage:
                if exporter.scene.inlineTextures:
                    textureFile = os.path.join(targetdir, basename + "temp")
                else:
                    textureFile = os.path.join(targetdir, basename)

                image.save_render(textureFile)

            # when backed by an actual file, copy to target dir, unless inlining
            else:
                textureFile = bpy.path.abspath(image.filepath)
                if not exporter.scene.inlineTextures:
                    shutil.copy(textureFile, targetdir)
        except:
            ex = sys.exc_info()
            Main.log('Error encountered processing image file:  ' + ', Error:  '+ str(ex[1]))

        if exporter.scene.inlineTextures:
            # base64 is easiest from a file, so sometimes a temp file was made above;  need to delete those
            with open(textureFile, "rb") as image_file:
                asString = base64.b64encode(image_file.read()).decode()
            self.encoded_URI = 'data:image/' + image.file_format + ';base64,' + asString

            if internalImage:
                os.remove(textureFile)

        # capture texture attributes
        self.slot = slot
        self.name = basename
        self.level = level

        if (texture and texture.mapping == 'CUBE'):
            self.coordinatesMode = CUBIC_MODE
        if (texture and texture.mapping == 'SPHERE'):
            self.coordinatesMode = SPHERICAL_MODE
        else:
            self.coordinatesMode = EXPLICIT_MODE

        self.uOffset = texture.offset.x if texture else 0.0
        self.vOffset = texture.offset.y if texture else 0.0
        self.uScale  = texture.scale.x  if texture else 1.0
        self.vScale  = texture.scale.y  if texture else 1.0
        self.uAng = 0
        self.vAng = 0
        self.wAng = 0

        if (repeat):
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
            self.wrapV = CLAMP_ADDRESSMODE
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write(', \n"' + self.slot + '":{')
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
        if hasattr(self,'encoded_URI'):
            write_string(file_handler, 'base64String', self.encoded_URI)
        file_handler.write('}')
#===============================================================================
# need to evaluate the need to bake a mesh before even starting; class also stores specific types of bakes
class BakingRecipe:
    def __init__(self, mesh, forceBaking = False):
        # initialize all members
        self.needsBaking      = forceBaking
        self.diffuseBaking    = forceBaking
        self.ambientBaking    = False
        self.opacityBaking    = False
        self.reflectionBaking = False
        self.emissiveBaking   = False
        self.bumpBaking       = False
        self.specularBaking   = False

        # need to make sure a single render
        self.cyclesRender     = False
        blenderRender         = False

        # transfer from Mesh custom properties
        self.bakeSize    = mesh.data.bakeSize
        self.bakeQuality = mesh.data.bakeQuality # for lossy compression formats

        # accumulators set by Blender Game
        self.backFaceCulling = True  # used only when baking
        self.billboardMode = BILLBOARDMODE_ALL if len(mesh.material_slots) == 1 and mesh.material_slots[0].material.game_settings.face_orientation == 'BILLBOARD' else BILLBOARDMODE_NONE

        # Cycles specific, need to get the node trees of each material
        self.nodeTrees = []

        for material_slot in mesh.material_slots:
            # a material slot is not a reference to an actual material; need to look up
            material = material_slot.material

            self.backFaceCulling &= material.game_settings.use_backface_culling

            # testing for Cycles renderer has to be different
            if material.use_nodes == True:
                self.needsBaking = True
                self.cyclesRender = True
                self.nodeTrees.append(material.node_tree)

                for node in material.node_tree.nodes:
                    id = node.bl_idname
                    if id == 'ShaderNodeBsdfDiffuse':
                        self.diffuseBaking = True

                    if id == 'ShaderNodeAmbientOcclusion':
                        self.ambientBaking = True

                    # there is no opacity baking for Cycles AFAIK
                    if id == '':
                        self.opacityBaking = True

                    if id == 'ShaderNodeEmission':
                        self.emissiveBaking = True

                    if id == 'ShaderNodeNormal' or id == 'ShaderNodeNormalMap':
                        self.bumpBaking = True

                    if id == '':
                        self.specularBaking = True

            else:
                blenderRender = True
                nDiffuseImages = 0
                nReflectionImages = 0
                nAmbientImages = 0
                nOpacityImages = 0
                nEmissiveImages = 0
                nBumpImages = 0
                nSpecularImages = 0

                textures = [mtex for mtex in material.texture_slots if mtex and mtex.texture]
                for mtex in textures:
                    # ignore empty slots
                    if mtex.texture.type == 'NONE':
                        continue
                    
                    # for images, just need to make sure there is only 1 per type
                    if mtex.texture.type == 'IMAGE' and not forceBaking:
                        if mtex.use_map_diffuse or mtex.use_map_color_diffuse:
                            if mtex.texture_coords == 'REFLECTION':
                                nReflectionImages += 1
                            else:
                                nDiffuseImages += 1
    
                        if mtex.use_map_ambient:
                            nAmbientImages += 1
    
                        if mtex.use_map_alpha:
                            nOpacityImages += 1
    
                        if mtex.use_map_emit:
                            nEmissiveImages += 1
    
                        if mtex.use_map_normal:
                            nBumpImages += 1
    
                        if mtex.use_map_color_spec:
                            nSpecularImages += 1

                    else:
                        self.needsBaking = True
    
                        if mtex.use_map_diffuse or mtex.use_map_color_diffuse:
                            if mtex.texture_coords == 'REFLECTION':
                                self.reflectionBaking = True
                            else:
                                self.diffuseBaking = True
    
                        if mtex.use_map_ambient:
                            self.ambientBaking = True
    
                        if mtex.use_map_alpha:
                            self.opacityBaking = True
    
                        if mtex.use_map_emit:
                            self.emissiveBaking = True
    
                        if mtex.use_map_normal:
                            self.bumpBaking = True
    
                        if mtex.use_map_color_spec:
                            self.specularBaking = True
                            
                # 2nd pass 2 check for multiples of a given image type
                if nDiffuseImages > 1:
                    self.needsBaking = self.diffuseBaking = True
                if nReflectionImages > 1:
                    self.needsBaking = self.nReflectionImages = True
                if nAmbientImages > 1:
                    self.needsBaking = self.ambientBaking = True
                if nOpacityImages > 1:
                    self.needsBaking = self.opacityBaking = True
                if nEmissiveImages > 1:
                    self.needsBaking = self.emissiveBaking = True
                if nBumpImages > 1:
                    self.needsBaking = self.bumpBaking = True
                if nSpecularImages > 1:
                    self.needsBaking = self.specularBaking = True
                        
        self.multipleRenders = blenderRender and self.cyclesRender
        
        # check for really old .blend file, eg. 2.49, to ensure that everything requires exists
        if self.needsBaking and bpy.data.screens.find('UV Editing') == -1:
            Main.warn('Contains material requiring baking, but resources not available.  Probably .blend very old', 2)
            self.needsBaking = False     
#===============================================================================
# Not intended to be instanced directly
class Material:
    def __init__(self, checkReadyOnlyOnce):
        self.checkReadyOnlyOnce = checkReadyOnlyOnce
        # first pass of textures, either appending image type or recording types of bakes to do
        self.textures = []
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
        write_bool(file_handler, 'checkReadyOnlyOnce', self.checkReadyOnlyOnce)
        for texSlot in self.textures:
            texSlot.to_scene_file(file_handler)

        file_handler.write('}')
#===============================================================================
class StdMaterial(Material):
    def __init__(self, material_slot, exporter, mesh):
        super().__init__(mesh.data.checkReadyOnlyOnce)
        nameSpace = Main.nameSpace if mesh.data.materialNameSpace == DEFAULT_MATERIAL_NAMESPACE else mesh.data.materialNameSpace 
        self.name = nameSpace + '.' + material_slot.name
                
        Main.log('processing begun of Standard material:  ' +  material_slot.name, 2)

        # a material slot is not a reference to an actual material; need to look up
        material = material_slot.material

        self.ambient = material.ambient * material.diffuse_color
        self.diffuse = material.diffuse_intensity * material.diffuse_color
        self.specular = material.specular_intensity * material.specular_color
        self.emissive = material.emit * material.diffuse_color
        self.specularPower = material.specular_hardness
        self.alpha = material.alpha

        self.backFaceCulling = material.game_settings.use_backface_culling

        textures = [mtex for mtex in material.texture_slots if mtex and mtex.texture]
        for mtex in textures:
            # test should be un-neccessary, since should be a BakedMaterial; just for completeness
            if (mtex.texture.type != 'IMAGE'):
                continue
            elif not mtex.texture.image:
                Main.warn('Material has un-assigned image texture:  "' + mtex.name + '" ignored', 3)
                continue
            elif len(mesh.data.uv_textures) == 0:
                Main.warn('Mesh has no UV maps, material:  "' + mtex.name + '" ignored', 3)
                continue

            if mtex.use_map_diffuse or mtex.use_map_color_diffuse:
                if mtex.texture_coords == 'REFLECTION':
                    Main.log('Reflection texture found"' + mtex.name + '"', 2)
                    self.textures.append(Texture('reflectionTexture', mtex.diffuse_color_factor, mtex, mesh, exporter))
                else:
                    Main.log('Diffuse texture found"' + mtex.name + '"', 2)
                    self.textures.append(Texture('diffuseTexture', mtex.diffuse_color_factor, mtex, mesh, exporter))

            if mtex.use_map_ambient:
                Main.log('Ambient texture found"' + mtex.name + '"', 2)
                self.textures.append(Texture('ambientTexture', mtex.ambient_factor, mtex, mesh, exporter))

            if mtex.use_map_alpha:
                if self.alpha > 0:
                    Main.log('Opacity texture found"' + mtex.name + '"', 2)
                    self.textures.append(Texture('opacityTexture', mtex.alpha_factor, mtex, mesh, exporter))
                else:
                    Main.warn('Opacity non-std way to indicate opacity, use material alpha to also use Opacity texture', 2)
                    self.alpha = 1

            if mtex.use_map_emit:
                Main.log('Emissive texture found"' + mtex.name + '"', 2)
                self.textures.append(Texture('emissiveTexture', mtex.emit_factor, mtex, mesh, exporter))

            if mtex.use_map_normal:
                Main.log('Bump texture found"' + mtex.name + '"', 2)
                self.textures.append(Texture('bumpTexture', 1.0 / mtex.normal_factor, mtex, mesh, exporter))

            if mtex.use_map_color_spec:
                Main.log('Specular texture found"' + mtex.name + '"', 2)
                self.textures.append(Texture('specularTexture', mtex.specular_color_factor, mtex, mesh, exporter))
#===============================================================================
class BakedMaterial(Material):
    def __init__(self, exporter, mesh, recipe):
        super().__init__(mesh.data.checkReadyOnlyOnce)
        nameSpace = Main.nameSpace if mesh.data.materialNameSpace == DEFAULT_MATERIAL_NAMESPACE else mesh.data.materialNameSpace 
        self.name = nameSpace + '.' + mesh.name
        Main.log('processing begun of baked material:  ' +  mesh.name, 2)

        # any baking already took in the values. Do not want to apply them again, but want shadows to show.
        # These are the default values from StandardMaterials
        self.ambient = mathutils.Color((0, 0, 0))
        self.diffuse = mathutils.Color((0.8, 0.8, 0.8)) # needed for shadows, but not change anything else
        self.specular = mathutils.Color((1, 1, 1))
        self.emissive = mathutils.Color((0, 0, 0))
        self.specularPower = 64
        self.alpha = 1.0

        self.backFaceCulling = recipe.backFaceCulling

        # texture is baked from selected mesh(es), need to insure this mesh is only one selected
        bpy.ops.object.select_all(action='DESELECT')
        mesh.select = True

        # store setting to restore
        engine = exporter.scene.render.engine

        # mode_set's only work when there is an active object
        exporter.scene.objects.active = mesh

         # UV unwrap operates on mesh in only edit mode, procedurals can also give error of 'no images to be found' when not done
         # select all verticies of mesh, since smart_project works only with selected verticies
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT') 
        
        # you need UV on a mesh in order to bake image.  This is not reqd for procedural textures, so may not exist
        # need to look if it might already be created, if so use the first one
        uv = mesh.data.uv_textures[0] if len(mesh.data.uv_textures) > 0 else None

        if uv == None:
            mesh.data.uv_textures.new('BakingUV')
            uv = mesh.data.uv_textures['BakingUV']
            uv.active = True
            uv.active_render = True
            bpy.ops.uv.smart_project(angle_limit = 66.0, island_margin = 0.0, user_area_weight = 1.0, use_aspect = True)
            uvName = 'BakingUV'  # issues with cycles when not done this way
        else:
            uvName = uv.name

        # create a temporary image & link it to the UV/Image Editor so bake_image works
        bpy.data.images.new(name = mesh.name + '_BJS_BAKE', width = recipe.bakeSize, height = recipe.bakeSize, alpha = False, float_buffer = False)
        image = bpy.data.images[mesh.name + '_BJS_BAKE']
        image.file_format = 'JPEG'
        image.mapping = 'UV' # default value

        image_settings = exporter.scene.render.image_settings
        image_settings.file_format = 'JPEG'
        image_settings.quality = recipe.bakeQuality # for lossy compression formats
#        image_settings.compression = 100  # Amount of time to determine best compression: 0 = no compression with fast file output, 100 = maximum lossless compression with slow file output

        # now go thru all the textures that need to be baked
        if recipe.diffuseBaking:
            self.bake('diffuseTexture', 'DIFFUSE_COLOR', 'TEXTURE', image, mesh, uvName, exporter, recipe)

        if recipe.ambientBaking:
            self.bake('ambientTexture', 'AO', 'AO', image, mesh, uvName, exporter, recipe)

        if recipe.opacityBaking:  # no eqivalent found for cycles
            self.bake('opacityTexture', None, 'ALPHA', image, mesh, uvName, exporter, recipe)

        if recipe.reflectionBaking:
            self.bake('reflectionTexture', 'REFLECTION', 'MIRROR_COLOR', image, mesh, uvName, exporter, recipe)

        if recipe.emissiveBaking:
            self.bake('emissiveTexture', 'EMIT', 'EMIT', image, mesh, uvName, exporter, recipe)

        if recipe.bumpBaking:
            self.bake('bumpTexture', 'NORMAL', 'NORMALS', image, mesh, uvName, exporter, recipe)

        if recipe.specularBaking:
            self.bake('specularTexture', 'SPECULAR', 'SPEC_COLOR', image, mesh, uvName, exporter, recipe)

        # Toggle vertex selection & mode, if setting changed their value
        bpy.ops.mesh.select_all(action='TOGGLE')  # still in edit mode toggle select back to previous
        bpy.ops.object.mode_set(toggle=True)      # change back to Object

        bpy.ops.object.select_all(action='TOGGLE') # change scene selection back, not seeming to work

        exporter.scene.render.engine = engine
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def bake(self, bjs_type, cycles_type, internal_type, image, mesh, uvName, exporter, recipe):
        if recipe.cyclesRender:
            if cycles_type is None:
                return
            self.bakeCycles(cycles_type, image, uvName, recipe.nodeTrees)
        else:
            self.bakeInternal(internal_type, image, uvName)

        self.textures.append(Texture(bjs_type, 1.0, image, mesh, exporter))
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def bakeInternal(self, bake_type, image, uvName):
        Main.log('Internal baking texture, type: ' + bake_type + ', mapped using: ' + uvName, 3)
        # need to use the legal name, since this will become the file name, chars like ':' not legal
        legalName = legal_js_identifier(self.name)
        image.filepath = legalName + '_' + bake_type + '.jpg'

        scene = bpy.context.scene
        scene.render.engine = 'BLENDER_RENDER'

        scene.render.bake_type = bake_type

        # assign the image to the UV Editor, which does not have to shown
        bpy.data.screens['UV Editing'].areas[1].spaces[0].image = image

        renderer = scene.render
        renderer.use_bake_selected_to_active = False
        renderer.use_bake_to_vertex_color = False
        renderer.use_bake_clear = True
        renderer.bake_quad_split = 'AUTO'
        renderer.bake_margin = 5
        renderer.use_file_extension = True

        renderer.use_bake_normalize = True
        renderer.use_bake_antialiasing = True

        bpy.ops.object.bake_image()
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def bakeCycles(self, bake_type, image, uvName, nodeTrees):
        Main.log('Cycles baking texture, type: ' + bake_type + ', mapped using: ' + uvName, 3)
        legalName = legal_js_identifier(self.name)
        image.filepath = legalName + '_' + bake_type + '.jpg'

        scene = bpy.context.scene
        scene.render.engine = 'CYCLES'

        # create an unlinked temporary node to bake to for each material
        for tree in nodeTrees:
            bakeNode = tree.nodes.new(type='ShaderNodeTexImage')
            bakeNode.image = image
            bakeNode.select = True
            tree.nodes.active = bakeNode

        bpy.ops.object.bake(type = bake_type, use_clear = True, margin = 5, use_selected_to_active = False)

        for tree in nodeTrees:
            tree.nodes.remove(tree.nodes.active)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    @staticmethod
    def meshBakingClean(mesh):
        for uvMap in mesh.data.uv_textures:
            if uvMap.name == 'BakingUV':
                mesh.data.uv_textures.remove(uvMap)
                break

        # remove an image if it was baked
        for image in bpy.data.images:
            if image.name == mesh.name + '_BJS_BAKE':
                image.user_clear() # cannot remove image unless 0 references
                bpy.data.images.remove(image)
                break
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
            value_idx = self.values[frame_idx]
            if self.dataType == ANIMATIONTYPE_MATRIX:
                write_matrix4(file_handler, 'values', value_idx)
            elif self.dataType == ANIMATIONTYPE_QUATERNION:
                write_quaternion(file_handler, 'values', value_idx)
            else:
                write_vector(file_handler, 'values', value_idx)
            file_handler.write('}')

        file_handler.write(']')   # close keys

        # put this at the end to make less crazy looking ]}]]]}}}}}}}]]]],
        # since animation is also at the end of the bone, mesh, camera, or light
        write_int(file_handler, 'loopBehavior', self.loopBehavior)
        write_string(file_handler, 'name', self.name)
        write_string(file_handler, 'property', self.propertyInBabylon)
        file_handler.write('}')
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
class QuaternionAnimation(Animation):
    def __init__(self, object, attrInBlender, propertyInBabylon, mult, xOffset = 0):
        super().__init__(ANIMATIONTYPE_QUATERNION, 30, ANIMATIONLOOPMODE_CYCLE, propertyInBabylon + ' animation', propertyInBabylon)

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
            self.values.append(post_rotate_quaternion(getattr(object, attrInBlender), xOffset))
#===============================================================================
class QuaternionToEulerAnimation(Animation):
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
            quat = getattr(object, attrInBlender)
            eul  = quat.to_euler("XYZ")
            self.values.append(scale_vector(eul, mult, xOffset))
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
    candidate = str(int) # when int string of an int
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

def same_matrix4(matA, matB):
    if(matA is None or matB is None): return False
    if (len(matA) != len(matB)): return False
    for i in range(len(matA)):
        if (round(matA[i][0], MAX_FLOAT_PRECISION_INT) != round(matB[i][0], MAX_FLOAT_PRECISION_INT) or 
            round(matA[i][1], MAX_FLOAT_PRECISION_INT) != round(matB[i][1], MAX_FLOAT_PRECISION_INT) or 
            round(matA[i][2], MAX_FLOAT_PRECISION_INT) != round(matB[i][2], MAX_FLOAT_PRECISION_INT) or 
            round(matA[i][3], MAX_FLOAT_PRECISION_INT) != round(matB[i][3], MAX_FLOAT_PRECISION_INT)): 
            return False
        
    return True

def same_vertex(vertA, vertB):
    if(vertA is None or vertB is None): return False
    return vertA.x == vertB.x and vertA.y == vertB.y and vertA.z == vertB.z

def same_array(arrayA, arrayB):
    if(arrayA is None or arrayB is None): return False
    if len(arrayA) != len(arrayB): return False
    for i in range(len(arrayA)):
        if arrayA[i] != arrayB[i] : return False
        
    return True
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
#===============================================================================
bpy.types.Mesh.autoAnimate = bpy.props.BoolProperty(
    name='Auto launch animations',
    description='',
    default = False
)
bpy.types.Mesh.useFlatShading = bpy.props.BoolProperty(
    name='Use Flat Shading',
    description='Use face normals.  Increases vertices.',
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
bpy.types.Mesh.bakeSize = bpy.props.IntProperty(
    name='Texture Size',
    description='',
    default = 1024
)
bpy.types.Mesh.bakeQuality = bpy.props.IntProperty(
    name='Quality 1-100',
    description='The trade-off between Quality - File size(100 highest quality)',
    default = 50, min = 1, max = 100
)
bpy.types.Mesh.materialNameSpace = bpy.props.StringProperty(
    name='Name Space',
    description='Prefix to use for materials for sharing across .blends.',
    default = DEFAULT_MATERIAL_NAMESPACE
)
bpy.types.Mesh.checkReadyOnlyOnce = bpy.props.BoolProperty(
    name='Check Ready Only Once',
    description='When checked better CPU utilization.  Advanced user option.',
    default = False
)
bpy.types.Mesh.freezeWorldMatrix = bpy.props.BoolProperty(
    name='Freeze World Matrix',
    description='Indicate the position, rotation, & scale do not change for performance reasons',
    default = False
)
bpy.types.Mesh.loadDisabled = bpy.props.BoolProperty(
    name='Load Disabled',
    description='Indicate this mesh & children should not be active until enabled by code.',
    default = False
)
bpy.types.Mesh.attachedSound = bpy.props.StringProperty(
    name='Sound',
    description='',
    default = ''
)
bpy.types.Mesh.loopSound = bpy.props.BoolProperty(
    name='Loop sound',
    description='',
    default = True
)
bpy.types.Mesh.autoPlaySound = bpy.props.BoolProperty(
    name='Auto play sound',
    description='',
    default = True
)
bpy.types.Mesh.maxSoundDistance = bpy.props.FloatProperty(
    name='Max sound distance',
    description='',
    default = 100
)
bpy.types.Mesh.maxInfluencers = bpy.props.IntProperty(
    name='Max bone Influencers / Vertex',
    description='When fewer than this are observed, the lower value is used.',
    default = 8, min = 1, max = 8
)
#===============================================================================
bpy.types.Camera.autoAnimate = bpy.props.BoolProperty(
    name='Auto launch animations',
    description='',
    default = False
)
bpy.types.Camera.CameraType = bpy.props.EnumProperty(
    name='Camera Type',
    description='',
    # ONLY Append, or existing .blends will have their camera changed
    items = (
             (V_JOYSTICKS_CAM        , 'Virtual Joysticks'       , 'Use Virtual Joysticks Camera'),
             (TOUCH_CAM              , 'Touch'                   , 'Use Touch Camera'),
             (GAMEPAD_CAM            , 'Gamepad'                 , 'Use Gamepad Camera'),
             (FREE_CAM               , 'Free'                    , 'Use Free Camera'),
             (FOLLOW_CAM             , 'Follow'                  , 'Use Follow Camera'),
             (DEV_ORIENT_CAM         , 'Device Orientation'      , 'Use Device Orientation Camera'),
             (ARC_ROTATE_CAM         , 'Arc Rotate'              , 'Use Arc Rotate Camera'),
             (VR_DEV_ORIENT_FREE_CAM , 'VR Dev Orientation Free' , 'Use VR Dev Orientation Free Camera'),
             (WEB_VR_FREE_CAM        , 'Web VR Free'             , 'Use Web VR Free Camera')
            ),
    default = FREE_CAM
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
bpy.types.Camera.ellipsoid = bpy.props.FloatVectorProperty(
    name='Ellipsoid',
    description='',
    default = mathutils.Vector((0.2, 0.9, 0.2))
)
bpy.types.Camera.Camera3DRig = bpy.props.EnumProperty(
    name='Rig',
    description='',
    items = (
             (RIG_MODE_NONE                             , 'None'                  , 'No 3D effects'),
             (RIG_MODE_STEREOSCOPIC_ANAGLYPH            , 'Anaaglph'              , 'Stereoscopic Anagylph'),
             (RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL , 'side-by-side Parallel' , 'Stereoscopic side-by-side parallel'),
             (RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED, 'side-by-side crosseyed', 'Stereoscopic side-by-side crosseyed'),
             (RIG_MODE_STEREOSCOPIC_OVERUNDER           , 'over-under'            , 'Stereoscopic over-under'),
             (RIG_MODE_VR                               , 'VR distortion'         , 'Use Web VR Free Camera')
            ),
    default = RIG_MODE_NONE
)
bpy.types.Camera.interaxialDistance = bpy.props.FloatProperty(
    name='Interaxial Distance',
    description='Distance between cameras.  Used by all but VR 3D rigs.',
    default = 0.0637
)
#===============================================================================
bpy.types.Lamp.autoAnimate = bpy.props.BoolProperty(
    name='Auto launch animations',
    description='',
    default = False
)
bpy.types.Lamp.shadowMap = bpy.props.EnumProperty(
    name='Shadow Map',
    description='',
    items = ((NO_SHADOWS           , 'None'         , 'No Shadow Maps'),
             (STD_SHADOWS          , 'Standard'     , 'Use Standard Shadow Maps'),
             (POISSON_SHADOWS      , 'Poisson'      , 'Use Poisson Sampling'),
             (VARIANCE_SHADOWS     , 'Variance'     , 'Use Variance Shadow Maps'),
             (BLUR_VARIANCE_SHADOWS, 'Blur Variance', 'Use Blur Variance Shadow Maps')
            ),
    default = NO_SHADOWS
)

bpy.types.Lamp.shadowMapSize = bpy.props.IntProperty(
    name='Shadow Map Size',
    description='',
    default = 512
)
bpy.types.Lamp.shadowBias = bpy.props.FloatProperty(
    name='Shadow Bias',
    description='',
    default = 0.00005
)

bpy.types.Lamp.shadowBlurScale = bpy.props.IntProperty(
    name='Blur Scale',
    description='',
    default = 2
)

bpy.types.Lamp.shadowBlurBoxOffset = bpy.props.IntProperty(
    name='Blur Box Offset',
    description='',
    default = 0
)

class ObjectPanel(bpy.types.Panel):
    bl_label = 'Babylon.js'
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
            row = layout.row()
            row.prop(ob.data, 'useFlatShading')
            row.prop(ob.data, 'checkCollisions')
            
            row = layout.row()
            row.prop(ob.data, 'castShadows')
            row.prop(ob.data, 'receiveShadows')
            
            row = layout.row()
            row.prop(ob.data, 'freezeWorldMatrix')
            row.prop(ob.data, 'loadDisabled')
            
            layout.prop(ob.data, 'autoAnimate')            
            layout.prop(ob.data, 'maxInfluencers')

            box = layout.box()
            box.label('Materials')
            box.prop(ob.data, 'materialNameSpace')
            box.prop(ob.data, 'checkReadyOnlyOnce')
            
            box = layout.box()
            box.label(text='Procedural Texture / Cycles Baking')
            box.prop(ob.data, 'bakeSize')
            box.prop(ob.data, 'bakeQuality')

            box = layout.box()
            box.prop(ob.data, 'attachedSound')
            box.prop(ob.data, 'autoPlaySound')
            box.prop(ob.data, 'loopSound')
            box.prop(ob.data, 'maxSoundDistance')

        elif isCamera:
            layout.prop(ob.data, 'CameraType')
            layout.prop(ob.data, 'checkCollisions')
            layout.prop(ob.data, 'applyGravity')
            layout.prop(ob.data, 'ellipsoid')

            box = layout.box()
            box.label(text="3D Camera Rigs")
            box.prop(ob.data, 'Camera3DRig')
            box.prop(ob.data, 'interaxialDistance')

            layout.prop(ob.data, 'autoAnimate')

        elif isLight:
            layout.prop(ob.data, 'shadowMap')
            layout.prop(ob.data, 'shadowMapSize')
            layout.prop(ob.data, 'shadowBias')

            box = layout.box()
            box.label(text="Blur Variance Shadows")
            box.prop(ob.data, 'shadowBlurScale')
            box.prop(ob.data, 'shadowBlurBoxOffset')

            layout.prop(ob.data, 'autoAnimate')
