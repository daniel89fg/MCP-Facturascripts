import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { FacturaScriptsClient } from './fs/client.js';
import type { LocalModuleConfig, LoadedLocalModule } from './types/local-module.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Carga dinámicamente todos los módulos locales de la carpeta modules-local/.
 *
 * Cada subcarpeta de modules-local/ debe tener un index.js (compilado desde index.ts)
 * que exporte `moduleConfig` siguiendo la interfaz LocalModuleConfig.
 *
 * La carpeta src/modules-local/ está en .gitignore, por lo que los módulos
 * locales nunca se subirán al repositorio.
 */
export async function loadLocalModules(fsClient: FacturaScriptsClient): Promise<LoadedLocalModule[]> {
  const localModulesDir = join(__dirname, 'modules-local');

  if (!existsSync(localModulesDir)) {
    return [];
  }

  const loaded: LoadedLocalModule[] = [];

  let entries: import('fs').Dirent<string>[];
  try {
    entries = readdirSync(localModulesDir, { withFileTypes: true, encoding: 'utf8' });
  } catch {
    console.error('[local-loader] No se pudo leer el directorio modules-local/');
    return [];
  }

  const dirs = entries.filter(e => e.isDirectory());

  for (const dir of dirs) {
    const indexPath = join(localModulesDir, dir.name as string, 'index.js');

    if (!existsSync(indexPath)) {
      console.error(`[local-loader] Módulo "${dir.name}" no tiene index.js compilado — ejecuta npm run build`);
      continue;
    }

    try {
      const moduleUrl = pathToFileURL(indexPath).href;
      const mod = await import(moduleUrl);
      const config: LocalModuleConfig = mod.moduleConfig;

      if (!config) {
        console.error(`[local-loader] Módulo "${dir.name}" no exporta "moduleConfig"`);
        continue;
      }

      if (!config.resourceName || !config.Resource || !config.toolDefinition) {
        console.error(`[local-loader] Módulo "${dir.name}": moduleConfig incompleto (faltan resourceName, Resource o toolDefinition)`);
        continue;
      }

      const instance = new config.Resource(fsClient);

      loaded.push({
        instance,
        toolDefinition: config.toolDefinition,
        resourceName: config.resourceName,
        resourceDescription: config.resourceDescription ?? '',
      });

      console.error(`[local-loader] ✓ Módulo local cargado: ${dir.name} (tool: ${config.toolDefinition.name})`);
    } catch (err) {
      console.error(`[local-loader] Error al cargar módulo "${dir.name}":`, err);
    }
  }

  if (loaded.length > 0) {
    console.error(`[local-loader] ${loaded.length} módulo(s) local(es) cargado(s)`);
  }

  return loaded;
}
