import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.showPanel', () => {
        const panel = vscode.window.createWebviewPanel(
            'askAPI', 
            'WebChat', 
            vscode.ViewColumn.Beside, 
            {
                enableScripts: true, 
            }
        );

      
        panel.webview.html = getWebviewContent();

        
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'askQuestion':
                    sendQuestionToAPI(message.text, panel).catch(err => {
                        panel.webview.postMessage({
                            command: 'partialResponse',
                            text: '[Error] ' + err.message
                        });
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
                background-color: #1e1e1e;
                color: #d4d4d4;
            }

            #response {
                flex-grow: 1;
                overflow-y: auto;
                padding: 15px;
                background-color: #1e1e1e;
                border-bottom: 2px solid #333;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            #input-container {
                display: flex;
                padding: 10px;
                border-top: 2px solid #333;
                background-color: #252526;
            }

            #input-container input {
                flex-grow: 1;
                padding: 10px;
                border-radius: 5px;
                border: 1px solid #555;
                background-color: #1e1e1e;
                color: #ffffff;
                outline: none;
            }

            #input-container input::placeholder {
                color: #888;
            }

            #input-container button {
                margin-left: 10px;
                background-color: #007acc;
                color: white;
                padding: 10px 15px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.3s;
            }

            #input-container button:hover {
                background-color: #005f99;
            }

            .user-question {
                background-color: #333;
                padding: 10px;
                border-radius: 10px;
                max-width: 90%;
                align-self: flex-end;
                text-align: right;
            }

            .bot-response {
                background-color: #2d2d2d;
                padding: 10px;
                border-radius: 10px;
                max-width: 90%;
                align-self: flex-start;
            }

            pre {
                background-color: #2d2d2d;
                padding: 10px;
                border-radius: 5px;
                overflow-x: auto;
                color: #dcdcdc;
            }

            code {
                font-family: 'Courier New', monospace;
                color: #9cdcfe;
            }

            a {
                color: #3794ff;
            }
        </style>
    </head>
    <body>
        <div id="response"></div>
        <div id="input-container">
            <input type="text" id="question" placeholder="Escribe tu pregunta...">
            <button id="sendButton">Enviar</button>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        <script>
            window.addEventListener('DOMContentLoaded', () => {
                const vscode = acquireVsCodeApi();
                const input = document.getElementById('question');
                const sendButton = document.getElementById('sendButton');
                const responseDiv = document.getElementById('response');

                function sendQuestion() {
                    const question = input.value.trim();
                    if (question !== '') {
                        const userQuestion = document.createElement('div');
                        userQuestion.className = 'user-question';
                        userQuestion.innerHTML = '<strong>Tú:</strong> ' + question;
                        responseDiv.appendChild(userQuestion);
                        responseDiv.scrollTop = responseDiv.scrollHeight;

                        vscode.postMessage({ command: 'askQuestion', text: question });
                        input.value = '';
                        input.focus();
                    }
                }

                sendButton.onclick = sendQuestion;

                input.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        sendQuestion();
                    }
                });

                window.addEventListener('message', event => {
                    const message = event.data;

                    if (message.command === 'partialResponse') {
                        let liveResponse = document.getElementById('live-response');

                        if (!liveResponse) {
                            liveResponse = document.createElement('div');
                            liveResponse.className = 'bot-response';
                            liveResponse.id = 'live-response';
                            liveResponse.innerHTML = '<strong>Respuesta:</strong><br>';
                            responseDiv.appendChild(liveResponse);
                        }

                        liveResponse.innerHTML = '<strong>Respuesta:</strong><br>' + marked.parse(message.text);
                        responseDiv.scrollTop = responseDiv.scrollHeight;
                    }

                    if (message.command === 'finalResponse') {
                        const liveResponse = document.getElementById('live-response');
                        if (liveResponse) {
                            liveResponse.removeAttribute('id'); // ya no es "en vivo", queda como historial
                        }
                    }
                });
            });
        </script>
    </body>
    </html>
    `;
}



interface ApiResponse {
    response: string; 
}

// Función para enviar la pregunta a la API
async function sendQuestionToAPI(question: string, panel: vscode.WebviewPanel): Promise<string> {
    const response = await fetch('http://localhost:8080/query', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: question })
    });

    if (!response.ok || !response.body) {
        throw new Error("Error al conectar con el servidor.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let result = '';
    let done = false;

    while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;

        panel.webview.postMessage({ command: 'partialResponse', text: result });
    }

    // Enviar señal de que terminó el stream
    panel.webview.postMessage({ command: 'finalResponse' });

    return result;
}



