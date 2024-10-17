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

  expect(
    await fs.readdirSync("./dist/deps", { recursive: true }),
  ).toMatchSnapshot();
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

  const files = (await fs.readdirSync("./dist/deps", { recursive: true })).map(
    (file) => path.relative(process.cwd(), file),
  );
  expect(files).toMatchSnapshot();
});
