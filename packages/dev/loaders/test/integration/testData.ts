export const objBase64 =
    "ZyB0ZXRyYWhlZHJvbgoKdiAxLjAwIDEuMDAgMS4wMCAwLjY2NiAwIDAKdiAyLjAwIDEuMDAgMS4wMCAwLjY2NiAwIDAKdiAxLjAwIDIuMDAgMS4wMCAwLjY2NiAwIDAKdiAxLjAwIDEuMDAgMi4wMCAwLjY2NiAwIDAKCmYgMSAzIDIKZiAxIDQgMwpmIDEgMiA0CmYgMiAzIDQ=";

export const objRaw = `
# data:;base64,iVBORw
g tetrahedron

v 1.00 1.00 1.00 0.666 0 0
v 2.00 1.00 1.00 0.666 0 0
v 1.00 2.00 1.00 0.666 0 0
v 1.00 1.00 2.00 0.666 0 0

f 1 3 2
f 1 4 3
f 1 2 4
f 2 3 4
`;

export const gltfRaw = `
{
    "scenes" : [
      {
        "nodes" : [ 0 ]
      }
    ],

    "nodes" : [
      {
        "mesh" : 0
      }
    ],

    "meshes" : [
      {
        "primitives" : [ {
          "attributes" : {
            "POSITION" : 1
          },
          "indices" : 0
        } ]
      }
    ],

    "buffers" : [
      {
        "uri" : "data:application/octet-stream;base64,AAABAAIAAAAAAAAAAAAAAAAAAAAAAIA/AAAAAAAAAAAAAAAAAACAPwAAAAA=",
        "byteLength" : 44
      }
    ],
    "bufferViews" : [
      {
        "buffer" : 0,
        "byteOffset" : 0,
        "byteLength" : 6,
        "target" : 34963
      },
      {
        "buffer" : 0,
        "byteOffset" : 8,
        "byteLength" : 36,
        "target" : 34962
      }
    ],
    "accessors" : [
      {
        "bufferView" : 0,
        "byteOffset" : 0,
        "componentType" : 5123,
        "count" : 3,
        "type" : "SCALAR",
        "max" : [ 2 ],
        "min" : [ 0 ]
      },
      {
        "bufferView" : 1,
        "byteOffset" : 0,
        "componentType" : 5126,
        "count" : 3,
        "type" : "VEC3",
        "max" : [ 1.0, 1.0, 0.0 ],
        "min" : [ 0.0, 0.0, 0.0 ]
      }
    ],

    "asset" : {
      "version" : "2.0"
    }
}`;

export const gltfBase64 =
    "ewogICAgInNjZW5lcyIgOiBbCiAgICAgIHsKICAgICAgICAibm9kZXMiIDogWyAwIF0KICAgICAgfQogICAgXSwKCiAgICAibm9kZXMiIDogWwogICAgICB7CiAgICAgICAgIm1lc2giIDogMAogICAgICB9CiAgICBdLAoKICAgICJtZXNoZXMiIDogWwogICAgICB7CiAgICAgICAgInByaW1pdGl2ZXMiIDogWyB7CiAgICAgICAgICAiYXR0cmlidXRlcyIgOiB7CiAgICAgICAgICAgICJQT1NJVElPTiIgOiAxCiAgICAgICAgICB9LAogICAgICAgICAgImluZGljZXMiIDogMAogICAgICAgIH0gXQogICAgICB9CiAgICBdLAoKICAgICJidWZmZXJzIiA6IFsKICAgICAgewogICAgICAgICJ1cmkiIDogImRhdGE6YXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtO2Jhc2U2NCxBQUFCQUFJQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUlBL0FBQUFBQUFBQUFBQUFBQUFBQUNBUHdBQUFBQT0iLAogICAgICAgICJieXRlTGVuZ3RoIiA6IDQ0CiAgICAgIH0KICAgIF0sCiAgICAiYnVmZmVyVmlld3MiIDogWwogICAgICB7CiAgICAgICAgImJ1ZmZlciIgOiAwLAogICAgICAgICJieXRlT2Zmc2V0IiA6IDAsCiAgICAgICAgImJ5dGVMZW5ndGgiIDogNiwKICAgICAgICAidGFyZ2V0IiA6IDM0OTYzCiAgICAgIH0sCiAgICAgIHsKICAgICAgICAiYnVmZmVyIiA6IDAsCiAgICAgICAgImJ5dGVPZmZzZXQiIDogOCwKICAgICAgICAiYnl0ZUxlbmd0aCIgOiAzNiwKICAgICAgICAidGFyZ2V0IiA6IDM0OTYyCiAgICAgIH0KICAgIF0sCiAgICAiYWNjZXNzb3JzIiA6IFsKICAgICAgewogICAgICAgICJidWZmZXJWaWV3IiA6IDAsCiAgICAgICAgImJ5dGVPZmZzZXQiIDogMCwKICAgICAgICAiY29tcG9uZW50VHlwZSIgOiA1MTIzLAogICAgICAgICJjb3VudCIgOiAzLAogICAgICAgICJ0eXBlIiA6ICJTQ0FMQVIiLAogICAgICAgICJtYXgiIDogWyAyIF0sCiAgICAgICAgIm1pbiIgOiBbIDAgXQogICAgICB9LAogICAgICB7CiAgICAgICAgImJ1ZmZlclZpZXciIDogMSwKICAgICAgICAiYnl0ZU9mZnNldCIgOiAwLAogICAgICAgICJjb21wb25lbnRUeXBlIiA6IDUxMjYsCiAgICAgICAgImNvdW50IiA6IDMsCiAgICAgICAgInR5cGUiIDogIlZFQzMiLAogICAgICAgICJtYXgiIDogWyAxLjAsIDEuMCwgMC4wIF0sCiAgICAgICAgIm1pbiIgOiBbIDAuMCwgMC4wLCAwLjAgXQogICAgICB9CiAgICBdLAoKICAgICJhc3NldCIgOiB7CiAgICAgICJ2ZXJzaW9uIiA6ICIyLjAiCiAgICB9Cn0=";

export const glbBase64 =
    "Z2xURgIAAACABgAA3AMAAEpTT057ImFzc2V0Ijp7ImdlbmVyYXRvciI6IkNPTExBREEyR0xURiIsInZlcnNpb24iOiIyLjAifSwic2NlbmUiOjAsInNjZW5lcyI6W3sibm9kZXMiOlswXX1dLCJub2RlcyI6W3siY2hpbGRyZW4iOlsxXSwibWF0cml4IjpbMS4wLDAuMCwwLjAsMC4wLDAuMCwwLjAsLTEuMCwwLjAsMC4wLDEuMCwwLjAsMC4wLDAuMCwwLjAsMC4wLDEuMF19LHsibWVzaCI6MH1dLCJtZXNoZXMiOlt7InByaW1pdGl2ZXMiOlt7ImF0dHJpYnV0ZXMiOnsiTk9STUFMIjoxLCJQT1NJVElPTiI6Mn0sImluZGljZXMiOjAsIm1vZGUiOjQsIm1hdGVyaWFsIjowfV0sIm5hbWUiOiJNZXNoIn1dLCJhY2Nlc3NvcnMiOlt7ImJ1ZmZlclZpZXciOjAsImJ5dGVPZmZzZXQiOjAsImNvbXBvbmVudFR5cGUiOjUxMjMsImNvdW50IjozNiwibWF4IjpbMjNdLCJtaW4iOlswXSwidHlwZSI6IlNDQUxBUiJ9LHsiYnVmZmVyVmlldyI6MSwiYnl0ZU9mZnNldCI6MCwiY29tcG9uZW50VHlwZSI6NTEyNiwiY291bnQiOjI0LCJtYXgiOlsxLjAsMS4wLDEuMF0sIm1pbiI6Wy0xLjAsLTEuMCwtMS4wXSwidHlwZSI6IlZFQzMifSx7ImJ1ZmZlclZpZXciOjEsImJ5dGVPZmZzZXQiOjI4OCwiY29tcG9uZW50VHlwZSI6NTEyNiwiY291bnQiOjI0LCJtYXgiOlswLjUsMC41LDAuNV0sIm1pbiI6Wy0wLjUsLTAuNSwtMC41XSwidHlwZSI6IlZFQzMifV0sIm1hdGVyaWFscyI6W3sicGJyTWV0YWxsaWNSb3VnaG5lc3MiOnsiYmFzZUNvbG9yRmFjdG9yIjpbMC44MDAwMDAwMTE5MjA5MjksMC4wLDAuMCwxLjBdLCJtZXRhbGxpY0ZhY3RvciI6MC4wfSwibmFtZSI6IlJlZCJ9XSwiYnVmZmVyVmlld3MiOlt7ImJ1ZmZlciI6MCwiYnl0ZU9mZnNldCI6NTc2LCJieXRlTGVuZ3RoIjo3MiwidGFyZ2V0IjozNDk2M30seyJidWZmZXIiOjAsImJ5dGVPZmZzZXQiOjAsImJ5dGVMZW5ndGgiOjU3NiwiYnl0ZVN0cmlkZSI6MTIsInRhcmdldCI6MzQ5NjJ9XSwiYnVmZmVycyI6W3siYnl0ZUxlbmd0aCI6NjQ4fV19iAIAAEJJTgAAAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAAAAAAAAgD8AAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAAAAAACAvwAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAIA/AAAAAAAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAAAAAACAPwAAAAAAAIC/AAAAAAAAAAAAAIC/AAAAAAAAAAAAAIC/AAAAAAAAAAAAAIC/AAAAAAAAAAAAAAAAAAAAAAAAgL8AAAAAAAAAAAAAgL8AAAAAAAAAAAAAgL8AAAAAAAAAAAAAgL8AAAC/AAAAvwAAAD8AAAA/AAAAvwAAAD8AAAC/AAAAPwAAAD8AAAA/AAAAPwAAAD8AAAA/AAAAvwAAAD8AAAC/AAAAvwAAAD8AAAA/AAAAvwAAAL8AAAC/AAAAvwAAAL8AAAA/AAAAPwAAAD8AAAA/AAAAvwAAAD8AAAA/AAAAPwAAAL8AAAA/AAAAvwAAAL8AAAC/AAAAPwAAAD8AAAA/AAAAPwAAAD8AAAC/AAAAPwAAAL8AAAA/AAAAPwAAAL8AAAC/AAAAvwAAAD8AAAC/AAAAPwAAAD8AAAC/AAAAvwAAAL8AAAC/AAAAPwAAAL8AAAC/AAAAvwAAAL8AAAC/AAAAPwAAAL8AAAA/AAAAvwAAAL8AAAA/AAAAPwAAAL8AAAEAAgADAAIAAQAEAAUABgAHAAYABQAIAAkACgALAAoACQAMAA0ADgAPAA4ADQAQABEAEgATABIAEQAUABUAFgAXABYAFQA=";

export const stlAsciiRaw = `
solid triangle
    facet normal 0 1 0
        outer loop
            vertex 1 0 0
            vertex 0 0 0
            vertex 0 1 0
        endloop
    endfacet
endsolid triangle
`;

export const stlAsciiBase64 =
    "c29saWQgdHJpYW5nbGUKICAgIGZhY2V0IG5vcm1hbCAwIDEgMAogICAgICAgIG91dGVyIGxvb3AKICAgICAgICAgICAgdmVydGV4IDEgMCAwCiAgICAgICAgICAgIHZlcnRleCAwIDAgMAogICAgICAgICAgICB2ZXJ0ZXggMCAxIDAKICAgICAgICBlbmRsb29wCiAgICBlbmRmYWNldAplbmRzb2xpZCB0cmlhbmdsZQ==";

export const stlBinaryBase64 =
    "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAgD8AAAAAAACAPwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgD8AAAAAAAA=";

export const bvhBasicRaw = `HIERARCHY
JOINT Hips
{
    OFFSET 0.00 0.00 0.00
    CHANNELS 6 Xposition Yposition Zposition Zrotation Yrotation Xrotation
    JOINT Chest
    {
        OFFSET 0.00 5.21 0.00
        CHANNELS 3 Zrotation Yrotation Xrotation
        End Site
        {
            OFFSET 0.00 6.28 0.00
        }
    }
}
MOTION
Frames: 2
Frame Time: 0.033333
0.00 0.00 0.00 0.00 0.00 0.00 0.00 0.00 0.00
0.00 1.00 0.00 0.00 45.00 0.00 0.00 30.00 0.00`;

export const bvhSimpleRaw = `HIERARCHY
JOINT Root
{
    OFFSET 0.00 0.00 0.00
    CHANNELS 6 Xposition Yposition Zposition Zrotation Yrotation Xrotation
    End Site
    {
        OFFSET 0.00 1.00 0.00
    }
}
MOTION
Frames: 2
Frame Time: 0.033333
0.00 0.00 0.00 0.00 0.00 0.00
1.00 2.00 3.00 30.00 45.00 60.00`;

export const bvhThreeBonesRaw = `HIERARCHY
ROOT Root
{
    OFFSET 0.00 0.00 0.00
    CHANNELS 6 Xposition Yposition Zposition Zrotation Yrotation Xrotation
    JOINT Middle
    {
        OFFSET 0.00 1.00 0.00
        CHANNELS 3 Zrotation Yrotation Xrotation
        JOINT End
        {
            OFFSET 0.00 1.00 0.00
            End Site
            {
                OFFSET 0.00 0.50 0.00
            }
        }
    }
}
MOTION
Frames: 1
Frame Time: 0.033333
0.00 0.00 0.00 45.00 0.00 0.00 30.00 0.00 0.00`;
