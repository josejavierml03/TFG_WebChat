import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.showPanel', () => {
        const panel = vscode.window.createWebviewPanel(
            'askAPI', // Identificador único
            'Consulta API', // Título del panel
            vscode.ViewColumn.Beside, // Mostrar al lado
            {
                enableScripts: true, // Habilitar scripts dentro del Webview
            }
        );

        // HTML del Webview
        panel.webview.html = getWebviewContent();

        // Enviar la pregunta cuando se hace clic en el botón
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'askQuestion':
                    // Aquí envías la pregunta a la API
                    sendQuestionToAPI(message.text).then(response => {
                        panel.webview.postMessage({ command: 'showResponse', text: response });
                    });
                    return;
            }
        });
    });

    context.subscriptions.push(disposable);
}

// Función para obtener el contenido HTML
function getWebviewContent() {
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Consulta API</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }
                #response {
                    flex-grow: 1;
                    overflow-y: scroll;
                    padding: 10px;
                    background-color: #f1f1f1;
                    border-bottom: 2px solid #ccc;
                }
                #input-container {
                    display: flex;
                    padding: 10px;
                    border-top: 2px solid #ccc;
                }
                #input-container input {
                    flex-grow: 1;
                    padding: 10px;
                    border-radius: 5px;
                    border: 1px solid #ccc;
                }
                #input-container button {
                    background-color: #007ACC;
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
            </style>
            <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script> <!-- Cargar la librería 'marked' -->
        </head>
        <body>
            <div id="response"></div>
            <div id="input-container">
                <input type="text" id="question" placeholder="Escribe tu pregunta...">
                <button id="sendButton">Enviar</button>
            </div>
            <script>
                const vscode = acquireVsCodeApi();

                // Manejar el clic del botón
                document.getElementById('sendButton').onclick = () => {
                    const question = document.getElementById('question').value;
                    vscode.postMessage({ command: 'askQuestion', text: question });
                };

                // Recibir la respuesta de la API
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'showResponse':
                            const responseDiv = document.getElementById('response');
                            const newResponse = document.createElement('div');
                            
                            // Imprimir la respuesta de la API para debuggear
                            console.log("Respuesta de la API (Markdown):", message.text);
                            
                            // Convierte el texto Markdown a HTML usando 'marked'
                            newResponse.innerHTML = marked(message.text); // Convertir Markdown a HTML

                            responseDiv.appendChild(newResponse);
                            responseDiv.scrollTop = responseDiv.scrollHeight; // Desplazar hacia abajo
                            break;
                    }
                });
            </script>
        </body>
        </html>
    `;
}

// Definir una interfaz para la respuesta de la API
interface ApiResponse {
    response: string; // Aquí definimos que el campo 'response' es un string
}

// Función para enviar la pregunta a la API
async function sendQuestionToAPI(question: string): Promise<string> {
    // Realizar la petición a la API
    const response = await fetch('http://172.22.76.104:8080/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: question })
    });

    // Verificamos que la respuesta sea válida
    if (!response.ok) {
        throw new Error('Error al obtener la respuesta de la API');
    }

    // Parsear la respuesta como ApiResponse
    const data = (await response.json()) as ApiResponse;
    
    // Retornar el campo 'response' de la respuesta
    console.log("Respuesta recibida de la API:", data.response);
    return data.response;
}




