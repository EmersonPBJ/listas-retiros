/* Modelo padrao de lista de compras de retiro.
   E o ponto de partida de todo retiro novo e o destino do botao
   "Restaurar lista original". Editar aqui muda so os retiros criados
   dali em diante: os que ja existem guardam a propria copia no banco. */

var MODELO = [
 {
  "t": "Açougue",
  "h": "#c2410c",
  "i": [
   {
    "q": "8 kg",
    "n": "Salsichão",
    "s": "almoço de sábado"
   },
   {
    "q": "10 kg",
    "n": "Sobrecoxa",
    "s": "arroz com galinha, domingo à noite"
   },
   {
    "q": "7 kg",
    "n": "Peito de frango",
    "s": "2,5 kg salpicão e 4,5 kg delícia de frango"
   },
   {
    "q": "5,5 kg",
    "n": "Carne moída",
    "s": "guisado da massa, sábado à noite"
   },
   {
    "q": "5 kg",
    "n": "Paleta ou patinho em cubos",
    "s": "carreteiro de domingo"
   },
   {
    "q": "1,5 kg",
    "n": "Linguiça calabresa",
    "s": "tempero do feijão"
   },
   {
    "q": "500 g",
    "n": "Bacon",
    "s": ""
   }
  ]
 },
 {
  "t": "Frios e laticínios",
  "h": "#0369a1",
  "i": [
   {
    "q": "30 L",
    "n": "Leite",
    "s": ""
   },
   {
    "q": "4 L",
    "n": "Leite sem lactose",
    "s": "pedido no cardápio, não esquecer"
   },
   {
    "q": "6 kg",
    "n": "Maionese",
    "s": "balde grande sai mais em conta"
   },
   {
    "q": "12 cx",
    "n": "Creme de leite",
    "s": ""
   },
   {
    "q": "1 kg",
    "n": "Requeijão",
    "s": ""
   },
   {
    "q": "1 kg",
    "n": "Patê",
    "s": "cafés de domingo e segunda"
   },
   {
    "q": "2 kg",
    "n": "Presunto",
    "s": ""
   },
   {
    "q": "2 kg",
    "n": "Queijo fatiado",
    "s": "sanduíche do lanche de sábado"
   },
   {
    "q": "1,5 kg",
    "n": "Mussarela",
    "s": "para gratinar a delícia de frango"
   },
   {
    "q": "1 kg",
    "n": "Margarina",
    "s": ""
   },
   {
    "q": "5 dz",
    "n": "Ovos",
    "s": ""
   }
  ]
 },
 {
  "t": "Hortifruti",
  "h": "#15803d",
  "i": [
   {
    "q": "20 kg",
    "n": "Frutas",
    "s": "banana, maçã e laranja"
   },
   {
    "q": "8 kg",
    "n": "Tomate italiano",
    "s": ""
   },
   {
    "q": "8 kg",
    "n": "Cenoura",
    "s": ""
   },
   {
    "q": "6 kg",
    "n": "Cebola",
    "s": ""
   },
   {
    "q": "6 kg",
    "n": "Beterraba",
    "s": "entra na salada verde do cardápio"
   },
   {
    "q": "5 kg",
    "n": "Batata inglesa",
    "s": "maionese de sábado e salada de segunda"
   },
   {
    "q": "12 pés",
    "n": "Alface",
    "s": ""
   },
   {
    "q": "4 maços",
    "n": "Cebolinha e salsa",
    "s": ""
   }
  ]
 },
 {
  "t": "Mercearia",
  "h": "#7c3aed",
  "i": [
   {
    "q": "15 kg",
    "n": "Arroz",
    "s": "carreteiro, arroz com galinha e segunda"
   },
   {
    "q": "6 kg",
    "n": "Feijão preto",
    "s": "rende o almoço e a janta de domingo"
   },
   {
    "q": "5 kg",
    "n": "Massa parafuso ou penne",
    "s": "jantar de sábado"
   },
   {
    "q": "5 kg",
    "n": "Batata palha",
    "s": ""
   },
   {
    "q": "5 L",
    "n": "Óleo",
    "s": ""
   },
   {
    "q": "2 kg",
    "n": "Sal",
    "s": ""
   },
   {
    "q": "1 kg",
    "n": "Farinha de trigo",
    "s": "molho branco da delícia de frango"
   },
   {
    "q": "2 L",
    "n": "Molho de tomate",
    "s": ""
   },
   {
    "q": "1 kg",
    "n": "Extrato de tomate",
    "s": ""
   },
   {
    "q": "8 latas",
    "n": "Milho verde",
    "s": ""
   },
   {
    "q": "6 latas",
    "n": "Ervilha",
    "s": ""
   },
   {
    "q": "1 L",
    "n": "Vinagre",
    "s": ""
   },
   {
    "q": "5 kg",
    "n": "Açúcar",
    "s": ""
   }
  ]
 },
 {
  "t": "Temperos",
  "h": "#a16207",
  "i": [
   {
    "q": "2 potes",
    "n": "Tempero completo",
    "s": ""
   },
   {
    "q": "6 saq",
    "n": "Pimenta do reino",
    "s": ""
   },
   {
    "q": "1 pote",
    "n": "Pasta de alho",
    "s": "o grande"
   },
   {
    "q": "1 frasco",
    "n": "Molho shoyu",
    "s": ""
   }
  ]
 },
 {
  "t": "Bebidas",
  "h": "#be123c",
  "i": [
   {
    "q": "90 L",
    "n": "Água",
    "s": ""
   },
   {
    "q": "50 pct",
    "n": "Suco em pó",
    "s": "menos pacotes se pegar o concentrado grande"
   },
   {
    "q": "1,5 kg",
    "n": "Café passado",
    "s": ""
   },
   {
    "q": "1 vidro",
    "n": "Café solúvel",
    "s": ""
   },
   {
    "q": "1,5 kg",
    "n": "Nescau",
    "s": ""
   },
   {
    "q": "2 kg",
    "n": "Erva-mate",
    "s": "só se a organização não pedir que cada um leve a sua"
   }
  ]
 },
 {
  "t": "Padaria",
  "h": "#0f766e",
  "note": "<b>Encomende com antecedência.</b> São 4 refeições que puxam pão: almoço de sábado, lanche de sábado e os dois cafés da manhã. Peça para a padaria entregar dividido por dia, senão o de segunda chega velho.",
  "i": [
   {
    "q": "80 un",
    "n": "Pão cacetinho",
    "s": ""
   },
   {
    "q": "20 un",
    "n": "Pão caseiro",
    "s": ""
   },
   {
    "q": "8 un",
    "n": "Bolos",
    "s": ""
   }
  ]
 },
 {
  "t": "Sobremesas",
  "h": "#db2777",
  "i": [
   {
    "q": "150 un",
    "n": "Merenguinho, mariola e pirulito",
    "s": "3 refeições pedem sobremesa"
   },
   {
    "q": "6 pct",
    "n": "Gelatina ou pudim",
    "s": "sobremesa de domingo"
   }
  ]
 },
 {
  "t": "Limpeza e descartáveis",
  "h": "#475569",
  "i": [
   {
    "q": "6 pct",
    "n": "Guardanapo",
    "s": ""
   },
   {
    "q": "6 rolos",
    "n": "Papel toalha",
    "s": ""
   },
   {
    "q": "4 un",
    "n": "Detergente",
    "s": ""
   },
   {
    "q": "6 un",
    "n": "Esponja de louça",
    "s": ""
   },
   {
    "q": "2 pct",
    "n": "Saco de lixo 100 L",
    "s": ""
   },
   {
    "q": "2 rolos",
    "n": "Papel alumínio",
    "s": ""
   },
   {
    "q": "1 rolo",
    "n": "Filme plástico",
    "s": ""
   },
   {
    "q": "2 un",
    "n": "Botijão de gás",
    "s": "conferir se estão cheios antes de subir"
   }
  ]
 }
];

/* Observações de rodapé que vêm preenchidas num retiro novo.
   São editáveis na própria página e ficam guardadas por retiro,
   porque cada retiro tem os seus próprios cuidados de cozinha. */
var MODELO_OBS = "O feijão de domingo precisa ser feito de uma vez só, em panela grande, porque o mesmo feijão serve o almoço e a janta. Se fizer justo para o almoço, não sobra nada.\n\nOs 8 bolos: se forem assados na cozinha e não doados prontos, entram farinha, ovos, fermento e óleo a mais na conta.";
