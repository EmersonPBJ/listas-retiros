# Lista de compras dos retiros

Lista de compras editável e compartilhada para os retiros da igreja. Quem está no
mercado abre o link no celular, vai marcando o que já pegou, e todo mundo que
estiver com a página aberta vê a marcação aparecer em poucos segundos.

Feito para o 6º Acamps 7 Jovens (45 pessoas, 8 refeições, de sábado ao meio-dia
até segunda no almoço). A lista base já vem preenchida com 62 itens divididos em
9 seções.

## Como rodar

Não tem build, não tem dependência, não tem npm. É um arquivo HTML só.

- Local: abra o `index.html` com dois cliques.
- Publicado: GitHub Pages serve a branch `main`, raiz do repositório.

Todo o CSS e todo o JavaScript estão dentro do próprio `index.html`. Isso é
proposital: o arquivo precisa funcionar sozinho, porque ele também é baixado e
enviado por WhatsApp pelo botão "Enviar".

## Como a sincronização funciona

Não usa o SDK do Firebase. Usa a REST API do Realtime Database direto, com
`fetch`. É a parte que mais rende dúvida depois de um tempo parado, então segue
o desenho inteiro.

### O endereço

No topo do `<script>` existe uma constante:

```js
var SYNC_URL = "";
```

Quando ela está vazia, a página funciona só no aparelho (localStorage) e mostra
a caixa "Ligar a sincronização". Quando ela tem uma URL, a página monta o
endpoint assim:

```js
SYNC_URL.replace(/\/+$/, '') + '/lista.json'
```

Ou seja, `https://seu-projeto-default-rtdb.firebaseio.com` vira
`https://seu-projeto-default-rtdb.firebaseio.com/lista.json`. O `.json` no final
é o que faz o Realtime Database responder via REST. Todos os dados ficam em um
único nó chamado `lista`.

### O formato gravado

O que vai e volta do banco é sempre este objeto:

```json
{ "v": 1717430000000, "data": [ ...seções... ] }
```

- `v` é um `Date.now()` no momento da escrita, funciona como número de versão.
- `data` é o array de seções, cada seção com `t` (título), `h` (cor do
  marcador), `note` (aviso opcional em HTML) e `i` (itens). Cada item tem `q`
  (quantidade), `n` (nome), `s` (subtexto) e `done` (booleano). O `done` só
  aparece no objeto depois que alguém marca o item pela primeira vez.

### Escrita

Qualquer edição chama `mark()`, que faz três coisas: marca a página como suja,
salva em localStorage e chama `push()`. O `push()` faz um `PUT` no endpoint com
o objeto acima e atualiza `localV` com o novo timestamp.

`PUT` substitui o nó inteiro. Não tem merge por campo: quem grava por último
grava a lista toda.

### Leitura

`pull()` faz um `GET` no mesmo endpoint a cada 5 segundos (`setInterval` em
`startSync()`). A resposta só é aplicada se as três condições valerem:

1. `j.v > localV`, ou seja, a versão remota é mais nova que a última que este
   aparelho escreveu ou recebeu.
2. `!busy()`, ou seja, o dedo do usuário não está dentro de um campo de
   quantidade, nome ou subtexto naquele instante. Sem isso, o poll apagaria o
   que a pessoa está digitando.
3. `j.data` é um array.

A bolinha verde ao lado do texto de ajuda é o indicador de conexão, controlado
por `setLive()`. Cinza quer dizer que o `fetch` falhou e as alterações estão
indo só para o localStorage.

### Conflito

O modelo é o mais simples possível: último a gravar vence, com granularidade de
lista inteira. Duas pessoas marcando itens diferentes ao mesmo tempo funcionam
bem na prática porque o intervalo entre a marcação e o `push` é curto, mas duas
pessoas editando o mesmo item no mesmo segundo perdem uma das edições. Se um dia
isso incomodar, o caminho é gravar por item (`/lista/data/<seção>/i/<item>.json`)
em vez do nó inteiro.

## Onde os dados moram

Três lugares, nesta ordem de prioridade na hora de carregar:

1. `localStorage`, chave `acamps-lista-v6`. É o que garante que a lista abre
   preenchida mesmo sem internet.
2. Realtime Database, nó `lista`. É a fonte compartilhada.
3. A constante `BASE` dentro do `index.html`. É a lista original de fábrica, o
   que o botão "Restaurar lista original" devolve.

## Configurando o Firebase

1. Crie um projeto no console do Firebase e habilite o Realtime Database.
2. Copie a URL do banco, algo como
   `https://seu-projeto-default-rtdb.firebaseio.com`.
3. Nas regras do banco, libere leitura e escrita no nó `lista`.
4. Abra a página publicada, cole a URL na caixa "Ligar a sincronização" e toque
   em "Gravar e baixar". O arquivo baixado já sai com a `SYNC_URL` preenchida.
5. Suba esse arquivo baixado por cima do `index.html` do repositório.

Sobre as regras: uma lista de compras de retiro não tem dado sensível, e o
projeto não tem login, então o modo aberto é aceitável enquanto o link não
circula fora do grupo. Vale ao menos limitar por data de expiração ou trocar a
URL do banco depois do retiro, porque quem tem o link tem escrita.

## Os botões

- **Salvar**: grava no localStorage deste aparelho.
- **Enviar**: gera um novo `index.html` completo, com a lista atual já embutida
  na constante `BASE` e a `SYNC_URL` preenchida, e baixa esse arquivo. É assim
  que se congela uma versão para mandar no grupo ou para republicar.
- **Restaurar lista original**: volta para a `BASE` que está no código.
- **Desfazer**: reverte a última remoção de item, disponível por 6 segundos.

## Próximo passo

Transformar isso em uma tela inicial com vários retiros, cada um com sua lista
própria. O caminho natural é trocar o nó único `lista` por `retiros/<id>/lista`
e ter um `index.html` de seleção mais uma página de lista que lê o id da URL.

## Créditos

Uma contribuição raiseUP para os retiros da igreja.
