/**
 * GUI MCP Server – Example GUI Generation Tests
 *
 * Creates 5 example GUI layouts using the GuiManager API,
 * exports them to JSON, validates the output, and writes them to the
 * examples/ directory.
 */

import * as fs from "fs";
import * as path from "path";
import { GuiManager } from "../../src/guiManager";

const EXAMPLES_DIR = path.resolve(__dirname, "../../examples");

function writeExample(name: string, json: string): void {
    fs.mkdirSync(EXAMPLES_DIR, { recursive: true });
    const filePath = path.join(EXAMPLES_DIR, `${name}.json`);
    fs.writeFileSync(filePath, json, "utf-8");
}

function getCtrlName(result: ReturnType<GuiManager["addControl"]>): string {
    if (typeof result === "string") {
        throw new Error(result);
    }
    return result.name;
}

describe("GUI MCP Server – Example GUI Generation", () => {
    // ── Example 1: Game HUD ─────────────────────────────────────────────

    it("Example: Game HUD with health bar, score, and minimap frame", () => {
        const mgr = new GuiManager();
        mgr.createTexture("gameHud");

        // Top bar with score
        getCtrlName(
            mgr.addControl("gameHud", "Rectangle", "topBar", "root", {
                width: "1",
                height: "60px",
                verticalAlignment: 0, // Top
                background: "rgba(0,0,0,0.6)",
                thickness: 0,
            })
        );

        getCtrlName(
            mgr.addControl("gameHud", "StackPanel", "topStack", "topBar", {
                isVertical: false,
                width: "1",
                height: "1",
            })
        );

        getCtrlName(
            mgr.addControl("gameHud", "TextBlock", "scoreLabel", "topStack", {
                text: "Score: 12500",
                color: "gold",
                fontSize: "28px",
                width: "200px",
            })
        );

        getCtrlName(
            mgr.addControl("gameHud", "TextBlock", "levelLabel", "topStack", {
                text: "Level 7",
                color: "white",
                fontSize: "22px",
                width: "100px",
            })
        );

        // Health bar at bottom-left
        getCtrlName(
            mgr.addControl("gameHud", "Rectangle", "healthFrame", "root", {
                width: "300px",
                height: "30px",
                left: "20px",
                top: "-20px",
                verticalAlignment: 1, // Bottom
                horizontalAlignment: 0, // Left
                background: "#333",
                cornerRadius: 5,
            })
        );

        getCtrlName(
            mgr.addControl("gameHud", "Rectangle", "healthFill", "healthFrame", {
                width: "0.75",
                height: "1",
                horizontalAlignment: 0, // Left
                background: "linear-gradient(#4CAF50, #66BB6A)",
                thickness: 0,
            })
        );

        getCtrlName(
            mgr.addControl("gameHud", "TextBlock", "healthText", "healthFrame", {
                text: "75/100",
                color: "white",
                fontSize: "14px",
            })
        );

        // Minimap frame bottom-right
        getCtrlName(
            mgr.addControl("gameHud", "Rectangle", "minimapFrame", "root", {
                width: "200px",
                height: "200px",
                left: "-20px",
                top: "-20px",
                verticalAlignment: 1, // Bottom
                horizontalAlignment: 1, // Right
                background: "rgba(0,0,0,0.5)",
                thickness: 2,
                color: "#888",
            })
        );

        const json = mgr.exportJSON("gameHud")!;
        const parsed = JSON.parse(json);
        expect(parsed.root.children.length).toBe(3);

        const issues = mgr.validateTexture("gameHud");
        expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

        writeExample("GameHUD", json);
    });

    // ── Example 2: Settings Menu ────────────────────────────────────────

    it("Example: Settings Menu with sliders, checkboxes, and buttons", () => {
        const mgr = new GuiManager();
        mgr.createTexture("settings");

        // Overlay background
        getCtrlName(
            mgr.addControl("settings", "Rectangle", "overlay", "root", {
                width: "1",
                height: "1",
                background: "rgba(0,0,0,0.7)",
                thickness: 0,
            })
        );

        // Dialog panel
        getCtrlName(
            mgr.addControl("settings", "Rectangle", "dialog", "overlay", {
                width: "500px",
                height: "600px",
                background: "#2D2D2D",
                cornerRadius: 15,
                thickness: 2,
                color: "#555",
            })
        );

        // Title
        getCtrlName(
            mgr.addControl("settings", "TextBlock", "title", "dialog", {
                text: "⚙ Settings",
                color: "white",
                fontSize: "24px",
                top: "-240px",
            })
        );

        // Content stack
        getCtrlName(
            mgr.addControl("settings", "StackPanel", "options", "dialog", {
                isVertical: true,
                width: "400px",
                top: "-100px",
            })
        );

        // Volume
        getCtrlName(
            mgr.addControl("settings", "TextBlock", "volLabel", "options", {
                text: "Volume",
                color: "#BBB",
                fontSize: "16px",
                height: "30px",
            })
        );
        getCtrlName(
            mgr.addControl("settings", "Slider", "volSlider", "options", {
                minimum: 0,
                maximum: 100,
                value: 75,
                step: 5,
                height: "30px",
                color: "#4CAF50",
            })
        );

        // Brightness
        getCtrlName(
            mgr.addControl("settings", "TextBlock", "brightLabel", "options", {
                text: "Brightness",
                color: "#BBB",
                fontSize: "16px",
                height: "30px",
            })
        );
        getCtrlName(
            mgr.addControl("settings", "Slider", "brightSlider", "options", {
                minimum: 0,
                maximum: 100,
                value: 50,
                height: "30px",
                color: "#2196F3",
            })
        );

        // Fullscreen checkbox
        getCtrlName(
            mgr.addControl("settings", "StackPanel", "fsRow", "options", {
                isVertical: false,
                height: "30px",
            })
        );
        getCtrlName(
            mgr.addControl("settings", "Checkbox", "fsCb", "fsRow", {
                isChecked: false,
                width: "20px",
                height: "20px",
                color: "#4CAF50",
            })
        );
        getCtrlName(
            mgr.addControl("settings", "TextBlock", "fsLabel", "fsRow", {
                text: "Fullscreen",
                color: "white",
                fontSize: "16px",
                width: "150px",
            })
        );

        // Buttons row
        getCtrlName(
            mgr.addControl("settings", "StackPanel", "btnRow", "dialog", {
                isVertical: false,
                top: "240px",
                height: "50px",
            })
        );
        getCtrlName(
            mgr.addControl("settings", "Button", "applyBtn", "btnRow", {
                buttonText: "Apply",
                width: "120px",
                height: "40px",
                background: "#4CAF50",
                color: "white",
            })
        );
        getCtrlName(
            mgr.addControl("settings", "Button", "cancelBtn", "btnRow", {
                buttonText: "Cancel",
                width: "120px",
                height: "40px",
                background: "#666",
                color: "white",
            })
        );

        const json = mgr.exportJSON("settings")!;
        const parsed = JSON.parse(json);
        expect(parsed.root.children.length).toBe(1); // overlay
        expect(parsed.root.children[0].children.length).toBe(1); // dialog
        const dialog = parsed.root.children[0].children[0];
        expect(dialog.children.length).toBe(3); // title, options, btnRow

        const issues = mgr.validateTexture("settings");
        expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

        writeExample("SettingsPanel", json);
    });

    // ── Example 3: Grid-based Dashboard ─────────────────────────────────

    it("Example: Grid-based Dashboard with metrics cards", () => {
        const mgr = new GuiManager();
        mgr.createTexture("dashboard");

        // 3x2 grid
        getCtrlName(mgr.addControl("dashboard", "Grid", "mainGrid"));
        mgr.addGridRow("dashboard", "mainGrid", 60, true); // Header
        mgr.addGridRow("dashboard", "mainGrid", 0.5, false); // Row 1
        mgr.addGridRow("dashboard", "mainGrid", 0.5, false); // Row 2
        mgr.addGridColumn("dashboard", "mainGrid", 0.5, false);
        mgr.addGridColumn("dashboard", "mainGrid", 0.5, false);

        // Header bar
        getCtrlName(
            mgr.addControl(
                "dashboard",
                "Rectangle",
                "header",
                "mainGrid",
                {
                    background: "#1976D2",
                    thickness: 0,
                },
                0,
                0
            )
        );
        getCtrlName(
            mgr.addControl("dashboard", "TextBlock", "headerText", "header", {
                text: "📊 Dashboard",
                color: "white",
                fontSize: "24px",
            })
        );

        // Metric cards (4 quadrants)
        const metrics = [
            { name: "users", label: "Active Users", value: "1,234", bg: "#E91E63", row: 1, col: 0 },
            { name: "orders", label: "Orders Today", value: "567", bg: "#FF9800", row: 1, col: 1 },
            { name: "revenue", label: "Revenue", value: "$12,345", bg: "#4CAF50", row: 2, col: 0 },
            { name: "errors", label: "Error Rate", value: "0.2%", bg: "#9C27B0", row: 2, col: 1 },
        ];

        for (const m of metrics) {
            getCtrlName(
                mgr.addControl(
                    "dashboard",
                    "Rectangle",
                    `${m.name}Card`,
                    "mainGrid",
                    {
                        background: m.bg,
                        cornerRadius: 10,
                        thickness: 0,
                        width: "0.9",
                        height: "0.85",
                    },
                    m.row,
                    m.col
                )
            );

            getCtrlName(
                mgr.addControl("dashboard", "StackPanel", `${m.name}Stack`, `${m.name}Card`, {
                    isVertical: true,
                })
            );

            getCtrlName(
                mgr.addControl("dashboard", "TextBlock", `${m.name}Value`, `${m.name}Stack`, {
                    text: m.value,
                    color: "white",
                    fontSize: "36px",
                    height: "50px",
                })
            );

            getCtrlName(
                mgr.addControl("dashboard", "TextBlock", `${m.name}Label`, `${m.name}Stack`, {
                    text: m.label,
                    color: "rgba(255,255,255,0.8)",
                    fontSize: "16px",
                    height: "25px",
                })
            );
        }

        const json = mgr.exportJSON("dashboard")!;
        const parsed = JSON.parse(json);
        const grid = parsed.root.children[0];
        expect(grid.rows.length).toBe(3);
        expect(grid.columns.length).toBe(2);
        // header + 4 metric cards
        expect(grid.children.length).toBe(5);

        const issues = mgr.validateTexture("dashboard");
        expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

        writeExample("GridDashboard", json);
    });

    // ── Example 4: Login Form ───────────────────────────────────────────

    it("Example: Login Form with inputs and validation", () => {
        const mgr = new GuiManager();
        mgr.createTexture("loginForm");

        // Background
        getCtrlName(
            mgr.addControl("loginForm", "Rectangle", "bg", "root", {
                width: "1",
                height: "1",
                background: "#1A1A2E",
                thickness: 0,
            })
        );

        // Form card
        getCtrlName(
            mgr.addControl("loginForm", "Rectangle", "card", "bg", {
                width: "400px",
                height: "450px",
                background: "#16213E",
                cornerRadius: 20,
                thickness: 1,
                color: "#333",
            })
        );

        getCtrlName(
            mgr.addControl("loginForm", "StackPanel", "formStack", "card", {
                isVertical: true,
                width: "320px",
            })
        );

        // Logo/title
        getCtrlName(
            mgr.addControl("loginForm", "TextBlock", "logo", "formStack", {
                text: "🔐 Welcome Back",
                color: "#E94560",
                fontSize: "28px",
                height: "60px",
            })
        );

        // Username
        getCtrlName(
            mgr.addControl("loginForm", "TextBlock", "userLabel", "formStack", {
                text: "Username",
                color: "#AAA",
                fontSize: "14px",
                height: "25px",
                horizontalAlignment: 0,
            })
        );
        getCtrlName(
            mgr.addControl("loginForm", "InputText", "userInput", "formStack", {
                placeholderText: "Enter username...",
                placeholderColor: "#555",
                color: "white",
                background: "#0F3460",
                height: "40px",
                width: "1",
            })
        );

        // Password
        getCtrlName(
            mgr.addControl("loginForm", "TextBlock", "passLabel", "formStack", {
                text: "Password",
                color: "#AAA",
                fontSize: "14px",
                height: "25px",
                horizontalAlignment: 0,
            })
        );
        getCtrlName(
            mgr.addControl("loginForm", "InputPassword", "passInput", "formStack", {
                placeholderText: "Enter password...",
                placeholderColor: "#555",
                color: "white",
                background: "#0F3460",
                height: "40px",
                width: "1",
            })
        );

        // Remember me
        getCtrlName(
            mgr.addControl("loginForm", "StackPanel", "rememberRow", "formStack", {
                isVertical: false,
                height: "30px",
            })
        );
        getCtrlName(
            mgr.addControl("loginForm", "Checkbox", "rememberCb", "rememberRow", {
                isChecked: false,
                width: "20px",
                height: "20px",
                color: "#E94560",
            })
        );
        getCtrlName(
            mgr.addControl("loginForm", "TextBlock", "rememberLabel", "rememberRow", {
                text: "Remember me",
                color: "#AAA",
                fontSize: "14px",
                width: "120px",
            })
        );

        // Login button
        getCtrlName(
            mgr.addControl("loginForm", "Button", "loginBtn", "formStack", {
                buttonText: "Log In",
                width: "1",
                height: "45px",
                background: "#E94560",
                color: "white",
                cornerRadius: 8,
            })
        );

        const json = mgr.exportJSON("loginForm")!;
        const parsed = JSON.parse(json);
        expect(parsed.root.children.length).toBe(1);

        // Drill into form
        const card = parsed.root.children[0].children[0];
        const formStack = card.children[0];
        expect(formStack.children.length).toBe(7); // logo, userLabel, userInput, passLabel, passInput, rememberRow, loginBtn

        const issues = mgr.validateTexture("loginForm");
        expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

        writeExample("LoginForm", json);
    });

    // ── Example 5: Dialog with Confirmation ─────────────────────────────

    it("Example: Confirmation Dialog with icon, message, and buttons", () => {
        const mgr = new GuiManager();
        mgr.createTexture("dialog");

        // Semi-transparent overlay
        getCtrlName(
            mgr.addControl("dialog", "Rectangle", "overlay", "root", {
                width: "1",
                height: "1",
                background: "rgba(0,0,0,0.5)",
                thickness: 0,
            })
        );

        // Dialog box
        getCtrlName(
            mgr.addControl("dialog", "Rectangle", "box", "overlay", {
                width: "450px",
                height: "250px",
                background: "white",
                cornerRadius: 12,
                thickness: 0,
            })
        );

        // Icon
        getCtrlName(
            mgr.addControl("dialog", "TextBlock", "icon", "box", {
                text: "⚠️",
                fontSize: "48px",
                top: "-60px",
            })
        );

        // Title
        getCtrlName(
            mgr.addControl("dialog", "TextBlock", "title", "box", {
                text: "Delete Item?",
                color: "#333",
                fontSize: "22px",
                top: "-10px",
            })
        );

        // Message
        getCtrlName(
            mgr.addControl("dialog", "TextBlock", "message", "box", {
                text: "This action cannot be undone. Are you sure you want to delete this item?",
                color: "#666",
                fontSize: "14px",
                textWrapping: 1, // WordWrap
                width: "380px",
                top: "30px",
            })
        );

        // Button row
        getCtrlName(
            mgr.addControl("dialog", "StackPanel", "btnRow", "box", {
                isVertical: false,
                top: "80px",
                height: "45px",
            })
        );

        getCtrlName(
            mgr.addControl("dialog", "Button", "deleteBtn", "btnRow", {
                buttonText: "Delete",
                width: "120px",
                height: "40px",
                background: "#F44336",
                color: "white",
                cornerRadius: 6,
            })
        );

        getCtrlName(
            mgr.addControl("dialog", "Button", "cancelBtn", "btnRow", {
                buttonText: "Cancel",
                width: "120px",
                height: "40px",
                background: "#E0E0E0",
                color: "#333",
                cornerRadius: 6,
            })
        );

        const json = mgr.exportJSON("dialog")!;
        const parsed = JSON.parse(json);
        expect(parsed.root.children.length).toBe(1); // overlay
        const box = parsed.root.children[0].children[0];
        expect(box.children.length).toBe(4); // icon, title, message, btnRow
        expect(box.children[3].children.length).toBe(2); // 2 buttons

        const issues = mgr.validateTexture("dialog");
        expect(issues.every((i) => !i.startsWith("ERROR"))).toBe(true);

        writeExample("ConfirmationDialog", json);
    });
});
