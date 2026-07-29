import * as vscode from 'vscode';
import { ApiService, RequestData } from '../services/ApiService';
import { SidebarProvider } from '../providers/SidebarProvider';
import { EnvironmentService } from '../services/EnvironmentService';
import { WorkspaceService } from '../services/WorkspaceService';

/**
 * Clase que gestiona el ciclo de vida y la comunicación del Webview del Cliente REST.
 */
export class RestClientPanel {
    
    private static panels: Map<string, vscode.WebviewPanel> = new Map();
    private static sidebarProvider: SidebarProvider | undefined;

    public static setSidebarProvider(provider: SidebarProvider) {
        this.sidebarProvider = provider;
    }

    public static updatePanelTitle(requestId: string, newName: string) {
        const panel = this.panels.get(requestId);
        if (panel) {
            panel.title = newName;
        }
    }

    public static loadRequest(requestData: RequestData, name: string, path: {id: string, name: string}[], requestId: string) {
        const panel = this.panels.get(requestId);
        if (panel) {
            const rootCollection = path.length > 0 ? path[0] : { id: '', name: '' };
            panel.webview.postMessage({
                command: 'loadRequest',
                data: requestData,
                meta: { name, collectionId: rootCollection.id, collectionName: rootCollection.name, path, requestId }
            });
        }
    }

    public static broadcastEnvironments(environments: any[], activeEnvironmentId: string | null) {
        this.panels.forEach((panel) => {
            panel.webview.postMessage({
                command: 'environmentsUpdated',
                environments,
                activeEnvironmentId
            });
        });
    }

    public static updateAllRequestPaths() {
        if (!this.sidebarProvider) return;
        const collections = this.sidebarProvider.getCollections();
        this.panels.forEach((panel, panelId) => {
            if (!panelId.startsWith('env_')) {
                const path = this.sidebarProvider!.findNodePath(panelId, collections);
                if (path) {
                    const foldersPath = path.slice(0, -1);
                    const rootCollection = foldersPath.length > 0 ? foldersPath[0] : { id: panelId, name: panel.title };
                    
                    panel.webview.postMessage({
                        command: 'updateMetaPath',
                        meta: { path: foldersPath, collectionName: rootCollection.name, name: path[path.length - 1].name }
                    });
                }
            }
        });
    }

    public static loadEnvironment(environmentId: string, name: string, variables?: any[], id?: string) {
        const panel = this.panels.get(environmentId);
        if (panel) {
            panel.webview.postMessage({
                command: 'loadEnvironment',
                data: { name, variables, id }
            });
        }
    }
    
    /**
     * Instancia un nuevo panel o lo muestra si ya existe para ese request.
     * @param context Contexto de la extensión para manejar recursos.
     * @param requestId ID del request
     * @param requestName Nombre del request para el título del tab
     */
    public static render(context: vscode.ExtensionContext, requestId: string = 'default', requestName: string = 'Sputnik API', initialView: string = 'request', initialData?: any): void {
        let panel = this.panels.get(requestId);

        if (panel) {
            panel.reveal(vscode.ViewColumn.One);
            return;
        }
        
        panel = vscode.window.createWebviewPanel(
            'sputnikApi',
            requestName || 'Sputnik API',
            vscode.ViewColumn.One,
            { 
                enableScripts: true,
                retainContextWhenHidden: true, // Mantiene el estado si el usuario cambia de pestaña
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'build')] // Permite cargar recursos de React
            }
        );

        this.panels.set(requestId, panel);

        panel.onDidDispose(() => {
            this.panels.delete(requestId);
        });

        // Genera la URI segura para cargar el CSS compilado de Tailwind
        const scriptUri = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'build', 'assets', 'index.js')
        );
        const styleUri = panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'webview-ui', 'build', 'assets', 'index.css')
        );

        // Define the HTML for the Webview
        panel.webview.html = this.getHtmlContent(scriptUri, styleUri, initialView, initialData);

        // Escuchar mensajes provenientes del Webview
        panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.command === 'sendRequest') {
                    const rawRequestData = message.data as RequestData;
                    
                    const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(context);
                    // Obtener variables combinadas (Globals + Entorno Activo)
                    const combinedVars = EnvironmentService.getCombinedVariables(context, activeWorkspaceId);
                    
                    // Interpolar URL, Headers y Body
                    const requestData: RequestData = {
                        url: EnvironmentService.interpolate(rawRequestData.url, combinedVars),
                        method: rawRequestData.method,
                        headers: EnvironmentService.interpolate(rawRequestData.headers, combinedVars),
                        body: EnvironmentService.interpolate(rawRequestData.body, combinedVars)
                    };
                    
                    // Llama al servicio API para hacer la petición
                    const response = await ApiService.sendRequest(requestData);
                    
                    // Envía la respuesta de vuelta al Webview
                    panel.webview.postMessage({
                        command: 'response',
                        data: response
                    });
                } else if (message.command === 'saveRequest') {
                    if (!this.sidebarProvider) {
                        vscode.window.showErrorMessage('Error interno: SidebarProvider no configurado');
                        return;
                    }
                    
                    const requestData = message.data as RequestData;
                    const collections = this.sidebarProvider.getCollections();
                    
                    if (collections.length === 0) {
                        vscode.window.showWarningMessage('Primero debes crear una colección en la barra lateral.');
                        return;
                    }

                    // Solicitar nombre
                    const name = await vscode.window.showInputBox({ prompt: 'Nombre de la petición', placeHolder: 'ej. Login API' });
                    if (!name) return;

                    // Seleccionar colección
                    const items = collections.map(c => ({ label: c.name, id: c.id }));
                    const selected = await vscode.window.showQuickPick(items, { placeHolder: 'Selecciona una colección' });
                    
                    if (selected) {
                        await this.sidebarProvider.addNewRequest(selected.id, name, requestData);
                        vscode.window.showInformationMessage('Petición guardada.');
                    }
                } else if (message.command === 'renameRequestFromPanel') {
                    if (this.sidebarProvider) {
                        await this.sidebarProvider.renameItem(message.requestId, message.name);
                        this.updatePanelTitle(message.requestId, message.name);
                    }
                } else if (message.command === 'saveEnvironment') {
                    const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(context);
                    if (message.data.id === 'Globals' || message.data.name === 'Globals') {
                        await EnvironmentService.saveGlobals(context, activeWorkspaceId, message.data.variables);
                        vscode.window.showInformationMessage('Variables Globales guardadas correctamente.');
                    } else if (message.data.id) {
                        const environments = EnvironmentService.getEnvironments(context, activeWorkspaceId);
                        const envIndex = environments.findIndex(e => e.id === message.data.id);
                        if (envIndex !== -1) {
                            environments[envIndex].variables = message.data.variables;
                            // Optionally update name if passed
                            if (message.data.name) {
                                environments[envIndex].name = message.data.name;
                            }
                            await EnvironmentService.saveEnvironments(context, activeWorkspaceId, environments);
                            vscode.window.showInformationMessage(`Entorno '${message.data.name}' guardado correctamente.`);
                            if (this.sidebarProvider) {
                                this.sidebarProvider.sendStateToWebview();
                            }
                        }
                    }
                } else if (message.command === 'renameEnvironmentFromPanel') {
                    if (this.sidebarProvider) {
                        const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(context);
                        const environments = EnvironmentService.getEnvironments(context, activeWorkspaceId);
                        const env = environments.find(e => e.id === message.id);
                        if (env) {
                            env.name = message.name;
                            await EnvironmentService.saveEnvironments(context, activeWorkspaceId, environments);
                            this.sidebarProvider.sendStateToWebview();
                        }
                    }
                } else if (message.command === 'setActiveEnvironment') {
                    if (this.sidebarProvider) {
                        const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(context);
                        await EnvironmentService.setActiveEnvironmentId(context, activeWorkspaceId, message.id);
                        this.sidebarProvider.sendStateToWebview();
                    }
                }
            },
            undefined,
            context.subscriptions
        );
    }

    /**
     * Genera y retorna el código HTML y JS embebido, inyectando los assets compilados de React.
     * @param scriptUri La URI segura para cargar el archivo JS.
     * @param styleUri La URI segura para cargar el archivo CSS.
     * @returns Un string con el documento HTML completo.
     */
    private static getHtmlContent(scriptUri: vscode.Uri, styleUri: vscode.Uri, initialView: string = 'request', initialData?: any): string {
        return `<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sputnik API</title>
            <link href="${styleUri}" rel="stylesheet">
            <script>
                window.vscodeData = { mode: 'panel', view: '${initialView}', initialData: ${initialData ? JSON.stringify(initialData) : 'null'} };
            </script>
        </head>
        <body>
            <div id="root"></div>
            <script type="module" src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}
