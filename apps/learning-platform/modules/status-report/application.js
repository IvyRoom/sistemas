import {
    appendStatusReportCharts,
    appendStatusReportNotes,
    applyStatusReportModuleRange,
    createStatusReportChartDefinitions,
    renderStatusReportRows,
    sortStatusReportRows
} from './charts.js';
import { parseStatusReportQuery } from './query.js';

export function requestStatusReport(platformClient, query) {
    return platformClient.postJson('/statusreport', {
        linha_inicial: query.firstRow,
        linha_final: query.lastRow
    });
}

export function createStatusReportApplication({
    URLSearchParamsConstructor,
    document,
    navigate,
    platformClient,
    redirectToDeviceWarning,
    showAlert,
    window
}) {
    const query = parseStatusReportQuery(
        window.location.search,
        URLSearchParamsConstructor
    );

    const reportTitle = document.getElementById('Título_Status_Report');
    const lastUpdateLabel = document.getElementById('Última_Atualização');
    const loadingNotice = document.getElementById('Aviso_Carregando_Informações');
    const contentContainer = document.getElementById('Container_Externo_Conteúdo');
    const progressChartTitle = document.getElementById('Título_Gráfico_Controle_Resultados_Avanço_Formação');
    const chartsContainer = document.getElementById('Container_Gráficos_Controle_Resultados');
    const progressChartNote = document.getElementById('Observação_Gráfico_Controle_Resultados_Avanço_Formação');

    void query.moduleCount;
    void progressChartTitle;
    void progressChartNote;

    const { chartInformation, targets } = createStatusReportChartDefinitions(query.lastModule);

    function handleDeviceWidth() {
        redirectToDeviceWarning({ window, navigate });
    }

    async function handleLoad() {
        if (window.innerWidth <= 1024) {
            navigate('/plataforma/aviso-dispositivo');
        } else {
            window.addEventListener('resize', handleDeviceWidth);

            document.body.style.cursor = 'wait';

            reportTitle.innerHTML = 'Status Report ' + query.reportId + ': ' + query.companyName + ' - Turma ' + query.cohortNumber;
            lastUpdateLabel.innerHTML = `Última atualização: ${query.lastUpdate.slice(0, 2)}/${query.lastUpdate.slice(2, 4)}/${query.lastUpdate.slice(4, 8)} às 09:00`;

            appendStatusReportCharts(chartsContainer, chartInformation);
            appendStatusReportNotes(document, targets, query.lastModule);
            applyStatusReportModuleRange(document, query.firstModule, query.lastModule);

            requestStatusReport(platformClient, query)
                .then(data => {
                    const extractedRows = data.Dados_Extraídos_BD_Plataforma;
                    const sortedRows = sortStatusReportRows(extractedRows);

                    renderStatusReportRows({
                        document,
                        extractedRows,
                        lastModule: query.lastModule,
                        rowCount: query.rowCount,
                        sortedRows,
                        targetLabelMode: query.targetLabelMode,
                        targets
                    });

                    contentContainer.style.display = 'block';
                    loadingNotice.style.display = 'none';
                    document.body.style.cursor = 'default';
                })
                .catch(error => {
                    document.body.style.cursor = 'default';

                    if (error.error !== 'Erro_001') {
                        showAlert('Erro_000: falha de comunicação com o servidor.\nVerifique sua conexão com a internet e tente novamente.');
                    } else {
                        showAlert('Erro_001: falha de comunicação com a base de dados de controle da plataforma.\nTente novamente.');
                    }
                });
        }
    }

    return {
        install() {
            window.onload = handleLoad;
        }
    };
}
