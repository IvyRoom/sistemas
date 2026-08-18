export function createDownloadConfigurator(document) {
    return function configureDownloads({ moduleName, videoName }) {
        const MóduloAberto = moduleName;
        const NomeVídeo = videoName;
        let ContainerDownloadArquivo1 = document.getElementById("Container-Download-Arquivo-1");
        let NomeArquivo1 = document.getElementById("Nome-Arquivo-1");
        let BotãoDownload1 = document.getElementById("Botão-Download-1");

        let ContainerDownloadArquivo2 = document.getElementById("Container-Download-Arquivo-2");
        let NomeArquivo2 = document.getElementById("Nome-Arquivo-2");
        let BotãoDownload2 = document.getElementById("Botão-Download-2");

        let ContainerDownloadArquivo3 = document.getElementById("Container-Download-Arquivo-3");
        let NomeArquivo3 = document.getElementById("Nome-Arquivo-3");
        let BotãoDownload3 = document.getElementById("Botão-Download-3");

        let ContainerDownloadArquivo4 = document.getElementById("Container-Download-Arquivo-4");
        let NomeArquivo4 = document.getElementById("Nome-Arquivo-4");
        let BotãoDownload4 = document.getElementById("Botão-Download-4");

        //////////////////////////////////////////////////////////////////////////////////////
        // Módulo 2

        if (MóduloAberto === "Módulo 2" && NomeVídeo === "8. PRIORIDADE"){
            NomeArquivo1.innerHTML = "PLANO DE AÇÃO";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/PLANO DE AÇÃO.xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 2" && NomeVídeo === "10. PLANO DE AÇÃO CLÁUDIA"){
            NomeArquivo1.innerHTML = "PLANO DE AÇÃO (CLÁUDIA)";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/PLANO DE AÇÃO (CLÁUDIA).xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 2" && NomeVídeo === "13. RACIOCÍNIO") {
            NomeArquivo1.innerHTML = "PLANO DE AÇÃO (RODRIGO)";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/PLANO DE AÇÃO (RODRIGO).xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Módulo 3

        else if (MóduloAberto === "Módulo 3" && NomeVídeo === "2. ANÁLISE DO FENÔMENO") {
            NomeArquivo1.innerHTML = "BASE DE DADOS";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/Boyá-Arquitetura-Campaigns-Jul-01-2035-Jul-31-2035.xlsx";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 3" && NomeVídeo === "4. ANÁLISE DO FENÔMENO") {
            NomeArquivo1.innerHTML = "BD TRATADA";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/BD TRATADA.xlsx";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Módulo 4

        else if (MóduloAberto === "Módulo 4" && NomeVídeo === "7. CÁLCULO DE METAS") {
            NomeArquivo1.innerHTML = "BD INDENIZAÇÕES (2033-01 a 2034-10)";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/BD INDENIZAÇÕES (2033-01 a 2034-10).xlsx";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "AN. FUNCIONAL (VALOR MÉDIO INDENIZADO)";
            BotãoDownload2.href = "/plataforma/estudo/files/" + MóduloAberto + "/AN. FUNCIONAL (VALOR MÉDIO INDENIZADO).xlsx";
            ContainerDownloadArquivo2.style.display = "flex";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 4" && NomeVídeo === "9. CÁLCULO DE METAS") {
            NomeArquivo1.innerHTML = "BD DESLIGAMENTOS (2032-10 A 2034-10)";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/BD DESLIGAMENTOS (2032-10 A 2034-10).xlsx";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "AN. FUNCIONAL (ENTRADA DE PROCESSOS TRABALHISTAS)";
            BotãoDownload2.href = "/plataforma/estudo/files/" + MóduloAberto + "/AN. FUNCIONAL (ENTRADA DE PROCESSOS TRABALHISTAS).xlsx";
            ContainerDownloadArquivo2.style.display = "flex";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 4" && NomeVídeo === "12. PREPARAR GRÁFICOS DE CONTROLE") {
            NomeArquivo1.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS.xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "AN. FUNCIONAL (VALOR MÉDIO INDENIZADO)";
            BotãoDownload2.href = "/plataforma/estudo/files/" + MóduloAberto + "/AN. FUNCIONAL (VALOR MÉDIO INDENIZADO).xlsx";
            ContainerDownloadArquivo2.style.display = "flex";
            NomeArquivo3.innerHTML = "BD INDENIZAÇÕES (2034-06 A 2035-01)";
            BotãoDownload3.href = "/plataforma/estudo/files/" + MóduloAberto + "/BD INDENIZAÇÕES (2034-06 A 2035-01).xlsx";
            ContainerDownloadArquivo3.style.display = "flex";
            NomeArquivo4.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO)";
            BotãoDownload4.href = "/plataforma/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO) - 1.xlsm";
            ContainerDownloadArquivo4.style.display = "flex";
        }

        else if (MóduloAberto === "Módulo 4" && NomeVídeo === "14. PREPARAR GRÁFICOS DE CONTROLE") {
            NomeArquivo1.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS.xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "AN. FUNCIONAL (ENTRADA DE PROCESSOS TRABALHISTAS)";
            BotãoDownload2.href = "/plataforma/estudo/files/" + MóduloAberto + "/AN. FUNCIONAL (ENTRADA DE PROCESSOS TRABALHISTAS).xlsx";
            ContainerDownloadArquivo2.style.display = "flex";
            NomeArquivo3.innerHTML = "BD DESLIGAMENTOS (2034-06 A 2035-01)";
            BotãoDownload3.href = "/plataforma/estudo/files/" + MóduloAberto + "/BD DESLIGAMENTOS (2034-06 A 2035-01).xlsx";
            ContainerDownloadArquivo3.style.display = "flex";
            NomeArquivo4.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS)";
            BotãoDownload4.href = "/plataforma/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS) - 1.xlsm";
            ContainerDownloadArquivo4.style.display = "flex";
        }

        else if (MóduloAberto === "Módulo 4" && NomeVídeo === "15. FAZER A REUNIÃO DE NÍVEL") {
            NomeArquivo1.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO)";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO) - 2.xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS)";
            BotãoDownload2.href = "/plataforma/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS) - 2.xlsm";
            ContainerDownloadArquivo2.style.display = "flex";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Módulo 5

        else if (MóduloAberto === "Módulo 5" && NomeVídeo === "1. ANÁLISE DO FENÔMENO") {
            NomeArquivo1.innerHTML = "BD DESLIGAMENTOS (2034-06 A 2035-01)";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/BD DESLIGAMENTOS (2034-06 A 2035-01).xlsx";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "AN. FENÔMENO (ENTRADA DE PROCESSOS TRABALHISTAS)";
            BotãoDownload2.href = "/plataforma/estudo/files/" + MóduloAberto + "/AN. FENÔMENO (ENTRADA DE PROCESSOS TRABALHISTAS).xlsx";
            ContainerDownloadArquivo2.style.display = "flex";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 5" && NomeVídeo === "5. PLANO DE AÇÃO") {
            NomeArquivo1.innerHTML = "PLANO DE AÇÃO (DAVI)";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/PLANO DE AÇÃO (DAVI).xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "PLANO DE AÇÃO (SAMARA)";
            BotãoDownload2.href = "/plataforma/estudo/files/" + MóduloAberto + "/PLANO DE AÇÃO (SAMARA).xlsm";
            ContainerDownloadArquivo2.style.display = "flex";
            NomeArquivo3.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-02-17 (ENTRADA DE PROCESSOS TRABALHISTAS)";
            BotãoDownload3.href = "/plataforma/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-02-17 (ENTRADA DE PROCESSOS TRABALHISTAS).xlsm";
            ContainerDownloadArquivo3.style.display = "flex";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 5" && NomeVídeo === "8. PREPARAR GRÁFICOS DE CONTROLE") {
            NomeArquivo1.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS)";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS).xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO)";
            BotãoDownload2.href = "/plataforma/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO).xlsm";
            ContainerDownloadArquivo2.style.display = "flex";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 5" && NomeVídeo === "9. FAZER REUNIÃO DE NÍVEL") {
            NomeArquivo1.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS) - REVISADO";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS) - REVISADO.xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO) - REVISADO";
            BotãoDownload2.href = "/plataforma/estudo/files/" + MóduloAberto + "/GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO) - REVISADO.xlsm";
            ContainerDownloadArquivo2.style.display = "flex";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Módulo 7

        else if (MóduloAberto === "Módulo 7" && NomeVídeo === "10. PADRONIZAÇÃO - CONSTRUIR O PADRÃO") {
            NomeArquivo1.innerHTML = "PLANO DE AÇÃO (RAFAEL)";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/PLANO DE AÇÃO (RAFAEL).xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Módulo 8

        else if (MóduloAberto === "Módulo 8" && NomeVídeo === "9. TREINAMENTO - COMO ACONTECE") {
            NomeArquivo1.innerHTML = "PLANO DE AÇÃO (RAFAEL)";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/PLANO DE AÇÃO (RAFAEL).xlsm";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Módulo 9

        else if (MóduloAberto === "Módulo 9" && NomeVídeo === "5. FOPs - BOAS PRÁTICAS") {
            NomeArquivo1.innerHTML = "TEMPLATE FOP (A3)";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/TEMPLATE FOP (A3).vsdx";
            ContainerDownloadArquivo1.style.display = "flex";
            NomeArquivo2.innerHTML = "TEMPLATE FOP (A2)";
            BotãoDownload2.href = "/plataforma/estudo/files/" + MóduloAberto + "/TEMPLATE FOP (A2).vsdx";
            ContainerDownloadArquivo2.style.display = "flex";
            NomeArquivo3.innerHTML = "SIMBOLOGIA FOPs (BPMN)";
            BotãoDownload3.href = "/plataforma/estudo/files/" + MóduloAberto + "/SIMBOLOGIA FOPs (BPMN).vssx";
            ContainerDownloadArquivo3.style.display = "flex";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else if (MóduloAberto === "Módulo 9" && NomeVídeo === "9. POPs - BOAS PRÁTICAS") {
            NomeArquivo1.innerHTML = "TEMPLATE POP (A4)";
            BotãoDownload1.href = "/plataforma/estudo/files/" + MóduloAberto + "/TEMPLATE POP (A4).xlsx";
            ContainerDownloadArquivo1.style.display = "flex";
            ContainerDownloadArquivo2.style.display = "none";
            ContainerDownloadArquivo3.style.display = "none";
            ContainerDownloadArquivo4.style.display = "none";
        }

        else { ContainerDownloadArquivo1.style.display = "none"; ContainerDownloadArquivo2.style.display = "none"; ContainerDownloadArquivo3.style.display = "none"; ContainerDownloadArquivo4.style.display = "none"; }


    };
}
