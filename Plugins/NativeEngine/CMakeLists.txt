if(WIN32 OR WINDOWS_STORE)
    set(GRAPHICS_API "D3D")
    set(XR ON)
elseif(APPLE)
    set(GRAPHICS_API "Metal")
    set(XR OFF)
elseif(ANDROID)
    set(GRAPHICS_API "OpenGL")
    set(XR OFF)
else()
    message(FATAL_ERROR "Unrecognized platform: graphics API could not be deduced")
endif()

set(SOURCES
    "Include/Babylon/NativeEngine.h"
    "Source/BgfxCallback.cpp"
    "Source/BgfxCallback.h"
    "Source/InitializeNativeEngine.cpp"
    "Source/NativeEngine.cpp"
    "Source/NativeEngine.h"
    "Source/ResourceLimits.cpp"
    "Source/ResourceLimits.h"
    "Source/ShaderCompiler.cpp"
    "Source/ShaderCompiler${GRAPHICS_API}.cpp"
    "Source/ShaderCompiler.h")

if(XR)
    set(SOURCES ${SOURCES}
        "Source/NativeXr.cpp"
        "Source/NativeXr.h")
endif()

add_library(NativeEngine ${SOURCES})

target_include_directories(NativeEngine PUBLIC "Include")

target_link_to_dependencies(NativeEngine
    PUBLIC JsRuntime
    PRIVATE arcana
    PRIVATE bgfx
    PRIVATE bimg
    PRIVATE bx
    PRIVATE glslang
    PRIVATE SPIRV
    PRIVATE spirv-cross-hlsl
    PRIVATE NativeWindow)

if(XR)
    target_link_to_dependencies(NativeEngine
        PRIVATE xr)
    target_compile_definitions(NativeEngine PRIVATE NATIVE_ENGINE_XR)
endif()

if(WIN32 OR WINDOWS_STORE)
    target_link_to_dependencies(NativeEngine
        PRIVATE "d3dcompiler.lib")
elseif(APPLE)
    target_link_to_dependencies(NativeEngine
        PRIVATE spirv-cross-msl)
elseif(ANDROID)
    # Nothing to do.
else()
    message(FATAL_ERROR "Unrecognized platform: graphics linking could not be performed")
endif()

set_property(TARGET NativeEngine PROPERTY FOLDER Plugins/Babylon)
