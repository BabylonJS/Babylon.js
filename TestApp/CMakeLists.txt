set(SCRIPTS
    "Scripts/babylon.glTF2FileLoader.js"
    "Scripts/babylon.max.js"
    "Scripts/experience.js"
    "Scripts/playground_runner.js"
    "Scripts/babylonjs.materials.js")

set(SOURCES
    ${SCRIPTS}
    "Source/Shared/InputManager.cpp"
    "Source/Shared/InputManager.h")
if(WIN32 AND NOT WINDOWS_STORE)
    set(SOURCES
        ${SOURCES}
        "Source/Win32/App.cpp"
        "Source/Win32/App.h"
        "Source/Win32/App.ico"
        "Source/Win32/App.rc"
        "Source/Win32/Resource.h"
        "Source/Win32/small.ico"
        "Source/Win32/targetver.h")
elseif(WINDOWS_STORE)
    set(APPX_FILES "Source/UWP/Package.appxmanifest" "Source/UWP/TemporaryKey.pfx")
    set_property(SOURCE ${APPX_FILES} PROPERTY VS_DEPLOYMENT_CONTENT 1)

    set(APPX_ASSETS
        "Source/UWP/Assets/LockScreenLogo.scale-200.png"
        "Source/UWP/Assets/SplashScreen.scale-200.png"
        "Source/UWP/Assets/Square44x44Logo.scale-200.png"
        "Source/UWP/Assets/Square44x44Logo.targetsize-24_altform-unplated.png"
        "Source/UWP/Assets/Square150x150Logo.scale-200.png"
        "Source/UWP/Assets/StoreLogo.png"
        "Source/UWP/Assets/Wide310x150Logo.scale-200.png")
    set_property(SOURCE ${APPX_ASSETS} PROPERTY VS_DEPLOYMENT_CONTENT 1)
    set_property(SOURCE ${APPX_ASSETS} PROPERTY VS_DEPLOYMENT_LOCATION "Assets")

    set(SOURCES
        ${SOURCES}
        ${APPX_FILES}
        ${APPX_ASSETS}
        "Source/UWP/App.cpp"
        "Source/UWP/App.h")

elseif(APPLE)
    find_library(JSCORE_LIBRARY JavaScriptCore)
    if(IOS)
        set(PLIST_FILE "${CMAKE_CURRENT_LIST_DIR}/Source/iOS/Info.plist")

        set(STORYBOARD "${CMAKE_CURRENT_LIST_DIR}/Source/iOS/Base.lproj/Main.storyboard"
                       "${CMAKE_CURRENT_LIST_DIR}/Source/iOS/Base.lproj/LaunchScreen.storyboard")
        set(RESOURCE_FILES ${STORYBOARD} ${SCRIPTS})
        set(ADDITIONAL_LIBRARIES z)
        set(SOURCES
            ${SOURCES}
            "Source/iOS/AppDelegate.swift"
            "Source/iOS/ViewController.swift"
            "Source/iOS/LibNativeBridge.h"
            "Source/iOS/LibNativeBridge.mm")
    else()
        set(PLIST_FILE "${CMAKE_CURRENT_LIST_DIR}/Source/macOS/Info.plist")
        set(STORYBOARD "${CMAKE_CURRENT_LIST_DIR}/Source/macOS/Base.lproj/Main.storyboard")

        set(STORYBOARD "${CMAKE_CURRENT_LIST_DIR}/Source/macOS/Base.lproj/Main.storyboard")
        set(RESOURCE_FILES ${STORYBOARD})

        set(SOURCES
            ${SOURCES}
            "Source/macOS/main.m"
            "Source/macOS/AppDelegate.m"
            "Source/macOS/AppDelegate.h"
            "Source/macOS/ViewController.mm"
            "Source/macOS/ViewController.h")
    endif()

    set(ADDITIONAL_LIBRARIES ${ADDITIONAL_LIBRARIES} ${JSCORE_LIBRARY})
    set(JSSCRIPT "${CMAKE_CURRENT_LIST_DIR}/Scripts/babylon.glTF2FileLoader.js"
        "${CMAKE_CURRENT_LIST_DIR}/Scripts/babylon.max.js"
        "${CMAKE_CURRENT_LIST_DIR}/Scripts/experience.js"
        "${CMAKE_CURRENT_LIST_DIR}/Scripts/playground_runner.js")
    set(RESOURCE_FILES ${STORYBOARD} ${JSSCRIPT})
endif()

if(WIN32 OR WINDOWS_STORE)
    set(WIN32_EXECUTABLE TRUE)
    add_executable(TestApp WIN32 ${SOURCES} ${RESOURCE_FILES})
else()
    add_executable(TestApp ${SOURCES} ${RESOURCE_FILES})
endif()


set_property(DIRECTORY ${CMAKE_SOURCE_DIR} PROPERTY VS_STARTUP_PROJECT TestApp)

source_group(TREE "${CMAKE_CURRENT_SOURCE_DIR}" FILES ${SOURCES})

target_compile_definitions(TestApp PRIVATE UNICODE)
target_compile_definitions(TestApp PRIVATE _UNICODE)

if(WINDOWS_STORE)
    target_compile_options(TestApp PRIVATE /ZW)
    target_compile_options(TestApp PRIVATE /await)
endif()

target_include_directories(TestApp PRIVATE "Source")

target_link_libraries(TestApp PRIVATE Library ${ADDITIONAL_LIBRARIES})

if(APPLE)
    if(IOS)
        set_target_properties(TestApp PROPERTIES
            MACOSX_BUNDLE true
            MACOSX_BUNDLE_INFO_PLIST "${PLIST_FILE}"
            XCODE_ATTRIBUTE_CLANG_ENABLE_OBJC_ARC YES
            RESOURCE "${RESOURCE_FILES}"

            XCODE_ATTRIBUTE_IPHONEOS_DEPLOYMENT_TARGET 9.0
            XCODE_ATTRIBUTE_PRODUCT_BUNDLE_IDENTIFIER "com.BabylonNative.TestApp.iOS"

            XCODE_ATTRIBUTE_ENABLE_BITCODE NO

            XCODE_ATTRIBUTE_SWIFT_VERSION "4.0"
            XCODE_ATTRIBUTE_SWIFT_OBJC_BRIDGING_HEADER "${CMAKE_CURRENT_LIST_DIR}/Source/iOS/LibNativeBridge.h"
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
        set_target_properties(TestApp PROPERTIES
            MACOSX_BUNDLE true
            MACOSX_BUNDLE_INFO_PLIST "${PLIST_FILE}"
            XCODE_ATTRIBUTE_CLANG_ENABLE_OBJC_ARC YES
            RESOURCE "${RESOURCE_FILES}"
            FOLDER "TestApp")
    endif()
endif()

if(WINDOWS_STORE)
    set_property(SOURCE ${SCRIPTS} PROPERTY VS_DEPLOYMENT_CONTENT 1)
    set_property(SOURCE ${SCRIPTS} PROPERTY VS_DEPLOYMENT_LOCATION "Scripts")
else()
    foreach(script ${SCRIPTS})
        add_custom_command(
            OUTPUT "${script}"
            COMMAND "${CMAKE_COMMAND}" -E copy "${CMAKE_CURRENT_SOURCE_DIR}/${script}" "${CMAKE_CURRENT_BINARY_DIR}/${script}"
            COMMENT "Copying ${script}"
            MAIN_DEPENDENCY "${CMAKE_CURRENT_SOURCE_DIR}/${script}")
    endforeach()
endif()

foreach(dependency ${BABYLON_NATIVE_DEPENDENCIES})
    add_custom_command(TARGET TestApp POST_BUILD COMMAND ${CMAKE_COMMAND} -E copy_if_different ${dependency} $<TARGET_FILE_DIR:TestApp>)
endforeach(dependency)
