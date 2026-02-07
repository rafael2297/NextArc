/**
 * Converte uma cor Hexadecimal (#000000) para RGBA.
 * Útil para aplicar opacidade em cores dinâmicas da Store.
 */
export const hexToRgba = (hex: string, opacity: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Calcula a luminância de uma cor e retorna a cor de contraste ideal (Preto ou Branco).
 * Evita que textos sumam em fundos muito claros ou muito escuros.
 */
export const getContrastColor = (hexColor: string): string => {
    if (!hexColor) return '#ffffff';

    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Fórmula de percepção de brilho (YIQ)
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    // Se for maior que 128 (meio termo), a cor é clara -> texto preto
    // Se for menor, a cor é escura -> texto branco
    return yiq >= 128 ? '#0a0a0a' : '#ffffff';
};

/**
 * Gera uma variação da cor (mais clara ou mais escura) para bordas.
 */
export const getBorderColor = (hexColor: string, opacity: number = 0.1): string => {
    const contrast = getContrastColor(hexColor);
    // Se o fundo for claro, a borda é preta translúcida. Se escuro, branca translúcida.
    return contrast === '#0a0a0a'
        ? `rgba(0, 0, 0, ${opacity})`
        : `rgba(255, 255, 255, ${opacity})`;
};