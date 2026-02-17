function calcularModificadorDnD(valor) {
    // Modificador típico de D&D: (valor - 10) / 2 redondeado a la baja
    return Math.floor((valor - 10) / 2);
}
function calcularModVelocidad(spe) {
    if (spe >= 120) return 2;
    if (spe >= 100) return 1;
    if (spe <= 20) return -1;
    return 0;
}

function calcularModTamano(tamano) {
    switch (tamano) {
        case 'diminuto': return 2;
        case 'pequeño': return 1;
        case 'mediano': return 0;
        case 'grande': return -1;
        case 'enorme':
        case 'gargantuesco': return -2;
        default: return 0;
    }
}

function calcularCarisma(stats) {
    // Nueva fórmula: mezcla entre ataque especial y defensa especial
    // Si el ataque es muy pequeño (<40), el carisma aumenta cuanto menor sea el ataque y mayor la velocidad
    const { atk = 0, spa = 0, spd = 0, spe = 0 } = stats;
    let score;
    if (atk < 40) {
        // Más carisma cuanto menor sea el ataque y mayor la velocidad
        score = 12 + Math.round((60 - atk) / 8) + Math.round(spe / 30);
    } else {
        // Mezcla entre ataque especial y defensa especial
        score = Math.round((spa + spd) / 12);
    }
    // Limitar a 23 máximo
    return Math.max(1, Math.min(score, 23));
}

function calcularEstadisticasDnD(data, tamano) {
    const stats = data.baseStats || {};
    const hp = stats.hp || 0;
    const atk = stats.atk || 0;
    const def = stats.def || 0;
    const spa = stats.spa || 0;
    const spd = stats.spd || 0;
    const spe = stats.spe || 0;
    const heightm = data.heightm || 0;
    const weightkg = data.weightkg || 0;

    // PG
    const PG = Math.floor(hp * 2.5 / 4);
    // CA
    const modVel = calcularModVelocidad(spe);
    const modTam = calcularModTamano(tamano);
    const CA = Math.floor(5 + (def / 12) + modVel + modTam);
    // FUE
    const FUE = Math.round((atk / 6) + (weightkg / 50));
    // DES
    const DES = Math.round(spe / 5.5);
    // CON
    const CON = Math.round((hp / 8) + (def / 15) + heightm);
    // INT
    const INT = Math.round(spa / 5.7);
    // SAB
    const SAB = Math.round(spd / 5.7);
    // CAR
    const CAR = calcularCarisma(stats);

    // Modificadores
    const modFUE = calcularModificadorDnD(FUE);
    const modDES = calcularModificadorDnD(DES);
    const modCON = calcularModificadorDnD(CON);
    const modINT = calcularModificadorDnD(INT);
    const modSAB = calcularModificadorDnD(SAB);
    const modCAR = calcularModificadorDnD(CAR);

    // Velocidad en pies
    const velocidadFt = 30 + (modDES * 5);

    return {
        PG, CA,
        FUE, modFUE,
        DES, modDES,
        CON, modCON,
        INT, modINT,
        SAB, modSAB,
        CAR, modCAR,
        velocidadFt
    };
}
// dataLoader.js
// Este fichero importa y expone la lista de Pokémon del dnddex.js
import { Pokedex } from './data/dnddex.js';
import '../data/learnset.js'; // Asegura que window.Learnsets esté disponible

function calcularTamano(heightm) {
    if (heightm < 0.3) return 'diminuto';
    if (heightm < 1) return 'pequeño';
    if (heightm < 2) return 'mediano';
    if (heightm < 5) return 'grande';
    if (heightm < 15) return 'enorme';
    return 'gargantuesco';
}

export function getAllPokemonList() {
    // Agrupa formas Mega y Gmax bajo la forma base
    const pokemons = {};
    Object.entries(Pokedex).forEach(([id, data]) => {
        const tamano = calcularTamano(data.heightm || 0);
        const isMega = /mega/i.test(data.name);
        const isGmax = /gmax/i.test(data.name);
        // Usar baseSpecies si existe, si no el nombre original
        const base = data.baseSpecies ? Pokedex[data.baseSpecies]?.name || data.baseSpecies : data.name;
        let moves = [];
        let movesPP = {};
        if (typeof window !== 'undefined' && window.Learnsets && window.Moves) {
            let learnset = null;
            if (window.Learnsets[id]?.learnset) {
                learnset = window.Learnsets[id].learnset;
            } else if (data.baseSpecies && window.Learnsets[data.baseSpecies]?.learnset) {
                learnset = window.Learnsets[data.baseSpecies].learnset;
            }
            if (learnset) {
                moves = Object.keys(learnset);
                moves.forEach(mov => {
                    if (window.Moves[mov] && typeof window.Moves[mov].pp !== 'undefined') {
                        movesPP[mov] = Math.floor(window.Moves[mov].pp * 2 / 3);
                    }
                });
            }
        } else if (typeof window !== 'undefined' && window.Learnsets) {
            if (window.Learnsets[id]?.learnset) {
                moves = Object.keys(window.Learnsets[id].learnset);
            } else if (data.baseSpecies && window.Learnsets[data.baseSpecies]?.learnset) {
                moves = Object.keys(window.Learnsets[data.baseSpecies].learnset);
            }
        }
        const entry = {
            id,
            name: data.name,
            types: data.types || [],
            tamano,
            abilities: data.abilities || {},
            statsDnD: calcularEstadisticasDnD(data, tamano),
            isMega,
            isGmax,
            moves,
            movesPP
        };
        if (isMega || isGmax) {
            // Añadir como forma secundaria
            if (!pokemons[base]) {
                // Si no existe el base, crear con datos mínimos
                pokemons[base] = {
                    id: base,
                    name: base,
                    types: [],
                    tamano: '',
                    statsDnD: {},
                    formas: []
                };
            }
            pokemons[base].formas = pokemons[base].formas || [];
            pokemons[base].formas.push(entry);
        } else {
            // Forma base
            pokemons[data.name] = { ...entry, formas: [] };
        }
    });
    // Devuelve como array
    return Object.values(pokemons);
}
