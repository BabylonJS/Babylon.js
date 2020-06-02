set(BABYLONSCRIPTS
    "../BabylonScripts/babylon.glTF2FileLoader.js"
    "../BabylonScripts/babylon.max.js"
    "../BabylonScripts/babylonjs.materials.js"
    "../BabylonScripts/ammo.js"
    "../BabylonScripts/meshwriter.min.js"
    "../BabylonScripts/recast.js")

set(SCRIPTS
    "Scripts/experience.js"
    "Scripts/playground_runner.js")

set(SOURCES
    "Shared/InputManager.cpp"
    "Shared/InputManager.h")

if(APPLE)
    find_library(JSCORE_LIBRARY JavaScriptCore)
    if(IOS)
        set(PLIST_FILE
            "${CMAKE_CURRENT_LIST_DIR}/iOS/Info.plist")
        set(STORYBOARD
            "${CMAKE_CURRENT_LIST_DIR}/iOS/Base.lproj/Main.storyboard"
            "${CMAKE_CURRENT_LIST_DIR}/iOS/Base.lproj/LaunchScreen.storyboard")
        set(RESOURCE_FILES ${STORYBOARD} ${SCRIPTS})
        set(ADDITIONAL_LIBRARIES PRIVATE z)
        set(SOURCES
            ${SOURCES}
            "iOS/AppDelegate.swift"
            "iOS/ViewController.swift"
            "iOS/LibNativeBridge.h"
            "iOS/LibNativeBridge.mm")
    else()
        set(PLIST_FILE "${CMAKE_CURRENT_LIST_DIR}/macOS/Info.plist")
        set(STORYBOARD "${CMAKE_CURRENT_LIST_DIR}/macOS/Base.lproj/Main.storyboard")
        set(RESOURCE_FILES ${STORYBOARD})
        set(SOURCES
            ${SOURCES}
            "macOS/main.m"
            "macOS/AppDelegate.m"
            "macOS/AppDelegate.h"
            "macOS/ViewController.mm"
            "macOS/ViewController.h")
    endif()
    set(ADDITIONAL_LIBRARIES ${ADDITIONAL_LIBRARIES} PRIVATE ${JSCORE_LIBRARY})
    set(JSSCRIPT
        "${CMAKE_CURRENT_LIST_DIR}/../BabylonScripts/ammo.js"
        "${CMAKE_CURRENT_LIST_DIR}/../BabylonScripts/recast.js"
        "${CMAKE_CURRENT_LIST_DIR}/../BabylonScripts/babylon.glTF2FileLoader.js"
        "${CMAKE_CURRENT_LIST_DIR}/../BabylonScripts/babylon.max.js"
        "${CMAKE_CURRENT_LIST_DIR}/../BabylonScripts/babylonjs.materials.js"
        "${CMAKE_CURRENT_LIST_DIR}/Scripts/experience.js"
        "${CMAKE_CURRENT_LIST_DIR}/Scripts/playground_runner.js")
    set(RESOURCE_FILES ${STORYBOARD} ${JSSCRIPT})
elseif(UNIX)
    set(SOURCES
        ${SOURCES}
        "X11/App.cpp")
elseif(WINDOWS_STORE)
    set(APPX_FILES "UWP/Package.appxmanifest" "UWP/TemporaryKey.pfx")
    set_property(SOURCE ${APPX_FILES} PROPERTY VS_DEPLOYMENT_CONTENT 1)
    set(APPX_ASSETS
        "UWP/Assets/LockScreenLogo.scale-200.png"
        "UWP/Assets/SplashScreen.scale-200.png"
        "UWP/Assets/Square44x44Logo.scale-200.png"
        "UWP/Assets/Square44x44Logo.targetsize-24_altform-unplated.png"
        "UWP/Assets/Square150x150Logo.scale-200.png"
        "UWP/Assets/StoreLogo.png"
        "UWP/Assets/Wide310x150Logo.scale-200.png")
    set_property(SOURCE ${APPX_ASSETS} PROPERTY VS_DEPLOYMENT_CONTENT 1)
    set_property(SOURCE ${APPX_ASSETS} PROPERTY VS_DEPLOYMENT_LOCATION "Assets")
    set(SOURCES
        ${SOURCES}
        ${APPX_FILES}
        ${APPX_ASSETS}
        "UWP/App.cpp"
        "UWP/App.h")
    set(ADDITIONAL_LIBRARIES PRIVATE NativeXr)
elseif(WIN32)
    set(SOURCES
        ${SOURCES}
        "Win32/App.cpp"
        "Win32/App.h"
        "Win32/App.ico"
        "Win32/App.rc"
        "Win32/Resource.h"
        "Win32/small.ico"
        "Win32/targetver.h")
    set(ADDITIONAL_LIBRARIES PRIVATE NativeXr)
endif()

if(WIN32)
    set(WIN32_EXECUTABLE TRUE)
    add_executable(Playground WIN32 ${BABYLONSCRIPTS} ${SCRIPTS} ${SOURCES} ${RESOURCE_FILES})
else()
    add_executable(Playground ${BABYLONSCRIPTS} ${SCRIPTS} ${SOURCES} ${RESOURCE_FILES})
endif()

warnings_as_errors(Playground)
target_compile_definitions(Playground PRIVATE UNICODE)
target_compile_definitions(Playground PRIVATE _UNICODE)

if(WINDOWS_STORE)
    target_compile_options(Playground PRIVATE /ZW)
    target_compile_options(Playground PRIVATE /await)
endif()

target_include_directories(Playground PRIVATE "Source" ".")

target_link_to_dependencies(Playground
    PRIVATE AppRuntime
    PRIVATE NativeWindow
    PRIVATE NativeEngine
    PRIVATE Console
    PRIVATE Window
    PRIVATE ScriptLoader
    PRIVATE XMLHttpRequest
    ${ADDITIONAL_LIBRARIES})

if(WIN32)
    target_link_to_dependencies(Playground
        PRIVATE "shlwapi.lib")
endif()

if (UNIX AND NOT APPLE AND NOT ANDROID)
    # Ubuntu mixes old experimental header and new runtime libraries
    # Resulting in crash at runtime for std::filesystem
    # https://stackoverflow.com/questions/56738708/c-stdbad-alloc-on-stdfilesystempath-append
    target_link_libraries(Playground 
        PRIVATE stdc++fs)
endif()

if(APPLE)
    if(IOS)
        set_target_properties(Playground PROPERTIES
            MACOSX_BUNDLE true
            MACOSX_BUNDLE_INFO_PLIST "${PLIST_FILE}"
            XCODE_ATTRIBUTE_CLANG_ENABLE_OBJC_ARC YES
            RESOURCE "${RESOURCE_FILES}"

            XCODE_ATTRIBUTE_IPHONEOS_DEPLOYMENT_TARGET 9.0
            XCODE_ATTRIBUTE_PRODUCT_BUNDLE_IDENTIFIER "com.BabylonNative.Playground.iOS"

            XCODE_ATTRIBUTE_ENABLE_BITCODE NO

            XCODE_ATTRIBUTE_SWIFT_VERSION "4.0"
            XCODE_ATTRIBUTE_SWIFT_OBJC_BRIDGING_HEADER "${CMAKE_CURRENT_LIST_DIR}/iOS/LibNativeBridge.h"
            XCODE_ATTRIBUTE_LD_RUNPATH_SEARCH_PATHS "@executable_path/Frameworks"
            XCODE_ATTRIBUTE_ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES YES

            # CMake seems to add a custom flag "-Wno-unknown-pragmas" to the Swift compiler. That flag is used for Clang,
            # So we need to make sure we override it with nothing here in order to compile Swift.
            XCODE_ATTRIBUTE_OTHER_SWIFT_FLAGS "")

            # Swift support
            set(CMAKE_Swift_COMPILER_FORCED TRUE)
            set(CMAKE_Swift_LANGUAGE_VERSION 4.0)
            enable_language(Swift)
    else()
        set_target_properties(Playground PROPERTIES
            MACOSX_BUNDLE true
            MACOSX_BUNDLE_INFO_PLIST "${PLIST_FILE}"
            XCODE_ATTRIBUTE_CLANG_ENABLE_OBJC_ARC YES
            RESOURCE "${RESOURCE_FILES}"
            FOLDER "Playground")
    endif()
endif()

if(WINDOWS_STORE)
    set_property(SOURCE ${SCRIPTS} ${BABYLONSCRIPTS} PROPERTY VS_DEPLOYMENT_CONTENT 1)
    set_property(SOURCE ${SCRIPTS} ${BABYLONSCRIPTS} PROPERTY VS_DEPLOYMENT_LOCATION "Scripts")
else()
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
endif()

set_property(TARGET Playground PROPERTY FOLDER Apps)
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR}/../BabylonScripts PREFIX Scripts FILES ${BABYLONSCRIPTS})
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR} FILES ${SCRIPTS})
source_group(TREE ${CMAKE_CURRENT_SOURCE_DIR} FILES ${SOURCES})
set_property(DIRECTORY ${CMAKE_SOURCE_DIR} PROPERTY VS_STARTUP_PROJECT Playground)
