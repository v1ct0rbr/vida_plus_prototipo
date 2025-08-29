/* Shared JS for Vida+ Prototype - with MockAPI integration */
/* Shared JS for Vida+ Prototype - Accessibility & Storage Helpers */
const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];

function announce(msg){
  let live = qs('#aria-live');
  if(!live){
    live = document.createElement('div');
    live.id='aria-live';
    live.className='visually-hidden';
    live.setAttribute('aria-live','polite');
    document.body.appendChild(live);
  }
  live.textContent = msg;
}

function save(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}
function load(key, fallback){
  try{ return JSON.parse(localStorage.getItem(key)) ?? fallback }catch(e){ return fallback }
}

function uid(){ return Math.random().toString(36).slice(2,9) }

/* Seed demo data if empty */
(function seed(){
  if(!localStorage.getItem('vp_idosos')){
    const idosos = [
      {id: uid(), nome:'Maria Souza', idade:72, condicoes:['Diabetes','Hipertensão'], cuidador:'Carlos Souza', telefone:'(85) 99999-1000'},
      {id: uid(), nome:'João Lima', idade:78, condicoes:['Hipertensão'], cuidador:'—', telefone:'(85) 98888-2222'},
      {id: uid(), nome:'Ana Melo', idade:81, condicoes:['Arritmia'], cuidador:'Luciana Melo', telefone:'(85) 97777-3333'}
    ];
    save('vp_idosos', idosos);
  }
  if(!localStorage.getItem('vp_meds')){
    const meds = [
      {id: uid(), idoso:'Maria Souza', medicamento:'Metformina 850mg', dose:'1 comp 2x/dia', estoqueDias:7, receitaVence:'2025-09-15', status:'A renovar'},
      {id: uid(), idoso:'João Lima', medicamento:'Losartana 50mg', dose:'1 comp/dia', estoqueDias:3, receitaVence:'2025-09-02', status:'Crítico'},
      {id: uid(), idoso:'Ana Melo', medicamento:'Amiodarona 200mg', dose:'1 comp/dia', estoqueDias:21, receitaVence:'2025-10-10', status:'OK'}
    ];
    save('vp_meds', meds);
  }
  if(!localStorage.getItem('vp_exames')){
    const exames = [
      {id: uid(), idoso:'Maria Souza', exame:'Glicemia de jejum', data:'2025-09-05', local:'Lab Popular Centro', status:'Agendado'},
      {id: uid(), idoso:'João Lima', exame:'Perfil lipídico', data:'2025-09-12', local:'UBS Bairro Sul', status:'Pendente'},
      {id: uid(), idoso:'Ana Melo', exame:'Eletrocardiograma', data:'2025-09-20', local:'Hospital Municipal', status:'Agendado'}
    ];
    save('vp_exames', exames);
  }
  if(!localStorage.getItem('vp_solicitacoes')){
    const solicitacoes = [
      {id: uid(), tipo:'Renovação de Receita', idoso:'João Lima', criado:'2025-08-20', status:'Aberto'},
      {id: uid(), tipo:'Coleta domiciliar', idoso:'Maria Souza', criado:'2025-08-21', status:'Em análise'}
    ];
    save('vp_solicitacoes', solicitacoes);
  }
})();

function formatDate(d){
  const date = new Date(d);
  if(isNaN(date)) return d;
  return date.toLocaleDateString();
}
/* Current city management */
(function(){
  const defaultCity = 'João Pessoa';
  function getCity(){ return localStorage.getItem('vp_city') || defaultCity; }
  function setCity(c){ localStorage.setItem('vp_city', c); announce('Cidade selecionada: '+c); return c; }
  window.VP = window.VP || {};
  VP.getCity = getCity;
  VP.setCity = setCity;
  // Initialize mock api for default city on load
  document.addEventListener('DOMContentLoaded', ()=>{
    const citySelect = document.getElementById('city-select');
    if(citySelect){
      citySelect.value = getCity();
      citySelect.addEventListener('change',(e)=>{
        const c = e.target.value; setCity(c);
        MockAPI.initCity(c).then(()=> location.reload());
      });
    } else {
      MockAPI.initCity(getCity());
    }
  });
})();

/* Theme management: light / dark */
(function(){
  const THEME_KEY = 'vp_theme';
  function getTheme(){ return load(THEME_KEY, 'dark'); }
  function setTheme(t){ save(THEME_KEY, t); applyTheme(t); announce('Tema: '+ (t==='light' ? 'Claro' : 'Escuro')); }
  function applyTheme(t){
    document.body.classList.remove('theme-light','theme-dark');
    document.body.classList.add(t==='light' ? 'theme-light' : 'theme-dark');
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    // apply stored theme on load
    const theme = getTheme();
    applyTheme(theme);

    // hook up existing toggle button (keeps id toggle-contrast for compatibility)
    const btn = document.getElementById('toggle-contrast');
    if(btn){
      // update label/icon according to theme
      const updateLabel = ()=>{
        const t = getTheme();
        btn.innerHTML = (t==='light' ? '<i data-lucide="sun" aria-hidden="true"></i> Tema: Claro' : '<i data-lucide="moon" aria-hidden="true"></i> Tema: Escuro');
        if(window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
      };
      updateLabel();
      btn.addEventListener('click', ()=>{
        const next = getTheme()==='light' ? 'dark' : 'light';
        setTheme(next);
        updateLabel();
      });
    }
  // ensure icons are created on pages without the toggle button
  if(window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  });
})();