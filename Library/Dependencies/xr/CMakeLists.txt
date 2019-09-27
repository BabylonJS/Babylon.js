cmake_minimum_required(VERSION 3.12)

add_subdirectory(Dependencies/OpenXR-SDK)

set(SOURCES
    "Include/XR.h"
    "Source/XR.cpp"
    "Source/XrPlatformCommon.h")

if(BABYLON_NATIVE_PLATFORM STREQUAL "Win32" OR BABYLON_NATIVE_PLATFORM STREQUAL "UWP")
    set(SOURCES ${SOURCES} "Source/Windows/XrPlatform.h")
else()
    message(FATAL_ERROR "XR support not implemented for platform ${BABYLON_NATIVE_PLATFORM}")
endif()

add_library(xr ${SOURCES})

target_include_directories(xr PRIVATE "Dependencies/OpenXR-SDK/include")

target_include_directories(xr PRIVATE "Source")
if(BABYLON_NATIVE_PLATFORM STREQUAL "Win32" OR BABYLON_NATIVE_PLATFORM STREQUAL "UWP")
    target_include_directories(xr PRIVATE "Source/Windows")
endif()

target_include_directories(xr PUBLIC "Include")

target_link_libraries(xr PRIVATE openxr_loader)
