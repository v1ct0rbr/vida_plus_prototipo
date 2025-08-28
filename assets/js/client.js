/* Client-side interactions using MockAPI */
document.addEventListener('DOMContentLoaded', async () => {
  const city = VP.getCity ? VP.getCity() : 'Fortaleza';
  const meds = await MockAPI.listMeds(city);
  const exames = await MockAPI.listExames(city);

  // Render medications
  const medsTbody = document.getElementById('meds-tbody');
  if(medsTbody){
    medsTbody.innerHTML = meds.map(m => `
      <tr role="row">
        <td>${m.idoso}</td>
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
});