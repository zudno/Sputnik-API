import * as vscode from 'vscode';

export interface EnvironmentVariable {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
}

export interface Environment {
    id: string;
    name: string;
    variables: EnvironmentVariable[];
}

export class EnvironmentService {
    private static readonly GLOBALS_KEY = 'sputnik_globals';
    private static readonly ENVIRONMENTS_KEY = 'sputnik_environments';
    private static readonly ACTIVE_ENV_KEY = 'sputnik_active_environment';

    /**
     * Recupera las variables globales almacenadas.
     */
    public static getGlobals(context: vscode.ExtensionContext): EnvironmentVariable[] {
        return context.globalState.get<EnvironmentVariable[]>(this.GLOBALS_KEY, []);
    }

    /**
     * Guarda las variables globales.
     */
    public static async saveGlobals(context: vscode.ExtensionContext, variables: EnvironmentVariable[]) {
        await context.globalState.update(this.GLOBALS_KEY, variables);
    }

    /**
     * Recupera la lista de entornos (sin contar Globals).
     */
    public static getEnvironments(context: vscode.ExtensionContext): Environment[] {
        return context.globalState.get<Environment[]>(this.ENVIRONMENTS_KEY, []);
    }

    /**
     * Guarda la lista de entornos.
     */
    public static async saveEnvironments(context: vscode.ExtensionContext, environments: Environment[]) {
        await context.globalState.update(this.ENVIRONMENTS_KEY, environments);
    }

    /**
     * Obtiene el ID del entorno activo actual.
     */
    public static getActiveEnvironmentId(context: vscode.ExtensionContext): string | null {
        return context.globalState.get<string | null>(this.ACTIVE_ENV_KEY, null);
    }

    /**
     * Establece el ID del entorno activo actual.
     */
    public static async setActiveEnvironmentId(context: vscode.ExtensionContext, id: string | null) {
        await context.globalState.update(this.ACTIVE_ENV_KEY, id);
    }

    /**
     * Devuelve las variables combinadas: El Entorno Activo tiene prioridad sobre Globals.
     */
    public static getCombinedVariables(context: vscode.ExtensionContext): EnvironmentVariable[] {
        const globals = this.getGlobals(context);
        const activeId = this.getActiveEnvironmentId(context);
        
        let activeVars: EnvironmentVariable[] = [];
        if (activeId) {
            const envs = this.getEnvironments(context);
            const activeEnv = envs.find(e => e.id === activeId);
            if (activeEnv) {
                activeVars = activeEnv.variables;
            }
        }
        
        // El entorno activo sobreescribe al global si comparten la misma llave (key)
        const combined = [...activeVars];
        
        for (const g of globals) {
            if (g.key.trim() !== '' && !combined.some(v => v.key === g.key && v.key.trim() !== '')) {
                combined.push(g);
            }
        }
        
        return combined;
    }

    /**
     * Interpola variables en una cadena de texto buscando patrones {{variable}}.
     */
    public static interpolate(text: string, variables: EnvironmentVariable[]): string {
        if (!text || typeof text !== 'string') return text;

        let result = text;
        const activeVariables = variables.filter(v => v.enabled && v.key.trim() !== '');

        // Reemplazar todas las ocurrencias de {{key}} por su valor
        for (const variable of activeVariables) {
            // Se usa RegExp global para reemplazar todas las ocurrencias
            const regex = new RegExp(`\\{\\{${this.escapeRegExp(variable.key)}\\}\\}`, 'g');
            result = result.replace(regex, variable.value);
        }

        return result;
    }

    /**
     * Escapa caracteres especiales en la clave de la variable para usar en RegExp de manera segura.
     */
    private static escapeRegExp(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
