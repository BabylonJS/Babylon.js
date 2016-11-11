from .package_level import *

import bpy
LEGACY      = 'LEGACY'
INLINE      = 'INLINE'
PRIORITIZED = 'PRIORITIZED'
# Panel displayed in Scene Tab of properties, so settings can be saved in a .blend file
class ExporterSettingsPanel(bpy.types.Panel):
    bl_label = get_title()
    bl_space_type = 'PROPERTIES'
    bl_region_type = 'WINDOW'
    bl_context = 'scene'

    bpy.types.Scene.export_onlySelectedLayer = bpy.props.BoolProperty(
        name='Export only selected layers',
        description='Export only selected layers',
        default = False,
        )
    bpy.types.Scene.export_flatshadeScene = bpy.props.BoolProperty(
        name='Flat shade entire scene',
        description='Use face normals on all meshes.  Increases vertices.',
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
    bpy.types.Scene.textureMethod = bpy.props.EnumProperty(
        name='Method',
        description='How are textures to be implemented',
        items = (
                 (LEGACY     , 'Legacy'     , 'Just the single Blender texture'),
                 (INLINE     , 'Inline'     , 'Place a base64 version of texture directly in the output'),
                 (PRIORITIZED, 'Prioritized', 'Allow various compressed texture formats to be tried first')
                ),
        default = LEGACY
    )
    bpy.types.Scene.texturePriority = bpy.props.StringProperty(
        name='Order',
        description='Space delimited list of extensions to try\nnot including format supplied by Blender\nwhich will be last.',
        default = '.ASTC .DDS .ETC'
        )
    bpy.types.Scene.textureDir = bpy.props.StringProperty(
        name='Sub-directory',
        description='The path below the output directory to write texture files (any separators OS dependent)',
        default = ''
        )
    bpy.types.Scene.ignoreIKBones = bpy.props.BoolProperty(
        name='Ignore IK Bones',
        description="Do not export bones with either '.ik' or 'ik.'(not case sensitive) in the name",
        default = False,
        )

    def draw(self, context):
        layout = self.layout

        scene = context.scene
        layout.prop(scene, 'export_onlySelectedLayer')
        layout.prop(scene, 'export_flatshadeScene')
        layout.prop(scene, 'ignoreIKBones')

        box = layout.box()
        box.label(text='Texture Options:')
        box.prop(scene, 'textureMethod')
        row = box.row()
        row.enabled = scene.textureMethod == PRIORITIZED
        row.prop(scene, 'texturePriority')
        row = box.row()
        row.enabled = scene.textureMethod != INLINE
        row.prop(scene, 'textureDir')

        box = layout.box()
        box.prop(scene, 'attachedSound')
        box.prop(scene, 'autoPlaySound')
        box.prop(scene, 'loopSound')