import { app, BrowserWindow, WebContentsView, ipcMain, Menu, dialog, shell } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Store from 'electron-store';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const store = new Store();
let mainWindow = null;
let perchanceView = null;
const TOP_BAR_HEIGHT = 112;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false, // Custom title bar
        titleBarStyle: 'hidden',
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: 'StorySpark Desktop',
        icon: path.join(__dirname, '../storyspark.png')
    });
    const isDev = !app.isPackaged;
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
    }
    else {
        const indexPath = path.join(app.getAppPath(), 'dist/index.html');
        mainWindow.loadFile(indexPath);
    }
    createMenu();
    mainWindow.on('closed', () => {
        mainWindow = null;
        perchanceView = null;
    });
}
function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Import Research (.ssrf)',
                    click: () => importFile('RESEARCH', ['ssrf'])
                },
                {
                    label: 'Import Persona (.sspf)',
                    click: () => importFile('PERSONA', ['sspf'])
                },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'StorySpark Web',
                    click: () => shell.openExternal('https://storyspark.ai')
                }
            ]
        }
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}
async function importFile(type, extensions) {
    if (!mainWindow)
        return;
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'StorySpark Files', extensions }]
    });
    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const ext = path.extname(filePath).toLowerCase();
        try {
            if (ext === '.pdf' || ext === '.docx') {
                const content = fs.readFileSync(filePath);
                mainWindow.webContents.send('menu-import-file', { type, content, extension: ext, fileName: path.basename(filePath) });
            }
            else {
                const content = fs.readFileSync(filePath, 'utf-8');
                mainWindow.webContents.send('menu-import-file', { type, content, extension: ext, fileName: path.basename(filePath) });
            }
        }
        catch (err) {
            console.error('Failed to read file:', err);
        }
    }
}
function updateViewBounds() {
    if (!mainWindow || !perchanceView)
        return;
    const bounds = mainWindow.getContentBounds();
    perchanceView.setBounds({
        x: 0,
        y: TOP_BAR_HEIGHT,
        width: bounds.width,
        height: bounds.height - TOP_BAR_HEIGHT,
    });
}
ipcMain.on('window-control', (event, action) => {
    if (!mainWindow)
        return;
    if (action === 'minimize')
        mainWindow.minimize();
    if (action === 'maximize') {
        if (mainWindow.isMaximized())
            mainWindow.unmaximize();
        else
            mainWindow.maximize();
    }
    if (action === 'close')
        mainWindow.close();
});
ipcMain.on('trigger-import', (event, type) => {
    let extensions = [];
    if (type === 'RESEARCH')
        extensions = ['ssrf'];
    else if (type === 'PERSONA')
        extensions = ['sspf'];
    else if (type === 'BOOK')
        extensions = ['ssbf', 'pdf', 'docx', 'txt', 'md'];
    importFile(type, extensions);
});
// Sync Perchance data (LocalStorage + Cookies)
async function getFullPerchanceData() {
    if (!perchanceView)
        return null;
    try {
        const localStorage = await perchanceView.webContents.executeJavaScript(`
            (function() {
                const items = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    items[key] = localStorage.getItem(key);
                }
                return items;
            })()
        `);
        const cookies = await perchanceView.webContents.session.cookies.get({ url: 'https://perchance.org' });
        return { localStorage, cookies };
    }
    catch (err) {
        console.error('Failed to extract perchance data:', err);
        return null;
    }
}
ipcMain.handle('get-full-perchance-data', async () => {
    return await getFullPerchanceData();
});
ipcMain.on('load-perchance-data', async (event, data) => {
    if (!perchanceView || !data)
        return;
    // 1. Inject Cookies immediately (they don't need the page to be loaded)
    if (data.cookies && Array.isArray(data.cookies)) {
        for (const cookie of data.cookies) {
            const { name, value, domain, path, secure, httpOnly, expirationDate } = cookie;
            try {
                await perchanceView.webContents.session.cookies.set({
                    url: 'https://perchance.org',
                    name,
                    value,
                    domain: domain.startsWith('.') ? domain : `.${domain}`,
                    path,
                    secure,
                    httpOnly,
                    expirationDate
                });
            }
            catch (e) {
                // Ignore individual cookie errors
            }
        }
    }
    // 2. Inject LocalStorage once the page is ready
    const injectStorage = () => {
        if (!perchanceView || !data.localStorage)
            return;
        const script = `
            (function() {
                const storageData = ${JSON.stringify(data.localStorage)};
                for (const key in storageData) {
                    localStorage.setItem(key, storageData[key]);
                }
                console.log('StorySpark: LocalStorage Injected');
            })()
        `;
        perchanceView.webContents.executeJavaScript(script).catch(console.error);
    };
    if (perchanceView.webContents.isLoading()) {
        perchanceView.webContents.once('did-finish-load', injectStorage);
    }
    else {
        injectStorage();
    }
});
ipcMain.on('toggle-perchance-view', (event, visible, url) => {
    if (!mainWindow)
        return;
    if (visible) {
        if (!perchanceView) {
            perchanceView = new WebContentsView();
            perchanceView.webContents.setWindowOpenHandler(({ url }) => {
                if (url.startsWith('https://www.perchance.org') || url.startsWith('https://perchance.org')) {
                    return { action: 'allow' };
                }
                shell.openExternal(url);
                return { action: 'deny' };
            });
        }
        if (url) {
            perchanceView.webContents.loadURL(url);
        }
        else if (!perchanceView.webContents.getURL()) {
            perchanceView.webContents.loadURL('https://perchance.org/storyspark-ai-story');
        }
        mainWindow.contentView.addChildView(perchanceView);
        updateViewBounds();
        mainWindow.on('resize', updateViewBounds);
    }
    else {
        if (perchanceView) {
            mainWindow.contentView.removeChildView(perchanceView);
            mainWindow.off('resize', updateViewBounds);
            perchanceView.webContents.destroy();
            perchanceView = null;
        }
    }
});
// Persistence using electron-store
ipcMain.handle('get-store-value', (event, key) => {
    return store.get(key);
});
ipcMain.handle('set-store-value', (event, key, value) => {
    store.set(key, value);
});
app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
