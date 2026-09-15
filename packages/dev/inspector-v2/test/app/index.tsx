// Dynamic imports do not mark the file as a module to TypeScript, so this empty export does and enables top-level await.
export {};

const experience = new URLSearchParams(window.location.search).get("experience");

if (experience === "lite") {
    await import("./lite");
} else {
    await import("./full");
}
