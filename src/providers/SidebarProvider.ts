import * as vscode from 'vscode';
import { Collection, CollectionItem } from '../models/Collections';
import * as crypto from 'crypto';
import { RestClientPanel } from '../panels/RestClientPanel';
import { EnvironmentService } from '../services/EnvironmentService';
import { WorkspaceService } from '../services/WorkspaceService';

export class SidebarProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private getCollectionsKey(workspaceId: string) { return `sputnik_collections_${workspaceId}`; }
    private getActiveReqKey(workspaceId: string) { return `sputnik_active_request_${workspaceId}`; }

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

        const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(this.context);
        const activeReqId = this.context.globalState.get<string | null>(this.getActiveReqKey(activeWorkspaceId), null);
        if (activeReqId) {
            const collections = this.getCollections();
            const result = this.findNode(activeReqId, collections);
            if (result && (result.item as CollectionItem).type === 'request') {
                const req = result.item as CollectionItem;
                const fullPath = this.findNodePath(req.id, collections) || [{ id: req.id, name: req.name }];
                const foldersPath = fullPath.slice(0, -1);
                const rootCollection = foldersPath.length > 0 ? foldersPath[0] : { id: req.id, name: req.name };
                const initialData = { 
                    requestData: req.requestData!, 
                    meta: { name: req.name, collectionId: rootCollection.id, collectionName: rootCollection.name, path: foldersPath, requestId: req.id },
                    environments: EnvironmentService.getEnvironments(this.context, activeWorkspaceId),
                    activeEnvironmentId: EnvironmentService.getActiveEnvironmentId(this.context, activeWorkspaceId)
                };
                RestClientPanel.render(this.context, req.id, req.name, 'request', initialData);
                RestClientPanel.loadRequest(req.requestData!, req.name, foldersPath, req.id);
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
                        items: []
                    });
                    await this.saveCollections(collections);
                    break;
                }
                case 'addEnvironment': {
                    const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(this.context);
                    const environments = EnvironmentService.getEnvironments(this.context, activeWorkspaceId);
                    environments.push({
                        id: crypto.randomUUID(),
                        name: data.name,
                        variables: []
                    });
                    await EnvironmentService.saveEnvironments(this.context, activeWorkspaceId, environments);
                    this.sendStateToWebview();
                    break;
                }
                case 'deleteEnvironment': {
                    const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(this.context);
                    let environments = EnvironmentService.getEnvironments(this.context, activeWorkspaceId);
                    const envToDelete = environments.find(e => e.id === data.id);
                    if (envToDelete) {
                        const answer = await vscode.window.showWarningMessage(`¿Eliminar entorno '${envToDelete.name}'?`, { modal: true }, 'Sí', 'No');
                        if (answer === 'Sí') {
                            environments = environments.filter(e => e.id !== data.id);
                            await EnvironmentService.saveEnvironments(this.context, activeWorkspaceId, environments);
                            if (EnvironmentService.getActiveEnvironmentId(this.context, activeWorkspaceId) === data.id) {
                                await EnvironmentService.setActiveEnvironmentId(this.context, activeWorkspaceId, null);
                            }
                            this.sendStateToWebview();
                        }
                    }
                    break;
                }
                case 'renameEnvironment': {
                    const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(this.context);
                    const environments = EnvironmentService.getEnvironments(this.context, activeWorkspaceId);
                    const env = environments.find(e => e.id === data.id);
                    if (env) {
                        const newName = await vscode.window.showInputBox({ prompt: 'Nuevo nombre del entorno:', value: env.name });
                        if (newName && newName !== env.name) {
                            env.name = newName;
                            await EnvironmentService.saveEnvironments(this.context, activeWorkspaceId, environments);
                            this.sendStateToWebview();
                        }
                    }
                    break;
                }
                case 'renameEnvironmentInline': {
                    const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(this.context);
                    const environments = EnvironmentService.getEnvironments(this.context, activeWorkspaceId);
                    const env = environments.find(e => e.id === data.id);
                    if (env && data.name && data.name !== env.name) {
                        env.name = data.name;
                        await EnvironmentService.saveEnvironments(this.context, activeWorkspaceId, environments);
                        this.sendStateToWebview();
                    }
                    break;
                }
                case 'setActiveEnvironment': {
                    const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(this.context);
                    await EnvironmentService.setActiveEnvironmentId(this.context, activeWorkspaceId, data.id);
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
                case 'renameCollectionInline': {
                    const collections = this.getCollections();
                    const col = collections.find(c => c.id === data.id);
                    if (col && data.name && data.name !== col.name) {
                        col.name = data.name;
                        await this.saveCollections(collections);
                    }
                    break;
                }
                case 'addFolder': {
                    const collections = this.getCollections();
                    const result = this.findNode(data.parentId, collections);
                    if (result && 'items' in result.item) {
                        result.item.items = result.item.items || [];
                        result.item.items.push({
                            id: crypto.randomUUID(),
                            type: 'folder',
                            name: data.name,
                            items: []
                        });
                        if ('expanded' in result.item) {
                            result.item.expanded = true; // Auto expand parent
                        }
                        await this.saveCollections(collections);
                    }
                    break;
                }
                case 'addRequest': {
                    const collections = this.getCollections();
                    const result = this.findNode(data.parentId, collections);
                    if (result && 'items' in result.item) {
                        const newReq: CollectionItem = {
                            id: crypto.randomUUID(),
                            type: 'request',
                            name: data.name,
                            requestData: {
                                url: '',
                                method: 'GET',
                                headers: '',
                                body: ''
                            }
                        };
                        result.item.items = result.item.items || [];
                        result.item.items.push(newReq);
                        
                        if ('expanded' in result.item) {
                            result.item.expanded = true;
                        }
                        await this.saveCollections(collections);
                        
                        const fullPath = this.findNodePath(newReq.id, collections) || [{ id: newReq.id, name: newReq.name }];
                        const foldersPath = fullPath.slice(0, -1);
                        const rootCollection = foldersPath.length > 0 ? foldersPath[0] : { id: newReq.id, name: newReq.name };
                        
                        const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(this.context);
                        const initialData = { 
                            requestData: newReq.requestData!, 
                            meta: { name: newReq.name, collectionId: rootCollection.id, collectionName: rootCollection.name, path: foldersPath, requestId: newReq.id },
                            environments: EnvironmentService.getEnvironments(this.context, activeWorkspaceId),
                            activeEnvironmentId: EnvironmentService.getActiveEnvironmentId(this.context, activeWorkspaceId)
                        };
                        RestClientPanel.render(this.context, newReq.id, newReq.name, 'request', initialData);
                        RestClientPanel.loadRequest(newReq.requestData!, newReq.name, foldersPath, newReq.id);
                        await this.context.globalState.update(this.getActiveReqKey(activeWorkspaceId), newReq.id);
                        this._view?.webview.postMessage({ command: 'setActiveRequest', id: newReq.id });
                    }
                    break;
                }
                case 'toggleItemExpanded': {
                    const collections = this.getCollections();
                    const result = this.findNode(data.id, collections);
                    if (result && 'expanded' in result.item) {
                        result.item.expanded = data.expanded;
                        await this.saveCollections(collections);
                    }
                    break;
                }
                case 'deleteItem': {
                    const collections = this.getCollections();
                    const result = this.findNode(data.id, collections);
                    if (result && result.parent) {
                        const answer = await vscode.window.showWarningMessage(`¿Eliminar '${result.item.name}'?`, { modal: true }, 'Sí', 'No');
                        if (answer === 'Sí') {
                            if ('items' in result.parent && result.parent.items) {
                                result.parent.items.splice(result.index, 1);
                                await this.saveCollections(collections);
                            }
                        }
                    }
                    break;
                }
                case 'renameItem': {
                    const collections = this.getCollections();
                    const result = this.findNode(data.id, collections);
                    if (result) {
                        const newName = await vscode.window.showInputBox({ prompt: 'Nuevo nombre:', value: result.item.name });
                        if (newName && newName !== result.item.name) {
                            result.item.name = newName;
                            await this.saveCollections(collections);
                            if ((result.item as CollectionItem).type === 'request') {
                                RestClientPanel.updatePanelTitle(result.item.id, newName);
                            }
                        }
                    }
                    break;
                }
                case 'renameItemInline': {
                    const collections = this.getCollections();
                    const result = this.findNode(data.id, collections);
                    if (result && data.name && data.name !== result.item.name) {
                        result.item.name = data.name;
                        await this.saveCollections(collections);
                        if ((result.item as CollectionItem).type === 'request') {
                            RestClientPanel.updatePanelTitle(result.item.id, data.name);
                        }
                    }
                    break;
                }
                case 'moveItem': {
                    const collections = this.getCollections();
                    const sourceResult = this.findNode(data.sourceId, collections);
                    
                    if (sourceResult && sourceResult.parent && 'items' in sourceResult.parent) {
                        const [itemToMove] = sourceResult.parent.items!.splice(sourceResult.index, 1);
                        
                        const targetResult = this.findNode(data.targetId, collections);
                        if (targetResult) {
                            if (data.position === 'inside') {
                                if ('items' in targetResult.item) {
                                    targetResult.item.items = targetResult.item.items || [];
                                    targetResult.item.items.push(itemToMove);
                                }
                            } else {
                                if (targetResult.parent && 'items' in targetResult.parent) {
                                    const insertIndex = data.position === 'top' ? targetResult.index : targetResult.index + 1;
                                    targetResult.parent.items!.splice(insertIndex, 0, itemToMove);
                                }
                            }
                            await this.saveCollections(collections);
                        }
                    }
                    break;
                }
                case 'openRequest': {
                    const collections = this.getCollections();
                    const result = this.findNode(data.id, collections);
                    if (result && (result.item as CollectionItem).type === 'request') {
                        const req = result.item as CollectionItem;
                        const fullPath = this.findNodePath(req.id, collections) || [{ id: req.id, name: req.name }];
                        const foldersPath = fullPath.slice(0, -1);
                        const rootCollection = foldersPath.length > 0 ? foldersPath[0] : { id: req.id, name: req.name };
                        const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(this.context);
                        const initialData = { 
                            requestData: req.requestData!, 
                            meta: { name: req.name, collectionId: rootCollection.id, collectionName: rootCollection.name, path: foldersPath, requestId: req.id },
                            environments: EnvironmentService.getEnvironments(this.context, activeWorkspaceId),
                            activeEnvironmentId: EnvironmentService.getActiveEnvironmentId(this.context, activeWorkspaceId)
                        };
                        RestClientPanel.render(this.context, req.id, req.name, 'request', initialData);
                        RestClientPanel.loadRequest(req.requestData!, req.name, foldersPath, req.id);
                        await this.context.globalState.update(this.getActiveReqKey(activeWorkspaceId), req.id);
                        this._view?.webview.postMessage({ command: 'setActiveRequest', id: req.id });
                    }
                    break;
                }
                case 'openEnvironment': {
                    const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(this.context);
                    // Si data.id no viene, asume que es Globals
                    const envId = data.id ? `env_${data.id}` : `env_Globals`;
                    let initialData: any = null;
                    
                    if (data.name === 'Globals' || !data.id) {
                        const variables = EnvironmentService.getGlobals(this.context, activeWorkspaceId);
                        initialData = { variables, id: 'Globals', name: 'Globals' };
                    } else {
                        const environments = EnvironmentService.getEnvironments(this.context, activeWorkspaceId);
                        const env = environments.find(e => e.id === data.id);
                        if (env) {
                            initialData = { variables: env.variables, id: env.id, name: env.name };
                        }
                    }
                    
                    RestClientPanel.render(this.context, envId, data.name, 'environment', initialData);
                    
                    // Pequeño retardo para asegurar que el webview esté montado si se acaba de crear
                    setTimeout(() => {
                        RestClientPanel.loadEnvironment(envId, data.name, initialData?.variables, initialData?.id);
                    }, 200);
                    break;
                }
                case 'setActiveWorkspace': {
                    await WorkspaceService.setActiveWorkspaceId(this.context, data.id);
                    this.sendStateToWebview();
                    break;
                }
                case 'createWorkspace': {
                    const newWorkspace = await WorkspaceService.createWorkspace(this.context, data.name, data.type);
                    await WorkspaceService.setActiveWorkspaceId(this.context, newWorkspace.id);
                    this.sendStateToWebview();
                    break;
                }
            }
        });
    }

    public getCollections(): Collection[] {
        const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(this.context);
        const collections = this.context.globalState.get<Collection[]>(this.getCollectionsKey(activeWorkspaceId), []);
        let migrated = false;
        
        for (const col of collections) {
            if (col.requests) {
                col.items = col.requests.map((r: any) => ({
                    id: r.id,
                    type: 'request',
                    name: r.name,
                    requestData: r.requestData
                }));
                delete col.requests;
                migrated = true;
            }
            if (!col.items) col.items = [];
        }
        
        if (migrated) {
            this.saveCollections(collections);
        }
        
        return collections;
    }

    public async saveCollections(collections: Collection[]) {
        const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(this.context);
        await this.context.globalState.update(this.getCollectionsKey(activeWorkspaceId), collections);
        this.sendStateToWebview();
        RestClientPanel.updateAllRequestPaths();
    }

    public async saveRequestData(requestId: string, requestData: any) {
        const collections = this.getCollections();
        const result = this.findNode(requestId, collections);
        if (result && (result.item as CollectionItem).type === 'request') {
            (result.item as CollectionItem).requestData = requestData;
            await this.saveCollections(collections);
        }
    }

    public async renameItem(id: string, newName: string) {
        const collections = this.getCollections();
        const result = this.findNode(id, collections);
        if (result) {
            result.item.name = newName;
            await this.saveCollections(collections);
        }
    }
    
    public async addNewRequest(parentId: string, name: string, requestData: any) {
        const collections = this.getCollections();
        const result = this.findNode(parentId, collections);
        if (result && 'items' in result.item) {
            result.item.items = result.item.items || [];
            result.item.items.push({
                id: crypto.randomUUID(),
                type: 'request',
                name,
                requestData
            });
            await this.saveCollections(collections);
        }
    }

    public sendStateToWebview() {
        if (this._view) {
            const activeWorkspaceId = WorkspaceService.getActiveWorkspaceId(this.context);
            
            this._view.webview.postMessage({
                command: 'workspacesUpdated',
                workspaces: WorkspaceService.getWorkspaces(this.context),
                activeWorkspaceId
            });

            this._view.webview.postMessage({
                command: 'collectionsUpdated',
                collections: this.getCollections(),
                activeRequestId: this.context.globalState.get<string | null>(this.getActiveReqKey(activeWorkspaceId), null)
            });
            
            const environments = EnvironmentService.getEnvironments(this.context, activeWorkspaceId);
            const activeEnvironmentId = EnvironmentService.getActiveEnvironmentId(this.context, activeWorkspaceId);
            
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

    // Helper functions for tree traversal
    private findNode(id: string, collections: Collection[]): { item: Collection | CollectionItem, parent: Collection | CollectionItem | null, index: number } | null {
        for (let i = 0; i < collections.length; i++) {
            if (collections[i].id === id) {
                return { item: collections[i], parent: null, index: i };
            }
            if (collections[i].items) {
                const res = this.findNodeInItems(id, collections[i].items!, collections[i]);
                if (res) return res;
            }
        }
        return null;
    }

    private findNodeInItems(id: string, items: CollectionItem[], parent: Collection | CollectionItem): { item: CollectionItem, parent: Collection | CollectionItem, index: number } | null {
        for (let i = 0; i < items.length; i++) {
            if (items[i].id === id) {
                return { item: items[i], parent, index: i };
            }
            if (items[i].type === 'folder' && items[i].items) {
                const res = this.findNodeInItems(id, items[i].items!, items[i]);
                if (res) return res;
            }
        }
        return null;
    }

    private getRootCollection(collections: Collection[], childId: string): Collection | null {
        for (const col of collections) {
            if (col.id === childId || this.findNodeInItems(childId, col.items || [], col)) {
                return col;
            }
        }
        return null;
    }

    public findNodePath(id: string, items: any[]): {id: string, name: string}[] | null {
        for (const item of items) {
            if (item.id === id) {
                return [{ id: item.id, name: item.name }];
            }
            if (item.items) {
                const childPath = this.findNodePath(id, item.items);
                if (childPath) {
                    return [{ id: item.id, name: item.name }, ...childPath];
                }
            }
        }
        return null;
    }
}
