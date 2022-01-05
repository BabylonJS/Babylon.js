import type { Config } from "@jest/types"
import path from "path"

const testDir = path.resolve(__dirname, "../../.temp/tests/ponicode")
const sourceDir = path.resolve(__dirname, "../../.temp/manualBuildCore")

const config: Config.InitialOptions = {
	rootDir: testDir,
	testMatch: ["**/*.test.js"],
	moduleNameMapper: {
		"babylonjs/(.*)": path.join(sourceDir, "$1"),
	},
}

export = config
