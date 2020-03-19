cmake_minimum_required(VERSION 3.12)

project(napi)

if (WIN32 OR WINDOWS_STORE)
    set(NAPI_JAVASCRIPT_ENGINE "Chakra" CACHE STRING "JavaScript engine for N-API.")
elseif (ANDROID)
    set(NAPI_JAVASCRIPT_ENGINE "V8" CACHE STRING "JavaScript engine for N-API.")
elseif (APPLE)
    set(NAPI_JAVASCRIPT_ENGINE "JavaScriptCore" CACHE STRING "JavaScript engine for N-API.")
else()
    message(FATAL_ERROR "Unable to select N-API JavaScript engine for platform.")
endif()

set(SUPPORTED_JAVASCRIPT_ENGINES "Chakra" "V8" "JavaScriptCore")
set(NAPI_JAVASCRIPT_ENGINE "V8" CACHE STRING "JavaScript engine for N-API.")
if(NOT(NAPI_JAVASCRIPT_ENGINE IN_LIST SUPPORTED_JAVASCRIPT_ENGINES))
    message(FATAL_ERROR "Unrecognized engine: ${NAPI_JAVASCRIPT_ENGINE}")
endif()

if(NAPI_JAVASCRIPT_ENGINE STREQUAL "V8" AND NOT ANDROID)
    if(${CMAKE_CXX_COMPILER} MATCHES "x86/cl.exe$")
        set(ARCH "x86")
    elseif(${CMAKE_CXX_COMPILER} MATCHES "x64/cl.exe$")
        set(ARCH "x64")
    elseif(${CMAKE_CXX_COMPILER} MATCHES "arm/cl.exe$")
        set(ARCH "ARM")
    else()
        message(FATAL_ERROR "Unrecognized compiler: ${CMAKE_CXX_COMPILER}")
    endif()

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

    set(NAPI_DEPENDENCIES
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/icudtl.dat"
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/icui18n.dll"
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/icuuc.dll"
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/natives_blob.bin"
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/snapshot_blob.bin"
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/v8.dll"
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/v8_libbase.dll"
        "${NUGET_PATH}/v8.redist-v141-${ARCH}.7.4.288.26/lib/Release/v8_libplatform.dll")
endif()

set(SOURCES
    "include/napi/env.h"
    "include/napi/js_native_api.h"
    "include/napi/js_native_api_types.h"
    "include/napi/napi.h"
    "include/napi/napi-inl.h"
    "source/env.cc"
    "source/env_${NAPI_JAVASCRIPT_ENGINE}.cc"
    "source/js_native_api_${NAPI_JAVASCRIPT_ENGINE}.cc"
    "source/js_native_api_${NAPI_JAVASCRIPT_ENGINE}.h")
if(NAPI_JAVASCRIPT_ENGINE STREQUAL "V8")
    set(SOURCES ${SOURCES} "source/js_native_api_v8_internals.h")
endif()

add_library(napi ${SOURCES})

target_compile_definitions(napi PRIVATE NOMINMAX)
target_compile_definitions(napi PRIVATE _CRT_SECURE_NO_WARNINGS)

target_compile_definitions(napi PUBLIC NODE_ADDON_API_DISABLE_DEPRECATED)
target_compile_definitions(napi PUBLIC NODE_ADDON_API_DISABLE_NODE_SPECIFIC)

if(NAPI_JAVASCRIPT_ENGINE STREQUAL "Chakra")
    target_compile_definitions(napi PUBLIC USE_EDGEMODE_JSRT)
endif()

# V8 android build until we figured out how to deal with custom V8 nugget
if (ANDROID)
    target_include_directories(napi PUBLIC "../v8/include")
endif()

target_include_directories(napi PUBLIC "include")

if(NAPI_JAVASCRIPT_ENGINE STREQUAL "Chakra")
    target_link_libraries(napi PUBLIC "chakrart.lib")
elseif(NAPI_JAVASCRIPT_ENGINE STREQUAL "V8" AND NOT ANDROID)
    target_link_libraries(napi PUBLIC v8)
endif()

set(NAPI_DEPENDENCIES ${NAPI_DEPENDENCIES} PARENT_SCOPE)
