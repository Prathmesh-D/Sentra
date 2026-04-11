const { contextBridge, ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', () => {})

contextBridge.exposeInMainWorld('electronAPI', {
	onAuthClear: (callback) => {
		if (typeof callback === 'function') {
			ipcRenderer.on('auth-clear', callback)
		}
	},
	removeAllListeners: (event) => {
		ipcRenderer.removeAllListeners(event)
	},
})