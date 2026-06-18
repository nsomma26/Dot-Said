function requireData(key) {
    const data = window.SESTOSENS_DATA?.[key];
    if (!data) {
        throw new Error(`Dati mancanti: ${key}. Controlla che data/${key}.js sia caricato prima del bundle.`);
    }
    return data;
}

export function getConfig() {
    return requireData('config');
}

export function getCopy() {
    return requireData('copy');
}

export function getEmotions() {
    return requireData('emotions');
}
