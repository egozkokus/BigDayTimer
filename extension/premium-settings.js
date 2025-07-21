document.addEventListener('DOMContentLoaded', () => {

    const backButton = document.getElementById('backButton');
    const uploadArea = document.getElementById('uploadArea');
    const bgUploadInput = document.getElementById('bgUpload');
    const uploadBtn = uploadArea.querySelector('.upload-btn');
    const uploadedImagesContainer = document.getElementById('uploadedImages');
  
    // Event Listeners
    backButton.addEventListener('click', () => window.close());
    uploadBtn.addEventListener('click', () => bgUploadInput.click());
    bgUploadInput.addEventListener('change', handleFileSelect);
  
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', handleFileDrop);
  
    // Functions
    function handleFileSelect(e) {
      const file = e.target.files[0];
      if (file) uploadFile(file);
    }
  
    function handleFileDrop(e) {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    }
  
    async function uploadFile(file) {
      if (!file.type.startsWith('image/')) {
        alert('יש לבחור קובץ תמונה.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB
        alert('הקובץ גדול מדי (מקסימום 2MB).');
        return;
      }
  
      const base64 = await fileToBase64(file);
      const backgroundId = `custom_${Date.now()}`;
      const backgroundData = { id: backgroundId, name: file.name, data: base64 };
  
      try {
        await chrome.storage.local.set({ [backgroundId]: backgroundData });
        renderImage(backgroundData);
      } catch (error) {
        console.error('Error saving custom background:', error);
        alert('שגיאה בשמירת הרקע.');
      }
    }
  
    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    }
  
    function renderImage(bgData) {
      const wrapper = document.createElement('div');
      wrapper.className = 'uploaded-image';
      wrapper.dataset.id = bgData.id;
  
      const img = document.createElement('img');
      img.src = bgData.data;
      img.alt = bgData.name;
  
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = 'מחק תמונה';
      removeBtn.addEventListener('click', async () => {
        await chrome.storage.local.remove(bgData.id);
        wrapper.remove();
      });
      
      wrapper.append(img, removeBtn);
      uploadedImagesContainer.prepend(wrapper);
    }
  
    async function loadInitialImages() {
      const items = await chrome.storage.local.get(null);
      for (const key in items) {
        if (key.startsWith('custom_')) {
          renderImage(items[key]);
        }
      }
    }
  
    // Load saved images on startup
    loadInitialImages();
  });