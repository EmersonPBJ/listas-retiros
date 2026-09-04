/* Configuracao e camada de sincronizacao.
   Este e o UNICO lugar onde a URL do banco aparece. Trocou aqui, trocou em todo lado.

   Cole o endereco do seu Firebase Realtime Database, sem barra no final:
     var SYNC_URL = "https://seu-projeto-default-rtdb.firebaseio.com";

   Deixando vazio, o site funciona so no aparelho de quem abriu, usando
   localStorage. Nada quebra, mas nada e compartilhado. */

var SYNC_URL = "https://listas-retiros-default-rtdb.firebaseio.com";

/* -------- estrutura no banco --------
   /indice/<id>      = {nome, pessoas, refeicoes, periodo, criadoEm}
   /retiros/<id>     = {v, data}

   O indice existe para a tela inicial carregar com um GET so, em vez de
   baixar a lista inteira de cada retiro para mostrar o nome. */

function temSync(){ return !!SYNC_URL; }

function dbURL(caminho){
  return SYNC_URL.replace(/\/+$/, '') + '/' + caminho.replace(/^\/+/, '') + '.json';
}

function dbGet(caminho){
  if (!temSync()) return Promise.reject(new Error('sem sync'));
  return fetch(dbURL(caminho)).then(function(r){
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
}

function dbEnviar(metodo, caminho, corpo){
  if (!temSync()) return Promise.reject(new Error('sem sync'));
  var opcoes = {method: metodo, headers: {'Content-Type':'application/json'}};
  if (corpo !== undefined) opcoes.body = JSON.stringify(corpo);
  return fetch(dbURL(caminho), opcoes).then(function(r){
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.status === 204 ? null : r.json();
  });
}

function dbPut(caminho, corpo){ return dbEnviar('PUT', caminho, corpo); }
function dbPatch(caminho, corpo){ return dbEnviar('PATCH', caminho, corpo); }
function dbDelete(caminho){ return dbEnviar('DELETE', caminho); }

/* -------- localStorage --------
   Espelho local de tudo. E o que faz a lista abrir preenchida sem internet,
   que e a situacao real de muito sitio de retiro. */

function lsLer(chave){
  try { return window.localStorage ? window.localStorage.getItem(chave) : null; }
  catch (e) { return null; }
}
function lsGravar(chave, texto){
  try { if (window.localStorage){ window.localStorage.setItem(chave, texto); return true; } }
  catch (e) {}
  return false;
}
function lsApagar(chave){
  try { if (window.localStorage) window.localStorage.removeItem(chave); } catch (e) {}
}

var CHAVE_INDICE = 'retiros-indice-v1';
function chaveLista(id){ return 'retiro-' + id + '-v1'; }

/* -------- identificador do retiro --------
   Slug legivel mais 4 caracteres aleatorios, para dois retiros de mesmo nome
   nao colidirem. O id aparece na URL, entao vale ser legivel. */

function gerarId(nome){
  var base = String(nome || 'retiro')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  if (!base) base = 'retiro';
  var sufixo = Math.random().toString(36).slice(2, 6);
  return base + '-' + sufixo;
}

/* -------- indicador de conexao -------- */
function setLive(ligado, texto){
  var bolinha = document.getElementById('live');
  if (bolinha) bolinha.className = 'live' + (ligado ? ' on' : '');
  var t = document.getElementById('livetxt');
  if (t && texto) t.textContent = texto;
}

/* -------- aviso flutuante -------- */
var _toastTimer = null;
function toast(msg, comDesfazer){
  var el = document.getElementById('toast');
  if (!el) return;
  document.getElementById('toast-msg').textContent = msg;
  var btn = document.getElementById('undo');
  if (btn) btn.style.display = comDesfazer ? '' : 'none';
  el.classList.add('up');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function(){ el.classList.remove('up'); }, 6000);
}

/* -------- normalizacao vinda do banco --------
   O Realtime Database nao guarda array nem objeto vazio: ele apaga a chave.
   Uma lista criada do zero, ou uma em que apagaram todos os itens de uma
   secao, volta do banco sem o campo `i`, e a pagina quebrava ao ler `.length`.
   Ele tambem devolve array como objeto quando os indices ficam esburacados.
   Toda entrada de dados passa por aqui. */

function comoArray(v){
  if (Array.isArray(v)) return v.filter(function(x){ return x != null; });
  if (v && typeof v === 'object'){
    return Object.keys(v)
      .sort(function(a, b){ return (+a) - (+b); })
      .map(function(k){ return v[k]; })
      .filter(function(x){ return x != null; });
  }
  return [];
}

function normalizarSecoes(data){
  return comoArray(data).map(function(sec){
    sec = sec || {};
    sec.i = comoArray(sec.i);
    return sec;
  });
}
