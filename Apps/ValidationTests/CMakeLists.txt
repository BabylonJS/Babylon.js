set(SCRIPTS "Scripts/validation_native.js")
set(BABYLONJS 
    "../Babylonjs/babylon.glTF2FileLoader.js"
    "../Babylonjs/babylon.max.js"
    "../Babylonjs/babylonjs.materials.js")

set(SOURCES
    ${SCRIPTS}
    ${BABYLONJS}
    "Shared/TestUtils.h")
if(WIN32 AND NOT WINDOWS_STORE)
    set(SOURCES
        ${SOURCES}
        "Win32/App.cpp"
        "Win32/App.h"
        "Win32/App.ico"
        "Win32/App.rc"
        "Win32/Resource.h"
        "Win32/small.ico"
        "Win32/targetver.h")
endif()

if(WIN32)
    set(WIN32_EXECUTABLE TRUE)
    add_executable(ValidationTests WIN32 ${SOURCES} ${RESOURCE_FILES})
endif()


set_property(DIRECTORY ${CMAKE_SOURCE_DIR} PROPERTY VS_STARTUP_PROJECT ValidationTests)

source_group(TREE "${CMAKE_CURRENT_SOURCE_DIR}/.." FILES ${SOURCES})

target_compile_definitions(ValidationTests PRIVATE UNICODE)
target_compile_definitions(ValidationTests PRIVATE _UNICODE)

if(WINDOWS_STORE)
    target_compile_options(ValidationTests PRIVATE /ZW)
    target_compile_options(ValidationTests PRIVATE /await)
endif()

if(WIN32)
    set(TEST_DEPENDENCY "${CMAKE_CURRENT_SOURCE_DIR}/../../Library/Dependencies/bgfx.cmake/bx/include/compat/msvc"
        "${CMAKE_CURRENT_SOURCE_DIR}/../../Library/Dependencies/bgfx.cmake/bgfx/include"
        "${CMAKE_CURRENT_SOURCE_DIR}/../../Library/Dependencies/bgfx.cmake/bx/include"
        "${CMAKE_CURRENT_SOURCE_DIR}/../../Library/Dependencies/bgfx.cmake/bimg/include")
endif()

target_include_directories(ValidationTests PRIVATE "Source" "." ${TEST_DEPENDENCY})

target_link_libraries(ValidationTests PRIVATE Library ${ADDITIONAL_LIBRARIES})

foreach(script ${SCRIPTS})
    add_custom_command(
        OUTPUT "${script}"
        COMMAND "${CMAKE_COMMAND}" -E copy "${CMAKE_CURRENT_SOURCE_DIR}/${script}" "${CMAKE_CURRENT_BINARY_DIR}/${script}"
        COMMENT "Copying ${script}"
        MAIN_DEPENDENCY "${CMAKE_CURRENT_SOURCE_DIR}/${script}")
endforeach()

add_custom_command(TARGET ValidationTests PRE_BUILD
                   COMMAND ${CMAKE_COMMAND} -E copy_directory
                   ${CMAKE_SOURCE_DIR}/Apps/Babylonjs/ "${CMAKE_CURRENT_BINARY_DIR}/Scripts")

foreach(dependency ${BABYLON_NATIVE_DEPENDENCIES})
    add_custom_command(TARGET ValidationTests POST_BUILD COMMAND ${CMAKE_COMMAND} -E copy_if_different ${dependency} $<TARGET_FILE_DIR:ValidationTests>)
endforeach(dependency)
