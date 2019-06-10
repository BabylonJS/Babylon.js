cmake_minimum_required(VERSION 3.13)
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

project(BabylonNative)

set(DEPENDENCIES_DIR "Dependencies")

add_subdirectory(${DEPENDENCIES_DIR}/glslang EXCLUDE_FROM_ALL)
set_property(TARGET glslang PROPERTY FOLDER ${DEPENDENCIES_DIR}/glslang)
set_property(TARGET OGLCompiler PROPERTY FOLDER ${DEPENDENCIES_DIR}/glslang)
set_property(TARGET OSDependent PROPERTY FOLDER ${DEPENDENCIES_DIR}/glslang)
set_property(TARGET SPIRV PROPERTY FOLDER ${DEPENDENCIES_DIR}/glslang)
set_property(TARGET SPVRemapper PROPERTY FOLDER ${DEPENDENCIES_DIR}/glslang)
set_property(TARGET HLSL PROPERTY FOLDER ${DEPENDENCIES_DIR}/glslang)

add_subdirectory(${DEPENDENCIES_DIR}/SPIRV-Cross EXCLUDE_FROM_ALL)
set_property(TARGET spirv-cross-core PROPERTY FOLDER ${DEPENDENCIES_DIR}/SPIRV-Cross)
set_property(TARGET spirv-cross-glsl PROPERTY FOLDER ${DEPENDENCIES_DIR}/SPIRV-Cross)
set_property(TARGET spirv-cross-hlsl PROPERTY FOLDER ${DEPENDENCIES_DIR}/SPIRV-Cross)

add_compile_definitions(BGFX_CONFIG_MULTITHREADED=0)
add_compile_definitions(BGFX_CONFIG_MAX_COMMAND_BUFFER_SIZE=12582912)
set (BGFX_BUILD_EXAMPLES OFF CACHE BOOL "Build the BGFX examples.")
set (BGFX_BUILD_TOOLS OFF CACHE BOOL "Build the BGFX tools.")
add_subdirectory(${DEPENDENCIES_DIR}/bgfx.cmake)

# TODO: Replace this condition with a platform check that actually does something.
if(BABYLON_NATIVE_UWP OR NOT BABYLON_NATIVE_UWP)
    set(CMAKE_USE_WINSSL ON CACHE BOOL "Set cURL to use WinSSL by default.")
else()
    message(FATAL_ERROR "Non-Windows cURL options not implemented.")
endif()
add_subdirectory(${DEPENDENCIES_DIR}/curl EXCLUDE_FROM_ALL)
set_property(TARGET libcurl PROPERTY FOLDER ${DEPENDENCIES_DIR}/curl)

set(CMAKE_CXX_STANDARD 17)

# Build configuration options
option(BABYLON_NATIVE_V8 "Build using v8 for Babylon Native's JavaScript engine(rather than Chakra)." OFF)
option(BABYLON_NATIVE_UWP "Build for the Microsoft UWP platform." OFF)

# TODO: Replace this condition with a platform check that actually does something.
if(BABYLON_NATIVE_UWP OR NOT BABYLON_NATIVE_UWP)
    if(${CMAKE_CXX_COMPILER} MATCHES "x86/cl.exe$")
        set(ARCH "x86")
        set(PLAT "Win32")
    elseif(${CMAKE_CXX_COMPILER} MATCHES "x64/cl.exe$")
        set(ARCH "x64")
        set(PLAT "x64")
    else()
        message(FATAL_ERROR "Unrecognized compiler/target architecture for Windows build.")
    endif()
endif()

if(BABYLON_NATIVE_V8)
    set(JAVASCRIPT_ENGINE "V8")
else()
    set(JAVASCRIPT_ENGINE "Chakra")
endif()

if(BABYLON_NATIVE_UWP)
    set(RUNTIME_PLATFORM "UWP")
else()
    set(RUNTIME_PLATFORM "Win32")
    set(CMAKE_WIN32_EXECUTABLE TRUE)
endif()

add_compile_definitions(NODE_ADDON_API_DISABLE_DEPRECATED)
add_compile_definitions(NOMINMAX)
add_compile_definitions(_SILENCE_CXX17_CODECVT_HEADER_DEPRECATION_WARNING)

if(BABYLON_NATIVE_V8)
    set(NUGET_PATH "${CMAKE_BINARY_DIR}/NuGet")
    set(NUGET_EXE "${NUGET_PATH}/nuget.exe")
    if(NOT EXISTS ${NUGET_EXE})
        file(DOWNLOAD "https://dist.nuget.org/win-x86-commandline/latest/nuget.exe" ${NUGET_EXE})
    endif()
    file(COPY "packages.config" DESTINATION ${NUGET_PATH})
    execute_process(COMMAND ${NUGET_EXE} install WORKING_DIRECTORY ${NUGET_PATH})
    message(STATUS "${NUGET_EXE} install")

    include_directories("${NUGET_PATH}/v8-v141-${ARCH}.7.4.288.26/include")
else()
    add_compile_definitions(USE_EDGEMODE_JSRT)
endif()

include_directories("${DEPENDENCIES_DIR}/arcana.cpp/Source/Shared")
include_directories("${DEPENDENCIES_DIR}/arcana.cpp/Source/Submodules/GSL/include")
include_directories("${DEPENDENCIES_DIR}/base-n/include")
include_directories("${DEPENDENCIES_DIR}/bgfx.cmake/bgfx/include")
include_directories("${DEPENDENCIES_DIR}/bgfx.cmake/bimg/include")
include_directories("${DEPENDENCIES_DIR}/bgfx.cmake/bx/include")
include_directories("${DEPENDENCIES_DIR}/bgfx.cmake/bx/include/compat/msvc")
include_directories("${DEPENDENCIES_DIR}/curl/include")
include_directories("${DEPENDENCIES_DIR}/glslang")
include_directories("${DEPENDENCIES_DIR}/SPIRV-Cross")

if(BABYLON_NATIVE_UWP)
    include_directories("${DEPENDENCIES_DIR}/arcana.cpp/Source/UWP")
endif()

include_directories("Source")
set(SOURCES)

# BGFX Engine
set(SOURCES
    ${SOURCES}
    "Source/Engine/NapiBridge.h"
    "Source/Engine/BgfxEngine.h"
    "Source/Engine/BgfxEngine.cpp"
    "Source/Engine/ResourceLimits.cpp"
    "Source/Engine/ResourceLimits.h"
    "Source/Engine/ShaderCompiler.h"
)
# TODO: Replace this condition with a platform check that actually does something.
if(BABYLON_NATIVE_UWP OR NOT BABYLON_NATIVE_UWP)
    set(SOURCES
        ${SOURCES}
        "Source/Engine/ShaderCompilerD3D.cpp"
    )
endif()

# NAPI
set(SOURCES
    ${SOURCES}
    "Source/Napi/js_native_api.h"
    "Source/Napi/js_native_api_types.h"
    "Source/Napi/napi.h"
    "Source/Napi/napi-inl.h"
    "Source/Napi/env_${JAVASCRIPT_ENGINE}.cc"
    "Source/Napi/env_${JAVASCRIPT_ENGINE}.h"
    "Source/Napi/js_native_api_${JAVASCRIPT_ENGINE}.cc"
    "Source/Napi/js_native_api_${JAVASCRIPT_ENGINE}.h"
)
if(BABYLON_NATIVE_V8)
    set(SOURCES
        ${SOURCES}
        "Source/Napi/js_native_api_v8_internals.h"
    )
endif()

# Runtime
set(SOURCES
    ${SOURCES}
    "Source/Runtime/Common.h"
    "Source/Runtime/Common${RUNTIME_PLATFORM}.cpp"
    "Source/Runtime/Common${RUNTIME_PLATFORM}.h"
    "Source/Runtime/Runtime.cpp"
    "Source/Runtime/Runtime.h"
    "Source/Runtime/RuntimeImpl.cpp"
    "Source/Runtime/RuntimeImpl.h"
    "Source/Runtime/Runtime${RUNTIME_PLATFORM}.cpp"
    "Source/Runtime/Runtime${RUNTIME_PLATFORM}.h"
)

# ScriptHost
set(SOURCES
    ${SOURCES}
    "Source/ScriptHost/Console.cpp"
    "Source/ScriptHost/Console.h"
    "Source/ScriptHost/ScriptHost.h"
    "Source/ScriptHost/ScriptHost${JAVASCRIPT_ENGINE}.cpp"
    "Source/ScriptHost/Window.cpp"
    "Source/ScriptHost/Window.h"
    "Source/ScriptHost/XMLHttpRequest.cpp"
    "Source/ScriptHost/XMLHttpRequest.h"
    "Source/ScriptHost/XMLHttpRequest${RUNTIME_PLATFORM}.cpp"
)

add_library(BabylonNativeLib ${SOURCES})
target_link_libraries(
    BabylonNativeLib
    bx
    bimg
    bgfx
    libcurl
    glslang
    SPIRV
    spirv-cross-hlsl
)
target_link_libraries (BabylonNativeLib
    "crypt32.lib"
    "d2d1.lib"
    "d3d11.lib"
    "d3d9.lib"
    "d3dcompiler.lib"
    "dxgi.lib"
    "dxguid.lib"
    "normaliz.lib"
    "psapi.lib"
    "shlwapi.lib"
    "ws2_32.lib"
    "wldap32.lib"
)
if(BABYLON_NATIVE_V8)
    target_link_libraries (BabylonNativeLib
        debug "${NUGET_PATH}/v8-v141-${ARCH}.7.4.288.26/lib/Debug/v8.dll.lib" optimized "${NUGET_PATH}/v8-v141-${ARCH}.7.4.288.26/lib/Release/v8.dll.lib"
        debug "${NUGET_PATH}/v8-v141-${ARCH}.7.4.288.26/lib/Debug/v8_libbase.dll.lib" optimized "${NUGET_PATH}/v8-v141-${ARCH}.7.4.288.26/lib/Release/v8_libbase.dll.lib"
        debug "${NUGET_PATH}/v8-v141-${ARCH}.7.4.288.26/lib/Debug/v8_libplatform.dll.lib" optimized "${NUGET_PATH}/v8-v141-${ARCH}.7.4.288.26/lib/Release/v8_libplatform.dll.lib"
    )
else()
    target_link_libraries(BabylonNativeLib
        "chakrart.lib"
    )
endif()

# Test app
set(SOURCES)
set(SOURCES
    ${SOURCES}
    "TestApp/Source/${RUNTIME_PLATFORM}/App.cpp"
    "TestApp/Source/${RUNTIME_PLATFORM}/App.h"
    "TestApp/Source/${RUNTIME_PLATFORM}/InputManager${RUNTIME_PLATFORM}.cpp"
    "TestApp/Source/${RUNTIME_PLATFORM}/InputManager${RUNTIME_PLATFORM}.h"
)
if(NOT BABYLON_NATIVE_UWP)
    set(SOURCES
        ${SOURCES}
        "TestApp/Source/${RUNTIME_PLATFORM}/App.ico"
        "TestApp/Source/${RUNTIME_PLATFORM}/App.rc"
        "TestApp/Source/${RUNTIME_PLATFORM}/Resource.h"
        "TestApp/Source/${RUNTIME_PLATFORM}/small.ico"
        "TestApp/Source/${RUNTIME_PLATFORM}/targetver.h"
    )
endif()

set(WIN32_EXECUTABLE TRUE)
add_executable(BabylonNativeTestApp WIN32 ${SOURCES})
target_link_libraries(BabylonNativeTestApp BabylonNativeLib)

macro(copy_resources TGT SRC DST)
    add_custom_command(TARGET ${TGT} POST_BUILD COMMAND ${CMAKE_COMMAND} -E copy_directory ${SRC} $<TARGET_FILE_DIR:${TGT}>/${DST})
endmacro(copy_resources)
copy_resources(BabylonNativeTestApp "${CMAKE_SOURCE_DIR}/Source/Scripts" Scripts)
copy_resources(BabylonNativeTestApp "${CMAKE_SOURCE_DIR}/TestApp/Source/Scripts" Scripts)
if(BABYLON_NATIVE_V8)
    copy_resources(BabylonNativeTestApp "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release" ".")
endif()