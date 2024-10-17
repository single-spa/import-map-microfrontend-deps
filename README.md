# import-map-microfrontend-deps

Simplified dependency management for microfrontends

## Installation

```sh
npm i @single-spa/import-map-microfrontend-deps
```

## Usage

```ts
import { buildImportMapDependencies } from "@single-spa/import-map-microfrontend-deps";
import { ImportMapMicrofrontendUtils } from "@single-spa/import-map-microfrontend-utils";

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
```
