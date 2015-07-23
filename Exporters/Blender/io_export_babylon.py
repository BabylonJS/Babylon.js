bl_info = {
    'name': 'Babylon.js',
    'author': 'David Catuhe, Jeff Palmer',
    'version': (1, 8, 2),
    'blender': (2, 72, 0),
    "location": "File > Export > Babylon.js (.babylon)",
    "description": "Export Babylon.js scenes (.babylon)",
    'wiki_url': 'https://github.com/BabylonJS/Babylon.js/wiki/13-Blender',
    'tracker_url': '',
    'category': 'Import-Export'}

import bpy
import bpy_extras.io_utils
import io
import math
import mathutils
import os
import shutil
import sys, traceback # for writing errors to log file
#===============================================================================
# Registration the calling of the INFO_MT_file_export file selector
def menu_func(self, context):
    self.layout.operator(BabylonExporter.bl_idname, text = 'Babylon.js [.babylon]')

# store keymaps here to access after registration (commented out for now)
#addon_keymaps = []

def register():
    bpy.utils.register_module(__name__)
    bpy.types.INFO_MT_file_export.append(menu_func)

    # create the hotkey
#    kc = bpy.context.window_manager.keyconfigs.addon
#    km = kc.keymaps.new(name='3D View', space_type='VIEW_3D')
#    kmi = km.keymap_items.new('wm.call_menu', 'W', 'PRESS', alt=True)
#    kmi.properties.name = BabylonExporter.bl_idname
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
ANAGLYPH_ARC_CAM = 'AnaglyphArcRotateCamera'
ANAGLYPH_FREE_CAM = 'AnaglyphFreeCamera'
ARC_ROTATE_CAM = 'ArcRotateCamera'
DEV_ORIENT_CAM = 'DeviceOrientationCamera'
FOLLOW_CAM = 'FollowCamera'
FREE_CAM = 'FreeCamera'
GAMEPAD_CAM = 'GamepadCamera'
TOUCH_CAM = 'TouchCamera'
V_JOYSTICKS_CAM = 'VirtualJoysticksCamera'
VR_DEV_ORIENT_FREE_CAM ='VRDeviceOrientationFreeCamera'
WEB_VR_FREE_CAM = 'WebVRFreeCamera'

# used in Light constructor, never formally defined in Babylon, but used in babylonFileLoader
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
ANIMATIONTYPE_QUATERNION = 2
ANIMATIONTYPE_MATRIX = 3
#ANIMATIONTYPE_COLOR3 = 4

# passed to Animation constructor from animatable objects, defined in BABYLON.Animation
#ANIMATIONLOOPMODE_RELATIVE = 0
ANIMATIONLOOPMODE_CYCLE = 1
#ANIMATIONLOOPMODE_CONSTANT = 2
#===============================================================================
class BabylonExporter(bpy.types.Operator, bpy_extras.io_utils.ExportHelper):
    bl_idname = 'scene.babylon'         # module will not load with out it, also must have a dot
    bl_label = 'Export Babylon.js scene'            # used on the label of the actual 'save' button
    filename_ext = '.babylon'          # required to have one, although not really used

    filepath = bpy.props.StringProperty(subtype = 'FILE_PATH') # assigned once the file selector returns
    log_handler = None  # assigned in execute
    nameSpace   = None  # assigned in execute
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    export_onlyCurrentLayer = bpy.props.BoolProperty(
        name="Export only current layer",
        description="Export only current layer",
        default = False,
        )

    export_noVertexOpt = bpy.props.BoolProperty(
        name="No vertex sharing",
        description="Turns off an optimization which reduces vertices",
        default = False,
        )

    attachedSound = bpy.props.StringProperty(
        name='Music',
        description='',
        default = ''
    )
    loopSound = bpy.props.BoolProperty(
        name='Loop sound',
        description='',
        default = True
    )
    autoPlaySound = bpy.props.BoolProperty(
        name='Auto play sound',
        description='',
        default = True
    )

    def draw(self, context):
        layout = self.layout

        layout.prop(self, 'export_onlyCurrentLayer')
        layout.prop(self, "export_noVertexOpt")

        layout.separator()

        layout.prop(self, 'attachedSound')
        layout.prop(self, 'autoPlaySound')
        layout.prop(self, 'loopSound')

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    nWarnings = 0
    @staticmethod
    def warn(msg, numTabIndent = 1, noNewLine = False):
        BabylonExporter.log(msg, numTabIndent, noNewLine)
        BabylonExporter.nWarnings += 1

    @staticmethod
    def log(msg, numTabIndent = 1, noNewLine = False):
        for i in range(numTabIndent):
            BabylonExporter.log_handler.write('\t')

        BabylonExporter.log_handler.write(msg)
        if not noNewLine: BabylonExporter.log_handler.write('\n')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    materials = []
    @staticmethod
    def uvRequiredForMaterial(baseMaterialId):
        fullName = BabylonExporter.nameSpace + '.' + baseMaterialId
        for material in BabylonExporter.materials:
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
                BabylonExporter.nameSpace = legal_js_identifier(self.filepathMinusExtension.rpartition('\\')[2])
            else:
                BabylonExporter.nameSpace = legal_js_identifier(self.filepathMinusExtension.rpartition('/')[2])

            # explicitly reset globals, in case there was an earlier export this session
            BabylonExporter.nWarnings = 0
            BabylonExporter.materials = []

            BabylonExporter.log_handler = io.open(self.filepathMinusExtension + '.log', 'w', encoding='utf8')
            BabylonExporter_version = bl_info['version']
            BabylonExporter.log('Babylon.js Exporter version: ' + str(BabylonExporter_version[0]) + '.' + str(BabylonExporter_version[1]) +  '.' + str(BabylonExporter_version[2]) +
                             ', Blender version: ' + bpy.app.version_string)

            if bpy.ops.object.mode_set.poll():
                bpy.ops.object.mode_set(mode = 'OBJECT')

            scene = context.scene
            BabylonExporter.log('========= Conversion from Blender to Babylon.js =========', 0)
            self.world = World(scene)

            bpy.ops.screen.animation_cancel()
            currentFrame = bpy.context.scene.frame_current
            bpy.context.scene.frame_set(0)

            # Active camera
            if scene.camera != None:
                self.activeCamera = scene.camera.name
            else:
                BabylonExporter.warn('WARNING: No active camera has been assigned, or is not in a currently selected Blender layer')

            # Materials, static for ease of uvs requirement testing
            stuffs = [mat for mat in bpy.data.materials if mat.users >= 1]
            for material in stuffs:
                BabylonExporter.materials.append(Material(material, scene, self.filepath)) # need file path incase an image texture

            self.cameras = []
            self.lights = []
            self.shadowGenerators = []
            self.skeletons = []
            skeletonId = 0
            self.meshesAndNodes = []
            self.multiMaterials = []
            self.meshesWithSound = []

            # Music
            if self.attachedSound != '':
                music = type('', (), {})()  #Fake mesh object
                music.data = type('', (), {})()
                music.data.attachedSound = self.attachedSound
                music.data.loopSound = self.loopSound
                music.data.autoPlaySound = self.autoPlaySound
                self.meshesWithSound.append(music)

            # exclude lamps in this pass, so ShadowGenerator constructor can be passed meshesAnNodes
            for object in [object for object in scene.objects]:
                if object.type == 'CAMERA':
                    if object.is_visible(scene): # no isInSelectedLayer() required, is_visible() handles this for them
                        self.cameras.append(Camera(object))
                    else:
                        BabylonExporter.warn('WARNING: The following camera not visible in scene thus ignored: ' + object.name)

                elif object.type == 'ARMATURE':  #skeleton.pose.bones
                    if object.is_visible(scene):
                        self.skeletons.append(Skeleton(object, scene, skeletonId))
                        skeletonId += 1
                    else:
                        BabylonExporter.warn('WARNING: The following armature not visible in scene thus ignored: ' + object.name)

                elif object.type == 'MESH':
                    forcedParent = None
                    nameID = ''
                    nextStartFace = 0

                    while True and self.isInSelectedLayer(object, scene):
                        mesh = Mesh(object, scene, self.multiMaterials, nextStartFace, forcedParent, nameID, self.export_noVertexOpt)
                        self.meshesAndNodes.append(mesh)

                        if object.data.attachedSound != '':
                            self.meshesWithSound.append(object)

                        nextStartFace = mesh.offsetFace
                        if nextStartFace == 0:
                            break

                        if forcedParent is None:
                            nameID = 0
                            forcedParent = object
                            BabylonExporter.warn('WARNING: The following mesh has exceeded the maximum # of vertex elements & will be broken into multiple Babylon meshes: ' + object.name)

                        nameID = nameID + 1

                elif object.type == 'EMPTY':
                    self.meshesAndNodes.append(Node(object))

                elif object.type != 'LAMP':
                    BabylonExporter.warn('WARNING: The following object is not currently exportable thus ignored: ' + object.name)

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
                                BabylonExporter.warn('WARNING: Only directional (sun) and spot types of lamp are valid for shadows thus ignored: ' + object.name)
                    else:
                        BabylonExporter.warn('WARNING: The following lamp not visible in scene thus ignored: ' + object.name)

            bpy.context.scene.frame_set(currentFrame)

            # output file
            self.to_scene_file   ()

        except:# catch *all* exceptions
            ex = sys.exc_info()
            BabylonExporter.log('========= An error was encountered =========', 0)
            stack = traceback.format_tb(ex[2])
            for line in stack:
               BabylonExporter.log_handler.write(line) # avoid tabs & extra newlines by not calling log() inside catch

            BabylonExporter.log_handler.write('ERROR:  ' + str(ex[1]) + '\n')
            raise

        finally:
            BabylonExporter.log('========= end of processing =========', 0)
            BabylonExporter.log_handler.close()

            if (BabylonExporter.nWarnings > 0):
                self.report({'WARNING'}, 'Processing completed, but ' + str(BabylonExporter.nWarnings) + ' WARNINGS were raised,  see log file.')

        return {'FINISHED'}
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self):
        BabylonExporter.log('========= Writing of scene file started =========', 0)
        # Open file
        file_handler = io.open(self.filepathMinusExtension + '.babylon', 'w', encoding='utf8')
        file_handler.write('{')
        self.world.to_scene_file(file_handler)

        # Materials
        file_handler.write(',\n"materials":[')
        first = True
        for material in BabylonExporter.materials:
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
        for m in range(0, len(self.meshesAndNodes)):
            mesh = self.meshesAndNodes[m]

            # skip if mesh already written by that name, since this one is an instance
            skip = False
            for n in range(0, m):
                skip |= hasattr(mesh, "dataName") and hasattr(self.meshesAndNodes[n], "dataName") and mesh.dataName == self.meshesAndNodes[n].dataName # nodes have no dataname, so no need to check for

            if skip: continue

            if first != True:
                file_handler.write(',')

            first = False
            mesh.to_scene_file(file_handler, self.meshesAndNodes)
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
        if len(self.meshesWithSound) > 0:
            file_handler.write('\n,"sounds":[')
            first = True
            for mesh in self.meshesWithSound:
                if first == False:
                    file_handler.write(',')
                file_handler.write('{')
                write_string(file_handler, 'name', mesh.data.attachedSound, True)
                write_bool(file_handler, 'autoplay', mesh.data.autoPlaySound)
                write_bool(file_handler, 'loop', mesh.data.loopSound)

                if hasattr(mesh, 'name'):
                    write_string(file_handler, 'connectedMeshId', mesh.name)
                    write_float(file_handler, 'maxDistance', mesh.data.maxSoundDistance)

                file_handler.write('}')

            file_handler.write(']')

        # Closing
        file_handler.write('}')
        file_handler.close()
        BabylonExporter.log('========= Writing of scene file completed =========', 0)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def isInSelectedLayer(self, obj, scene):
        return not self.export_onlyCurrentLayer or obj.layers[scene.active_layer]
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

        BabylonExporter.log('Python World class constructor completed')
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
class FCurveAnimatable:
    def __init__(self, object, supportsRotation, supportsPosition, supportsScaling, xOffsetForRotation = 0):

        # just because a sub-class can be animatable does not mean it is
        self.animationsPresent = object.animation_data and object.animation_data.action

        rotAnim = False
        locAnim = False
        scaAnim = False
        useQuat = object.rotation_mode=='QUATERNION'

        if (self.animationsPresent):
            BabylonExporter.log('FCurve animation processing begun for:  ' + object.name, 1)
            self.animations = []
            for fcurve in object.animation_data.action.fcurves:
                if supportsRotation and fcurve.data_path == 'rotation_euler' and rotAnim == False and useQuat == False:
                    self.animations.append(VectorAnimation(object, 'rotation_euler', 'rotation', -1, xOffsetForRotation))
                    rotAnim = True
                elif supportsRotation and fcurve.data_path == 'rotation_quaternion' and rotAnim == False and useQuat == True:
                    anim = None
                    if object.type == 'CAMERA':
                        # if it's a camera, convert quaternions to euler XYZ
                        anim = QuaternionToEulerAnimation(object, 'rotation_quaternion', 'rotation', -1, xOffsetForRotation)
                    else:
                        anim = QuaternionAnimation(object, 'rotation_quaternion', 'rotationQuaternion', 1, xOffsetForRotation)
                    self.animations.append(anim)
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
    def __init__(self, object, scene, multiMaterials, startFace, forcedParent, nameID, noVertexOpt):
        super().__init__(object, True, True, True)  #Should animations be done when forcedParent

        self.name = object.name + str(nameID)
        BabylonExporter.log('processing begun of mesh:  ' + self.name)
        self.isVisible = not object.hide_render
        self.isEnabled = True
        self.useFlatShading = object.data.useFlatShading
        self.checkCollisions = object.data.checkCollisions
        self.receiveShadows = object.data.receiveShadows
        self.castShadows = object.data.castShadows

        if forcedParent is None:
            self.dataName = object.data.name # used to support shared vertex instances in later passed
            if object.parent and object.parent.type != 'ARMATURE':
                self.parentId = object.parent.name
        else:
            self.dataName = self.name
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

        # detect if any textures in the material slots, which would mean UV mapping is required
        uvRequired = False
        for slot in object.material_slots:
            uvRequired |= BabylonExporter.uvRequiredForMaterial(slot.name)

        if len(object.material_slots) == 1:
            self.materialId = BabylonExporter.nameSpace + '.' + object.material_slots[0].name
            self.billboardMode = BILLBOARDMODE_ALL if object.material_slots[0].material.game_settings.face_orientation == 'BILLBOARD' else BILLBOARDMODE_NONE;

        elif len(object.material_slots) > 1:
            multimat = MultiMaterial(object.material_slots, len(multiMaterials))
            self.materialId = multimat.name
            multiMaterials.append(multimat)
            self.billboardMode = BILLBOARDMODE_NONE
        else:
            self.billboardMode = BILLBOARDMODE_NONE
            BabylonExporter.warn('WARNING:  No materials have been assigned: ', 2)

        # Get mesh
        mesh = object.to_mesh(scene, True, 'PREVIEW')

        # use defaults when not None
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
            self.skeletonIndicesCompressed = []

        # used tracking of vertices as they are received
        alreadySavedVertices = []
        vertices_UVs = []
        vertices_UV2s = []
        vertices_Colors = []
        vertices_indices = []

        self.offsetFace = 0

        for v in range(0, len(mesh.vertices)):
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
                        matricesIndicesCompressed = 0

                        # Getting influences
                        i = 0
                        offset = 0
                        for group in vertex.groups:
                            index = group.group
                            weight = group.weight

                            for boneIndex, bone in enumerate(objArmature.pose.bones):
                                if object.vertex_groups[index].name == bone.name:
                                    if (i == MAX_INFLUENCERS_PER_VERTEX):
                                        BabylonExporter.warn('WARNING: Maximum # of influencers exceeded for a vertex, extras ignored', 2)
                                        break
                                    matricesWeights[i] = weight
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
                    alreadySaved = alreadySavedVertices[vertex_index] and not (hasSkeleton or noVertexOpt)
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
                            self.colors.append(1.0)
                        if hasSkeleton:
                            self.skeletonWeights.append(matricesWeights[0])
                            self.skeletonWeights.append(matricesWeights[1])
                            self.skeletonWeights.append(matricesWeights[2])
                            self.skeletonWeights.append(matricesWeights[3])
                            self.skeletonIndicesCompressed.append(matricesIndicesCompressed)

                        vertices_indices[vertex_index].append(index)

                        self.positions.append(position)
                        self.normals.append(normal)

                        verticesCount += 1
                    self.indices.append(index)
                    indicesCount += 1

            self.subMeshes.append(SubMesh(materialIndex, subMeshVerticesStart, subMeshIndexStart, verticesCount - subMeshVerticesStart, indicesCount - subMeshIndexStart))

        BabylonExporter.log('num positions      :  ' + str(len(self.positions)), 2)
        BabylonExporter.log('num normals        :  ' + str(len(self.normals  )), 2)
        BabylonExporter.log('num uvs            :  ' + str(len(self.uvs      )), 2)
        BabylonExporter.log('num uvs2           :  ' + str(len(self.uvs2     )), 2)
        BabylonExporter.log('num colors         :  ' + str(len(self.colors   )), 2)
        BabylonExporter.log('num indices        :  ' + str(len(self.indices  )), 2)
        if hasattr(self, 'skeletonWeights'):
            BabylonExporter.log('num skeletonWeights:  ' + str(len(self.skeletonWeights)), 2)
            BabylonExporter.log('num skeletonIndices:  ' + str(len(self.skeletonIndicesCompressed * 4)), 2)

        if uvRequired and len(self.uvs) == 0:
            BabylonExporter.warn('WARNING: textures being used, but no UV Map found', 2)

        numZeroAreaFaces = self.find_zero_area_faces()
        if numZeroAreaFaces > 0:
            BabylonExporter.warn('WARNING: # of 0 area faces found:  ' + str(numZeroAreaFaces), 2)
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
    def to_scene_file(self, file_handler, meshesAndNodes):
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
            if hasattr(mesh, "dataName") and mesh.dataName == self.dataName and mesh != self:  # nodes have no dataname, so no need to check for
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

        # Close mesh
        file_handler.write('}\n')
        self.alreadyExported = True
#===============================================================================
class Node(FCurveAnimatable):
    def __init__(self, node):
        super().__init__(node, True, True, True)  #Should animations be done when foredParent
        BabylonExporter.log('processing begun of node:  ' + node.name)
        self.name = node.name

        if node.parent and node.parent.type != 'ARMATURE':
            self.parentId = node.parent.name

        loc, rot, scale = node.matrix_local.decompose()

        if node.parent != None:
            self.parentId = node.parent.name

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
    def get_proper_name(self):
        return legal_js_identifier(self.name)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler, ignored):
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
        BabylonExporter.log('processing begun of bone:  ' + bone.name + ', index:  '+ str(index))
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
            BabylonExporter.log('animation begun of bone:  ' + self.name)
            self.animation = Animation(ANIMATIONTYPE_MATRIX, scene.render.fps, ANIMATIONLOOPMODE_CYCLE, 'anim', '_matrix')

            start_frame = scene.frame_start
            end_frame = scene.frame_end
            previousBoneMatrix = None
            for frame in range(start_frame, end_frame + 1):
                bpy.context.scene.frame_set(frame)
                currentBoneMatrix = Bone.get_matrix(bone, matrix_world)

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
#===============================================================================
class Skeleton:
    def __init__(self, skeleton, scene, id):
        BabylonExporter.log('processing begun of skeleton:  ' + skeleton.name + ', id:  '+ str(id))
        self.name = skeleton.name
        self.id = id
        self.bones = []

        bones = skeleton.pose.bones
        j = 0
        for bone in bones:
            self.bones.append(Bone(bone, skeleton, scene, j))
            j = j + 1

        BabylonExporter.log('processing complete of skeleton:  ' + skeleton.name)
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
        BabylonExporter.log('processing begun of camera (' + self.CameraType + '):  ' + self.name)
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

        for constraint in camera.constraints:
            if constraint.type == 'TRACK_TO':
                self.lockedTargetId = constraint.target.name
                break

        if self.CameraType == ANAGLYPH_ARC_CAM or self.CameraType == ANAGLYPH_FREE_CAM:
            self.anaglyphEyeSpace = camera.data.anaglyphEyeSpace

        if self.CameraType == ANAGLYPH_ARC_CAM or self.CameraType == ARC_ROTATE_CAM or self.CameraType == FOLLOW_CAM:
            if not hasattr(self, 'lockedTargetId'):
                BabylonExporter.warn('ERROR: Camera type with manditory target specified, but no target to track set', 2)
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

        elif self.CameraType ==  ANAGLYPH_ARC_CAM or self.CameraType == ARC_ROTATE_CAM:
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

        write_string(file_handler, 'type', self.CameraType)

        if hasattr(self, 'parentId'): write_string(file_handler, 'parentId', self.parentId)

        if self.CameraType == FOLLOW_CAM:
            write_float(file_handler, 'heightOffset',  self.followHeight)
            write_float(file_handler, 'radius',  self.followDistance)
            write_float(file_handler, 'rotationOffset',  self.followRotation)

        elif self.CameraType == ANAGLYPH_ARC_CAM or self.CameraType == ARC_ROTATE_CAM:
            write_float(file_handler, 'alpha', self.arcRotAlpha)
            write_float(file_handler, 'beta', self.arcRotBeta)
            write_float(file_handler, 'radius',  self.arcRotRadius)

            if self.CameraType ==  ANAGLYPH_ARC_CAM:
                write_float(file_handler, 'eye_space',  self.anaglyphEyeSpace)

        elif self.CameraType == ANAGLYPH_FREE_CAM:
            write_float(file_handler, 'eye_space',  self.anaglyphEyeSpace)

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
        BabylonExporter.log('processing begun of light (' + light.data.type + '):  ' + self.name)
        light_type_items = {'POINT': POINT_LIGHT, 'SUN': DIRECTIONAL_LIGHT, 'SPOT': SPOT_LIGHT, 'HEMI': HEMI_LIGHT, 'AREA': 0}
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
            # Hemi & Area
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

        if hasattr(self, 'parentId'   ): write_string(file_handler, 'parentId', self.parentId)
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
        BabylonExporter.log('processing begun of shadows for light:  ' + lamp.name)
        self.useVarianceShadowMap = lamp.data.shadowMap == 'VAR' if True else False
        self.mapSize = lamp.data.shadowMapSize
        self.lightId = lamp.name

        self.shadowCasters = []
        for mesh in meshesAndNodes:
            if (mesh.castShadows):
                self.shadowCasters.append(mesh.name)
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
#===============================================================================
class MultiMaterial:
    def __init__(self, material_slots, idx):
        self.name = BabylonExporter.nameSpace + '.' + 'Multimaterial#' + str(idx)
        BabylonExporter.log('processing begun of multimaterial:  ' + self.name, 2)
        self.materials = []

        for mat in material_slots:
            self.materials.append(BabylonExporter.nameSpace + '.' + mat.name)
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
            BabylonExporter.log_handler.write('Error encountered processing image file:  ' + imageFilepath + ', Error:  '+ str(ex[1]) + '\n')
            #pass

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
            self.wrapV = CLAMP_ADDRESSMODE

        self.coordinatesIndex = 0
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write(', "' + self.slot + '":{')
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
#===============================================================================
class Material:
    def __init__(self, material, scene, filepath):
        self.name = BabylonExporter.nameSpace + '.' + material.name
        BabylonExporter.log('processing begun of material:  ' + self.name)
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
                        BabylonExporter.log('Diffuse texture found');
                        self.textures.append(Texture('diffuseTexture', mtex.diffuse_color_factor, mtex, filepath))
                    if mtex.use_map_ambient:
                        # Ambient
                        BabylonExporter.log('Ambient texture found');
                        self.textures.append(Texture('ambientTexture', mtex.ambient_factor, mtex, filepath))
                    if mtex.use_map_alpha:
                        # Opacity
                        BabylonExporter.log('Opacity texture found');
                        self.textures.append(Texture('opacityTexture', mtex.alpha_factor, mtex, filepath))
                    if mtex.use_map_color_diffuse and (mtex.texture_coords == 'REFLECTION'):
                        # Reflection
                        BabylonExporter.log('Reflection texture found');
                        self.textures.append(Texture('reflectionTexture', mtex.diffuse_color_factor, mtex, filepath))
                    if mtex.use_map_emit:
                        # Emissive
                        BabylonExporter.log('Emissive texture found');
                        self.textures.append(Texture('emissiveTexture', mtex.emit_factor, mtex, filepath))
                    if mtex.use_map_normal:
                        # Bump
                        BabylonExporter.log('Bump texture found');
                        self.textures.append(Texture('bumpTexture', mtex.normal_factor, mtex, filepath))
                    elif mtex.use_map_color_spec:
                        # Specular
                        BabylonExporter.log('Specular texture found');
                        self.textures.append(Texture('specularTexture', mtex.specular_color_factor, mtex, filepath))
            else:
                 BabylonExporter.warn('WARNING texture type not currently supported:  ' + mtex.texture.type + ', ignored.')
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
        for texSlot in self.textures:
            texSlot.to_scene_file(file_handler)

        file_handler.write('}')
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

def same_vertex(vertA, vertB):
    return vertA.x == vertB.x and vertA.y == vertB.y and vertA.z == vertB.z

def post_rotate_quaternion(quat, angle):
    post = mathutils.Euler((angle, 0.0, 0.0)).to_matrix()
    mqtn = quat.to_matrix()
    quat = (mqtn*post).to_quaternion()
    return quat

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
    name='Automatically launch animations',
    description='',
    default = False
)
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
#===============================================================================
bpy.types.Camera.autoAnimate = bpy.props.BoolProperty(
    name='Automatically launch animations',
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
             (ANAGLYPH_FREE_CAM      , 'Anaglyph Free'           , 'Use Anaglyph Free Camera'),
             (ANAGLYPH_ARC_CAM       , 'Anaglyph Arc Rotate'     , 'Use Anaglyph Arc Rotate Camera'),
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
bpy.types.Camera.anaglyphEyeSpace = bpy.props.IntProperty(
    name='Anaglyph Eye space',
    description='Used by the Anaglyph Arc Rotate camera',
    default = 1
)
#===============================================================================
bpy.types.Lamp.autoAnimate = bpy.props.BoolProperty(
    name='Automatically launch animations',
    description='',
    default = False
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
            layout.prop(ob.data, 'useFlatShading')
            layout.prop(ob.data, 'checkCollisions')
            layout.prop(ob.data, 'castShadows')
            layout.prop(ob.data, 'receiveShadows')

            layout.separator()

            layout.prop(ob.data, 'autoAnimate')

            layout.separator()

            layout.prop(ob.data, 'attachedSound')
            layout.prop(ob.data, 'autoPlaySound')
            layout.prop(ob.data, 'loopSound')
            layout.prop(ob.data, 'maxSoundDistance')

        elif isCamera:
            layout.prop(ob.data, 'CameraType')
            layout.prop(ob.data, 'checkCollisions')
            layout.prop(ob.data, 'applyGravity')
            layout.prop(ob.data, 'ellipsoid')

            layout.separator()

            layout.prop(ob.data, 'anaglyphEyeSpace')

            layout.separator()

            layout.prop(ob.data, 'autoAnimate')

        elif isLight:
            layout.prop(ob.data, 'shadowMap')
            layout.prop(ob.data, 'shadowMapSize')

            layout.separator()

            layout.prop(ob.data, 'autoAnimate')