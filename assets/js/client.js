/* Client-side interactions using MockAPI */
document.addEventListener('DOMContentLoaded', async () => {
  const city = VP.getCity ? VP.getCity() : 'João Pessoa';
  const meds = await MockAPI.listMeds(city);
  const exames = await MockAPI.listExames(city);

  // Render medications
  const medsTbody = document.getElementById('meds-tbody');
  if(medsTbody){
    medsTbody.innerHTML = meds.map(m => `
      <tr role="row">
       
        <td>${m.medicamento}<div class="badge">${m.dose}</div></td>
        <td>${m.estoqueDias} dias</td>
        <td>${formatDate(m.receitaVence)}</td>
        <td><span class="badge">${m.status}</span></td>
        <td><button class="btn" data-solicitar="${m.id}">Solicitar renovação</button></td>
      </tr>
    `).join('');

    medsTbody.addEventListener('click', async (e) => {
      const id = e.target.getAttribute('data-solicitar');
      if(!id) return;
      const med = meds.find(x => x.id === id);
      await MockAPI.createSolicitacao(city, { tipo:'Renovação de Receita', idosoId: med.idosoId || null, idoso: med.idoso });
      announce('Solicitação enviada. Você será notificado.');
      e.target.textContent = 'Enviado ✔'; e.target.disabled = true;
    });
  }

  // Render exams
  const exTbody = document.getElementById('exames-tbody');
  if(exTbody){
    exTbody.innerHTML = exames.map(x => `
      <tr>
        <td>${x.idoso}</td>
        <td>${x.exame}</td>
        <td>${formatDate(x.data)}</td>
        <td>${x.local}</td>
        <td><span class="badge">${x.status}</span></td>
        <td>${x.status === 'Pendente' ? `<button class="btn" data-agendar="${x.id}">Agendar</button>`:''}</td>
      </tr>
    `).join('');

    exTbody.addEventListener('click', async (e)=>{
      const id = e.target.getAttribute('data-agendar');
      if(!id) return;
      const res = await MockAPI.agendarExame(city, id);
      if(res.ok) {
        announce('Exame agendado com sucesso.');
        location.reload();
      } else announce('Erro ao agendar.');
    });
  }

  // Simple form for profile (still local info)
  const perfilForm = document.getElementById('perfil-form');
  if(perfilForm){
    const data = load('vp_perfil', {nome:'', telefone:'', cuidador:'', preferenciaContato:'Ligação'});
    for(const k of Object.keys(data)){
      const el = document.getElementById(k);
      if(el) el.value = data[k];
    }
    perfilForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const novo = {
        nome: qs('#nome').value,
        telefone: qs('#telefone').value,
        cuidador: qs('#cuidador').value,
        preferenciaContato: qs('#preferenciaContato').value
      };
      save('vp_perfil', novo);
      announce('Perfil salvo com sucesso.');
      qs('#perfil-status').textContent = 'Salvo ✔';
    });
  }

  // Menu responsivo para navegação superior
  (function() {
    function toggleMenu() {
      const nav = document.querySelector('.navlinks');
      nav.classList.toggle('open');
      const btn = document.getElementById('menu-toggle');
      if (btn) btn.setAttribute('aria-expanded', nav.classList.contains('open'));
    }

    function closeMenuOnResize() {
      const nav = document.querySelector('.navlinks');
      if (window.innerWidth > 900 && nav) nav.classList.remove('open');
    }

    document.addEventListener('DOMContentLoaded', function() {
      // Cria botão de menu se não existir
      if (!document.getElementById('menu-toggle')) {
        const header = document.querySelector('.header .container.nav');
        const navlinks = document.querySelector('.navlinks');
        if (header && navlinks) {
          const btn = document.createElement('button');
          btn.id = 'menu-toggle';
          btn.className = 'btn ghost menu-toggle';
          btn.setAttribute('aria-label', 'Abrir menu de navegação');
          btn.setAttribute('aria-expanded', 'false');
          // Fallback SVG para garantir ícone (usa fill=currentColor para herdar cor do botão)
          // Use the computed value for --text so the inline style receives an actual color string
          try {
            const resolved = getComputedStyle(document.body).getPropertyValue('--text') || '';
            btn.style.color = resolved.trim() || '';
          } catch (err) {
            // fallback to leaving color unset which will inherit
            btn.style.color = '';
          }
          btn.innerHTML = '' +
            '<svg class="fallback-menu-icon" viewBox="0 0 24 24" role="img" aria-hidden="false" focusable="false">' +
              '<title>Menu</title>' +
              '<path fill="currentColor" d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>' +
            '</svg>' +
            '<i data-lucide="menu"></i>';
          btn.onclick = toggleMenu;
          // Insere o botão logo após o logo/marca
          const brand = header.querySelector('.brand');
          // Ensure navlinks has an id so we can reference it from the button
          if (navlinks && !navlinks.id) navlinks.id = 'navlinks-main';
          if (navlinks) btn.setAttribute('aria-controls', navlinks.id);
          if (brand && brand.nextSibling) {
            header.insertBefore(btn, brand.nextSibling);
          } else {
            header.insertBefore(btn, navlinks);
          }
        }
      }
      window.addEventListener('resize', closeMenuOnResize);
    });
  })();
});