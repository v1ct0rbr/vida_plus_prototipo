/* Admin-side interactions using MockAPI */
document.addEventListener('DOMContentLoaded', async () => {
  const city = VP.getCity ? VP.getCity() : 'Fortaleza';
  const idosos = await MockAPI.listIdosos(city);
  const solicitacoes = await MockAPI.listSolicitacoes(city);
  const meds = await MockAPI.listMeds(city);
  const exames = await MockAPI.listExames(city);

  // KPI counts
  const kpiSolicAberto = document.getElementById('kpi-solic-aberto');
  const kpiMedsCriticos = document.getElementById('kpi-meds-criticos');
  const kpiExPendente = document.getElementById('kpi-ex-pendente');
  const kpiIdosos = document.getElementById('kpi-idosos');

  if(kpiSolicAberto) kpiSolicAberto.textContent = solicitacoes.filter(s=>s.status!=='Concluído').length;
  if(kpiMedsCriticos) kpiMedsCriticos.textContent = meds.filter(m=>m.estoqueDias<=5).length;
  if(kpiExPendente) kpiExPendente.textContent = exames.filter(e=>e.status==='Pendente').length;
  if(kpiIdosos) kpiIdosos.textContent = idosos.length;

  // Render solicitations table
  const solTbody = document.getElementById('solicitacoes-tbody');
  if(solTbody){
    solTbody.innerHTML = solicitacoes.map(s=>`
      <tr>
        <td>${s.tipo}</td>
        <td>${s.idoso}</td>
        <td>${formatDate(s.criado)}</td>
        <td><span class="badge">${s.status}</span></td>
        <td>
          ${s.status!=='Concluído'?`<button class="btn" data-concluir="${s.id}">Concluir</button>`:''}
        </td>
      </tr>
    `).join('');

    solTbody.addEventListener('click', async (e)=>{
      const id = e.target.getAttribute('data-concluir');
      if(!id) return;
      await MockAPI.concluirSolicitacao(city, id);
      announce('Solicitação concluída.');
      e.target.closest('tr').querySelector('td:nth-child(4)').innerHTML = '<span class="badge">Concluído</span>';
      e.target.remove();
    });
  }

  // Render idosos table
  const idTbody = document.getElementById('idosos-tbody');
  if(idTbody){
    idTbody.innerHTML = idosos.map(i=>`
      <tr>
        <td>${i.nome}</td>
        <td>${i.idade}</td>
        <td>${i.condicoes.join(', ')}</td>
        <td>${i.cuidador}</td>
        <td>${i.telefone}</td>
      </tr>
    `).join('');
  }

  // Render meds and exams in admin pages if any
  const medsTbody = document.getElementById('admin-meds-tbody');
  if(medsTbody){
    medsTbody.innerHTML = meds.map(m=>`
      <tr>
        <td>${m.idoso}</td>
        <td>${m.medicamento}</td>
        <td>${m.dose}</td>
        <td>${m.estoqueDias} dias</td>
        <td>${formatDate(m.receitaVence)}</td>
        <td><span class="badge">${m.status}</span></td>
      </tr>
    `).join('');
  }

  const exTbody = document.getElementById('admin-exames-tbody');
  if(exTbody){
    exTbody.innerHTML = exames.map(x=>`
      <tr>
        <td>${x.idoso}</td>
        <td>${x.exame}</td>
        <td>${formatDate(x.data)}</td>
        <td>${x.local}</td>
        <td><span class="badge">${x.status}</span></td>
      </tr>
    `).join('');
  }

  // Render fake trends chart using Chart.js
  try{
    const ctx = document.getElementById('trendChart');
    if(ctx && window.Chart){
      // Generate sample data (last 8 weeks)
      const labels = [];
      const dataSolic = [];
      for(let i=7;i>=0;i--){
        const d = new Date(); d.setDate(d.getDate() - i*7);
        labels.push((d.getMonth()+1)+"/"+d.getDate());
        // fake values influenced by counts
        dataSolic.push(Math.max(1, Math.round((Math.random()*5) + (solicitacoes.length*0.2))));
      }

      const chart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            { label: 'Solicitações abertas', data: dataSolic, borderColor: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6ee7b7', tension:0.3, fill:false, pointRadius:4 }
          ]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ display:true } },
          scales: { y:{ beginAtZero:true, ticks:{stepSize:1} } }
        }
      });
    }
  }catch(e){ console.warn('Chart render failed', e) }
});