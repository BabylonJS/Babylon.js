cmake_minimum_required(VERSION 3.12)
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

project(BabylonNative)

if (APPLE)
    # without this option on azure pipelines, there is a mismatch with math.h giving a lot of undefined functions on macOS.
    # only enabled for Apple as there is no issue for UWP/WIN32
    set(CMAKE_NO_SYSTEM_FROM_IMPORTED TRUE)
endif()

set(SUPPORTED_PLATFORMS "Win32" "UWP" "Android" "Apple")
if (ANDROID)
    set(BABYLON_NATIVE_PLATFORM "Android" CACHE STRING "Target platform for Babylon Native.")
elseif (APPLE)
    set(BABYLON_NATIVE_PLATFORM "Apple" CACHE STRING "Target platform for Babylon Native.")
else()
    set(BABYLON_NATIVE_PLATFORM "Win32" CACHE STRING "Target platform for Babylon Native.")
endif()

if(NOT(BABYLON_NATIVE_PLATFORM IN_LIST SUPPORTED_PLATFORMS))
    message(FATAL_ERROR "Unrecognized platform: ${BABYLON_NATIVE_PLATFORM}")
endif()

if(BABYLON_NATIVE_PLATFORM STREQUAL "UWP" AND NOT(WINDOWS_STORE))
    message(FATAL_ERROR "\nUWP builds must target Windows Store. Make sure to designate\n\t\"-D CMAKE_SYSTEM_NAME=WindowsStore -D CMAKE_SYSTEM_VERSION=10.0\"\nwhen configuring for UWP.")
endif()

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

if(ANDROID)
    set(ARCH ${ANDROID_ABI})
elseif(${CMAKE_CXX_COMPILER} MATCHES "x86/cl.exe$")
    set(ARCH "x86")
elseif(${CMAKE_CXX_COMPILER} MATCHES "x64/cl.exe$")
    set(ARCH "x64")
elseif(${CMAKE_CXX_COMPILER} MATCHES "arm/cl.exe$")
    set(ARCH "ARM")
elseif(APPLE)    
else()
    message(FATAL_ERROR "Unrecognized compiler: ${CMAKE_CXX_COMPILER}")
endif()

add_subdirectory(Library)
if(NOT ANDROID)
add_subdirectory(TestApp)
endif()