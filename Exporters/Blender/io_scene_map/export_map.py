# ##### BEGIN GPL LICENSE BLOCK #####
#
#  This program is free software; you can redistribute it and/or
#  modify it under the terms of the GNU General Public License
#  as published by the Free Software Foundation; either version 2
#  of the License, or (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program; if not, write to the Free Software Foundation,
#  Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
#
# ##### END GPL LICENSE BLOCK #####

# <pep8-80 compliant>

import bpy
import os

# TODO, make options
PREF_SCALE = 100
PREF_FACE_THICK = 0.1
PREF_GRID_SNAP = False
# Quake 1/2?
# Quake 3+?
PREF_DEF_TEX_OPTS = '0 0 0 1 1 0 0 0'  # not user settable yet

PREF_NULL_TEX = 'NULL'  # not user settable yet
PREF_INVIS_TEX = 'common/caulk'


def face_uv_get(face):
    """ Workaround 2.5x change.
    """
    me = face.id_data
    uv_faces = me.uv_textures.active
    if uv_faces:
        return uv_faces.data[face.index]
    else:
        return None


def face_material_get(face):
    me = face.id_data
    try:
        return me.materials[face.material_index]
    except:
        return None


def write_cube2brush(file, faces):
    """
    Takes 6 faces and writes a brush,
    these faces can be from 1 mesh, 1 cube within a mesh of larger cubes
    Faces could even come from different meshes or be contrived.
    """
    # comment only
    # file.write('// brush "%s", "%s"\n' % (ob.name, ob.data.name))
    file.write('// brush from cube\n{\n')

    if PREF_GRID_SNAP:
        format_vec = '( %d %d %d ) '
    else:
        format_vec = '( %.8f %.8f %.8f ) '

    for f in faces:
        # from 4 verts this gets them in reversed order and only 3 of them
        # 0,1,2,3 -> 2,1,0
        me = f.id_data  # XXX25
        for v in f.vertices[:][2::-1]:
            file.write(format_vec % me.vertices[v].co[:])

        material = face_material_get(f)

        if material and material.game_settings.invisible:
            file.write(PREF_INVIS_TEX)
        else:
            uf = face_uv_get(f)

            image = uf.image if uf else None

            if image:
                file.write(os.path.splitext(
                        bpy.path.basename(image.filepath))[0])
            else:
                file.write(PREF_NULL_TEX)

        # Texture stuff ignored for now
        file.write(" %s\n" % PREF_DEF_TEX_OPTS)
    file.write('}\n')


def round_vec(v):
    if PREF_GRID_SNAP:
        return v.to_tuple(0)
    else:
        return v[:]


def write_face2brush(file, face):
    """
    takes a face and writes it as a brush
    each face is a cube/brush
    """

    if PREF_GRID_SNAP:
        format_vec = '( %d %d %d ) '
    else:
        format_vec = '( %.8f %.8f %.8f ) '

    image_text = PREF_NULL_TEX

    material = face_material_get(face)

    if material and material.game_settings.invisible:
        image_text = PREF_INVIS_TEX
    else:
        uf = face_uv_get(face)

        image = uf.image if uf else None

        if image:
            image_text = os.path.splitext(bpy.path.basename(image.filepath))[0]

    # reuse face vertices
    _v = face.id_data.vertices  # XXX25
    f_vertices = [_v[vi] for vi in face.vertices]
    del _v  # XXX25

    # original verts as tuples for writing
    orig_vco = [v.co[:] for v in f_vertices]

    # new verts that give the face a thickness
    dist = PREF_SCALE * PREF_FACE_THICK
    new_vco = [round_vec(v.co - (v.normal * dist)) for v in f_vertices]
    #new_vco = [round_vec(v.co - (face.no * dist)) for v in face]

    file.write('// brush from face\n{\n')
    # front
    for co in orig_vco[2::-1]:
        file.write(format_vec % co)
    file.write(image_text)
    # Texture stuff ignored for now
    file.write(" %s\n" % PREF_DEF_TEX_OPTS)

    for co in new_vco[:3]:
        file.write(format_vec % co)
    if uf and uf.use_twoside:
        file.write(image_text)
    else:
        file.write(PREF_INVIS_TEX)

    # Texture stuff ignored for now
    file.write(" %s\n" % PREF_DEF_TEX_OPTS)

    # sides.
    if len(orig_vco) == 3:  # Tri, it seemms tri brushes are supported.
        index_pairs = ((0, 1), (1, 2), (2, 0))
    else:
        index_pairs = ((0, 1), (1, 2), (2, 3), (3, 0))

    for i1, i2 in index_pairs:
        for co in orig_vco[i1], orig_vco[i2], new_vco[i2]:
            file.write(format_vec % co)
        file.write(PREF_INVIS_TEX)
        file.write(" %s\n" % PREF_DEF_TEX_OPTS)

    file.write('}\n')


def is_cube_facegroup(faces):
    """
    Returns a bool, true if the faces make up a cube
    """
    # cube must have 6 faces
    if len(faces) != 6:
        # print('1')
        return False

    # Check for quads and that there are 6 unique verts
    verts = {}
    for f in faces:
        f_v = f.vertices[:]
        if len(f_v) != 4:
            return False

        for v in f_v:
            verts[v] = 0

    if len(verts) != 8:
        return False

    # Now check that each vert has 3 face users
    for f in faces:
        f_v = f.vertices[:]
        for v in f_v:
            verts[v] += 1

    for v in verts.values():
        if v != 3:  # vert has 3 users?
            return False

    # Could we check for 12 unique edges??, probably not needed.
    return True


def is_tricyl_facegroup(faces):
    """
    is the face group a tri cylinder
    Returns a bool, true if the faces make an extruded tri solid
    """

    # cube must have 5 faces
    if len(faces) != 5:
        #  print('1')
        return False

    # Check for quads and that there are 6 unique verts
    verts = {}
    tottri = 0
    for f in faces:
        if len(f.vertices) == 3:
            tottri += 1

        for vi in f.vertices:
            verts[vi] = 0

    if len(verts) != 6 or tottri != 2:
        return False

    # Now check that each vert has 3 face users
    for f in faces:
        for vi in f.vertices:
            verts[vi] += 1

    for v in verts.values():
        if v != 3:  # vert has 3 users?
            return False

    # Could we check for 12 unique edges??, probably not needed.
    return True


def write_node_map(file, ob):
    """
    Writes the properties of an object (empty in this case)
    as a MAP node as long as it has the property name - classname
    returns True/False based on weather a node was written
    """
    props = [(p.name, p.value) for p in ob.game.properties]

    IS_MAP_NODE = False
    for name, value in props:
        if name == "classname":
            IS_MAP_NODE = True
            break

    if not IS_MAP_NODE:
        return False

    # Write a node
    file.write('{\n')
    for name_value in props:
        file.write('"%s" "%s"\n' % name_value)
    if PREF_GRID_SNAP:
        file.write('"origin" "%d %d %d"\n' %
                   tuple([round(axis * PREF_SCALE)
                          for axis in ob.matrix_world.to_translation()]))
    else:
        file.write('"origin" "%.6f %.6f %.6f"\n' %
                   tuple([axis * PREF_SCALE
                          for axis in ob.matrix_world.to_translation()]))

    file.write('}\n')
    return True


def export_map(context, filepath):
    """
    pup_block = [\
    ('Scale:', PREF_SCALE, 1, 1000,
            'Scale the blender scene by this value.'),\
    ('Face Width:', PREF_FACE_THICK, 0.01, 10,
            'Thickness of faces exported as brushes.'),\
    ('Grid Snap', PREF_GRID_SNAP,
            'snaps floating point values to whole numbers.'),\
    'Null Texture',\
    ('', PREF_NULL_TEX, 1, 128,
            'Export textureless faces with this texture'),\
    'Unseen Texture',\
    ('', PREF_INVIS_TEX, 1, 128,
            'Export invisible faces with this texture'),\
    ]

    if not Draw.PupBlock('map export', pup_block):
        return
    """
    import time
    from mathutils import Matrix
    from bpy_extras import mesh_utils

    t = time.time()
    print("Map Exporter 0.0")
    file = open(filepath, 'w')

    scene = context.scene
    objects = context.selected_objects

    obs_mesh = []
    obs_lamp = []
    obs_surf = []
    obs_empty = []

    SCALE_MAT = Matrix()
    SCALE_MAT[0][0] = SCALE_MAT[1][1] = SCALE_MAT[2][2] = PREF_SCALE

    TOTBRUSH = TOTLAMP = TOTNODE = 0

    for ob in objects:
        type = ob.type
        if type == 'MESH':
            obs_mesh.append(ob)
        elif type == 'SURFACE':
            obs_surf.append(ob)
        elif type == 'LAMP':
            obs_lamp.append(ob)
        elif type == 'EMPTY':
            obs_empty.append(ob)

    if obs_mesh or obs_surf:
        # brushes and surf's must be under worldspan
        file.write('\n// entity 0\n')
        file.write('{\n')
        file.write('"classname" "worldspawn"\n')

    print("\twriting cubes from meshes")
    for ob in obs_mesh:
        dummy_mesh = ob.to_mesh(scene, True, 'PREVIEW')

        #print len(mesh_split2connected(dummy_mesh))

        # Is the object 1 cube? - object-is-a-brush
        # 1 to tx the normals also
        dummy_mesh.transform(ob.matrix_world * SCALE_MAT)

        if PREF_GRID_SNAP:
            for v in dummy_mesh.vertices:
                v.co[:] = v.co.to_tuple(0)

        # High quality normals
        #XXX25: BPyMesh.meshCalcNormals(dummy_mesh)

        # We need tessfaces
        dummy_mesh.update(calc_tessface=True)

        # Split mesh into connected regions
        for face_group in mesh_utils.mesh_linked_tessfaces(dummy_mesh):
            if is_cube_facegroup(face_group):
                write_cube2brush(file, face_group)
                TOTBRUSH += 1
            elif is_tricyl_facegroup(face_group):
                write_cube2brush(file, face_group)
                TOTBRUSH += 1
            else:
                for f in face_group:
                    write_face2brush(file, f)
                    TOTBRUSH += 1

            #print 'warning, not exporting "%s" it is not a cube' % ob.name
        bpy.data.meshes.remove(dummy_mesh)

    valid_dims = 3, 5, 7, 9, 11, 13, 15
    for ob in obs_surf:
        '''
        Surf, patches
        '''
        data = ob.data
        surf_name = data.name
        mat = ob.matrix_world * SCALE_MAT

        # This is what a valid patch looks like

        """
// brush 0
{
patchDef2
{
NULL
( 3 3 0 0 0 )
(
( ( -64 -64 0 0 0 ) ( -64 0 0 0 -2 ) ( -64 64 0 0 -4 ) )
( ( 0 -64 0 2 0 ) ( 0 0 0 2 -2 ) ( 0 64 0 2 -4 ) )
( ( 64 -64 0 4 0 ) ( 64 0 0 4 -2 ) ( 80 88 0 4 -4 ) )
)
}
}
        """
        for i, nurb in enumerate(data.splines):
            u = nurb.point_count_u
            v = nurb.point_count_v
            if u in valid_dims and v in valid_dims:

                file.write('// brush %d surf_name\n' % i)
                file.write('{\n')
                file.write('patchDef2\n')
                file.write('{\n')
                file.write('NULL\n')
                file.write('( %d %d 0 0 0 )\n' % (u, v))
                file.write('(\n')

                u_iter = 0
                for p in nurb.points:

                    if u_iter == 0:
                        file.write('(')

                    u_iter += 1

                    # add nmapping 0 0 ?
                    if PREF_GRID_SNAP:
                        file.write(" ( %d %d %d 0 0 )" %
                                   round_vec(mat * p.co.xyz))
                    else:
                        file.write(' ( %.6f %.6f %.6f 0 0 )' %
                                   (mat * p.co.xyz)[:])

                    # Move to next line
                    if u_iter == u:
                        file.write(' )\n')
                        u_iter = 0

                file.write(')\n')
                file.write('}\n')
                file.write('}\n')
                # Debugging
                # for p in nurb: print 'patch', p

            else:
                print("Warning: not exporting patch",
                      surf_name, u, v, 'Unsupported')

    if obs_mesh or obs_surf:
        file.write('}\n')  # end worldspan

    print("\twriting lamps")
    for ob in obs_lamp:
        print("\t\t%s" % ob.name)
        lamp = ob.data
        file.write('{\n')
        file.write('"classname" "light"\n')
        file.write('"light" "%.6f"\n' % (lamp.distance * PREF_SCALE))
        if PREF_GRID_SNAP:
            file.write('"origin" "%d %d %d"\n' %
                       tuple([round(axis * PREF_SCALE)
                              for axis in ob.matrix_world.to_translation()]))
        else:
            file.write('"origin" "%.6f %.6f %.6f"\n' %
                       tuple([axis * PREF_SCALE
                              for axis in ob.matrix_world.to_translation()]))

        file.write('"_color" "%.6f %.6f %.6f"\n' % tuple(lamp.color))
        file.write('"style" "0"\n')
        file.write('}\n')
        TOTLAMP += 1

    print("\twriting empty objects as nodes")
    for ob in obs_empty:
        if write_node_map(file, ob):
            print("\t\t%s" % ob.name)
            TOTNODE += 1
        else:
            print("\t\tignoring %s" % ob.name)

    file.close()

    print("Exported Map in %.4fsec" % (time.time() - t))
    print("Brushes: %d  Nodes: %d  Lamps %d\n" % (TOTBRUSH, TOTNODE, TOTLAMP))


def save(operator,
         context,
         filepath=None,
         global_scale=100.0,
         face_thickness=0.1,
         texture_null="NULL",
         texture_opts='0 0 0 1 1 0 0 0',
         grid_snap=False,
         ):

    global PREF_SCALE
    global PREF_FACE_THICK
    global PREF_NULL_TEX
    global PREF_DEF_TEX_OPTS
    global PREF_GRID_SNAP

    PREF_SCALE = global_scale
    PREF_FACE_THICK = face_thickness
    PREF_NULL_TEX = texture_null
    PREF_DEF_TEX_OPTS = texture_opts
    PREF_GRID_SNAP = grid_snap

    export_map(context, filepath)

    return {'FINISHED'}
