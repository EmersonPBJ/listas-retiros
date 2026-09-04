# Compras dos retiros

Listas de compras editáveis e compartilhadas para os retiros da igreja. A tela
inicial lista os retiros, cada um com a sua lista própria. Dá para começar da
lista padrão ou montar o cardápio e deixar as quantidades serem calculadas para
o número de pessoas. Quem está no mercado abre o link no celular, vai marcando o
que já pegou, e todo mundo que estiver com a página aberta vê a marcação
aparecer em poucos segundos. No fim dá para imprimir ou salvar em PDF.

No ar em https://emersonpbj.github.io/listas-retiros/

## Como rodar

Não tem build, não tem dependência, não tem npm. São arquivos estáticos.

- Local: qualquer servidor estático na pasta, por exemplo
  `python -m http.server 4173`. Abrir por `file://` não serve, porque o
  navegador bloqueia o `fetch` do banco nesse esquema.
- Publicado: GitHub Pages serve a branch `main`, raiz do repositório.

## Os arquivos

| arquivo | o que é |
| --- | --- |
| `index.html` | tela inicial: lista os retiros, cria e apaga |
| `lista.html` | a lista de um retiro, aberta como `lista.html?r=<id>` |
| `cardapio.html` | monta o cardápio e gera a lista com as quantidades calculadas |
| `config.js` | endereço do banco e a camada de sincronização |
| `modelo.js` | lista padrão de 62 itens, para quem quer começar pronto |
| `receitas.js` | catálogo de pratos e o gerador de lista a partir do cardápio |
| `app.css` | estilo das três páginas, incluindo a folha de impressão |
| `refeicoes.html` | insumos separados por refeição, para a cozinha no dia |
| `database.rules.json` | regras de segurança do banco, versionadas |
| `worker/` | Cloudflare Worker que guarda a chave da IA |

A `SYNC_URL` aparece em um lugar só, no topo do `config.js`. Trocou ali, trocou
em todo lado.

## Como a sincronização funciona

Não usa o SDK do Firebase. Usa a REST API do Realtime Database direto, com
`fetch`. É a parte que mais rende dúvida depois de um tempo parado, então segue
o desenho inteiro.

### O endereço

No topo do `config.js`:

```js
var SYNC_URL = "https://seu-projeto-default-rtdb.firebaseio.com";
```

Vazio, o site funciona só no aparelho de quem abriu, usando localStorage. Nada
quebra e nada se perde, mas nada é compartilhado, e a tela inicial mostra um
aviso dizendo isso.

A função `dbURL()` monta o endereço de cada nó acrescentando `.json` no final,
que é o que faz o Realtime Database responder via REST:

```
dbURL('retiros/acamps-7-jovens-k3f9')
  -> https://<projeto>.firebaseio.com/retiros/acamps-7-jovens-k3f9.json
```

### O que fica no banco

Dois ramos:

```
/indice/<id>   = {nome, pessoas, refeicoes, periodo, criadoEm, progresso}
/retiros/<id>  = {v, data, obs, meta, cardapio?}
```

O `indice` existe por um motivo prático: a tela inicial precisa mostrar os nomes
dos retiros, e sem ele teria que baixar a lista inteira de cada um só para ler
o título. Com o índice, a home carrega com um `GET` só.

O `progresso` é `{feitos, todos}` e existe pelo mesmo motivo: a tela inicial
mostra "12/62 no carrinho" sem precisar baixar as listas. Quem publica é a
`publicarProgresso()` em `lista.html`, com um `PATCH` pequeno, e só quando o
placar muda de verdade, senão gastaria uma requisição a cada tecla digitada.

Detalhe que já causou bug: a publicação acontece dentro de `aplicar()`, depois
que os dados reais chegaram, e não em `iniciar()`. No `iniciar()` a lista ainda
pode ser o modelo padrão de 62 itens, e o placar publicado não seria o desta
lista.

Dentro de `/retiros/<id>`:

- `v` é um `Date.now()` do momento da escrita, e funciona como número de versão.
- `data` é o array de seções. Cada seção tem `t` (título), `h` (cor do
  marcador), `note` (aviso opcional em HTML) e `i` (itens). Cada item tem `q`
  (quantidade), `n` (nome), `s` (subtexto) e `done` (booleano). O `done` só
  aparece no objeto depois que alguém marca o item pela primeira vez.
- `obs` é o texto livre de observações da cozinha, editável no rodapé.
- `meta` é uma cópia do que está no índice, para a lista abrir com o cabeçalho
  certo mesmo se o índice ainda não tiver chegado.
- `cardapio` só existe em retiro que nasceu do gerador, e guarda
  `{dias, refeicoes, extras}` para dar para reabrir e recalcular depois.

### Escrita

Qualquer edição chama `mark()`, que faz três coisas: marca a página como suja,
grava em localStorage e chama `push()`. O `push()` faz um `PUT` em
`/retiros/<id>` com o pacote inteiro e atualiza `localV` com o novo timestamp.

`PUT` substitui o nó inteiro. Não tem merge por campo: quem grava por último
grava a lista toda. Criar retiro usa `PATCH` no índice, que acrescenta uma
chave sem apagar as outras.

### Leitura

`pull()` faz um `GET` no mesmo nó a cada 5 segundos. A resposta só é aplicada se
as três condições valerem:

1. `j.v > localV`, ou seja, a versão remota é mais nova que a última que este
   aparelho escreveu ou recebeu.
2. `!digitando()`, ou seja, o cursor não está dentro de um campo de quantidade,
   nome, subtexto ou observações naquele instante. **Esta é a condição que não
   é óbvia depois de um ano:** sem ela, o poll de 5 segundos sobrescreveria o
   que a pessoa está digitando no meio da palavra.
3. `j.data` é um array.

A bolinha ao lado do texto de ajuda é o indicador de conexão, controlado por
`setLive()`. Cinza quer dizer que o `fetch` falhou e as alterações estão indo só
para o localStorage.

### Conflito

O modelo é o mais simples possível: último a gravar vence, com o retiro inteiro
como unidade. Duas pessoas marcando itens diferentes ao mesmo tempo funcionam
bem na prática, porque a janela entre a marcação e o `push` é curta. Duas
pessoas editando o mesmo item no mesmo segundo perdem uma das edições. Se um dia
isso incomodar, o caminho é gravar por item, em
`/retiros/<id>/data/<seção>/i/<item>.json`, em vez do nó inteiro.

## Onde os dados moram

Três lugares, nesta ordem de prioridade ao carregar:

1. `localStorage`, chaves `retiros-indice-v1` para o índice e
   `retiro-<id>-v1` para cada lista. É o que faz a página abrir preenchida sem
   internet, situação real de muito sítio de retiro.
2. Realtime Database, ramos `/indice` e `/retiros`. É a fonte compartilhada.
3. `modelo.js`, a lista de fábrica. É o ponto de partida de todo retiro novo e o
   destino do botão "Restaurar lista original".

A página desenha primeiro o que veio do localStorage, para abrir cheia na hora,
e só depois deixa o banco corrigir se tiver algo mais novo.

## Imprimir e salvar em PDF

O botão "Imprimir ou PDF" chama `window.print()`. Não entra biblioteca de PDF
aqui de propósito: a caixa de impressão do próprio navegador já tem "Salvar como
PDF" como destino, no celular e no computador, e o resultado sai com texto
selecionável em vez de imagem.

O que a folha de impressão faz, no bloco `@media print` do `app.css`:

- Some com tudo que é controle: barra de salvar, botões de adicionar e remover,
  barra de progresso, link de voltar, avisos.
- Troca a caixinha verde de marcado por um quadrado vazio com borda preta, e
  desenha um `X` nos já comprados via `input:checked::after`. Assim a folha
  serve para marcar a caneta no mercado.
- Tira o riscado dos itens comprados, que na tela ajuda e no papel atrapalha.
- Segura cada seção inteira na mesma página com `break-inside: avoid`, para não
  cortar "Açougue" no meio.
- Carimba data, hora e quantos itens já estavam no carrinho.

## O gerador de lista pelo cardápio

`cardapio.html` faz o caminho inverso da lista: em vez de escrever item por
item, você diz quantas pessoas, quantos dias e o que vai ser servido em cada
refeição. A lista sai pronta, com as quantidades calculadas e agrupadas por
seção de mercado.

### De onde vêm os números

Da lista real do 6º Acamps 7 Jovens, que era para 45 pessoas em 3 dias.
Dividindo aquelas quantidades por 45 e por 3, saem taxas limpas: água 0,6667 L
por pessoa por dia, óleo 0,037 L, guardanapo 0,0444 pacote. A lista é
internamente consistente nessa conta, o que indica que foi feita por quem sabia
o que estava fazendo. O catálogo é essa lista convertida em taxa, não um chute.

A prova disso está no próprio repositório: rodando o gerador com o cardápio
original daquele retiro, 59 dos 62 itens saem idênticos à lista comprada, e os
3 restantes ficam dentro de 20%, sempre para cima, por arredondamento de item
contável.

Os pratos marcados com `estimado: true` em `receitas.js` são a exceção:
churrasco, cachorro-quente, strogonoff, sopa e polenta não vieram daquele
retiro. Aparecem com um `~` na tela.

### As três escalas

| tipo | escala com | exemplos |
| --- | --- | --- |
| `BASICOS_DIA` | pessoas × dias | água, café, guardanapo, detergente |
| `BASICOS_PESSOA` | pessoas | tempero completo, pimenta, vinagre |
| `BASICOS_FIXO` | nada | botijão de gás, café solúvel |
| `PRATOS` | pessoas × vezes servido | os ingredientes de cada prato |

A separação importa: água escala com o tempo de permanência, tempero não. Um
retiro de 5 dias com as mesmas 45 pessoas precisa de mais água e do mesmo
vidro de shoyu.

`EXTRAS` é a lista de restrições alimentares e opcionais, que só entram se a
pessoa marcar. É o tipo de item que quem nunca organizou retiro esquece.

### Arredondamento

Quantidade de mercado, não de laboratório. Peso e volume caem de meio em meio
quando passam de 3, de quarto em quarto entre 1 e 3, e abaixo de 1 viram grama
ou mililitro de 50 em 50. Contáveis sempre sobem, porque faltar é pior que
sobrar, e acima de 20 sobem de 5 em 5, que é como se compra pão.

### Regerar

O cardápio fica guardado junto com a lista, em `cardapio`, então dá para voltar
e recalcular quando o número de pessoas muda. Duas coisas importam nesse
momento: quantidade editada na mão se perde, e a página avisa antes quando
detecta que houve edição manual; já o que a equipe marcou como comprado é
transportado por nome para a lista nova, porque zerar o carrinho de quem está
no meio do mercado seria cruel.

## A IA que sugere quantidades

O site é estático no GitHub Pages, e isso decide a arquitetura inteira desta
parte: **qualquer coisa no `config.js` é pública**. Uma chave da API da
Anthropic ali seria copiada e gasta por qualquer pessoa que abrisse o código.

Por isso existe o `worker/`, um Cloudflare Worker que fica no meio. A chave
mora nele como secret cifrado, o site chama o Worker, o Worker chama a
Anthropic. O navegador nunca vê a chave.

```
navegador  ->  anjo-cozinha-ia.raiseupfoto.workers.dev  ->  api.anthropic.com
(sem chave)         (chave em secret)
```

### Duas ações

- `sugerir-prato`: recebe o nome de um prato e um número de pessoas, devolve os
  ingredientes com quantidade e seção de mercado. É o que preenche o cadastro
  de prato personalizado quando alguém digita algo que não está no catálogo.
- `revisar-cardapio`: recebe o cardápio inteiro e a lista gerada, devolve
  alertas ordenados por gravidade e itens que faltam. É a rede para quem nunca
  organizou uma cozinha de retiro.

Ambas usam structured output (`output_config.format` com esquema Zod), então a
resposta chega como objeto validado, não como texto para o site tentar
interpretar.

### Deploy e a chave

```
cd worker
npm install
npx wrangler deploy
npx wrangler secret put ANTHROPIC_API_KEY
```

O `secret put` pergunta a chave no terminal e a manda cifrada para a
Cloudflare. Ela nunca entra no repositório, nem no `wrangler.toml`, nem em
lugar nenhum que o git veja. Para desenvolvimento local, `worker/.dev.vars`
guarda uma chave de teste e está no `.gitignore`.

### Defesas

- **Origem**: o Worker só responde a requisições vindas dos endereços em
  `ORIGENS_PERMITIDAS`, no `wrangler.toml`. Outro site recebe 403.
- **Degradação**: com `IA_URL` vazia no `config.js`, os botões de IA nem
  aparecem e o site funciona igual, no cálculo determinístico. Com o Worker no
  ar mas sem chave, o erro aparece na tela e o cadastro manual continua
  disponível. Nenhum caminho de falha trava a ferramenta.
- **Erros tratados por status, não por `instanceof`**: depois do empacotamento
  do wrangler a identidade das classes de erro do SDK não sobrevive, e todo
  erro caía no caso genérico. Isso já mordeu uma vez.

### Teto de gasto

O medo real de pôr uma chave de API atrás de um botão público não é a conta do
mês normal, é o mês em que algo dá errado e ninguém percebe. Por isso o Worker
conta as chamadas do mês num KV e para sozinho ao bater `TETO_MENSAL`, que está
no `worker/wrangler.toml`.

Passando do teto, a IA para e **o site continua funcionando**, no cálculo
determinístico, que não custa nada. A tela mostra quantas consultas restam,
para ninguém ser pego de surpresa.

A chave do KV é o mês corrente, então o contador zera sozinho na virada e os
meses velhos somem com o TTL. O contador só anda em chamada que realmente
chegou na IA e voltou: erro de chave ou de rede não consome cota.

Cada consulta é uma chamada ao `claude-opus-5`. Montar um retiro gasta algo
entre 5 e 15 consultas. Com o teto em 60, cabem os 2 retiros por mês esperados
com folga larga, e o gasto fica na casa de centavos de dólar por mês.

Vale pôr também um limite de gasto no painel da Anthropic, em Billing: é a
segunda trava, independente desta, e é grátis de configurar.

## Cache dos arquivos

As referências a `app.css`, `config.js`, `modelo.js` e `receitas.js` carregam
`?v=<número>`. **Ao editar qualquer um desses quatro, incremente o número nos
três HTML.** Sem isso, quem já abriu o site continua com o arquivo velho em
cache, e o sintoma é traiçoeiro: a página parece funcionar mas não sincroniza,
porque está rodando um `config.js` antigo com a `SYNC_URL` vazia.

## Configurando o Firebase

Já está configurado, apontando para
`https://listas-retiros-default-rtdb.firebaseio.com`. Para apontar para outro
banco, troque a `SYNC_URL` no topo do `config.js` e incremente o `?v=` nos três
HTML.

### As regras do banco

As regras vivem em `database.rules.json`, versionadas junto com o código. Elas
liberam leitura e escrita só em `indice` e `retiros`, os dois ramos que o app
usa, e **não expiram**. O resto do banco fica fechado.

Isso importa porque o modo de teste do Firebase, que é o padrão ao criar o
banco, expira em 30 dias e depois bloqueia tudo. O sintoma é traiçoeiro: a
lista simplesmente para de sincronizar, sem erro visível na tela.

Para publicar as regras:

```
firebase deploy --only database
```

Precisa estar logado (`firebase login`) na conta Google **dona do projeto**.
Uma conta que não é dona falha com "Failed to get details for project", e
`firebase projects:list` volta vazio, que é o jeito rápido de descobrir se
você está na conta errada.

Dá para colar as mesmas regras à mão no console, em Realtime Database →
Regras, mas aí elas saem do controle de versão.

Sobre segurança: uma lista de compras de retiro não tem dado sensível, e o
projeto não tem login, então o modo aberto é aceitável enquanto o link circula
só no grupo. Mas vale saber que **quem tem o link tem escrita**, e que a URL do
banco fica visível no `config.js`, que é público. Se um dia isso incomodar, o
caminho é exigir um token na URL ou pôr autenticação anônima do Firebase.

## Os botões da lista

- **Salvar**: grava no localStorage deste aparelho. A sincronização já acontece
  sozinha a cada edição, então este botão é rede de segurança, não obrigação.
- **Imprimir ou PDF**: abre a caixa de impressão do navegador.
- **Restaurar lista original**: volta para o `modelo.js`, perdendo as edições
  deste retiro.
- **Desfazer**: reverte a última remoção de item, disponível por 6 segundos. Na
  tela inicial, reverte também a exclusão de um retiro inteiro, devolvendo a
  lista com as marcações que ela tinha.

## Créditos

Uma contribuição raiseUP para os retiros da igreja.
