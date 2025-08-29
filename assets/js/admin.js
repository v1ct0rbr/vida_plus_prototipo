/* Admin-side interactions using MockAPI */
document.addEventListener('DOMContentLoaded', async () => {
  const city = VP.getCity ? VP.getCity() : 'João Pessoa';
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

  // Render monthly charts: exames por mês & idosos cadastrados por mês
  try{
    // Helper: build last 6 months labels
    function lastNMonths(n){
      const labs = [];
      const now = new Date();
      for(let i=n-1;i>=0;i--){
        const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
        labs.push(d.toLocaleString(undefined, { month: 'short', year: 'numeric' }));
      }
      return labs;
    }

    // Count occurrences per month (YYYY-MM)
    function countsByMonth(items, dateKey, months){
      const map = {};
      for(const it of items){
        const dt = new Date(it[dateKey]);
        if(isNaN(dt)) continue;
        const key = dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');
        map[key] = (map[key]||0) + 1;
      }
      const now = new Date();
      const res = [];
      for(let i=months-1;i>=0;i--){
        const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
        const k = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
        res.push(map[k]||0);
      }
      return res;
    }

  const months = 12;
    const monthLabels = lastNMonths(months);

    // Exames per month (uses exames[].data)
    const exCtx = document.getElementById('examesMonthChart');
    if(exCtx && window.Chart){
      const exData = countsByMonth(exames, 'data', months);
      // total and change
      const totalEx = exData.reduce((a,b)=>a+b,0);
      const last = exData[exData.length-1]||0; const prev = exData[exData.length-2]||0;
      const changeEx = prev===0? (last===0?0:100): Math.round(((last - prev)/prev)*100);
      const exTotalEl = document.getElementById('exames-total'); if(exTotalEl) exTotalEl.textContent = totalEx;
      const exChangeEl = document.getElementById('exames-change'); if(exChangeEl) exChangeEl.textContent = (changeEx>0?'+':'')+changeEx+'%';
      // moving average (3-month)
      const ma = exData.map((_,i,arr)=>{ const slice = arr.slice(Math.max(0,i-2), i+1); return Math.round(slice.reduce((a,b)=>a+b,0)/slice.length); });
      new Chart(exCtx.getContext('2d'), {
        type: 'bar',
        data: { labels: monthLabels, datasets: [{ label:'Exames', data: exData, backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6ee7b7' }] },
        data: {
          labels: monthLabels,
          datasets: [
            { type:'bar', label:'Exames', data: exData, backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#6ee7b7' },
            { type:'line', label:'Média 3m', data: ma, borderColor: '#ffffff88', borderWidth:1.5, fill:false, tension:0.3, pointRadius:0 }
          ]
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ display:true }, tooltip:{ callbacks:{ label: function(ctx){ return ctx.parsed.y + (ctx.dataset.type==='line'? ' (média)':' exames'); } } } },
          scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 } } }
        }
      });
    }

    // Idosos cadastrados per month: mock API doesn't store created date, so create a small synthetic distribution
    const idCtx = document.getElementById('idososMonthChart');
    if(idCtx && window.Chart){
      // Prefer explicit 'criado' date on idosos; fallback to distributing evenly
      const idososWithDate = (idosos||[]).filter(i=>i.criado);
      let idData;
      if(idososWithDate.length){
        idData = countsByMonth(idososWithDate, 'criado', months);
      } else {
        const totalIdosos = (idosos||[]).length;
        const base = Math.floor(totalIdosos / months);
        const remainder = totalIdosos % months;
        idData = new Array(months).fill(base).map((v,i)=> v + (i >= months - remainder ? 1 : 0));
      }
      // total and change for idosos
      const totalId = idData.reduce((a,b)=>a+b,0);
      const lastId = idData[idData.length-1]||0; const prevId = idData[idData.length-2]||0;
      const changeId = prevId===0? (lastId===0?0:100): Math.round(((lastId - prevId)/prevId)*100);
      const idTotalEl = document.getElementById('idosos-total'); if(idTotalEl) idTotalEl.textContent = totalId;
      const idChangeEl = document.getElementById('idosos-change'); if(idChangeEl) idChangeEl.textContent = (changeId>0?'+':'')+changeId+'%';
      new Chart(idCtx.getContext('2d'), {
        type: 'bar',
        data: { labels: monthLabels, datasets: [{ label:'Novos idosos', data: idData, backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--accent-2').trim() || '#86efac' }] },
        options:{
          responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: function(ctx){ return ctx.parsed.y + ' cadastros'; } } } },
          scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 } } }
        }
      });
    }
  }catch(err){ console.warn('Monthly charts failed', err) }
  // Regen data button (admin utility)
  const regenBtn = document.getElementById('regen-data');
  if(regenBtn){
    regenBtn.addEventListener('click', async ()=>{
      regenBtn.disabled = true; regenBtn.textContent = 'Gerando...';
      await MockAPI.regenCity(city);
      location.reload();
    });
  }
});