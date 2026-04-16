; AutoHotkey v2 script for testing camera inertia at different framerates.
; 
; USAGE:
;   1. Open the Babylon.js playground with the test scene loaded
;   2. Run this script: autohotkey camera-test.ahk
;   3. Click inside the playground canvas to focus it
;   4. Press F5 to start the test — it holds W for exactly 2 seconds, then releases
;   5. Observe the camera coast (inertia). Note final position from the GUI overlay.
;   6. Reset camera (switch camera type back and forth in the GUI)
;   7. Toggle FPS throttle in the playground GUI (e.g. 60 → 30)
;   8. Press F5 again — same 2-second W hold
;   9. Compare final positions between framerates
;
; HOTKEYS:
;   F5  = Hold W for 2 seconds then release (translation test)
;   F6  = Hold right-click + drag mouse 300px right over 1 second (rotation test)
;   F7  = Hold right-click + drag mouse 200px down over 1 second (ArcRotate beta test)
;   F8  = Scroll wheel down 5 clicks (zoom test for ArcRotateCamera)
;   Esc = Exit this script
;

#Requires AutoHotkey v2.0
#SingleInstance Force

; --- F5: Translation test (Right arrow held for 2 seconds) ---
F5:: {
    ToolTip("Holding Right arrow for 0.5 seconds...")
    Send("{Right down}")
    Sleep(500)
    Send("{Right up}")
    ToolTip("Released Right — watch inertia coast")
    Sleep(2000)
    ToolTip()
}

; --- F6: Rotation test (right-click drag 300px right over 1 second) ---
F6:: {
    ToolTip("Right-click dragging right 300px over 1s...")
    MouseGetPos(&startX, &startY)
    
    ; Right mouse down
    Click("Right Down")
    Sleep(50)
    
    ; Move 300px right in 30 steps over ~1 second
    steps := 30
    pxPerStep := 10  ; 30 * 10 = 300px total
    Loop steps {
        MouseMove(pxPerStep, 0, 0, "R")  ; relative move
        Sleep(33)  ; ~30fps step rate
    }
    
    ; Right mouse up
    Click("Right Up")
    ToolTip("Released — watch rotation inertia")
    Sleep(2000)
    ToolTip()
    
    ; Move mouse back to start
    MouseMove(startX, startY)
}

; --- F7: Vertical drag test (right-click drag 200px down over 1 second) ---
F7:: {
    ToolTip("Right-click dragging down 200px over 1s...")
    MouseGetPos(&startX, &startY)
    
    Click("Right Down")
    Sleep(50)
    
    steps := 30
    pxPerStep := 7  ; ~210px total
    Loop steps {
        MouseMove(0, pxPerStep, 0, "R")
        Sleep(33)
    }
    
    Click("Right Up")
    ToolTip("Released — watch beta inertia")
    Sleep(2000)
    ToolTip()
    
    MouseMove(startX, startY)
}

; --- F8: Zoom test (5 scroll wheel clicks down) ---
F8:: {
    ToolTip("Scrolling down 5 clicks...")
    Loop 5 {
        Click("WheelDown")
        Sleep(200)
    }
    ToolTip("Done — watch zoom inertia")
    Sleep(2000)
    ToolTip()
}

; --- Esc: Exit script ---
Esc:: ExitApp()
