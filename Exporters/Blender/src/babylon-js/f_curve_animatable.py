from .animation import *
from .logger import *
from .package_level import *

import bpy
#===============================================================================
class FCurveAnimatable:
    def define_animations(self, object, supportsRotation, supportsPosition, supportsScaling, xOffsetForRotation = 0):

        # just because a sub-class can be animatable does not mean it is
        self.animationsPresent = object.animation_data and object.animation_data.action

        if (self.animationsPresent):
            Logger.log('animation processing begun', 2)
            # instance each type of animation support regardless of whether there is any data for it
            if supportsRotation:
                if object.rotation_mode == 'QUATERNION':
                    if object.type == 'CAMERA':
                        # if it's a camera, convert quaternions to euler XYZ
                        rotAnimation = QuaternionToEulerAnimation(object, 'rotation', 'rotation_quaternion', -1, xOffsetForRotation)
                    else:
                        rotAnimation = QuaternionAnimation(object, 'rotationQuaternion', 'rotation_quaternion', 1, xOffsetForRotation)
                else:
                    rotAnimation = VectorAnimation(object, 'rotation', 'rotation_euler', -1, xOffsetForRotation)

            if supportsPosition:
                posAnimation = VectorAnimation(object, 'position', 'location')

            if supportsScaling:
                scaleAnimation = VectorAnimation(object, 'scaling', 'scale')

            self.ranges = []
            frameOffset = 0

            currentAction = object.animation_data.action
            currentFrame = bpy.context.scene.frame_current
            for action in bpy.data.actions:
                # get the range / assigning the action to the object
                animationRange = AnimationRange.actionPrep(object, action, False, frameOffset)
                if animationRange is None:
                    continue

                if supportsRotation:
                    hasData = rotAnimation.append_range(object, animationRange)

                if supportsPosition:
                    hasData |= posAnimation.append_range(object, animationRange)

                if supportsScaling:
                    hasData |= scaleAnimation.append_range(object, animationRange)

                if hasData:
                    Logger.log('processing action ' + animationRange.to_string(), 3)
                    self.ranges.append(animationRange)
                    frameOffset = animationRange.frame_end

            object.animation_data.action = currentAction
            bpy.context.scene.frame_set(currentFrame)
            #Set Animations
            self.animations = []
            if supportsRotation and len(rotAnimation.frames) > 0:
                 self.animations.append(rotAnimation)

            if supportsPosition and len(posAnimation.frames) > 0:
                 self.animations.append(posAnimation)

            if supportsScaling and len(scaleAnimation.frames) > 0:
                 self.animations.append(scaleAnimation)

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

            file_handler.write(',"ranges":[')
            first = True
            for range in self.ranges:
                if first != True:
                    file_handler.write(',')
                first = False

                range.to_scene_file(file_handler)

            file_handler.write(']')

            if (hasattr(self, "autoAnimate") and self.autoAnimate):
                write_bool(file_handler, 'autoAnimate', self.autoAnimate)
                write_int(file_handler, 'autoAnimateFrom', self.autoAnimateFrom)
                write_int(file_handler, 'autoAnimateTo', self.autoAnimateTo)
                write_bool(file_handler, 'autoAnimateLoop', self.autoAnimateLoop)