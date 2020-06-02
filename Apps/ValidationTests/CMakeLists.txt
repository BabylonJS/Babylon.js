if((NOT UNIX AND NOT WIN32) OR WINDOWS_STORE OR APPLE OR ANDROID)
    message(FATAL_ERROR "Unsupported platform: ${CMAKE_SYSTEM_NAME}")
endif()

set(BABYLONSCRIPTS 
    "../BabylonScripts/babylon.glTF2FileLoader.js"
    "../BabylonScripts/babylon.max.js"
    "../BabylonScripts/babylonjs.materials.js")

set(SCRIPTS
    "Scripts/validation_native.js"
    "Scripts/config.json")

if(WIN32)
    set(SOURCES
        "Shared/TestUtils.h"
        "Win32/App.cpp"
        "Win32/App.h"
        "Win32/App.ico"
        "Win32/App.rc"
        "Win32/Resource.h"
        "Win32/small.ico"
        "Win32/targetver.h")

    set(WIN32_EXECUTABLE TRUE)
    add_executable(ValidationTests WIN32 ${BABYLONSCRIPTS} ${SCRIPTS} ${SOURCES})
elseif(UNIX)
    set(SOURCES
        ${SOURCES}
        "X11/App.cpp")
    add_executable(ValidationTests ${BABYLONSCRIPTS} ${SCRIPTS} ${SOURCES})
endif()

warnings_as_errors(ValidationTests)
target_compile_definitions(ValidationTests PRIVATE UNICODE)
target_compile_definitions(ValidationTests PRIVATE _UNICODE)

target_include_directories(ValidationTests PRIVATE "Source" ".")

if (UNIX AND NOT APPLE AND NOT ANDROID)
    # Ubuntu mixes old experimental header and new runtime libraries
    # Resulting in crash at runtime for std::filesystem
    # https://stackoverflow.com/questions/56738708/c-stdbad-alloc-on-stdfilesystempath-append
    target_link_libraries(ValidationTests 
        PRIVATE stdc++fs)
endif()

target_link_to_dependencies(ValidationTests
    PRIVATE bgfx
    PRIVATE bimg
    PRIVATE bx
    PRIVATE AppRuntime
    PRIVATE NativeEngine
    PRIVATE NativeWindow
    PRIVATE Console
    PRIVATE Window
    PRIVATE ScriptLoader
    PRIVATE XMLHttpRequest)

foreach(script ${SCRIPTS} ${BABYLONSCRIPTS})
    get_filename_component(SCRIPT_NAME "${script}" NAME)
    # Copy scripts to the parent of the executable location since CMake can't use generator
    # expressions with OUTPUT. See https://gitlab.kitware.com/cmake/cmake/-/issues/12877.
    add_custom_command(
        OUTPUT "Scripts/${SCRIPT_NAME}"
        COMMAND "${CMAKE_COMMAND}" -E copy "${CMAKE_CURRENT_SOURCE_DIR}/${script}" "${CMAKE_CURRENT_BINARY_DIR}/Scripts/${SCRIPT_NAME}"
        COMMENT "Copying ${SCRIPT_NAME}"
        MAIN_DEPENDENCY "${CMAKE_CURRENT_SOURCE_DIR}/${script}")
endforeach()

set_property(TARGET ValidationTests PROPERTY FOLDER Apps)
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR}/../BabylonScripts PREFIX Scripts FILES ${BABYLONSCRIPTS})
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR} FILES ${SCRIPTS})
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR} FILES ${SOURCES})
