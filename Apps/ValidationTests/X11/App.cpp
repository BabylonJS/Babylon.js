#define XK_MISCELLANY
#define XK_LATIN1
#include <X11/keysymdef.h>
#include <X11/Xlib.h> // will include X11 which #defines None... Don't mess with order of includes.
#include <X11/Xutil.h>
#include <unistd.h> // syscall
#undef None
#include <filesystem>

#include <Shared/TestUtils.h>

#include <Babylon/AppRuntime.h>
#include <Babylon/ScriptLoader.h>
#include <Babylon/Plugins/NativeEngine.h>
#include <Babylon/Plugins/NativeWindow.h>
#include <Babylon/Polyfills/Console.h>
#include <Babylon/Polyfills/Window.h>
#include <Babylon/Polyfills/XMLHttpRequest.h>

static const char* s_applicationName  = "BabylonNative Validation Tests";
static const char* s_applicationClass = "Validation Tests";

std::unique_ptr<Babylon::AppRuntime> runtime{};

static const int width = 600;
static const int height = 400;

namespace
{
    std::filesystem::path GetModulePath()
    {
        char exe[1024];

        int ret = readlink("/proc/self/exe", exe, sizeof(exe)-1);
        if(ret == -1)
        {
            exit(1);
        }
        exe[ret] = 0;
        return std::filesystem::path{exe};
    }

    std::string GetUrlFromPath(const std::filesystem::path path)
    {
        return std::string("file://") + path.generic_string();
    }
    
    void InitBabylon(int32_t window)
    {
        std::string moduleRootUrl = GetUrlFromPath(GetModulePath().parent_path());

        // Separately call reset and make_unique to ensure prior runtime is destroyed before new one is created.
        runtime.reset();
        runtime = std::make_unique<Babylon::AppRuntime>();

        // Initialize console plugin.
        runtime->Dispatch([window](Napi::Env env) {
            Babylon::Polyfills::Console::Initialize(env, [](const char* message, auto) {
                printf("%s", message);
            });

            Babylon::TestUtils::CreateInstance(env, (void*)(uintptr_t)window);

            Babylon::Polyfills::Window::Initialize(env);
            Babylon::Polyfills::XMLHttpRequest::Initialize(env);

            // Initialize NativeWindow plugin.
            Babylon::Plugins::NativeWindow::Initialize(env, (void*)(uintptr_t)window, width, height);

            // Initialize NativeEngine plugin.
            Babylon::Plugins::NativeEngine::InitializeGraphics((void*)(uintptr_t)window, width, height);
            Babylon::Plugins::NativeEngine::Initialize(env);
        });


        Babylon::ScriptLoader loader{*runtime};
        loader.Eval("document = {}", "");
        loader.LoadScript(moduleRootUrl + "/Scripts/babylon.max.js");
        loader.LoadScript(moduleRootUrl + "/Scripts/babylon.glTF2FileLoader.js");
        loader.LoadScript(moduleRootUrl + "/Scripts/babylonjs.materials.js");
        loader.LoadScript(moduleRootUrl + "/Scripts/validation_native.js");
    }

    void UpdateWindowSize(float width, float height)
    {
        runtime->Dispatch([width, height](Napi::Env env) {
            Babylon::Plugins::NativeWindow::UpdateSize(env, width, height);
        });
    }
}

int main(int /*_argc*/, const char* const* /*_argv*/)
{
    XInitThreads();
    Display* display = XOpenDisplay(NULL);

    int32_t screen = DefaultScreen(display);
    int32_t depth  = DefaultDepth(display, screen);
    Visual* visual = DefaultVisual(display, screen);
    Window root   = RootWindow(display, screen);

    XSetWindowAttributes windowAttrs;
    windowAttrs.background_pixel = 0;
    windowAttrs.background_pixmap = 0;
    windowAttrs.border_pixel = 0;
    windowAttrs.event_mask = 0
            | ButtonPressMask
            | ButtonReleaseMask
            | ExposureMask
            | KeyPressMask
            | KeyReleaseMask
            | PointerMotionMask
            | StructureNotifyMask
            ;

    Window window = XCreateWindow(display
                            , root
                            , 0, 0
                            , width, height, 0
                            , depth
                            , InputOutput
                            , visual
                            , CWBorderPixel|CWEventMask
                            , &windowAttrs
                            );

    // Clear window to black.
    XSetWindowAttributes attr;
    memset(&attr, 0, sizeof(attr) );
    XChangeWindowAttributes(display, window, CWBackPixel, &attr);

    const char* wmDeleteWindowName = "WM_DELETE_WINDOW";
    Atom wmDeleteWindow;
    XInternAtoms(display, (char **)&wmDeleteWindowName, 1, False, &wmDeleteWindow);
    XSetWMProtocols(display, window, &wmDeleteWindow, 1);

    XMapWindow(display, window);
    XStoreName(display, window, s_applicationName);

    XClassHint* hint = XAllocClassHint();
    hint->res_name  = const_cast<char*>(s_applicationName);
    hint->res_class = const_cast<char*>(s_applicationClass);
    XSetClassHint(display, window, hint);
    XFree(hint);

    XIM im = XOpenIM(display, NULL, NULL, NULL);

    XIC ic = XCreateIC(im
            , XNInputStyle
            , 0
            | XIMPreeditNothing
            | XIMStatusNothing
            , XNClientWindow
            , window
            , NULL
            );

    InitBabylon(window);
    UpdateWindowSize(width, height);

    
    while (!doExit)
    {
        XEvent event;
        XNextEvent(display, &event);
        switch (event.type)
        {
            case Expose:
                break;
            case ClientMessage:
                if ( (Atom)event.xclient.data.l[0] == wmDeleteWindow)
                {
                    doExit = true;
                }
                break;
            case ConfigureNotify:
                {
                    const XConfigureEvent& xev = event.xconfigure;
                    UpdateWindowSize(xev.width, xev.height);
                }
                break;
        }
    }
    XDestroyIC(ic);
    XCloseIM(im);

    XUnmapWindow(display, window);
    XDestroyWindow(display, window);
    return errorCode;
}
