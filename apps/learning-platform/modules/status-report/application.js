import {
    learningPlatformErrorKinds,
    learningPlatformErrorOperations,
    normalizeLearningPlatformError
} from '../error-adapter.js';
import {
    learningPlatformErrorMessage,
    learningPlatformErrorPresentations
} from '../error-presentation.js';
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
    platformClient,
    showAlert,
    window
}) {
    const query = parseStatusReportQuery(
        window.location.search,
        URLSearchParamsConstructor
    );

    const reportContainer = document.getElementById('Seção_Principal');
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

    async function handleLoad() {
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
                reportContainer.setAttribute('aria-busy', 'false');
                document.body.style.cursor = 'default';
            })
            .catch(error => {
                reportContainer.setAttribute('aria-busy', 'false');
                document.body.style.cursor = 'default';

                const failure = normalizeLearningPlatformError(
                    error,
                    learningPlatformErrorOperations.STATUS_REPORT
                );
                if (failure.kind !== learningPlatformErrorKinds.PLATFORM_DATA_READ_FAILURE) {
                    showAlert(learningPlatformErrorMessage(
                        learningPlatformErrorPresentations.GENERIC_SERVER_RETRY
                    ));
                } else {
                    showAlert(learningPlatformErrorMessage(
                        learningPlatformErrorPresentations.PLATFORM_DATA_RETRY
                    ));
                }
            });
    }

    return {
        install() {
            window.onload = handleLoad;
        }
    };
}
