set(SCRIPTS
    "Scripts/babylon.glTF2FileLoader.js"
    "Scripts/babylon.max.js"
    "Scripts/experience.js"
    "Scripts/playground_runner.js")

set(SOURCES
    ${SCRIPTS}
    "Source/Shared/InputManager.cpp"
    "Source/Shared/InputManager.h")
if(BABYLON_NATIVE_PLATFORM STREQUAL "Win32")
    set(SOURCES
        ${SOURCES}
        "Source/Win32/App.cpp"
        "Source/Win32/App.h"
        "Source/Win32/App.ico"
        "Source/Win32/App.rc"
        "Source/Win32/Resource.h"
        "Source/Win32/small.ico"
        "Source/Win32/targetver.h")
elseif(BABYLON_NATIVE_PLATFORM STREQUAL "UWP")
    set(SOURCES
        ${SOURCES}
        "Source/UWP/App.cpp"
        "Source/UWP/App.h")
endif()

set(WIN32_EXECUTABLE TRUE)
add_executable(TestApp WIN32 ${SOURCES})

source_group(TREE "${CMAKE_CURRENT_SOURCE_DIR}" FILES ${SOURCES})

target_compile_definitions(TestApp PRIVATE UNICODE)
target_compile_definitions(TestApp PRIVATE _UNICODE)

target_include_directories(TestApp PRIVATE "Source")

target_link_libraries(TestApp PRIVATE Library)

foreach(script ${SCRIPTS})
    add_custom_command(
        OUTPUT "${script}"
        COMMAND "${CMAKE_COMMAND}" -E copy "${CMAKE_CURRENT_SOURCE_DIR}/${script}" "${CMAKE_CURRENT_BINARY_DIR}/${script}"
        COMMENT "Copying ${script}"
        MAIN_DEPENDENCY "${CMAKE_CURRENT_SOURCE_DIR}/${script}")
endforeach()

foreach(dependency ${BABYLON_NATIVE_DEPENDENCIES})
    add_custom_command(TARGET TestApp POST_BUILD COMMAND ${CMAKE_COMMAND} -E copy_if_different ${dependency} $<TARGET_FILE_DIR:TestApp>)
endforeach(dependency)
