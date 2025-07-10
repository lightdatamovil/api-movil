export function parseIfJson(str) {
    try {
        const parsed = JSON.parse(str);
        return typeof parsed === 'object' && parsed !== null ? parsed : str;
        // eslint-disable-next-line no-unused-vars
    } catch (e) {
        return str;
    }
}
