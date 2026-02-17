// Utilidad para obtener el nombre real de un movimiento a partir de su id
export function getMoveNameById(moveId) {
    if (!window.Moves) return moveId;
    // Normaliza el id (por si viene con mayúsculas o guiones)
    const key = moveId.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const k in window.Moves) {
        if (k === key && window.Moves[k].name) {
            return window.Moves[k].name;
        }
    }
    // Si no se encuentra, devuelve el id original
    return moveId;
}

// Hacer disponible en window para uso global
if (typeof window !== 'undefined') {
    window.getMoveNameById = getMoveNameById;
}
