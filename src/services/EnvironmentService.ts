import * as vscode from 'vscode';

export interface EnvironmentVariable {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
}

export class EnvironmentService {
    private static readonly GLOBALS_KEY = 'sputnik_globals';

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
