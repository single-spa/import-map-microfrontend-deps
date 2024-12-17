import { Generator, Install } from "@jspm/generator";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { ImportMapMicrofrontendUtils } from "@single-spa/import-map-microfrontend-utils";

interface ImportMapTemplate {
  imports: ModuleMap;
  scopes: Record<string, ModuleMap>;
}

interface ModuleMap {
  [specifier: string]: string;
}

interface ImportMapBuildOptions {
  template: ImportMapTemplate;
  outputFolder: string;
  utils: ImportMapMicrofrontendUtils;
}

export async function buildImportMapDependencies(
  options: ImportMapBuildOptions,
) {
  const { template } = options;

  const generatorOptions = {
    integrity: true,
  };

  const importMapGenerator = new Generator(generatorOptions);

  // Install shared dependencies into import map
  console.log("Creating import map from template", template);
  for (const importMapKey in template.imports) {
    await importMapGenerator.install(
      processImportMapEntry(importMapKey, template.imports[importMapKey]),
    );
  }

  const scopeGenerators = {};

  for (const microfrontendName in template.scopes ?? {}) {
    const scopeGenerator = new Generator(generatorOptions);
    for (const importMapKey in template.scopes[microfrontendName]) {
      await scopeGenerator.install(
        processImportMapEntry(
          importMapKey,
          template.scopes[microfrontendName][importMapKey],
        ),
      );
    }

    scopeGenerators[microfrontendName] = scopeGenerator;
  }

  const finalMap = importMapGenerator.getMap();
  if (!finalMap.imports) {
    finalMap.imports = {};
  }

  if (!finalMap.scopes) {
    finalMap.scopes = {};
  }

  for (const microfrontendName in scopeGenerators) {
    const generator = scopeGenerators[microfrontendName];
    const scopeMap = generator.getMap();

    finalMap.scopes[
      options.utils.getMicrofrontendURLPrefix(microfrontendName)
    ] = {
      ...(finalMap.scopes[microfrontendName] ?? {}),
      // TODO - account for its scopes
      ...scopeMap.imports,
    };

    finalMap.integrity = {
      ...finalMap.integrity,
      ...scopeMap.integrity,
    };
  }

  // Replace public CDN urls with self-hosted urls in import map
  const importMapString = JSON.stringify(finalMap, null, 2).replace(
    /https:\/\/ga.jspm.io\//g,
    options.utils.getDependenciesURLPrefix(),
  );

  console.log(importMapString);

  // Write final import map
  await mkdir(options.outputFolder, { recursive: true });
  await writeFile(
    `${options.outputFolder}/deps.importmap`,
    importMapString,
    "utf-8",
  );

  const downloadedUrls = [];

  for (let url in finalMap.integrity) {
    if (downloadedUrls.includes(url)) {
      continue;
    }
    console.log(url);
    const r = await fetch(url);
    if (r.ok) {
      const filePath = `./${options.outputFolder}/${options.utils.getDependenciesFolderName()}/${url.replace("https://ga.jspm.io/", "")}`;
      const dir = dirname(filePath);
      await mkdir(dir, { recursive: true });
      await writeFile(filePath, await r.text(), "utf-8");
      downloadedUrls.push(url);
    } else {
      throw Error(`Unable to download file from JSPM CDN - url '${url}'`);
    }
  }
}

function processImportMapEntry(
  importMapKey: string,
  importMapValue: string,
): Install {
  const splitKey = importMapKey.split("/");
  const extraSlashes = splitKey.length - (importMapKey.startsWith("@") ? 2 : 1);

  const result: Install = {
    target: `${splitKey.slice(0, splitKey.length - extraSlashes).join("/")}@${importMapValue}`,
  };

  if (extraSlashes > 0) {
    result.subpath = `./${splitKey.slice(extraSlashes).join("/")}`;
  }

  return result;
}
