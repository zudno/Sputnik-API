import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('¡La extensión "zudno-pets" está activa!');

    // Usaremos el mismo comando helloWorld por ahora para no editar el package.json todavía
    const disposable = vscode.commands.registerCommand('zudno-pets.helloWorld', () => {
        
        // 1. Crear y mostrar un nuevo panel Webview
        const panel = vscode.window.createWebviewPanel(
            'petPanel', // Identificador interno
            'Zudno Pet', // Título de la pestaña que verá el usuario
            vscode.ViewColumn.Beside, // Mostrar en un panel dividido al lado
            { enableScripts: true } // ¡Vital para poder animarlo con JS después!
        );

        // 2. Asignar el contenido HTML al webview
        panel.webview.html = getWebviewContent();
    });

    context.subscriptions.push(disposable);
}

// 3. Función que retorna el HTML/CSS/JS de la mascota
function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mascota</title>
        <style>
            body {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background-color: #000000; /* Fondo oscuro de alto contraste */
                color: #ffffff;
                font-family: monospace;
                margin: 0;
                overflow: hidden;
            }
            pre {
                font-size: 24px;
                line-height: 1.2;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <!-- Diseño inicial en arte ASCII -->
        <pre id="pet">
 /\\_/\\
( o.o )
 > ^ <
        </pre>
        
        <script>
            // Aquí agregaremos la lógica para que cambie de frames y se mueva
            console.log("¡Mascota renderizada en el DOM!");
        </script>
    </body>
    </html>`;
}

export function deactivate() {}