from .package_level import *

import bpy
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
    bpy.types.Scene.force64Kmeshes = bpy.props.BoolProperty(
        name='Force 64k per Mesh Vertex Limit',
        description='When true, break up meshes with > 64k vertices for older\nhardware.  No effect when no qualifying meshes.',
        default = True,
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
        name='inline',
        description='turn textures into encoded strings, for direct inclusion into source code',
        default = False
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
        layout.prop(scene, 'force64Kmeshes')
        layout.prop(scene, 'ignoreIKBones')

        box = layout.box()
        box.label(text='Texture Location:')
        box.prop(scene, 'inlineTextures')
        row = box.row()
        row.enabled = not scene.inlineTextures
        row.prop(scene, 'textureDir')

        box = layout.box()
        box.prop(scene, 'attachedSound')
        box.prop(scene, 'autoPlaySound')
        box.prop(scene, 'loopSound')