class BigDayTimerPopup {
  constructor() {
    this.isPremium = false;
    this.init();

    // Check premium status to display advanced settings link
    if (this.isPremium) {
      document.getElementById('premiumBannerContainer').style.display = 'none';
    }

    document.getElementById('openAdvancedSettings')?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'settings.html' });
    });
  }
  
  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.loadActiveTimers();
    this.updateUI();
  }
  
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['isPremium', 'userId']);
      this.isPremium = result.isPremium || false;
      this.userId = result.userId || this.generateUserId();
      
      if (!result.userId) {
        await chrome.storage.sync.set({ userId: this.userId });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  generateUserId() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return 'user_' + Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  setupEventListeners() {
    document.getElementById('saveTimer').addEventListener('click', () => this.saveTimer());
    document.getElementById('upgradeToPremium').addEventListener('click', () => this.upgradeToPremium());
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('eventDate').value = today;
    document.getElementById('openPremiumSettings').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'premium-settings.html' });
    });
  }
  
  async saveTimer() {
    const eventName = document.getElementById('eventName').value.trim();
    const eventDate = document.getElementById('eventDate').value;
    const eventTime = document.getElementById('eventTime').value;
    const textColor = document.getElementById('textColor').value;
    const backgroundColor = document.getElementById('backgroundColor').value;
    
    if (!eventName || !eventDate) {
      alert('Please fill in the event name and date');
      return;
    }
    
    const eventDateTime = new Date(`${eventDate}T${eventTime}`);
    if (eventDateTime <= new Date()) {
      alert('The date must be in the future');
      return;
    }
    
    const timer = {
      id: 'timer_' + Date.now(),
      name: eventName,
      targetDate: eventDateTime.getTime(),
      textColor: textColor,
      backgroundColor: backgroundColor, // Using background color instead of image
      created: Date.now()
    };
    
    try {
      let timers = [];
      if (this.isPremium) {
        const result = await chrome.storage.sync.get(['timers']);
        timers = result.timers || [];
      }
      
      timers.unshift(timer);
      
      if (!this.isPremium && timers.length > 1) {
        timers = [timer];
      }
      
      await chrome.storage.sync.set({ timers });
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { 
                action: 'refreshTimers' 
            }, (response) => {
                if (chrome.runtime.lastError) {
                console.log('No content script in current tab - this is normal');
                }
            });
        }
      });
      
      this.loadActiveTimers();
      this.clearForm();
      
    } catch (error) {
      console.error('Error saving timer:', error);
      alert('Error saving timer');
    }
  }
  
  async loadActiveTimers() {
    try {
      const result = await chrome.storage.sync.get(['timers']);
      const timers = result.timers || [];
      
      const timerListEl = document.getElementById('timerList');
      const container = document.getElementById('timerListContainer');
      timerListEl.innerHTML = '';
      
      if (timers.length === 0) {
        container.style.display = 'none';
        return;
      }
      
      container.style.display = 'block';
      
      timers.forEach(timer => {
        const timerItem = document.createElement('div');
        timerItem.className = 'timer-item';
        
        const timeLeft = this.calculateTimeLeft(timer.targetDate);
        timerItem.innerHTML = `
          <div>
            <strong>${timer.name}</strong><br>
            <small>${timeLeft}</small>
          </div>
          <button class="delete-timer" data-timer-id="${timer.id}">Delete</button>
        `;
        
        timerItem.querySelector('.delete-timer').addEventListener('click', () => {
          this.deleteTimer(timer.id);
        });
        
        timerListEl.appendChild(timerItem);
      });
    } catch (error) {
      console.error('Error loading timers:', error);
    }
  }
  
  calculateTimeLeft(targetDate) {
    const difference = targetDate - new Date().getTime();
    if (difference < 0) return 'Event has passed';
    
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d, ${hours}h, ${minutes}m`;
  }
  
  async deleteTimer(timerId) {
    try {
      const result = await chrome.storage.sync.get(['timers']);
      let timers = (result.timers || []).filter(timer => timer.id !== timerId);
      await chrome.storage.sync.set({ timers });
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshTimers' }, response => {
                if (chrome.runtime.lastError) console.log('No content script in current tab');
            });
          }
      });
      
      this.loadActiveTimers();
    } catch (error) {
      console.error('Error deleting timer:', error);
    }
  }
  
  clearForm() {
    document.getElementById('eventName').value = '';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('eventDate').value = today;
    document.getElementById('eventTime').value = '18:00';
  }
  
  updateUI() {
    const premiumContainer = document.getElementById('premiumBannerContainer');
    if (this.isPremium) {
      premiumContainer.style.display = 'none';
    } else {
      premiumContainer.style.display = 'block';
    }
    const premiumSettingsLink = document.getElementById('premiumSettingsLinkContainer');
    if (this.isPremium) {
      premiumSettingsLink.style.display = 'block';
    } else {
      premiumSettingsLink.style.display = 'none';
    }
  }

  async upgradeToPremium() {
    // This logic remains the same
    try {
      const response = await fetch('https://bigdaytimer.com/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId, plan: 'premium' })
      });
      
      if (response.ok) {
        const data = await response.json();
        window.open(data.checkoutUrl, '_blank');
        this.pollPaymentStatus();
      } else {
        throw new Error('Failed to create checkout');
      }
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      if (confirm('Upgrade to Premium? (Development mode)')) {
        await chrome.storage.sync.set({ isPremium: true });
        this.isPremium = true;
        this.updateUI();
        alert('Successfully upgraded to Premium!');
      }
    }
  }
  
  async pollPaymentStatus() {
    // This logic remains the same
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BigDayTimerPopup();
});