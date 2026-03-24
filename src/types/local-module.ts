import { FacturaScriptsClient } from '../fs/client.js';

/**
 * Interfaz que debe exportar cada módulo local como `moduleConfig`.
 *
 * Ejemplo de uso en src/modules-local/mi-modulo/index.ts:
 *
 *   import { MiResource } from './resource.js';
 *   import { toolDefinition } from './tool.js';
 *   import type { LocalModuleConfig } from '../../types/local-module.js';
 *
 *   export const moduleConfig: LocalModuleConfig = {
 *     resourceName: 'mi-recurso',
 *     resourceDescription: 'Descripción de mi recurso local',
 *     Resource: MiResource,
 *     toolDefinition,
 *   };
 */
export interface LocalModuleConfig {
  /** Nombre del recurso, usado en la URI: facturascripts://{resourceName} */
  resourceName: string;
  /** Descripción visible en el listado de recursos MCP */
  resourceDescription: string;
  /** Clase del recurso. Debe implementar getResource(uri) y matchesUri(uri) */
  Resource: new (client: FacturaScriptsClient) => any;
  /** Definición de la herramienta MCP (name, description, inputSchema) */
  toolDefinition: {
    name: string;
    description: string;
    inputSchema: object;
  };
}

export interface LoadedLocalModule {
  instance: any;
  toolDefinition: LocalModuleConfig['toolDefinition'];
  resourceName: string;
  resourceDescription: string;
}
