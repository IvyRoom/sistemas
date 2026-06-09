////////////////////////////////////////////////////////////////////////////////////////
// Cria a função que leva à página aviso-dispositivo e processa alterações do tamanho da tela.
////////////////////////////////////////////////////////////////////////////////////////

function LevaàPáginaAvisoDispositivo() { if (window.innerWidth <= 1024) { window.location.href = "/plataforma_v2/aviso-dispositivo"; } }
window.addEventListener('resize', LevaàPáginaAvisoDispositivo);

////////////////////////////////////////////////////////////////////////////////////////
// Declara as variáveis extraídas do URL buscada.
////////////////////////////////////////////////////////////////////////////////////////

const parâmetros = new URLSearchParams(window.location.search);

const id_status_report = parâmetros.get('idsr') === "final" ? "Final" : parseInt(parâmetros.get('idsr'), 10).toString().padStart(2, '0'); // "1", "2", "3", etc. ou "final"
const linha_inicial = parseInt(parâmetros.get('li'), 10);
const linha_final = parseInt(parâmetros.get('lf'), 10);
const número_linhas = linha_final - linha_inicial + 1;
const módulo_inicial = parseInt(parâmetros.get('mi'), 10);
const módulo_final = parseInt(parâmetros.get('mf'), 10);
const número_módulos = módulo_final - módulo_inicial + 1;
const nome_empresa = parâmetros.get('ne');
const número_turma = parseInt(parâmetros.get('nt'), 10);
const data_última_atualização = parâmetros.get('dua');
const modalidade_rótulos_metas = parâmetros.get('mrm');; // "c: consolidado" ou "i: individual"

////////////////////////////////////////////////////////////////////////////////////////
// Declara as variáveis extraídas do HMTL.
////////////////////////////////////////////////////////////////////////////////////////

const Título_Status_Report = document.getElementById("Título_Status_Report");
const Última_Atualização = document.getElementById("Última_Atualização");
const Título_Gráfico_Controle_Resultados_Avanço_Formação = document.getElementById("Título_Gráfico_Controle_Resultados_Avanço_Formação");
const Container_Gráficos_Controle_Resultados = document.getElementById("Container_Gráficos_Controle_Resultados");
const Observação_Gráfico_Controle_Resultados_Avanço_Formação = document.getElementById("Observação_Gráfico_Controle_Resultados_Avanço_Formação");

////////////////////////////////////////////////////////////////////////////////////////
// Declara as variáveis mestras.
////////////////////////////////////////////////////////////////////////////////////////

const URL_Base_Backend = "http://localhost:3000/plataforma_v2";

const Metas = [];
Metas[0] = [13, 30, 51, 71, 90, 100, 114, 138, 157, 171]; // Avanço na Formação.
for (let i = 1; i <= 10; i++) { Metas[i] = []; for (let j = 0; j <= 14; j++) {Metas[i][j] = 0.70}} // Desempenho Testes
Metas[11] = [0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63, 0.70]; // Desempenho Acumulado Testes

const Informações_Estáticas_Gráficos_Controle_Resultados = [];
Informações_Estáticas_Gráficos_Controle_Resultados[0] = { Título: `Avanço na Formação: Módulos 1 a ${módulo_final} (#)`, Racional: `Número de tópicos já completados`}
for (let i = 1; i <= 10; i++) { Informações_Estáticas_Gráficos_Controle_Resultados[i] = { Título: `Desempenho: Teste Módulo ${i} (%)`, Racional: `(Núm. alternativas corretas selecionadas - Núm. alternativas incorretas selecionadas) / Núm. alternativas corretas total` } }
Informações_Estáticas_Gráficos_Controle_Resultados[11] = { Título: `Desempenho Acumulado: Testes Módulo 1 a ${módulo_final} (%)`, Racional: `(Núm. alternativas corretas selecionadas - Núm. alternativas incorretas selecionadas) / Núm. alternativas corretas total` }

////////////////////////////////////////////////////////////////////////////////////////
// Processa o carregamento da página.
////////////////////////////////////////////////////////////////////////////////////////

window.onload = async function () {

    document.body.style.cursor = "wait";
    
    Título_Status_Report.innerHTML = `Status Report ` + id_status_report + `: ` + nome_empresa + ` - Turma ` + número_turma;
    Última_Atualização.innerHTML = `Última atualização: ${data_última_atualização.slice(0, 2)}/${data_última_atualização.slice(2, 4)}/${data_última_atualização.slice(4, 8)} às 09:00`;
    

    ////////////////////////////////////////////////////////////////////////////////////////
    // Cria os gráficos no HTML.
    ////////////////////////////////////////////////////////////////////////////////////////

    for (let i = 0; i < Informações_Estáticas_Gráficos_Controle_Resultados.length; i++) {

        Container_Gráficos_Controle_Resultados.innerHTML += `

            <div class="Gráficos_Controle_Resultados">

                <div class="Faixas_Superiores_Gráficos_Controle_Resultados">

                    <div class="Containers_Títulos_e_Racionais_Cálculo">
                    
                        <div class="Títulos_Gráficos_Controle_Resultados"> ${Informações_Estáticas_Gráficos_Controle_Resultados[i].Título}</div>

                        <div class="Racionais_Cálculo_Gráficos_Controle_Resultados">${Informações_Estáticas_Gráficos_Controle_Resultados[i].Racional}</div>

                    </div>

                    <div class="Containers_Melhores_e_Setas">
                    
                        <div class="Melhores">Melhor:</div>
            
                        <div class="Setas">&#129093;</div>
            
                    </div>

                </div>

                <div class="Containers_Realizados">

                    ${'<div class="Realizados"></div>'.repeat(15)}

                </div>

                <div class="Containers_Metas">

                    ${'<div class="Metas"></div> <div class="Rótulos_Metas"></div> <div class="Linhas_Conectoras_Metas"></div>'.repeat(14) + '<div class="Metas"></div> <div class="Rótulos_Metas"></div>'}
                    
                </div>

                <div class="Containers_Entidades">

                    ${'<div class="Entidades"></div>'.repeat(15)}

                </div>

                <div class="Containers_Legendas">
                
                    <div class="Containers_Internos_Legendas">
            
                        <div class="Legendas_Metas_Símbolo">‐‐‐‐◆‐‐‐‐</div>
            
                        <div class="Legendas_Metas_Texto">Metas</div>
            
                    </div>
            
                    <div class="Containers_Internos_Legendas">
            
                        <div class="Realizados_Verdes_Símbolo"></div>
            
                        <div class="Realizados_Verdes_Texto">Realizado >= Meta</div>
            
                    </div>
            
                    <div class="Containers_Internos_Legendas">
            
                        <div class="Realizados_Vermelhos_Símbolo"></div>
            
                        <div class="Realizados_Vermelhos_Texto">Realizado &lt; Meta</div>
            
                    </div>
            
                </div>

            </div>
        
        `;

    }

    document.querySelectorAll('.Gráficos_Controle_Resultados')[0].innerHTML += `<div class="Observações">*A meta de ${Metas[0][módulo_final - 1]} tópicos se refere à finalização do Módulo ${módulo_final}.</div>`;
    document.querySelectorAll('.Gráficos_Controle_Resultados')[11].innerHTML += `<div class="Observações">*A meta de ${(Metas[11][módulo_final - 1] * 100).toFixed(0)}% equivale à soma das metas de 70% em cada teste, do Módulo 1 até o Módulo ${módulo_final}.</div>`;

    ////////////////////////////////////////////////////////////////////////////////////////
    // Controla a visualização dos gráficos.
    ////////////////////////////////////////////////////////////////////////////////////////

    document.querySelectorAll('.Gráficos_Controle_Resultados').forEach((Gráfico, j) => { 
        if ( (j!==0 && j!==11) && (j<módulo_inicial || j>módulo_final) ) {Gráfico.style.display = "none"}
    });
    
    ////////////////////////////////////////////////////////////////////////////////////////
    // Atualiza os dados dos gráficos junto ao backend.
    ////////////////////////////////////////////////////////////////////////////////////////
    
    fetch(URL_Base_Backend + '/statusreport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linha_inicial, linha_final })
    })

    .then(async response => {
        const data = await response.json();
        if (!response.ok) throw { status: response.status, error: data.error };
        return data;
    })

        .then(data => {

            document.body.style.cursor = "default";

            ////////////////////////////////////////////////////////////////////////////////////////
            // Obtém e ordena os dados extraídos da BD - Plataforma.
            
            const Dados_Extraídos_BD_Plataforma = data.Dados_Extraídos_BD_Plataforma;

            const Dados_Ordenados = []; 
            Dados_Ordenados[0] = [...Dados_Extraídos_BD_Plataforma].sort((a, b) => b[1] - a[1]); 
            for (let i = 1; i <= 11; i++) { Dados_Ordenados[i] = [...Dados_Extraídos_BD_Plataforma].sort((a, b) => b[i + 1] - a[i + 1]) }
            
            
            ////////////////////////////////////////////////////////////////////////////////////////
            // Configura os Realizados.

            document.querySelectorAll('.Containers_Realizados').forEach(div => { div.style.width = `${64 * número_linhas}px` });

            document.querySelectorAll('.Containers_Realizados').forEach((container, j) => {
            
                container.querySelectorAll('.Realizados').forEach((div, i) => {

                    if (Dados_Ordenados[j][i]) {

                        if (j === 0) { div.innerHTML = `${Dados_Ordenados[j][i][j+1]}`}
                        else { div.innerHTML = `${(Dados_Ordenados[j][i][j + 1] * 100).toFixed(1) }%` }

                        div.style.height = `${100 * Dados_Ordenados[j][i][j + 1] / (Math.max(Metas[j][módulo_final - 1], ...Dados_Ordenados[j].map(linha => linha[j+1])))}%`;

                        if (Dados_Ordenados[j][i][j + 1] >= Metas[j][módulo_final - 1]) { div.style.backgroundColor = "#095f3d" }
                        else { div.style.backgroundColor = "#4a0816" }
                    }

                    if (i >= número_linhas) { div.style.display = 'none' }

                });

            });


            ////////////////////////////////////////////////////////////////////////////////////////
            // Configura as Metas.

            document.querySelectorAll('.Containers_Metas').forEach(div => { div.style.left = `${(1024 - 64 * número_linhas) / 2}px` });

            document.querySelectorAll('.Containers_Metas').forEach((container, j) => { 

                container.querySelectorAll('.Metas').forEach((div, i) => { 

                    if (Dados_Ordenados[j][i]) {

                        div.style.left = `${64 * i + 32 - 3}px`;
                        div.style.top = `${(1 - (Metas[j][módulo_final - 1] / (Math.max(Metas[j][módulo_final - 1], ...Dados_Ordenados[j].map(linha => linha[j+1]))))) * 300 - 3}px`;

                    }

                    if (i >= número_linhas) { div.style.display = 'none' }

                });

                container.querySelectorAll('.Rótulos_Metas').forEach((div, i) => {

                    if (Dados_Ordenados[j][i]) {

                        div.style.left = `${64 * i + 32}px`;
                        div.style.top = `${(1 - (Metas[j][módulo_final - 1] / (Math.max(Metas[j][módulo_final - 1], ...Dados_Ordenados[0].map(linha => linha[j+1]))))) * 300 - 25}px`;
                        
                        if (j === 0) { div.innerHTML = (Metas[j][módulo_final - 1]) }
                        else { div.innerHTML = `${(Metas[j][módulo_final - 1] * 100).toFixed(1)}%` }

                    }

                    if (modalidade_rótulos_metas === "c" && i !== (número_linhas - 1)) { div.style.display = 'none' }
                    else if (i >= número_linhas) { div.style.display = 'none' }

                });

                container.querySelectorAll('.Linhas_Conectoras_Metas').forEach((div, i) => {

                    if (Dados_Extraídos_BD_Plataforma[i]) {

                        div.style.left = `${64 * i + 32}px`;
                        div.style.top = `${(1 - (Metas[j][módulo_final - 1] / (Math.max(Metas[j][módulo_final - 1], ...Dados_Ordenados[0].map(linha => linha[j+1]))))) * 300 - 1 }px`;
                        div.style.transform = `rotate(${Math.atan((((1 - (Metas[j][módulo_final - 1] / (Math.max(Metas[j][módulo_final - 1], ...Dados_Ordenados[0].map(linha => linha[j + 1]))))) * 300 - 3) - ((1 - (Metas[j][módulo_final - 1] / (Math.max(Metas[j][módulo_final - 1], ...Dados_Ordenados[0].map(linha => linha[j+1]))))) * 300 - 3)) / 64) * 180 / Math.PI }deg)`;
                        div.style.width = `${Math.sqrt(Math.pow(((1 - (Metas[j][módulo_final - 1] / (Math.max(Metas[j][módulo_final - 1], ...Dados_Ordenados[0].map(linha => linha[j + 1]))))) * 300 - 3) - ((1 - (Metas[j][módulo_final - 1] / (Math.max(Metas[j][módulo_final - 1], ...Dados_Ordenados[0].map(linha => linha[j+1]))))) * 300 - 3),2) + Math.pow(64,2))}px`;
                    }

                    if (i >= número_linhas - 1) { div.style.display = 'none' }

                });

            });
            

            ////////////////////////////////////////////////////////////////////////////////////////
            // Configura as Entidades.

            document.querySelectorAll('.Containers_Entidades').forEach((container, j) => {

                container.querySelectorAll('.Entidades').forEach((div, i) => {

                    if (Dados_Ordenados[j][i]) { div.innerHTML = Dados_Ordenados[j][i][0] }
                    if (i >= número_linhas) div.style.display = 'none';

                })

            });

        })

        .catch(err => {

            document.body.style.cursor = "default";

            if (err.error !== 'Erro_001') { alert("Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente."); }
            else { alert("Erro_001: falha de comunicação com a base de dados de controle da plataforma.\nTente novamente."); }

        });

};