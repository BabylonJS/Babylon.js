from .logger import *
from .package_level import *

import bpy
import mathutils

# used in World constructor, defined in BABYLON.Scene
FOGMODE_NONE = 0
FOGMODE_EXP = 1
FOGMODE_EXP2 = 2
FOGMODE_LINEAR = 3

eFOGMODE_NONE = "NONE"
eFOGMODE_LINEAR = "LINEAR"
eFOGMODE_EXP = "EXP"
eFOGMODE_EXP2 = "EXP2"

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
            if world.fogMode == eFOGMODE_LINEAR:
                self.fogMode = FOGMODE_LINEAR
            elif world.fogMode == eFOGMODE_EXP:
                self.fogMode = FOGMODE_EXP
            elif world.fogMode == eFOGMODE_EXP2:
                self.fogMode = FOGMODE_EXP2
            self.fogColor = world.horizon_color
            self.fogStart = world.mist_settings.start
            self.fogEnd = world.mist_settings.depth
            self.fogDensity = world.fogDensity
        else:
            self.fogMode = FOGMODE_NONE
        
        Logger.log('Python World class constructor completed')
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    def to_scene_file(self, file_handler, needPhysics):
        write_bool(file_handler, 'autoClear', self.autoClear, True)
        write_color(file_handler, 'clearColor', self.clear_color)
        write_color(file_handler, 'ambientColor', self.ambient_color)
        write_vector(file_handler, 'gravity', self.gravity)
        
        if needPhysics:
            write_bool(file_handler, 'physicsEnabled', True)
            
        if hasattr(self, 'fogMode') and (self.fogMode != FOGMODE_NONE):
            write_int(file_handler, 'fogMode', self.fogMode)
            write_color(file_handler, 'fogColor', self.fogColor)
            write_float(file_handler, 'fogStart', self.fogStart)
            write_float(file_handler, 'fogEnd', self.fogEnd)
            write_float(file_handler, 'fogDensity', self.fogDensity)

#===============================================================================

bpy.types.World.fogMode = bpy.props.EnumProperty(
    name='Fog Mode',
    description='',
    items = ((eFOGMODE_LINEAR   , 'Linear',             'Linear Fog'),
             (eFOGMODE_EXP      , 'Exponential',        'Exponential Fog'),
             (eFOGMODE_EXP2     , 'Exponential Squared','Exponential Squared Fog')
            ),
    default = eFOGMODE_LINEAR
)

bpy.types.World.fogDensity = bpy.props.FloatProperty(
    name='Fog Density',
    description='',
    default = 0.3
)

#===============================================================================
class WorldPanel(bpy.types.Panel):
    bl_label = get_title()
    bl_space_type = 'PROPERTIES'
    bl_region_type = 'WINDOW'
    bl_context = 'world'

    @classmethod
    def poll(cls, context):
        ob = context.world
        #print(ob.data)
        return ob is not None and isinstance(ob, bpy.types.World)

    def draw(self, context):
        ob = context.world
        fogEnabled = ob.mist_settings.use_mist
        layout = self.layout
        row = layout.row()
        row.enabled = fogEnabled
        row.prop(ob, 'fogMode')
        
        row = layout.row()
        row.enabled = fogEnabled
        row.prop(ob, 'fogDensity')
        
