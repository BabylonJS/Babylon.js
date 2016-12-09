from sys import modules
from math import floor
from mathutils import Euler, Matrix

from bpy import app
from time import strftime
MAX_FLOAT_PRECISION_INT = 4
MAX_FLOAT_PRECISION = '%.' + str(MAX_FLOAT_PRECISION_INT) + 'f'
VERTEX_OUTPUT_PER_LINE = 50
STRIP_LEADING_ZEROS_DEFAULT = False # false for .babylon
#===============================================================================
#  module level formatting methods, called from multiple classes
#===============================================================================
def get_title():
    bl_info = get_bl_info()
    return bl_info['name'] + ' ver ' + format_exporter_version(bl_info)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def format_exporter_version(bl_info = None):
    if bl_info is None:
        bl_info = get_bl_info()
    exporterVersion = bl_info['version']
    return str(exporterVersion[0]) + '.' + str(exporterVersion[1]) +  '.' + str(exporterVersion[2])
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def blenderMajorMinorVersion():
    # in form of '2.77 (sub 0)'
    split1 = app.version_string.partition('.') 
    major = split1[0]
    
    split2 = split1[2].partition(' ')
    minor = split2[0]
    
    return float(major + '.' + minor)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def verify_min_blender_version():
    reqd = get_bl_info()['blender']
    
    # in form of '2.77 (sub 0)'
    split1 = app.version_string.partition('.') 
    major = int(split1[0])
    if reqd[0] > major: return False
    
    split2 = split1[2].partition(' ')
    minor = int(split2[0])
    if reqd[1] > minor: return False
    
    split3 = split2[2].partition(' ')
    revision = int(split3[2][:1])
    if reqd[2] > revision: return False
    
    return True
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def getNameSpace(filepathMinusExtension):
    # assign nameSpace, based on OS
    if filepathMinusExtension.find('\\') != -1:
        return legal_js_identifier(filepathMinusExtension.rpartition('\\')[2])
    else:
        return legal_js_identifier(filepathMinusExtension.rpartition('/')[2])
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def getLayer(obj):
    # empties / nodes do not have layers
    if not hasattr(obj, 'layers') : return -1;
    for idx, layer in enumerate(obj.layers):
        if layer:
            return idx
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
# a class for getting the module name, exporter version, & reqd blender version in get_bl_info()
class dummy: pass
def get_bl_info():
    # .__module__ is the 'name of package.module', so strip after dot
    packageName = dummy.__module__.partition('.')[0]
    return modules.get(packageName).bl_info
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def format_f(num, stripLeadingZero = STRIP_LEADING_ZEROS_DEFAULT):
    s = MAX_FLOAT_PRECISION % num # rounds to N decimal places while changing to string
    s = s.rstrip('0') # strip trailing zeroes
    s = s.rstrip('.') # strip trailing .
    s = '0' if s == '-0' else s # nuke -0
    
    if stripLeadingZero:
        asNum = float(s)
        if asNum != 0 and asNum > -1 and asNum < 1:
            if asNum < 0:
                s = '-' + s[2:]
            else:
                s = s[1:]
        
    return s
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def format_array3(array):
    return format_f(array[0]) + ',' + format_f(array[1]) + ',' + format_f(array[2])
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def format_array(array, indent = ''):
    ret = ''
    first = True
    nOnLine = 0
    for element in array:
        if (first != True):
            ret +=','
        first = False;

        ret += format_f(element)
        nOnLine += 1

        if nOnLine >= VERTEX_OUTPUT_PER_LINE:
            ret += '\n' + indent
            nOnLine = 0

    return ret
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def format_color(color):
    return format_f(color.r) + ',' + format_f(color.g) + ',' + format_f(color.b)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def format_vector(vector, switchYZ = True):
    return format_f(vector.x) + ',' + format_f(vector.z) + ',' + format_f(vector.y) if switchYZ else format_f(vector.x) + ',' + format_f(vector.y) + ',' + format_f(vector.z)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def format_vector_array(vectorArray, indent = ''):
    ret = ''
    first = True
    nOnLine = 0
    for vector in vectorArray:
        if (first != True):
            ret +=','
        first = False;

        ret += format_vector(vector)
        nOnLine += 3

        if nOnLine >= VERTEX_OUTPUT_PER_LINE:
            ret += '\n' + indent
            nOnLine = 0

    return ret
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def format_quaternion(quaternion):
    return format_f(quaternion.x) + ',' + format_f(quaternion.z) + ',' + format_f(quaternion.y) + ',' + format_f(-quaternion.w)
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def format_int(int):
    candidate = str(int) # when int string of an int
    if '.' in candidate:
        return format_f(floor(int)) # format_f removes un-neccessary precision
    else:
        return candidate
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def format_bool(bool):
    if bool:
        return 'true'
    else:
        return 'false'
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def post_rotate_quaternion(quat, angle):
    post = Euler((angle, 0.0, 0.0)).to_matrix()
    mqtn = quat.to_matrix()
    quat = (mqtn*post).to_quaternion()
    return quat
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def scale_vector(vector, mult, xOffset = 0):
    ret = vector.copy()
    ret.x *= mult
    ret.x += xOffset
    ret.z *= mult
    ret.y *= mult
    return ret
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def same_matrix4(matA, matB):
    if(matA is None or matB is None): return False
    if (len(matA) != len(matB)): return False
    for i in range(len(matA)):
        if (format_f(matA[i][0]) != format_f(matB[i][0]) or
            format_f(matA[i][1]) != format_f(matB[i][1]) or
            format_f(matA[i][2]) != format_f(matB[i][2]) or
            format_f(matA[i][3]) != format_f(matB[i][3]) ):
            return False
    return True
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def same_vertex(vertA, vertB):
    if vertA is None or vertB is None: return False
    
    if (format_f(vertA.x) != format_f(vertB.x) or
        format_f(vertA.y) != format_f(vertB.y) or
        format_f(vertA.z) != format_f(vertB.z) ):
        return False

    return True
# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
def same_array(arrayA, arrayB):
    if(arrayA is None or arrayB is None): return False
    if len(arrayA) != len(arrayB): return False
    for i in range(len(arrayA)):
        if format_f(arrayA[i]) != format_f(arrayB[i]) : return False

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

def write_vector(file_handler, name, vector, switchYZ = True):
    file_handler.write(',"' + name + '":[' + format_vector(vector, switchYZ) + ']')

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