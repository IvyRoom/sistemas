export function createStatusReportChartDefinitions(lastModule) {
    const targets = [];
    targets[0] = [13, 30, 51, 71, 90, 100, 114, 138, 157, 171];
    for (let i = 1; i <= 10; i++) {
        targets[i] = [];
        for (let j = 0; j <= 14; j++) targets[i][j] = 0.70;
    }
    targets[11] = [0.07, 0.14, 0.21, 0.28, 0.35, 0.42, 0.49, 0.56, 0.63, 0.70];

    const chartInformation = [];
    chartInformation[0] = {
        title: `Avanço na Formação: Módulos 1 a ${lastModule} (#)`,
        rationale: 'Número de tópicos já completados'
    };
    for (let i = 1; i <= 10; i++) {
        chartInformation[i] = {
            title: `Desempenho: Teste Módulo ${i} (%)`,
            rationale: '(Núm. alternativas corretas selecionadas - Núm. alternativas incorretas selecionadas) / Núm. alternativas corretas total'
        };
    }
    chartInformation[11] = {
        title: `Desempenho Acumulado: Testes Módulo 1 a ${lastModule} (%)`,
        rationale: '(Núm. alternativas corretas selecionadas - Núm. alternativas incorretas selecionadas) / Núm. alternativas corretas total'
    };

    return { chartInformation, targets };
}

export function appendStatusReportCharts(chartsContainer, chartInformation) {
    for (let i = 0; i < chartInformation.length; i++) {
        chartsContainer.innerHTML += `

            <section class="Gráficos_Controle_Resultados" aria-labelledby="Status-Report-Chart-Title-${i}">

                <header class="Faixas_Superiores_Gráficos_Controle_Resultados">

                    <div class="Containers_Títulos_e_Racionais_Cálculo">

                        <h3 class="Títulos_Gráficos_Controle_Resultados" id="Status-Report-Chart-Title-${i}"> ${chartInformation[i].title}</h3>

                        <p class="Racionais_Cálculo_Gráficos_Controle_Resultados">${chartInformation[i].rationale}</p>

                    </div>

                    <div class="Containers_Melhores_e_Setas" aria-hidden="true">

                        <div class="Melhores">Melhor:</div>

                        <div class="Setas">&#129093;</div>

                    </div>

                </header>

                <div class="Containers_Realizados" role="list" aria-label="Resultados por participante">

                    ${'<div class="Realizados" role="listitem"></div>'.repeat(15)}

                </div>

                <div class="Containers_Metas" aria-hidden="true">

                    ${'<div class="Metas"></div> <div class="Rótulos_Metas"></div> <div class="Linhas_Conectoras_Metas"></div>'.repeat(14) + '<div class="Metas"></div> <div class="Rótulos_Metas"></div>'}

                </div>

                <div class="Containers_Entidades" aria-hidden="true">

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

            </section>

        `;
    }
}

export function appendStatusReportNotes(document, targets, lastModule) {
    document.querySelectorAll('.Gráficos_Controle_Resultados')[0].innerHTML += `<div class="Observações">*A meta de ${targets[0][lastModule - 1]} tópicos se refere à finalização do Módulo ${lastModule}.</div>`;
    document.querySelectorAll('.Gráficos_Controle_Resultados')[11].innerHTML += `<div class="Observações">*A meta de ${(targets[11][lastModule - 1] * 100).toFixed(0)}% equivale à soma das metas de 70% em cada teste, do Módulo 1 até o Módulo ${lastModule}.</div>`;
}

export function applyStatusReportModuleRange(document, firstModule, lastModule) {
    document.querySelectorAll('.Gráficos_Controle_Resultados').forEach((chart, index) => {
        if ((index !== 0 && index !== 11) && (index < firstModule || index > lastModule)) {
            chart.style.display = 'none';
        }
    });
}

export function sortStatusReportRows(extractedRows) {
    const sortedRows = [];
    sortedRows[0] = [...extractedRows].sort((a, b) => b[1] - a[1]);
    for (let i = 1; i <= 11; i++) {
        sortedRows[i] = [...extractedRows].sort((a, b) => b[i + 1] - a[i + 1]);
    }
    return sortedRows;
}

export function renderStatusReportRows({
    document,
    extractedRows,
    lastModule,
    rowCount,
    sortedRows,
    targetLabelMode,
    targets
}) {
    document.querySelectorAll('.Containers_Realizados').forEach(div => {
        div.style.width = `${64 * rowCount}px`;
    });

    document.querySelectorAll('.Containers_Realizados').forEach((container, chartIndex) => {
        container.querySelectorAll('.Realizados').forEach((div, rowIndex) => {
            if (sortedRows[chartIndex][rowIndex]) {
                const row = sortedRows[chartIndex][rowIndex];
                const resultValue = row[chartIndex + 1];
                const targetValue = targets[chartIndex][lastModule - 1];
                const resultLabel = chartIndex === 0
                    ? `${resultValue}`
                    : `${(resultValue * 100).toFixed(1)}%`;
                const targetLabel = chartIndex === 0
                    ? `${targetValue}`
                    : `${(targetValue * 100).toFixed(1)}%`;
                const targetOutcome = resultValue >= targetValue
                    ? 'meta atingida'
                    : 'meta não atingida';

                div.innerHTML = resultLabel;
                div.setAttribute(
                    'aria-label',
                    `${row[0]}: realizado ${resultLabel}; meta ${targetLabel}; ${targetOutcome}.`
                );

                div.style.height = `${100 * resultValue / (Math.max(targetValue, ...sortedRows[chartIndex].map(row => row[chartIndex + 1])))}%`;

                if (resultValue >= targetValue) div.style.backgroundColor = '#095f3d';
                else div.style.backgroundColor = '#4a0816';
            }

            if (rowIndex >= rowCount) div.style.display = 'none';
        });
    });

    document.querySelectorAll('.Containers_Metas').forEach(div => {
        div.style.left = `${(1024 - 64 * rowCount) / 2}px`;
    });

    document.querySelectorAll('.Containers_Metas').forEach((container, chartIndex) => {
        container.querySelectorAll('.Metas').forEach((div, rowIndex) => {
            if (sortedRows[chartIndex][rowIndex]) {
                div.style.left = `${64 * rowIndex + 32 - 3}px`;
                div.style.top = `${(1 - (targets[chartIndex][lastModule - 1] / (Math.max(targets[chartIndex][lastModule - 1], ...sortedRows[chartIndex].map(row => row[chartIndex + 1]))))) * 300 - 3}px`;
            }

            if (rowIndex >= rowCount) div.style.display = 'none';
        });

        container.querySelectorAll('.Rótulos_Metas').forEach((div, rowIndex) => {
            if (sortedRows[chartIndex][rowIndex]) {
                div.style.left = `${64 * rowIndex + 32}px`;
                div.style.top = `${(1 - (targets[chartIndex][lastModule - 1] / (Math.max(targets[chartIndex][lastModule - 1], ...sortedRows[0].map(row => row[chartIndex + 1]))))) * 300 - 25}px`;

                if (chartIndex === 0) div.innerHTML = targets[chartIndex][lastModule - 1];
                else div.innerHTML = `${(targets[chartIndex][lastModule - 1] * 100).toFixed(1)}%`;
            }

            if (targetLabelMode === 'consolidado' && rowIndex !== (rowCount - 1)) div.style.display = 'none';
            else if (rowIndex >= rowCount) div.style.display = 'none';
        });

        container.querySelectorAll('.Linhas_Conectoras_Metas').forEach((div, rowIndex) => {
            if (extractedRows[rowIndex]) {
                div.style.left = `${64 * rowIndex + 32}px`;
                div.style.top = `${(1 - (targets[chartIndex][lastModule - 1] / (Math.max(targets[chartIndex][lastModule - 1], ...sortedRows[0].map(row => row[chartIndex + 1]))))) * 300 - 1}px`;
                div.style.transform = `rotate(${Math.atan((((1 - (targets[chartIndex][lastModule - 1] / (Math.max(targets[chartIndex][lastModule - 1], ...sortedRows[0].map(row => row[chartIndex + 1]))))) * 300 - 3) - ((1 - (targets[chartIndex][lastModule - 1] / (Math.max(targets[chartIndex][lastModule - 1], ...sortedRows[0].map(row => row[chartIndex + 1]))))) * 300 - 3)) / 64) * 180 / Math.PI}deg)`;
                div.style.width = `${Math.sqrt(Math.pow(((1 - (targets[chartIndex][lastModule - 1] / (Math.max(targets[chartIndex][lastModule - 1], ...sortedRows[0].map(row => row[chartIndex + 1]))))) * 300 - 3) - ((1 - (targets[chartIndex][lastModule - 1] / (Math.max(targets[chartIndex][lastModule - 1], ...sortedRows[0].map(row => row[chartIndex + 1]))))) * 300 - 3), 2) + Math.pow(64, 2))}px`;
            }

            if (rowIndex >= rowCount - 1) div.style.display = 'none';
        });
    });

    document.querySelectorAll('.Containers_Entidades').forEach((container, chartIndex) => {
        container.querySelectorAll('.Entidades').forEach((div, rowIndex) => {
            if (sortedRows[chartIndex][rowIndex]) div.innerHTML = sortedRows[chartIndex][rowIndex][0];
            if (rowIndex >= rowCount) div.style.display = 'none';
        });
    });
}
