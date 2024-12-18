/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
            Define as Variáveis Puxadas do HTML
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

/* Cabeçalho Checkout */
var Formulário_de_Pagamento = document.getElementById("Formulário_de_Pagamento");
var Nome_Produto = document.getElementById("Nome_Produto");
var Valor_Produto_à_Vista = document.getElementById("Valor_Produto_à_Vista");
var Valor_Produto_a_Prazo = document.getElementById("Valor_Produto_a_Prazo");

/* Dados Pessoais */
var NomeCompleto = document.getElementById("NomeCompleto"); 
var Email_do_Cliente = document.getElementById("Email_do_Cliente");
var Confirmação_do_Email_do_Cliente = document.getElementById("Confirmação_do_Email_do_Cliente");
var Aviso_de_Inconsistência_Email_Campo = document.getElementById("Aviso_de_Inconsistência_Email_Campo");
var Aviso_de_Inconsistência_Email_Botão = document.getElementById("Aviso_de_Inconsistência_Email_Botão");
var Campo_de_Preenchimento_CPF = document.getElementById("Campo_de_Preenchimento_CPF");
var Campo_de_Preenchimento_DDD = document.getElementById("Campo_de_Preenchimento_DDD");
var Campo_de_Preenchimento_Celular = document.getElementById("Campo_de_Preenchimento_Celular");

/* Endereço de Envio: Materiais Ivy Room */
var Endereço_Rua = document.getElementById("Endereço_Rua");
var Endereço_Número = document.getElementById("Endereço_Número");
var Endereço_Complemento = document.getElementById("Endereço_Complemento");
var Endereço_Bairro = document.getElementById("Endereço_Bairro");
var Endereço_Cidade = document.getElementById("Endereço_Cidade");
var Endereço_Estado = document.getElementById("Endereço_Estado");
var Endereço_CEP = document.getElementById("Endereço_CEP");
var Aviso_de_Inconsistência_CEP_Campo = document.getElementById("Aviso_de_Inconsistência_CEP_Campo");
var Aviso_de_Inconsistência_CEP_Botão = document.getElementById("Aviso_de_Inconsistência_CEP_Botão");

/* Botões de Pagamento */
var Tipo_de_Pagamento_Escolhido = "UM_CARTAO";
var Tipo_de_Pagamento_UM_CARTAO = document.getElementById("Tipo_de_Pagamento_UM_CARTAO");
var Tipo_de_Pagamento_PIX = document.getElementById("Tipo_de_Pagamento_PIX");
var Tipo_de_Pagamento_BOLETO = document.getElementById("Tipo_de_Pagamento_BOLETO");
var Tipo_de_Pagamento_PIX_CARTAO = document.getElementById("Tipo_de_Pagamento_PIX_CARTAO");
var Tipo_de_Pagamento_DOIS_CARTOES = document.getElementById("Tipo_de_Pagamento_DOIS_CARTOES");

/* Tipo de Pagamento: UM_CARTAO */
var Dados_Pagamento_UM_CARTAO = document.getElementById("Dados_Pagamento_UM_CARTAO");
var Número_de_Parcelas_Cartão_do_UM_CARTAO = document.getElementById("Número_de_Parcelas_Cartão_do_UM_CARTAO");
var Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_2 = document.getElementById("Número_de_Parcelas_Cartão_do_UM_CARTAO").options[1];
var Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_3 = document.getElementById("Número_de_Parcelas_Cartão_do_UM_CARTAO").options[2];
var Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_4 = document.getElementById("Número_de_Parcelas_Cartão_do_UM_CARTAO").options[3];
var Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_5 = document.getElementById("Número_de_Parcelas_Cartão_do_UM_CARTAO").options[4];
var Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_6 = document.getElementById("Número_de_Parcelas_Cartão_do_UM_CARTAO").options[5];
var Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_7 = document.getElementById("Número_de_Parcelas_Cartão_do_UM_CARTAO").options[6];
var Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_8 = document.getElementById("Número_de_Parcelas_Cartão_do_UM_CARTAO").options[7];
var Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_9 = document.getElementById("Número_de_Parcelas_Cartão_do_UM_CARTAO").options[8];
var Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_10 = document.getElementById("Número_de_Parcelas_Cartão_do_UM_CARTAO").options[9];
var Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_11 = document.getElementById("Número_de_Parcelas_Cartão_do_UM_CARTAO").options[10];
var Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_12 = document.getElementById("Número_de_Parcelas_Cartão_do_UM_CARTAO").options[11];
var Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_13 = document.getElementById("Número_de_Parcelas_Cartão_do_UM_CARTAO").options[12];
var Número_do_Cartão = document.querySelector("#Número_do_Cartão");
var Aviso_de_Inconsistência_Número_do_Cartão_Campo = document.querySelector("#Aviso_de_Inconsistência_Número_do_Cartão_Campo");
var Aviso_de_Inconsistência_Número_do_Cartão_Botão = document.querySelector("#Aviso_de_Inconsistência_Número_do_Cartão_Botão");
var Nome_do_Titular_do_Cartão = document.querySelector("#Nome_do_Titular_do_Cartão");
var Campo_de_Preenchimento_Mês_Cartão = document.querySelector("#Campo_de_Preenchimento_Mês_Cartão");
var Campo_de_Preenchimento_Ano_Cartão = document.querySelector("#Campo_de_Preenchimento_Ano_Cartão");
var Campo_de_Preenchimento_CVV_Cartão = document.querySelector("#Campo_de_Preenchimento_CVV_Cartão");
var Aviso_de_Inconsistência_CVV_Cartão_Campo = document.getElementById("Aviso_de_Inconsistência_CVV_Cartão_Campo");
var Aviso_de_Inconsistência_CVV_Cartão_Botão = document.getElementById("Aviso_de_Inconsistência_CVV_Cartão_Botão");
var Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos;

/* Tipo de Pagamento: PIX */
var Dados_Pagamento_PIX = document.getElementById("Dados_Pagamento_PIX");
var Valor_Total_da_Compra_no_PIX;

/* Tipo de Pagamento: BOLETO */
var Dados_Pagamento_BOLETO = document.getElementById("Dados_Pagamento_BOLETO");
var Valor_Total_da_Compra_no_BOLETO;

/* Tipo de Pagamento: PIX_CARTÃO */
var Dados_Pagamento_PIX_CARTAO = document.getElementById("Dados_Pagamento_PIX_CARTAO");
var Valor_no_Cartão_do_PIX_CARTÃO = document.getElementById("Valor_no_Cartão_do_PIX_CARTÃO");
var Número_de_Parcelas_Cartão_do_PIX_CARTÃO = document.getElementById("Número_de_Parcelas_Cartão_do_PIX_CARTÃO"); 
var Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_1 = document.getElementById("Número_de_Parcelas_Cartão_do_PIX_CARTÃO").options[0];
var Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_2 = document.getElementById("Número_de_Parcelas_Cartão_do_PIX_CARTÃO").options[1];
var Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_3 = document.getElementById("Número_de_Parcelas_Cartão_do_PIX_CARTÃO").options[2];
var Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_4 = document.getElementById("Número_de_Parcelas_Cartão_do_PIX_CARTÃO").options[3];
var Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_5 = document.getElementById("Número_de_Parcelas_Cartão_do_PIX_CARTÃO").options[4];
var Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_6 = document.getElementById("Número_de_Parcelas_Cartão_do_PIX_CARTÃO").options[5];
var Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_7 = document.getElementById("Número_de_Parcelas_Cartão_do_PIX_CARTÃO").options[6];
var Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_8 = document.getElementById("Número_de_Parcelas_Cartão_do_PIX_CARTÃO").options[7];
var Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_9 = document.getElementById("Número_de_Parcelas_Cartão_do_PIX_CARTÃO").options[8];
var Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_10 = document.getElementById("Número_de_Parcelas_Cartão_do_PIX_CARTÃO").options[9];
var Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_11 = document.getElementById("Número_de_Parcelas_Cartão_do_PIX_CARTÃO").options[10];
var Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_12 = document.getElementById("Número_de_Parcelas_Cartão_do_PIX_CARTÃO").options[11];
var Número_do_Cartão_do_PIX_CARTÃO = document.getElementById("Número_do_Cartão_do_PIX_CARTÃO");
var Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Campo = document.querySelector("#Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Campo");
var Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Botão = document.querySelector("#Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Botão");
var Nome_do_Titular_do_Cartão_do_PIX_CARTÃO = document.getElementById("Nome_do_Titular_do_Cartão_do_PIX_CARTÃO");
var Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO = document.getElementById("Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO");
var Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO = document.getElementById("Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO");
var Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO = document.getElementById("Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO");
var Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Campo = document.querySelector("#Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Campo");
var Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Botão = document.querySelector("#Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Botão");
var Valor_no_PIX_do_PIX_CARTÃO = document.getElementById("Valor_no_PIX_do_PIX_CARTÃO");
var Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos;

/* Tipo de Pagamento: DOIS_CARTOES */
var Container_Dados_Pagamento_DOIS_CARTOES = document.getElementById("Container_Dados_Pagamento_DOIS_CARTOES");
var Valor_no_Cartão_1 = document.getElementById("Valor_no_Cartão_1");
var Número_de_Parcelas_Cartão_1 = document.getElementById("Número_de_Parcelas_Cartão_1"); 
var Número_de_Parcelas_Cartão_1_Opção_1 = document.getElementById("Número_de_Parcelas_Cartão_1").options[0];
var Número_de_Parcelas_Cartão_1_Opção_2 = document.getElementById("Número_de_Parcelas_Cartão_1").options[1];
var Número_de_Parcelas_Cartão_1_Opção_3 = document.getElementById("Número_de_Parcelas_Cartão_1").options[2];
var Número_de_Parcelas_Cartão_1_Opção_4 = document.getElementById("Número_de_Parcelas_Cartão_1").options[3];
var Número_de_Parcelas_Cartão_1_Opção_5 = document.getElementById("Número_de_Parcelas_Cartão_1").options[4];
var Número_de_Parcelas_Cartão_1_Opção_6 = document.getElementById("Número_de_Parcelas_Cartão_1").options[5];
var Número_de_Parcelas_Cartão_1_Opção_7 = document.getElementById("Número_de_Parcelas_Cartão_1").options[6];
var Número_de_Parcelas_Cartão_1_Opção_8 = document.getElementById("Número_de_Parcelas_Cartão_1").options[7];
var Número_de_Parcelas_Cartão_1_Opção_9 = document.getElementById("Número_de_Parcelas_Cartão_1").options[8];
var Número_de_Parcelas_Cartão_1_Opção_10 = document.getElementById("Número_de_Parcelas_Cartão_1").options[9];
var Número_de_Parcelas_Cartão_1_Opção_11 = document.getElementById("Número_de_Parcelas_Cartão_1").options[10];
var Número_de_Parcelas_Cartão_1_Opção_12 = document.getElementById("Número_de_Parcelas_Cartão_1").options[11];
var Número_do_Cartão_1 = document.getElementById("Número_do_Cartão_1");
var Aviso_de_Inconsistência_Número_do_Cartão_1_Campo = document.getElementById("Aviso_de_Inconsistência_Número_do_Cartão_1_Campo");
var Aviso_de_Inconsistência_Número_do_Cartão_1_Botão = document.getElementById("Aviso_de_Inconsistência_Número_do_Cartão_1_Botão");
var Nome_do_Titular_do_Cartão_1 = document.getElementById("Nome_do_Titular_do_Cartão_1");
var Campo_de_Preenchimento_Mês_Cartão_1 = document.getElementById("Campo_de_Preenchimento_Mês_Cartão_1");
var Campo_de_Preenchimento_Ano_Cartão_1 = document.getElementById("Campo_de_Preenchimento_Ano_Cartão_1");
var Campo_de_Preenchimento_CVV_Cartão_1 = document.getElementById("Campo_de_Preenchimento_CVV_Cartão_1");
var Aviso_de_Inconsistência_CVV_Cartão_1_Campo = document.getElementById("Aviso_de_Inconsistência_CVV_Cartão_1_Campo");
var Aviso_de_Inconsistência_CVV_Cartão_1_Botão = document.getElementById("Aviso_de_Inconsistência_CVV_Cartão_1_Botão");
var Valor_com_Juros_no_Cartão_1_Dígitos;

var Valor_no_Cartão_2 = document.getElementById("Valor_no_Cartão_2");
var Número_de_Parcelas_Cartão_2 = document.getElementById("Número_de_Parcelas_Cartão_2");
var Número_de_Parcelas_Cartão_2_Opção_1 = document.getElementById("Número_de_Parcelas_Cartão_2").options[0];
var Número_de_Parcelas_Cartão_2_Opção_2 = document.getElementById("Número_de_Parcelas_Cartão_2").options[1];
var Número_de_Parcelas_Cartão_2_Opção_3 = document.getElementById("Número_de_Parcelas_Cartão_2").options[2];
var Número_de_Parcelas_Cartão_2_Opção_4 = document.getElementById("Número_de_Parcelas_Cartão_2").options[3];
var Número_de_Parcelas_Cartão_2_Opção_5 = document.getElementById("Número_de_Parcelas_Cartão_2").options[4];
var Número_de_Parcelas_Cartão_2_Opção_6 = document.getElementById("Número_de_Parcelas_Cartão_2").options[5];
var Número_de_Parcelas_Cartão_2_Opção_7 = document.getElementById("Número_de_Parcelas_Cartão_2").options[6];
var Número_de_Parcelas_Cartão_2_Opção_8 = document.getElementById("Número_de_Parcelas_Cartão_2").options[7];
var Número_de_Parcelas_Cartão_2_Opção_9 = document.getElementById("Número_de_Parcelas_Cartão_2").options[8];
var Número_de_Parcelas_Cartão_2_Opção_10 = document.getElementById("Número_de_Parcelas_Cartão_2").options[9];
var Número_de_Parcelas_Cartão_2_Opção_11 = document.getElementById("Número_de_Parcelas_Cartão_2").options[10];
var Número_de_Parcelas_Cartão_2_Opção_12 = document.getElementById("Número_de_Parcelas_Cartão_2").options[11];
var Número_do_Cartão_2 = document.getElementById("Número_do_Cartão_2");
var Aviso_de_Inconsistência_Número_do_Cartão_2_Campo = document.getElementById("Aviso_de_Inconsistência_Número_do_Cartão_2_Campo");
var Aviso_de_Inconsistência_Número_do_Cartão_2_Botão = document.getElementById("Aviso_de_Inconsistência_Número_do_Cartão_2_Botão");
var Nome_do_Titular_do_Cartão_2 = document.getElementById("Nome_do_Titular_do_Cartão_2");
var Campo_de_Preenchimento_Mês_Cartão_2 = document.getElementById("Campo_de_Preenchimento_Mês_Cartão_2");
var Campo_de_Preenchimento_Ano_Cartão_2 = document.getElementById("Campo_de_Preenchimento_Ano_Cartão_2");
var Campo_de_Preenchimento_CVV_Cartão_2 = document.getElementById("Campo_de_Preenchimento_CVV_Cartão_2");
var Aviso_de_Inconsistência_CVV_Cartão_2_Campo = document.getElementById("Aviso_de_Inconsistência_CVV_Cartão_2_Campo");
var Aviso_de_Inconsistência_CVV_Cartão_2_Botão = document.getElementById("Aviso_de_Inconsistência_CVV_Cartão_2_Botão");
var Valor_com_Juros_no_Cartão_2_Dígitos = document.getElementById("Valor_com_Juros_no_Cartão_2_Dígitos");

/* Compra e Rodapé */
var Valor_Produto_Comprado = document.getElementById("Valor_Produto_Comprado");
var Comprar = document.getElementById("Comprar");
var Entre_em_Contato = document.getElementById("Entre_em_Contato");
var Informações_de_Segurança = document.getElementById("Informações_de_Segurança");

/* Variáveis Auxiliares*/
var momento_de_agora_original = new Date();
var configurações_data_de_hoje = { day: '2-digit', month: 'short', year: 'numeric' };
var configurações_momento_de_agora = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'};
var data_de_hoje = momento_de_agora_original.toLocaleDateString('pt-BR', configurações_data_de_hoje).replace(/de/g,'/').replace('.','').replace(/ /g,'');
var momento_de_agora = momento_de_agora_original.toLocaleDateString('pt-BR', configurações_momento_de_agora).replace(/de/g,'/').replace('.','').replace(/ /g,'');

/*///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    Puxa variáveis da página de origem, via localStorage, se o usuário estiver navegando dentro dos Sistemas.
    Caso contrário, processa o Preparatório.
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/


const urlParams = new URLSearchParams(window.location.search);
const origem = urlParams.get("origem");

if (origem === "externa") {

    var data = {
        Variável_Mestra_Valor_Total_do_Serviço_à_Vista: 1990,
        Nome_Produto_Título: "<b> Prep. Gestão Generalista: Contratação Padrão </b>",
        Nome_Produto_Valor: "Preparatório em Gestão Generalista: Contratação Padrão"        
    };

} if (origem === "pessoa-jurídica") {

    var data = {
        Variável_Mestra_Valor_Total_do_Serviço_à_Vista: 2990,
        Nome_Produto_Título: "<b> Prep. Gestão Generalista: Versão Pessoa Jurídica </b>",
        Nome_Produto_Valor: "Preparatório em Gestão Generalista: Contratação PJ"        
    };

} else {

    var data = JSON.parse(localStorage.getItem('Dados-Enviados-ao-Checkout'));

}

/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
                Cria as Variáveis Mestras
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

/*Atenção: Estas são as variáveis mestras do checkout.*/
/*Lembrar que é necessário também alterar / customizar o Contrato de Prestação de Serviços.*/
Nome_Produto.innerHTML = data.Nome_Produto_Título; /* Alterar aqui o Nome do Produto que fica no topo do checkout. */
Nome_Produto.value = data.Nome_Produto_Valor; /* Alterar aqui o Nome do Produto que será processado pela Pagar.Me. */
var Código_do_Produto = "ivyroom";  /* Alterar aqui o Código do Produto que será processado pela Pagar.Me e aparecerá na fatura do cartão do cliente. Máximo de 22 caracteres, sem caracteres especiais. */
var Variável_Mestra_Valor_Total_do_Serviço_à_Vista = parseFloat(data.Variável_Mestra_Valor_Total_do_Serviço_à_Vista); /* Alterar aqui o Valor Total do Produto. Deve ser >= 2x o Valor Mínimo por Tipo de Pagamento*/
var Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento = 100; /* Alterar aqui o Valor Mínimo por Tipo de Pagamento.*/
var Juros_Parcelamento_2x = 1.0376; /* Alterar aqui os Juros para Parcelamento em 2x. */
var Juros_Parcelamento_3x = 1.0503; /* Alterar aqui os Juros para Parcelamento em 3x. */
var Juros_Parcelamento_4x = 1.0632; /* Alterar aqui os Juros para Parcelamento em 4x. */
var Juros_Parcelamento_5x = 1.0760; /* Alterar aqui os Juros para Parcelamento em 5x. */
var Juros_Parcelamento_6x = 1.0890; /* Alterar aqui os Juros para Parcelamento em 6x. */
var Juros_Parcelamento_7x = 1.1018; /* Alterar aqui os Juros para Parcelamento em 7x. */
var Juros_Parcelamento_8x = 1.1152; /* Alterar aqui os Juros para Parcelamento em 8x. */
var Juros_Parcelamento_9x = 1.1286; /* Alterar aqui os Juros para Parcelamento em 9x. */
var Juros_Parcelamento_10x = 1.1420; /* Alterar aqui os Juros para Parcelamento em 10x. */
var Juros_Parcelamento_11x = 1.1550; /* Alterar aqui os Juros para Parcelamento em 11x. */
var Juros_Parcelamento_12x = 1.1688; /* Alterar aqui os Juros para Parcelamento em 12x. */

/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
                Configura a Abertura do HTML
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

/* Faz alterações de abertura no HTML a partir das Variáveis Mestras. */
var configuração_BRL = {style: 'currency', currency: 'BRL'};

Valor_Produto_à_Vista.innerHTML = "<b>" + Variável_Mestra_Valor_Total_do_Serviço_à_Vista.toLocaleString('pt-BR', configuração_BRL) + "</b>";
Valor_Produto_a_Prazo.innerHTML = "ou em até 12x de " + parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista / 12 * Juros_Parcelamento_12x).toLocaleString('pt-BR', configuração_BRL) + "* no cartão";

/*UM_CARTAO*/
Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_2.innerHTML = "1x de " + parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista).toLocaleString('pt-BR', configuração_BRL);
Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_3.innerHTML = "2x de " + parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista / 2 * Juros_Parcelamento_2x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_4.innerHTML = "3x de " + parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista / 3 * Juros_Parcelamento_3x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_5.innerHTML = "4x de " + parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista / 4 * Juros_Parcelamento_4x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_6.innerHTML = "5x de " + parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista / 5 * Juros_Parcelamento_5x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_7.innerHTML = "6x de " + parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista / 6 * Juros_Parcelamento_6x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_8.innerHTML = "7x de " + parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista / 7 * Juros_Parcelamento_7x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_9.innerHTML = "8x de " + parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista / 8 * Juros_Parcelamento_8x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_10.innerHTML = "9x de " + parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista / 9 * Juros_Parcelamento_9x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_11.innerHTML = "10x de " + parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista / 10 * Juros_Parcelamento_10x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_12.innerHTML = "11x de " + parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista / 11 * Juros_Parcelamento_11x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_UM_CARTAO_Opção_13.innerHTML = "12x de " + parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista / 12 * Juros_Parcelamento_12x).toLocaleString('pt-BR', configuração_BRL) + "*";

/*PIX_CARTÃO*/
Valor_no_Cartão_do_PIX_CARTÃO.value = parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento).toLocaleString('pt-BR', configuração_BRL);
Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos = Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$","").trim().replace(".","").replace(",","");
Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_1.innerHTML = "1x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento).toLocaleString('pt-BR', configuração_BRL);
Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_2.innerHTML = "2x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 2 * Juros_Parcelamento_2x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_3.innerHTML = "3x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 3 * Juros_Parcelamento_3x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_4.innerHTML = "4x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 4 * Juros_Parcelamento_4x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_5.innerHTML = "5x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 5 * Juros_Parcelamento_5x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_6.innerHTML = "6x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 6 * Juros_Parcelamento_6x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_7.innerHTML = "7x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 7 * Juros_Parcelamento_7x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_8.innerHTML = "8x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 8 * Juros_Parcelamento_8x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_9.innerHTML = "9x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 9 * Juros_Parcelamento_9x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_10.innerHTML = "10x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 10 * Juros_Parcelamento_10x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_11.innerHTML = "11x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 11 * Juros_Parcelamento_11x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_12.innerHTML = "12x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 12 * Juros_Parcelamento_12x).toLocaleString('pt-BR', configuração_BRL) + "*";
Valor_no_PIX_do_PIX_CARTÃO.value = parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento).toLocaleString('pt-BR', configuração_BRL);

/*DOIS_CARTOES*/
Valor_no_Cartão_1.value = parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento).toLocaleString('pt-BR', configuração_BRL);
Valor_com_Juros_no_Cartão_1_Dígitos = Valor_no_Cartão_1.value.replace("R$","").trim().replace(".","").replace(",","");
Número_de_Parcelas_Cartão_1_Opção_1.innerHTML = "1x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento).toLocaleString('pt-BR', configuração_BRL);
Número_de_Parcelas_Cartão_1_Opção_2.innerHTML = "2x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 2 * Juros_Parcelamento_2x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_1_Opção_3.innerHTML = "3x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 3 * Juros_Parcelamento_3x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_1_Opção_4.innerHTML = "4x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 4 * Juros_Parcelamento_4x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_1_Opção_5.innerHTML = "5x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 5 * Juros_Parcelamento_5x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_1_Opção_6.innerHTML = "6x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 6 * Juros_Parcelamento_6x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_1_Opção_7.innerHTML = "7x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 7 * Juros_Parcelamento_7x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_1_Opção_8.innerHTML = "8x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 8 * Juros_Parcelamento_8x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_1_Opção_9.innerHTML = "9x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 9 * Juros_Parcelamento_9x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_1_Opção_10.innerHTML = "10x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 10 * Juros_Parcelamento_10x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_1_Opção_11.innerHTML = "11x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 11 * Juros_Parcelamento_11x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_1_Opção_12.innerHTML = "12x de " + parseFloat(Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento / 12 * Juros_Parcelamento_12x).toLocaleString('pt-BR', configuração_BRL) + "*";

Valor_no_Cartão_2.value = parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento).toLocaleString('pt-BR', configuração_BRL);
Valor_com_Juros_no_Cartão_2_Dígitos = Valor_no_Cartão_2.value.replace("R$","").trim().replace(".","").replace(",","");
Número_de_Parcelas_Cartão_2_Opção_1.innerHTML = "1x de " + parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento).toLocaleString('pt-BR', configuração_BRL);
Número_de_Parcelas_Cartão_2_Opção_2.innerHTML = "2x de " + parseFloat((Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento) / 2 * Juros_Parcelamento_2x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_2_Opção_3.innerHTML = "3x de " + parseFloat((Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento) / 3 * Juros_Parcelamento_3x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_2_Opção_4.innerHTML = "4x de " + parseFloat((Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento) / 4 * Juros_Parcelamento_4x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_2_Opção_5.innerHTML = "5x de " + parseFloat((Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento) / 5 * Juros_Parcelamento_5x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_2_Opção_6.innerHTML = "6x de " + parseFloat((Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento) / 6 * Juros_Parcelamento_6x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_2_Opção_7.innerHTML = "7x de " + parseFloat((Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento) / 7 * Juros_Parcelamento_7x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_2_Opção_8.innerHTML = "8x de " + parseFloat((Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento) / 8 * Juros_Parcelamento_8x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_2_Opção_9.innerHTML = "9x de " + parseFloat((Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento) / 9 * Juros_Parcelamento_9x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_2_Opção_10.innerHTML = "10x de " + parseFloat((Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento) / 10 * Juros_Parcelamento_10x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_2_Opção_11.innerHTML = "11x de " + parseFloat((Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento) / 11 * Juros_Parcelamento_11x).toLocaleString('pt-BR', configuração_BRL) + "*";
Número_de_Parcelas_Cartão_2_Opção_12.innerHTML = "12x de " + parseFloat((Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento) / 12 * Juros_Parcelamento_12x).toLocaleString('pt-BR', configuração_BRL) + "*";

/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
            Configura os Campos de Dados Pessoais
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

/*Configura a digitação do NomeCompleto para:
a) Não permitir qualquer caracter que não seja " " ou letras. 
b) Não permitir que o último caracter seja " ".*/

NomeCompleto.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight") {
        return;
    }

    if (/\d/.test(event.key)) {
        event.preventDefault();
    }

})

NomeCompleto.addEventListener("change", function() {

    NomeCompleto.value = NomeCompleto.value.replace(/\s+$/, "");

})

/*Confirmação de Email:
a) Não permite que o último caracter do Email_do_Cliente e do Confirmação_do_Email_do_Cliente sejam " ".
b) Coloca e retira o alerta de inconsistência embaixo do campo de confirmação;
c) Coloca e retira o alerta de inconsistência embaixo do botão de compra;
d) Desabilita e habilita o botão de compra; */

Email_do_Cliente.addEventListener("blur", function() {
    
    Email_do_Cliente.value = Email_do_Cliente.value.replace(/\s+$/, "");

    if (Email_do_Cliente.value == Confirmação_do_Email_do_Cliente.value) {
        Aviso_de_Inconsistência_Email_Campo.style.display = "none";
        Aviso_de_Inconsistência_Email_Botão.style.display = "none";
        Comprar.disabled = false;
    } else {
        Aviso_de_Inconsistência_Email_Campo.style.display = "block";
        Aviso_de_Inconsistência_Email_Botão.style.display = "block";
        Comprar.disabled = true;
    }

})

Confirmação_do_Email_do_Cliente.addEventListener("blur", function() {

    Confirmação_do_Email_do_Cliente.value = Confirmação_do_Email_do_Cliente.value.replace(/\s+$/, "");

    if (Confirmação_do_Email_do_Cliente.value.endsWith(" ")) {
        Confirmação_do_Email_do_Cliente.value = Confirmação_do_Email_do_Cliente.value.slice(0, -1);
    }

    if (Email_do_Cliente.value == Confirmação_do_Email_do_Cliente.value) {
        Aviso_de_Inconsistência_Email_Campo.style.display = "none";
        Aviso_de_Inconsistência_Email_Botão.style.display = "none";
        Comprar.disabled = false;
    } else {
        Aviso_de_Inconsistência_Email_Campo.style.display = "block";
        Aviso_de_Inconsistência_Email_Botão.style.display = "block";
        Comprar.disabled = true;
    }

})

/*Configura a digitação do CPF para:
a) Não pertmitir o "autocomplete".
b) Não permitir espaços e qualquer caracter que não seja ".", "-" ou números.
c) Adiciona os "." e o "-".
d) Coloca e retira o alerta de inconsistência embaixo do campo;
e) Coloca e retira o alerta de inconsistência embaixo do botão de compra;
f) Desabilita e habilita o botão de compra; */

Campo_de_Preenchimento_CPF.setAttribute('autocomplete', 'off');

Campo_de_Preenchimento_CPF.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }
    
    if (event.key === " ") {
        event.preventDefault();
        return;
    }

    if (event.key != "-" && event.key != "." && isNaN(Number(event.key))) {
    event.preventDefault();
    }

    let Campo_de_Preenchimento_CPF_Tamanho = Campo_de_Preenchimento_CPF.value.length
    
    if (Campo_de_Preenchimento_CPF_Tamanho == 3 || Campo_de_Preenchimento_CPF_Tamanho == 7) {
        Campo_de_Preenchimento_CPF.value += '.'  
    } else if (Campo_de_Preenchimento_CPF_Tamanho == 11){
        Campo_de_Preenchimento_CPF.value += '-'
    }

})

Campo_de_Preenchimento_CPF.addEventListener("blur", function() {
    
    if (Campo_de_Preenchimento_CPF.value.length == 14) {
        Aviso_de_Inconsistência_CPF_Campo.style.display = "none";
        Aviso_de_Inconsistência_CPF_Botão.style.display = "none";
        Comprar.disabled = false;
    } else {
        Aviso_de_Inconsistência_CPF_Campo.style.display = "block";
        Aviso_de_Inconsistência_CPF_Botão.style.display = "block";
        Comprar.disabled = true;
    }
})

/*Configura a digitação do DDD do Número do Celular para:
a) Não pertmitir o "autocomplete".
b) Não permitir espaços e qualquer caracter que não sejam números.*/

Campo_de_Preenchimento_DDD.setAttribute('autocomplete', 'off');

Campo_de_Preenchimento_DDD.addEventListener("keydown", function(event) {
    
    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }
    
    if (event.key === " ") {
        event.preventDefault();
        return;
    }

    if (isNaN(Number(event.key))) {
    event.preventDefault();
    }

})

/*Configura a digitação do Número do Celular para:
a) Não pertmitir o "autocomplete".
b) Não permitir espaços e qualquer caracter que não seja "-" ou números.
c) Adiciona o "-" na sexta posição */

Campo_de_Preenchimento_Celular.setAttribute('autocomplete', 'off');

Campo_de_Preenchimento_Celular.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }
    
    if (event.key === " ") {
        event.preventDefault();
        return;
    }

    if (event.key != "-" && isNaN(Number(event.key))) {
    event.preventDefault();
    }

    let Campo_de_Preenchimento_Celular_Tamanho = Campo_de_Preenchimento_Celular.value.length
    
    if (Campo_de_Preenchimento_Celular_Tamanho == 5) {
        Campo_de_Preenchimento_Celular.value += '-'  
    }
})


/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
                Configura os Campos de Endereço
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/


/*Configura a digitação do Endereço_Rua para:
a) Não permitir que o último caracter seja " ".*/

Endereço_Rua.addEventListener("change", function() {

    Endereço_Rua.value = Endereço_Rua.value.replace(/\s+$/, "");

})

/*Configura a digitação Endereço_Número para:
a) Não permitir espaços e qualquer caracter que não sejam números.*/

Endereço_Número.addEventListener("keydown", function(event) {
    
    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }
    
    if (event.key === " ") {
        event.preventDefault();
        return;
    }

    if (isNaN(Number(event.key))) {
    event.preventDefault();
    }

});

/*Configura a digitação do Endereço_Complemento para:
a) Não permitir que o último caracter seja " ".*/

Endereço_Complemento.addEventListener("change", function() {

    Endereço_Complemento.value = Endereço_Complemento.value.replace(/\s+$/, "");

})

/*Configura a digitação do Endereço_Bairro para:
a) Não permitir que o último caracter seja " ".*/

Endereço_Bairro.addEventListener("change", function() {

    Endereço_Bairro.value = Endereço_Bairro.value.replace(/\s+$/, "");

})

/*Configura a digitação do Endereço_Cidade para:
a) Não permitir que o último caracter seja " ".*/

Endereço_Cidade.addEventListener("change", function() {

    Endereço_Cidade.value = Endereço_Cidade .value.replace(/\s+$/, "");

})


/*Configura a digitação do Endereço_Cidade para:
a) Não permitir qualquer caracter que não seja " " ou letras. */

Endereço_Cidade.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }

    if (/\d/.test(event.key)) {
        event.preventDefault();
      }

})

/*Muda a cor do campo Endereço_Estado para preto, após as seleções serem feitas.*/
Endereço_Estado.addEventListener("change", function(event) {
    Endereço_Estado.style.color = "black";
})

/*Configura a digitação do CEP para:
a) Não permitir o "autocomplete".
b) Não permitir espaços e qualquer caracter que não seja "-" ou números.
c) Adiciona o "-" na sexta posição.
d) Coloca e retira o alerta de inconsistência embaixo do campo;
e) Coloca e retira o alerta de inconsistência embaixo do botão de compra;
f) Desabilita e habilita o botão de compra; */

Endereço_CEP.setAttribute('autocomplete', 'off');

Endereço_CEP.addEventListener("keydown", function(event) {
    
    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }
    
    if (event.key === " ") {
        event.preventDefault();
        return;
    }

    if (event.key != "-" && event.key != "." && isNaN(Number(event.key))) {
    event.preventDefault();
    }

    let Endereço_CEP_Tamanho = Endereço_CEP.value.length

    if (Endereço_CEP_Tamanho == 5) {
        Endereço_CEP.value += '-'  
    }

});

Endereço_CEP.addEventListener("blur", function() {
    
    if (Endereço_CEP.value.length == 9) {
        Aviso_de_Inconsistência_CEP_Campo.style.display = "none";
        Aviso_de_Inconsistência_CEP_Botão.style.display = "none";
        Comprar.disabled = false;
    } else {
        Aviso_de_Inconsistência_CEP_Campo.style.display = "block";
        Aviso_de_Inconsistência_CEP_Botão.style.display = "block";
        Comprar.disabled = true;
    }
})


/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
            Configura os Botões de Tipo de Pagamento
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

/*////////////////////// 
    Botão UM CARTÃO 
//////////////////////*/

Tipo_de_Pagamento_UM_CARTAO.addEventListener("click", () => {
    
    /*/////// Define o Tipo de Pagamento Escolhido ////////*/ 
    Tipo_de_Pagamento_Escolhido = "UM_CARTAO";
    
    /*/////// Layout ////////*/        

    /*Muda o layout do botão clicado.*/
    Tipo_de_Pagamento_UM_CARTAO.style.border = "2px solid #790d26";
    Tipo_de_Pagamento_UM_CARTAO.style.backgroundColor = " #ffebef";

    /*Muda o layout dos demais botões.*/
    Tipo_de_Pagamento_PIX.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_PIX.style.backgroundColor = " #ffffff";

    Tipo_de_Pagamento_BOLETO.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_BOLETO.style.backgroundColor = " #ffffff";

    Tipo_de_Pagamento_PIX_CARTAO.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_PIX_CARTAO.style.backgroundColor = " #ffffff";

    Tipo_de_Pagamento_DOIS_CARTOES.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_DOIS_CARTOES.style.backgroundColor = " #ffffff";


    /*/////// Configuração dos Dados de Pagamento ////////*/

    /*Aciona os dados de pagamento relativos ao botão clicado.*/
   
    Dados_Pagamento_UM_CARTAO.style.display = "block";
    
        Número_do_Cartão.required = true;
        Nome_do_Titular_do_Cartão.required = true;
        Campo_de_Preenchimento_Mês_Cartão.required = true;
        Campo_de_Preenchimento_Ano_Cartão.required = true;
        Campo_de_Preenchimento_CVV_Cartão.required = true;
        Número_de_Parcelas_Cartão_do_UM_CARTAO.required = true;

    Valor_Produto_Comprado.innerHTML = "-";

    /*Desaciona os dados de pagamento relativos aos demais botões.*/
    
    Dados_Pagamento_PIX.style.display = "none";

    Dados_Pagamento_BOLETO.style.display = "none";

    Dados_Pagamento_PIX_CARTAO.style.display = "none";

        Valor_no_Cartão_do_PIX_CARTÃO.required = false;
        Número_de_Parcelas_Cartão_do_PIX_CARTÃO.required = false;
        Número_do_Cartão_do_PIX_CARTÃO.required = false;
        Nome_do_Titular_do_Cartão_do_PIX_CARTÃO.required = false; 
        Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.required = false;
        Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.required = false;
        Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO.required = false;

    Container_Dados_Pagamento_DOIS_CARTOES.style.display = "none";

        Valor_no_Cartão_1.required = false;
        Número_de_Parcelas_Cartão_1.required = false;
        Número_do_Cartão_1.required = false;
        Nome_do_Titular_do_Cartão_1.required = false;
        Campo_de_Preenchimento_Mês_Cartão_1.required = false;
        Campo_de_Preenchimento_Ano_Cartão_1.required = false;
        Campo_de_Preenchimento_CVV_Cartão_1.required = false;
        
        Número_de_Parcelas_Cartão_2.required = false;
        Número_do_Cartão_2.required = false;
        Nome_do_Titular_do_Cartão_2.required = false;
        Campo_de_Preenchimento_Mês_Cartão_2.required = false;
        Campo_de_Preenchimento_Ano_Cartão_2.required = false;
        Campo_de_Preenchimento_CVV_Cartão_2.required = false;

    /*/////// Reseta os Campos Internos, Avisos de Inconsistência e Desabilitação do Botão de Compra dos Dados de Pagamento ////////*/
    
    /*PIX_CARTAO*/
    Valor_no_Cartão_do_PIX_CARTÃO.value = "";
    configura_valor_e_parcelas_do_PIX_CARTÃO ();
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO.value = "1"; 
    Número_do_Cartão_do_PIX_CARTÃO.value = "";
    Nome_do_Titular_do_Cartão_do_PIX_CARTÃO.value = "";
    Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.value = "";
    Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.value = "";
    Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO.value = "";

    Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Botão.style.display = "none";
    Comprar.disabled = false;

    /*DOIS_CARTOES*/
    Valor_no_Cartão_1.value = "";
    configura_valores_e_parcelas_do_DOIS_CARTOES ();
    Número_de_Parcelas_Cartão_1.value = "1";  
    Número_do_Cartão_1.value = "";
    Nome_do_Titular_do_Cartão_1.value = "";
    Campo_de_Preenchimento_Mês_Cartão_1.value = "";
    Campo_de_Preenchimento_Mês_Cartão_1.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão_1.value = "";
    Campo_de_Preenchimento_Ano_Cartão_1.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão_1.value = "";

    Número_de_Parcelas_Cartão_2.value = "1";
    Número_do_Cartão_2.value = "";
    Nome_do_Titular_do_Cartão_2.value = "";
    Campo_de_Preenchimento_Mês_Cartão_2.value = "";
    Campo_de_Preenchimento_Mês_Cartão_2.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão_2.value = "";
    Campo_de_Preenchimento_Ano_Cartão_2.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão_2.value = "";

    Aviso_de_Inconsistência_Número_do_Cartão_1_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_1_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_1_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_1_Botão.style.display = "none";

    Aviso_de_Inconsistência_Número_do_Cartão_2_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_2_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_2_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_2_Botão.style.display = "none";

    Comprar.disabled = false;

    /*/////// Configuração do Botão de Compra ////////*/

    /*Atualiza o texto do botão de compra.*/
    Comprar.innerText = "Comprar";

})


/*////////////////////// 
        Botão PIX 
//////////////////////*/

Tipo_de_Pagamento_PIX.addEventListener("click", () => {
    
    /*/////// Define o Tipo de Pagamento Escolhido ////////*/ 
    Tipo_de_Pagamento_Escolhido = "PIX";

    /*/////// Layout ////////*/
    
    /*Muda o layout do botão clicado.*/
    Tipo_de_Pagamento_PIX.style.border = "2px solid #790d26";
    Tipo_de_Pagamento_PIX.style.backgroundColor = " #ffebef";

    /*Muda o layout dos demais botões.*/
    Tipo_de_Pagamento_UM_CARTAO.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_UM_CARTAO.style.backgroundColor = " #ffffff";

    Tipo_de_Pagamento_BOLETO.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_BOLETO.style.backgroundColor = " #ffffff";

    Tipo_de_Pagamento_PIX_CARTAO.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_PIX_CARTAO.style.backgroundColor = " #ffffff";

    Tipo_de_Pagamento_DOIS_CARTOES.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_DOIS_CARTOES.style.backgroundColor = " #ffffff";

    /*/////// Configuração dos Dados de Pagamento ////////*/

    /*Aciona os dados de pagamento relativos ao botão clicado.*/
    Dados_Pagamento_PIX.style.display = "block";

    Valor_Produto_Comprado.innerHTML = parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista).toLocaleString('pt-BR', configuração_BRL);

    /*Desaciona os dados de pagamento relativos aos demais botões.*/
    Dados_Pagamento_UM_CARTAO.style.display = "none";

        Número_do_Cartão.required = false;
        Nome_do_Titular_do_Cartão.required = false;
        Campo_de_Preenchimento_Mês_Cartão.required = false;
        Campo_de_Preenchimento_Ano_Cartão.required = false;
        Campo_de_Preenchimento_CVV_Cartão.required = false;
        Número_de_Parcelas_Cartão_do_UM_CARTAO.required = false;

    Dados_Pagamento_BOLETO.style.display = "none";

    Dados_Pagamento_PIX_CARTAO.style.display = "none";

        Valor_no_Cartão_do_PIX_CARTÃO.required = false;
        Número_de_Parcelas_Cartão_do_PIX_CARTÃO.required = false;
        Número_do_Cartão_do_PIX_CARTÃO.required = false;
        Nome_do_Titular_do_Cartão_do_PIX_CARTÃO.required = false; 
        Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.required = false;
        Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.required = false;
        Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO.required = false;

    Container_Dados_Pagamento_DOIS_CARTOES.style.display = "none";

        Valor_no_Cartão_1.required = false;
        Número_de_Parcelas_Cartão_1.required = false;
        Número_do_Cartão_1.required = false;
        Nome_do_Titular_do_Cartão_1.required = false;
        Campo_de_Preenchimento_Mês_Cartão_1.required = false;
        Campo_de_Preenchimento_Ano_Cartão_1.required = false;
        Campo_de_Preenchimento_CVV_Cartão_1.required = false;
        
        Número_de_Parcelas_Cartão_2.required = false;
        Número_do_Cartão_2.required = false;
        Nome_do_Titular_do_Cartão_2.required = false;
        Campo_de_Preenchimento_Mês_Cartão_2.required = false;
        Campo_de_Preenchimento_Ano_Cartão_2.required = false;
        Campo_de_Preenchimento_CVV_Cartão_2.required = false;

    /*/////// Reseta os Campos Internos, Avisos de Inconsistência e Desabilitação do Botão de Compra dos Dados de Pagamento ////////*/
    
    /*UM_CARTAO*/
    Número_do_Cartão.value = "";
    Nome_do_Titular_do_Cartão.value = "";
    Campo_de_Preenchimento_Mês_Cartão.value = "";
    Campo_de_Preenchimento_Mês_Cartão.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão.value = "";
    Campo_de_Preenchimento_Ano_Cartão.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão.value = "";
    Número_de_Parcelas_Cartão_do_UM_CARTAO.value = "";
    Número_de_Parcelas_Cartão_do_UM_CARTAO.style.color = "rgb(128, 128, 128)";

    Aviso_de_Inconsistência_Número_do_Cartão_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_Botão.style.display = "none";
    Comprar.disabled = false;

    /*PIX_CARTAO*/
    Valor_no_Cartão_do_PIX_CARTÃO.value = "";
    configura_valor_e_parcelas_do_PIX_CARTÃO ();
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO.value = "1"; 
    Número_do_Cartão_do_PIX_CARTÃO.value = "";
    Nome_do_Titular_do_Cartão_do_PIX_CARTÃO.value = "";
    Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.value = "";
    Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.value = "";
    Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO.value = "";

    Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Botão.style.display = "none";
    Comprar.disabled = false;

    /*DOIS_CARTOES*/
    Valor_no_Cartão_1.value = "";
    configura_valores_e_parcelas_do_DOIS_CARTOES ();
    Número_de_Parcelas_Cartão_1.value = "1";  
    Número_do_Cartão_1.value = "";
    Nome_do_Titular_do_Cartão_1.value = "";
    Campo_de_Preenchimento_Mês_Cartão_1.value = "";
    Campo_de_Preenchimento_Mês_Cartão_1.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão_1.value = "";
    Campo_de_Preenchimento_Ano_Cartão_1.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão_1.value = "";

    Número_de_Parcelas_Cartão_2.value = "1";
    Número_do_Cartão_2.value = "";
    Nome_do_Titular_do_Cartão_2.value = "";
    Campo_de_Preenchimento_Mês_Cartão_2.value = "";
    Campo_de_Preenchimento_Mês_Cartão_2.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão_2.value = "";
    Campo_de_Preenchimento_Ano_Cartão_2.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão_2.value = "";

    Aviso_de_Inconsistência_Número_do_Cartão_1_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_1_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_1_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_1_Botão.style.display = "none";

    Aviso_de_Inconsistência_Número_do_Cartão_2_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_2_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_2_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_2_Botão.style.display = "none";

    Comprar.disabled = false;

    /*/////// Configuração do Botão de Compra ////////*/

    /*Atualiza o texto do botão de compra.*/
    Comprar.innerText = "Gerar PIX";

})


/*////////////////////// 
      Botão BOLETO 
//////////////////////*/

Tipo_de_Pagamento_BOLETO.addEventListener("click", () => {
    
    /*/////// Define o Tipo de Pagamento Escolhido ////////*/ 
    Tipo_de_Pagamento_Escolhido = "BOLETO";

    /*/////// Layout ////////*/        
    
    /*Muda o layout do botão clicado.*/
    Tipo_de_Pagamento_BOLETO.style.border = "2px solid #790d26";
    Tipo_de_Pagamento_BOLETO.style.backgroundColor = " #ffebef";

    /*Muda o layout dos demais botões.*/
    Tipo_de_Pagamento_UM_CARTAO.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_UM_CARTAO.style.backgroundColor = " #ffffff";

    Tipo_de_Pagamento_PIX.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_PIX.style.backgroundColor = " #ffffff";

    Tipo_de_Pagamento_PIX_CARTAO.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_PIX_CARTAO.style.backgroundColor = " #ffffff";

    Tipo_de_Pagamento_DOIS_CARTOES.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_DOIS_CARTOES.style.backgroundColor = " #ffffff";


    /*/////// Configuração dos Dados de Pagamento ////////*/

    /*Aciona os dados de pagamento relativos ao botão clicado.*/
    Dados_Pagamento_BOLETO.style.display = "block";
    
    Valor_Produto_Comprado.innerHTML = parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista).toLocaleString('pt-BR', configuração_BRL);

    /*Desaciona os dados de pagamento relativos aos demais botões.*/
    Dados_Pagamento_UM_CARTAO.style.display = "none";

        Número_do_Cartão.required = false;
        Nome_do_Titular_do_Cartão.required = false;
        Campo_de_Preenchimento_Mês_Cartão.required = false;
        Campo_de_Preenchimento_Ano_Cartão.required = false;
        Campo_de_Preenchimento_CVV_Cartão.required = false;
        Número_de_Parcelas_Cartão_do_UM_CARTAO.required = false;

    Dados_Pagamento_PIX.style.display = "none";

    Dados_Pagamento_PIX_CARTAO.style.display = "none";

        Valor_no_Cartão_do_PIX_CARTÃO.required = false;
        Número_de_Parcelas_Cartão_do_PIX_CARTÃO.required = false;
        Número_do_Cartão_do_PIX_CARTÃO.required = false;
        Nome_do_Titular_do_Cartão_do_PIX_CARTÃO.required = false; 
        Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.required = false;
        Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.required = false;
        Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO.required = false;
    
    Container_Dados_Pagamento_DOIS_CARTOES.style.display = "none";

        Valor_no_Cartão_1.required = false;
        Número_de_Parcelas_Cartão_1.required = false;
        Número_do_Cartão_1.required = false;
        Nome_do_Titular_do_Cartão_1.required = false;
        Campo_de_Preenchimento_Mês_Cartão_1.required = false;
        Campo_de_Preenchimento_Ano_Cartão_1.required = false;
        Campo_de_Preenchimento_CVV_Cartão_1.required = false;
        
        Número_de_Parcelas_Cartão_2.required = false;
        Número_do_Cartão_2.required = false;
        Nome_do_Titular_do_Cartão_2.required = false;
        Campo_de_Preenchimento_Mês_Cartão_2.required = false;
        Campo_de_Preenchimento_Ano_Cartão_2.required = false;
        Campo_de_Preenchimento_CVV_Cartão_2.required = false;

    /*/////// Reseta os Campos Internos, Avisos de Inconsistência e Desabilitação do Botão de Compra dos Dados de Pagamento ////////*/
    
    /*UM_CARTÃO*/
    Número_do_Cartão.value = "";
    Nome_do_Titular_do_Cartão.value = "";
    Campo_de_Preenchimento_Mês_Cartão.value = "";
    Campo_de_Preenchimento_Mês_Cartão.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão.value = "";
    Campo_de_Preenchimento_Ano_Cartão.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão.value = "";
    Número_de_Parcelas_Cartão_do_UM_CARTAO.value = "";
    Número_de_Parcelas_Cartão_do_UM_CARTAO.style.color = "rgb(128, 128, 128)";

    Aviso_de_Inconsistência_Número_do_Cartão_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_Botão.style.display = "none";
    Comprar.disabled = false;

    /*PIX_CARTAO*/
    Valor_no_Cartão_do_PIX_CARTÃO.value = "";
    configura_valor_e_parcelas_do_PIX_CARTÃO ();
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO.value = "1"; 
    Número_do_Cartão_do_PIX_CARTÃO.value = "";
    Nome_do_Titular_do_Cartão_do_PIX_CARTÃO.value = "";
    Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.value = "";
    Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.value = "";
    Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO.value = "";

    Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Botão.style.display = "none";
    Comprar.disabled = false;

    /*DOIS_CARTOES*/
    Valor_no_Cartão_1.value = "";
    configura_valores_e_parcelas_do_DOIS_CARTOES ();
    Número_de_Parcelas_Cartão_1.value = "1";  
    Número_do_Cartão_1.value = "";
    Nome_do_Titular_do_Cartão_1.value = "";
    Campo_de_Preenchimento_Mês_Cartão_1.value = "";
    Campo_de_Preenchimento_Mês_Cartão_1.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão_1.value = "";
    Campo_de_Preenchimento_Ano_Cartão_1.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão_1.value = "";

    Número_de_Parcelas_Cartão_2.value = "1";
    Número_do_Cartão_2.value = "";
    Nome_do_Titular_do_Cartão_2.value = "";
    Campo_de_Preenchimento_Mês_Cartão_2.value = "";
    Campo_de_Preenchimento_Mês_Cartão_2.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão_2.value = "";
    Campo_de_Preenchimento_Ano_Cartão_2.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão_2.value = "";

    Aviso_de_Inconsistência_Número_do_Cartão_1_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_1_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_1_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_1_Botão.style.display = "none";

    Aviso_de_Inconsistência_Número_do_Cartão_2_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_2_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_2_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_2_Botão.style.display = "none";

    Comprar.disabled = false;

    /*/////// Configuração do Botão de Compra ////////*/

    /*Atualiza o texto do botão de compra.*/
    Comprar.innerText = "Gerar Boleto";

})



/*////////////////////// 
    Botão PIX_CARTAO 
//////////////////////*/

Tipo_de_Pagamento_PIX_CARTAO.addEventListener("click", () => {

    /*/////// Define o Tipo de Pagamento Escolhido ////////*/ 
    Tipo_de_Pagamento_Escolhido = "PIX_CARTAO";

    /*/////// Layout ////////*/        

    /*Muda o layout do botão clicado.*/
    Tipo_de_Pagamento_PIX_CARTAO.style.border = "2px solid #790d26";
    Tipo_de_Pagamento_PIX_CARTAO.style.backgroundColor = " #ffebef";

    /*Muda o layout dos demais botões.*/
    Tipo_de_Pagamento_UM_CARTAO.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_UM_CARTAO.style.backgroundColor = " #ffffff";

    Tipo_de_Pagamento_PIX.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_PIX.style.backgroundColor = " #ffffff";

    Tipo_de_Pagamento_BOLETO.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_BOLETO.style.backgroundColor = " #ffffff";

    Tipo_de_Pagamento_DOIS_CARTOES.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_DOIS_CARTOES.style.backgroundColor = " #ffffff";

    /*/////// Configuração dos Dados de Pagamento ////////*/

    /*Aciona os dados de pagamento relativos ao botão clicado.*/
    Dados_Pagamento_PIX_CARTAO.style.display = "block";

        Valor_no_Cartão_do_PIX_CARTÃO.required = true;
        Número_de_Parcelas_Cartão_do_PIX_CARTÃO.required = true;
        Número_do_Cartão_do_PIX_CARTÃO.required = true;
        Nome_do_Titular_do_Cartão_do_PIX_CARTÃO.required = true; 
        Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.required = true;
        Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.required = true;
        Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO.required = true;

    Valor_Produto_Comprado.innerHTML = Número_de_Parcelas_Cartão_do_PIX_CARTÃO.options[Número_de_Parcelas_Cartão_do_PIX_CARTÃO.selectedIndex].text + " + " + Valor_no_PIX_do_PIX_CARTÃO.value;

    /*Desaciona os dados de pagamento relativos aos demais botões.*/
    Dados_Pagamento_UM_CARTAO.style.display = "none";

        Número_do_Cartão.required = false;
        Nome_do_Titular_do_Cartão.required = false;
        Campo_de_Preenchimento_Mês_Cartão.required = false;
        Campo_de_Preenchimento_Ano_Cartão.required = false;
        Campo_de_Preenchimento_CVV_Cartão.required = false;
        Número_de_Parcelas_Cartão_do_UM_CARTAO.required = false;

    Dados_Pagamento_PIX.style.display = "none";

    Dados_Pagamento_BOLETO.style.display = "none";

    Container_Dados_Pagamento_DOIS_CARTOES.style.display = "none";

        Valor_no_Cartão_1.required = false;
        Número_de_Parcelas_Cartão_1.required = false;
        Número_do_Cartão_1.required = false;
        Nome_do_Titular_do_Cartão_1.required = false;
        Campo_de_Preenchimento_Mês_Cartão_1.required = false;
        Campo_de_Preenchimento_Ano_Cartão_1.required = false;
        Campo_de_Preenchimento_CVV_Cartão_1.required = false;
        
        Número_de_Parcelas_Cartão_2.required = false;
        Número_do_Cartão_2.required = false;
        Nome_do_Titular_do_Cartão_2.required = false;
        Campo_de_Preenchimento_Mês_Cartão_2.required = false;
        Campo_de_Preenchimento_Ano_Cartão_2.required = false;
        Campo_de_Preenchimento_CVV_Cartão_2.required = false;

    /*/////// Reseta os Campos Internos, Avisos de Inconsistência e Desabilitação do Botão de Compra dos Dados de Pagamento ////////*/
    
    /*UM_CARTÃO*/
    Número_do_Cartão.value = "";
    Nome_do_Titular_do_Cartão.value = "";
    Campo_de_Preenchimento_Mês_Cartão.value = "";
    Campo_de_Preenchimento_Mês_Cartão.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão.value = "";
    Campo_de_Preenchimento_Ano_Cartão.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão.value = "";
    Número_de_Parcelas_Cartão_do_UM_CARTAO.value = "";
    Número_de_Parcelas_Cartão_do_UM_CARTAO.style.color = "rgb(128, 128, 128)";

    Aviso_de_Inconsistência_Número_do_Cartão_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_Botão.style.display = "none";
    Comprar.disabled = false;

    /*DOIS_CARTOES*/
    Valor_no_Cartão_1.value = "";
    configura_valores_e_parcelas_do_DOIS_CARTOES ();
    Número_de_Parcelas_Cartão_1.value = "1";  
    Número_do_Cartão_1.value = "";
    Nome_do_Titular_do_Cartão_1.value = "";
    Campo_de_Preenchimento_Mês_Cartão_1.value = "";
    Campo_de_Preenchimento_Mês_Cartão_1.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão_1.value = "";
    Campo_de_Preenchimento_Ano_Cartão_1.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão_1.value = "";

    Número_de_Parcelas_Cartão_2.value = "1";
    Número_do_Cartão_2.value = "";
    Nome_do_Titular_do_Cartão_2.value = "";
    Campo_de_Preenchimento_Mês_Cartão_2.value = "";
    Campo_de_Preenchimento_Mês_Cartão_2.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão_2.value = "";
    Campo_de_Preenchimento_Ano_Cartão_2.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão_2.value = "";

    Aviso_de_Inconsistência_Número_do_Cartão_1_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_1_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_1_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_1_Botão.style.display = "none";

    Aviso_de_Inconsistência_Número_do_Cartão_2_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_2_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_2_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_2_Botão.style.display = "none";

    Comprar.disabled = false;

    /*/////// Configuração do Botão de Compra ////////*/

    /*Atualiza o texto do botão de compra.*/
    Comprar.innerText = "Comprar";

})


/*////////////////////// 
   Botão DOIS_CARTOES
//////////////////////*/

Tipo_de_Pagamento_DOIS_CARTOES.addEventListener("click", () => {
    
    /*/////// Define o Tipo de Pagamento Escolhido ////////*/ 
    Tipo_de_Pagamento_Escolhido = "DOIS_CARTOES";

    /*/////// Layout ////////*/        

    /*Muda o layout do botão clicado.*/
    Tipo_de_Pagamento_DOIS_CARTOES.style.border = "2px solid #790d26";
    Tipo_de_Pagamento_DOIS_CARTOES.style.backgroundColor = " #ffebef";

    /*Muda o layout dos demais botões.*/
    Tipo_de_Pagamento_UM_CARTAO.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_UM_CARTAO.style.backgroundColor = " #ffffff";

    Tipo_de_Pagamento_PIX.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_PIX.style.backgroundColor = " #ffffff";

    Tipo_de_Pagamento_BOLETO.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_BOLETO.style.backgroundColor = " #ffffff";

    Tipo_de_Pagamento_PIX_CARTAO.style.border = "1px solid rgb(146, 146, 146)";
    Tipo_de_Pagamento_PIX_CARTAO.style.backgroundColor = " #ffffff";

    /*/////// Configuração dos Dados de Pagamento ////////*/

    /*Aciona os dados de pagamento relativos ao botão clicado.*/
    
    Container_Dados_Pagamento_DOIS_CARTOES.style.display = "inline-flex";

        Valor_no_Cartão_1.required = true;
        Número_de_Parcelas_Cartão_1.required = true;
        Número_do_Cartão_1.required = true;
        Nome_do_Titular_do_Cartão_1.required = true;
        Campo_de_Preenchimento_Mês_Cartão_1.required = true;
        Campo_de_Preenchimento_Ano_Cartão_1.required = true;
        Campo_de_Preenchimento_CVV_Cartão_1.required = true;
        
        Número_de_Parcelas_Cartão_2.required = true;
        Número_do_Cartão_2.required = true;
        Nome_do_Titular_do_Cartão_2.required = true;
        Campo_de_Preenchimento_Mês_Cartão_2.required = true;
        Campo_de_Preenchimento_Ano_Cartão_2.required = true;
        Campo_de_Preenchimento_CVV_Cartão_2.required = true;

    Valor_Produto_Comprado.innerHTML = Número_de_Parcelas_Cartão_1.options[Número_de_Parcelas_Cartão_1.selectedIndex].text + " + " + Número_de_Parcelas_Cartão_2.options[Número_de_Parcelas_Cartão_2.selectedIndex].text;;

    /*Desaciona os dados de pagamento relativos aos demais botões.*/
    Dados_Pagamento_UM_CARTAO.style.display = "none";

        Número_do_Cartão.required = false;
        Nome_do_Titular_do_Cartão.required = false;
        Campo_de_Preenchimento_Mês_Cartão.required = false;
        Campo_de_Preenchimento_Ano_Cartão.required = false;
        Campo_de_Preenchimento_CVV_Cartão.required = false;
        Número_de_Parcelas_Cartão_do_UM_CARTAO.required = false;

    Dados_Pagamento_BOLETO.style.display = "none";

    Dados_Pagamento_PIX.style.display = "none";

    Dados_Pagamento_PIX_CARTAO.style.display = "none";

        Valor_no_Cartão_do_PIX_CARTÃO.required = false;
        Número_de_Parcelas_Cartão_do_PIX_CARTÃO.required = false;
        Número_do_Cartão_do_PIX_CARTÃO.required = false;
        Nome_do_Titular_do_Cartão_do_PIX_CARTÃO.required = false; 
        Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.required = false;
        Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.required = false;
        Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO.required = false;

    /*/////// Reseta os Campos Internos, Avisos de Inconsistência e Desabilitação do Botão de Compra dos Dados de Pagamento ////////*/
    
    /*UM_CARTÃO*/
    Número_do_Cartão.value = "";
    Nome_do_Titular_do_Cartão.value = "";
    Campo_de_Preenchimento_Mês_Cartão.value = "";
    Campo_de_Preenchimento_Mês_Cartão.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão.value = "";
    Campo_de_Preenchimento_Ano_Cartão.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão.value = "";
    Número_de_Parcelas_Cartão_do_UM_CARTAO.value = "";
    Número_de_Parcelas_Cartão_do_UM_CARTAO.style.color = "rgb(128, 128, 128)";

    Aviso_de_Inconsistência_Número_do_Cartão_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_Botão.style.display = "none";
    Comprar.disabled = false;

    /*PIX_CARTAO*/
    Valor_no_Cartão_do_PIX_CARTÃO.value = "";
    configura_valor_e_parcelas_do_PIX_CARTÃO ();
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO.value = "1"; 
    Número_do_Cartão_do_PIX_CARTÃO.value = "";
    Nome_do_Titular_do_Cartão_do_PIX_CARTÃO.value = "";
    Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.value = "";
    Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.value = "";
    Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.style.color = "rgb(128, 128, 128)";
    Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO.value = "";

    Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Campo.style.display = "none";
    Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Botão.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Campo.style.display = "none";
    Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Botão.style.display = "none";
    Comprar.disabled = false;

    /*/////// Configuração do Botão de Compra ////////*/

    /*Atualiza o texto do botão de compra.*/
    Comprar.innerText = "Comprar";

})


/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
          Configura o Meio de Pagamento: UM_CARTAO
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

/*Configura a digitação do Número_do_Cartão para:
a) Não permite o "autocomplete".
b) Não permitir qualquer caracter que não seja " " ou números.
c) Adiciona os " ". 
d) Dá o alerta se o formato não for exatamente #### #### #### ####.*/

Número_do_Cartão.setAttribute('autocomplete', 'off');

Número_do_Cartão.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }

    if (isNaN(Number(event.key))) {
        event.preventDefault();
    }

    let Número_do_Cartão_Tamanho = Número_do_Cartão.value.length
    
    if (Número_do_Cartão_Tamanho == 4 || Número_do_Cartão_Tamanho == 9 || Número_do_Cartão_Tamanho == 14) {
        Número_do_Cartão.value += ' ';  
    }

})

Número_do_Cartão.addEventListener("change", function(event) {

    let pattern = /^\d{4} \d{4} \d{4} \d{4}$/;
    
    if (!pattern.test(Número_do_Cartão.value)) {
        Aviso_de_Inconsistência_Número_do_Cartão_Campo.style.display = "block";
        Aviso_de_Inconsistência_Número_do_Cartão_Botão.style.display = "block";
        Comprar.disabled = true;
    } else {
        Aviso_de_Inconsistência_Número_do_Cartão_Campo.style.display = "none";
        Aviso_de_Inconsistência_Número_do_Cartão_Botão.style.display = "none";
        Comprar.disabled = false;
    }

})

/*Configura a digitação do Nome_do_Titular_do_Cartão para:
a) Não permitir qualquer caracter que não seja " " ou letras. 
b) Não permitir que o último caracter seja " ".*/

Nome_do_Titular_do_Cartão.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }

    if (/\d/.test(event.key)) {
        event.preventDefault();
    }

})

Nome_do_Titular_do_Cartão.addEventListener("change", function() {

    Nome_do_Titular_do_Cartão.value = Nome_do_Titular_do_Cartão.value.replace(/\s+$/, "");

})

/*Muda a cor dos campos Mês e Ano do Cartão de Crédito para preto, após as seleções serem feitas.*/
Campo_de_Preenchimento_Mês_Cartão.addEventListener("change", function(event) {
    Campo_de_Preenchimento_Mês_Cartão.style.color = "black";
})

Campo_de_Preenchimento_Ano_Cartão.addEventListener("change", function(event) {
    Campo_de_Preenchimento_Ano_Cartão.style.color = "black";
})

/*Configura a digitação do Campo_de_Preenchimento_CVV_Cartão para:
a) Não permitir qualquer caracter que não seja números.
b) Muda a cor dos para preto, após as seleções serem feitas.
c) */

Campo_de_Preenchimento_CVV_Cartão.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }

    if (event.key === " ") {
        event.preventDefault();
        return;
    }

    if (isNaN(Number(event.key))) {
        event.preventDefault();
    }

})

Campo_de_Preenchimento_CVV_Cartão.addEventListener("change", function() {
    
    Campo_de_Preenchimento_CVV_Cartão.style.color = "black";

    if (Campo_de_Preenchimento_CVV_Cartão.value.length < 3) {
        Aviso_de_Inconsistência_CVV_Cartão_Campo.style.display = "block";
        Aviso_de_Inconsistência_CVV_Cartão_Botão.style.display = "block";
        Comprar.disabled = true;
    } else {
        Aviso_de_Inconsistência_CVV_Cartão_Campo.style.display = "none";
        Aviso_de_Inconsistência_CVV_Cartão_Botão.style.display = "none";
        Comprar.disabled = false;
    }

})

/*Altera, assim que o Número de Parcelas é escolhido:
- A cor do campo Número de Parcelas;
- O Valor do Produto comprado no checkout;
- O Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos para processamento no Power Automate.*/


Número_de_Parcelas_Cartão_do_UM_CARTAO.addEventListener("change", function() {
    
    document.getElementById("Valor_Produto_Comprado").innerHTML = Número_de_Parcelas_Cartão_do_UM_CARTAO.options[Número_de_Parcelas_Cartão_do_UM_CARTAO.selectedIndex].text;

    Número_de_Parcelas_Cartão_do_UM_CARTAO.style.color = "black";
     
    if (Número_de_Parcelas_Cartão_do_UM_CARTAO.selectedIndex === 1) {

        Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos = Variável_Mestra_Valor_Total_do_Serviço_à_Vista.toFixed(2).replace(".","");

    } else if (Número_de_Parcelas_Cartão_do_UM_CARTAO.selectedIndex === 2) {

        Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos = (Variável_Mestra_Valor_Total_do_Serviço_à_Vista * Juros_Parcelamento_2x).toFixed(2).replace(".","");

    } else if (Número_de_Parcelas_Cartão_do_UM_CARTAO.selectedIndex === 3) {
        
        Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos = (Variável_Mestra_Valor_Total_do_Serviço_à_Vista * Juros_Parcelamento_3x).toFixed(2).replace(".","");

    } else if (Número_de_Parcelas_Cartão_do_UM_CARTAO.selectedIndex === 4) {
        
        Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos = (Variável_Mestra_Valor_Total_do_Serviço_à_Vista * Juros_Parcelamento_4x).toFixed(2).replace(".","");

    } else if (Número_de_Parcelas_Cartão_do_UM_CARTAO.selectedIndex === 5) {
        
        Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos = (Variável_Mestra_Valor_Total_do_Serviço_à_Vista * Juros_Parcelamento_5x).toFixed(2).replace(".","");

    } else if (Número_de_Parcelas_Cartão_do_UM_CARTAO.selectedIndex === 6) {
        
        Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos = (Variável_Mestra_Valor_Total_do_Serviço_à_Vista * Juros_Parcelamento_6x).toFixed(2).replace(".","");

    } else if (Número_de_Parcelas_Cartão_do_UM_CARTAO.selectedIndex === 7) {
        
        Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos = (Variável_Mestra_Valor_Total_do_Serviço_à_Vista * Juros_Parcelamento_7x).toFixed(2).replace(".","");

    } else if (Número_de_Parcelas_Cartão_do_UM_CARTAO.selectedIndex === 8) {
        
        Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos = (Variável_Mestra_Valor_Total_do_Serviço_à_Vista * Juros_Parcelamento_8x).toFixed(2).replace(".","");

    } else if (Número_de_Parcelas_Cartão_do_UM_CARTAO.selectedIndex === 9) {
        
        Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos = (Variável_Mestra_Valor_Total_do_Serviço_à_Vista * Juros_Parcelamento_9x).toFixed(2).replace(".","");

    } else if (Número_de_Parcelas_Cartão_do_UM_CARTAO.selectedIndex === 10) {
        
        Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos = (Variável_Mestra_Valor_Total_do_Serviço_à_Vista * Juros_Parcelamento_10x).toFixed(2).replace(".","");

    } else if (Número_de_Parcelas_Cartão_do_UM_CARTAO.selectedIndex === 11) {
        
        Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos = (Variável_Mestra_Valor_Total_do_Serviço_à_Vista * Juros_Parcelamento_11x).toFixed(2).replace(".","");

    } else if (Número_de_Parcelas_Cartão_do_UM_CARTAO.selectedIndex === 12) {
        
        Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos = (Variável_Mestra_Valor_Total_do_Serviço_à_Vista * Juros_Parcelamento_12x).toFixed(2).replace(".","");

    }
    
})

/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
          Configura o Meio de Pagamento: PIX_CARTÃO
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

/* Configura e automatiza o valor no cartão e no PIX e os números das parcelas. */

Valor_no_Cartão_do_PIX_CARTÃO.addEventListener("change", function() {

    configura_valor_e_parcelas_do_PIX_CARTÃO ();

    /* Altera o Valor_Produto_Comprado */
    Valor_Produto_Comprado.innerHTML = Número_de_Parcelas_Cartão_do_PIX_CARTÃO.options[Número_de_Parcelas_Cartão_do_PIX_CARTÃO.selectedIndex].text + " + " + Valor_no_PIX_do_PIX_CARTÃO.value;

});

function configura_valor_e_parcelas_do_PIX_CARTÃO () {

    /* Altera o Valor_no_Cartão_do_PIX_CARTÃO para formato #,###.## se for digitado no formato R$ #.###,## */
    Valor_no_Cartão_do_PIX_CARTÃO.value = Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$", "").trim();
    Valor_no_Cartão_do_PIX_CARTÃO.value = Valor_no_Cartão_do_PIX_CARTÃO.value.replace(",", ".");
    
    /* Altera o Valor_no_Cartão_do_PIX_CARTÃO para Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento se o valor digitado for abaixo de Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento. */
    if (Valor_no_Cartão_do_PIX_CARTÃO.value < Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento) {
        Valor_no_Cartão_do_PIX_CARTÃO.value = Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento;
    }

    /* Altera o Valor_no_Cartão_do_PIX_CARTÃO para Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento se o valor for acima de Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento. */
    if (Valor_no_Cartão_do_PIX_CARTÃO.value > (Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento)) {
        Valor_no_Cartão_do_PIX_CARTÃO.value = (Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento);
    }

    if (isNaN(Valor_no_Cartão_do_PIX_CARTÃO.value)) {
        Valor_no_Cartão_do_PIX_CARTÃO.value = Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento;
    }

    /*Altera o Valor_no_Cartão_2 para 3490 - Valor_no_Cartão_do_PIX_CARTÃO:*/
    Valor_no_PIX_do_PIX_CARTÃO.value = Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Valor_no_Cartão_do_PIX_CARTÃO.value;

    /*Altera as opções do Número_de_Parcelas_Cartão_1:*/
    var Valor_no_Cartão_do_PIX_CARTÃO_Parcela_1x = parseFloat(Valor_no_Cartão_do_PIX_CARTÃO.value).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_do_PIX_CARTÃO_Parcela_2x = parseFloat(Valor_no_Cartão_do_PIX_CARTÃO.value / 2 * Juros_Parcelamento_2x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_do_PIX_CARTÃO_Parcela_3x = parseFloat(Valor_no_Cartão_do_PIX_CARTÃO.value / 3 * Juros_Parcelamento_3x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_do_PIX_CARTÃO_Parcela_4x = parseFloat(Valor_no_Cartão_do_PIX_CARTÃO.value / 4 * Juros_Parcelamento_4x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_do_PIX_CARTÃO_Parcela_5x = parseFloat(Valor_no_Cartão_do_PIX_CARTÃO.value / 5 * Juros_Parcelamento_5x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_do_PIX_CARTÃO_Parcela_6x = parseFloat(Valor_no_Cartão_do_PIX_CARTÃO.value / 6 * Juros_Parcelamento_6x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_do_PIX_CARTÃO_Parcela_7x = parseFloat(Valor_no_Cartão_do_PIX_CARTÃO.value / 7 * Juros_Parcelamento_7x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_do_PIX_CARTÃO_Parcela_8x = parseFloat(Valor_no_Cartão_do_PIX_CARTÃO.value / 8 * Juros_Parcelamento_8x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_do_PIX_CARTÃO_Parcela_9x = parseFloat(Valor_no_Cartão_do_PIX_CARTÃO.value / 9 * Juros_Parcelamento_9x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_do_PIX_CARTÃO_Parcela_10x = parseFloat(Valor_no_Cartão_do_PIX_CARTÃO.value / 10 * Juros_Parcelamento_10x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_do_PIX_CARTÃO_Parcela_11x = parseFloat(Valor_no_Cartão_do_PIX_CARTÃO.value / 11 * Juros_Parcelamento_11x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_do_PIX_CARTÃO_Parcela_12x = parseFloat(Valor_no_Cartão_do_PIX_CARTÃO.value / 12 * Juros_Parcelamento_12x).toLocaleString('pt-BR', configuração_BRL);
    
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_1.text = "1x de " + Valor_no_Cartão_do_PIX_CARTÃO_Parcela_1x;
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_2.text = "2x de " + Valor_no_Cartão_do_PIX_CARTÃO_Parcela_2x + "*";
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_3.text = "3x de " + Valor_no_Cartão_do_PIX_CARTÃO_Parcela_3x + "*";
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_4.text = "4x de " + Valor_no_Cartão_do_PIX_CARTÃO_Parcela_4x + "*";
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_5.text = "5x de " + Valor_no_Cartão_do_PIX_CARTÃO_Parcela_5x + "*";
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_6.text = "6x de " + Valor_no_Cartão_do_PIX_CARTÃO_Parcela_6x + "*";
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_7.text = "7x de " + Valor_no_Cartão_do_PIX_CARTÃO_Parcela_7x + "*";
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_8.text = "8x de " + Valor_no_Cartão_do_PIX_CARTÃO_Parcela_8x + "*";
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_9.text = "9x de " + Valor_no_Cartão_do_PIX_CARTÃO_Parcela_9x + "*";
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_10.text = "10x de " + Valor_no_Cartão_do_PIX_CARTÃO_Parcela_10x + "*";
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_11.text = "11x de " + Valor_no_Cartão_do_PIX_CARTÃO_Parcela_11x + "*";
    Número_de_Parcelas_Cartão_do_PIX_CARTÃO_Opção_12.text = "12x de " + Valor_no_Cartão_do_PIX_CARTÃO_Parcela_12x + "*";

    /* Altera o Valor_no_Cartão_do_PIX_CARTÃO e Valor_no_PIX_do_PIX_CARTÃO para formato R$ #.###,##. */
    Valor_no_Cartão_do_PIX_CARTÃO.value = parseFloat(Valor_no_Cartão_do_PIX_CARTÃO.value).toLocaleString('pt-BR', configuração_BRL);
    Valor_no_PIX_do_PIX_CARTÃO.value = parseFloat(Valor_no_PIX_do_PIX_CARTÃO.value).toLocaleString('pt-BR', configuração_BRL);
    
    /*Atualiza o Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos*/
    Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos = (Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$", "").trim().replace(",","").replace(".",""));

}

/*//////////////////////////////////////////////////////////// 
Configurações do Cartão do Pix e cartão 
////////////////////////////////////////////////////////////*/

/*Configura a digitação do Número_do_Cartão_do_PIX_CARTÃO para:
a) Não permite o "autocomplete".
b) Não permitir qualquer caracter que não seja " " ou números.
c) Adiciona os " ".
d) Dá o alerta se o formato não for exatamente #### #### #### ####.*/

Número_do_Cartão_do_PIX_CARTÃO.setAttribute('autocomplete', 'off');

Número_do_Cartão_do_PIX_CARTÃO.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }

    if (isNaN(Number(event.key))) {
        event.preventDefault();
    }

    let Número_do_Cartão_do_PIX_CARTÃO_Tamanho = Número_do_Cartão_do_PIX_CARTÃO.value.length
    
    if (Número_do_Cartão_do_PIX_CARTÃO_Tamanho == 4 || Número_do_Cartão_do_PIX_CARTÃO_Tamanho == 9 || Número_do_Cartão_do_PIX_CARTÃO_Tamanho == 14) {
        Número_do_Cartão_do_PIX_CARTÃO.value += ' ';  
    }
})

Número_do_Cartão_do_PIX_CARTÃO.addEventListener("change", function(event) {

    let pattern = /^\d{4} \d{4} \d{4} \d{4}$/;
    
    if (!pattern.test(Número_do_Cartão_do_PIX_CARTÃO.value)) {
        Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Campo.style.display = "block";
        Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Botão.style.display = "block";
        Comprar.disabled = true;
    } else {
        Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Campo.style.display = "none";
        Aviso_de_Inconsistência_Número_do_Cartão_do_PIX_CARTÃO_Botão.style.display = "none";
        Comprar.disabled = false;
    }

})

/*Configura a digitação do Nome_do_Titular_do_Cartão para:
a) Não permitir qualquer caracter que não seja " " ou letras. 
b) Não permitir que o último caracter seja " ".*/

Nome_do_Titular_do_Cartão_do_PIX_CARTÃO.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }

    if (/\d/.test(event.key)) {
        event.preventDefault();
    }

})

Nome_do_Titular_do_Cartão_do_PIX_CARTÃO.addEventListener("change", function() {

    Nome_do_Titular_do_Cartão_do_PIX_CARTÃO.value = Nome_do_Titular_do_Cartão_do_PIX_CARTÃO.value.replace(/\s+$/, "");

})

/*Muda a cor dos campos Mês e Ano do Cartão de Crédito para preto, após as seleções serem feitas.*/
Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.addEventListener("change", function(event) {
    Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.style.color = "black";
})

Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.addEventListener("change", function(event) {
    Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.style.color = "black";
})


/*Configura a digitação do Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO para:
a) Não permitir qualquer caracter que não seja números.
b) Muda a cor dos para preto, após as seleções serem feitas.
c) */

Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }

    if (event.key === " ") {
        event.preventDefault();
        return;
    }

    if (isNaN(Number(event.key))) {
        event.preventDefault();
    }

})

Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO.addEventListener("change", function() {
    
    Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO.style.color = "black";

    if (Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO.value.length < 3) {
        Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Campo.style.display = "block";
        Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Botão.style.display = "block";
        Comprar.disabled = true;
    } else {
        Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Campo.style.display = "none";
        Aviso_de_Inconsistência_CVV_Cartão_do_PIX_CARTÃO_Botão.style.display = "none";
        Comprar.disabled = false;
    }

})

/*Altera, assim que o Número de Parcelas é escolhido:
- O Valor do Produto comprado;*/

Número_de_Parcelas_Cartão_do_PIX_CARTÃO.addEventListener("change", function() {
    
    Valor_Produto_Comprado.innerHTML = Número_de_Parcelas_Cartão_do_PIX_CARTÃO.options[Número_de_Parcelas_Cartão_do_PIX_CARTÃO.selectedIndex].text + " + " + Valor_no_PIX_do_PIX_CARTÃO.value;

    if (Número_de_Parcelas_Cartão_do_PIX_CARTÃO.selectedIndex === 0) {

        Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos = (Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$", "").trim().replace(",","").replace(".","") * 1).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_do_PIX_CARTÃO.selectedIndex === 1) {

        Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos = (Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_2x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_do_PIX_CARTÃO.selectedIndex === 2) {
        
        Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos = (Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_3x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_do_PIX_CARTÃO.selectedIndex === 3) {
        
        Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos = (Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_4x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_do_PIX_CARTÃO.selectedIndex === 4) {
        
        Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos = (Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_5x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_do_PIX_CARTÃO.selectedIndex === 5) {
        
        Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos = (Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_6x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_do_PIX_CARTÃO.selectedIndex === 6) {
        
        Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos = (Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_7x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_do_PIX_CARTÃO.selectedIndex === 7) {
        
        Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos = (Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_8x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_do_PIX_CARTÃO.selectedIndex === 8) {
        
        Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos = (Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_9x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_do_PIX_CARTÃO.selectedIndex === 9) {
        
        Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos = (Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_10x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_do_PIX_CARTÃO.selectedIndex === 10) {
        
        Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos = (Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_11x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_do_PIX_CARTÃO.selectedIndex === 11) {
        
        Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos = (Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_12x).toFixed(0);

    }

})

/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
         Configura o Meio de Pagamento: DOIS_CARTOES
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

/* Configura e automatiza os valores em cada cartão, os valores e os números das parcelas. */

Valor_no_Cartão_1.addEventListener("change", function() {

    configura_valores_e_parcelas_do_DOIS_CARTOES ();

    /* Altera o Valor_Produto_Comprado */
    Valor_Produto_Comprado.innerHTML = Número_de_Parcelas_Cartão_1.options[Número_de_Parcelas_Cartão_1.selectedIndex].text + " + " + Número_de_Parcelas_Cartão_2.options[Número_de_Parcelas_Cartão_2.selectedIndex].text;;

});

function configura_valores_e_parcelas_do_DOIS_CARTOES () {

    /* Altera o Valor_no_Cartão_1 para formato #,###.## se for digitado no formato R$ #.###,## */
    Valor_no_Cartão_1.value = Valor_no_Cartão_1.value.replace("R$", "").trim();
    Valor_no_Cartão_1.value = Valor_no_Cartão_1.value.replace(",", ".");
    
    /* Altera o Valor_no_Cartão_1 para Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento se o valor digitado for abaixo de Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento. */
    if (Valor_no_Cartão_1.value < Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento) {
        Valor_no_Cartão_1.value = Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento;
    }

    /* Altera o Valor_no_Cartão_1 para Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento se o valor for acima de Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento. */
    if (Valor_no_Cartão_1.value > Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento) {
        Valor_no_Cartão_1.value = Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento;
    }

    if (isNaN(Valor_no_Cartão_1.value)) {
        Valor_no_Cartão_1.value = Variável_Mestra_Valor_Mínimo_por_Tipo_de_Pagamento;
    }

    /*Altera o Valor_no_Cartão_2 para Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Valor_no_Cartão_1:*/
    Valor_no_Cartão_2.value = Variável_Mestra_Valor_Total_do_Serviço_à_Vista - Valor_no_Cartão_1.value;

    /*Altera as opções do Número_de_Parcelas_Cartão_1:*/
    var Valor_no_Cartão_1_Parcela_1x = parseFloat(Valor_no_Cartão_1.value).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_1_Parcela_2x = parseFloat(Valor_no_Cartão_1.value / 2 * Juros_Parcelamento_2x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_1_Parcela_3x = parseFloat(Valor_no_Cartão_1.value / 3 * Juros_Parcelamento_3x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_1_Parcela_4x = parseFloat(Valor_no_Cartão_1.value / 4 * Juros_Parcelamento_4x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_1_Parcela_5x = parseFloat(Valor_no_Cartão_1.value / 5 * Juros_Parcelamento_5x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_1_Parcela_6x = parseFloat(Valor_no_Cartão_1.value / 6 * Juros_Parcelamento_6x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_1_Parcela_7x = parseFloat(Valor_no_Cartão_1.value / 7 * Juros_Parcelamento_7x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_1_Parcela_8x = parseFloat(Valor_no_Cartão_1.value / 8 * Juros_Parcelamento_8x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_1_Parcela_9x = parseFloat(Valor_no_Cartão_1.value / 9 * Juros_Parcelamento_9x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_1_Parcela_10x = parseFloat(Valor_no_Cartão_1.value / 10 * Juros_Parcelamento_10x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_1_Parcela_11x = parseFloat(Valor_no_Cartão_1.value / 11 * Juros_Parcelamento_11x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_1_Parcela_12x = parseFloat(Valor_no_Cartão_1.value / 12 * Juros_Parcelamento_12x).toLocaleString('pt-BR', configuração_BRL);
    
    Número_de_Parcelas_Cartão_1_Opção_1.text = "1x de " + Valor_no_Cartão_1_Parcela_1x;
    Número_de_Parcelas_Cartão_1_Opção_2.text = "2x de " + Valor_no_Cartão_1_Parcela_2x + "*";
    Número_de_Parcelas_Cartão_1_Opção_3.text = "3x de " + Valor_no_Cartão_1_Parcela_3x + "*";
    Número_de_Parcelas_Cartão_1_Opção_4.text = "4x de " + Valor_no_Cartão_1_Parcela_4x + "*";
    Número_de_Parcelas_Cartão_1_Opção_5.text = "5x de " + Valor_no_Cartão_1_Parcela_5x + "*";
    Número_de_Parcelas_Cartão_1_Opção_6.text = "6x de " + Valor_no_Cartão_1_Parcela_6x + "*";
    Número_de_Parcelas_Cartão_1_Opção_7.text = "7x de " + Valor_no_Cartão_1_Parcela_7x + "*";
    Número_de_Parcelas_Cartão_1_Opção_8.text = "8x de " + Valor_no_Cartão_1_Parcela_8x + "*";
    Número_de_Parcelas_Cartão_1_Opção_9.text = "9x de " + Valor_no_Cartão_1_Parcela_9x + "*";
    Número_de_Parcelas_Cartão_1_Opção_10.text = "10x de " + Valor_no_Cartão_1_Parcela_10x + "*";
    Número_de_Parcelas_Cartão_1_Opção_11.text = "11x de " + Valor_no_Cartão_1_Parcela_11x + "*";
    Número_de_Parcelas_Cartão_1_Opção_12.text = "12x de " + Valor_no_Cartão_1_Parcela_12x + "*";

    /*Altera as opções do Número_de_Parcelas_Cartão_2:*/

    var Valor_no_Cartão_2_Parcela_1x = parseFloat(Valor_no_Cartão_2.value).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_2_Parcela_2x = parseFloat(Valor_no_Cartão_2.value / 2 * Juros_Parcelamento_2x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_2_Parcela_3x = parseFloat(Valor_no_Cartão_2.value / 3 * Juros_Parcelamento_3x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_2_Parcela_4x = parseFloat(Valor_no_Cartão_2.value / 4 * Juros_Parcelamento_4x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_2_Parcela_5x = parseFloat(Valor_no_Cartão_2.value / 5 * Juros_Parcelamento_5x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_2_Parcela_6x = parseFloat(Valor_no_Cartão_2.value / 6 * Juros_Parcelamento_6x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_2_Parcela_7x = parseFloat(Valor_no_Cartão_2.value / 7 * Juros_Parcelamento_7x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_2_Parcela_8x = parseFloat(Valor_no_Cartão_2.value / 8 * Juros_Parcelamento_8x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_2_Parcela_9x = parseFloat(Valor_no_Cartão_2.value / 9 * Juros_Parcelamento_9x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_2_Parcela_10x = parseFloat(Valor_no_Cartão_2.value / 10 * Juros_Parcelamento_10x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_2_Parcela_11x = parseFloat(Valor_no_Cartão_2.value / 11 * Juros_Parcelamento_11x).toLocaleString('pt-BR', configuração_BRL);
    var Valor_no_Cartão_2_Parcela_12x = parseFloat(Valor_no_Cartão_2.value / 12 * Juros_Parcelamento_12x).toLocaleString('pt-BR', configuração_BRL);
    
    Número_de_Parcelas_Cartão_2_Opção_1.text = "1x de " + Valor_no_Cartão_2_Parcela_1x;
    Número_de_Parcelas_Cartão_2_Opção_2.text = "2x de " + Valor_no_Cartão_2_Parcela_2x + "*";
    Número_de_Parcelas_Cartão_2_Opção_3.text = "3x de " + Valor_no_Cartão_2_Parcela_3x + "*";
    Número_de_Parcelas_Cartão_2_Opção_4.text = "4x de " + Valor_no_Cartão_2_Parcela_4x + "*";
    Número_de_Parcelas_Cartão_2_Opção_5.text = "5x de " + Valor_no_Cartão_2_Parcela_5x + "*";
    Número_de_Parcelas_Cartão_2_Opção_6.text = "6x de " + Valor_no_Cartão_2_Parcela_6x + "*";
    Número_de_Parcelas_Cartão_2_Opção_7.text = "7x de " + Valor_no_Cartão_2_Parcela_7x + "*";
    Número_de_Parcelas_Cartão_2_Opção_8.text = "8x de " + Valor_no_Cartão_2_Parcela_8x + "*";
    Número_de_Parcelas_Cartão_2_Opção_9.text = "9x de " + Valor_no_Cartão_2_Parcela_9x + "*";
    Número_de_Parcelas_Cartão_2_Opção_10.text = "10x de " + Valor_no_Cartão_2_Parcela_10x + "*";
    Número_de_Parcelas_Cartão_2_Opção_11.text = "11x de " + Valor_no_Cartão_2_Parcela_11x + "*";
    Número_de_Parcelas_Cartão_2_Opção_12.text = "12x de " + Valor_no_Cartão_2_Parcela_12x + "*";


    /* Altera o Valor_no_Cartão_1 e Valor_no_Cartão_2 para formato R$ #.###,##. */
    Valor_no_Cartão_1.value = parseFloat(Valor_no_Cartão_1.value).toLocaleString('pt-BR', configuração_BRL);
    Valor_no_Cartão_2.value = parseFloat(Valor_no_Cartão_2.value).toLocaleString('pt-BR', configuração_BRL);

    /*Atualiza o Valor_com_Juros_no_Cartão_1_Dígitos e o Valor_com_Juros_no_Cartão_2_Dígitos*/
    Valor_com_Juros_no_Cartão_1_Dígitos = (Valor_no_Cartão_1.value.replace("R$", "").trim().replace(",","").replace(".",""));
    Valor_com_Juros_no_Cartão_2_Dígitos = (Valor_no_Cartão_2.value.replace("R$", "").trim().replace(",","").replace(".",""));
    
}

/*//////////////////////////////////////////////////////////// 
Configurações do Cartão 1 
////////////////////////////////////////////////////////////*/

/*Configura a digitação do Número_do_Cartão_1 para:
a) Não permite o "autocomplete".
b) Não permitir qualquer caracter que não seja " " ou números.
c) Adiciona os " ".
d) Dá o alerta se o formato não for exatamente #### #### #### ####.*/

Número_do_Cartão_1.setAttribute('autocomplete', 'off');

Número_do_Cartão_1.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }

    if (isNaN(Number(event.key))) {
        event.preventDefault();
    }

    let Número_do_Cartão_1_Tamanho = Número_do_Cartão_1.value.length
    
    if (Número_do_Cartão_1_Tamanho == 4 || Número_do_Cartão_1_Tamanho == 9 || Número_do_Cartão_1_Tamanho == 14) {
        Número_do_Cartão_1.value += ' ';  
    }
})

Número_do_Cartão_1.addEventListener("change", function(event) {

    let pattern = /^\d{4} \d{4} \d{4} \d{4}$/;
    
    if (!pattern.test(Número_do_Cartão_1.value)) {
        Aviso_de_Inconsistência_Número_do_Cartão_1_Campo.style.display = "block";
        Aviso_de_Inconsistência_Número_do_Cartão_1_Botão.style.display = "block";
        Comprar.disabled = true;
    } else {
        Aviso_de_Inconsistência_Número_do_Cartão_1_Campo.style.display = "none";
        Aviso_de_Inconsistência_Número_do_Cartão_1_Botão.style.display = "none";
        Comprar.disabled = false;
    }

})

/*Configura a digitação do Nome_do_Titular_do_Cartão para:
a) Não permitir qualquer caracter que não seja " " ou letras. 
b) Não permitir que o último caracter seja " ".*/

Nome_do_Titular_do_Cartão_1.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }

    if (/\d/.test(event.key)) {
        event.preventDefault();
    }

})

Nome_do_Titular_do_Cartão_1.addEventListener("change", function() {

    Nome_do_Titular_do_Cartão_1.value = Nome_do_Titular_do_Cartão_1.value.replace(/\s+$/, "");

})

/*Muda a cor dos campos Mês e Ano do Cartão de Crédito para preto, após as seleções serem feitas.*/
Campo_de_Preenchimento_Mês_Cartão_1.addEventListener("change", function(event) {
    Campo_de_Preenchimento_Mês_Cartão_1.style.color = "black";
})

Campo_de_Preenchimento_Ano_Cartão_1.addEventListener("change", function(event) {
    Campo_de_Preenchimento_Ano_Cartão_1.style.color = "black";
})

/*Configura a digitação do Campo_de_Preenchimento_CVV_Cartão_1 para:
a) Não permitir qualquer caracter que não seja números.
b) Muda a cor dos para preto, após as seleções serem feitas. */

Campo_de_Preenchimento_CVV_Cartão_1.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }

    if (event.key === " ") {
        event.preventDefault();
        return;
    }

    if (isNaN(Number(event.key))) {
        event.preventDefault();
    }

})

Campo_de_Preenchimento_CVV_Cartão_1.addEventListener("change", function() {
    
    Campo_de_Preenchimento_CVV_Cartão_1.style.color = "black";

    if (Campo_de_Preenchimento_CVV_Cartão_1.value.length < 3) {
        Aviso_de_Inconsistência_CVV_Cartão_1_Campo.style.display = "block";
        Aviso_de_Inconsistência_CVV_Cartão_1_Botão.style.display = "block";
        Comprar.disabled = true;
    } else {
        Aviso_de_Inconsistência_CVV_Cartão_1_Campo.style.display = "none";
        Aviso_de_Inconsistência_CVV_Cartão_1_Botão.style.display = "none";
        Comprar.disabled = false;
    }

})

/*Altera, assim que o Número de Parcelas é escolhido:
- O Valor do Produto comprado;*/

Número_de_Parcelas_Cartão_1.addEventListener("change", function() {
    Valor_Produto_Comprado.innerHTML = Número_de_Parcelas_Cartão_1.options[Número_de_Parcelas_Cartão_1.selectedIndex].text + " + " + Número_de_Parcelas_Cartão_2.options[Número_de_Parcelas_Cartão_2.selectedIndex].text;

    if (Número_de_Parcelas_Cartão_1.selectedIndex === 0) {

        Valor_com_Juros_no_Cartão_1_Dígitos = (Valor_no_Cartão_1.value.replace("R$", "").trim().replace(",","").replace(".","") * 1).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_1.selectedIndex === 1) {

        Valor_com_Juros_no_Cartão_1_Dígitos = (Valor_no_Cartão_1.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_2x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_1.selectedIndex === 2) {
        
        Valor_com_Juros_no_Cartão_1_Dígitos = (Valor_no_Cartão_1.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_3x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_1.selectedIndex === 3) {
        
        Valor_com_Juros_no_Cartão_1_Dígitos = (Valor_no_Cartão_1.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_4x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_1.selectedIndex === 4) {
        
        Valor_com_Juros_no_Cartão_1_Dígitos = (Valor_no_Cartão_1.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_5x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_1.selectedIndex === 5) {
        
        Valor_com_Juros_no_Cartão_1_Dígitos = (Valor_no_Cartão_1.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_6x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_1.selectedIndex === 6) {
        
        Valor_com_Juros_no_Cartão_1_Dígitos = (Valor_no_Cartão_1.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_7x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_1.selectedIndex === 7) {
        
        Valor_com_Juros_no_Cartão_1_Dígitos = (Valor_no_Cartão_1.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_8x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_1.selectedIndex === 8) {
        
        Valor_com_Juros_no_Cartão_1_Dígitos = (Valor_no_Cartão_1.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_9x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_1.selectedIndex === 9) {
        
        Valor_com_Juros_no_Cartão_1_Dígitos = (Valor_no_Cartão_1.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_10x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_1.selectedIndex === 10) {
        
        Valor_com_Juros_no_Cartão_1_Dígitos = (Valor_no_Cartão_1.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_11x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_1.selectedIndex === 11) {
        
        Valor_com_Juros_no_Cartão_1_Dígitos = (Valor_no_Cartão_1.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_12x).toFixed(0);

    }

    console.log(Valor_no_Cartão_1.value);
    console.log(Valor_com_Juros_no_Cartão_1_Dígitos);

})

/*//////////////////////////////////////////////////////////// 
Configurações do Cartão 2
////////////////////////////////////////////////////////////*/

/*Configura a digitação do Número_do_Cartão_2 para:
a) Não permite o "autocomplete".
b) Não permitir qualquer caracter que não seja " " ou números.
c) Adiciona os " ".
d) Dá o alerta se o formato não for exatamente #### #### #### ####.*/

Número_do_Cartão_2.setAttribute('autocomplete', 'off');

Número_do_Cartão_2.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }

    if (isNaN(Number(event.key))) {
        event.preventDefault();
    }

    let Número_do_Cartão_2_Tamanho = Número_do_Cartão_2.value.length
    
    if (Número_do_Cartão_2_Tamanho == 4 || Número_do_Cartão_2_Tamanho == 9 || Número_do_Cartão_2_Tamanho == 14) {
        Número_do_Cartão_2.value += ' ';  
    }
})

Número_do_Cartão_2.addEventListener("change", function(event) {

    let pattern = /^\d{4} \d{4} \d{4} \d{4}$/;
    
    if (!pattern.test(Número_do_Cartão_2.value)) {
        Aviso_de_Inconsistência_Número_do_Cartão_2_Campo.style.display = "block";
        Aviso_de_Inconsistência_Número_do_Cartão_2_Botão.style.display = "block";
        Comprar.disabled = true;
    } else {
        Aviso_de_Inconsistência_Número_do_Cartão_2_Campo.style.display = "none";
        Aviso_de_Inconsistência_Número_do_Cartão_2_Botão.style.display = "none";
        Comprar.disabled = false;
    }

})

/*Configura a digitação do Nome_do_Titular_do_Cartão para:
a) Não permitir qualquer caracter que não seja " " ou letras. 
b) Não permitir que o último caracter seja " ".*/

Nome_do_Titular_do_Cartão_2.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }

    if (/\d/.test(event.key)) {
        event.preventDefault();
    }

})

Nome_do_Titular_do_Cartão_2.addEventListener("change", function() {

    Nome_do_Titular_do_Cartão_2.value = Nome_do_Titular_do_Cartão_2.value.replace(/\s+$/, "");

})

/*Muda a cor dos campos Mês e Ano do Cartão de Crédito para preto, após as seleções serem feitas.*/
Campo_de_Preenchimento_Mês_Cartão_2.addEventListener("change", function(event) {
    Campo_de_Preenchimento_Mês_Cartão_2.style.color = "black";
})

Campo_de_Preenchimento_Ano_Cartão_2.addEventListener("change", function(event) {
    Campo_de_Preenchimento_Ano_Cartão_2.style.color = "black";
})

/*Configura a digitação do Campo_de_Preenchimento_CVV_Cartão_2 para:
a) Não permitir qualquer caracter que não seja números.
b) Muda a cor dos para preto, após as seleções serem feitas. */

Campo_de_Preenchimento_CVV_Cartão_2.addEventListener("keydown", function(event) {

    if (event.key == "Backspace" || event.key == "Delete" || event.key == "ArrowLeft" || event.key == "ArrowRight" || event.key == "Tab") {
        return;
    }

    if (event.key === " ") {
        event.preventDefault();
        return;
    }

    if (isNaN(Number(event.key))) {
        event.preventDefault();
    }

})

Campo_de_Preenchimento_CVV_Cartão_2.addEventListener("change", function() {
    
    Campo_de_Preenchimento_CVV_Cartão_2.style.color = "black";

    if (Campo_de_Preenchimento_CVV_Cartão_2.value.length < 3) {
        Aviso_de_Inconsistência_CVV_Cartão_2_Campo.style.display = "block";
        Aviso_de_Inconsistência_CVV_Cartão_2_Botão.style.display = "block";
        Comprar.disabled = true;
    } else {
        Aviso_de_Inconsistência_CVV_Cartão_2_Campo.style.display = "none";
        Aviso_de_Inconsistência_CVV_Cartão_2_Botão.style.display = "none";
        Comprar.disabled = false;
    }

})

/*Altera, assim que o Número de Parcelas é escolhido:
- O Valor do Produto comprado;*/

Número_de_Parcelas_Cartão_2.addEventListener("change", function() {
    Valor_Produto_Comprado.innerHTML = Número_de_Parcelas_Cartão_1.options[Número_de_Parcelas_Cartão_1.selectedIndex].text + " + " + Número_de_Parcelas_Cartão_2.options[Número_de_Parcelas_Cartão_2.selectedIndex].text;

    if (Número_de_Parcelas_Cartão_2.selectedIndex === 0) {

        Valor_com_Juros_no_Cartão_2_Dígitos = (Valor_no_Cartão_2.value.replace("R$", "").trim().replace(",","").replace(".","") * 1).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_2.selectedIndex === 1) {

        Valor_com_Juros_no_Cartão_2_Dígitos = (Valor_no_Cartão_2.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_2x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_2.selectedIndex === 2) {
        
        Valor_com_Juros_no_Cartão_2_Dígitos = (Valor_no_Cartão_2.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_3x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_2.selectedIndex === 3) {
        
        Valor_com_Juros_no_Cartão_2_Dígitos = (Valor_no_Cartão_2.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_4x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_2.selectedIndex === 4) {
        
        Valor_com_Juros_no_Cartão_2_Dígitos = (Valor_no_Cartão_2.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_5x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_2.selectedIndex === 5) {
        
        Valor_com_Juros_no_Cartão_2_Dígitos = (Valor_no_Cartão_2.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_6x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_2.selectedIndex === 6) {
        
        Valor_com_Juros_no_Cartão_2_Dígitos = (Valor_no_Cartão_2.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_7x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_2.selectedIndex === 7) {
        
        Valor_com_Juros_no_Cartão_2_Dígitos = (Valor_no_Cartão_2.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_8x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_2.selectedIndex === 8) {
        
        Valor_com_Juros_no_Cartão_2_Dígitos = (Valor_no_Cartão_2.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_9x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_2.selectedIndex === 9) {
        
        Valor_com_Juros_no_Cartão_2_Dígitos = (Valor_no_Cartão_2.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_10x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_2.selectedIndex === 10) {
        
        Valor_com_Juros_no_Cartão_2_Dígitos = (Valor_no_Cartão_2.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_11x).toFixed(0);

    } else if (Número_de_Parcelas_Cartão_2.selectedIndex === 11) {
        
        Valor_com_Juros_no_Cartão_2_Dígitos = (Valor_no_Cartão_2.value.replace("R$", "").trim().replace(",","").replace(".","") * Juros_Parcelamento_12x).toFixed(0);

    }

    console.log(Valor_no_Cartão_2.value);
    console.log(Valor_com_Juros_no_Cartão_2_Dígitos);

})

/*Abre o WhatsApp*/
Entre_em_Contato.addEventListener("click", function(event) {
    event.preventDefault();
    window.open("//api.whatsapp.com/send?phone=5541996799092&text=Olá! Preciso de auxílio na contratação do Preparatório. Podem me ajudar?","_blank");
})

/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
        Constrói a Função que Trata Caractéres Especiais
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

function TrocaCaracteresEspeciais(str) {
    const CaracteresEspeciais = /[ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþ]/g;
    const CaracteresNormais = ['A','A','A','A','A','A','AE','C','E','E','E','E','I','I','I','I','D','N','O','O','O','O','O','U','U','U','U','Y','TH','ss','a','a','a','a','a','a','ae','c','e','e','e','e','i','i','i','i','d','n','o','o','o','o','o','o','u','u','u','u','y','th'];
    return str.replace(CaracteresEspeciais, function(match) {
      return CaracteresNormais[CaracteresEspeciais.source.indexOf(match)];
    });
}

/*////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////
      Envia os dados do checkout para o Power Automate.
//////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////*/

Formulário_de_Pagamento.addEventListener('submit', (event) => {
    
    event.preventDefault();
  
    const payload = {
      
      Nome_Produto: Nome_Produto.value,
      Código_do_Produto: Código_do_Produto,

      NomeCompleto: NomeCompleto.value,
      Email_do_Cliente: Email_do_Cliente.value,
      Confirmação_do_Email_do_Cliente: Confirmação_do_Email_do_Cliente.value,
      Campo_de_Preenchimento_CPF: Campo_de_Preenchimento_CPF.value,
      Campo_de_Preenchimento_CPF_Dígitos: Campo_de_Preenchimento_CPF.value.replace(/[.-]/g, ""),
      Campo_de_Preenchimento_DDD: Campo_de_Preenchimento_DDD.value,
      Campo_de_Preenchimento_Celular: Campo_de_Preenchimento_Celular.value,
      Campo_de_Preenchimento_Celular_Dígitos: Campo_de_Preenchimento_Celular.value.replace(/[-]/g, ""),

      Endereço_Rua: Endereço_Rua.value,
      Endereço_Número: Endereço_Número.value,
      Endereço_Complemento: Endereço_Complemento.value,
      Endereço_Bairro: Endereço_Bairro.value,
      Endereço_Cidade: Endereço_Cidade.value,
      Endereço_Estado: Endereço_Estado.value,
      Endereço_CEP: Endereço_CEP.value,
      Endereço_CEP_Dígitos: Endereço_CEP.value.replace(/[-]/g, ""),

      Tipo_de_Pagamento_Escolhido: Tipo_de_Pagamento_Escolhido,
      
      Número_do_Cartão: Número_do_Cartão.value,
      Número_do_Cartão_Dígitos: Número_do_Cartão.value.replace(/ /g, ""),
      Nome_do_Titular_do_Cartão_CaracteresOriginais: Nome_do_Titular_do_Cartão.value,
      Nome_do_Titular_do_Cartão_CaracteresAjustados: TrocaCaracteresEspeciais(Nome_do_Titular_do_Cartão.value),
      Campo_de_Preenchimento_Mês_Cartão: Campo_de_Preenchimento_Mês_Cartão.value,
      Campo_de_Preenchimento_Ano_Cartão: Campo_de_Preenchimento_Ano_Cartão.value,
      Campo_de_Preenchimento_CVV_Cartão: Campo_de_Preenchimento_CVV_Cartão.value,
      Número_de_Parcelas_Cartão_do_UM_CARTAO: Número_de_Parcelas_Cartão_do_UM_CARTAO.value,
      Valor_Total_da_Compra_com_Juros_UM_CARTAO: parseFloat(Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos / 100).toLocaleString('pt-BR', configuração_BRL),
      Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos: Valor_Total_da_Compra_com_Juros_UM_CARTAO_Dígitos,

      Valor_Total_da_Compra_no_PIX: parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista.toFixed(2).replace(".","") / 100).toLocaleString('pt-BR', configuração_BRL),
      Valor_Total_da_Compra_no_PIX_Dígitos: Variável_Mestra_Valor_Total_do_Serviço_à_Vista.toFixed(2).replace(".",""),

      Valor_Total_da_Compra_no_BOLETO: parseFloat(Variável_Mestra_Valor_Total_do_Serviço_à_Vista.toFixed(2).replace(".","") / 100).toLocaleString('pt-BR', configuração_BRL),
      Valor_Total_da_Compra_no_BOLETO_Dígitos: Variável_Mestra_Valor_Total_do_Serviço_à_Vista.toFixed(2).replace(".",""),

      Valor_no_PIX_do_PIX_CARTÃO: Valor_no_PIX_do_PIX_CARTÃO.value,
      Valor_no_PIX_do_PIX_CARTÃO_Dígitos: Valor_no_PIX_do_PIX_CARTÃO.value.replace("R$","").trim().replace(".","").replace(",",""),
      Valor_à_Vista_no_Cartão_do_PIX_CARTÃO: Valor_no_Cartão_do_PIX_CARTÃO.value,
      Valor_à_Vista_no_Cartão_do_PIX_CARTÃO_Dígitos: Valor_no_Cartão_do_PIX_CARTÃO.value.replace("R$","").trim().replace(".","").replace(",",""),
      Valor_com_Juros_no_Cartão_do_PIX_CARTÃO: parseFloat(Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos / 100).toLocaleString('pt-BR', configuração_BRL),
      Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos: Valor_com_Juros_no_Cartão_do_PIX_CARTÃO_Dígitos,
      Número_do_Cartão_do_PIX_CARTÃO: Número_do_Cartão_do_PIX_CARTÃO.value,
      Número_do_Cartão_do_PIX_CARTÃO_Dígitos: Número_do_Cartão_do_PIX_CARTÃO.value.replace(/ /g, ""),
      Nome_do_Titular_do_Cartão_do_PIX_CARTÃO_CaracteresOriginais: Nome_do_Titular_do_Cartão_do_PIX_CARTÃO.value,
      Nome_do_Titular_do_Cartão_do_PIX_CARTÃO_CaracteresAjustados: TrocaCaracteresEspeciais(Nome_do_Titular_do_Cartão_do_PIX_CARTÃO.value),
      Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO: Campo_de_Preenchimento_Mês_Cartão_do_PIX_CARTÃO.value,
      Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO: Campo_de_Preenchimento_Ano_Cartão_do_PIX_CARTÃO.value,
      Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO: Campo_de_Preenchimento_CVV_Cartão_do_PIX_CARTÃO.value,
      Número_de_Parcelas_Cartão_do_PIX_CARTÃO: Número_de_Parcelas_Cartão_do_PIX_CARTÃO.value,

      Valor_à_Vista_no_Cartão_1: Valor_no_Cartão_1.value,
      Valor_à_Vista_no_Cartão_1_Dígitos: Valor_no_Cartão_1.value.replace("R$","").trim().replace(".","").replace(",",""),
      Valor_com_Juros_no_Cartão_1: parseFloat(Valor_com_Juros_no_Cartão_1_Dígitos / 100).toLocaleString('pt-BR', configuração_BRL),
      Valor_com_Juros_no_Cartão_1_Dígitos: Valor_com_Juros_no_Cartão_1_Dígitos,
      Número_do_Cartão_1: Número_do_Cartão_1.value,
      Número_do_Cartão_1_Dígitos: Número_do_Cartão_1.value.replace(/ /g, ""),
      Nome_do_Titular_do_Cartão_1_CaracteresOriginais: Nome_do_Titular_do_Cartão_1.value,
      Nome_do_Titular_do_Cartão_1_CaracteresAjustados: TrocaCaracteresEspeciais(Nome_do_Titular_do_Cartão_1.value),
      Campo_de_Preenchimento_Mês_Cartão_1: Campo_de_Preenchimento_Mês_Cartão_1.value,
      Campo_de_Preenchimento_Ano_Cartão_1: Campo_de_Preenchimento_Ano_Cartão_1.value,
      Campo_de_Preenchimento_CVV_Cartão_1: Campo_de_Preenchimento_CVV_Cartão_1.value,
      Número_de_Parcelas_Cartão_1: Número_de_Parcelas_Cartão_1.value,
      Valor_à_Vista_no_Cartão_2: Valor_no_Cartão_2.value,
      Valor_à_Vista_no_Cartão_2_Dígitos: Valor_no_Cartão_2.value.replace("R$","").trim().replace(".","").replace(",",""),
      Valor_com_Juros_no_Cartão_2: parseFloat(Valor_com_Juros_no_Cartão_2_Dígitos / 100).toLocaleString('pt-BR', configuração_BRL),
      Valor_com_Juros_no_Cartão_2_Dígitos: Valor_com_Juros_no_Cartão_2_Dígitos,
      Número_do_Cartão_2: Número_do_Cartão_2.value,
      Número_do_Cartão_2_Dígitos: Número_do_Cartão_2.value.replace(/ /g, ""),
      Nome_do_Titular_do_Cartão_2_CaracteresOriginais: Nome_do_Titular_do_Cartão_2.value,
      Nome_do_Titular_do_Cartão_2_CaracteresAjustados: TrocaCaracteresEspeciais(Nome_do_Titular_do_Cartão_2.value),
      Campo_de_Preenchimento_Mês_Cartão_2: Campo_de_Preenchimento_Mês_Cartão_2.value,
      Campo_de_Preenchimento_Ano_Cartão_2: Campo_de_Preenchimento_Ano_Cartão_2.value,
      Campo_de_Preenchimento_CVV_Cartão_2: Campo_de_Preenchimento_CVV_Cartão_2.value,
      Número_de_Parcelas_Cartão_2: Número_de_Parcelas_Cartão_2.value
    
    };
  
    // Envia as informações ao Power Automate (Checkout #1: Processa Cobranças_v2).
    fetch('https://prod-28.brazilsouth.logic.azure.com:443/workflows/74d477074b034bf4b87ece9b46539b49/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=5tir7xFkZmn3ZJrHD-GZzjrzgNKoBDCdiJ6GPlNUuHU', {

      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    
    })
    
    .then(response => {
    
        window.location.href = "/checkout/confirmação";
    
    });

});
