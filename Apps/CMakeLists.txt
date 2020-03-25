if(NOT ANDROID)
    add_subdirectory(Playground)
endif()

if(WIN32 AND NOT WINDOWS_STORE) # TODO: Chakra only?
    add_subdirectory(ValidationTests)
endif()
