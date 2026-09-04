/* Catálogo e gerador de lista a partir do cardápio.

   De onde vêm os números: da lista real do 6º Acamps 7 Jovens, que era para
   45 pessoas e 3 dias. Dividindo aquelas quantidades por 45 e por 3, saem
   taxas limpas (água 0,667 L por pessoa por dia, óleo 0,037 L, e assim por
   diante). O catálogo é esse retiro convertido em taxa, não um chute. Os
   pratos com estimado:true são os que não vieram de lá, e aparecem com um ~
   na tela.

   Quatro tipos de quantidade:
     BASICOS_DIA    por pessoa por dia    (água, limpeza, base da cozinha)
     BASICOS_PESSOA por pessoa            (temperos, que não escalam com o tempo)
     BASICOS_FIXO   quantidade fixa       (gás)
     PRATOS         por pessoa, cada vez que o prato é servido
*/

var SECOES = [
  {t:'Açougue',                  h:'#c2410c'},
  {t:'Frios e laticínios',       h:'#0369a1'},
  {t:'Hortifruti',               h:'#15803d'},
  {t:'Mercearia',                h:'#7c3aed'},
  {t:'Temperos',                 h:'#a16207'},
  {t:'Bebidas',                  h:'#be123c'},
  {t:'Padaria',                  h:'#0f766e'},
  {t:'Sobremesas',               h:'#db2777'},
  {t:'Limpeza e descartáveis',   h:'#475569'}
];

/* O ciclo de um dia de retiro, na ordem em que acontece. É por esta ordem que
   a ferramenta monta as refeições entre a primeira e a última do período. */
var TIPOS_REFEICAO = [
  {id:'cafe',   nome:'Café da manhã'},
  {id:'almoco', nome:'Almoço'},
  {id:'lanche', nome:'Café da tarde'},
  {id:'janta',  nome:'Janta'}
];

/* Ordem em que os grupos aparecem dentro de uma refeição. Só entram os grupos
   que têm prato daquele tipo, então um café da manhã não mostra "Prato
   principal" vazio, e um almoço não oferece bolacha maria. */
var GRUPOS = [
  'Prato principal',
  'Acompanhamento',
  'Pães e bolos',
  'Recheios e frios',
  'Bolachas e lanches',
  'Bebida',
  'Sobremesa'
];

var DIAS_SEMANA = ['Sexta','Sábado','Domingo','Segunda','Terça','Quarta','Quinta'];

/* -------- básicos: o que a cozinha consome independente do cardápio -------- */

var BASICOS_DIA = [
  {n:'Água',                sec:'Bebidas',               pp:0.6667, un:'L'},
  {n:'Frutas',              sec:'Hortifruti',            pp:0.1481, un:'kg'},
  {n:'Cebola',              sec:'Hortifruti',            pp:0.0444, un:'kg'},
  {n:'Cenoura',             sec:'Hortifruti',            pp:0.0296, un:'kg'},
  {n:'Tomate italiano',     sec:'Hortifruti',            pp:0.0333, un:'kg'},
  {n:'Cebolinha e salsa',   sec:'Hortifruti',            pp:0.0296, un:'maços'},
  {n:'Açúcar',              sec:'Mercearia',             pp:0.0370, un:'kg'},
  {n:'Óleo',                sec:'Mercearia',             pp:0.0370, un:'L'},
  {n:'Sal',                 sec:'Mercearia',             pp:0.0148, un:'kg'},
  {n:'Ovos',                sec:'Frios e laticínios',    pp:0.0259, un:'dz'},
  {n:'Guardanapo',          sec:'Limpeza e descartáveis',pp:0.0444, un:'pct'},
  {n:'Papel toalha',        sec:'Limpeza e descartáveis',pp:0.0444, un:'rolos'},
  {n:'Detergente',          sec:'Limpeza e descartáveis',pp:0.0296, un:'un'},
  {n:'Esponja de louça',    sec:'Limpeza e descartáveis',pp:0.0444, un:'un'},
  {n:'Saco de lixo 100 L',  sec:'Limpeza e descartáveis',pp:0.0148, un:'pct'},
  {n:'Papel alumínio',      sec:'Limpeza e descartáveis',pp:0.0148, un:'rolos'},
  {n:'Filme plástico',      sec:'Limpeza e descartáveis',pp:0.0074, un:'rolo'}
];

var BASICOS_PESSOA = [
  {n:'Tempero completo',    sec:'Temperos',   pp:0.0444, un:'potes'},
  {n:'Pimenta do reino',    sec:'Temperos',   pp:0.1333, un:'saq'},
  {n:'Pasta de alho',       sec:'Temperos',   pp:0.0222, un:'pote'},
  {n:'Vinagre',             sec:'Mercearia',  pp:0.0222, un:'L'}
];

var BASICOS_FIXO = [
  {n:'Molho shoyu',         sec:'Temperos',               un:'frasco', q:1},
  {n:'Botijão de gás',      sec:'Limpeza e descartáveis', un:'un',     q:2,
   s:'conferir se estão cheios antes de subir'}
];

/* Opcionais e restrições alimentares. Não entram sozinhos: a pessoa marca. */
var EXTRAS = [
  {id:'erva-mate',  nome:'Erva-mate para chimarrão', n:'Erva-mate',
   sec:'Bebidas', pp:0.0148, porDia:true, un:'kg',
   s:'só se a organização não pedir que cada um leve a sua'},
  {id:'sem-lactose', nome:'Tem alguém sem lactose', n:'Leite sem lactose',
   sec:'Frios e laticínios', q:4, un:'L',
   s:'conferir também manteiga e queijo da pessoa'},
  {id:'sem-gluten', nome:'Tem alguém sem glúten', n:'Pão e massa sem glúten',
   sec:'Padaria', q:2, un:'pct',
   s:'guardar separado para não contaminar'},
  {id:'vegetariano', nome:'Tem alguém vegetariano', n:'Proteína de soja',
   sec:'Mercearia', q:1, un:'kg',
   s:'substitui a carne nas refeições principais'}
];

/* -------- os pratos --------
   pp    = por pessoa, cada vez que o prato é servido
   grupo = onde ele aparece dentro da refeição
   tipos = em quais refeições ele é oferecido como sugestão */

var PRATOS = [
  /* ----- pratos principais ----- */
  {id:'carreteiro', nome:'Carreteiro', grupo:'Prato principal', tipos:['almoco','janta'], ing:[
    {n:'Arroz',                        sec:'Mercearia', pp:0.111, un:'kg'},
    {n:'Paleta ou patinho em cubos',   sec:'Açougue',   pp:0.111, un:'kg'},
    {n:'Bacon',                        sec:'Açougue',   pp:0.011, un:'kg'},
    {n:'Batata palha',                 sec:'Mercearia', pp:0.044, un:'kg'}
  ]},

  {id:'massa-guisado', nome:'Massa com guisado', grupo:'Prato principal', tipos:['almoco','janta'], ing:[
    {n:'Massa parafuso ou penne', sec:'Mercearia', pp:0.111, un:'kg'},
    {n:'Carne moída',             sec:'Açougue',   pp:0.122, un:'kg'},
    {n:'Molho de tomate',         sec:'Mercearia', pp:0.044, un:'L'},
    {n:'Extrato de tomate',       sec:'Mercearia', pp:0.022, un:'kg'}
  ]},

  {id:'arroz-galinha', nome:'Arroz com galinha', grupo:'Prato principal', tipos:['almoco','janta'], ing:[
    {n:'Arroz',        sec:'Mercearia', pp:0.111, un:'kg'},
    {n:'Sobrecoxa',    sec:'Açougue',   pp:0.222, un:'kg'},
    {n:'Milho verde',  sec:'Mercearia', pp:0.089, un:'latas'},
    {n:'Ervilha',      sec:'Mercearia', pp:0.067, un:'latas'}
  ]},

  {id:'delicia-galinha', nome:'Delícia de galinha', grupo:'Prato principal', tipos:['almoco','janta'], ing:[
    {n:'Peito de frango',    sec:'Açougue',            pp:0.100, un:'kg'},
    {n:'Farinha de trigo',   sec:'Mercearia',          pp:0.022, un:'kg'},
    {n:'Leite',              sec:'Frios e laticínios', pp:0.111, un:'L'},
    {n:'Mussarela',          sec:'Frios e laticínios', pp:0.033, un:'kg'},
    {n:'Creme de leite',     sec:'Frios e laticínios', pp:0.133, un:'cx'}
  ]},

  {id:'strogonoff', nome:'Strogonoff de frango', grupo:'Prato principal', tipos:['almoco','janta'], estimado:true, ing:[
    {n:'Peito de frango',   sec:'Açougue',            pp:0.150, un:'kg'},
    {n:'Creme de leite',    sec:'Frios e laticínios', pp:0.200, un:'cx'},
    {n:'Extrato de tomate', sec:'Mercearia',          pp:0.015, un:'kg'},
    {n:'Batata palha',      sec:'Mercearia',          pp:0.040, un:'kg'},
    {n:'Arroz',             sec:'Mercearia',          pp:0.111, un:'kg'}
  ]},

  {id:'salsichao', nome:'Salsichão com pão', grupo:'Prato principal', tipos:['almoco','janta'], ing:[
    {n:'Salsichão',     sec:'Açougue', pp:0.178, un:'kg'},
    {n:'Pão francês',   sec:'Padaria', pp:0.44,  un:'un'}
  ]},

  {id:'churrasco', nome:'Churrasco', grupo:'Prato principal', tipos:['almoco','janta'], estimado:true, ing:[
    {n:'Carne para churrasco',    sec:'Açougue',   pp:0.400, un:'kg'},
    {n:'Linguiça para churrasco', sec:'Açougue',   pp:0.100, un:'kg'},
    {n:'Sal grosso',              sec:'Temperos',  pp:0.030, un:'kg'},
    {n:'Pão francês',             sec:'Padaria',   pp:0.44,  un:'un'},
    {n:'Carvão',                  sec:'Limpeza e descartáveis', pp:0.150, un:'kg'}
  ]},

  {id:'sopa', nome:'Sopa de legumes com carne', grupo:'Prato principal', tipos:['janta'], estimado:true, ing:[
    {n:'Paleta ou patinho em cubos', sec:'Açougue',   pp:0.080, un:'kg'},
    {n:'Batata inglesa',             sec:'Hortifruti',pp:0.100, un:'kg'},
    {n:'Macarrão para sopa',         sec:'Mercearia', pp:0.030, un:'kg'}
  ]},

  {id:'polenta', nome:'Polenta com molho', grupo:'Prato principal', tipos:['almoco','janta'], estimado:true, ing:[
    {n:'Farinha de polenta', sec:'Mercearia',          pp:0.100, un:'kg'},
    {n:'Molho de tomate',    sec:'Mercearia',          pp:0.060, un:'L'},
    {n:'Carne moída',        sec:'Açougue',            pp:0.100, un:'kg'},
    {n:'Queijo ralado',      sec:'Frios e laticínios', pp:0.020, un:'kg'}
  ]},

  {id:'cachorro-quente', nome:'Cachorro-quente', grupo:'Prato principal', tipos:['janta','lanche'], estimado:true, ing:[
    {n:'Salsicha',        sec:'Açougue',   pp:0.150, un:'kg'},
    {n:'Pão de hot dog',  sec:'Padaria',   pp:2,     un:'un'},
    {n:'Molho de tomate', sec:'Mercearia', pp:0.050, un:'L'},
    {n:'Batata palha',    sec:'Mercearia', pp:0.030, un:'kg'}
  ]},

  /* ----- acompanhamentos ----- */
  {id:'feijao', nome:'Feijão', grupo:'Acompanhamento', tipos:['almoco','janta'], ing:[
    {n:'Feijão preto',        sec:'Mercearia', pp:0.067,  un:'kg'},
    {n:'Linguiça calabresa',  sec:'Açougue',   pp:0.0167, un:'kg'}
  ]},

  {id:'arroz-branco', nome:'Arroz branco', grupo:'Acompanhamento', tipos:['almoco','janta'], ing:[
    {n:'Arroz', sec:'Mercearia', pp:0.111, un:'kg'}
  ]},

  {id:'maionese', nome:'Salada de maionese', grupo:'Acompanhamento', tipos:['almoco','janta'], ing:[
    {n:'Batata inglesa', sec:'Hortifruti',        pp:0.067, un:'kg'},
    {n:'Maionese',       sec:'Frios e laticínios',pp:0.055, un:'kg'},
    {n:'Cenoura',        sec:'Hortifruti',        pp:0.044, un:'kg'},
    {n:'Ovos',           sec:'Frios e laticínios',pp:0.033, un:'dz'}
  ]},

  {id:'salpicao', nome:'Salpicão', grupo:'Acompanhamento', tipos:['almoco','janta'], ing:[
    {n:'Peito de frango', sec:'Açougue',            pp:0.056, un:'kg'},
    {n:'Maionese',        sec:'Frios e laticínios', pp:0.078, un:'kg'},
    {n:'Batata palha',    sec:'Mercearia',          pp:0.067, un:'kg'},
    {n:'Milho verde',     sec:'Mercearia',          pp:0.089, un:'latas'},
    {n:'Ervilha',         sec:'Mercearia',          pp:0.067, un:'latas'},
    {n:'Creme de leite',  sec:'Frios e laticínios', pp:0.133, un:'cx'}
  ]},

  {id:'salada-verde', nome:'Salada verde', grupo:'Acompanhamento', tipos:['almoco','janta'], ing:[
    {n:'Alface',          sec:'Hortifruti', pp:0.267, un:'pés'},
    {n:'Tomate italiano', sec:'Hortifruti', pp:0.044, un:'kg'},
    {n:'Beterraba',       sec:'Hortifruti', pp:0.133, un:'kg'},
    {n:'Cenoura',         sec:'Hortifruti', pp:0.044, un:'kg'},
    {n:'Batata inglesa',  sec:'Hortifruti', pp:0.044, un:'kg'}
  ]},

  {id:'queijo-ralado', nome:'Queijo ralado', grupo:'Acompanhamento', tipos:['almoco','janta'], ing:[
    {n:'Queijo ralado', sec:'Frios e laticínios', pp:0.020, un:'kg'}
  ]},

  {id:'pao-na-mesa', nome:'Pão francês na mesa', grupo:'Acompanhamento', tipos:['almoco','janta'], ing:[
    {n:'Pão francês', sec:'Padaria', pp:0.44, un:'un'}
  ]},

  /* ----- pães e bolos ----- */
  {id:'pao-frances', nome:'Pão francês', grupo:'Pães e bolos', tipos:['cafe','lanche'], ing:[
    {n:'Pão francês', sec:'Padaria', pp:0.44, un:'un'}
  ]},

  {id:'pao-sanduiche', nome:'Pão de sanduíche', grupo:'Pães e bolos', tipos:['cafe','lanche'], estimado:true, ing:[
    {n:'Pão de sanduíche', sec:'Padaria', pp:0.15, un:'pct'}
  ]},

  {id:'pao-caseiro', nome:'Pão caseiro', grupo:'Pães e bolos', tipos:['cafe','lanche'], ing:[
    {n:'Pão caseiro', sec:'Padaria', pp:0.222, un:'un'}
  ]},

  {id:'bolo', nome:'Bolo', grupo:'Pães e bolos', tipos:['cafe','lanche'], ing:[
    {n:'Bolos', sec:'Padaria', pp:0.0889, un:'un'}
  ]},

  /* ----- recheios e frios ----- */
  {id:'pate', nome:'Patê', grupo:'Recheios e frios', tipos:['cafe','lanche'], ing:[
    {n:'Patê', sec:'Frios e laticínios', pp:0.0111, un:'kg'}
  ]},

  {id:'margarina', nome:'Margarina', grupo:'Recheios e frios', tipos:['cafe','lanche'], ing:[
    {n:'Margarina', sec:'Frios e laticínios', pp:0.0111, un:'kg'}
  ]},

  {id:'requeijao', nome:'Requeijão', grupo:'Recheios e frios', tipos:['cafe','lanche'], ing:[
    {n:'Requeijão', sec:'Frios e laticínios', pp:0.022, un:'kg'}
  ]},

  {id:'presunto-queijo', nome:'Presunto e queijo', grupo:'Recheios e frios', tipos:['cafe','lanche'], ing:[
    {n:'Presunto',       sec:'Frios e laticínios', pp:0.044, un:'kg'},
    {n:'Queijo fatiado', sec:'Frios e laticínios', pp:0.044, un:'kg'}
  ]},

  /* ----- bolachas e lanches ----- */
  {id:'bolacha-maria', nome:'Bolacha maria', grupo:'Bolachas e lanches', tipos:['lanche'], estimado:true, ing:[
    {n:'Bolacha maria', sec:'Mercearia', pp:0.35, un:'pct'}
  ]},

  {id:'biscoitos', nome:'Biscoitos sortidos', grupo:'Bolachas e lanches', tipos:['lanche'], estimado:true, ing:[
    {n:'Biscoitos sortidos', sec:'Mercearia', pp:0.30, un:'pct'}
  ]},

  {id:'bolacha-recheada', nome:'Bolacha recheada', grupo:'Bolachas e lanches', tipos:['lanche'], estimado:true, ing:[
    {n:'Bolacha recheada', sec:'Mercearia', pp:0.30, un:'pct'}
  ]},

  /* ----- bebidas ----- */
  {id:'suco', nome:'Suco', grupo:'Bebida', tipos:['cafe','almoco','lanche','janta'], ing:[
    {n:'Suco em pó', sec:'Bebidas', pp:0.278, un:'pct'}
  ]},

  {id:'refrigerante', nome:'Refrigerante', grupo:'Bebida', tipos:['almoco','janta'], estimado:true, ing:[
    {n:'Refrigerante', sec:'Bebidas', pp:0.25, un:'L'}
  ]},

  {id:'leite', nome:'Leite', grupo:'Bebida', tipos:['cafe','lanche'], ing:[
    {n:'Leite', sec:'Frios e laticínios', pp:0.25, un:'L'}
  ]},

  {id:'cafe-passado', nome:'Café passado', grupo:'Bebida', tipos:['cafe','lanche'], ing:[
    {n:'Café passado', sec:'Bebidas', pp:0.0111, un:'kg'}
  ]},

  {id:'cafe-solubel', nome:'Café solúvel', grupo:'Bebida', tipos:['cafe','lanche'], ing:[
    {n:'Café solúvel', sec:'Bebidas', pp:0.0074, un:'vidro'}
  ]},

  {id:'achocolatado', nome:'Achocolatado', grupo:'Bebida', tipos:['cafe','lanche'], ing:[
    {n:'Nescau', sec:'Bebidas', pp:0.0167, un:'kg'}
  ]},

  /* ----- sobremesas ----- */
  {id:'merenguinho', nome:'Merenguinho', grupo:'Sobremesa', tipos:['almoco','janta'], ing:[
    {n:'Merenguinho, mariola e pirulito', sec:'Sobremesas', pp:1.111, un:'un'}
  ]},

  {id:'maria-mole', nome:'Maria mole', grupo:'Sobremesa', tipos:['almoco','janta'], estimado:true, ing:[
    {n:'Maria mole', sec:'Sobremesas', pp:0.06, un:'pct'}
  ]},

  {id:'tijolinho', nome:'Tijolinho', grupo:'Sobremesa', tipos:['almoco','janta'], estimado:true, ing:[
    {n:'Leite condensado',    sec:'Frios e laticínios', pp:0.09,  un:'cx'},
    {n:'Chocolate granulado', sec:'Mercearia',          pp:0.012, un:'kg'}
  ]},

  {id:'gelatina', nome:'Gelatina ou pudim', grupo:'Sobremesa', tipos:['almoco','janta'], ing:[
    {n:'Gelatina ou pudim', sec:'Sobremesas', pp:0.133, un:'pct'}
  ]}
];

/* -------- montagem das refeições do período --------
   A pessoa diz onde começa e onde termina, e a ferramenta anda o ciclo do dia
   até chegar lá. É a dor número 1: saber quantas refeições são. */

function indiceTipo(id){
  for (var i = 0; i < TIPOS_REFEICAO.length; i++){
    if (TIPOS_REFEICAO[i].id === id) return i;
  }
  return -1;
}

function nomeTipo(id){
  var i = indiceTipo(id);
  return i < 0 ? '' : TIPOS_REFEICAO[i].nome;
}

function gerarRefeicoesDoPeriodo(diaIni, tipoIni, diaFim, tipoFim){
  var d = DIAS_SEMANA.indexOf(diaIni);
  var t = indiceTipo(tipoIni);
  var dFim = DIAS_SEMANA.indexOf(diaFim);
  var tFim = indiceTipo(tipoFim);
  if (d < 0 || t < 0 || dFim < 0 || tFim < 0) return [];

  var out = [], limite = 60;
  while (limite--){
    out.push({
      dia: DIAS_SEMANA[d],
      tipo: TIPOS_REFEICAO[t].id,
      nome: TIPOS_REFEICAO[t].nome + ' de ' + DIAS_SEMANA[d].toLowerCase(),
      pratos: []
    });
    if (d === dFim && t === tFim) break;
    t++;
    if (t >= TIPOS_REFEICAO.length){ t = 0; d = (d + 1) % DIAS_SEMANA.length; }
  }
  return out;
}

/* Quantos dias o período cobre, contando dias distintos. É o que multiplica os
   básicos: água escala com o tempo de permanência, tempero não. */
function diasDoPeriodo(refeicoes){
  var vistos = {};
  (refeicoes || []).forEach(function(r){ if (r.dia) vistos[r.dia] = true; });
  return Object.keys(vistos).length || 1;
}

/* Pratos sugeridos para um tipo de refeição, já agrupados e na ordem certa. */
function pratosPorGrupo(tipo, pratosCustom){
  var todos = PRATOS.concat(pratosCustom || []);
  return GRUPOS.map(function(g){
    return {
      grupo: g,
      pratos: todos.filter(function(p){
        return p.grupo === g && (!p.tipos || p.tipos.indexOf(tipo) >= 0);
      })
    };
  }).filter(function(x){ return x.pratos.length; });
}

/* -------- arredondamento --------
   Quantidade de mercado, não de laboratório. Peso e volume caem de meio em
   meio quando são grandes; abaixo de 1 viram grama ou mililitro de 50 em 50.
   Contáveis sobem para cima, porque faltar é pior que sobrar, e acima de 20
   sobem de 5 em 5, que é como se compra pão. */

function arredondar(v, un){
  if (un === 'kg' || un === 'L'){
    if (v >= 3)  return {q: Math.round(v * 2) / 2, un: un};
    if (v >= 1)  return {q: Math.round(v * 4) / 4, un: un};
    var menor = Math.ceil(v * 1000 / 50) * 50;
    if (menor >= 1000) return {q: menor / 1000, un: un};
    return {q: menor, un: (un === 'kg' ? 'g' : 'ml')};
  }
  var n = Math.ceil(+v.toFixed(2));
  if (n >= 20) n = Math.ceil(n / 5) * 5;
  return {q: n, un: un};
}

function numeroBR(n){
  return String(n).replace('.', ',');
}

/* A dica por pessoa em kg dá número ilegível: 0,011 kg não diz nada, 11 g diz. */
function porPessoa(v, un){
  if ((un === 'kg' || un === 'L') && v < 1){
    return Math.round(v * 1000) + (un === 'kg' ? ' g' : ' ml');
  }
  return numeroBR(+v.toFixed(2)) + ' ' + un;
}

/* -------- o gerador --------
   refeicoes: [{dia, tipo, nome, pratos:[id]}]
   Devolve o mesmo formato que a lista.html já sabe desenhar. */

function indexarPratos(pratosCustom){
  var porId = {};
  PRATOS.forEach(function(p){ porId[p.id] = p; });
  (pratosCustom || []).forEach(function(p){ porId[p.id] = p; });
  return porId;
}

function gerarLista(pessoas, refeicoes, extras, pratosCustom){
  pessoas = Math.max(1, parseInt(pessoas, 10) || 1);
  refeicoes = refeicoes || [];
  extras = extras || [];
  var dias = diasDoPeriodo(refeicoes);

  var acc = {};

  function juntar(n, sec, un, quanto, origem){
    var chave = n + '|' + un;
    if (!acc[chave]) acc[chave] = {n:n, sec:sec, un:un, total:0, origens:[]};
    acc[chave].total += quanto;
    if (origem && acc[chave].origens.indexOf(origem) < 0) acc[chave].origens.push(origem);
  }

  BASICOS_DIA.forEach(function(b){ juntar(b.n, b.sec, b.un, b.pp * pessoas * dias, null); });
  BASICOS_PESSOA.forEach(function(b){ juntar(b.n, b.sec, b.un, b.pp * pessoas, null); });

  var porId = indexarPratos(pratosCustom);

  refeicoes.forEach(function(ref){
    (ref.pratos || []).forEach(function(id){
      var p = porId[id];
      if (!p) return;
      (p.ing || []).forEach(function(i){
        juntar(i.n, i.sec, i.un, i.pp * pessoas, ref.nome || p.nome);
      });
    });
  });

  var porSecao = {};
  Object.keys(acc).forEach(function(k){
    var it = acc[k];
    if (it.total <= 0) return;
    (porSecao[it.sec] = porSecao[it.sec] || []).push(it);
  });

  EXTRAS.forEach(function(e){
    if (extras.indexOf(e.id) < 0) return;
    var qtd = e.q !== undefined ? e.q : (e.pp * pessoas * (e.porDia ? dias : 1));
    (porSecao[e.sec] = porSecao[e.sec] || []).push({
      n:e.n, sec:e.sec, un:e.un, total:qtd, origens:[], fixo:(e.q !== undefined), s:e.s
    });
  });

  BASICOS_FIXO.forEach(function(b){
    (porSecao[b.sec] = porSecao[b.sec] || []).push({
      n:b.n, sec:b.sec, un:b.un, total:b.q, origens:[], fixo:true, s:b.s
    });
  });

  var saida = [];
  SECOES.forEach(function(s){
    var itens = porSecao[s.t];
    if (!itens || !itens.length) return;
    itens.sort(function(a, b){ return a.n.localeCompare(b.n, 'pt-BR'); });

    saida.push({
      t: s.t,
      h: s.h,
      i: itens.map(function(it){
        var r = it.fixo ? {q: it.total, un: it.un} : arredondar(it.total, it.un);
        var dica = [];
        if (it.origens.length) dica.push('para ' + it.origens.join(', '));
        if (it.s) dica.push(it.s);
        if (!it.fixo && it.total) dica.push('≈ ' + porPessoa(it.total / pessoas, it.un) + ' por pessoa');
        return {q: numeroBR(r.q) + ' ' + r.un, n: it.n, s: dica.join('  ·  ')};
      })
    });
  });

  return saida;
}

/* -------- quebra por refeição --------
   A lista do mercado é uma coisa; saber o que separar para o almoço de sábado
   é outra. Esta devolve, para cada refeição, o que ela consome. */

function gerarPorRefeicao(pessoas, refeicoes, pratosCustom){
  pessoas = Math.max(1, parseInt(pessoas, 10) || 1);
  var porId = indexarPratos(pratosCustom);

  return (refeicoes || []).map(function(ref){
    var acc = {};
    (ref.pratos || []).forEach(function(id){
      var p = porId[id];
      if (!p) return;
      (p.ing || []).forEach(function(i){
        var chave = i.n + '|' + i.un;
        if (!acc[chave]) acc[chave] = {n:i.n, sec:i.sec, un:i.un, total:0, pratos:[]};
        acc[chave].total += i.pp * pessoas;
        if (acc[chave].pratos.indexOf(p.nome) < 0) acc[chave].pratos.push(p.nome);
      });
    });

    var itens = Object.keys(acc).map(function(k){
      var it = acc[k];
      var r = arredondar(it.total, it.un);
      return {q: numeroBR(r.q) + ' ' + r.un, n: it.n, sec: it.sec, pratos: it.pratos.join(', ')};
    }).sort(function(a, b){ return a.n.localeCompare(b.n, 'pt-BR'); });

    return {
      nome: ref.nome,
      dia: ref.dia,
      tipo: ref.tipo,
      pratos: (ref.pratos || []).map(function(id){
        return porId[id] ? porId[id].nome : null;
      }).filter(Boolean),
      itens: itens
    };
  });
}

/* -------- prato personalizado --------
   Monta um prato do jeito que cozinheiro pensa: "5 kg de arroz para 45
   pessoas", e não "0,111 kg por pessoa". A divisão pela base é exatamente o
   que fizemos à mão para extrair o catálogo da lista real. Grama e mililitro
   viram quilo e litro, senão o arredondamento os trataria como contáveis. */

function montarPratoCustom(nome, base, ingredientes, grupo, tipos){
  base = Math.max(1, parseInt(base, 10) || 1);
  var ing = [];
  (ingredientes || []).forEach(function(x){
    var q = parseFloat(String(x.q).replace(',', '.'));
    if (!x.n || !isFinite(q) || q <= 0) return;
    var un = x.un;
    if (un === 'g'){ q = q / 1000; un = 'kg'; }
    if (un === 'ml'){ q = q / 1000; un = 'L'; }
    ing.push({n: String(x.n).trim(), sec: x.sec, pp: q / base, un: un});
  });
  if (!ing.length) return null;
  return {
    id: 'custom-' + Math.random().toString(36).slice(2, 8),
    nome: String(nome).trim(),
    grupo: grupo || 'Prato principal',
    tipos: tipos || ['cafe','almoco','lanche','janta'],
    custom: true,
    base: base,
    ing: ing
  };
}

/* Esqueleto de lista: só as seções do mercado, sem item nenhum. */
function secoesVazias(){
  return SECOES.map(function(s){ return {t: s.t, h: s.h, i: []}; });
}

function contarItens(secoes){
  return secoes.reduce(function(a, s){ return a + s.i.length; }, 0);
}
