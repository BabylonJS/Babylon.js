#FBX Exporter
FBX Exporter produces a babylon scene file from an FBX asset
##Supported features
- cameras
- lights (including shadowcasting info)
- meshes (with or without associated skeletons, no support for instancing yet)
- bone hierarchies
- materials (with any number of textures)
- animations (transforms / opacities / hierarchical) except on materials / textures

##Prerequisites
To use this tool, you need to download the Visual C++ 2013 redistribuable package : http://www.microsoft.com/en-US/download/details.aspx?id=40784
##Usage
FbxExporter.exe "fbx file" "outdir" [/fps:60|30|24] [/skipemptynodes]
- fbx file : path to the source FBX asset
- outdir : directory where the resulting files are produced
- fps : specify the granularity of sampling used for animation exports. It only affects non-linear interpolated animations and bones animations (Babylon supports linear interpolated animation frames)
- skipemptynodes : avoid to export nodes containing only empty meshes. carefull : if you use an empty node as a camera or light locked target, do not use this argument

#FBX Reroute Skeleton
This tool can be used to merge multiple FBX files together : n files with meshes associated to a common skeleton and 1 file containing an animation on this skeleton.

##Usage
FbxRerouteSkeleton.exe /m:"mesh fbx file 1" [/m:"mesh fbx file 2" ...] /a:"animated skeleton fbx file" /o:"output fbx file" [/prefix:"bone name prefix in animated skeleton"]
- m: fbx files containing meshes linked to a common skeleton
- a: fbx file containing an animated version of the skeleton
- o: output fbx file
- prefix: prefix added to each bone name in the animated skeleton
