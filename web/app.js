/* Collect QR — static app. The DOM is the source of truth: every change builds a
   settings object (same shape as the collect-settings crate), the WASM engine
   renders it, nothing leaves the browser. Passwords never go to localStorage. */
import init, { render, decode, version } from './pkg/collect_settings_wasm.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ------------------------------------------------------------------ i18n
const PT = {
  title: 'Collect QR', subtitle: 'QR de configuração do ODK Collect e do KoboCollect',
  privacy: '🔒 roda no seu navegador — nada é enviado',
  s1: 'Servidor', s1help: 'O app baixa todos os questionários que a conta enxerga neste servidor. No KoboToolbox use o host KoboCAT (kc.…), nunca a interface web kf./eu.',
  serverUrl: 'Endereço do servidor', serverUrlHelp: 'Seu próprio KoboToolbox (host kc.) ou qualquer servidor OpenRosa. Para questionários do KoboToolbox com envio anônimo, use https://kc.kobotoolbox.org/<usuário do dono> e deixe a conta vazia.',
  s2: 'Conta do entrevistador', s2help: 'A conta vai dentro do QR: quem escaneia entra logado, sem digitar nada. Use uma conta que só tenha "add submissions" nos questionários desta equipe.',
  oneAccount: 'Uma conta', manyAccounts: 'Várias contas (um QR por conta)', username: 'Usuário', password: 'Senha',
  accountsLabel: 'Uma conta por linha: usuario;senha;rótulo (rótulo opcional, vira o sufixo do nome do projeto)',
  accountsCount: 'conta(s). Aceita também vírgula ou tabulação (cole da planilha).',
  s3: 'Projeto no aparelho', s3help: 'Nome, letra e cor que aparecem no topo do app, para a supervisão ver de longe se o tablet está no projeto certo.',
  projName: 'Nome do projeto', projNamePh: 'Pesquisa domiciliar 2026', projIcon: 'Letra', projColor: 'Cor',
  s4: 'Senha de administrador', s4help: 'Protege o menu de configurações do app. Sem ela, qualquer um desfaz os bloqueios do passo 5. Guarde com a coordenação; ela também vai dentro do QR.',
  generate: 'Gerar',
  s5: 'Comportamento do app', s5help: 'O padrão é o aparelho de campo: o entrevistador abre o app, escolhe o questionário e preenche; envio e atualização acontecem sozinhos e as configurações ficam trancadas.',
  locks: 'Bloqueios', presetLocked: 'Entrevistador travado (recomendado)', presetStrict: 'Travado e sem voltar pergunta', presetOpen: 'Tudo liberado (supervisão / teste)', presetCustom: 'Personalizado',
  autosend: 'Envio automático', asBoth: 'Wi-Fi e dados móveis', asWifi: 'Só Wi-Fi', asCell: 'Só dados móveis', asOff: 'Desligado (envio manual)',
  updateMode: 'Atualização dos questionários', umMatch: 'Espelhar o servidor (novos, atualizados, retirados)', umPrev: 'Só atualizar os já baixados', umManual: 'Manual',
  updateCheck: 'Verificar a cada', uc15: '15 minutos', uc1h: '1 hora', uc6h: '6 horas', uc24h: '24 horas',
  autoUpdate: 'Baixar atualizações sem perguntar<small>Republicou no servidor, chegou no aparelho.</small>',
  hideOld: 'Esconder versões antigas<small>Só a versão atual aparece na lista.</small>',
  deleteSend: 'Apagar do aparelho após enviar<small>Desligado, a cópia local é o seguro contra perda.</small>',
  analytics: 'Enviar estatísticas de uso ao ODK<small>Desligado por padrão.</small>',
  uiDetails: 'Interface e preenchimento', constraint: 'Validação das respostas', cSwipe: 'A cada avanço de pergunta', cFinal: 'Só ao finalizar',
  navigation: 'Navegação', keep: 'Manter o padrão do app', nSwipe: 'Deslizar', nButtons: 'Botões', nBoth: 'Deslizar e botões',
  appLang: 'Idioma do app', fontSize: 'Tamanho da fonte', fXS: 'Muito pequena', fS: 'Pequena', fM: 'Média', fL: 'Grande', fXL: 'Muito grande',
  theme: 'Tema', tLight: 'Claro', tDark: 'Escuro', imageSize: 'Tamanho das fotos', iVS: 'Muito pequeno (640 px)', iS: 'Pequeno (1024 px)', iM: 'Médio (2048 px)', iL: 'Grande (3072 px)', iO: 'Original',
  locksDetails: 'Ajustar bloqueios um a um', locksHelp: 'Ligado = o entrevistador pode usar. Desligado = fica atrás da senha de administrador.',
  s6: 'Ler um QR existente', s6help: 'Cole o texto de um QR de configuração (o que qualquer leitor de QR mostra) para carregar as opções aqui e ajustar.', load: 'Carregar',
  result: 'QR de configuração', stLoading: 'carregando motor…', qrEmpty: 'Preencha o servidor',
  print: 'Imprimir cartão', dlPng: 'Baixar PNG', dlSvg: 'Baixar SVG', copy: 'Copiar texto do QR', viewJson: 'Ver JSON da configuração',
  onDevice: 'No aparelho',
  step1: 'Instale o <strong>ODK Collect</strong> ou o <strong>KoboCollect</strong> pela Play Store.',
  step2: 'Na primeira tela, toque em <strong>Configure with QR code</strong> e aponte para o código. Num app já configurado: menu do projeto → <em>Add project</em> ou <em>Reconfigure with QR code</em>.',
  step3: 'Confira o nome do projeto no topo e espere os questionários baixarem sozinhos.',
  step4: 'Teste: abra um questionário, finalize e veja-o sair em <em>Enviados</em>.',
  footer: 'Motor:', footer2: 'As senhas são usadas só para montar o QR, no seu navegador, e nunca são guardadas ou enviadas.',
  // runtime strings
  stReady: 'pronto', stNoAccount: 'pronto (sem conta)', stNoServer: 'falta o servidor', stError: 'erro', stNoAccounts: 'sem contas',
  noAccount: 'sem conta no QR (o app vai pedir)', account: 'conta', modules: 'módulos', chars: 'caracteres',
  manyGenerated: (n) => `${n} QRs gerados — a impressão sai com todos`, noValidAccounts: 'Nenhuma conta válida na lista',
  copied: 'Copiado', custom: 'Outro servidor', customSub: 'informe o endereço abaixo',
  presetHelp: { locked: 'Tudo trancado, menos enviar e ver enviados. O entrevistador ainda pode voltar pergunta.', strict: 'Sem voltar, sem rascunho, sem pular pergunta, validação a cada avanço.', open: 'Nenhum bloqueio. Para o aparelho da supervisão ou para testar o questionário.', custom: 'Ajustado um a um abaixo.' },
  decodeError: 'Não é um QR de configuração do Collect: ',
  cardSteps: ['Abra o app e toque em <b>Configure with QR code</b> (ou menu do projeto → <i>Reconfigure with QR code</i>).', 'Aponte para este QR. O projeto aparece no topo.', 'Espere os questionários baixarem e faça um teste.'],
  cardWarn: 'CONFIDENCIAL — contém a conta do aparelho e a senha de administrador. Recolher após configurar.',
  groups: ['Menu principal', 'Configurações do usuário', 'Dentro do questionário'],
  warn: [
    [/server_url is empty/, 'Sem servidor: o app vai manter o que já tem.'],
    [/is not https/, 'O servidor precisa ser https — o Collect recusa senha em http.'],
    [/looks like the KoboToolbox web interface/, 'Esse endereço parece ser a interface web (kf./eu.); o aparelho usa o host KoboCAT (kc.).'],
    [/admin_pw is empty/, 'Há bloqueios mas a senha de administrador está vazia: qualquer um abre o menu protegido.'],
    [/qr_code_scanner is allowed/, '"Reconfigurar com outro QR" está liberado: qualquer QR desfaz estes bloqueios.'],
    [/change_server is allowed/, '"Servidor e conta" está liberado: o entrevistador pode trocar de conta.'],
    [/automatic_update is false/, 'Espelhar o servidor sem download automático: as versões novas esperam atualização manual.'],
    [/periodic_form_updates_check is unset/, 'Sem intervalo de verificação: o app usa o padrão dele (24 h).'],
    [/get_blank is hidden and form_update_mode is manual/, 'Baixar questionário escondido e atualização manual: ninguém consegue baixar questionários no aparelho.'],
    [/send_finalized is hidden and autosend is off/, 'Enviar escondido e envio automático desligado: os finalizados nunca saem do aparelho.'],
    [/delete_send is true/, 'Apagar após enviar está ligado: a cópia local some assim que o envio conclui.'],
    [/project.icon should be a single character/, 'A letra do projeto deve ser um único caractere.'],
  ],
};
const EN = {
  stReady: 'ready', stNoAccount: 'ready (no account)', stNoServer: 'server missing', stError: 'error', stNoAccounts: 'no accounts',
  noAccount: 'no account in the QR (the app will ask)', account: 'account', modules: 'modules', chars: 'characters',
  manyGenerated: (n) => `${n} QR codes generated — printing includes all of them`, noValidAccounts: 'No valid account in the list',
  copied: 'Copied', custom: 'Other server', customSub: 'enter the URL below',
  presetHelp: { locked: 'Everything locked except sending and viewing sent forms. The interviewer can still move backwards.', strict: 'No moving backwards, no drafts, no jumping to questions, validation on every swipe.', open: 'No locks. For the supervisor device or for testing a form.', custom: 'Adjusted one by one below.' },
  decodeError: 'Not a Collect configuration QR code: ',
  cardSteps: ['Open the app and tap <b>Configure with QR code</b> (or project menu → <i>Reconfigure with QR code</i>).', 'Point at this QR code. The project appears at the top.', 'Wait for the forms to download and run a test.'],
  cardWarn: 'CONFIDENTIAL — contains the device account and the admin password. Collect after configuring.',
  groups: ['Main menu', 'User settings', 'Inside the form'],
  warn: [],
};
let lang = 'en';
const t = (k) => (lang === 'pt' ? PT[k] : EN[k]) ?? EN[k] ?? PT[k];
const EN_TEXT = {}; // original English innerHTML of data-i18n nodes
function applyLang(l) {
  lang = l;
  document.documentElement.lang = l === 'pt' ? 'pt-BR' : 'en';
  $('#lang').textContent = l === 'pt' ? 'EN' : 'PT';
  $$('[data-i18n]').forEach((el) => {
    const k = el.dataset.i18n;
    if (!(k in EN_TEXT)) EN_TEXT[k] = el.innerHTML;
    el.innerHTML = l === 'pt' && PT[k] ? PT[k] : EN_TEXT[k];
  });
  $$('[data-i18n-ph]').forEach((el) => {
    const k = el.dataset.i18nPh;
    if (!(k in EN_TEXT)) EN_TEXT[k] = el.placeholder;
    el.placeholder = l === 'pt' && PT[k] ? PT[k] : EN_TEXT[k];
  });
  buildLocks(); buildServers(); $('#preset-help').textContent = t('presetHelp')[$('#preset').value];
  try { localStorage.setItem('collect-qr-lang', l); } catch { /* ignore */ }
  generate();
}

// ------------------------------------------------------------------ locks
// [key, English, Portuguese, English hint, Portuguese hint]
const GROUPS = [
  [[ 'get_blank', 'Get blank form', 'Baixar questionário em branco', 'With "mirror the server" the app downloads by itself.', 'Com "espelhar o servidor" o app baixa sozinho.'],
   ['edit_saved', 'Drafts (edit saved form)', 'Rascunhos (editar formulário salvo)'],
   ['delete_saved', 'Delete forms', 'Excluir formulários'],
   ['send_finalized', 'Send finalized (manual)', 'Enviar finalizados (manual)', 'Keep on: the fallback when auto send finds no network.', 'Mantenha ligado: é o plano B quando o envio automático não achou rede.'],
   ['view_sent', 'View sent', 'Ver enviados'],
   ['bulk_finalize', 'Bulk finalize drafts', 'Finalizar rascunhos em lote'],
   ['qr_code_scanner', 'Reconfigure with another QR', 'Reconfigurar com outro QR', 'Off, only the admin password changes the configuration.', 'Desligado, só a senha de administrador troca a configuração.']],
  [[ 'change_server', 'Server and account', 'Servidor e conta'],
   ['change_project_display', 'Project name, letter and colour', 'Nome, letra e cor do projeto'],
   ['change_app_language', 'App language', 'Idioma do app'],
   ['change_font_size', 'Font size', 'Tamanho da fonte'],
   ['change_navigation', 'Navigation', 'Navegação'],
   ['change_app_theme', 'Theme', 'Tema'],
   ['maps', 'Maps', 'Mapas'],
   ['form_update_mode', 'Update mode', 'Modo de atualização'],
   ['periodic_form_updates_check', 'Update interval', 'Intervalo de verificação'],
   ['automatic_update', 'Automatic download', 'Download automático'],
   ['hide_old_form_versions', 'Hide old versions', 'Esconder versões antigas'],
   ['change_autosend', 'Auto send', 'Envio automático'],
   ['delete_after_send', 'Delete after send', 'Apagar após enviar'],
   ['default_to_finalized', 'Default to finalized', 'Finalizar por padrão'],
   ['change_constraint_behavior', 'Answer validation', 'Validação das respostas'],
   ['high_resolution', 'High-resolution photos', 'Fotos em alta resolução'],
   ['image_size', 'Photo size', 'Tamanho das fotos'],
   ['guidance_hint', 'Guidance hints', 'Dicas de orientação'],
   ['external_app_recording', 'Record audio with an external app', 'Gravar áudio por app externo'],
   ['instance_form_sync', 'Sync forms from storage', 'Sincronizar formulários do armazenamento'],
   ['change_form_metadata', 'Metadata (name, phone, e-mail)', 'Metadados (nome, telefone, e-mail)'],
   ['analytics', 'Usage analytics', 'Estatísticas de uso']],
  [[ 'moving_backwards', 'Moving backwards', 'Voltar pergunta', 'Turning it off also hides drafts, jumping and editing, and validates on every swipe.', 'Desligar também esconde rascunho, pular pergunta e edição, e valida a cada avanço.'],
   ['jump_to', 'Jump to any question', 'Pular para qualquer pergunta'],
   ['save_mid', 'Save mid-form (draft)', 'Salvar no meio (rascunho)'],
   ['save_as_draft', 'Save as draft', 'Salvar como rascunho'],
   ['save_as', 'Edit the name when saving', 'Editar o nome ao salvar'],
   ['finalize_in_form_entry', 'Finalize button at the end of the form', 'Botão Finalizar no fim do questionário'],
   ['mark_as_finalized', 'Mark as finalized (older versions)', 'Marcar como finalizado (versões antigas)'],
   ['allow_other_ways_of_editing_form', 'Edit through other entry points', 'Editar por outros caminhos'],
   ['change_language', 'Change form language', 'Trocar idioma do questionário'],
   ['access_settings', 'Open Settings during the interview', 'Abrir Configurações durante a entrevista']],
];
const ADMIN_KEYS = GROUPS.flatMap((g) => g.map(([k]) => k));
const PRESETS = {
  locked: { keep: ['send_finalized', 'view_sent', 'moving_backwards', 'change_language', 'finalize_in_form_entry', 'mark_as_finalized'], constraint: 'on_swipe' },
  strict: { keep: ['send_finalized', 'view_sent', 'finalize_in_form_entry', 'mark_as_finalized'], constraint: 'on_swipe' },
  open: { keep: ADMIN_KEYS },
  custom: {},
};
function buildLocks() {
  const state = Object.fromEntries($$('[data-admin]').map((el) => [el.dataset.admin, el.checked]));
  $('#locks').innerHTML = GROUPS.map((items, gi) => `
    <h4 class="kicker mt-4 mb-1">${esc(t('groups')[gi])}</h4>
    <div class="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6">
      ${items.map(([k, en, pt, hen, hpt]) => `
        <label class="switch"><input type="checkbox" data-admin="${k}" ${state[k] ?? true ? 'checked' : ''}><span class="trilho"></span>
        <span class="texto">${esc(lang === 'pt' ? pt : en)}${(lang === 'pt' ? hpt : hen) ? `<small>${esc(lang === 'pt' ? hpt : hen)}</small>` : ''}</span></label>`).join('')}
    </div>`).join('');
}
function applyPreset(name) {
  $('#preset-help').textContent = t('presetHelp')[name];
  const p = PRESETS[name];
  if (!p.keep) return;
  $$('[data-admin]').forEach((el) => { el.checked = p.keep.includes(el.dataset.admin); });
  if (p.constraint) $('#constraint').value = p.constraint;
}

// ------------------------------------------------------------------ servers
const SERVERS = [
  { id: 'kobo-global', name: 'KoboToolbox (global)', url: 'https://kc.kobotoolbox.org' },
  { id: 'kobo-eu', name: 'KoboToolbox (EU)', url: 'https://kc-eu.kobotoolbox.org' },
];
function buildServers() {
  const current = $('input[name=server]:checked')?.value || 'kobo-global';
  $('#servers').innerHTML = [...SERVERS, { id: 'custom', name: t('custom'), url: '' }].map((s) => `
    <label class="opcao relative">
      <input type="radio" name="server" value="${s.id}" ${s.id === current ? 'checked' : ''}>
      <span><span class="font-semibold text-sm">${esc(s.name)}</span>
      <span class="text-xs text-muted truncate">${esc(s.url || t('customSub'))}</span></span>
    </label>`).join('');
  showCustom();
}
function showCustom() { $('#custom-box').classList.toggle('hidden', $('input[name=server]:checked')?.value !== 'custom'); }
function serverUrl() {
  const id = $('input[name=server]:checked')?.value;
  return id === 'custom' ? $('#server-url').value.trim() : (SERVERS.find((s) => s.id === id)?.url || '');
}

// ------------------------------------------------------------------ colours
const COLORS = ['#6b63e6', '#1f9d57', '#e6a017', '#ef4444', '#0b7285', '#c2410c', '#6b6b76', '#17171c'];
function buildColors() {
  $('#colors').innerHTML = COLORS.map((c) => `<button type="button" class="cor" style="background:${c}" data-color="${c}" aria-label="${c}" aria-pressed="${c === '#6b63e6'}"></button>`).join('');
}
function pickColor(c) { $('#proj-color').value = c; $$('.cor').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.color === c))); }

// ------------------------------------------------------------------ collect
const val = (id) => $(id).value.trim();
const or = (v) => (v === '' ? undefined : v);
function manyAccounts() {
  return val('#accounts').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
    const p = l.split(/[;,\t]/).map((x) => x.trim());
    return { username: p[0] || '', password: p[1] || '', label: p[2] || undefined };
  }).filter((a) => a.username);
}
function isMany() { return $('#mode-many').getAttribute('aria-selected') === 'true'; }
function collect() {
  const many = isMany();
  const general = {
    server_url: or(serverUrl()),
    username: many ? undefined : or(val('#username')),
    password: many ? undefined : or($('#password').value),
    autosend: $('#autosend').value,
    form_update_mode: $('#update-mode').value,
    periodic_form_updates_check: $('#update-check').value,
    automatic_update: $('#auto-update').checked,
    hide_old_form_versions: $('#hide-old').checked,
    delete_send: $('#delete-send').checked,
    analytics: $('#analytics').checked,
    constraint_behavior: $('#constraint').value,
    navigation: or($('#navigation').value),
    app_language: or($('#language').value),
    font_size: $('#font-size').value ? Number($('#font-size').value) : undefined,
    appTheme: or($('#theme').value),
    image_size: or($('#image-size').value),
  };
  const admin = { admin_pw: or($('#admin').value) };
  $$('[data-admin]').forEach((el) => { admin[el.dataset.admin] = el.checked; });
  const project = {};
  if (val('#proj-name')) project.name = val('#proj-name');
  if (val('#proj-icon')) project.icon = Array.from(val('#proj-icon'))[0];
  if ($('#proj-color').value) project.color = $('#proj-color').value;
  const settings = { general, admin };
  if (Object.keys(project).length) settings.project = project;
  return { settings, accounts: many ? manyAccounts() : [] };
}
function apply(s) {
  const g = s.general || {}, a = s.admin || {}, p = s.project || {};
  if (g.server_url) {
    const known = SERVERS.find((x) => x.url === g.server_url.replace(/\/$/, ''));
    $(`input[name=server][value=${known ? known.id : 'custom'}]`).checked = true;
    if (!known) $('#server-url').value = g.server_url;
    showCustom();
  }
  if (g.username !== undefined) $('#username').value = g.username || '';
  if (g.password !== undefined) $('#password').value = g.password || '';
  const set = (id, v) => { if (v !== undefined && v !== null) $(id).value = String(v); };
  set('#autosend', g.autosend); set('#update-mode', g.form_update_mode); set('#update-check', g.periodic_form_updates_check);
  set('#constraint', g.constraint_behavior); set('#navigation', g.navigation ?? ''); set('#language', g.app_language ?? '');
  set('#font-size', g.font_size ?? ''); set('#theme', g.appTheme ?? ''); set('#image-size', g.image_size ?? '');
  if (g.automatic_update !== undefined) $('#auto-update').checked = !!g.automatic_update;
  if (g.hide_old_form_versions !== undefined) $('#hide-old').checked = !!g.hide_old_form_versions;
  if (g.delete_send !== undefined) $('#delete-send').checked = !!g.delete_send;
  if (g.analytics !== undefined) $('#analytics').checked = !!g.analytics;
  if (a.admin_pw !== undefined) $('#admin').value = a.admin_pw || '';
  $$('[data-admin]').forEach((el) => { el.checked = a[el.dataset.admin] !== false; });
  $('#preset').value = 'custom'; applyPreset('custom');
  if (p.name !== undefined) { $('#proj-name').value = p.name || ''; $('#proj-name').dataset.manual = p.name ? '1' : ''; }
  if (p.icon !== undefined) $('#proj-icon').value = p.icon || '';
  if (p.color) pickColor(p.color);
}

// ------------------------------------------------------------------ render
let ready = false;
let last = [];
function translateWarning(w) { return (t('warn').find(([re]) => re.test(w)) || [null, w])[1]; }
function status(text, cls) { const el = $('#status'); el.textContent = text; el.className = 'chip ' + (cls || ''); }
function enable(yes) { ['#print', '#dl-png', '#dl-svg', '#copy'].forEach((id) => { $(id).disabled = !yes; }); }
function renderOne(settings, label) {
  const r = render(settings, 4);
  return { label, username: settings.general.username, ...r };
}
function generate() {
  if (!ready) return;
  save();
  const { settings, accounts } = collect();
  if (!settings.general.server_url) { status(t('stNoServer'), 'chip-warn'); return; }
  try {
    let list;
    if (!isMany()) {
      list = [renderOne(settings, settings.project?.name || 'Collect')];
    } else {
      list = accounts.map((a) => {
        const s = structuredClone(settings);
        s.general.username = a.username; s.general.password = a.password;
        const label = a.label || a.username;
        if (s.project?.name) s.project.name += ' · ' + label;
        return renderOne(s, label);
      });
    }
    last = list; show(list);
  } catch (e) {
    status(t('stError'), 'chip-crit');
    $('#qr').innerHTML = `<div class="text-sm text-crit p-4 text-center">${esc(e.message || e)}</div>`;
    enable(false);
  }
}
function show(list) {
  if (!list.length) {
    status(t('stNoAccounts'), 'chip-warn');
    $('#qr').innerHTML = `<div class="aspect-square grid place-items-center text-faint text-sm">${esc(t('noValidAccounts'))}</div>`;
    enable(false); return;
  }
  showOne(list[0]);
  const warns = [...new Set(list.flatMap((x) => x.warnings))];
  $('#warnings').innerHTML = warns.map((w) => `<li class="flex gap-2 rounded-xl border border-warn-line bg-warn-soft px-3 py-2"><span aria-hidden="true">⚠</span><span>${esc(translateWarning(w))}</span></li>`).join('');
  const rm = $('#res-many');
  if (list.length > 1) {
    rm.classList.remove('hidden');
    rm.innerHTML = `<span class="chip chip-accent">${esc(t('manyGenerated')(list.length))}</span>
      <div class="mt-2 flex flex-wrap gap-1">${list.map((x, i) => `<button type="button" class="chip hover:bg-accent-tint" data-view="${i}">${esc(x.label)}</button>`).join('')}</div>`;
  } else { rm.classList.add('hidden'); rm.innerHTML = ''; }
  status(list.some((q) => q.username) ? t('stReady') : t('stNoAccount'), 'chip-ok');
  enable(true);
}
function showOne(q) {
  $('#qr').innerHTML = q.svg;
  $('#res-project').textContent = q.label;
  $('#res-account').textContent = q.username ? `${t('account')} ${q.username}` : t('noAccount');
  $('#res-size').textContent = `${q.modules}×${q.modules} ${t('modules')} · ${q.payload.length} ${t('chars')}`;
  $('#json').textContent = q.json;
}

// ------------------------------------------------------------------ output
function fileName(q) { return (q.label || 'collect').replace(/[^\w\-]+/g, '_').slice(0, 60); }
function download(name, blob) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
async function svgToPng(svg, px) {
  const img = new Image();
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await new Promise((ok, err) => { img.onload = ok; img.onerror = err; img.src = url; });
  const c = document.createElement('canvas'); c.width = c.height = px;
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, px, px); ctx.drawImage(img, 0, 0, px, px);
  URL.revokeObjectURL(url);
  return new Promise((ok) => c.toBlob(ok, 'image/png'));
}
function cardHtml(q) {
  return `<article class="cartao">
    <div>${q.svg}</div>
    <div>
      <h2>${esc(q.label)}</h2>
      ${q.username ? `<div class="conta">${esc(q.username)}</div>` : ''}
      <div style="font-size:9pt;color:#6b6b76">${esc(serverUrl())}</div>
      <ol>${t('cardSteps').map((s) => `<li>${s}</li>`).join('')}</ol>
      <p class="aviso">${esc(t('cardWarn'))}</p>
    </div>
  </article>`;
}

// ------------------------------------------------------------------ persistence (no secrets)
const FIELDS = ['#server-url', '#username', '#proj-name', '#proj-icon', '#proj-color', '#preset', '#autosend', '#update-mode', '#update-check', '#constraint', '#navigation', '#language', '#font-size', '#theme', '#image-size'];
const CHECKS = ['#auto-update', '#hide-old', '#delete-send', '#analytics'];
function save() {
  try {
    const d = { server: $('input[name=server]:checked')?.value, fields: {}, checks: {}, admin: {}, manual: !!$('#proj-name').dataset.manual };
    FIELDS.forEach((id) => { d.fields[id] = $(id).value; });
    CHECKS.forEach((id) => { d.checks[id] = $(id).checked; });
    $$('[data-admin]').forEach((el) => { d.admin[el.dataset.admin] = el.checked; });
    localStorage.setItem('collect-qr', JSON.stringify(d));
  } catch { /* private mode etc. */ }
}
function restore() {
  try {
    const d = JSON.parse(localStorage.getItem('collect-qr') || 'null');
    if (!d) return false;
    if (d.server && $(`input[name=server][value=${d.server}]`)) $(`input[name=server][value=${d.server}]`).checked = true;
    Object.entries(d.fields || {}).forEach(([id, v]) => { if ($(id)) $(id).value = v; });
    Object.entries(d.checks || {}).forEach(([id, v]) => { if ($(id)) $(id).checked = v; });
    Object.entries(d.admin || {}).forEach(([k, v]) => { const el = $(`[data-admin="${k}"]`); if (el) el.checked = v; });
    if (d.manual) $('#proj-name').dataset.manual = '1';
    pickColor($('#proj-color').value);
    showCustom();
    return true;
  } catch { return false; }
}

// ------------------------------------------------------------------ events
function randomPassword(n = 10) {
  const alf = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const b = new Uint32Array(n); crypto.getRandomValues(b);
  return Array.from(b, (x) => alf[x % alf.length]).join('');
}
function setMode(many) {
  $('#mode-one').setAttribute('aria-selected', String(!many)); $('#mode-many').setAttribute('aria-selected', String(many));
  $('#mode-one').classList.toggle('btn-primary', !many); $('#mode-many').classList.toggle('btn-primary', many);
  $('#box-one').classList.toggle('hidden', many); $('#box-many').classList.toggle('hidden', !many);
  generate();
}

async function start() {
  let saved = null;
  try { saved = localStorage.getItem('collect-qr-lang'); } catch { /* ignore */ }
  lang = saved || (navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en');
  buildColors(); buildServers(); buildLocks();
  if (!restore()) applyPreset('locked');
  applyLang(lang);
  setMode(false);

  $('#form').addEventListener('input', (e) => {
    if (e.target.id === 'proj-name') $('#proj-name').dataset.manual = e.target.value ? '1' : '';
    if (e.target.matches('[data-admin]')) { $('#preset').value = 'custom'; $('#preset-help').textContent = t('presetHelp').custom; }
    if (e.target.id === 'accounts') $('#accounts-n').textContent = manyAccounts().length;
    if (e.target.id === 'payload-in') return;
    generate();
  });
  $('#form').addEventListener('change', (e) => {
    if (e.target.name === 'server') { showCustom(); generate(); }
    if (e.target.id === 'preset') { applyPreset(e.target.value); generate(); }
    if (e.target.id === 'proj-color') { pickColor(e.target.value); generate(); }
  });
  $('#form').addEventListener('submit', (e) => e.preventDefault());
  $('#colors').addEventListener('click', (e) => { const b = e.target.closest('[data-color]'); if (b) { pickColor(b.dataset.color); generate(); } });
  $$('[data-eye]').forEach((b) => b.addEventListener('click', () => { const i = $('#' + b.dataset.eye); i.type = i.type === 'password' ? 'text' : 'password'; }));
  $('#gen-admin').addEventListener('click', () => { $('#admin').value = randomPassword(); $('#admin').type = 'text'; generate(); });
  $('#mode-one').addEventListener('click', () => setMode(false));
  $('#mode-many').addEventListener('click', () => setMode(true));
  $('#lang').addEventListener('click', () => applyLang(lang === 'pt' ? 'en' : 'pt'));
  $('#res-many').addEventListener('click', (e) => { const b = e.target.closest('[data-view]'); if (b) showOne(last[b.dataset.view]); });
  $('#dl-svg').addEventListener('click', () => last.forEach((q) => download(fileName(q) + '.svg', new Blob([q.svg], { type: 'image/svg+xml' }))));
  $('#dl-png').addEventListener('click', async () => { for (const q of last) download(fileName(q) + '.png', await svgToPng(q.svg, 1200)); });
  $('#copy').addEventListener('click', async () => {
    await navigator.clipboard.writeText(last.map((q) => q.payload).join('\n'));
    const b = $('#copy'); const old = b.textContent; b.textContent = t('copied'); setTimeout(() => { b.textContent = old; }, 1500);
  });
  $('#print').addEventListener('click', () => { $('#impressao').innerHTML = last.map(cardHtml).join(''); window.print(); });
  $('#read-payload').addEventListener('click', () => {
    const err = $('#dec-error'); err.classList.add('hidden');
    try { apply(decode($('#payload-in').value)); generate(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch (e) { err.textContent = t('decodeError') + (e.message || e); err.classList.remove('hidden'); }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await init();
    ready = true;
    $('#engine-version').textContent = version();
    await start();
  } catch (e) {
    status('wasm?', 'chip-crit');
    $('#qr').innerHTML = `<div class="text-sm text-crit p-4 text-center">Could not load the engine (web/pkg): ${esc(e.message || e)}</div>`;
  }
});
