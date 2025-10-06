export const norm = (s) =>
    (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // знімаємо діакритику

export const firstKey = (s) => {
    const n = norm(s).trim();
    if (!n) return '#';
    const ch = n[0].toUpperCase();
    return /[A-Z]/.test(ch) ? ch : '#';
};

export const buildIndexMap = (arr, getLabel = (x) => x?.groupName) => {
    const map = new Map();
    for (const item of arr || []) {
        const k = firstKey(getLabel(item));
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(item);
    }
    // впорядковуємо A-Z, потім '#'
    const keys = [...map.keys()]
        .filter(k => k !== '#')
        .sort()
        .concat(map.has('#') ? ['#'] : []);
    return { map, keys };
};
