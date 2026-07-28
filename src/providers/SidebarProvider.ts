import * as vscode from 'vscode';
import { Collection, CollectionItem } from '../models/Collections';
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
            const result = this.findNode(activeReqId, collections);
            if (result && (result.item as CollectionItem).type === 'request') {
                const req = result.item as CollectionItem;
                const rootCollection = this.getRootCollection(collections, req.id) || req;
                const initialData = { 
                    requestData: req.requestData!, 
                    meta: { name: req.name, collectionId: rootCollection.id, collectionName: rootCollection.name, requestId: req.id },
                    environments: EnvironmentService.getEnvironments(this.context),
                    activeEnvironmentId: EnvironmentService.getActiveEnvironmentId(this.context)
                };
                RestClientPanel.render(this.context, req.id, req.name, 'request', initialData);
                RestClientPanel.loadRequest(req.requestData!, req.name, rootCollection.id, rootCollection.name, req.id);
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
                case 'renameEnvironmentInline': {
                    const environments = EnvironmentService.getEnvironments(this.context);
                    const env = environments.find(e => e.id === data.id);
                    if (env && data.name && data.name !== env.name) {
                        env.name = data.name;
                        await EnvironmentService.saveEnvironments(this.context, environments);
                        this.sendStateToWebview();
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
                        
                        const rootCollection = this.getRootCollection(collections, result.item.id) || result.item;
                        
                        const initialData = { 
                            requestData: newReq.requestData!, 
                            meta: { name: newReq.name, collectionId: rootCollection.id, collectionName: rootCollection.name, requestId: newReq.id },
                            environments: EnvironmentService.getEnvironments(this.context),
                            activeEnvironmentId: EnvironmentService.getActiveEnvironmentId(this.context)
                        };
                        RestClientPanel.render(this.context, newReq.id, newReq.name, 'request', initialData);
                        RestClientPanel.loadRequest(newReq.requestData!, newReq.name, rootCollection.id, rootCollection.name, newReq.id);
                        await this.context.globalState.update(this.ACTIVE_REQ_KEY, newReq.id);
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
                        const rootCollection = this.getRootCollection(collections, req.id) || req;
                        const initialData = { 
                            requestData: req.requestData!, 
                            meta: { name: req.name, collectionId: rootCollection.id, collectionName: rootCollection.name, requestId: req.id },
                            environments: EnvironmentService.getEnvironments(this.context),
                            activeEnvironmentId: EnvironmentService.getActiveEnvironmentId(this.context)
                        };
                        RestClientPanel.render(this.context, req.id, req.name, 'request', initialData);
                        RestClientPanel.loadRequest(req.requestData!, req.name, rootCollection.id, rootCollection.name, req.id);
                        await this.context.globalState.update(this.ACTIVE_REQ_KEY, req.id);
                        this._view?.webview.postMessage({ command: 'setActiveRequest', id: req.id });
                    }
                    break;
                }
                case 'openEnvironment': {
                    // Si data.id no viene, asume que es Globals
                    const envId = data.id ? `env_${data.id}` : `env_Globals`;
                    let initialData: any = null;
                    
                    if (data.name === 'Globals' || !data.id) {
                        const variables = EnvironmentService.getGlobals(this.context);
                        initialData = { variables, id: 'Globals', name: 'Globals' };
                    } else {
                        const environments = EnvironmentService.getEnvironments(this.context);
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
            }
        });
    }

    public getCollections(): Collection[] {
        const collections = this.context.globalState.get<Collection[]>(this.STATE_KEY, []);
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
        await this.context.globalState.update(this.STATE_KEY, collections);
        this.sendStateToWebview();
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
}
