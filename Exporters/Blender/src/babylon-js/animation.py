from .logger import *
from .package_level import *

import bpy

FRAME_BASED_ANIMATION = True # turn off for diagnostics; only actual keyframes will be written for skeleton animation

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
class AnimationRange:
    # constructor called by the static actionPrep method
    def __init__(self, name, frames, frameOffset):
        # process input args to members
        self.name = name
        self.frames_in = frames
        self.frame_start = AnimationRange.nextStartingFrame(frameOffset)

        self.frames_out = []
        for frame in self.frames_in:
            self.frames_out.append(self.frame_start + frame)

        highest_idx = len(self.frames_in) - 1
        self.highest_frame_in = self.frames_in [highest_idx]
        self.frame_end        = self.frames_out[highest_idx]
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_string(self):
        return self.name + ': ' + ' in[' + format_int(self.frames_in[0]) + ' - ' + format_int(self.highest_frame_in) + '], out[' + format_int(self.frame_start) + ' - ' + format_int(self.frame_end) + ']'
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler):
        file_handler.write('{')
        write_string(file_handler, 'name', self.name, True)
        write_int(file_handler, 'from', self.frame_start)
        write_int(file_handler, 'to', self.frame_end)
        file_handler.write('}')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    @staticmethod
    def actionPrep(object, action, includeAllFrames, frameOffset):
        # when name in format of object-action, verify object's name matches
        if action.name.find('-') > 0:
            split = action.name.partition('-')
            if split[0] != object.name: return None
            actionName = split[2]
        else:
            actionName = action.name

        # assign the action to the object
        object.animation_data.action = action

        if includeAllFrames:
            frame_start = int(action.frame_range[0])
            frame_end   = int(action.frame_range[1])
            frames = range(frame_start, frame_end + 1) # range is not inclusive with 2nd arg

        else:
            # capture built up from fcurves
            frames = dict()
            for fcurve in object.animation_data.action.fcurves:
                for key in fcurve.keyframe_points:
                    frame = key.co.x
                    frames[frame] = True

            frames = sorted(frames)

        return AnimationRange(actionName, frames, frameOffset)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    @staticmethod
    def nextStartingFrame(frameOffset):
        if frameOffset == 0: return 0

        # ensure a gap of at least 5 frames, starting on an even multiple of 10
        frameOffset += 4
        remainder = frameOffset % 10
        return frameOffset + 10 - remainder

#===============================================================================
class Animation:
    def __init__(self, dataType, loopBehavior, name, propertyInBabylon, attrInBlender = None, mult = 1, xOffset = 0):
        self.dataType = dataType
        self.framePerSecond = bpy.context.scene.render.fps
        self.loopBehavior = loopBehavior
        self.name = name
        self.propertyInBabylon = propertyInBabylon

        # these never get used by Bones, so optional in contructor args
        self.attrInBlender = attrInBlender
        self.mult = mult
        self.xOffset = xOffset

        #keys
        self.frames = []
        self.values = [] # vector3 for ANIMATIONTYPE_VECTOR3 & matrices for ANIMATIONTYPE_MATRIX
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    # a separate method outside of constructor, so can be called once for each Blender Action object participates in
    def append_range(self, object, animationRange):
        # action already assigned, always using poses, not every frame, build up again filtering by attrInBlender
        for idx in range(len(animationRange.frames_in)):
            bpy.context.scene.frame_set(animationRange.frames_in[idx])

            self.frames.append(animationRange.frames_out[idx])
            self.values.append(self.get_attr(object))

        return len(animationRange.frames_in) > 0
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
            file_handler.write('\n{')
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
    def __init__(self, object, propertyInBabylon, attrInBlender, mult = 1, xOffset = 0):
        super().__init__(ANIMATIONTYPE_VECTOR3, ANIMATIONLOOPMODE_CYCLE, propertyInBabylon + ' animation', propertyInBabylon, attrInBlender, mult, xOffset)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def get_attr(self, object):
        return scale_vector(getattr(object, self.attrInBlender), self.mult, self.xOffset)
#===============================================================================
class QuaternionAnimation(Animation):
    def __init__(self, object, propertyInBabylon, attrInBlender, mult = 1, xOffset = 0):
        super().__init__(ANIMATIONTYPE_QUATERNION, ANIMATIONLOOPMODE_CYCLE, propertyInBabylon + ' animation', propertyInBabylon, attrInBlender, mult, xOffset)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def get_attr(self, object):
        return post_rotate_quaternion(getattr(object, self.attrInBlender), self.xOffset)
#===============================================================================
class QuaternionToEulerAnimation(Animation):
    def __init__(self, propertyInBabylon, attrInBlender, mult = 1, xOffset = 0):
        super().__init__(ANIMATIONTYPE_VECTOR3, ANIMATIONLOOPMODE_CYCLE, propertyInBabylon + ' animation', propertyInBabylon, attrInBlender, mult, Offset)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def get_attr(self, object):
        quat = getattr(object, self.attrInBlender)
        eul  = quat.to_euler("XYZ")
        return scale_vector(eul, self.mult, self.xOffset)