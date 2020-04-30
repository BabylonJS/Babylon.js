if(NOT ANDROID)
    add_subdirectory(Playground)
endif()

if(WIN32 OR UNIX AND NOT APPLE AND NOT ANDROID AND NOT WINDOWS_STORE) # Default JS engine for platform only?
    add_subdirectory(ValidationTests)
endif()
