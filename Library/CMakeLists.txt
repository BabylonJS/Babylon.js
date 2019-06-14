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

add_compile_definitions(BGFX_CONFIG_MULTITHREADED=0)
add_compile_definitions(BGFX_CONFIG_MAX_COMMAND_BUFFER_SIZE=12582912)
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

set(CMAKE_USE_WINSSL ON CACHE BOOL "Set cURL to use WinSSL by default.")
add_subdirectory(Dependencies/curl EXCLUDE_FROM_ALL)
set_property(TARGET libcurl PROPERTY FOLDER Dependencies/curl)

# Engine
set(SOURCES
    ${SOURCES}
    "Source/Engine/NapiBridge.h"
    "Source/Engine/BgfxEngine.h"
    "Source/Engine/BgfxEngine.cpp"
    "Source/Engine/ResourceLimits.cpp"
    "Source/Engine/ResourceLimits.h"
    "Source/Engine/ShaderCompiler.h"
    "Source/Engine/ShaderCompilerD3D.cpp")

# NAPI
set(SOURCES
    ${SOURCES}
    "Source/Napi/js_native_api.h"
    "Source/Napi/js_native_api_types.h"
    "Source/Napi/napi.h"
    "Source/Napi/napi-inl.h"
    "Source/Napi/env_${BABYLON_NATIVE_JAVASCRIPT_ENGINE}.cc"
    "Source/Napi/env_${BABYLON_NATIVE_JAVASCRIPT_ENGINE}.h"
    "Source/Napi/js_native_api_${BABYLON_NATIVE_JAVASCRIPT_ENGINE}.cc"
    "Source/Napi/js_native_api_${BABYLON_NATIVE_JAVASCRIPT_ENGINE}.h")
if(BABYLON_NATIVE_JAVASCRIPT_ENGINE STREQUAL "V8")
    set(SOURCES
        ${SOURCES}
        "Source/Napi/js_native_api_v8_internals.h")
endif()

# Runtime
set(SOURCES
    ${SOURCES}
    "Source/Runtime/Common.h"
    "Source/Runtime/Common${BABYLON_NATIVE_PLATFORM}.cpp"
    "Source/Runtime/Common${BABYLON_NATIVE_PLATFORM}.h"
    "Source/Runtime/Runtime.cpp"
    "Source/Runtime/Runtime.h"
    "Source/Runtime/RuntimeImpl.cpp"
    "Source/Runtime/RuntimeImpl.h"
    "Source/Runtime/Runtime${BABYLON_NATIVE_PLATFORM}.cpp"
    "Source/Runtime/Runtime${BABYLON_NATIVE_PLATFORM}.h")

# ScriptHost
set(SOURCES
    ${SOURCES}
    "Source/ScriptHost/Console.cpp"
    "Source/ScriptHost/Console.h"
    "Source/ScriptHost/ScriptHost.h"
    "Source/ScriptHost/ScriptHost${BABYLON_NATIVE_JAVASCRIPT_ENGINE}.cpp"
    "Source/ScriptHost/Window.cpp"
    "Source/ScriptHost/Window.h"
    "Source/ScriptHost/XMLHttpRequest.cpp"
    "Source/ScriptHost/XMLHttpRequest.h"
    "Source/ScriptHost/XMLHttpRequest${BABYLON_NATIVE_PLATFORM}.cpp")

add_library(Library ${SOURCES})

target_compile_definitions(Library PUBLIC NODE_ADDON_API_DISABLE_DEPRECATED)

target_compile_definitions(Library PRIVATE NOMINMAX)
target_compile_definitions(Library PRIVATE _SILENCE_CXX17_CODECVT_HEADER_DEPRECATION_WARNING)

if(BABYLON_NATIVE_JAVASCRIPT_ENGINE STREQUAL "Chakra")
    target_compile_definitions(Library PRIVATE USE_EDGEMODE_JSRT)
elseif(BABYLON_NATIVE_JAVASCRIPT_ENGINE STREQUAL "V8")
    set(NUGET_PATH "${CMAKE_BINARY_DIR}/NuGet")
    set(NUGET_EXE "${NUGET_PATH}/nuget.exe")
    if(NOT EXISTS ${NUGET_EXE})
        file(DOWNLOAD "https://dist.nuget.org/win-x86-commandline/latest/nuget.exe" ${NUGET_EXE})
    endif()
    file(COPY "packages.config" DESTINATION ${NUGET_PATH})
    execute_process(COMMAND ${NUGET_EXE} install WORKING_DIRECTORY ${NUGET_PATH})
    add_library(v8_libbase SHARED IMPORTED)
    set_target_properties(v8_libbase PROPERTIES IMPORTED_IMPLIB "${NUGET_PATH}/v8-v141-${ARCH}.7.4.288.26/lib/Release/v8_libbase.dll.lib")
    add_library(v8_libplatform SHARED IMPORTED)
    set_target_properties(v8_libplatform PROPERTIES IMPORTED_IMPLIB "${NUGET_PATH}/v8-v141-${ARCH}.7.4.288.26/lib/Release/v8_libplatform.dll.lib")
    add_library(v8 SHARED IMPORTED)
    set_target_properties(v8 PROPERTIES IMPORTED_IMPLIB "${NUGET_PATH}/v8-v141-${ARCH}.7.4.288.26/lib/Release/v8.dll.lib")
    target_link_libraries(v8 INTERFACE v8_libbase INTERFACE v8_libplatform)
    target_include_directories(v8 INTERFACE "${NUGET_PATH}/v8-v141-${ARCH}.7.4.288.26/include")

    set(BABYLON_NATIVE_DEPENDENCIES ${BABYLON_NATIVE_DEPENDENCIES}
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/icudtl.dat"
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/icui18n.dll"
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/icuuc.dll"
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/natives_blob.bin"
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/snapshot_blob.bin"
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/v8.dll"
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/v8_libbase.dll"
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/v8_libplatform.dll"
        PARENT_SCOPE)
endif()

target_include_directories(Library PUBLIC "Source")

target_include_directories(Library PRIVATE "Dependencies/arcana.cpp/Source/Shared")
target_include_directories(Library PRIVATE "Dependencies/arcana.cpp/Source/Submodules/GSL/include")
target_include_directories(Library PRIVATE "Dependencies/base-n/include")
target_include_directories(Library PRIVATE "Dependencies/bgfx.cmake/bgfx/include")
target_include_directories(Library PRIVATE "Dependencies/bgfx.cmake/bimg/include")
target_include_directories(Library PRIVATE "Dependencies/bgfx.cmake/bx/include")
target_include_directories(Library PRIVATE "Dependencies/bgfx.cmake/bx/include/compat/msvc")
target_include_directories(Library PRIVATE "Dependencies/curl/include")
target_include_directories(Library PRIVATE "Dependencies/glslang")
target_include_directories(Library PRIVATE "Dependencies/SPIRV-Cross")

target_link_libraries(Library
    PRIVATE bx
    PRIVATE bimg
    PRIVATE bgfx
    PRIVATE libcurl
    PRIVATE glslang
    PRIVATE SPIRV
    PRIVATE spirv-cross-hlsl)

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

if(BABYLON_NATIVE_JAVASCRIPT_ENGINE STREQUAL "Chakra")
    target_link_libraries(Library
        PRIVATE "chakrart.lib")
elseif(BABYLON_NATIVE_JAVASCRIPT_ENGINE STREQUAL "V8")
    target_link_libraries(Library
        PRIVATE v8)
endif()
