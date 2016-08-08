from .animation import *
from .logger import *
from .package_level import *

import bpy
from math import radians
from mathutils import Vector, Matrix

DEFAULT_LIB_NAME = 'Same as filename'
#===============================================================================
class Bone:
    def __init__(self, bpyBone, bpySkeleton, bonesSoFar):
        self.index = len(bonesSoFar)
        Logger.log('processing begun of bone:  ' + bpyBone.name + ', index:  '+ str(self.index), 2)
        self.name = bpyBone.name
        self.length = bpyBone.length
        self.posedBone = bpyBone # record so can be used by get_matrix, called by append_animation_pose
        self.parentBone = bpyBone.parent

        self.matrix_world = bpySkeleton.matrix_world
        self.matrix = self.get_bone_matrix()

        self.parentBoneIndex = Skeleton.get_bone(bpyBone.parent.name, bonesSoFar).index if bpyBone.parent else -1

        #animation
        if (bpySkeleton.animation_data):
            self.animation = Animation(ANIMATIONTYPE_MATRIX, ANIMATIONLOOPMODE_CYCLE, 'anim', '_matrix')
            self.previousBoneMatrix = None
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def append_animation_pose(self, frame, force = False):
        currentBoneMatrix = self.get_bone_matrix()

        if (force or not same_matrix4(currentBoneMatrix, self.previousBoneMatrix)):
            self.animation.frames.append(frame)
            self.animation.values.append(currentBoneMatrix)
            self.previousBoneMatrix = currentBoneMatrix
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def set_rest_pose(self, editBone):
        self.rest = Bone.get_matrix(editBone, self.matrix_world, True)
        # used to calc skeleton restDimensions
        self.restHead = editBone.head
        self.restTail = editBone.tail
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def get_bone_matrix(self, doParentMult = True):
        return Bone.get_matrix(self.posedBone, self.matrix_world, doParentMult)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    @staticmethod
    def get_matrix(bpyBone, matrix_world, doParentMult):
        SystemMatrix = Matrix.Scale(-1, 4, Vector((0, 0, 1))) * Matrix.Rotation(radians(-90), 4, 'X')

        if (bpyBone.parent and doParentMult):
            return (SystemMatrix * matrix_world * bpyBone.parent.matrix).inverted() * (SystemMatrix * matrix_world * bpyBone.matrix)
        else:
            return SystemMatrix * matrix_world * bpyBone.matrix
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('\n{')
        write_string(file_handler, 'name', self.name, True)
        write_int(file_handler, 'index', self.index)
        write_matrix4(file_handler, 'matrix', self.matrix)
        write_matrix4(file_handler, 'rest', self.rest)
        write_int(file_handler, 'parentBoneIndex', self.parentBoneIndex)
        write_float(file_handler, 'length', self.length)

        #animation
        if hasattr(self, 'animation'):
            file_handler.write('\n,"animation":')
            self.animation.to_scene_file(file_handler)

        file_handler.write('}')
#===============================================================================
class Skeleton:
    # skipAnimations argument only used when exporting QI.SkeletonPoseLibrary
    def __init__(self, bpySkeleton, scene, id, ignoreIKBones, skipAnimations = False):
        Logger.log('processing begun of skeleton:  ' + bpySkeleton.name + ', id:  '+ str(id))
        self.name = bpySkeleton.name
        self.id = id
        self.bones = []

        for bone in bpySkeleton.pose.bones:
            if ignoreIKBones and Skeleton.isIkName(bone.name):
                Logger.log('Ignoring IK bone:  ' + bone.name, 2)
                continue

            self.bones.append(Bone(bone, bpySkeleton, self.bones))

        if (bpySkeleton.animation_data and not skipAnimations):
            self.ranges = []
            frameOffset = 0
            for action in bpy.data.actions:
                # get the range / assigning the action to the object
                animationRange = AnimationRange.actionPrep(bpySkeleton, action, FRAME_BASED_ANIMATION, frameOffset)
                if animationRange is None:
                    continue

                Logger.log('processing action ' + animationRange.to_string(), 2)
                self.ranges.append(animationRange)

                nFrames = len(animationRange.frames_in)
                for idx in range(nFrames):
                    bpy.context.scene.frame_set(animationRange.frames_in[idx])
                    firstOrLast = idx == 0 or idx == nFrames - 1

                    for bone in self.bones:
                        bone.append_animation_pose(animationRange.frames_out[idx], firstOrLast)

                frameOffset = animationRange.frame_end

        # mode_set's only work when there is an active object, switch bones to edit mode to rest position
        scene.objects.active = bpySkeleton
        bpy.ops.object.mode_set(mode='EDIT')

        # you need to access edit_bones from skeleton.data not skeleton.pose when in edit mode
        for editBone in bpySkeleton.data.edit_bones:
            for myBoneObj in self.bones:
                if editBone.name == myBoneObj.name:
                    myBoneObj.set_rest_pose(editBone)
                    break

        self.dimensions = self.getDimensions()

        bpy.ops.object.mode_set(mode='POSE')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # do not use .dimensions from blender, it might be including IK bones
    def getDimensions(self):
        highest = Vector((-10000, -10000, -10000))
        lowest  = Vector(( 10000,  10000,  10000))

        for bone in self.bones:
            if highest.x < bone.restHead.x: highest.x = bone.restHead.x
            if highest.y < bone.restHead.y: highest.y = bone.restHead.y
            if highest.z < bone.restHead.z: highest.z = bone.restHead.z

            if highest.x < bone.restTail.x: highest.x = bone.restTail.x
            if highest.y < bone.restTail.y: highest.y = bone.restTail.y
            if highest.z < bone.restTail.z: highest.z = bone.restTail.z

            if lowest .x > bone.restHead.x: lowest .x = bone.restHead.x
            if lowest .y > bone.restHead.y: lowest .y = bone.restHead.y
            if lowest .z > bone.restHead.z: lowest .z = bone.restHead.z

            if lowest .x > bone.restTail.x: lowest .x = bone.restTail.x
            if lowest .y > bone.restTail.y: lowest .y = bone.restTail.y
            if lowest .z > bone.restTail.z: lowest .z = bone.restTail.z

        return Vector((highest.x - lowest.x, highest.y - lowest.y, highest.z - lowest.z))
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    @staticmethod
    def isIkName(boneName):
        return '.ik' in boneName.lower() or 'ik.' in boneName.lower()
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # Since IK bones could be being skipped, looking up index of bone in second pass of mesh required
    def get_index_of_bone(self, boneName):
        return Skeleton.get_bone(boneName, self.bones).index

    @staticmethod
    def get_bone(boneName, bones):
        for bone in bones:
            if boneName == bone.name:
                return bone

        # should not happen, but if it does clearly a bug, so terminate
        raise Exception('bone name "' + boneName + '" not found in skeleton')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_int(file_handler, 'id', self.id)  # keep int for legacy of original exporter
        write_vector(file_handler, 'dimensionsAtRest', self.dimensions)

        file_handler.write(',"bones":[')
        first = True
        for bone in self.bones:
            if first != True:
                file_handler.write(',')
            first = False

            bone.to_scene_file(file_handler)

        file_handler.write(']')

        if hasattr(self, 'ranges'):
            file_handler.write('\n,"ranges":[')
            first = True
            for range in self.ranges:
                if first != True:
                    file_handler.write(',')
                first = False

                range.to_scene_file(file_handler)

            file_handler.write(']')

        file_handler.write('}')