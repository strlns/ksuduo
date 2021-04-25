export const formatTime = (seconds: number) => {
    if (!seconds) return '';
    return seconds >= 60 ? `${Math.floor(seconds / 60)}min ${seconds % 60}s` : `${seconds}s`;
}