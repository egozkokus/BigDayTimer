class BigDayTimerBackground {
  constructor() {
    this.init();
  }
  
  init() {
    this.setupInstallListener();
    this.setupStorageListener();
    this.setupAlarms();
    this.setupNotifications();
  }
  
  setupInstallListener() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.onFirstInstall();
      } else if (details.reason === 'update') {
        this.onUpdate(details.previousVersion);
      }
    });
  }
  
  async onFirstInstall() {
    console.log('BigDayTimer: First installation');
    
    // Set default settings
    await chrome.storage.sync.set({
      isPremium: false,
      userId: this.generateUserId(),
      timers: [],
      settings: {
        notifications: true,
        position: { x: 20, y: 20 }
      }
    });
    
    // Open welcome page or popup
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup.html')
    });
  }
  
  async onUpdate(previousVersion) {
    console.log(`BigDayTimer: Updated from ${previousVersion}`);
    
    // Handle version-specific migrations here
    const currentVersion = chrome.runtime.getManifest().version;
    
    if (this.isVersionLowerThan(previousVersion, '1.0.0')) {
      await this.migrateToV1();
    }
  }
  
  generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
  }
  
  isVersionLowerThan(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part < v2part) return true;
      if (v1part > v2part) return false;
    }
    
    return false;
  }
  
  async migrateToV1() {
    console.log('Migrating to v1.0.0');
    // Add migration logic here
  }
  
  setupStorageListener() {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        if (changes.timers) {
          this.onTimersChanged(changes.timers);
        }
        
        if (changes.isPremium) {
          this.onPremiumStatusChanged(changes.isPremium);
        }
      }
    });
  }
  
  onTimersChanged(change) {
    const newTimers = change.newValue || [];
    const oldTimers = change.oldValue || [];
    
    // Update alarms for timers
    this.updateTimerAlarms(newTimers);
    
    // Check if any timers are approaching
    this.checkApproachingTimers(newTimers);
  }
  
  onPremiumStatusChanged(change) {
    const isPremium = change.newValue;
    console.log('Premium status changed:', isPremium);
    
    if (isPremium) {
      this.onPremiumActivated();
    }
  }
  
  async onPremiumActivated() {
    // Show premium welcome notification
    if (await this.areNotificationsEnabled()) {
      chrome.notifications.create('premium-welcome', {
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'BigDayTimer Premium',
        message: 'Welcome to Premium! You can now enjoy all advanced features.'
      });
    }
  }
  
  setupAlarms() {
    // הוסף בדיקה לפני השימוש
    if (!chrome.alarms) {
      console.warn('Chrome alarms API not available');
      return;
    }
    
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });
  }
  
  async updateTimerAlarms(timers) {
    // Clear all existing timer alarms
    const alarms = await chrome.alarms.getAll();
    for (const alarm of alarms) {
      if (alarm.name.startsWith('timer_')) {
        chrome.alarms.clear(alarm.name);
      }
    }
    
    // Create new alarms for active timers
    for (const timer of timers) {
      const targetDate = new Date(timer.targetDate);
      const now = new Date();
      
      if (targetDate > now) {
        // Set alarm for 1 day before
        const oneDayBefore = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000);
        if (oneDayBefore > now) {
          chrome.alarms.create(`timer_${timer.id}_1day`, {
            when: oneDayBefore.getTime()
          });
        }
        
        // Set alarm for 1 hour before
        const oneHourBefore = new Date(targetDate.getTime() - 60 * 60 * 1000);
        if (oneHourBefore > now) {
          chrome.alarms.create(`timer_${timer.id}_1hour`, {
            when: oneHourBefore.getTime()
          });
        }
        
        // Set alarm for the event time
        chrome.alarms.create(`timer_${timer.id}_event`, {
          when: targetDate.getTime()
        });
      }
    }
  }
  
  async handleAlarm(alarm) {
    const [, timerId, period] = alarm.name.split('_');
    
    if (!timerId || !period) return;
    
    const result = await chrome.storage.sync.get(['timers']);
    const timers = result.timers || [];
    const timer = timers.find(t => t.id === timerId);
    
    if (!timer) return;
    
    let message = '';
    let timeLeft = '';
    
    switch (period) {
      case '1day':
        message = `One day left until ${timer.name}!`;
        timeLeft = 'One day';
        break;
      case '1hour':
        message = `One hour left until ${timer.name}!`;
        timeLeft = 'One hour';
        break;
      case 'event':
        message = `${timer.name} - The event has arrived!`;
        timeLeft = 'Now';
        break;
    }
    
    await this.showNotification(timer, message, timeLeft);
  }
  
  async showNotification(timer, message, timeLeft) {
    if (!(await this.areNotificationsEnabled())) return;
    
    chrome.notifications.create(`timer_${timer.id}`, {
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'BigDayTimer',
      message: message,
      contextMessage: timeLeft
    });
  }
  
  async areNotificationsEnabled() {
    const result = await chrome.storage.sync.get(['settings']);
    return result.settings?.notifications !== false;
  }
  
  setupNotifications() {
    if (chrome.notifications) {
      chrome.notifications.onClicked.addListener((notificationId) => {
        this.onNotificationClicked(notificationId);
      });
      
      chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
        this.onNotificationButtonClicked(notificationId, buttonIndex);
      });
    }
  }
  
  async onNotificationClicked(notificationId) {
    // Open popup or focus on timer
    chrome.action.openPopup();
    
    // Clear the notification
    chrome.notifications.clear(notificationId);
  }
  
  async onNotificationButtonClicked(notificationId, buttonIndex) {
    // Handle notification button actions
    chrome.notifications.clear(notificationId);
  }
  
  async checkApproachingTimers(timers) {
    const now = new Date().getTime();
    
    for (const timer of timers) {
      const timeLeft = timer.targetDate - now;
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      
      // Special notifications for milestones
      if (days === 7 || days === 30 || days === 100) {
        const message = `${days} days left until ${timer.name}!`;
        await this.showNotification(timer, message, `${days} days`);
      }
    }
  }
}

// Message handling for popup and content script communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPremiumStatus') {
    getPremiumStatus().then(sendResponse);
    return true; // Indicates async response
  }
  
  if (request.action === 'checkPremiumStatus') {
    checkPremiumStatusWithBackend(request.userId).then(sendResponse);
    return true;
  }
});

async function getPremiumStatus() {
  const result = await chrome.storage.sync.get(['isPremium']);
  return { isPremium: result.isPremium || false };
}

async function checkPremiumStatusWithBackend(userId) {
  try {
    const response = await fetch(`https://bigdaytimer.com/premium-status/${userId}`);
    
    if (response.ok) {
      const data = await response.json();
      
      // Update local storage if status changed
      if (data.isPremium) {
        await chrome.storage.sync.set({ isPremium: true });
      }
      
      return { isPremium: data.isPremium };
    }
  } catch (error) {
    console.error('Error checking premium status:', error);
  }
  
  // Fallback to local storage
  return getPremiumStatus();
}

// Initialize the background service
new BigDayTimerBackground();