LDraw to Babylon.js exporter
============================

This exporter allow to convert any (LDraw)[http://www.ldraw.org] format to babylon.js. LDraw is used to build virtualy Lego constructions. More information on LDraw available on (LDraw website)[http://www.ldraw.org].

# Requirements
* The converter need to have the LDraw parts installed. They can be installed and downloaded from the (LDraw website)[http://www.ldraw.org].
* You need as well the ldraw official color file or any other file you can build based on this. Original file can be (downloaded from here)[http://www.ldraw.org/article/547]. For convinience, the file has been added in the project.

# Usage
Use the following settings:
f= list file names to convert separated by ;
r= give the root path for LDraw parts, default is same as the converter
p= path of files to convert, default is same as the converter
o= output directory for the babylon file
h= 1 for hi or 0 for low quality images, default is hi
c= name of color file, path default is either LDraw or app. Defautl name is ldconfig.ldr
Example:
LegoConvertDat r=c\Ldraw f=3456.dat;Mybuild.ldr;SuperSet.mpd;axle.dat o=C:\tmp

The converter support the 3 types of LDraw files:
* dat: the basic files which parts are made of
* ldr: projects including dat files as well as other ldr projects
* mpd: single file projects including other ldr and dat files

# Limitations and known issues
* So far the converter is not optimized, all triangles come with their own points even if they are already existing. This limitation create slightly larger file and can reduce a bit the speed of loading the result file.
* Lights and camera are the default ones. It is stringly recommanded to create your own lights and camera in the babylon.js engine.
* Colors supported so far are the standard ones as well as the semi transparent ones. Other colors are not supported yet.
* So far the mpd files are decompressed in the same path as the LDraw part path.