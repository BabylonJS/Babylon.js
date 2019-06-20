cmake_minimum_required(VERSION 3.12)
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

project(BabylonNative)

set(SUPPORTED_PLATFORMS "Win32")
set(BABYLON_NATIVE_PLATFORM "Win32" CACHE STRING "Target platform for Babylon Native.")
if(NOT(BABYLON_NATIVE_PLATFORM IN_LIST SUPPORTED_PLATFORMS))
    message(FATAL_ERROR "Unrecognized platform: ${BABYLON_NATIVE_PLATFORM}")
endif()

set(CMAKE_CXX_STANDARD 17)

if(${CMAKE_CXX_COMPILER} MATCHES "x86/cl.exe$")
    set(ARCH "x86")
elseif(${CMAKE_CXX_COMPILER} MATCHES "x64/cl.exe$")
    set(ARCH "x64")
else()
    message(FATAL_ERROR "Unrecognized compiler: ${CMAKE_CXX_COMPILER}")
endif()

add_subdirectory(Library)
add_subdirectory(TestApp)
