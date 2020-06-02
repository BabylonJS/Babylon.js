#include <XR.h>

#include <assert.h>
#include <optional>
#include <sstream>
#include <chrono>
#include <arcana/threading/task.h>
#include <arcana/threading/dispatcher.h>
#include <thread>

#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <GLES3/gl3.h>
#include <EGL/egl.h>

#include <AndroidExtensions/Globals.h>
#include <AndroidExtensions/JavaWrappers.h>

#include <android/native_window.h>
#include <android/log.h>
#include <arcore_c_api.h>

#include <gsl/gsl>

#define GLM_FORCE_RADIANS 1
#define GLM_ENABLE_EXPERIMENTAL
#include <glm.hpp>
#include <gtc/matrix_transform.hpp>
#include <gtc/type_ptr.hpp>
#include <gtx/quaternion.hpp>
#include <arcana/threading/task_schedulers.h>

using namespace android;
using namespace android::global;

namespace xr
{
    // Permission request ID used to uniquely identify our request in the callback when calling requestPermissions.
    const int PERMISSION_REQUEST_ID = 8435;

    struct System::Impl
    {
        Impl(const std::string& /*applicationName*/)
        {
        }

        bool IsInitialized() const
        {
            return true;
        }

        bool TryInitialize()
        {
            return true;
        }
    };

    namespace
    {
        constexpr GLfloat VERTEX_POSITIONS[]{ -1.0f, -1.0f, +1.0f, -1.0f, -1.0f, +1.0f, +1.0f, +1.0f };
        constexpr size_t VERTEX_COUNT{ std::size(VERTEX_POSITIONS) / 2 };

        constexpr char QUAD_VERT_SHADER[] = R"(#version 300 es
            precision highp float;
            uniform vec2 vertexPositions[4];
            uniform vec2 cameraFrameUVs[4];
            out vec2 cameraFrameUV;
            out vec2 babylonUV;
            void main() {
                gl_Position = vec4(vertexPositions[gl_VertexID], 0.0, 1.0);
                cameraFrameUV = cameraFrameUVs[gl_VertexID];
                babylonUV = vec2(gl_Position.x + 1.0, gl_Position.y + 1.0) * 0.5;
            }
        )";

        constexpr char QUAD_FRAG_SHADER[] = R"(#version 300 es
            #extension GL_OES_EGL_image_external_essl3 : require
            precision mediump float;
            in vec2 cameraFrameUV;
            in vec2 babylonUV;
            uniform samplerExternalOES cameraTexture;
            uniform sampler2D babylonTexture;
            out vec4 oFragColor;
            void main() {
                vec4 cameraColor = texture(cameraTexture, cameraFrameUV);
                vec4 babylonColor = texture(babylonTexture, babylonUV);
                oFragColor = mix(cameraColor, babylonColor, babylonColor.a);
            }
        )";

        GLuint LoadShader(GLenum shader_type, const char* shader_source)
        {
            GLuint shader = glCreateShader(shader_type);
            if (!shader)
            {
                throw std::runtime_error{ "Failed to create shader" };
            }

            glShaderSource(shader, 1, &shader_source, nullptr);
            glCompileShader(shader);
            GLint compileStatus = GL_FALSE;
            glGetShaderiv(shader, GL_COMPILE_STATUS, &compileStatus);

            if (compileStatus != GL_TRUE)
            {
                GLint infoLogLength = 0;

                glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &infoLogLength);
                if (!infoLogLength)
                {
                    throw std::runtime_error{ "Unknown error compiling shader" };
                }

                std::string infoLog;
                infoLog.resize(static_cast<size_t>(infoLogLength));
                glGetShaderInfoLog(shader, infoLogLength, nullptr, infoLog.data());
                glDeleteShader(shader);
                throw std::runtime_error("Error compiling shader: " + infoLog);
            }

            return shader;
        }

        GLuint CreateShaderProgram()
        {
            GLuint vertShader = LoadShader(GL_VERTEX_SHADER, QUAD_VERT_SHADER);
            GLuint fragShader = LoadShader(GL_FRAGMENT_SHADER, QUAD_FRAG_SHADER);

            GLuint program = glCreateProgram();
            if (!program)
            {
                throw std::runtime_error{ "Failed to create shader program" };
            }

            glAttachShader(program, vertShader);
            glAttachShader(program, fragShader);

            glLinkProgram(program);
            GLint linkStatus = GL_FALSE;
            glGetProgramiv(program, GL_LINK_STATUS, &linkStatus);

            glDetachShader(program, vertShader);
            glDeleteShader(vertShader);
            glDetachShader(program, fragShader);
            glDeleteShader(fragShader);

            if (linkStatus != GL_TRUE)
            {
                GLint infoLogLength = 0;
                glGetProgramiv(program, GL_INFO_LOG_LENGTH, &infoLogLength);
                if (!infoLogLength)
                {
                    throw std::runtime_error{ "Unknown error linking shader program" };
                }

                std::string infoLog;
                infoLog.resize(static_cast<size_t>(infoLogLength));
                glGetProgramInfoLog(program, infoLogLength, nullptr, infoLog.data());
                glDeleteProgram(program);
                throw std::runtime_error("Error linking shader program: " + infoLog);
            }

            return program;
        }

        constexpr GLint GetTextureUnit(GLenum texture)
        {
            return texture - GL_TEXTURE0;
        }

        namespace GLTransactions
        {
            auto SetCapability(GLenum capability, bool isEnabled)
            {
                const auto setCapability = [capability](bool isEnabled)
                {
                    if (isEnabled)
                    {
                        glEnable(capability);
                    }
                    else
                    {
                        glDisable(capability);
                    }
                };

                const auto wasEnabled = glIsEnabled(capability);
                setCapability(isEnabled);
                return gsl::finally([wasEnabled, setCapability]() { setCapability(wasEnabled); });
            }

            auto BindFrameBuffer(GLuint frameBufferId)
            {
                GLint previousFrameBufferId;
                glGetIntegerv(GL_FRAMEBUFFER_BINDING, &previousFrameBufferId);
                glBindFramebuffer(GL_FRAMEBUFFER, frameBufferId);
                return gsl::finally([previousFrameBufferId]() { glBindFramebuffer(GL_FRAMEBUFFER, static_cast<GLuint>(previousFrameBufferId)); });
            }

            auto DepthMask(GLboolean depthMask)
            {
                GLboolean previousDepthMask;
                glGetBooleanv(GL_DEPTH_WRITEMASK, &previousDepthMask);
                glDepthMask(depthMask);
                return gsl::finally([previousDepthMask]() { glDepthMask(previousDepthMask); });
            }

            auto BlendFunc(GLenum blendFuncName, GLenum blendFuncSFactor, GLenum blendFuncTFactor)
            {
                GLint previousBlendFuncTFactor;
                glGetIntegerv(blendFuncName, &previousBlendFuncTFactor);
                glBlendFunc(blendFuncSFactor, blendFuncTFactor);
                return gsl::finally([blendFuncSFactor, previousBlendFuncTFactor]() { glBlendFunc(blendFuncSFactor, static_cast<GLenum>(previousBlendFuncTFactor)); });
            }

            auto ClearColor(GLfloat red, GLfloat green, GLfloat blue, GLfloat alpha)
            {
                GLfloat previousClearColor[4];
                glGetFloatv(GL_COLOR_CLEAR_VALUE, previousClearColor);
                glClearColor(red, green, blue, alpha);
                return gsl::finally([red = previousClearColor[0], green = previousClearColor[1], blue = previousClearColor[2], alpha = previousClearColor[3]]() { glClearColor(red, green, blue, alpha); });
            }
        }

        bool CheckARCoreInstallStatus(bool requestInstall)
        {
            ArInstallStatus install_status;
            ArStatus installStatus = ArCoreApk_requestInstall(
                GetEnvForCurrentThread(), GetCurrentActivity(), requestInstall, &install_status);
            return installStatus == AR_SUCCESS && install_status == AR_INSTALL_STATUS_INSTALLED;
        }

        arcana::task<void, std::exception_ptr> CheckAndInstallARCoreAsync()
        {
            auto task = arcana::task_from_result<std::exception_ptr>();

            // Check if ARCore is already installed.
            if (!CheckARCoreInstallStatus(false))
            {
                arcana::task_completion_source<void, std::exception_ptr> installTcs{};

                // Add a resume callback, which will check if ARCore has been successfully installed upon app resume.
                auto resumeTicket{AddResumeCallback([installTcs]() mutable {
                    if (!CheckARCoreInstallStatus(false))
                    {
                        // ARCore not installed, throw an error.
                        std::ostringstream message;
                        message << "ARCore not installed.";
                        installTcs.complete(arcana::make_unexpected(make_exception_ptr(std::runtime_error{message.str()})));
                    }
                    else
                    {
                        // ARCore installed successfully, complete the promise.
                        installTcs.complete();
                    }
                })};

                // Kick off the install request, and set the task for our caller to wait on.
                CheckARCoreInstallStatus(true);
                task = installTcs.as_task().then(arcana::inline_scheduler, arcana::cancellation::none(), [resumeTicket = std::move(resumeTicket)](){
                    return;
                });
            }

            return task;
        }

        arcana::task<void, std::exception_ptr> CheckCameraPermissionAsync()
        {
            auto task = arcana::task_from_result<std::exception_ptr>();

            // Check if permissions are already granted.
            if (!GetAppContext().checkSelfPermission(ManifestPermission::CAMERA()))
            {
                // Register for the permission callback request.
                arcana::task_completion_source<void, std::exception_ptr> permissionTcs;
                auto permissionTicket
                {
                    AddRequestPermissionsResultCallback(
                    [permissionTcs](int32_t requestCode, const std::vector<std::string>& /*permissionList*/, const std::vector<int32_t>& results) mutable
                    {
                        // Check if this is our permission request ID.
                        if (requestCode == PERMISSION_REQUEST_ID)
                        {
                            // If the permission is found and granted complete the task.
                            if (results[0] == 0 /* PackageManager.PERMISSION_GRANTED */)
                            {
                                permissionTcs.complete();
                                return;
                            }

                            // Permission was denied.  Complete the task with an error.
                            std::ostringstream message;
                            message << "Camera permission not acquired successfully";
                            permissionTcs.complete(arcana::make_unexpected(make_exception_ptr(std::runtime_error{message.str()})));
                        }
                    })
                };

                // Kick off the permission check request, and set the task for our caller to wait on.
                GetCurrentActivity().requestPermissions(ManifestPermission::CAMERA(), PERMISSION_REQUEST_ID);
                task = permissionTcs.as_task().then(arcana::inline_scheduler, arcana::cancellation::none(), [ticket = std::move(permissionTicket)](){
                    return;
                });
            }

            return task;
        }
    }

    struct System::Session::Impl
    {
        const System::Impl& SystemImpl;
        std::vector<Frame::View> ActiveFrameViews{ {} };
        std::vector<Frame::InputSource> InputSources;
        float DepthNearZ{ DEFAULT_DEPTH_NEAR_Z };
        float DepthFarZ{ DEFAULT_DEPTH_FAR_Z };

        Impl(System::Impl& systemImpl, void* /*graphicsContext*/)
            : SystemImpl{ systemImpl }
            , pauseTicket{AddPauseCallback([this]() { this->PauseSession(); }) }
            , resumeTicket{AddResumeCallback([this]() { this->ResumeSession(); })}
        {
        }

        ~Impl()
        {
            if (isInitialized)
            {
                ArPose_destroy(cameraPose);
                ArPose_destroy(hitResultPose);
                ArHitResult_destroy(hitResult);
                ArHitResultList_destroy(hitResultList);
                ArFrame_destroy(frame);
                ArSession_destroy(session);

                glDeleteTextures(1, &cameraTextureId);
                glDeleteProgram(shaderProgramId);
                glDeleteFramebuffers(1, &clearFrameBufferId);

                DestroyDisplayResources();
            }
        }

        void Initialize()
        {
            // Note: graphicsContext is an EGLContext
            // Generate a texture id for the camera texture (ARCore will allocate the texture itself)
            {
                glGenTextures(1, &cameraTextureId);
                glBindTexture(GL_TEXTURE_EXTERNAL_OES, cameraTextureId);
                glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
                glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
                glBindTexture(GL_TEXTURE_EXTERNAL_OES, 0);
            }

            // Create the shader program used for drawing the full screen quad that is the camera frame + Babylon render texture
            shaderProgramId = CreateShaderProgram();

            // Create the ARCore ArSession
            {
                ArStatus status = ArSession_create(GetEnvForCurrentThread(), GetAppContext(), &session);
                if (status != ArStatus::AR_SUCCESS)
                {
                    std::ostringstream message;
                    message << "Failed to create ArSession with status: " << status;
                    throw std::runtime_error{ message.str() };
                }
            }

            // Create a frame buffer used for clearing the color texture
            glGenFramebuffers(1, &clearFrameBufferId);

            // Create the ARCore ArFrame (this gets reused each time we query for the latest frame)
            ArFrame_create(session, &frame);

            // Create the ARCore ArPose that tracks camera position
            ArPose_create(session, nullptr, &cameraPose);

            // Create the hit result list, and hit result.
            ArHitResultList_create(session, &hitResultList);
            ArHitResult_create(session, &hitResult);

            // Create the ARCore ArPose that tracks the current hit test result
            ArPose_create(session, nullptr, &hitResultPose);

            // Set the texture ID that should be used for the camera frame
            ArSession_setCameraTextureName(session, static_cast<uint32_t>(cameraTextureId));

            // Start the ArSession
            {
                ArStatus status = ArSession_resume(session);
                if (status != ArStatus::AR_SUCCESS)
                {
                    std::ostringstream message;
                    message << "Failed to start ArSession with status: " << status;
                    throw std::runtime_error{ message.str() };
                }
            }

            isInitialized = true;
        }

        std::unique_ptr<Session::Frame> GetNextFrame(bool& shouldEndSession, bool& shouldRestartSession)
        {
            if (!isInitialized)
            {
                Initialize();
            }

            shouldEndSession = sessionEnded;
            shouldRestartSession = false;

            // Update the ArSession to get a new frame
            ArSession_update(session, frame);

            ArCamera* camera{};
            ArFrame_acquireCamera(session, frame, &camera);

            {
                // Get the current pose of the device
                ArCamera_getDisplayOrientedPose(session, camera, cameraPose);

                // The raw pose is exactly 7 floats: 4 for the orientation quaternion, and 3 for the position vector
                float rawPose[7]{};
                ArPose_getPoseRaw(session, cameraPose, rawPose);

                // Set the orientation and position
                ActiveFrameViews[0].Space.Pose.Orientation = {rawPose[0], rawPose[1], rawPose[2], rawPose[3]};
                ActiveFrameViews[0].Space.Pose.Position = {rawPose[4], rawPose[5], rawPose[6]};
            }

            // Get the current surface dimensions
            size_t width{}, height{};
            {
                EGLDisplay display = eglGetCurrentDisplay();
                EGLSurface surface = eglGetCurrentSurface(EGL_DRAW);
                EGLint _width{}, _height{};
                eglQuerySurface(display, surface, EGL_WIDTH, &_width);
                eglQuerySurface(display, surface, EGL_HEIGHT, &_height);
                width = static_cast<size_t>(_width);
                height = static_cast<size_t>(_height);
            }

            // Check whether the dimensions have changed
            if (ActiveFrameViews[0].ColorTextureSize.Width != width || ActiveFrameViews[0].ColorTextureSize.Height != height)
            {
                DestroyDisplayResources();

                int rotation = GetAppContext().getSystemService<android::view::WindowManager>().getDefaultDisplay().getRotation();

                // Update the width and height of the display with ARCore (this is used to adjust the UVs for the camera texture so we can draw a portion of the camera frame that matches the size of the UI element displaying it)
                ArSession_setDisplayGeometry(session, rotation, static_cast<int32_t>(width), static_cast<int32_t>(height));

                // Allocate and store the render texture
                {
                    GLuint colorTextureId{};
                    glGenTextures(1, &colorTextureId);
                    glBindTexture(GL_TEXTURE_2D, colorTextureId);
                    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);
                    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
                    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
                    glBindTexture(GL_TEXTURE_2D, 0);
                    ActiveFrameViews[0].ColorTexturePointer = reinterpret_cast<void *>(colorTextureId);
                    ActiveFrameViews[0].ColorTextureFormat = TextureFormat::RGBA8_SRGB;
                    ActiveFrameViews[0].ColorTextureSize = {width, height};
                }

                // Allocate and store the depth texture
                {
                    GLuint depthTextureId{};
                    glGenTextures(1, &depthTextureId);
                    glBindTexture(GL_TEXTURE_2D, depthTextureId);
                    glTexImage2D(GL_TEXTURE_2D, 0, GL_DEPTH24_STENCIL8_OES, width, height, 0, GL_DEPTH_STENCIL_OES, GL_UNSIGNED_INT_24_8_OES, nullptr);
                    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
                    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
                    glBindTexture(GL_TEXTURE_2D, 0);
                    ActiveFrameViews[0].DepthTexturePointer = reinterpret_cast<void*>(depthTextureId);
                    ActiveFrameViews[0].DepthTextureFormat = TextureFormat::D24S8;
                    ActiveFrameViews[0].DepthTextureSize = {width, height};
                }

                // Bind the color and depth texture to the clear color frame buffer
                auto bindFrameBufferTransaction = GLTransactions::BindFrameBuffer(clearFrameBufferId);
                glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, static_cast<GLuint>(reinterpret_cast<uintptr_t>(ActiveFrameViews[0].ColorTexturePointer)), 0);
                glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, static_cast<GLuint>(reinterpret_cast<uintptr_t>(ActiveFrameViews[0].DepthTexturePointer)), 0);
            }
            else
            {
                // Clear the color and depth texture
                // Whether or not to clear is an implementation detail - OpenXR (for example) provides a color texture that is already filled with the camera texture, so the common XR layer should not assume a clear is required
                auto bindFrameBufferTransaction = GLTransactions::BindFrameBuffer(clearFrameBufferId);
                auto clearColorTransaction = GLTransactions::ClearColor(0, 0, 0, 0);
                glClear(GL_COLOR_BUFFER_BIT);
            }

            int32_t geometryChanged{0};
            ArFrame_getDisplayGeometryChanged(session, frame, &geometryChanged);

            // Check whether the projection matrix needs to be updated
            if (geometryChanged || ActiveFrameViews[0].DepthNearZ != DepthNearZ || ActiveFrameViews[0].DepthFarZ != DepthFarZ)
            {
                // Get the current projection matrix
                glm::mat4 projectionMatrix{};
                ArCamera_getProjectionMatrix(session, camera, ActiveFrameViews[0].DepthNearZ, ActiveFrameViews[0].DepthFarZ, glm::value_ptr(projectionMatrix));

                // Calculate the aspect ratio and field of view
                float a = projectionMatrix[0][0];
                float b = projectionMatrix[1][1];

                float aspectRatio = b / a;
                float fieldOfView = std::atan(1.0f / b);

                // Set the horizontal and vertical field of view
                ActiveFrameViews[0].FieldOfView.AngleDown = -(ActiveFrameViews[0].FieldOfView.AngleUp = fieldOfView);
                ActiveFrameViews[0].FieldOfView.AngleLeft = -(ActiveFrameViews[0].FieldOfView.AngleRight = fieldOfView * aspectRatio);
            }

            ActiveFrameViews[0].DepthNearZ = DepthNearZ;
            ActiveFrameViews[0].DepthFarZ = DepthFarZ;

            if (geometryChanged)
            {
                // Transform the UVs for the vertex positions given the current display size
                ArFrame_transformCoordinates2d(
                    session, frame, AR_COORDINATES_2D_OPENGL_NORMALIZED_DEVICE_COORDINATES,
                    VERTEX_COUNT, VERTEX_POSITIONS, AR_COORDINATES_2D_TEXTURE_NORMALIZED, CameraFrameUVs);
            }

            ArCamera_release(camera);

            return std::make_unique<Session::Frame>(*this);
        }

        void RequestEndSession()
        {
            // Note the end session has been requested, and respond to the request in the next call to GetNextFrame
            sessionEnded = true;
        }

        Size GetWidthAndHeightForViewIndex(size_t /*viewIndex*/) const
        {
            // Return a valid (non-zero) size, but otherwise it doesn't matter as the render texture created from this isn't currently used
            return {1,1};
        }

        void DrawFrame()
        {
            // Suppress rendering if the camera did not produce the first frame yet.
            // This is to avoid drawing possible leftover data from previous sessions if
            // the texture is reused.
            int64_t frameTimestamp{};
            ArFrame_getTimestamp(session, frame, &frameTimestamp);
            if (frameTimestamp)
            {
                auto bindFrameBufferTransaction = GLTransactions::BindFrameBuffer(0);
                auto cullFaceTransaction = GLTransactions::SetCapability(GL_CULL_FACE, false);
                auto depthTestTransaction = GLTransactions::SetCapability(GL_DEPTH_TEST, false);
                auto blendTransaction = GLTransactions::SetCapability(GL_BLEND, false);
                auto depthMaskTransaction = GLTransactions::DepthMask(GL_FALSE);
                auto blendFuncTransaction = GLTransactions::BlendFunc(GL_BLEND_SRC_ALPHA, GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

                glViewport(0, 0, ActiveFrameViews[0].ColorTextureSize.Width, ActiveFrameViews[0].ColorTextureSize.Height);
                glUseProgram(shaderProgramId);

                // Configure the quad vertex positions
                auto vertexPositionsUniformLocation = glGetUniformLocation(shaderProgramId, "vertexPositions");
                glUniform2fv(vertexPositionsUniformLocation, VERTEX_COUNT, VERTEX_POSITIONS);

                // Configure the camera texture
                auto cameraTextureUniformLocation = glGetUniformLocation(shaderProgramId, "cameraTexture");
                glUniform1i(cameraTextureUniformLocation, GetTextureUnit(GL_TEXTURE0));
                glActiveTexture(GL_TEXTURE0);
                glBindTexture(GL_TEXTURE_EXTERNAL_OES, cameraTextureId);

                // Configure the camera frame UVs
                auto cameraFrameUVsUniformLocation = glGetUniformLocation(shaderProgramId, "cameraFrameUVs");
                glUniform2fv(cameraFrameUVsUniformLocation, VERTEX_COUNT, CameraFrameUVs);

                // Configure the babylon render texture
                auto babylonTextureUniformLocation = glGetUniformLocation(shaderProgramId, "babylonTexture");
                glUniform1i(babylonTextureUniformLocation, GetTextureUnit(GL_TEXTURE1));
                glActiveTexture(GL_TEXTURE1);
                auto babylonTextureId = (GLuint)(size_t)ActiveFrameViews[0].ColorTexturePointer;
                glBindTexture(GL_TEXTURE_2D, babylonTextureId);

                // Draw the quad
                glDrawArrays(GL_TRIANGLE_STRIP, 0, VERTEX_COUNT);

                // Present to the screen
                // NOTE: For a yet to be determined reason, bgfx is also doing an eglSwapBuffers when running in the regular Android Babylon Native Playground playground app.
                //       The "double" eglSwapBuffers causes rendering issues, so until we figure out this issue, comment out this line while testing in the regular playground app.
                eglSwapBuffers(eglGetCurrentDisplay(), eglGetCurrentSurface(EGL_DRAW));

                glUseProgram(0);
            }
        }

        void GetHitTestResults(std::vector<Pose>& filteredResults, xr::Ray offsetRay) const
        {
            ArCamera* camera{};
            ArFrame_acquireCamera(session, frame, &camera);

            // Get the tracking state
            ArTrackingState trackingState{};
            ArCamera_getTrackingState(session, camera, &trackingState);

            // If not tracking, back out and return.
            if (trackingState != ArTrackingState::AR_TRACKING_STATE_TRACKING)
            {
                return;
            }

            // Push the camera orientation into a glm quaternion.
            glm::quat cameraOrientationQuaternion
            {
                ActiveFrameViews[0].Space.Pose.Orientation.W,
                ActiveFrameViews[0].Space.Pose.Orientation.X,
                ActiveFrameViews[0].Space.Pose.Orientation.Y,
                ActiveFrameViews[0].Space.Pose.Orientation.Z
            };

            // Pull out the direction from the offset ray into a GLM Vector3.
            glm::vec3 direction{ offsetRay.Direction.X, offsetRay.Direction.Y, offsetRay.Direction.Z };

            // Multiply the camera rotation quaternion by the direction vector to calculate the direction vector in viewer space.
            glm::vec3 cameraOrientedDirection{cameraOrientationQuaternion * glm::normalize(direction)};
            float cameraOrientedDirectionArray[3]{ cameraOrientedDirection.x, cameraOrientedDirection.y, cameraOrientedDirection.z };

            // Convert the origin to camera space by multiplying the origin by the rotation quaternion, then adding that to the
            // position of the camera.
            glm::vec3 offsetOrigin{ offsetRay.Origin.X, offsetRay.Origin.Y, offsetRay.Origin.Z };
            offsetOrigin = cameraOrientationQuaternion * offsetOrigin;

            // Pull out the origin composited from the offsetRay and camera position into a float array.
            float hitTestOrigin[3]
            {
                ActiveFrameViews[0].Space.Pose.Position.X + offsetOrigin.x,
                ActiveFrameViews[0].Space.Pose.Position.Y + offsetOrigin.y,
                ActiveFrameViews[0].Space.Pose.Position.Z + offsetOrigin.z
            };

            // Perform a hit test and process the results.
            ArFrame_hitTestRay(session, frame, hitTestOrigin, cameraOrientedDirectionArray, hitResultList);

            // Iterate over the results and pull out only those that match the desired TrackableType.  For now we are limiting results to
            // just hits against the Plane, and further scoping that to Poses that are contained in the polygon of the detected mesh.
            // This is equivalent to XRHitTestTrackableType.mesh (https://immersive-web.github.io/hit-test/#hit-test-trackable-type-enum).
            int32_t size{};
            ArHitResultList_getSize(session, hitResultList, &size);
            for (int i = 0; i < size; i++)
            {
                ArTrackableType trackableType{};
                ArTrackable* trackable;

                ArHitResultList_getItem(session, hitResultList, i, hitResult);
                ArHitResult_acquireTrackable(session, hitResult, &trackable);
                ArTrackable_getType(session, trackable, &trackableType);
                if (trackableType == AR_TRACKABLE_PLANE)
                {
                    int32_t isPoseInPolygon{};
                    ArHitResult_getHitPose(session, hitResult, hitResultPose);
                    ArPlane_isPoseInPolygon(session, (ArPlane*) trackable, hitResultPose, &isPoseInPolygon);

                    if (isPoseInPolygon != 0)
                    {
                        float rawPose[7]{};
                        ArPose_getPoseRaw(session, hitResultPose, rawPose);
                        Pose pose{};
                        pose.Orientation.X = rawPose[0];
                        pose.Orientation.Y = rawPose[1];
                        pose.Orientation.Z = rawPose[2];
                        pose.Orientation.W = rawPose[3];
                        pose.Position.X = rawPose[4];
                        pose.Position.Y = rawPose[5];
                        pose.Position.Z = rawPose[6];

                        filteredResults.push_back(pose);
                    }
                }

                ArTrackable_release(trackable);
            }
        }

    private:
        bool isInitialized{false};
        bool sessionEnded{false};

        GLuint shaderProgramId{};
        GLuint cameraTextureId{};
        GLuint clearFrameBufferId{};

        ArSession* session{};
        ArFrame* frame{};
        ArPose* cameraPose{};
        ArPose* hitResultPose{};
        ArHitResultList* hitResultList{};
        ArHitResult* hitResult{};

        float CameraFrameUVs[VERTEX_COUNT * 2]{};

        AppStateChangedCallbackTicket pauseTicket;
        AppStateChangedCallbackTicket resumeTicket;

        void PauseSession()
        {
            if (session)
            {
                ArSession_pause(session);
            }
        }

        void ResumeSession()
        {
            if (session)
            {
                ArSession_resume(session);
            }
        }

        void DestroyDisplayResources()
        {
            if (ActiveFrameViews[0].ColorTexturePointer)
            {
                auto colorTextureId = static_cast<GLuint>(reinterpret_cast<uintptr_t>(ActiveFrameViews[0].ColorTexturePointer));
                glDeleteTextures(1, &colorTextureId);
            }

            if (ActiveFrameViews[0].DepthTexturePointer)
            {
                auto depthTextureId = static_cast<GLuint>(reinterpret_cast<uintptr_t>(ActiveFrameViews[0].DepthTexturePointer));
                glDeleteTextures(1, &depthTextureId);
            }

            ActiveFrameViews[0] = {};
        }
    };

    struct System::Session::Frame::Impl
    {
        Impl(Session::Impl& sessionImpl)
            : sessionImpl{sessionImpl}
        {
        }

        Session::Impl& sessionImpl;
    };

    System::Session::Frame::Frame(Session::Impl& sessionImpl)
        : Views{ sessionImpl.ActiveFrameViews }
        , InputSources{ sessionImpl.InputSources}
        , m_impl{ std::make_unique<Session::Frame::Impl>(sessionImpl) }
    {
    }

    void System::Session::Frame::GetHitTestResults(std::vector<Pose>& filteredResults, xr::Ray offsetRay) const
    {
        m_impl->sessionImpl.GetHitTestResults(filteredResults, offsetRay);
    }

    System::Session::Frame::~Frame()
    {
        m_impl->sessionImpl.DrawFrame();
    }

    System::System(const char* appName)
        : m_impl{ std::make_unique<System::Impl>(appName) }
    {}

    System::~System() {}

    bool System::IsInitialized() const
    {
        return m_impl->IsInitialized();
    }

    bool System::TryInitialize()
    {
        return m_impl->TryInitialize();
    }

    arcana::task<bool, std::exception_ptr> System::IsSessionSupportedAsync(SessionType sessionType)
    {
        // Currently only AR is supported on Android
        if (sessionType == SessionType::IMMERSIVE_AR)
        {
            // Spin up a background thread to own the polling check.
            arcana::task_completion_source<bool, std::exception_ptr> tcs;
            std::thread([tcs]() mutable
            {
                // Query ARCore to check if AR sessions are supported.
                // If not yet installed then poll supported status up to 100 times over 20 seconds.
                for (int i = 0; i < 100; i++)
                {
                    ArAvailability arAvailability{};
                    ArCoreApk_checkAvailability(GetEnvForCurrentThread(), GetAppContext(), &arAvailability);
                    switch (arAvailability)
                    {
                        case AR_AVAILABILITY_SUPPORTED_APK_TOO_OLD:
                        case AR_AVAILABILITY_SUPPORTED_INSTALLED:
                        case AR_AVAILABILITY_SUPPORTED_NOT_INSTALLED:
                            tcs.complete(true);
                            break;
                        case AR_AVAILABILITY_UNKNOWN_CHECKING:
                            std::this_thread::sleep_for(std::chrono::milliseconds(200));
                            break;
                        default:
                            tcs.complete(false);
                            break;
                    }

                    if (tcs.completed())
                    {
                        break;
                    }
                }

                if (!tcs.completed())
                {
                    tcs.complete(false);
                }
            }).detach();

            return tcs.as_task();
        }

        // VR and inline sessions are not supported at this time.
        return arcana::task_from_result<std::exception_ptr>(false);
    }

    arcana::task<std::shared_ptr<System::Session>, std::exception_ptr> System::Session::CreateAsync(System& system, void* graphicsDevice)
    {
        // First perform the ARCore installation check, request install if not yet installed.
        return CheckAndInstallARCoreAsync().then(arcana::inline_scheduler, arcana::cancellation::none(), []()
        {
            // Next check for camera permissions, and request if not already granted.
            return CheckCameraPermissionAsync();
        }).then(arcana::inline_scheduler, arcana::cancellation::none(), [&system, graphicsDevice]()
        {
            // Finally if the previous two tasks succeed, start the AR session.
            return std::make_shared<System::Session>(system, graphicsDevice);
        });
    }

    System::Session::Session(System& system, void* graphicsDevice)
        : m_impl{ std::make_unique<System::Session::Impl>(*system.m_impl, graphicsDevice) }
    {}

    System::Session::~Session()
    {
    }

    std::unique_ptr<System::Session::Frame> System::Session::GetNextFrame(bool& shouldEndSession, bool& shouldRestartSession)
    {
        return m_impl->GetNextFrame(shouldEndSession, shouldRestartSession);
    }

    void System::Session::RequestEndSession()
    {
        m_impl->RequestEndSession();
    }

    Size System::Session::GetWidthAndHeightForViewIndex(size_t viewIndex) const
    {
        return m_impl->GetWidthAndHeightForViewIndex(viewIndex);
    }

    void System::Session::SetDepthsNearFar(float depthNear, float depthFar)
    {
        m_impl->DepthNearZ = depthNear;
        m_impl->DepthFarZ = depthFar;
    }
}
