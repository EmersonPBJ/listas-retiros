/* Gerador de lista a partir do cardápio.

   De onde vêm os números: da lista real do 6º Acamps 7 Jovens, que era para
   45 pessoas e 3 dias. Dividindo aquelas quantidades por 45 e por 3, saem
   taxas limpas (água 0,667 L por pessoa por dia, óleo 0,037 L, e assim por
   diante). Ou seja, este catálogo não é chute: é um retiro que já aconteceu,
   convertido em taxa. Os pratos marcados com estimado:true são os únicos que
   não vieram de lá, e estão sinalizados na tela.

   Três tipos de quantidade:
     BASICOS_DIA    por pessoa por dia   (água, café, limpeza)
     BASICOS_PESSOA por pessoa           (temperos, que não escalam com o tempo)
     BASICOS_FIXO   quantidade fixa      (gás, café solúvel)
     PRATOS         por pessoa por vez que o prato é servido
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

var BASICOS_DIA = [
  {n:'Água',                sec:'Bebidas',               pp:0.6667, un:'L'},
  {n:'Suco em pó',          sec:'Bebidas',               pp:0.3704, un:'pct'},
  {n:'Café passado',        sec:'Bebidas',               pp:0.0111, un:'kg'},
  {n:'Nescau',              sec:'Bebidas',               pp:0.0111, un:'kg'},
  {n:'Leite',               sec:'Frios e laticínios',    pp:0.2222, un:'L'},
  {n:'Margarina',           sec:'Frios e laticínios',    pp:0.0074, un:'kg'},
  {n:'Ovos',                sec:'Frios e laticínios',    pp:0.0259, un:'dz'},
  {n:'Frutas',              sec:'Hortifruti',            pp:0.1481, un:'kg'},
  {n:'Cebola',              sec:'Hortifruti',            pp:0.0444, un:'kg'},
  {n:'Cebolinha e salsa',   sec:'Hortifruti',            pp:0.0296, un:'maços'},
  {n:'Cenoura',             sec:'Hortifruti',            pp:0.0296, un:'kg'},
  {n:'Tomate italiano',     sec:'Hortifruti',            pp:0.0185, un:'kg'},
  {n:'Açúcar',              sec:'Mercearia',             pp:0.0370, un:'kg'},
  {n:'Óleo',                sec:'Mercearia',             pp:0.0370, un:'L'},
  {n:'Sal',                 sec:'Mercearia',             pp:0.0148, un:'kg'},
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
  {n:'Café solúvel',        sec:'Bebidas',                un:'vidro', q:1},
  {n:'Molho shoyu',         sec:'Temperos',               un:'frasco',q:1},
  {n:'Botijão de gás',      sec:'Limpeza e descartáveis', un:'un',    q:2,
   s:'conferir se estão cheios antes de subir'}
];

/* Opcionais e restrições alimentares. Não entram sozinhos: a pessoa marca
   na tela. É o tipo de item que quem nunca organizou retiro esquece, e que
   estraga a refeição de alguém quando falta. */
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

/* pp = por pessoa, cada vez que o prato é servido */
var PRATOS = [
  {id:'salsichao', nome:'Salsichão com pão', tipo:'Prato principal', ing:[
    {n:'Salsichão',            sec:'Açougue', pp:0.178, un:'kg'},
    {n:'Pão cacetinho',        sec:'Padaria', pp:0.44,  un:'un'}
  ]},

  {id:'massa-guisado', nome:'Massa com guisado', tipo:'Prato principal', ing:[
    {n:'Massa parafuso ou penne', sec:'Mercearia', pp:0.111, un:'kg'},
    {n:'Carne moída',             sec:'Açougue',   pp:0.122, un:'kg'},
    {n:'Molho de tomate',         sec:'Mercearia', pp:0.044, un:'L'},
    {n:'Extrato de tomate',       sec:'Mercearia', pp:0.022, un:'kg'},
    {n:'Tomate italiano',         sec:'Hortifruti',pp:0.044, un:'kg'}
  ]},

  {id:'carreteiro', nome:'Carreteiro', tipo:'Prato principal', ing:[
    {n:'Arroz',                        sec:'Mercearia', pp:0.111, un:'kg'},
    {n:'Paleta ou patinho em cubos',   sec:'Açougue',   pp:0.111, un:'kg'},
    {n:'Bacon',                        sec:'Açougue',   pp:0.011, un:'kg'},
    {n:'Tomate italiano',              sec:'Hortifruti',pp:0.033, un:'kg'},
    {n:'Batata palha',                 sec:'Mercearia', pp:0.044, un:'kg'}
  ]},

  {id:'arroz-galinha', nome:'Arroz com galinha', tipo:'Prato principal', ing:[
    {n:'Arroz',        sec:'Mercearia', pp:0.111, un:'kg'},
    {n:'Sobrecoxa',    sec:'Açougue',   pp:0.222, un:'kg'},
    {n:'Milho verde',  sec:'Mercearia', pp:0.089, un:'latas'},
    {n:'Ervilha',      sec:'Mercearia', pp:0.067, un:'latas'}
  ]},

  {id:'delicia-frango', nome:'Delícia de frango', tipo:'Prato principal', ing:[
    {n:'Peito de frango',    sec:'Açougue',            pp:0.100, un:'kg'},
    {n:'Farinha de trigo',   sec:'Mercearia',          pp:0.022, un:'kg'},
    {n:'Mussarela',          sec:'Frios e laticínios', pp:0.033, un:'kg'},
    {n:'Creme de leite',     sec:'Frios e laticínios', pp:0.133, un:'cx'}
  ]},

  {id:'sanduiche', nome:'Sanduíche de presunto e queijo', tipo:'Lanche', ing:[
    {n:'Pão cacetinho',   sec:'Padaria',            pp:0.44,  un:'un'},
    {n:'Presunto',        sec:'Frios e laticínios', pp:0.044, un:'kg'},
    {n:'Queijo fatiado',  sec:'Frios e laticínios', pp:0.044, un:'kg'},
    {n:'Requeijão',       sec:'Frios e laticínios', pp:0.022, un:'kg'}
  ]},

  {id:'cafe-pao-pate', nome:'Café da manhã com pão e patê', tipo:'Café da manhã', ing:[
    {n:'Pão cacetinho',  sec:'Padaria',            pp:0.44,  un:'un'},
    {n:'Pão caseiro',    sec:'Padaria',            pp:0.222, un:'un'},
    {n:'Patê',           sec:'Frios e laticínios', pp:0.011, un:'kg'}
  ]},

  {id:'cafe-bolo', nome:'Bolo no café da manhã', tipo:'Café da manhã', ing:[
    {n:'Bolos', sec:'Padaria', pp:0.0889, un:'un'}
  ]},

  {id:'feijao', nome:'Feijão', tipo:'Acompanhamento', ing:[
    {n:'Feijão preto',        sec:'Mercearia', pp:0.067,  un:'kg'},
    {n:'Linguiça calabresa',  sec:'Açougue',   pp:0.0167, un:'kg'}
  ]},

  {id:'arroz-branco', nome:'Arroz branco', tipo:'Acompanhamento', ing:[
    {n:'Arroz', sec:'Mercearia', pp:0.111, un:'kg'}
  ]},

  {id:'maionese', nome:'Maionese de batata', tipo:'Acompanhamento', ing:[
    {n:'Batata inglesa', sec:'Hortifruti',        pp:0.067, un:'kg'},
    {n:'Maionese',       sec:'Frios e laticínios',pp:0.055, un:'kg'},
    {n:'Cenoura',        sec:'Hortifruti',        pp:0.044, un:'kg'},
    {n:'Ovos',           sec:'Frios e laticínios',pp:0.033, un:'dz'}
  ]},

  {id:'salpicao', nome:'Salpicão', tipo:'Acompanhamento', ing:[
    {n:'Peito de frango', sec:'Açougue',            pp:0.056, un:'kg'},
    {n:'Maionese',        sec:'Frios e laticínios', pp:0.078, un:'kg'},
    {n:'Batata palha',    sec:'Mercearia',          pp:0.067, un:'kg'},
    {n:'Milho verde',     sec:'Mercearia',          pp:0.089, un:'latas'},
    {n:'Ervilha',         sec:'Mercearia',          pp:0.067, un:'latas'},
    {n:'Creme de leite',  sec:'Frios e laticínios', pp:0.133, un:'cx'}
  ]},

  {id:'salada-verde', nome:'Salada verde', tipo:'Acompanhamento', ing:[
    {n:'Alface',          sec:'Hortifruti', pp:0.267, un:'pés'},
    {n:'Tomate italiano', sec:'Hortifruti', pp:0.044, un:'kg'},
    {n:'Beterraba',       sec:'Hortifruti', pp:0.133, un:'kg'},
    {n:'Cenoura',         sec:'Hortifruti', pp:0.044, un:'kg'},
    {n:'Batata inglesa',  sec:'Hortifruti', pp:0.044, un:'kg'}
  ]},

  {id:'sobremesa-doce', nome:'Merenguinho, mariola e pirulito', tipo:'Sobremesa', ing:[
    {n:'Merenguinho, mariola e pirulito', sec:'Sobremesas', pp:1.111, un:'un'}
  ]},

  {id:'sobremesa-gelatina', nome:'Gelatina ou pudim', tipo:'Sobremesa', ing:[
    {n:'Gelatina ou pudim', sec:'Sobremesas', pp:0.133, un:'pct'}
  ]},

  /* Daqui para baixo os números são estimativa, não saíram do retiro real. */
  {id:'churrasco', nome:'Churrasco', tipo:'Prato principal', estimado:true, ing:[
    {n:'Carne para churrasco', sec:'Açougue',   pp:0.400, un:'kg'},
    {n:'Linguiça para churrasco', sec:'Açougue',pp:0.100, un:'kg'},
    {n:'Sal grosso',           sec:'Temperos',  pp:0.030, un:'kg'},
    {n:'Pão cacetinho',        sec:'Padaria',   pp:0.44,  un:'un'},
    {n:'Carvão',               sec:'Limpeza e descartáveis', pp:0.150, un:'kg'}
  ]},

  {id:'cachorro-quente', nome:'Cachorro-quente', tipo:'Lanche', estimado:true, ing:[
    {n:'Salsicha',          sec:'Açougue',   pp:0.150, un:'kg'},
    {n:'Pão de hot dog',    sec:'Padaria',   pp:2,     un:'un'},
    {n:'Molho de tomate',   sec:'Mercearia', pp:0.050, un:'L'},
    {n:'Batata palha',      sec:'Mercearia', pp:0.030, un:'kg'}
  ]},

  {id:'strogonoff', nome:'Strogonoff de frango', tipo:'Prato principal', estimado:true, ing:[
    {n:'Peito de frango',   sec:'Açougue',            pp:0.150, un:'kg'},
    {n:'Creme de leite',    sec:'Frios e laticínios', pp:0.200, un:'cx'},
    {n:'Extrato de tomate', sec:'Mercearia',          pp:0.015, un:'kg'},
    {n:'Batata palha',      sec:'Mercearia',          pp:0.040, un:'kg'},
    {n:'Arroz',             sec:'Mercearia',          pp:0.111, un:'kg'}
  ]},

  {id:'sopa', nome:'Sopa de legumes com carne', tipo:'Prato principal', estimado:true, ing:[
    {n:'Paleta ou patinho em cubos', sec:'Açougue',   pp:0.080, un:'kg'},
    {n:'Batata inglesa',             sec:'Hortifruti',pp:0.100, un:'kg'},
    {n:'Cenoura',                    sec:'Hortifruti',pp:0.060, un:'kg'},
    {n:'Macarrão para sopa',         sec:'Mercearia', pp:0.030, un:'kg'}
  ]},

  {id:'polenta', nome:'Polenta com molho', tipo:'Prato principal', estimado:true, ing:[
    {n:'Farinha de polenta', sec:'Mercearia',  pp:0.100, un:'kg'},
    {n:'Molho de tomate',    sec:'Mercearia',  pp:0.060, un:'L'},
    {n:'Carne moída',        sec:'Açougue',    pp:0.100, un:'kg'},
    {n:'Queijo ralado',      sec:'Frios e laticínios', pp:0.020, un:'kg'}
  ]}
];

/* -------- arredondamento --------
   Quantidade de mercado, não de laboratório. Peso e volume caem de meio em
   meio quando são grandes; abaixo de 1 viram grama ou mililitro de 50 em 50.
   Contáveis sobem para cima, porque faltar é pior que sobrar, e acima de 20
   sobem de 5 em 5, que é como se compra pão e refrigerante. */

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

/* A dica por pessoa em kg da numero quebrado e ilegivel: 0,011 kg nao diz
   nada, 11 g diz. Abaixo de 1, converte. */
function porPessoa(v, un){
  if ((un === 'kg' || un === 'L') && v < 1){
    return Math.round(v * 1000) + (un === 'kg' ? ' g' : ' ml');
  }
  return numeroBR(+v.toFixed(2)) + ' ' + un;
}

/* -------- o gerador --------
   refeicoes: [{nome:'Almoço de sábado', pratos:['carreteiro','feijao']}]
   Devolve o mesmo formato que a lista.html já sabe desenhar, entao nada
   downstream precisa mudar. */

function gerarLista(pessoas, dias, refeicoes, extras){
  pessoas = Math.max(1, parseInt(pessoas, 10) || 1);
  dias    = Math.max(1, parseInt(dias, 10) || 1);
  refeicoes = refeicoes || [];
  extras = extras || [];

  var acc = {};   /* chave -> {n, sec, un, total, origens:[], pp} */

  function juntar(n, sec, un, quanto, origem, pp){
    var chave = n + '|' + un;
    if (!acc[chave]) acc[chave] = {n:n, sec:sec, un:un, total:0, origens:[], pp:pp};
    acc[chave].total += quanto;
    if (origem && acc[chave].origens.indexOf(origem) < 0) acc[chave].origens.push(origem);
    return acc[chave];
  }

  BASICOS_DIA.forEach(function(b){
    juntar(b.n, b.sec, b.un, b.pp * pessoas * dias, null, b.pp);
  });
  BASICOS_PESSOA.forEach(function(b){
    juntar(b.n, b.sec, b.un, b.pp * pessoas, null, b.pp);
  });

  var porId = {};
  PRATOS.forEach(function(p){ porId[p.id] = p; });

  refeicoes.forEach(function(ref){
    (ref.pratos || []).forEach(function(id){
      var p = porId[id];
      if (!p) return;
      p.ing.forEach(function(i){
        juntar(i.n, i.sec, i.un, i.pp * pessoas, ref.nome || p.nome, i.pp);
      });
    });
  });

  /* monta as seções na ordem do mercado, pulando as que ficaram vazias */
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
        if (!it.fixo && it.total) {
          dica.push('≈ ' + porPessoa(it.total / pessoas, it.un) + ' por pessoa');
        }
        return {
          q: numeroBR(r.q) + ' ' + r.un,
          n: it.n,
          s: dica.join('  ·  ')
        };
      })
    });
  });

  return saida;
}

function contarItens(secoes){
  return secoes.reduce(function(a, s){ return a + s.i.length; }, 0);
}
