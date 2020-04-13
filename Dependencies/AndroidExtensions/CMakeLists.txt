set(SOURCES
    "Include/AndroidExtensions/Globals.h"
    "Include/AndroidExtensions/JavaWrappers.h"
    "Source/Globals.cpp"
    "Source/JavaWrappers.cpp")

add_library(AndroidExtensions ${SOURCES})

target_include_directories(AndroidExtensions PUBLIC "Include")
