cmake_minimum_required(VERSION 3.12)

set(DYNAMIC_LOADER OFF CACHE BOOL "Build the loader as a .dll library")
add_subdirectory(Dependencies/OpenXR-SDK)

set(SOURCES
    "Include/XR.h"
    "Source/XR.cpp"
    "Source/XrPlatformCommon.h")

if(WIN32 OR WINDOWS_STORE)
    set(SOURCES ${SOURCES} "Source/Windows/XrPlatform.h")
else()
    message(FATAL_ERROR "XR support not implemented for platform ${BABYLON_NATIVE_PLATFORM}")
endif()

add_library(xr ${SOURCES})

target_include_directories(xr PRIVATE "Dependencies/OpenXR-SDK/include")

target_include_directories(xr PRIVATE "Source")
if(WIN32 OR WINDOWS_STORE)
    target_include_directories(xr PRIVATE "Source/Windows")
endif()

target_include_directories(xr PUBLIC "Include")

target_link_libraries(xr PRIVATE openxr_loader)
