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
    private static getGlobalsKey(workspaceId: string) { return `sputnik_globals_${workspaceId}`; }
    private static getEnvironmentsKey(workspaceId: string) { return `sputnik_environments_${workspaceId}`; }
    private static getActiveEnvKey(workspaceId: string) { return `sputnik_active_environment_${workspaceId}`; }

    /**
     * Recupera las variables globales almacenadas para el workspace.
     */
    public static getGlobals(context: vscode.ExtensionContext, workspaceId: string): EnvironmentVariable[] {
        return context.globalState.get<EnvironmentVariable[]>(this.getGlobalsKey(workspaceId), []);
    }

    /**
     * Guarda las variables globales para el workspace.
     */
    public static async saveGlobals(context: vscode.ExtensionContext, workspaceId: string, variables: EnvironmentVariable[]) {
        await context.globalState.update(this.getGlobalsKey(workspaceId), variables);
    }

    /**
     * Recupera la lista de entornos (sin contar Globals) para el workspace.
     */
    public static getEnvironments(context: vscode.ExtensionContext, workspaceId: string): Environment[] {
        return context.globalState.get<Environment[]>(this.getEnvironmentsKey(workspaceId), []);
    }

    /**
     * Guarda la lista de entornos para el workspace.
     */
    public static async saveEnvironments(context: vscode.ExtensionContext, workspaceId: string, environments: Environment[]) {
        await context.globalState.update(this.getEnvironmentsKey(workspaceId), environments);
    }

    /**
     * Obtiene el ID del entorno activo actual para el workspace.
     */
    public static getActiveEnvironmentId(context: vscode.ExtensionContext, workspaceId: string): string | null {
        return context.globalState.get<string | null>(this.getActiveEnvKey(workspaceId), null);
    }

    /**
     * Establece el ID del entorno activo actual para el workspace.
     */
    public static async setActiveEnvironmentId(context: vscode.ExtensionContext, workspaceId: string, id: string | null) {
        await context.globalState.update(this.getActiveEnvKey(workspaceId), id);
    }

    /**
     * Devuelve las variables combinadas: El Entorno Activo tiene prioridad sobre Globals.
     */
    public static getCombinedVariables(context: vscode.ExtensionContext, workspaceId: string): EnvironmentVariable[] {
        const globals = this.getGlobals(context, workspaceId);
        const activeId = this.getActiveEnvironmentId(context, workspaceId);
        
        let activeVars: EnvironmentVariable[] = [];
        if (activeId) {
            const envs = this.getEnvironments(context, workspaceId);
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
