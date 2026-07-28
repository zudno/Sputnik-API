import * as vscode from 'vscode';
import { Collection, SavedRequest } from '../models/Collections';
import * as crypto from 'crypto';
import { RestClientPanel } from '../panels/RestClientPanel';
import { EnvironmentService } from '../services/EnvironmentService';

export class SidebarProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private readonly STATE_KEY = 'sputnik_collections';
    private readonly ACTIVE_REQ_KEY = 'sputnik_active_request';

    constructor(private context: vscode.ExtensionContext) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'build')]
        };

        const scriptUri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'build', 'assets', 'index.js'));
        const styleUri = webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'webview-ui', 'build', 'assets', 'index.css'));

        webviewView.webview.html = this.getHtmlContent(scriptUri, styleUri);

        const activeReqId = this.context.globalState.get<string | null>(this.ACTIVE_REQ_KEY, null);
        if (activeReqId) {
            const collections = this.getCollections();
            for (const col of collections) {
                const req = col.requests.find(r => r.id === activeReqId);
                if (req) {
                    const initialData = { requestData: req.requestData, meta: { name: req.name, collectionId: col.id, collectionName: col.name, requestId: req.id } };
                    RestClientPanel.render(this.context, req.id, req.name, 'request', initialData);
                    RestClientPanel.loadRequest(req.requestData, req.name, col.id, col.name, req.id);
                    break;
                }
            }
        }

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.command) {
                case 'getCollections': {
                    this.sendStateToWebview();
                    break;
                }
                case 'addCollection': {
                    const collections = this.getCollections();
                    collections.push({
                        id: crypto.randomUUID(),
                        name: data.name,
                        requests: []
                    });
                    await this.saveCollections(collections);
                    break;
                }
                case 'addEnvironment': {
                    const environments = EnvironmentService.getEnvironments(this.context);
                    environments.push({
                        id: crypto.randomUUID(),
                        name: data.name,
                        variables: []
                    });
                    await EnvironmentService.saveEnvironments(this.context, environments);
                    this.sendStateToWebview();
                    break;
                }
                case 'deleteEnvironment': {
                    let environments = EnvironmentService.getEnvironments(this.context);
                    const envToDelete = environments.find(e => e.id === data.id);
                    if (envToDelete) {
                        const answer = await vscode.window.showWarningMessage(`¿Eliminar entorno '${envToDelete.name}'?`, { modal: true }, 'Sí', 'No');
                        if (answer === 'Sí') {
                            environments = environments.filter(e => e.id !== data.id);
                            await EnvironmentService.saveEnvironments(this.context, environments);
                            if (EnvironmentService.getActiveEnvironmentId(this.context) === data.id) {
                                await EnvironmentService.setActiveEnvironmentId(this.context, null);
                            }
                            this.sendStateToWebview();
                        }
                    }
                    break;
                }
                case 'renameEnvironment': {
                    const environments = EnvironmentService.getEnvironments(this.context);
                    const env = environments.find(e => e.id === data.id);
                    if (env) {
                        const newName = await vscode.window.showInputBox({ prompt: 'Nuevo nombre del entorno:', value: env.name });
                        if (newName && newName !== env.name) {
                            env.name = newName;
                            await EnvironmentService.saveEnvironments(this.context, environments);
                            this.sendStateToWebview();
                        }
                    }
                    break;
                }
                case 'setActiveEnvironment': {
                    await EnvironmentService.setActiveEnvironmentId(this.context, data.id);
                    this.sendStateToWebview();
                    break;
                }
                case 'deleteCollection': {
                    const collections = this.getCollections();
                    const colToDelete = collections.find(c => c.id === data.id);
                    if (colToDelete) {
                        const answer = await vscode.window.showWarningMessage(`¿Eliminar colección '${colToDelete.name}'?`, { modal: true }, 'Sí', 'No');
                        if (answer === 'Sí') {
                            const updated = collections.filter(c => c.id !== data.id);
                            await this.saveCollections(updated);
                        }
                    }
                    break;
                }
                case 'renameCollection': {
                    const collections = this.getCollections();
                    const col = collections.find(c => c.id === data.id);
                    if (col) {
                        const newName = await vscode.window.showInputBox({ prompt: 'Nuevo nombre de la colección:', value: col.name });
                        if (newName && newName !== col.name) {
                            col.name = newName;
                            await this.saveCollections(collections);
                        }
                    }
                    break;
                }
                case 'addRequest': {
                    const collections = this.getCollections();
                    const col = collections.find(c => c.id === data.collectionId);
                    if (col) {
                        const newReq = {
                            id: crypto.randomUUID(),
                            name: data.name,
                            requestData: {
                                url: '',
                                method: 'GET',
                                headers: '',
                                body: ''
                            }
                        };
                        col.requests.push(newReq);
                        await this.saveCollections(collections);
                        const initialData = { requestData: newReq.requestData, meta: { name: newReq.name, collectionId: col.id, collectionName: col.name, requestId: newReq.id } };
                        RestClientPanel.render(this.context, newReq.id, newReq.name, 'request', initialData);
                        RestClientPanel.loadRequest(newReq.requestData, newReq.name, col.id, col.name, newReq.id);
                        await this.context.globalState.update(this.ACTIVE_REQ_KEY, newReq.id);
                        this._view?.webview.postMessage({ command: 'setActiveRequest', id: newReq.id });
                    }
                    break;
                }
                case 'toggleCollectionExpanded': {
                    const collections = this.getCollections();
                    const col = collections.find(c => c.id === data.id);
                    if (col) {
                        col.expanded = data.expanded;
                        await this.saveCollections(collections);
                    }
                    break;
                }
                case 'deleteRequest': {
                    const collections = this.getCollections();
                    const col = collections.find(c => c.id === data.collectionId);
                    if (col) {
                        const reqToDelete = col.requests.find(r => r.id === data.requestId);
                        if (reqToDelete) {
                            const answer = await vscode.window.showWarningMessage(`¿Eliminar petición '${reqToDelete.name}'?`, { modal: true }, 'Sí', 'No');
                            if (answer === 'Sí') {
                                col.requests = col.requests.filter(r => r.id !== data.requestId);
                                await this.saveCollections(collections);
                            }
                        }
                    }
                    break;
                }
                case 'renameRequest': {
                    const collections = this.getCollections();
                    const col = collections.find(c => c.id === data.collectionId);
                    if (col) {
                        const req = col.requests.find(r => r.id === data.requestId);
                        if (req) {
                            const newName = await vscode.window.showInputBox({ prompt: 'Nuevo nombre de la petición:', value: req.name });
                            if (newName && newName !== req.name) {
                                req.name = newName;
                                await this.saveCollections(collections);
                                RestClientPanel.updatePanelTitle(req.id, newName);
                            }
                        }
                    }
                    break;
                }
                case 'moveRequest': {
                    const collections = this.getCollections();
                    const sourceCol = collections.find(c => c.id === data.sourceCollectionId);
                    const targetCol = collections.find(c => c.id === data.targetCollectionId);
                    
                    if (sourceCol && targetCol) {
                        const reqIndex = sourceCol.requests.findIndex(r => r.id === data.requestId);
                        if (reqIndex !== -1) {
                            const [req] = sourceCol.requests.splice(reqIndex, 1);
                            if (data.targetIndex !== undefined) {
                                targetCol.requests.splice(data.targetIndex, 0, req);
                            } else {
                                targetCol.requests.push(req);
                            }
                            await this.saveCollections(collections);
                        }
                    }
                    break;
                }
                case 'openRequest': {
                    const collections = this.getCollections();
                    const col = collections.find(c => c.id === data.collectionId);
                    if (col) {
                        const req = col.requests.find(r => r.id === data.requestId);
                        if (req) {
                            const initialData = { requestData: req.requestData, meta: { name: req.name, collectionId: col.id, collectionName: col.name, requestId: req.id } };
                            RestClientPanel.render(this.context, req.id, req.name, 'request', initialData);
                            RestClientPanel.loadRequest(req.requestData, req.name, col.id, col.name, req.id);
                            await this.context.globalState.update(this.ACTIVE_REQ_KEY, req.id);
                            this._view?.webview.postMessage({ command: 'setActiveRequest', id: req.id });
                        }
                    }
                    break;
                }
                case 'openEnvironment': {
                    // Si data.id no viene, asume que es Globals
                    const envId = data.id ? `env_${data.id}` : `env_Globals`;
                    let initialData: any = null;
                    
                    if (data.name === 'Globals' || !data.id) {
                        const variables = EnvironmentService.getGlobals(this.context);
                        initialData = { variables, id: 'Globals' };
                    } else {
                        const environments = EnvironmentService.getEnvironments(this.context);
                        const env = environments.find(e => e.id === data.id);
                        if (env) {
                            initialData = { variables: env.variables, id: env.id };
                        }
                    }
                    
                    RestClientPanel.render(this.context, envId, data.name, 'environment', initialData);
                    
                    // Pequeño retardo para asegurar que el webview esté montado si se acaba de crear
                    setTimeout(() => {
                        RestClientPanel.loadEnvironment(envId, data.name, initialData?.variables, initialData?.id);
                    }, 200);
                    break;
                }
            }
        });
    }

    public getCollections(): Collection[] {
        return this.context.globalState.get<Collection[]>(this.STATE_KEY, []);
    }

    public async saveCollections(collections: Collection[]) {
        await this.context.globalState.update(this.STATE_KEY, collections);
        this.sendStateToWebview();
    }

    public async saveRequestData(collectionId: string, requestId: string, requestData: any) {
        const collections = this.getCollections();
        const col = collections.find(c => c.id === collectionId);
        if (col) {
            const req = col.requests.find(r => r.id === requestId);
            if (req) {
                req.requestData = requestData;
                await this.saveCollections(collections);
            }
        }
    }
    
    public async addNewRequest(collectionId: string, name: string, requestData: any) {
        const collections = this.getCollections();
        const col = collections.find(c => c.id === collectionId);
        if (col) {
            col.requests.push({
                id: crypto.randomUUID(),
                name,
                requestData
            });
            await this.saveCollections(collections);
        }
    }

    public sendStateToWebview() {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'collectionsUpdated',
                collections: this.getCollections(),
                activeRequestId: this.context.globalState.get<string | null>(this.ACTIVE_REQ_KEY, null)
            });
            
            const environments = EnvironmentService.getEnvironments(this.context);
            const activeEnvironmentId = EnvironmentService.getActiveEnvironmentId(this.context);
            
            this._view.webview.postMessage({
                command: 'environmentsUpdated',
                environments,
                activeEnvironmentId
            });
            
            RestClientPanel.broadcastEnvironments(environments, activeEnvironmentId);
        }
    }

    private getHtmlContent(scriptUri: vscode.Uri, styleUri: vscode.Uri): string {
        return `<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Sputnik Sidebar</title>
            <link href="${styleUri}" rel="stylesheet">
            <script>
                window.vscodeData = { mode: 'sidebar' };
            </script>
        </head>
        <body class="bg-transparent" style="padding: 0; margin: 0;">
            <div id="root"></div>
            <script type="module" src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}
