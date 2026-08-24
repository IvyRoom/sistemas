export function createDownloadConfigurator(document) {
    return function configureDownloads({ moduleName, videoName }) {
        const downloadContainer1 = document.getElementById("Container-Download-Arquivo-1");
        const downloadName1 = document.getElementById("Nome-Arquivo-1");
        const downloadButton1 = document.getElementById("Botão-Download-1");

        const downloadContainer2 = document.getElementById("Container-Download-Arquivo-2");
        const downloadName2 = document.getElementById("Nome-Arquivo-2");
        const downloadButton2 = document.getElementById("Botão-Download-2");

        const downloadContainer3 = document.getElementById("Container-Download-Arquivo-3");
        const downloadName3 = document.getElementById("Nome-Arquivo-3");
        const downloadButton3 = document.getElementById("Botão-Download-3");

        const downloadContainer4 = document.getElementById("Container-Download-Arquivo-4");
        const downloadName4 = document.getElementById("Nome-Arquivo-4");
        const downloadButton4 = document.getElementById("Botão-Download-4");

        //////////////////////////////////////////////////////////////////////////////////////
        // Module 2

        if (moduleName === "Módulo 2" && videoName === "8. PRIORIDADE"){
            downloadName1.innerHTML = "PLANO DE AÇÃO";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/PLANO DE AÇÃO.xlsm";
            downloadContainer1.style.display = "flex";
            downloadContainer2.style.display = "none";
            downloadContainer3.style.display = "none";
            downloadContainer4.style.display = "none";
        }

        else if (moduleName === "Módulo 2" && videoName === "10. PLANO DE AÇÃO CLÁUDIA"){
            downloadName1.innerHTML = "PLANO DE AÇÃO (CLÁUDIA)";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/PLANO DE AÇÃO (CLÁUDIA).xlsm";
            downloadContainer1.style.display = "flex";
            downloadContainer2.style.display = "none";
            downloadContainer3.style.display = "none";
            downloadContainer4.style.display = "none";
        }

        else if (moduleName === "Módulo 2" && videoName === "13. RACIOCÍNIO") {
            downloadName1.innerHTML = "PLANO DE AÇÃO (RODRIGO)";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/PLANO DE AÇÃO (RODRIGO).xlsm";
            downloadContainer1.style.display = "flex";
            downloadContainer2.style.display = "none";
            downloadContainer3.style.display = "none";
            downloadContainer4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Module 3

        else if (moduleName === "Módulo 3" && videoName === "2. ANÁLISE DO FENÔMENO") {
            downloadName1.innerHTML = "BASE DE DADOS";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/Boyá-Arquitetura-Campaigns-Jul-01-2035-Jul-31-2035.xlsx";
            downloadContainer1.style.display = "flex";
            downloadContainer2.style.display = "none";
            downloadContainer3.style.display = "none";
            downloadContainer4.style.display = "none";
        }

        else if (moduleName === "Módulo 3" && videoName === "4. ANÁLISE DO FENÔMENO") {
            downloadName1.innerHTML = "BD TRATADA";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/BD TRATADA.xlsx";
            downloadContainer1.style.display = "flex";
            downloadContainer2.style.display = "none";
            downloadContainer3.style.display = "none";
            downloadContainer4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Module 4

        else if (moduleName === "Módulo 4" && videoName === "7. CÁLCULO DE METAS") {
            downloadName1.innerHTML = "BD INDENIZAÇÕES (2033-01 a 2034-10)";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/BD INDENIZAÇÕES (2033-01 a 2034-10).xlsx";
            downloadContainer1.style.display = "flex";
            downloadName2.innerHTML = "AN. FUNCIONAL (VALOR MÉDIO INDENIZADO)";
            downloadButton2.href = "/plataforma/estudo/files/" + moduleName + "/AN. FUNCIONAL (VALOR MÉDIO INDENIZADO).xlsx";
            downloadContainer2.style.display = "flex";
            downloadContainer3.style.display = "none";
            downloadContainer4.style.display = "none";
        }

        else if (moduleName === "Módulo 4" && videoName === "9. CÁLCULO DE METAS") {
            downloadName1.innerHTML = "BD DESLIGAMENTOS (2032-10 A 2034-10)";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/BD DESLIGAMENTOS (2032-10 A 2034-10).xlsx";
            downloadContainer1.style.display = "flex";
            downloadName2.innerHTML = "AN. FUNCIONAL (ENTRADA DE PROCESSOS TRABALHISTAS)";
            downloadButton2.href = "/plataforma/estudo/files/" + moduleName + "/AN. FUNCIONAL (ENTRADA DE PROCESSOS TRABALHISTAS).xlsx";
            downloadContainer2.style.display = "flex";
            downloadContainer3.style.display = "none";
            downloadContainer4.style.display = "none";
        }

        else if (moduleName === "Módulo 4" && videoName === "12. PREPARAR GRÁFICOS DE CONTROLE") {
            downloadName1.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/GRÁFICO CONTROLE DE RESULTADOS.xlsm";
            downloadContainer1.style.display = "flex";
            downloadName2.innerHTML = "AN. FUNCIONAL (VALOR MÉDIO INDENIZADO)";
            downloadButton2.href = "/plataforma/estudo/files/" + moduleName + "/AN. FUNCIONAL (VALOR MÉDIO INDENIZADO).xlsx";
            downloadContainer2.style.display = "flex";
            downloadName3.innerHTML = "BD INDENIZAÇÕES (2034-06 A 2035-01)";
            downloadButton3.href = "/plataforma/estudo/files/" + moduleName + "/BD INDENIZAÇÕES (2034-06 A 2035-01).xlsx";
            downloadContainer3.style.display = "flex";
            downloadName4.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO)";
            downloadButton4.href = "/plataforma/estudo/files/" + moduleName + "/GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO) - 1.xlsm";
            downloadContainer4.style.display = "flex";
        }

        else if (moduleName === "Módulo 4" && videoName === "14. PREPARAR GRÁFICOS DE CONTROLE") {
            downloadName1.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/GRÁFICO CONTROLE DE RESULTADOS.xlsm";
            downloadContainer1.style.display = "flex";
            downloadName2.innerHTML = "AN. FUNCIONAL (ENTRADA DE PROCESSOS TRABALHISTAS)";
            downloadButton2.href = "/plataforma/estudo/files/" + moduleName + "/AN. FUNCIONAL (ENTRADA DE PROCESSOS TRABALHISTAS).xlsx";
            downloadContainer2.style.display = "flex";
            downloadName3.innerHTML = "BD DESLIGAMENTOS (2034-06 A 2035-01)";
            downloadButton3.href = "/plataforma/estudo/files/" + moduleName + "/BD DESLIGAMENTOS (2034-06 A 2035-01).xlsx";
            downloadContainer3.style.display = "flex";
            downloadName4.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS)";
            downloadButton4.href = "/plataforma/estudo/files/" + moduleName + "/GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS) - 1.xlsm";
            downloadContainer4.style.display = "flex";
        }

        else if (moduleName === "Módulo 4" && videoName === "15. FAZER A REUNIÃO DE NÍVEL") {
            downloadName1.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO)";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/GRÁFICO CONTROLE DE RESULTADOS 2035-01 (VALOR MÉDIO INDENIZADO) - 2.xlsm";
            downloadContainer1.style.display = "flex";
            downloadName2.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS)";
            downloadButton2.href = "/plataforma/estudo/files/" + moduleName + "/GRÁFICO CONTROLE DE RESULTADOS 2035-01 (ENTRADA DE PROCESSOS TRABALHISTAS) - 2.xlsm";
            downloadContainer2.style.display = "flex";
            downloadContainer3.style.display = "none";
            downloadContainer4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Module 5

        else if (moduleName === "Módulo 5" && videoName === "1. ANÁLISE DO FENÔMENO") {
            downloadName1.innerHTML = "BD DESLIGAMENTOS (2034-06 A 2035-01)";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/BD DESLIGAMENTOS (2034-06 A 2035-01).xlsx";
            downloadContainer1.style.display = "flex";
            downloadName2.innerHTML = "AN. FENÔMENO (ENTRADA DE PROCESSOS TRABALHISTAS)";
            downloadButton2.href = "/plataforma/estudo/files/" + moduleName + "/AN. FENÔMENO (ENTRADA DE PROCESSOS TRABALHISTAS).xlsx";
            downloadContainer2.style.display = "flex";
            downloadContainer3.style.display = "none";
            downloadContainer4.style.display = "none";
        }

        else if (moduleName === "Módulo 5" && videoName === "5. PLANO DE AÇÃO") {
            downloadName1.innerHTML = "PLANO DE AÇÃO (DAVI)";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/PLANO DE AÇÃO (DAVI).xlsm";
            downloadContainer1.style.display = "flex";
            downloadName2.innerHTML = "PLANO DE AÇÃO (SAMARA)";
            downloadButton2.href = "/plataforma/estudo/files/" + moduleName + "/PLANO DE AÇÃO (SAMARA).xlsm";
            downloadContainer2.style.display = "flex";
            downloadName3.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-02-17 (ENTRADA DE PROCESSOS TRABALHISTAS)";
            downloadButton3.href = "/plataforma/estudo/files/" + moduleName + "/GRÁFICO CONTROLE DE RESULTADOS 2035-02-17 (ENTRADA DE PROCESSOS TRABALHISTAS).xlsm";
            downloadContainer3.style.display = "flex";
            downloadContainer4.style.display = "none";
        }

        else if (moduleName === "Módulo 5" && videoName === "8. PREPARAR GRÁFICOS DE CONTROLE") {
            downloadName1.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS)";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS).xlsm";
            downloadContainer1.style.display = "flex";
            downloadName2.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO)";
            downloadButton2.href = "/plataforma/estudo/files/" + moduleName + "/GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO).xlsm";
            downloadContainer2.style.display = "flex";
            downloadContainer3.style.display = "none";
            downloadContainer4.style.display = "none";
        }

        else if (moduleName === "Módulo 5" && videoName === "9. FAZER REUNIÃO DE NÍVEL") {
            downloadName1.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS) - REVISADO";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/GRÁFICO CONTROLE DE RESULTADOS 2035-02 (ENTRADA DE PROCESSOS TRABALHISTAS) - REVISADO.xlsm";
            downloadContainer1.style.display = "flex";
            downloadName2.innerHTML = "GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO) - REVISADO";
            downloadButton2.href = "/plataforma/estudo/files/" + moduleName + "/GRÁFICO CONTROLE DE RESULTADOS 2035-02 (VALOR MÉDIO INDENIZADO) - REVISADO.xlsm";
            downloadContainer2.style.display = "flex";
            downloadContainer3.style.display = "none";
            downloadContainer4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Module 7

        else if (moduleName === "Módulo 7" && videoName === "10. PADRONIZAÇÃO - CONSTRUIR O PADRÃO") {
            downloadName1.innerHTML = "PLANO DE AÇÃO (RAFAEL)";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/PLANO DE AÇÃO (RAFAEL).xlsm";
            downloadContainer1.style.display = "flex";
            downloadContainer2.style.display = "none";
            downloadContainer3.style.display = "none";
            downloadContainer4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Module 8

        else if (moduleName === "Módulo 8" && videoName === "9. TREINAMENTO - COMO ACONTECE") {
            downloadName1.innerHTML = "PLANO DE AÇÃO (RAFAEL)";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/PLANO DE AÇÃO (RAFAEL).xlsm";
            downloadContainer1.style.display = "flex";
            downloadContainer2.style.display = "none";
            downloadContainer3.style.display = "none";
            downloadContainer4.style.display = "none";
        }

        //////////////////////////////////////////////////////////////////////////////////////
        // Module 9

        else if (moduleName === "Módulo 9" && videoName === "5. FOPs - BOAS PRÁTICAS") {
            downloadName1.innerHTML = "TEMPLATE FOP (A3)";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/TEMPLATE FOP (A3).vsdx";
            downloadContainer1.style.display = "flex";
            downloadName2.innerHTML = "TEMPLATE FOP (A2)";
            downloadButton2.href = "/plataforma/estudo/files/" + moduleName + "/TEMPLATE FOP (A2).vsdx";
            downloadContainer2.style.display = "flex";
            downloadName3.innerHTML = "SIMBOLOGIA FOPs (BPMN)";
            downloadButton3.href = "/plataforma/estudo/files/" + moduleName + "/SIMBOLOGIA FOPs (BPMN).vssx";
            downloadContainer3.style.display = "flex";
            downloadContainer4.style.display = "none";
        }

        else if (moduleName === "Módulo 9" && videoName === "9. POPs - BOAS PRÁTICAS") {
            downloadName1.innerHTML = "TEMPLATE POP (A4)";
            downloadButton1.href = "/plataforma/estudo/files/" + moduleName + "/TEMPLATE POP (A4).xlsx";
            downloadContainer1.style.display = "flex";
            downloadContainer2.style.display = "none";
            downloadContainer3.style.display = "none";
            downloadContainer4.style.display = "none";
        }

        else { downloadContainer1.style.display = "none"; downloadContainer2.style.display = "none"; downloadContainer3.style.display = "none"; downloadContainer4.style.display = "none"; }


    };
}
