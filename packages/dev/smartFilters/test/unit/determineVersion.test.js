import {
    determineVersion,
    removePrereleaseFlags,
    getNpmVersion,
    compareVersions,
} from "../../src/utils/buildTools/determineVersion.ts";

describe("versionUp", () => {
    beforeAll(() => {
        global.console = {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
    });

    describe("determineVersion", () => {
        describe("when NPM has no version yet", () => {
            let npmVersion = null;

            it("should use the package.json version", () => {
                const packageJsonVersion = "1.0.0";
                expect(determineVersion(npmVersion, packageJsonVersion)).toBe(packageJsonVersion);
            });
        });

        describe("when NPM has a version", () => {
            let npmVersion = "2.3.4";

            describe("when package.json has the same major and minor version", () => {
                it("should use the npm version and increment the patch version", () => {
                    const packageJsonVersion = "2.3.0";
                    expect(determineVersion(npmVersion, packageJsonVersion)).toBe("2.3.5");
                });
            });

            describe("when package.json has the same major and a different minor version", () => {
                it("should use the npm version and increment the patch version", () => {
                    const packageJsonVersion = "2.4.1";
                    expect(determineVersion(npmVersion, packageJsonVersion)).toBe("2.4.1");
                });
            });

            describe("when package.json has a different major and minor version", () => {
                it("should use the npm version and increment the patch version", () => {
                    const packageJsonVersion = "9.9.6";
                    expect(determineVersion(npmVersion, packageJsonVersion)).toBe("9.9.6");
                });
            });

            describe("when NPM version has a prerelease flag", () => {
                let npmVersion = "0.1.0-alpha";

                describe("when package.json has the same major and minor version", () => {
                    it("should use the npm version and increment the patch version, removing the prerelease flag", () => {
                        // NOTE: versionUp.js may decide to put the pre-release flag back
                        const packageJsonVersion = "0.1.0";
                        expect(determineVersion(npmVersion, packageJsonVersion)).toBe("0.1.1");
                    });
                });
            });
        });

        it.each([
            {
                npmVersion: "0.1.0-alpha",
                packageJsonVersion: "0.1.0",
                alpha: true,
                expectedVersion: "0.1.1-alpha",
            },
            {
                npmVersion: "0.1.0-alpha",
                packageJsonVersion: "0.2.0",
                alpha: true,
                expectedVersion: "0.2.0-alpha",
            },
            {
                npmVersion: "0.2.3-alpha",
                packageJsonVersion: "0.2.0",
                alpha: false,
                expectedVersion: "0.2.4",
            },
            {
                npmVersion: "1.2.3",
                packageJsonVersion: "1.2.0",
                alpha: false,
                expectedVersion: "1.2.4",
            },
            {
                npmVersion: "1.2.3",
                packageJsonVersion: "1.2.1000",
                alpha: false,
                expectedVersion: "1.2.4",
            },
            {
                npmVersion: "1.2.3",
                packageJsonVersion: "1.3.0",
                alpha: false,
                expectedVersion: "1.3.0",
            },
            {
                npmVersion: "1.2.3",
                packageJsonVersion: "2.0.0",
                alpha: false,
                expectedVersion: "2.0.0",
            },
        ])(
            "when NPM version is $npmVersion and package json version is $packageJsonVersion and alpha is @alpha, it should return $expectedVersion",
            ({ npmVersion, packageJsonVersion, alpha, expectedVersion }) => {
                expect(determineVersion(npmVersion, packageJsonVersion, alpha)).toBe(expectedVersion);
            }
        );
    });

    describe("removePrereleaseFlags", () => {
        it("should remove the prerelease flag", () => {
            expect(removePrereleaseFlags("0.1.0-alpha")).toBe("0.1.0");
        });
    });

    describe("getNpmVersion", () => {
        it("should return the version if there is no error", () => {
            expect(getNpmVersion("preview", null, "1.2.3")).toBe("1.2.3");
        });

        it("should return null if there is an E404 error", () => {
            const err = new Error("E404");
            expect(getNpmVersion("preview", err, null)).toBeNull();
        });

        it("should throw an error if there is a non-404 error", () => {
            const err = new Error("Some other error");
            expect(() => getNpmVersion("preview", err, null)).toThrow(err);
        });
    });

    describe("compareVersions", () => {
        it("should throw if version 1 does not have 3 parts", () => {
            const version1 = "1.0.0";
            const version2 = "1.0";
            expect(() => compareVersions(version1, version2)).toThrow();
        });

        it("should throw if version 2 does not have 3 parts", () => {
            const version1 = "1.0";
            const version2 = "1.0.0";
            expect(() => compareVersions(version1, version2)).toThrow();
        });

        it.each([
            {
                version1: "1.0.0",
                version2: "1.0.0",
                expectedResult: 0,
            },
            {
                version1: "1.0.0",
                version2: "2.0.0",
                expectedResult: -1,
            },
            {
                version1: "2.0.0",
                version2: "1.0.0",
                expectedResult: 1,
            },
            {
                version1: "1.0.0",
                version2: "1.1.0",
                expectedResult: -1,
            },
            {
                version1: "1.1.0",
                version2: "1.0.0",
                expectedResult: 1,
            },
            {
                version1: "1.0.0",
                version2: "1.0.1",
                expectedResult: -1,
            },
            {
                version1: "1.0.1",
                version2: "1.0.0",
                expectedResult: 1,
            },
            {
                version1: "1.0.0-alpha",
                version2: "1.0.1-alpha",
                expectedResult: -1,
            },
            {
                version1: "1.0.1-alpha",
                version2: "1.0.0-alpha",
                expectedResult: 1,
            },
        ])(
            "when version1 is $version1 and version2 is $version2, it should return $expectedResult",
            ({ version1, version2, expectedResult }) => {
                expect(compareVersions(version1, version2)).toBe(expectedResult);
            }
        );
    });
});
