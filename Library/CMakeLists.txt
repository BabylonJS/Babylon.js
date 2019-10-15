add_subdirectory(Dependencies/arcana.cpp EXCLUDE_FROM_ALL)
set_property(TARGET arcana PROPERTY FOLDER Dependencies/arcana)

set(NAPI_JAVASCRIPT_ENGINE "Chakra" CACHE STRING "JavaScript engine for N-API.")
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
add_subdirectory(Dependencies/napi EXCLUDE_FROM_ALL)
set_property(TARGET napi PROPERTY FOLDER Dependencies/napi)
set(BABYLON_NATIVE_DEPENDENCIES ${NAPI_DEPENDENCIES} PARENT_SCOPE)

add_subdirectory(Dependencies/glslang EXCLUDE_FROM_ALL)
set_property(TARGET glslang PROPERTY FOLDER Dependencies/glslang)
set_property(TARGET OGLCompiler PROPERTY FOLDER Dependencies/glslang)
set_property(TARGET OSDependent PROPERTY FOLDER Dependencies/glslang)
set_property(TARGET SPIRV PROPERTY FOLDER Dependencies/glslang)
set_property(TARGET SPVRemapper PROPERTY FOLDER Dependencies/glslang)
set_property(TARGET HLSL PROPERTY FOLDER Dependencies/glslang)

add_subdirectory(Dependencies/SPIRV-Cross EXCLUDE_FROM_ALL)
set_property(TARGET spirv-cross-core PROPERTY FOLDER Dependencies/SPIRV-Cross)
set_property(TARGET spirv-cross-glsl PROPERTY FOLDER Dependencies/SPIRV-Cross)
set_property(TARGET spirv-cross-hlsl PROPERTY FOLDER Dependencies/SPIRV-Cross)

add_compile_definitions(BGFX_CONFIG_DEBUG_UNIFORM=0)
add_compile_definitions(BGFX_CONFIG_MULTITHREADED=0)
add_compile_definitions(BGFX_CONFIG_MAX_VERTEX_STREAMS=32)
add_compile_definitions(BGFX_CONFIG_MAX_COMMAND_BUFFER_SIZE=12582912)
if(APPLE)
    # no Vulkan on Apple but Metal
    add_compile_definitions(BGFX_CONFIG_RENDERER_VULKAN=0)
    add_compile_definitions(BGFX_CONFIG_RENDERER_METAL=1)
endif()
set(BGFX_BUILD_EXAMPLES OFF CACHE BOOL "Build the BGFX examples.")
set(BGFX_BUILD_TOOLS OFF CACHE BOOL "Build the BGFX tools.")
add_subdirectory(Dependencies/bgfx.cmake EXCLUDE_FROM_ALL)
set_property(TARGET astc PROPERTY FOLDER Dependencies/bgfx/3rdparty)
set_property(TARGET astc-codec PROPERTY FOLDER Dependencies/bgfx/3rdparty)
set_property(TARGET edtaa3 PROPERTY FOLDER Dependencies/bgfx/3rdparty)
set_property(TARGET etc1 PROPERTY FOLDER Dependencies/bgfx/3rdparty)
set_property(TARGET etc2 PROPERTY FOLDER Dependencies/bgfx/3rdparty)
set_property(TARGET iqa PROPERTY FOLDER Dependencies/bgfx/3rdparty)
set_property(TARGET nvtt PROPERTY FOLDER Dependencies/bgfx/3rdparty)
set_property(TARGET pvrtc PROPERTY FOLDER Dependencies/bgfx/3rdparty)
set_property(TARGET squish PROPERTY FOLDER Dependencies/bgfx/3rdparty)
set_property(TARGET bgfx PROPERTY FOLDER Dependencies/bgfx)
set_property(TARGET bimg PROPERTY FOLDER Dependencies/bgfx)
set_property(TARGET bx PROPERTY FOLDER Dependencies/bgfx)

if(APPLE OR ANDROID)
    set(CURL_CA_BUNDLE "none" CACHE FILEPATH "Path to SSL CA Certificate Bundle")
    set(CURL_CA_PATH "none" CACHE PATH "Path to SSL CA Certificate Directory")
endif()    

if(APPLE)
    set(CMAKE_USE_SECTRANSP ON CACHE BOOL "enable Apple OS native SSL/TLS")
elseif(BABYLON_NATIVE_PLATFORM STREQUAL "Win32" OR BABYLON_NATIVE_PLATFORM STREQUAL "UWP")
    set(CMAKE_USE_WINSSL ON CACHE BOOL "Set cURL to use WinSSL by default.")
else()
    set(CMAKE_USE_WINSSL OFF CACHE BOOL "Set cURL to use WinSSL by default.")
endif()

add_subdirectory(Dependencies/curl EXCLUDE_FROM_ALL)
set_property(TARGET libcurl PROPERTY FOLDER Dependencies/curl)

# TODO: Certain parts of cURL's functionality are gated behind WINAPI checks
# that cause the functionality to become unavailable in UWP. Find a better way 
# to ensure that functionality is enabled, then remove the following workaround.
if(WINDOWS_STORE)
    target_compile_definitions(libcurl PRIVATE "WINAPI_PARTITION_DESKTOP=1")
endif()

# Currently OpenXR is only supported on Win32. More platforms will be added as 
# they become viable/available.
if(BABYLON_NATIVE_PLATFORM STREQUAL "Win32" OR BABYLON_NATIVE_PLATFORM STREQUAL "UWP")
    add_subdirectory(Dependencies/xr)
    set_property(TARGET xr PROPERTY FOLDER Dependencies/xr)
    set_property(TARGET openxr_loader PROPERTY FOLDER Dependencies/xr/OpenXR)
    set_property(TARGET generate_openxr_header PROPERTY FOLDER Dependencies/xr/OpenXR/Generated)
    set_property(TARGET xr_global_generated_files PROPERTY FOLDER Dependencies/xr/OpenXR/Generated)
endif()

set(SOURCES
    "Include/Babylon/Runtime.h"
    "Include/Babylon/Runtime${BABYLON_NATIVE_PLATFORM}.h"
    "Source/Common.h"
    "Source/Common${BABYLON_NATIVE_PLATFORM}.cpp"
    "Source/Console.cpp"
    "Source/Console.h"
    "Source/NapiBridge.h"
    "Source/NativeEngine.cpp"
    "Source/NativeEngine.h"
    "Source/NativeEngineImpl.h"
    "Source/ResourceLimits.cpp"
    "Source/ResourceLimits.h"
    "Source/Runtime.cpp"
    "Source/RuntimeImpl.cpp"
    "Source/RuntimeImpl.h"
    "Source/Runtime${BABYLON_NATIVE_PLATFORM}.cpp"
    "Source/ShaderCompiler.h"
    "Source/Window.cpp"
    "Source/Window.h"
    "Source/XMLHttpRequest.cpp"
    "Source/XMLHttpRequest.h"
    "Source/XMLHttpRequest${BABYLON_NATIVE_PLATFORM}.cpp")

# Platform-specific shader compiler
if(BABYLON_NATIVE_PLATFORM STREQUAL "Win32" OR BABYLON_NATIVE_PLATFORM STREQUAL "UWP")
    set(SOURCES ${SOURCES}
        "Source/ShaderCompilerD3D.cpp")
elseif(BABYLON_NATIVE_PLATFORM STREQUAL "Android")
    set(SOURCES ${SOURCES}
        "Source/ShaderCompilerOpenGL.cpp")
elseif(APPLE)
    set(SOURCES ${SOURCES}
        "Source/ShaderCompilerMetal.cpp")
endif()

# Platform-specific XR plugin (only included when used)
if(BABYLON_NATIVE_PLATFORM STREQUAL "Win32" OR BABYLON_NATIVE_PLATFORM STREQUAL "UWP")
    set(SOURCES ${SOURCES}
        "Source/XrPlugin.cpp"
        "Source/XrPlugin.h")
endif()

add_library(Library ${SOURCES})

set_target_properties(Library PROPERTIES
         ARCHIVE_OUTPUT_DIRECTORY "${PROJECT_BINARY_DIR}/${BABYLON_NATIVE_PLATFORM}_${ARCH}")

source_group(TREE "${CMAKE_CURRENT_SOURCE_DIR}" FILES ${SOURCES})

target_compile_definitions(Library PRIVATE V8_DEPRECATION_WARNINGS=1)
target_compile_definitions(Library PRIVATE NODE_USE_V8_PLATFORM=1)
target_compile_definitions(Library PRIVATE HAVE_INSPECTOR=0)
target_compile_definitions(Library PRIVATE V8_INSPECTOR_USE_STL=1)
target_compile_definitions(Library PRIVATE V8_INSPECTOR_USE_OLD_STL=1)
target_compile_definitions(Library PRIVATE NOMINMAX)
target_compile_definitions(Library PRIVATE _SILENCE_CXX17_CODECVT_HEADER_DEPRECATION_WARNING)

target_include_directories(Library PRIVATE "Dependencies/arcana.cpp/Source/Shared")
target_include_directories(Library PRIVATE "Dependencies/arcana.cpp/Source/Submodules/GSL/include")
target_include_directories(Library PRIVATE "Dependencies/base-n/include")
target_include_directories(Library PRIVATE "Dependencies/bgfx.cmake/bgfx/include")
target_include_directories(Library PRIVATE "Dependencies/bgfx.cmake/bimg/include")
target_include_directories(Library PRIVATE "Dependencies/bgfx.cmake/bx/include")
if(MSVC)
    target_include_directories( bx PRIVATE "Dependencies/bgfx.cmake/bx/include/compat/msvc")
elseif(MINGW)
    target_include_directories( bx PRIVATE "Dependencies/bgfx.cmake/bx/include/compat/msvc/mingw")
elseif(APPLE)
    target_include_directories( bx PRIVATE "Dependencies/bgfx.cmake/bx/include/compat/msvc/osx")
endif()
target_include_directories(Library PRIVATE "Dependencies/curl/include")
target_include_directories(Library PRIVATE "Dependencies/glslang")
target_include_directories(Library PRIVATE "Dependencies/SPIRV-Cross")

if(WINDOWS_STORE)
    target_include_directories(Library PRIVATE "Dependencies/arcana.cpp/Source/UWP")
endif()

target_link_libraries(Library
    PRIVATE bx
    PRIVATE bimg
    PRIVATE bgfx
    PRIVATE libcurl
    PRIVATE glslang
    PRIVATE SPIRV
    PRIVATE spirv-cross-hlsl)

if(BABYLON_NATIVE_PLATFORM STREQUAL "Win32" OR BABYLON_NATIVE_PLATFORM STREQUAL "UWP")
    target_link_libraries(Library PRIVATE xr)
endif()

if(WINDOWS_STORE)
    target_link_libraries(Library PRIVATE arcana)
endif()

if(APPLE)
    target_link_libraries(Library
        PRIVATE spirv-cross-msl)
endif()

if(BABYLON_NATIVE_PLATFORM STREQUAL "Win32" OR BABYLON_NATIVE_PLATFORM STREQUAL "UWP")
    target_link_libraries(Library
        PRIVATE "crypt32.lib"
        PRIVATE "d2d1.lib"
        PRIVATE "d3d11.lib"
        PRIVATE "d3d9.lib"
        PRIVATE "d3dcompiler.lib"
        PRIVATE "dxgi.lib"
        PRIVATE "dxguid.lib"
        PRIVATE "normaliz.lib"
        PRIVATE "psapi.lib"
        PRIVATE "shlwapi.lib"
        PRIVATE "ws2_32.lib"
        PRIVATE "wldap32.lib")
endif()

if(WINDOWS_STORE)
    target_link_libraries(Library PRIVATE "kernel32.lib")
endif()

target_include_directories(Library PUBLIC "Include")
target_link_libraries(Library PUBLIC napi)

