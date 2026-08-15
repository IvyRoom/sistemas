export function parseStatusReportQuery(search, URLSearchParamsConstructor) {
    const parameters = new URLSearchParamsConstructor(search);
    const companyName = parameters.get('ne');
    const cohortNumber = parseInt(parameters.get('nt'), 10);
    const firstRow = parseInt(parameters.get('li'), 10);
    const lastRow = parseInt(parameters.get('lf'), 10);
    const rowCount = lastRow - firstRow + 1;
    const lastUpdate = parameters.get('dua');
    const reportId = parameters.get('idsr') === 'final' ? 'Final' : parseInt(parameters.get('idsr'), 10).toString().padStart(2, '0');
    const firstModule = parseInt(parameters.get('mi'), 10);
    const lastModule = parseInt(parameters.get('mf'), 10);
    const moduleCount = lastModule - firstModule + 1;
    const targetLabelMode = parameters.get('mrm'); // Legacy note: "c: consolidado" or "i: individual".

    return {
        companyName,
        cohortNumber,
        firstRow,
        lastRow,
        rowCount,
        lastUpdate,
        reportId,
        firstModule,
        lastModule,
        moduleCount,
        targetLabelMode
    };
}
