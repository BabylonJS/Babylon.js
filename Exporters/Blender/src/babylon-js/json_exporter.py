from .animation import *
from .armature import *
from .camera import *
from .exporter_settings_panel import *
from .light_shadow import *
from .logger import *
from .material import *
from .mesh import *
from .package_level import *
from .sound import *
from .world import *

import bpy
from io import open
from os import path, makedirs
#===============================================================================
class JsonExporter:
    nameSpace   = None  # assigned in execute
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def execute(self, context, filepath):
        scene = context.scene
        self.scene = scene # reference for passing
        self.fatalError = None
        try:
            self.filepathMinusExtension = filepath.rpartition('.')[0]
            JsonExporter.nameSpace = getNameSpace(self.filepathMinusExtension)

            log = Logger(self.filepathMinusExtension + '.log')

            if bpy.ops.object.mode_set.poll():
                bpy.ops.object.mode_set(mode = 'OBJECT')

            # assign texture location, purely temporary if in-lining
            self.textureDir = path.dirname(filepath)
            if not scene.inlineTextures:
                self.textureDir = path.join(self.textureDir, scene.textureDir)
                if not path.isdir(self.textureDir):
                    makedirs(self.textureDir)
                    Logger.warn('Texture sub-directory did not already exist, created: ' + self.textureDir)

            Logger.log('========= Conversion from Blender to Babylon.js =========', 0)
            Logger.log('Scene settings used:', 1)
            Logger.log('selected layers only:  ' + format_bool(scene.export_onlySelectedLayer), 2)
            Logger.log('flat shading entire scene:  ' + format_bool(scene.export_flatshadeScene), 2)
            Logger.log('inline textures:  ' + format_bool(scene.inlineTextures), 2)
            if not scene.inlineTextures:
                Logger.log('texture directory:  ' + self.textureDir, 2)
            self.world = World(scene)

            bpy.ops.screen.animation_cancel()
            currentFrame = bpy.context.scene.frame_current

            # Active camera
            if scene.camera != None:
                self.activeCamera = scene.camera.name
            else:
                Logger.warn('No active camera has been assigned, or is not in a currently selected Blender layer')

            self.cameras = []
            self.lights = []
            self.shadowGenerators = []
            self.skeletons = []
            skeletonId = 0
            self.meshesAndNodes = []
            self.morphTargetMngrs = []
            self.materials = []
            self.multiMaterials = []
            self.sounds = []
            self.needPhysics = False

            # Scene level sound
            if scene.attachedSound != '':
                self.sounds.append(Sound(scene.attachedSound, scene.autoPlaySound, scene.loopSound))

            # separate loop doing all skeletons, so available in Mesh to make skipping IK bones possible
            for object in [object for object in scene.objects]:
                scene.frame_set(currentFrame)
                if object.type == 'ARMATURE':  #skeleton.pose.bones
                    if object.is_visible(scene):
                        self.skeletons.append(Skeleton(object, scene, skeletonId, scene.ignoreIKBones))
                        skeletonId += 1
                    else:
                        Logger.warn('The following armature not visible in scene thus ignored: ' + object.name)

            # exclude lamps in this pass, so ShadowGenerator constructor can be passed meshesAnNodes
            for object in [object for object in scene.objects]:
                scene.frame_set(currentFrame)
                if object.type == 'CAMERA':
                    if object.is_visible(scene): # no isInSelectedLayer() required, is_visible() handles this for them
                        self.cameras.append(Camera(object))
                    else:
                        Logger.warn('The following camera not visible in scene thus ignored: ' + object.name)

                elif object.type == 'MESH':
                    forcedParent = None
                    nameID = ''
                    nextStartFace = 0

                    while True and self.isInSelectedLayer(object, scene):
                        mesh = Mesh(object, scene, nextStartFace, forcedParent, nameID, self)
                        if mesh.hasUnappliedTransforms and hasattr(mesh, 'skeletonWeights'):
                            self.fatalError = 'Mesh: ' + mesh.name + ' has un-applied transformations.  This will never work for a mesh with an armature.  Export cancelled'
                            Logger.log(self.fatalError)
                            return

                        if hasattr(mesh, 'physicsImpostor'): self.needPhysics = True
                        
                        if hasattr(mesh, 'instances'):
                            self.meshesAndNodes.append(mesh)
                            if hasattr(mesh, 'morphTargetManagerId'):
                                self.morphTargetMngrs.append(mesh)
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
                            Logger.warn('The following mesh has exceeded the maximum # of vertex elements & will be broken into multiple Babylon meshes: ' + object.name)

                        nameID = nameID + 1

                elif object.type == 'EMPTY':
                    self.meshesAndNodes.append(Node(object))

                elif object.type != 'LAMP' and object.type != 'ARMATURE':
                    Logger.warn('The following object (type - ' +  object.type + ') is not currently exportable thus ignored: ' + object.name)

            # Lamp / shadow Generator pass; meshesAnNodes complete & forceParents included
            for object in [object for object in scene.objects]:
                if object.type == 'LAMP':
                    if object.is_visible(scene): # no isInSelectedLayer() required, is_visible() handles this for them
                        bulb = Light(object, self.meshesAndNodes)
                        self.lights.append(bulb)
                        if object.data.shadowMap != 'NONE':
                            if bulb.light_type == DIRECTIONAL_LIGHT or bulb.light_type == SPOT_LIGHT:
                                self.shadowGenerators.append(ShadowGenerator(object, self.meshesAndNodes, scene))
                            else:
                                Logger.warn('Only directional (sun) and spot types of lamp are valid for shadows thus ignored: ' + object.name)
                    else:
                        Logger.warn('The following lamp not visible in scene thus ignored: ' + object.name)

            bpy.context.scene.frame_set(currentFrame)

            # output file
            self.to_scene_file()

        except:# catch *all* exceptions
            log.log_error_stack()
            raise

        finally:
            log.close()

        self.nWarnings = log.nWarnings
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self):
        Logger.log('========= Writing of scene file started =========', 0)
        # Open file
        file_handler = open(self.filepathMinusExtension + '.babylon', 'w', encoding='utf8')
        file_handler.write('{')
        file_handler.write('"producer":{"name":"Blender","version":"' + bpy.app.version_string + '","exporter_version":"' + format_exporter_version() + '","file":"' + JsonExporter.nameSpace + '.babylon"},\n')
        self.world.to_scene_file(file_handler, self.needPhysics)

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
        for mesh in self.meshesAndNodes:
            if first != True:
                file_handler.write(',')

            first = False
            mesh.to_scene_file(file_handler)
        file_handler.write(']')

        # Morph targets
        file_handler.write(',\n"morphTargetManagers":[')
        first = True
        for mesh in self.morphTargetMngrs:
            if first != True:
                file_handler.write(',')

            first = False
            mesh.write_morphing_file(file_handler)
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
        Logger.log('========= Writing of scene file completed =========', 0)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def getMaterial(self, baseMaterialId):
        fullName = JsonExporter.nameSpace + '.' + baseMaterialId
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
    def isInSelectedLayer(self, obj, scene):
        if not scene.export_onlySelectedLayer:
            return True

        for l in range(0, len(scene.layers)):
            if obj.layers[l] and scene.layers[l]:
                return True
        return False
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def get_skeleton(self, name):
        for skeleton in self.skeletons:
            if skeleton.name == name:
                return skeleton
        #really cannot happen, will cause exception in caller
        return None