/* Worker que dá a inteligência do Anjo da cozinha.

   Existe por um motivo de segurança: o site é estático no GitHub Pages, então
   qualquer coisa que estivesse no config.js seria pública. A chave da API da
   Anthropic vive aqui, como secret cifrado da Cloudflare, e o navegador nunca
   a vê. O site chama este Worker, o Worker chama a Anthropic.

   Duas ações:
     sugerir-prato     um prato que não está no catálogo, com as quantidades
     revisar-cardapio  uma leitura do cardápio inteiro procurando o que falta
*/

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

/* As mesmas seções do mercado que o site usa. O modelo precisa devolver o
   ingrediente já classificado, senão ele cai solto na lista. */
const SECOES = [
  'Açougue', 'Frios e laticínios', 'Hortifruti', 'Mercearia',
  'Temperos', 'Bebidas', 'Padaria', 'Sobremesas', 'Limpeza e descartáveis'
];

const UNIDADES = ['kg', 'g', 'L', 'ml', 'un', 'dz', 'latas', 'cx', 'pct', 'potes', 'maços', 'pés'];

const EsquemaPrato = z.object({
  nome: z.string().describe('o nome do prato, limpo'),
  grupo: z.enum(['Prato principal', 'Acompanhamento', 'Pães e bolos',
                 'Recheios e frios', 'Bolachas e lanches', 'Bebida', 'Sobremesa'])
    .describe('onde o prato entra dentro da refeição'),
  ingredientes: z.array(z.object({
    nome: z.string().describe('nome do ingrediente como se compra no mercado'),
    secao: z.enum(SECOES).describe('em que seção do mercado ele fica'),
    quantidade: z.number().describe('quantidade total para o número de pessoas informado'),
    unidade: z.enum(UNIDADES)
  })).describe('todos os ingredientes, inclusive temperos e o que costuma ser esquecido'),
  observacao: z.string().describe('uma dica pratica de preparo para esta quantidade, '
    + 'algo que quem nunca fez este prato para tanta gente erraria. Uma frase.')
});

const EsquemaRevisao = z.object({
  alertas: z.array(z.object({
    gravidade: z.enum(['alta', 'media', 'baixa']),
    texto: z.string().describe('uma frase dizendo o que está faltando ou errado')
  })).describe('o que pode dar errado neste cardápio, do mais grave para o menos'),
  faltando: z.array(z.object({
    nome: z.string(),
    secao: z.enum(SECOES),
    quantidade: z.number(),
    unidade: z.enum(UNIDADES),
    motivo: z.string().describe('por que este item deveria estar na lista')
  })).describe('itens que a lista não tem e deveria ter')
});

const INSTRUCOES = `Você ajuda a equipe de cozinha de retiros de igreja no Brasil a
calcular compras. Quem lê você muitas vezes nunca organizou uma cozinha antes.

Regras de quantidade:
- Trabalhe sempre com o total para o número de pessoas informado, nunca por pessoa.
- Retiro tem gente com fome e serve à vontade. É melhor sobrar um pouco do que faltar.
- Use unidades de mercado brasileiro: kg, L, pacote, lata, dúzia, maço, pé.
- Quantidades redondas de compra. Ninguém compra 3,847 kg de arroz.
- Inclua os temperos especificos do prato: colorau, louro, cominho, alho, o que
  o prato pedir. E o que costuma ser esquecido por quem nunca cozinhou para tanta
  gente.
- NAO inclua, porque a ferramenta ja calcula por fora e entrariam em dobro:
  agua, sal, oleo, acucar, vinagre, guardanapo, gas e material de limpeza.
- Não repita na lista o arroz e o feijão como acompanhamento se o prato já os tem.

Escreva em português do Brasil, sem travessão.`;

/* -------- teto de gasto --------
   O medo real de pôr uma chave de API num botão público não é a conta do mês
   normal, é o mês em que algo dá errado e ninguém percebe. Este contador
   existe para esse caso: passando do teto, o Worker simplesmente para de
   chamar a IA. O site continua funcionando no cálculo determinístico, que não
   custa nada, e a pessoa vê uma mensagem explicando.

   A chave do KV é o mês, então o contador zera sozinho na virada e os meses
   velhos somem com o TTL. */

function mesAtual(){
  const d = new Date();
  return 'uso-' + d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
}

async function usoDoMes(env){
  if (!env.USO) return 0;
  const v = await env.USO.get(mesAtual());
  return parseInt(v, 10) || 0;
}

async function contarUso(env){
  if (!env.USO) return;
  const chave = mesAtual();
  const atual = parseInt(await env.USO.get(chave), 10) || 0;
  /* 70 dias de validade: cobre o mês inteiro e some sozinho depois. */
  await env.USO.put(chave, String(atual + 1), { expirationTtl: 60 * 60 * 24 * 70 });
}

/* -------- a chamada --------
   Streaming, e nao a chamada simples, porque resposta longa sem streaming
   estoura timeout de intermediario: media de 30s dava erro de rede em uma
   tentativa sim, outra nao. Com streaming a conexao fica viva o tempo todo.

   O output_config.format continua valendo: a API garante que o texto final
   obedece ao esquema, entao o JSON.parse aqui e seguro. Uma retentativa
   cobre a falha de rede solta, que acontece. */

async function chamarIA(client, esquema, sistema, pergunta){
  async function uma(){
    const stream = client.messages.stream({
      model: 'claude-opus-5',
      max_tokens: 8000,
      system: sistema,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low', format: zodOutputFormat(esquema) },
      messages: [{ role: 'user', content: pergunta }]
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'refusal') return { recusou: true };
    const texto = (msg.content || [])
      .filter(function(b){ return b.type === 'text'; })
      .map(function(b){ return b.text; })
      .join('');
    return { dados: JSON.parse(texto) };
  }

  try { return await uma(); }
  catch (e) {
    if (e && e.status) throw e;   /* erro da API: nao adianta insistir */
    return await uma();           /* falha de rede: uma segunda chance */
  }
}

function cabecalhosCors(origem, permitidas){
  const ok = origem && permitidas.includes(origem);
  return {
    'Access-Control-Allow-Origin': ok ? origem : permitidas[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function json(dados, status, cors){
  return new Response(JSON.stringify(dados), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors }
  });
}

export default {
  async fetch(request, env) {
    const permitidas = (env.ORIGENS_PERMITIDAS || '').split(',').map(s => s.trim()).filter(Boolean);
    const origem = request.headers.get('Origin');
    const cors = cabecalhosCors(origem, permitidas);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ erro: 'Use POST.' }, 405, cors);

    /* Sem esta checagem, qualquer site na internet poderia gastar a chave. */
    if (!origem || !permitidas.includes(origem)) {
      return json({ erro: 'Origem não autorizada.' }, 403, cors);
    }
    let corpo;
    try { corpo = await request.json(); }
    catch (e) { return json({ erro: 'Corpo inválido.' }, 400, cors); }

    /* Consulta de saldo, para a tela poder avisar antes de a pessoa tentar. */
    const teto = parseInt(env.TETO_MENSAL, 10) || 60;
    const usadas = await usoDoMes(env);
    if (corpo.acao === 'saldo'){
      return json({ usadas: usadas, teto: teto, restam: Math.max(0, teto - usadas) }, 200, cors);
    }

    if (usadas >= teto){
      return json({
        erro: 'O limite de ' + teto + ' consultas deste mês acabou. A lista continua '
          + 'sendo calculada normalmente, só sem a ajuda da IA. O contador zera no dia 1.',
        limiteAtingido: true, usadas: usadas, teto: teto
      }, 429, cors);
    }

    if (!env.ANTHROPIC_API_KEY) {
      return json({ erro: 'O Worker está sem a chave. Rode: wrangler secret put ANTHROPIC_API_KEY' }, 500, cors);
    }

    const pessoas = Math.min(2000, Math.max(1, parseInt(corpo.pessoas, 10) || 1));
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    try {
      if (corpo.acao === 'sugerir-prato') {
        const prato = String(corpo.prato || '').trim().slice(0, 200);
        if (!prato) return json({ erro: 'Diga o nome do prato.' }, 400, cors);

        const r = await chamarIA(client, EsquemaPrato, INSTRUCOES,
          `Preciso servir "${prato}" para ${pessoas} pessoas num retiro.`
          + ` Liste os ingredientes com a quantidade total para essas ${pessoas} pessoas.`
          + (corpo.refeicao ? ` É para o ${corpo.refeicao}.` : ''));

        if (r.recusou) {
          return json({ erro: 'O modelo não respondeu a este pedido.' }, 422, cors);
        }
        await contarUso(env);
        return json({ prato: r.dados, pessoas: pessoas,
                      usadas: usadas + 1, teto: teto }, 200, cors);
      }

      if (corpo.acao === 'revisar-cardapio') {
        const refeicoes = (corpo.refeicoes || []).slice(0, 40);
        const itens = (corpo.itens || []).slice(0, 300);
        if (!refeicoes.length) return json({ erro: 'Mande o cardápio.' }, 400, cors);

        const descricao = refeicoes
          .map(r => `- ${r.nome}: ${(r.pratos || []).join(', ') || '(nada definido)'}`)
          .join('\n');

        const r = await chamarIA(client, EsquemaRevisao, INSTRUCOES,
          `Retiro para ${pessoas} pessoas. O cardápio é este:

${descricao}

`
          + `A lista de compras gerada tem estes itens:
${itens.join(', ')}

`
          + `Revise procurando o que vai faltar na hora: tempero que ninguém lembra, `
          + `ingrediente de um prato que ficou de fora, refeição sem nada definido, `
          + `quantidade que parece errada. Seja específico e curto.`);

        if (r.recusou) {
          return json({ erro: 'O modelo não respondeu a este pedido.' }, 422, cors);
        }
        await contarUso(env);
        return json({ revisao: r.dados, pessoas: pessoas,
                      usadas: usadas + 1, teto: teto }, 200, cors);
      }

      return json({ erro: 'Ação desconhecida.' }, 400, cors);

    } catch (erro) {
      /* Trata pelo status e não por instanceof: depois de empacotado pelo
         wrangler, a identidade das classes de erro do SDK não sobrevive, e o
         instanceof cai sempre no caso genérico. Testado, era isso mesmo. */
      /* Fica no log da Cloudflare (wrangler tail), nunca na resposta: mensagem
         de erro de API as vezes carrega detalhe que nao deve vazar. */
      console.error('IA falhou:', erro && erro.name, '| status:', erro && erro.status,
                    '| msg:', erro && erro.message,
                    '| detalhe:', JSON.stringify(erro && erro.error),
                    '| req:', erro && erro.request_id);
      const status = erro && erro.status;
      if (status === 401 || status === 403) {
        return json({ erro: 'A chave da API foi recusada. Confira o secret ANTHROPIC_API_KEY.' }, 502, cors);
      }
      if (status === 429) {
        return json({ erro: 'Muitos pedidos de uma vez. Tente de novo em um minuto.' }, 429, cors);
      }
      if (status === 400) {
        /* Saldo zerado chega como 400 genérico. Sem este caso, a mensagem
           dizia "recusou o formato do pedido" e mandava procurar bug onde
           não havia nenhum. */
        const msg = String(erro && erro.message);
        if (/credit balance/i.test(msg)) {
          return json({ erro: 'Os créditos da API acabaram. Recarregue em '
            + 'console.anthropic.com, em Plans & Billing. Enquanto isso a lista '
            + 'continua sendo calculada normalmente, e o botão de perguntar no '
            + 'ChatGPT continua funcionando.', semCredito: true }, 402, cors);
        }
        return json({ erro: 'A IA recusou o formato do pedido.' }, 502, cors);
      }
      if (status) {
        return json({ erro: 'A IA não respondeu agora (erro ' + status + ').' }, 502, cors);
      }
      return json({ erro: 'Não consegui falar com a IA. Tente de novo.' }, 502, cors);
    }
  }
};
