const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    togglePerchanceView: (visible, url) => ipcRenderer.send('toggle-perchance-view', visible, url),
    loadPerchanceData: (data) => ipcRenderer.send('load-perchance-data', data),
    getFullPerchanceData: () => ipcRenderer.invoke('get-full-perchance-data'),
    isElectron: true,
    
    // Window Controls
    windowControl: (action) => ipcRenderer.send('window-control', action),
    
    // Menu triggers
    triggerImport: (type) => ipcRenderer.send('trigger-import', type),
    onMenuImport: (callback) => {
        const listener = (event, data) => callback(data);
        ipcRenderer.on('menu-import-file', listener);
        return () => ipcRenderer.removeListener('menu-import-file', listener);
    },
    onTriggerImportMenu: (callback) => {
        const listener = () => callback();
        ipcRenderer.on('trigger-import-menu', listener);
        return () => ipcRenderer.removeListener('trigger-import-menu', listener);
    },
    
    // Perchance Sync
    onPerchanceSync: (callback) => {
        const listener = (event, data) => callback(data);
        ipcRenderer.on('perchance-sync-data', listener);
        return () => ipcRenderer.removeListener('perchance-sync-data', listener);
    },
    
    // Persistence
    getStoreValue: (key) => ipcRenderer.invoke('get-store-value', key),
    setStoreValue: (key, value) => ipcRenderer.invoke('set-store-value', key, value),
});
