/* Mock API to simulate networked backend for Vida+ prototype
   - Simulates endpoints via Promises & delays
   - Stores data in localStorage under vp_api_<city>
*/
const MockAPI = (function(){
  const delay = (ms)=>new Promise(r=>setTimeout(r, ms));
  const seedCity = (city)=>{
    const key = `vp_api_${city}`;
    // load existing data if exists, otherwise create base
    let data = (localStorage.getItem(key) && JSON.parse(localStorage.getItem(key))) || {
      idosos: [
        {id:'i1', nome:'Maria Souza', idade:72, condicoes:['Diabetes','Hipertensão'], cuidador:'Carlos Souza', telefone:'(85) 99999-1000', criado: '2025-03-12'},
        {id:'i2', nome:'João Lima', idade:78, condicoes:['Hipertensão'], cuidador:'—', telefone:'(85) 98888-2222', criado: '2025-07-04'},
        {id:'i3', nome:'Ana Melo', idade:81, condicoes:['Arritmia'], cuidador:'Luciana Melo', telefone:'(85) 97777-3333', criado: '2024-11-20'}
      ],
      meds: [
        {id:'m1', idosoId:'i1', medicamento:'Metformina 850mg', dose:'1 comp 2x/dia', estoqueDias:7, receitaVence:'2025-09-15', status:'A renovar'},
        {id:'m2', idosoId:'i2', medicamento:'Losartana 50mg', dose:'1 comp/dia', estoqueDias:3, receitaVence:'2025-09-02', status:'Crítico'},
        {id:'m3', idosoId:'i3', medicamento:'Amiodarona 200mg', dose:'1 comp/dia', estoqueDias:21, receitaVence:'2025-10-10', status:'OK'}
      ],
      exames: [
        {id:'e1', idosoId:'i1', exame:'Glicemia de jejum', data:'2025-09-05', local:'Lab Popular Centro', status:'Agendado'},
        {id:'e2', idosoId:'i2', exame:'Perfil lipídico', data:'2025-09-12', local:'UBS Bairro Sul', status:'Pendente'},
        {id:'e3', idosoId:'i3', exame:'Eletrocardiograma', data:'2025-09-20', local:'Hospital Municipal', status:'Agendado'}
      ],
      solicitacoes: [
        {id:'s1', tipo:'Renovação de Receita', idosoId:'i2', criado:'2025-08-20', status:'Aberto'},
        {id:'s2', tipo:'Coleta domiciliar', idosoId:'i1', criado:'2025-08-21', status:'Em análise'}
      ]
    };

    // If dataset is sparse, augment so charts display variation (safe append - don't remove existing data)
    const now = new Date();
    const idososWithCriado = (data.idosos||[]).filter(i=>i.criado).length;
    const examesCount = (data.exames||[]).length;
    const needMoreIdosos = idososWithCriado < 12; // want at least 12 months of registrations
    const needMoreExames = examesCount < 60; // aim for ~60+ exames

    if(needMoreIdosos || needMoreExames){
      // generate additional idosos with 'criado' spread over last 12 months
      const existingCount = (data.idosos||[]).length;
      const addIdosos = Math.max(0, 24 - (data.idosos||[]).length + 0);
      for(let i=0;i<Math.max(12, addIdosos);i++){
        const d = new Date(now.getFullYear(), now.getMonth()-Math.floor(Math.random()*12), Math.max(1, Math.floor(Math.random()*28)));
        const id = 'gi'+(i+1+existingCount);
        data.idosos.push({ id, nome: `Usuário ${id}`, idade: 65 + Math.floor(Math.random()*20), condicoes: [], cuidador: '—', telefone: '(85) 9' + String(100000000 + Math.floor(Math.random()*89999999)).slice(1), criado: d.toISOString().slice(0,10) });
      }

      // generate exames spread over last 12 months until we reach threshold
      const examNames = ['Glicemia de jejum','Perfil lipídico','Eletrocardiograma','Hemograma','Ultrassom abdominal'];
      const targetExames = Math.max(examesCount, 80);
      for(let i=0;i<targetExames - examesCount;i++){
        const d = new Date(now.getFullYear(), now.getMonth()-Math.floor(Math.random()*12), Math.max(1, Math.floor(Math.random()*28)));
        const id = 'ge'+(examesCount + i);
        const idoso = data.idosos[Math.floor(Math.random()*data.idosos.length)];
        data.exames.push({ id, idosoId: idoso.id, exame: examNames[Math.floor(Math.random()*examNames.length)], data: d.toISOString().slice(0,10), local: 'Lab Demo', status: Math.random()>0.7? 'Pendente':'Agendado' });
      }
    }

    localStorage.setItem(key, JSON.stringify(data));
  };

  function getData(city){ return JSON.parse(localStorage.getItem(`vp_api_${city}`) || '{}'); }
  function saveData(city, data){ localStorage.setItem(`vp_api_${city}`, JSON.stringify(data)); }

  return {
    initCity: async function(city='João Pessoa'){
      await delay(200);
      seedCity(city);
      return {ok:true, city};
    },
    listIdosos: async function(city='João Pessoa'){
      await delay(300 + Math.random()*300);
      return (getData(city).idosos || []).map(i=>({ ...i }));
    },
    listMeds: async function(city='João Pessoa'){
      await delay(300 + Math.random()*300);
      const data = getData(city).meds || [];
      const idosos = getData(city).idosos || [];
      return data.map(m=> ({ ...m, idoso: (idosos.find(i=>i.id===m.idosoId)||{}).nome || m.idosoId }));
    },
    listExames: async function(city='João Pessoa'){
      await delay(300 + Math.random()*300);
      const data = getData(city).exames || [];
      const idosos = getData(city).idosos || [];
      return data.map(e=> ({ ...e, idoso: (idosos.find(i=>i.id===e.idosoId)||{}).nome || e.idosoId }));
    },
    listSolicitacoes: async function(city='João Pessoa'){
      await delay(200 + Math.random()*200);
      const data = getData(city).solicitacoes || [];
      const idosos = getData(city).idosos || [];
      return data.map(s=> ({ ...s, idoso: (idosos.find(i=>i.id===s.idosoId)||{}).nome || s.idosoId }));
    },
    createSolicitacao: async function(city='João Pessoa', payload={}){
      await delay(400 + Math.random()*300);
      const data = getData(city);
      const novo = { id: 's'+Math.random().toString(36).slice(2,9), criado: new Date().toISOString().slice(0,10), status:'Aberto', ...payload };
      data.solicitacoes = data.solicitacoes || [];
      data.solicitacoes.push(novo);
      saveData(city, data);
      return { ok:true, solicitacao: novo };
    },
    concluirSolicitacao: async function(city='João Pessoa', id){
      await delay(250 + Math.random()*200);
      const data = getData(city);
      const s = (data.solicitacoes||[]).find(x=>x.id===id);
      if(s) s.status = 'Concluído';
      saveData(city, data);
      return { ok: !!s };
    },
    agendarExame: async function(city='João Pessoa', id){
      await delay(350 + Math.random()*300);
      const data = getData(city);
      const e = (data.exames||[]).find(x=>x.id===id);
      if(e){
        const later = new Date(Date.now()+1000*60*60*24*10).toISOString().slice(0,10);
        e.status = 'Agendado'; e.data = later;
        saveData(city, data);
        return { ok:true, exame:e };
      }
      return { ok:false };
    }
    ,
    // Force regeneration of demo data for a city (overwrite)
    regenCity: async function(city='João Pessoa'){
      await delay(200);
      const key = `vp_api_${city}`;
      localStorage.removeItem(key);
      seedCity(city);
      return { ok:true, city };
    }
  };
})();

// Expose to global
window.MockAPI = MockAPI;