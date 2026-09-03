# Compras dos retiros

Listas de compras editáveis e compartilhadas para os retiros da igreja. A tela
inicial lista os retiros, cada um com a sua lista própria. Quem está no mercado
abre o link no celular, vai marcando o que já pegou, e todo mundo que estiver
com a página aberta vê a marcação aparecer em poucos segundos. No fim dá para
imprimir ou salvar em PDF.

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
| `config.js` | endereço do banco e a camada de sincronização |
| `modelo.js` | lista padrão de 62 itens que todo retiro novo recebe |
| `app.css` | estilo das duas páginas, incluindo a folha de impressão |

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
/indice/<id>   = {nome, pessoas, refeicoes, periodo, criadoEm}
/retiros/<id>  = {v, data, obs, meta}
```

O `indice` existe por um motivo prático: a tela inicial precisa mostrar os nomes
dos retiros, e sem ele teria que baixar a lista inteira de cada um só para ler
o título. Com o índice, a home carrega com um `GET` só.

Dentro de `/retiros/<id>`:

- `v` é um `Date.now()` do momento da escrita, e funciona como número de versão.
- `data` é o array de seções. Cada seção tem `t` (título), `h` (cor do
  marcador), `note` (aviso opcional em HTML) e `i` (itens). Cada item tem `q`
  (quantidade), `n` (nome), `s` (subtexto) e `done` (booleano). O `done` só
  aparece no objeto depois que alguém marca o item pela primeira vez.
- `obs` é o texto livre de observações da cozinha, editável no rodapé.
- `meta` é uma cópia do que está no índice, para a lista abrir com o cabeçalho
  certo mesmo se o índice ainda não tiver chegado.

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

## Configurando o Firebase

1. Crie um projeto no console do Firebase e habilite o Realtime Database.
2. Copie a URL do banco, algo como
   `https://seu-projeto-default-rtdb.firebaseio.com`.
3. Cole essa URL na constante `SYNC_URL`, no topo do `config.js`, e faça commit.
4. Nas regras do banco, libere leitura e escrita em `indice` e `retiros`.

Sobre as regras: uma lista de compras de retiro não tem dado sensível, e o
projeto não tem login, então o modo aberto é aceitável enquanto o link circula
só no grupo. Mas vale saber que **quem tem o link tem escrita**, e que a URL do
banco fica visível no `config.js`, que é público. Duas defesas baratas: pôr uma
data de expiração nas regras, ou trocar a URL do banco depois do retiro.

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
