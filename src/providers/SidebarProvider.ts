import * as vscode from 'vscode';
import { Collection, SavedRequest } from '../models/Collections';
import * as crypto from 'crypto';
import { RestClientPanel } from '../panels/RestClientPanel';

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
                    RestClientPanel.render(this.context);
                    RestClientPanel.loadRequest(req.requestData, req.name, col.id, col.name, req.id);
                    break;
                }
            }
        }

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.command) {
                case 'getCollections': {
                    this.sendCollectionsToWebview();
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
                case 'deleteCollection': {
                    const collections = this.getCollections().filter(c => c.id !== data.id);
                    await this.saveCollections(collections);
                    break;
                }
                case 'renameCollection': {
                    const collections = this.getCollections();
                    const col = collections.find(c => c.id === data.id);
                    if (col) {
                        col.name = data.name;
                        await this.saveCollections(collections);
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
                        RestClientPanel.render(this.context);
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
                        col.requests = col.requests.filter(r => r.id !== data.requestId);
                        await this.saveCollections(collections);
                    }
                    break;
                }
                case 'renameRequest': {
                    const collections = this.getCollections();
                    const col = collections.find(c => c.id === data.collectionId);
                    if (col) {
                        const req = col.requests.find(r => r.id === data.requestId);
                        if (req) {
                            req.name = data.name;
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
                            RestClientPanel.render(this.context);
                            RestClientPanel.loadRequest(req.requestData, req.name, col.id, col.name, req.id);
                            await this.context.globalState.update(this.ACTIVE_REQ_KEY, req.id);
                            this._view?.webview.postMessage({ command: 'setActiveRequest', id: req.id });
                        }
                    }
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
        this.sendCollectionsToWebview();
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

    private sendCollectionsToWebview() {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'collectionsUpdated',
                collections: this.getCollections(),
                activeRequestId: this.context.globalState.get<string | null>(this.ACTIVE_REQ_KEY, null)
            });
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
