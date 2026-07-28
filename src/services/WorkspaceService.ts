import * as vscode from 'vscode';
import * as crypto from 'crypto';

export interface Workspace {
    id: string;
    name: string;
    type: string; // e.g. 'Internal', 'Public', etc.
}

export class WorkspaceService {
    private static readonly WORKSPACES_KEY = 'sputnik_workspaces';
    private static readonly ACTIVE_WORKSPACE_KEY = 'sputnik_active_workspace';

    /**
     * Recupera todos los workspaces. Si no existe ninguno, crea uno por defecto.
     */
    public static getWorkspaces(context: vscode.ExtensionContext): Workspace[] {
        let workspaces = context.globalState.get<Workspace[]>(this.WORKSPACES_KEY, []);
        
        if (workspaces.length === 0) {
            // Inicialización por defecto sin migración de datos antiguos
            const defaultWorkspace: Workspace = { 
                id: crypto.randomUUID(), 
                name: 'My Workspace', 
                type: 'Internal' 
            };
            workspaces = [defaultWorkspace];
            
            // Guardamos el workspace por defecto sincronamente, aunque getWorkspaces debe ser síncrono
            // por diseño de la API de VSCode, el estado se actualiza en memoria inmediatamente.
            context.globalState.update(this.WORKSPACES_KEY, workspaces);
            context.globalState.update(this.ACTIVE_WORKSPACE_KEY, defaultWorkspace.id);
        }
        
        return workspaces;
    }

    /**
     * Obtiene el ID del workspace activo actual.
     */
    public static getActiveWorkspaceId(context: vscode.ExtensionContext): string {
        const workspaces = this.getWorkspaces(context);
        const activeId = context.globalState.get<string | null>(this.ACTIVE_WORKSPACE_KEY, null);
        
        if (!activeId || !workspaces.find(w => w.id === activeId)) {
            // Fallback si por alguna razón no hay activo o es inválido
            return workspaces[0].id;
        }
        
        return activeId;
    }

    /**
     * Establece el ID del workspace activo.
     */
    public static async setActiveWorkspaceId(context: vscode.ExtensionContext, id: string) {
        await context.globalState.update(this.ACTIVE_WORKSPACE_KEY, id);
    }

    /**
     * Crea un nuevo workspace y lo guarda.
     */
    public static async createWorkspace(context: vscode.ExtensionContext, name: string, type: string): Promise<Workspace> {
        const workspaces = this.getWorkspaces(context);
        const newWorkspace: Workspace = {
            id: crypto.randomUUID(),
            name,
            type
        };
        workspaces.push(newWorkspace);
        await context.globalState.update(this.WORKSPACES_KEY, workspaces);
        return newWorkspace;
    }
}
