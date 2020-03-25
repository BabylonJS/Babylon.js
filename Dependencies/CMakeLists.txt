set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# -------------------------------- BabylonNativeCMakeFunctions --------------------------------
add_subdirectory(BabylonNativeCMakeFunctions)

# -------------------------------- arcana --------------------------------
# Dependencies: none
add_subdirectory(arcana.cpp)
if(WINDOWS_STORE)
    set_property(TARGET arcana PROPERTY FOLDER Dependencies)
endif()

# -------------------------------- base-n --------------------------------
# Dependencies: none
add_library(base-n INTERFACE)
target_include_directories(base-n INTERFACE "base-n/include")

# -------------------------------- bgfx.cmake --------------------------------
# Dependencies: none
add_compile_definitions(BGFX_CONFIG_DEBUG_UNIFORM=0)
add_compile_definitions(BGFX_CONFIG_MULTITHREADED=0)
add_compile_definitions(BGFX_CONFIG_MAX_VERTEX_STREAMS=32)
add_compile_definitions(BGFX_CONFIG_MAX_COMMAND_BUFFER_SIZE=12582912)
if(ANDROID)
    add_compile_definitions(BGFX_CONFIG_RENDERER_OPENGLES=30)
endif()
if(APPLE)
    # no Vulkan on Apple but Metal
    add_compile_definitions(BGFX_CONFIG_RENDERER_VULKAN=0)
    add_compile_definitions(BGFX_CONFIG_RENDERER_METAL=1)
endif()
set(BGFX_BUILD_EXAMPLES OFF CACHE BOOL "Build the BGFX examples.")
set(BGFX_BUILD_TOOLS OFF CACHE BOOL "Build the BGFX tools.")
add_subdirectory(bgfx.cmake)
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

# -------------------------------- glslang --------------------------------
# Dependencies: none
set(SKIP_GLSLANG_INSTALL OFF CACHE BOOL "Skip installation")
set(ENABLE_SPVREMAPPER OFF CACHE BOOL "Enables building of SPVRemapper")
set(ENABLE_GLSLANG_BINARIES OFF CACHE BOOL "Builds glslangValidator and spirv-remap")
set(ENABLE_HLSL OFF CACHE BOOL "Enables HLSL input support")
set(ENABLE_OPT OFF CACHE BOOL "Enables spirv-opt capability if present")
add_subdirectory(glslang)
set_property(TARGET glslang PROPERTY FOLDER Dependencies/glslang)
set_property(TARGET OGLCompiler PROPERTY FOLDER Dependencies/glslang)
set_property(TARGET OSDependent PROPERTY FOLDER Dependencies/glslang)
set_property(TARGET SPIRV PROPERTY FOLDER Dependencies/glslang)

# -------------------------------- openssl --------------------------------
# Dependencies: none
if(ANDROID)
    set(OPENSSL_ROOT_DIR "${CMAKE_CURRENT_SOURCE_DIR}/openssl/openssl")
    set(OPENSSL_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/openssl/openssl/include")
    set(OPENSSL_CRYPTO_LIBRARY crypto.a)
    set(OPENSSL_SSL_LIBRARY ssl.a)
    set(OPENSSL_USE_STATIC_LIBS TRUE)
    add_subdirectory(openssl)

    set_property(TARGET SSL PROPERTY FOLDER "${CMAKE_CURRENT_SOURCE_DIR}/openssl")
    set_property(TARGET Crypto PROPERTY FOLDER "${CMAKE_CURRENT_SOURCE_DIR}/openssl")
    set(OpenSSLStatic_DIR "${CMAKE_CURRENT_SOURCE_DIR}/openssl")
    find_package(OpenSSLStatic)
endif()

# -------------------------------- ios-cmake --------------------------------
# Nothing to do here.

# -------------------------------- napi --------------------------------
# Dependencies: none
add_subdirectory(napi)
set_property(TARGET napi PROPERTY FOLDER Dependencies)

# -------------------------------- SPIRV-Cross --------------------------------
# Dependencies: none
add_subdirectory(SPIRV-Cross)
set_property(TARGET spirv-cross-core PROPERTY FOLDER Dependencies/SPIRV-Cross)
set_property(TARGET spirv-cross-glsl PROPERTY FOLDER Dependencies/SPIRV-Cross)
set_property(TARGET spirv-cross-hlsl PROPERTY FOLDER Dependencies/SPIRV-Cross)

# -------------------------------- xr --------------------------------
# Dependencies: none
# Currently OpenXR is only supported on Win32. More platforms will be added as 
# they become viable/available.
if(WIN32 OR WINDOWS_STORE)
    add_subdirectory(xr)
    set_property(TARGET xr PROPERTY FOLDER Dependencies/xr)
    set_property(TARGET openxr_loader PROPERTY FOLDER Dependencies/xr/OpenXR)
    set_property(TARGET generate_openxr_header PROPERTY FOLDER Dependencies/xr/OpenXR/Generated)
    set_property(TARGET xr_global_generated_files PROPERTY FOLDER Dependencies/xr/OpenXR/Generated)
endif()

# -------------------------------- curl --------------------------------
# Dependencies: openssl (indirect), 
if(NOT APPLE)
    if(ANDROID)
        set(CURL_CA_BUNDLE "none" CACHE FILEPATH "Path to SSL CA Certificate Bundle")
        set(CURL_CA_PATH "none" CACHE PATH "Path to SSL CA Certificate Directory")
    endif()

    if(WIN32)
        set(CMAKE_USE_WINSSL ON CACHE BOOL "Set cURL to use WinSSL by default.")
    else()
        set(CMAKE_USE_WINSSL OFF CACHE BOOL "Set cURL to use WinSSL by default.")
    endif()

    add_subdirectory(curl)
    set_property(TARGET libcurl PROPERTY FOLDER Dependencies)

    # TODO: Certain parts of cURL's functionality are gated behind WINAPI checks
    # that cause the functionality to become unavailable in UWP. Find a better way 
    # to ensure that functionality is enabled, then remove the following workaround.
    if(WINDOWS_STORE)
        target_compile_definitions(libcurl PRIVATE "WINAPI_PARTITION_DESKTOP=1")
    endif()
endif()

# -------------------------------- BabylonNativeUtils --------------------------------
# Dependencies: arcana, curl (not for Apple)

add_subdirectory(BabylonNativeUtils)
set_property(TARGET BabylonNativeUtils PROPERTY FOLDER Dependencies)
