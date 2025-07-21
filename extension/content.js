class BigDayTimerDisplay {
  constructor() {
    // מונע מהתוסף לרוץ על דפים פנימיים של עצמו
    if (window.location.href.startsWith('chrome-extension://')) {
      return;
    }

    this.overlay = null;
    this.timers = [];
    this.currentTimerIndex = 0;
    this.isMinimized = false;
    this.isDragging = false;
    this.updateInterval = null;
    this.dragOffset = { x: 0, y: 0 };
    
    this.init();
  }

  async init() {
    try {
      await this.loadTimers();
      this.setupMessageListener();
      if (this.timers.length > 0) {
        this.createOverlay();
        this.startUpdateLoop();
      }
    } catch (error) {
      console.error('BigDayTimer: Error initializing timer display', error);
    }
  }

  async loadTimers() {
    try {
      const result = await chrome.storage.sync.get(['timers']);
      this.timers = (result.timers || []).filter(timer => new Date(timer.targetDate).getTime() > Date.now());
      if (result.timers && result.timers.length !== this.timers.length) {
        await chrome.storage.sync.set({ timers: this.timers });
      }
    } catch (error) {
      console.error('BigDayTimer: Error loading timers', error);
      this.timers = [];
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'refreshTimers') {
        this.refreshTimers();
        sendResponse({ success: true });
      }
      return true;
    });
  }

  async refreshTimers() {
    await this.loadTimers();
    if (this.timers.length === 0 && this.overlay) {
      this.removeOverlay();
    } else if (this.overlay) {
      this.currentTimerIndex = Math.min(this.currentTimerIndex, this.timers.length - 1);
      this.updateDisplay();
    } else if (this.timers.length > 0) {
      this.createOverlay();
      this.startUpdateLoop();
    }
  }

  createOverlay() {
    if (this.overlay) this.removeOverlay();
    this.overlay = document.createElement('div');
    this.overlay.id = 'bigdaytimerOverlay';
    this.buildOverlayContent();
    document.body.appendChild(this.overlay);
    this.setupEventListeners();
    this.updateDisplay();
    this.restorePosition();
  }

  buildOverlayContent() {
    const background = document.createElement('div');
    background.className = 'timer-background';

    const content = document.createElement('div');
    content.className = 'timer-content';

    const header = this.createHeader();
    const title = document.createElement('div');
    title.className = 'timer-title';
    const display = this.createTimerDisplay();
    const multiTimerNav = this.createMultiTimerNavigation();

    content.append(header, title, display, multiTimerNav);
    this.overlay.append(background, content);
  }

  createHeader() {
    const header = document.createElement('div');
    header.className = 'timer-header';
    const minimizeButton = document.createElement('button');
    minimizeButton.className = 'minimize-button';
    minimizeButton.textContent = '−';
    header.appendChild(minimizeButton);
    return header;
  }

  createTimerDisplay() {
    const display = document.createElement('div');
    display.className = 'timer-display';
    const units = ['Seconds', 'Minutes', 'Hours', 'Days'];
    units.forEach(unit => {
      const unitDiv = document.createElement('div');
      unitDiv.className = 'timer-unit';
      const number = document.createElement('div');
      number.className = `timer-number ${unit.toLowerCase()}`;
      number.textContent = '0';
      const label = document.createElement('div');
      label.className = 'timer-label';
      label.textContent = unit;
      unitDiv.append(number, label);
      display.appendChild(unitDiv);
    });
    return display;
  }

  createMultiTimerNavigation() {
    const navContainer = document.createElement('div');
    navContainer.className = 'multiple-timers';
    navContainer.style.display = 'none';

    const navigation = document.createElement('div');
    navigation.className = 'timer-navigation';

    const prevButton = document.createElement('button');
    prevButton.className = 'timer-nav-button prev';
    prevButton.textContent = '‹';

    const selector = document.createElement('div');
    selector.className = 'timer-selector';

    const nextButton = document.createElement('button');
    nextButton.className = 'timer-nav-button next';
    nextButton.textContent = '›';
    
    navigation.append(prevButton, selector, nextButton);
    navContainer.appendChild(navigation);
    return navContainer;
  }

  setupEventListeners() {
    if (!this.overlay) return;

    this.overlay.querySelector('.minimize-button').addEventListener('click', () => this.toggleMinimize());
    this.overlay.querySelector('.prev').addEventListener('click', () => this.previousTimer());
    this.overlay.querySelector('.next').addEventListener('click', () => this.nextTimer());
    
    // Dragging
    this.overlay.addEventListener('mousedown', this.startDrag.bind(this));
    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.stopDrag.bind(this));
  }

  updateDisplay() {
    if (!this.overlay || this.timers.length === 0) return;
    const currentTimer = this.timers[this.currentTimerIndex];
    if (!currentTimer) return;

    this.overlay.querySelector('.timer-title').textContent = currentTimer.name;
    const backgroundElement = this.overlay.querySelector('.timer-background');
    // Check for custom background first
    if (currentTimer.background && currentTimer.background.startsWith('custom_')) {
      chrome.storage.local.get(currentTimer.background, (result) => {
        if (result[currentTimer.background]) {
          backgroundElement.style.backgroundImage = `url('${result[currentTimer.background].data}')`;
          backgroundElement.style.backgroundColor = ''; // Clear color if image exists
        }
      });
    } 
    // Then, check for background color
    else if (currentTimer.backgroundColor) {
        backgroundElement.style.backgroundImage = 'none';
        backgroundElement.style.backgroundColor = currentTimer.backgroundColor;
    } 
    // Fallback to default
    else {
        backgroundElement.style.backgroundColor = '#667eea'; // Default color
        backgroundElement.style.backgroundImage = 'none';
    }

    if (currentTimer.textColor) {
      this.overlay.style.color = currentTimer.textColor;
    }

    if (currentTimer.backgroundColor) {
        backgroundElement.style.backgroundImage = 'none';
        backgroundElement.style.backgroundColor = currentTimer.backgroundColor;
    }

    if (currentTimer.textColor) {
      this.overlay.style.color = currentTimer.textColor;
    }

    const timeLeft = this.calculateTimeLeft(currentTimer.targetDate);
    if (timeLeft.expired) {
      this.displayExpiredTimer();
    } else {
      this.displayActiveTimer(timeLeft);
    }

    this.updateMultipleTimersUI();
  }

  calculateTimeLeft(targetDate) {
    const difference = new Date(targetDate).getTime() - Date.now();
    if (difference < 0) return { expired: true };
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false,
    };
  }
  
  displayActiveTimer(timeLeft) {
    if (this.overlay.classList.contains('timer-expired')) {
      this.overlay.querySelector('.timer-display').replaceWith(this.createTimerDisplay());
      this.overlay.classList.remove('timer-expired');
    }
    this.updateNumberWithAnimation('days', timeLeft.days);
    this.updateNumberWithAnimation('hours', timeLeft.hours);
    this.updateNumberWithAnimation('minutes', timeLeft.minutes);
    this.updateNumberWithAnimation('seconds', timeLeft.seconds);
  }
  
  displayExpiredTimer() {
      this.overlay.classList.add('timer-expired');
      const display = this.overlay.querySelector('.timer-display');
      display.innerHTML = `
        <div class="timer-unit" style="grid-column: 1 / -1;">
          <div class="timer-number">🎉</div>
          <div class="timer-label">The event has arrived!</div>
        </div>
      `;
  }

  updateNumberWithAnimation(className, value) {
    const element = this.overlay.querySelector(`.timer-number.${className}`);
    if (!element || (parseInt(element.textContent) || 0) === value) return;
    element.classList.add('updating');
    element.textContent = value.toString().padStart(2, '0');
    setTimeout(() => element.classList.remove('updating'), 300);
  }

  updateMultipleTimersUI() {
    const multiTimerSection = this.overlay.querySelector('.multiple-timers');
    if (this.timers.length > 1) {
      multiTimerSection.style.display = 'block';
      const selector = this.overlay.querySelector('.timer-selector');
      selector.innerHTML = '';
      this.timers.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = index === this.currentTimerIndex ? 'timer-dot active' : 'timer-dot';
        dot.addEventListener('click', () => this.selectTimer(index));
        selector.appendChild(dot);
      });
      this.overlay.querySelector('.prev').disabled = this.currentTimerIndex === 0;
      this.overlay.querySelector('.next').disabled = this.currentTimerIndex === this.timers.length - 1;
    } else {
      multiTimerSection.style.display = 'none';
    }
  }

  selectTimer(index) {
    if (index >= 0 && index < this.timers.length) {
      this.currentTimerIndex = index;
      this.updateDisplay();
    }
  }

  previousTimer() {
    if (this.currentTimerIndex > 0) this.selectTimer(this.currentTimerIndex - 1);
  }

  nextTimer() {
    if (this.currentTimerIndex < this.timers.length - 1) this.selectTimer(this.currentTimerIndex + 1);
  }

  startUpdateLoop() {
    if (this.updateInterval) clearInterval(this.updateInterval);
    this.updateInterval = setInterval(() => this.updateDisplay(), 1000);
  }

  removeOverlay() {
    if (this.updateInterval) clearInterval(this.updateInterval);
    if (this.overlay) this.overlay.remove();
    this.overlay = null;
    this.updateInterval = null;
  }
  
  startDrag(e) {
    if (e.target.matches('button, .timer-dot')) return;
    this.isDragging = true;
    this.overlay.classList.add('dragging');
    const rect = this.overlay.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;
    e.preventDefault();
  }

  drag(e) {
    if (!this.isDragging) return;
    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;
    const maxX = window.innerWidth - this.overlay.offsetWidth;
    const maxY = window.innerHeight - this.overlay.offsetHeight;
    this.overlay.style.left = `${Math.max(0, Math.min(maxX, x))}px`;
    this.overlay.style.top = `${Math.max(0, Math.min(maxY, y))}px`;
    this.overlay.style.right = 'auto';
    e.preventDefault();
  }

  stopDrag() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.overlay.classList.remove('dragging');
    this.savePosition();
  }

  async savePosition() {
    const rect = this.overlay.getBoundingClientRect();
    await chrome.storage.local.set({ timerPosition: { x: rect.left, y: rect.top } });
  }

  async restorePosition() {
    try {
      const result = await chrome.storage.local.get(['timerPosition']);
      if (result.timerPosition) {
        this.overlay.style.left = `${result.timerPosition.x}px`;
        this.overlay.style.top = `${result.timerPosition.y}px`;
        this.overlay.style.right = 'auto';
      }
    } catch (error) {
      console.error('BigDayTimer: Error restoring position', error);
    }
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    this.overlay.classList.toggle('minimized', this.isMinimized);
    this.overlay.querySelector('.minimize-button').textContent = this.isMinimized ? '＋' : '−';
  }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BigDayTimerDisplay());
} else {
    new BigDayTimerDisplay();
}