---
applyTo: "packages/dev/**/*.ts"
---

# Avoid Allocations in the Render Loop

Allocations in the render loop can lead to increased garbage collection and reduced performance. When writing or reviewing code that runs in the render loop, look for any allocations such as creating new objects, arrays, or using functions that allocate memory. This includes code executing indirectly in the render loop through Observable callbacks (like Scene.onBeforeRenderObservable, etc.). Use `TmpVectors` when needed, or otherwise cache objects for re-use across frames. Flag any code in the render loop that causes unnecessary allocations and suggest alternatives to improve performance.

# Avoid Observable.notifyObservers in the Render Loop

Calling `Observable.notifyObservers` in the render loop can lead to performance issues, especially if there are many observers or if the notifications trigger complex logic. When writing or reviewing code that runs in the render loop, check for any calls to `notifyObservers` and evaluate whether they are necessary. If they are needed, consider whether the frequency of notifications can be reduced or if the logic can be optimized to minimize performance impact. Flag any use of `notifyObservers` in the render loop and suggest alternatives if possible.
