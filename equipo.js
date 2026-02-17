// equipo.js
// Manejo del equipo Pokémon (añadir, quitar, renderizar)

export let equipo = JSON.parse(localStorage.getItem('equipoPokemon') || '[]');

export function guardarEquipo() {
  localStorage.setItem('equipoPokemon', JSON.stringify(equipo));
}

export function renderEquipo() {
  const body = document.getElementById('equipoOffcanvasBody');
  if (!body) return;
  if (!equipo.length) {
    body.innerHTML = '<div class="alert alert-info">No hay Pokémon en el equipo.</div>';
    return;
  }
  body.innerHTML = `<div class="table-responsive"><table class="table table-striped align-middle mb-0">
    <thead class="table-dark">
      <tr>
        <th class="text-center">Pokémon</th>
        <th class="text-center">Tipo</th>
        <th class="text-center">Tamaño</th>
        <th class="text-center">Habilidades</th>
        <th class="text-center">Estadísticas D&D</th>
        <th class="text-center">Movimientos</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      ${equipo.map((p, i) => {
        // Buscar info completa en window.allPokemon si existe
        let poke = (window.allPokemon||[]).find(pk => pk.name === p.name) || p;
        // Si el objeto del equipo tiene idx/formaIdx, pásalos a los botones
        let idx = poke.idx !== undefined ? poke.idx : i;
        let formaIdx = poke.formaIdx !== undefined ? poke.formaIdx : undefined;
        return `<tr>
          <td class="fw-bold text-center">${poke.name}</td>
          <td class="text-center">${(poke.types||[]).map(type => `<img src='./data/types/${type.toLowerCase()}.png' alt='${type}' title='${type}' class='pokemon-type-img'>`).join('')}</td>
          <td class="text-center">${poke.tamano || ''} <span class="badge bg-secondary ms-1" style="font-size:0.85em;vertical-align:middle;">${window.getSizeDimensions ? window.getSizeDimensions(poke.tamano) : ''}</span></td>
          <td class="text-center">${poke.abilities ? Object.values(poke.abilities).map(hab => `<span class='badge bg-info text-dark mx-1 ability-badge' data-ability='${hab}'>${hab}</span>`).join('') : ''}</td>
          <td class="text-center"><button class="btn btn-sm btn-dark stats-btn" data-idx="${idx}" ${formaIdx !== undefined ? `data-forma="${formaIdx}"` : ''}>Ver estadísticas</button></td>
          <td class="text-center"><button class="btn btn-sm btn-success moves-btn" data-idx="${idx}" ${formaIdx !== undefined ? `data-forma="${formaIdx}"` : ''}>Ver movimientos</button></td>
          <td class="text-center"><button class="btn btn-sm btn-outline-danger quitar-poke-btn" data-idx="${i}" title="Quitar"><i class="bi bi-x-lg"></i></button></td>
        </tr>`;
      }).join('')}
    </tbody>
  </table></div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('equipoBtn').addEventListener('click', function() {
    renderEquipo();
    const offcanvas = new window.bootstrap.Offcanvas(document.getElementById('equipoOffcanvas'));
    offcanvas.show();
  });

  document.body.addEventListener('click', function(e) {
    const quitarBtn = e.target.closest('.quitar-poke-btn');
    if (quitarBtn) {
      const idx = quitarBtn.getAttribute('data-idx');
      equipo.splice(idx, 1);
      guardarEquipo();
      renderEquipo();
      return;
    }
    // Soporte para botones de stats y movimientos dentro del equipo
    const statsBtn = e.target.closest('.stats-btn');
    if (statsBtn && statsBtn.closest('#equipoOffcanvasBody')) {
      // ...existing code for statsBtn...
      const idx = statsBtn.getAttribute('data-idx');
      const formaIdx = statsBtn.getAttribute('data-forma');
      let poke;
      if (typeof window.allPokemon !== 'undefined' && window.allPokemon) {
        if (typeof formaIdx !== 'undefined' && formaIdx !== null) {
          poke = window.allPokemon[idx]?.formas?.[formaIdx];
        } else {
          poke = window.allPokemon[idx];
        }
      }
      if (!poke) {
        poke = equipo[idx] || equipo.find((p, i) => i == idx);
      }
      if (poke && poke.statsDnD) {
        const s = poke.statsDnD;
        document.getElementById('statsModalLabel').textContent = poke.name + ' - Estadísticas D&D';
        const tiradaSalvacion = 8 + (s.modINT || 0) + (s.modSAB || 0);
        const habilidades = [
          { nombre: 'Atletismo', stat: 'modFUE' },
          { nombre: 'Acrobacias', stat: 'modDES' },
          { nombre: 'Juego de Manos', stat: 'modDES' },
          { nombre: 'Sigilo', stat: 'modDES' },
          { nombre: 'Pokedex', stat: 'modINT' },
          { nombre: 'Investigación', stat: 'modINT' },
          { nombre: 'Naturaleza', stat: 'modINT' },
          { nombre: 'PokeSocial', stat: 'modSAB' },
          { nombre: 'Perspicacia', stat: 'modSAB' },
          { nombre: 'Medicina', stat: 'modSAB' },
          { nombre: 'Percepción', stat: 'modSAB' },
          { nombre: 'Supervivencia', stat: 'modSAB' },
          { nombre: 'Engañar', stat: 'modCAR' },
          { nombre: 'Intimidación', stat: 'modCAR' },
          { nombre: 'Interpretación', stat: 'modCAR' },
          { nombre: 'Persuasión', stat: 'modCAR' }
        ];
        const habilidadesHtml = `
          <div class="dnd-minificha-skills">
            <div class="dnd-minificha-skills-title">Habilidades D&D</div>
            <div class="dnd-minificha-skills-list">
              ${habilidades.map(h => {
                const val = s[h.stat] || 0;
                const sign = val >= 0 ? '+' : '';
                return `<span class="dnd-minificha-skill"><strong>${h.nombre}:</strong> ${sign}${val}</span>`;
              }).join('')}
            </div>
          </div>
        `;
        document.getElementById('statsModalBody').innerHTML = `
          <div class="dnd-minificha-card">
            <div class="dnd-minificha-header">
              <span class="dnd-minificha-pg"><strong>PG:</strong> ${s.PG}</span>
              <span class="dnd-minificha-ca"><strong>CA:</strong> ${s.CA}</span>
              <span class="dnd-minificha-vel"><strong>Velocidad:</strong> ${s.velocidadFt} ft</span>
            </div>
            <div class="dnd-minificha-stats-row">
              <div class="dnd-minificha-stat"><span>FUE</span><div>${s.FUE} <small>(${s.modFUE >= 0 ? '+' : ''}${s.modFUE})</small></div></div>
              <div class="dnd-minificha-stat"><span>DES</span><div>${s.DES} <small>(${s.modDES >= 0 ? '+' : ''}${s.modDES})</small></div></div>
              <div class="dnd-minificha-stat"><span>CON</span><div>${s.CON} <small>(${s.modCON >= 0 ? '+' : ''}${s.modCON})</small></div></div>
              <div class="dnd-minificha-stat"><span>INT</span><div>${s.INT} <small>(${s.modINT >= 0 ? '+' : ''}${s.modINT})</small></div></div>
              <div class="dnd-minificha-stat"><span>SAB</span><div>${s.SAB} <small>(${s.modSAB >= 0 ? '+' : ''}${s.modSAB})</small></div></div>
              <div class="dnd-minificha-stat"><span>CAR</span><div>${s.CAR} <small>(${s.modCAR >= 0 ? '+' : ''}${s.modCAR})</small></div></div>
            </div>
            ${habilidadesHtml}
            <div class="dnd-minificha-footer">
              <span class="dnd-minificha-save"><strong>Tirada de salvación:</strong> ${tiradaSalvacion}</span>
            </div>
          </div>
        `;
        const modal = new window.bootstrap.Modal(document.getElementById('statsModal'));
        modal.show();
      }
      return;
    }
    const movesBtn = e.target.closest('.moves-btn');
    if (movesBtn && movesBtn.closest('#equipoOffcanvasBody')) {
      const idx = movesBtn.getAttribute('data-idx');
      const formaIdx = movesBtn.getAttribute('data-forma');
      let poke;
      if (typeof window.allPokemon !== 'undefined' && window.allPokemon) {
        if (typeof formaIdx !== 'undefined' && formaIdx !== null) {
          poke = window.allPokemon[idx]?.formas?.[formaIdx];
        } else {
          poke = window.allPokemon[idx];
        }
      }
      if (!poke) {
        poke = equipo[idx] || equipo.find((p, i) => i == idx);
      }
      let moves = poke && poke.moves ? poke.moves : [];
      if (typeof window.showMovesModal === 'function') {
        window.showMovesModal(poke, moves);
      }
      return;
    }
    // Habilidad desde el equipo
    const abilityBadge = e.target.closest('.ability-badge');
    if (abilityBadge && abilityBadge.closest('#equipoOffcanvasBody')) {
      const ability = abilityBadge.getAttribute('data-ability');
      // Buscar el Pokémon correspondiente
      const row = abilityBadge.closest('tr');
      const statsBtn = row ? row.querySelector('.stats-btn') : null;
      let poke = null;
      if (statsBtn) {
        const idx = statsBtn.getAttribute('data-idx');
        const formaIdx = statsBtn.getAttribute('data-forma');
        if (typeof window.allPokemon !== 'undefined' && window.allPokemon) {
          if (typeof formaIdx !== 'undefined' && formaIdx !== null) {
            poke = window.allPokemon[idx]?.formas?.[formaIdx];
          } else {
            poke = window.allPokemon[idx];
          }
        }
        if (!poke) {
          poke = equipo[idx] || equipo.find((p, i) => i == idx);
        }
      }
      // Obtener AbilitiesText del global
      const AbilitiesText = window.AbilitiesText || {};
      const def = AbilitiesText[ability?.toLowerCase()] || AbilitiesText[ability?.replace(/ /g, '').toLowerCase()];
      const modalLabel = document.getElementById('abilityModalLabel');
      if (modalLabel && poke) {
        modalLabel.textContent = poke.name + ' - ' + (def?.name || ability);
      } else {
        modalLabel.textContent = def?.name || ability;
      }
      document.getElementById('abilityModalBody').textContent = def?.desc || def?.shortDesc || 'Sin descripción.';
      const modal = new window.bootstrap.Modal(document.getElementById('abilityModal'));
      modal.show();
      return;
    }
  });
});

export function addToEquipo(poke) {
  if (equipo.length >= 6) {
    alert('El equipo no puede tener más de 6 Pokémon.');
    return;
  }
  if (equipo.some(p => p.name === poke.name && (p.formaIdx === poke.formaIdx || p.formaIdx === undefined))) {
    alert('Ese Pokémon ya está en el equipo.');
    return;
  }
  // Guardar toda la info relevante para que el render y los botones funcionen
  equipo.push({
    name: poke.name,
    types: poke.types,
    tamano: poke.tamano,
    abilities: poke.abilities,
    statsDnD: poke.statsDnD,
    moves: poke.moves,
    idx: poke.idx,
    formaIdx: poke.formaIdx
  });
  guardarEquipo();
  renderEquipo();
}
