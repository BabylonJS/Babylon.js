# Callback-enabled alternative to CMake's built-in function target_link_libraries(). This function 
# iteratively handles the libraries. On each library, it checks for a list of CMake files in 
# the library's ON_LINKED_AS_DEPENDENCY_CMAKE_FILES property. If this property does not exist, 
# this function behaves identically to target_link_libraries(). If the property does exist, 
# this function first calls target_link_libraries(target { PUBLIC | PRIVATE | INTERFACE } library), 
# then traverses the list of CMake files, loading each one and calling the 
# on_linked_as_dependency(target) callback, which is allowed (though not required) to be defined 
# in the loaded CMake file. This allows libraries to attach behaviors to themselves that will 
# be executed whenever the libraries are linked to by another target.
function(target_link_to_dependencies)
    # Aliases/default state
    set(target ${ARGV0})
    math(EXPR lastIdx ${ARGC}-1)
    set(scope PUBLIC)

    # Iterate through the arguments tail, which is expected to contain library names and scopes.
    foreach(idx RANGE 1 ${lastIdx})
        # Alias for the current argument.
        set(arg "${ARGV${idx}}")

        # If the argument is a scope, update the scope variable.
        if(arg STREQUAL "PUBLIC")
            set(scope PUBLIC)
        elseif(arg STREQUAL "PRIVATE")
            set(scope PRIVATE)
        elseif(arg STREQUAL "INTERFACE")
            set(scope INTERFACE)
        elseif(TARGET ${arg})
            # If the argument is a CMake target, perform the specialized behavior.
            target_link_libraries(${target} ${scope} ${arg})

            get_target_property(type ${arg} TYPE)
            if(NOT type STREQUAL "INTERFACE_LIBRARY")
                get_target_property(cmakeFileList ${arg} ON_LINKED_AS_DEPENDENCY_CMAKE_FILES)
                if(NOT cmakeFileList STREQUAL "cmakeFileList-NOTFOUND")
                    foreach(cmakeFile ${cmakeFileList})
                        function(on_linked_as_dependency target)
                        endfunction()

                        include(${cmakeFile} REQUIRED)
                        on_linked_as_dependency(${target})
                    endforeach()
                endif()
            endif()
        else()
            # If the argument is neither a CMake target nor a scope (it might be a string naming
            # a platform-level library, for example), just call target_link_libraries() to match
            # default behavior.
            target_link_libraries(${target} ${scope} ${arg})
        endif()
    endforeach()
endfunction()

# Helper function to attach a callback behavior contained in a CMake file to a target. Calling
# this function explicitly adds the provided CMake file to the target, allowing for duplicates.
function(add_on_linked_as_dependency_cmake_file target cmakeFile)
    get_target_property(cmakeFileList ${target} ON_LINKED_AS_DEPENDENCY_CMAKE_FILES)
    if(cmakeFileList STREQUAL "cmakeFileList-NOTFOUND")
        set(cmakeFileList ${cmakeFile})
    else()
        list(APPEND cmakeFileList ${cmakeFile})
    endif()
    set_target_properties(${target} PROPERTIES ON_LINKED_AS_DEPENDENCY_CMAKE_FILES "${cmakeFileList}")
endfunction()

# Helper function to propagate the attachment of a CMake file from a library to a target
# linking to it. Calling this function does NOT explicitly add the provided CMake files to the
# target, and it will automatically refuse to add duplicates.
function(propagate_on_linked_as_dependency_cmake_file library target)
    get_target_property(type ${target} TYPE)
            
    if(NOT ${type} STREQUAL "INTERFACE_LIBRARY")
        get_target_property(onLinkedAsDependencyHandlers ${library} ON_LINKED_AS_DEPENDENCY_CMAKE_FILES)
        get_target_property(cmakeFileList ${target} ON_LINKED_AS_DEPENDENCY_CMAKE_FILES)
        foreach(handler ${onLinkedAsDependencyHandlers})
            if(cmakeFileList STREQUAL "cmakeFileList-NOTFOUND")
                set(cmakeFileList ${handler})
            else()
                list(FIND cmakeFileList ${handler} idx)
                if(${idx} EQUAL -1)
                    list(APPEND cmakeFileList ${handler})
                endif()
            endif()
        endforeach()
        set_target_properties(${target} PROPERTIES ON_LINKED_AS_DEPENDENCY_CMAKE_FILES "${cmakeFileList}")
    endif()
endfunction()

function(warnings_as_errors target)
    if (CMAKE_CXX_COMPILER_ID STREQUAL "MSVC")
      # 5205 : delete of an abstract XXX that has a non-virtual destructor results in undefined behavior (coming from WinRT)
      target_compile_options(${target} PRIVATE /W4 /WX /wd5205)
    elseif (CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
      target_compile_options(${target} PRIVATE -Wall -Wextra -Wpedantic -Werror)
    else()
      # c99-extensions and gnu-zero-variadic-macro-arguments coming from included bgfx headers
      target_compile_options(${target} PRIVATE -Wall -Wextra -pedantic -Werror -Wno-c99-extensions -Wno-gnu-zero-variadic-macro-arguments)
    endif()
endfunction()

function(disable_warnings target)
    if (CMAKE_CXX_COMPILER_ID STREQUAL "MSVC")
      target_compile_options(${target} PRIVATE /W0)
      # Link warning 4264 : archiving object file compiled with /ZW into a static library; note that when authoring Windows Runtime types it is not recommended to link with a static library that contains Windows Runtime metadata unless /WHOLEARCHIVE is specified to include everything from the static library
      set_property(TARGET ${target} PROPERTY STATIC_LIBRARY_OPTIONS /ignore:4264)
    elseif (CMAKE_CXX_COMPILER_ID STREQUAL "GNU")
      target_compile_options(${target} PRIVATE -Wno-cpp)
    else()
      target_compile_options(${target} PRIVATE -Wno-everything)
    endif()
endfunction()
