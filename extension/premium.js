class PremiumManager {
  constructor() {
    this.apiBase = 'https://bigdaytimer.com';
    this.userId = null;
    this.isPremium = false;
    
    this.init();
  }
  
  async init() {
    await this.loadUserData();
    await this.verifyPremiumStatus();
  }
  
  async loadUserData() {
    try {
      const result = await chrome.storage.sync.get(['userId', 'isPremium']);
      this.userId = result.userId || this.generateUserId();
      this.isPremium = result.isPremium || false;
      
      // Save userId if it was generated
      if (!result.userId) {
        await chrome.storage.sync.set({ userId: this.userId });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }
  
  generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 16) + '_' + Date.now();
  }
  
  async verifyPremiumStatus() {
    if (!this.userId) return;
    
    try {
      const response = await fetch(`${this.apiBase}/premium-status/${this.userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const serverPremium = data.isPremium || false;
        
        // Update local status if different from server
        if (serverPremium !== this.isPremium) {
          this.isPremium = serverPremium;
          await chrome.storage.sync.set({ isPremium: serverPremium });
          
          // Notify other parts of the extension
          this.notifyPremiumStatusChange(serverPremium);
        }
      }
    } catch (error) {
      console.error('Error verifying premium status:', error);
      // Continue with local status on network error
    }
  }
  
  async purchasePremium() {
    if (this.isPremium) {
      throw new Error('User is already premium');
    }
    
    try {
      const response = await fetch(`${this.apiBase}/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.userId,
          plan: 'premium',
          returnUrl: chrome.runtime.getURL('popup.html'),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }
      
      const data = await response.json();
      return data.checkoutUrl;
      
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  }
  
  async pollPaymentStatus(maxAttempts = 36, intervalMs = 5000) {
    let attempts = 0;
    
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          attempts++;
          
          const response = await fetch(`${this.apiBase}/payment-status/${this.userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.isPremium) {
              this.isPremium = true;
              await chrome.storage.sync.set({ isPremium: true });
              this.notifyPremiumStatusChange(true);
              resolve(true);
              return;
            }
          }
          
          if (attempts >= maxAttempts) {
            reject(new Error('Payment verification timeout'));
            return;
          }
          
          setTimeout(checkStatus, intervalMs);
          
        } catch (error) {
          if (attempts >= maxAttempts) {
            reject(error);
          } else {
            setTimeout(checkStatus, intervalMs);
          }
        }
      };
      
      // Start checking after a short delay
      setTimeout(checkStatus, 2000);
    });
  }
  
  notifyPremiumStatusChange(isPremium) {
    // Notify popup if open
    chrome.runtime.sendMessage({
      action: 'premiumStatusChanged',
      isPremium: isPremium
    }).catch(() => {
      // Ignore errors if popup is not open
    });
    
    // Notify content scripts
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'premiumStatusChanged',
          isPremium: isPremium
        }).catch(() => {
          // Ignore errors for tabs that don't have our content script
        });
      });
    });
  }
  
  async canUseFeature(feature) {
    await this.verifyPremiumStatus();
    
    const premiumFeatures = [
      'multipleTimers',
      'customBackgrounds',
      'advancedCustomization',
      'noAds',
      'premiumBackgrounds'
    ];
    
    if (premiumFeatures.includes(feature)) {
      return this.isPremium;
    }
    
    return true; // Free features
  }
  
  async getTimerLimit() {
    return this.isPremium ? 10 : 1; // Premium: 10 timers, Free: 1 timer
  }
  
  async canUploadCustomBackground() {
    return this.isPremium;
  }
  
  async getAvailableBackgrounds() {
    const freeBackgrounds = [
      'wedding', 'beach', 'mountains', 'city',
      'sunset', 'flowers', 'space', 'forest'
    ];
    
    if (!this.isPremium) {
      return freeBackgrounds;
    }
    
    // Premium users get additional backgrounds
    const premiumBackgrounds = [
      'gradient1', 'gradient2', 'gradient3',
      'texture1', 'texture2', 'nature1',
      'nature2', 'abstract1', 'abstract2'
    ];
    
    return [...freeBackgrounds, ...premiumBackgrounds];
  }
  
  // Development/testing helpers
  async simulatePremiumPurchase() {
    if (process.env.NODE_ENV === 'development') {
      this.isPremium = true;
      await chrome.storage.sync.set({ isPremium: true });
      this.notifyPremiumStatusChange(true);
      return true;
    }
    throw new Error('Simulation only available in development mode');
  }
  
  async resetPremiumStatus() {
    if (process.env.NODE_ENV === 'development') {
      this.isPremium = false;
      await chrome.storage.sync.set({ isPremium: false });
      this.notifyPremiumStatusChange(false);
      return true;
    }
    throw new Error('Reset only available in development mode');
  }
}

// Singleton instance
let premiumManager = null;

// Factory function to get the premium manager instance
function getPremiumManager() {
  if (!premiumManager) {
    premiumManager = new PremiumManager();
  }
  return premiumManager;
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PremiumManager, getPremiumManager };
} else if (typeof window !== 'undefined') {
  window.PremiumManager = PremiumManager;
  window.getPremiumManager = getPremiumManager;
}