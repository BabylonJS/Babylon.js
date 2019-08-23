// App.cpp : Defines the entry point for the application.
//

#include "App.h"
#include <Windows.h>
#include <Windowsx.h>
#include <Shlwapi.h>
#include <filesystem>

#include <Shared/InputManager.h>
#include <Babylon/RuntimeWin32.h>

#define MAX_LOADSTRING 100

// Global Variables:
HINSTANCE hInst;                                // current instance
WCHAR szTitle[MAX_LOADSTRING];                  // The title bar text
WCHAR szWindowClass[MAX_LOADSTRING];            // the main window class name
std::unique_ptr<babylon::RuntimeWin32> runtime{};
std::unique_ptr<InputManager::InputBuffer> inputBuffer{};

// Forward declarations of functions included in this code module:
ATOM                MyRegisterClass(HINSTANCE hInstance);
BOOL                InitInstance(HINSTANCE, int);
LRESULT CALLBACK    WndProc(HWND, UINT, WPARAM, LPARAM);
INT_PTR CALLBACK    About(HWND, UINT, WPARAM, LPARAM);

namespace
{
    std::filesystem::path GetModulePath()
    {
        char buffer[1024];
        ::GetModuleFileNameA(nullptr, buffer, ARRAYSIZE(buffer));
        return std::filesystem::path{ buffer };
    }

    std::string GetUrlFromPath(const std::filesystem::path& path)
    {
        char url[1024];
        DWORD length = ARRAYSIZE(url);
        HRESULT hr = UrlCreateFromPathA(path.u8string().data(), url, &length, 0);
        if (FAILED(hr))
        {
            throw std::exception("Failed to create url from path", hr);
        }

        return { url };
    }

    std::vector<std::string> GetCommandLineArguments()
    {
        int argc;
        auto argv = CommandLineToArgvW(GetCommandLineW(), &argc);

        std::vector<std::string> arguments{};
        arguments.reserve(argc);

        for (int idx = 1; idx < argc; idx++)
        {
            std::wstring hstr{ argv[idx] };
            int bytesRequired = ::WideCharToMultiByte(CP_UTF8, 0, &hstr[0], static_cast<int>(hstr.size()), nullptr, 0, nullptr, nullptr);
            arguments.push_back(std::string(bytesRequired, 0));
            ::WideCharToMultiByte(CP_UTF8, 0, hstr.data(), static_cast<int>(hstr.size()), arguments.back().data(), bytesRequired, nullptr, nullptr);
        }

        LocalFree(argv);

        return arguments;
    }

    void RefreshBabylon(HWND hWnd)
    {
        std::string rootUrl{ GetUrlFromPath(GetModulePath().parent_path().parent_path()) };
        runtime = std::make_unique<babylon::RuntimeWin32>(hWnd, rootUrl);

        inputBuffer = std::make_unique<InputManager::InputBuffer>(*runtime);
        InputManager::Initialize(*runtime, *inputBuffer);

        runtime->LoadScript("Scripts/babylon.max.js");
        runtime->LoadScript("Scripts/babylon.glTF2FileLoader.js");

        auto scripts = GetCommandLineArguments();
        if (scripts.size() == 0)
        {
            runtime->LoadScript("Scripts/experience.js");
        }
        else
        {
            for (const auto& script : scripts)
            {
                runtime->LoadScript(script);
            }

            runtime->LoadScript("Scripts/playground_runner.js");
        }
    }
}

static void DebugString(const char *message)
{
    OutputDebugStringA(message);
}

int APIENTRY wWinMain(_In_ HINSTANCE hInstance,
                     _In_opt_ HINSTANCE hPrevInstance,
                     _In_ LPWSTR    lpCmdLine,
                     _In_ int       nCmdShow)
{
    UNREFERENCED_PARAMETER(hPrevInstance);
    UNREFERENCED_PARAMETER(lpCmdLine);

    // TODO: Place code here.

    // register console outputs
    babylon::Runtime::RegisterLogOutput(DebugString);
    babylon::Runtime::RegisterWarnOutput(DebugString);
    babylon::Runtime::RegisterErrorOutput(DebugString);

    // Initialize global strings
    LoadStringW(hInstance, IDS_APP_TITLE, szTitle, MAX_LOADSTRING);
    LoadStringW(hInstance, IDC_TESTAPPWIN32, szWindowClass, MAX_LOADSTRING);
    MyRegisterClass(hInstance);

    // Perform application initialization:
    if (!InitInstance (hInstance, nCmdShow))
    {
        return FALSE;
    }

    HACCEL hAccelTable = LoadAccelerators(hInstance, MAKEINTRESOURCE(IDC_TESTAPPWIN32));

    MSG msg;

    // Main message loop:
    while (GetMessage(&msg, nullptr, 0, 0))
    {
        if (!TranslateAccelerator(msg.hwnd, hAccelTable, &msg))
        {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
    }

    return (int) msg.wParam;
}

//
//  FUNCTION: MyRegisterClass()
//
//  PURPOSE: Registers the window class.
//
ATOM MyRegisterClass(HINSTANCE hInstance)
{
    WNDCLASSEXW wcex;

    wcex.cbSize = sizeof(WNDCLASSEX);

    wcex.style          = CS_HREDRAW | CS_VREDRAW;
    wcex.lpfnWndProc    = WndProc;
    wcex.cbClsExtra     = 0;
    wcex.cbWndExtra     = 0;
    wcex.hInstance      = hInstance;
    wcex.hIcon          = LoadIcon(hInstance, MAKEINTRESOURCE(IDI_TESTAPPWIN32));
    wcex.hCursor        = LoadCursor(nullptr, IDC_ARROW);
    wcex.hbrBackground  = (HBRUSH)(COLOR_WINDOW+1);
    wcex.lpszMenuName   = MAKEINTRESOURCEW(IDC_TESTAPPWIN32);
    wcex.lpszClassName  = szWindowClass;
    wcex.hIconSm        = LoadIcon(wcex.hInstance, MAKEINTRESOURCE(IDI_SMALL));

    return RegisterClassExW(&wcex);
}

//
//   FUNCTION: InitInstance(HINSTANCE, int)
//
//   PURPOSE: Saves instance handle and creates main window
//
//   COMMENTS:
//
//        In this function, we save the instance handle in a global variable and
//        create and display the main program window.
//
BOOL InitInstance(HINSTANCE hInstance, int nCmdShow)
{
   hInst = hInstance; // Store instance handle in our global variable

   HWND hWnd = CreateWindowW(szWindowClass, szTitle, WS_OVERLAPPEDWINDOW,
      CW_USEDEFAULT, 0, CW_USEDEFAULT, 0, nullptr, nullptr, hInstance, nullptr);

   if (!hWnd)
   {
      return FALSE;
   }

   ShowWindow(hWnd, nCmdShow);
   UpdateWindow(hWnd);

   RefreshBabylon(hWnd);

   return TRUE;
}

//
//  FUNCTION: WndProc(HWND, UINT, WPARAM, LPARAM)
//
//  PURPOSE: Processes messages for the main window.
//
//  WM_COMMAND  - process the application menu
//  WM_PAINT    - Paint the main window
//  WM_DESTROY  - post a quit message and return
//
//
LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam)
{
    switch (message)
    {
        case WM_SYSCOMMAND:
        {
            if ((wParam & 0xFFF0) == SC_MINIMIZE) 
            {
                runtime->Suspend();
            }
            else if ((wParam & 0xFFF0) == SC_RESTORE)
            {
                runtime->Resume();
            }
            DefWindowProc(hWnd, message, wParam, lParam);
            break;
        }
        case WM_COMMAND:
        {
            int wmId = LOWORD(wParam);
            // Parse the menu selections:
            switch (wmId)
            {
            case IDM_ABOUT:
                DialogBox(hInst, MAKEINTRESOURCE(IDD_ABOUTBOX), hWnd, About);
                break;
            case IDM_EXIT:
                DestroyWindow(hWnd);
                break;
            default:
                return DefWindowProc(hWnd, message, wParam, lParam);
            }
            break;
        }
        case WM_PAINT:
        {
            PAINTSTRUCT ps;
            BeginPaint(hWnd, &ps);
            EndPaint(hWnd, &ps);
            break;
        }
        case WM_SIZE:
        {
            if (runtime != nullptr) {
                float width = static_cast<float>(LOWORD(lParam));
                float height = static_cast<float>(HIWORD(lParam));
                runtime->UpdateSize(width, height);
            }
            break;
        }
        case WM_DESTROY:
        {
            inputBuffer.reset();
            runtime.reset();
            PostQuitMessage(0);
            break;
        }
        case WM_KEYDOWN:
        {
            if (wParam == 'R')
            {
                RefreshBabylon(hWnd);
            }
            break;
        }
        case WM_MOUSEMOVE:
        {
            inputBuffer->SetPointerPosition(GET_X_LPARAM(lParam), GET_Y_LPARAM(lParam));
            break;
        }
        case WM_LBUTTONDOWN:
        {
            SetCapture(hWnd);
            inputBuffer->SetPointerDown(true);
            break;
        }
        case WM_LBUTTONUP:
        {
            inputBuffer->SetPointerDown(false);
            ReleaseCapture();
            break;
        }
        default:
        {
            return DefWindowProc(hWnd, message, wParam, lParam);
        }
    }
    return 0;
}

// Message handler for about box.
INT_PTR CALLBACK About(HWND hDlg, UINT message, WPARAM wParam, LPARAM lParam)
{
    UNREFERENCED_PARAMETER(lParam);
    switch (message)
    {
    case WM_INITDIALOG:
        return (INT_PTR)TRUE;

    case WM_COMMAND:
        if (LOWORD(wParam) == IDOK || LOWORD(wParam) == IDCANCEL)
        {
            EndDialog(hDlg, LOWORD(wParam));
            return (INT_PTR)TRUE;
        }
        break;
    }
    return (INT_PTR)FALSE;
}
