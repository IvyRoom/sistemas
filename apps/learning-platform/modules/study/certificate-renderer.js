export function createCertificateRenderer(getJsPdfConstructor) {
    return function renderCertificate(event, state) {
        event.preventDefault();
        const Usuário_NomeCompleto = state.fullName;
        const Usuário_Formação_NotaAcumulado = state.accumulatedGrade;
        const Usuário_Formação_CertificadoID = state.certificateId;

        const jsPDF = getJsPdfConstructor();
        const doc = new jsPDF();

        doc.addImage('/plataforma/estudo/img/LOGO_MACHADO_CERTIFICADO.jpg', 'PNG', 20, 20, 17, 17);

        doc.setTextColor(130, 130, 130);
        doc.setFontSize(14);
        doc.setFont('Helvetica','normal');
        doc.text('Certificamos que', 105, 60, null, null, 'center');

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(20);
        doc.setFont('Helvetica','bold');
        doc.text(Usuário_NomeCompleto, 105, 80, null, null, 'center');

        doc.setTextColor(130, 130, 130);
        doc.setFontSize(14);
        doc.setFont('Helvetica','normal');
        doc.text('foi aprovado(a) na', 105, 100, null, null, 'center');

        doc.setTextColor(74, 8, 22);
        doc.setFontSize(20);
        doc.setFont('Helvetica','bold');
        doc.text('Formação em Método Gerencial', 105, 120, null, null, 'center');

        doc.setTextColor(74, 8, 22);
        doc.setFontSize(18);
        doc.setFont('Helvetica','bold');
        doc.text('(Competências Técnicas)', 105, 128, null, null, 'center');

        doc.setTextColor(130, 130, 130);
        doc.setFontSize(13);
        doc.setFont('Helvetica','normal');

        if (Usuário_Formação_NotaAcumulado >=0.95){

            doc.text(doc.splitTextToSize('Esta formação capacita profissionais na implementação de soluções gerenciais científicas, passando por inúmeros conceitos e ferramentas do Método Gerencial e do Sistema de Gestão, com ênfase na aplicação da Equação Fundamental da Gestão, dos Princípios Basilares, do Ger. Diretrizes e do Ger. Rotina à solução de problemas reais.', 160), 105, 145, null, null, 'center');

            doc.setTextColor(164, 16, 52);
            doc.setFontSize(18);
            doc.setFont('Helvetica','bold');
            doc.text('Aprovação com Honra', 105, 180, null, null, 'center');

        } else {

            doc.text(doc.splitTextToSize('Esta formação capacita profissionais na implementação de soluções gerenciais científicas, passando por inúmeros conceitos e ferramentas do Método Gerencial e do Sistema de Gestão, com ênfase na aplicação da Equação Fundamental da Gestão, dos Princípios Basilares, do Ger. Diretrizes e do Ger. Rotina à solução de problemas reais.', 160), 105, 150, null, null, 'center');

        }

        doc.setTextColor(130, 130, 130);
        doc.setFontSize(12);
        doc.text('CURITIBA, PARANÁ', 20, 200);
        doc.text('____________________________', 20, 210);

        doc.addImage('/plataforma/estudo/img/ASSINATURA.png', 'PNG', 20, 203, 55, 8);

        doc.setFontSize(10);
        doc.text('L. B. MACHADO', 20, 215);
        doc.text('Fundador e Instrutor Titular:', 20, 220);
        doc.text('Formação em Método Gerencial (Competências Técnicas)', 20, 225);
        doc.text('Machado | Método Gerencial para Empresas', 20, 230);

        doc.addImage('/plataforma/estudo/img/ATLAS.png', 'PNG', 140, 187, 50, 50);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(15);
        doc.setFont('Helvetica','bold');
        doc.text('CERTIFICADO DE CONCLUSÃO', 105, 252, null, null, 'center');

        doc.setTextColor(130, 130, 130);
        doc.setFontSize(10);
        doc.setFont('Helvetica','normal');
        doc.text('Certificado ID#: ' + Usuário_Formação_CertificadoID, 105, 260, null, null, 'center');
        doc.text('Validação via: https://machadogestao.com/validacao-certificados/', 105, 265, null, null, 'center');

        doc.save('CERTIFICADO - ' + Usuário_NomeCompleto + '.pdf');

    };
}
