document.addEventListener('DOMContentLoaded', () => {
    const settings = new AdvancedSettings();
    settings.init();
});

class AdvancedSettings {
    constructor() {
        // הגדרת משתנים לרכיבי ה-DOM
        this.uploadArea = document.getElementById('uploadArea');
        this.bgUploadInput = document.getElementById('bgUpload');
        this.uploadBtn = this.uploadArea.querySelector('.upload-btn');
        this.uploadedImagesContainer = document.getElementById('uploadedImages');
        
        this.enableAnimationsToggle = document.getElementById('enableAnimations');
        this.enableParticlesToggle = document.getElementById('enableParticles');
        this.enableNotificationsToggle = document.getElementById('enableNotifications');
        this.enableSoundsToggle = document.getElementById('enableSounds');
    }

    async init() {
        this.setupEventListeners();
        await this.loadSettings();
        await this.loadCustomBackgrounds();
    }

    setupEventListeners() {
        // מאזינים לאירועי העלאת תמונה
        this.uploadBtn.addEventListener('click', () => this.bgUploadInput.click());
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });
        this.uploadArea.addEventListener('dragleave', () => this.uploadArea.classList.remove('drag-over'));
        this.uploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
        this.bgUploadInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // מאזינים לשינויים בהגדרות
        this.enableAnimationsToggle.addEventListener('change', () => this.saveSetting('animations', this.enableAnimationsToggle.checked));
        this.enableParticlesToggle.addEventListener('change', () => this.saveSetting('particles', this.enableParticlesToggle.checked));
        this.enableNotificationsToggle.addEventListener('change', () => this.saveSetting('notifications', this.enableNotificationsToggle.checked));
        this.enableSoundsToggle.addEventListener('change', () => this.saveSetting('sounds', this.enableSoundsToggle.checked));
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get(['settings']);
            const settings = result.settings || {};
            
            // טעינת ההגדרות השמורות
            this.enableAnimationsToggle.checked = settings.animations ?? true;
            this.enableParticlesToggle.checked = settings.particles ?? false;
            this.enableNotificationsToggle.checked = settings.notifications ?? true;
            this.enableSoundsToggle.checked = settings.sounds ?? false;

        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    async saveSetting(key, value) {
        try {
            const result = await chrome.storage.sync.get(['settings']);
            const settings = result.settings || {};
            settings[key] = value;
            await chrome.storage.sync.set({ settings });
        } catch (error) {
            console.error(`Error saving setting ${key}:`, error);
        }
    }

    handleFileDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.uploadFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.uploadFile(files[0]);
        }
    }

    async uploadFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('יש לבחור קובץ תמונה בלבד.');
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            alert('הקובץ גדול מדי. הגודל המקסימלי הוא 2MB.');
            return;
        }

        try {
            const base64 = await this.fileToBase64(file);
            const backgroundId = `custom_${Date.now()}`;
            
            // שמירת התמונה באחסון
            await chrome.storage.local.set({ [backgroundId]: { id: backgroundId, data: base64, name: file.name } });
            
            this.renderCustomBackground(backgroundId, base64, file.name);

        } catch (error) {
            console.error('Error uploading custom background:', error);
            alert('אירעה שגיאה בעת העלאת התמונה.');
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    async loadCustomBackgrounds() {
        try {
            const items = await chrome.storage.local.get(null);
            this.uploadedImagesContainer.innerHTML = ''; // ניקוי התצוגה
            for (const [key, value] of Object.entries(items)) {
                if (key.startsWith('custom_')) {
                    this.renderCustomBackground(key, value.data, value.name);
                }
            }
        } catch (error) {
            console.error('Error loading custom backgrounds:', error);
        }
    }

    renderCustomBackground(id, data, name) {
        const imgWrapper = document.createElement('div');
        imgWrapper.className = 'uploaded-image';
        imgWrapper.dataset.id = id;
        
        const img = document.createElement('img');
        img.src = data;
        img.alt = name;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'הסר תמונה';
        removeBtn.addEventListener('click', () => this.removeCustomBackground(id));
        
        imgWrapper.append(img, removeBtn);
        this.uploadedImagesContainer.appendChild(imgWrapper);
    }

    async removeCustomBackground(id) {
        if (!confirm('האם אתה בטוח שברצונך למחוק את הרקע?')) return;
        
        try {
            await chrome.storage.local.remove(id);
            document.querySelector(`.uploaded-image[data-id="${id}"]`).remove();
        } catch (error) {
            console.error('Error removing custom background:', error);
        }
    }
}