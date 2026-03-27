export const isElectron = () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) return true;
    return typeof window !== 'undefined' && window.navigator.userAgent.toLowerCase().includes('electron');
};

export const togglePerchanceView = (visible: boolean, url?: string) => {
    if (isElectron() && (window as any).electronAPI) {
        (window as any).electronAPI.togglePerchanceView(visible, url);
    }
};

export const loadPerchanceData = (data: any) => {
    if (isElectron() && (window as any).electronAPI) {
        (window as any).electronAPI.loadPerchanceData(data);
    }
};

export const getFullPerchanceData = async () => {
    if (isElectron() && (window as any).electronAPI) {
        return await (window as any).electronAPI.getFullPerchanceData();
    }
    return null;
};

export const windowControl = (action: 'minimize' | 'maximize' | 'close') => {
    if (isElectron() && (window as any).electronAPI) {
        (window as any).electronAPI.windowControl(action);
    }
};

export const triggerImport = (type: 'RESEARCH' | 'PERSONA' | 'BOOK') => {
    if (isElectron() && (window as any).electronAPI) {
        (window as any).electronAPI.triggerImport(type);
    }
};

export const onMenuImport = (callback: (data: { type: string, content: string, extension?: string, fileName?: string }) => void) => {
    if (isElectron() && (window as any).electronAPI) {
        return (window as any).electronAPI.onMenuImport(callback);
    }
    return () => {};
};

export const onTriggerImportMenu = (callback: () => void) => {
    if (isElectron() && (window as any).electronAPI) {
        return (window as any).electronAPI.onTriggerImportMenu(callback);
    }
    return () => {};
};

export const onPerchanceSync = (callback: (data: any) => void) => {
    if (isElectron() && (window as any).electronAPI) {
        return (window as any).electronAPI.onPerchanceSync(callback);
    }
    return () => {};
};

export const getStoreValue = async (key: string) => {
    if (isElectron() && (window as any).electronAPI) {
        return await (window as any).electronAPI.getStoreValue(key);
    }
    return localStorage.getItem(`storyspark-store-${key}`);
};

export const setStoreValue = async (key: string, value: any) => {
    if (isElectron() && (window as any).electronAPI) {
        await (window as any).electronAPI.setStoreValue(key, value);
    } else {
        localStorage.setItem(`storyspark-store-${key}`, value);
    }
};
