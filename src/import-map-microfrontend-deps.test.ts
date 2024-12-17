import { beforeEach, test, vi, expect } from "vitest";
import { buildImportMapDependencies } from "./import-map-microfrontend-deps";
import { ImportMapMicrofrontendUtils } from "@single-spa/import-map-microfrontend-utils";
import { vol, fs } from "memfs";
import path from "path";

vi.mock("node:fs/promises");

beforeEach(() => {
  vol.reset();
});

test(`writes an import map and dependencies to the file system`, async () => {
  await buildImportMapDependencies({
    template: {
      imports: {
        react: "18.3.0",
        "react-dom": "18.3.0",
      },
      scopes: {},
    },
    outputFolder: "dist",
    utils: new ImportMapMicrofrontendUtils({
      baseOrigin: "https://cdn.example.com",
    }),
  });

  expect(
    await fs.readFileSync("./dist/deps.importmap", "utf-8"),
  ).toMatchSnapshot();

  expect(readDirRelative("dist")).toMatchSnapshot();
});

test(`scoped microfrontend dependencies`, async () => {
  await buildImportMapDependencies({
    template: {
      imports: {
        react: "18.3.0",
        "react-dom": "18.3.0",
      },
      scopes: {
        "@org/navbar": {
          react: "17.0.0",
          "react-dom": "17.0.0",
        },
      },
    },
    outputFolder: "dist",
    utils: new ImportMapMicrofrontendUtils({
      baseOrigin: "https://cdn.example.com",
    }),
  });

  expect(
    await fs.readFileSync("./dist/deps.importmap", "utf-8"),
  ).toMatchSnapshot();

  expect(readDirRelative("dist")).toMatchSnapshot();
});

test(`react-microfrontends shared-dependencies example`, async () => {
  await buildImportMapDependencies({
    template: {
      imports: {
        "single-spa": "7.0.0-beta.1",
        react: "18.3.1",
        "react-dom": "18.3.1",
      },
      scopes: {},
    },
    outputFolder: "dist",
    utils: new ImportMapMicrofrontendUtils({
      baseOrigin: "https://cdn.example.com",
    }),
  });

  expect(
    await fs.readFileSync("./dist/deps.importmap", "utf-8"),
  ).toMatchSnapshot();
});

test(`react-dom/client`, async () => {
  await buildImportMapDependencies({
    template: {
      imports: {
        "single-spa": "7.0.0-beta.1",
        react: "19.0.0",
        "react-dom": "19.0.0",
        "react-dom/client": "19.0.0",
      },
      scopes: {},
    },
    outputFolder: "dist",
    utils: new ImportMapMicrofrontendUtils({
      baseOrigin: "https://cdn.example.com",
    }),
  });

  expect(
    await fs.readFileSync("./dist/deps.importmap", "utf-8"),
  ).toMatchSnapshot();

  expect(readDirRelative("dist")).toMatchSnapshot();
});

function readDirRelative(dir: string) {
  return fs
    .readdirSync(dir, { recursive: true })
    .map((file) => path.relative(process.cwd(), file))
    .sort();
}
