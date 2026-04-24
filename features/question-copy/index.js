const QuestionCopy = {
  ...QuestionCopyConfig,
  
  config: null,
  iconElement: null,
  isDragging: false,
  dragOffset: { x: 0, y: 0 },
  position: { x: null, y: null },
  mouseStartPos: { x: 0, y: 0 },

  init(config) {
    this.config = { ...this.defaultConfig, ...config };
    console.log('[AP Toolkit] Question Copy module initializing with config:', this.config);
    if (!this.config.enabled) {
      console.log('[AP Toolkit] Question Copy module disabled');
      return;
    }
    
    this.loadPosition();
    this.waitForBody().then(() => {
      this.createIcon();
      this.setupDragListeners();
      console.log('[AP Toolkit] Question Copy icon created successfully');
    });
    console.log('[AP Toolkit] Question Copy module loaded');
  },

  waitForBody() {
    return new Promise((resolve) => {
      if (document.body) {
        resolve();
      } else {
        const observer = new MutationObserver(() => {
          if (document.body) {
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(document.documentElement, { childList: true });
      }
    });
  },

  createIcon() {
    if (this.iconElement) return;

    this.iconElement = document.createElement('div');
    this.iconElement.id = 'ap-toolkit-copy-icon';
    this.iconElement.innerHTML = `
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
    
    Object.assign(this.iconElement.style, {
      position: 'fixed',
      width: `${this.config.iconSize}px`,
      height: `${this.config.iconSize}px`,
      backgroundColor: '#324dc7',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'grab',
      zIndex: '2147483647',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease',
      opacity: this.config.iconOpacity.toString(),
      userSelect: 'none',
      color: '#ffffff'
    });

    const initialX = this.position.x ?? window.innerWidth - this.config.iconSize - 20;
    const initialY = this.position.y ?? window.innerHeight - this.config.iconSize - 20;
    this.iconElement.style.left = `${initialX}px`;
    this.iconElement.style.top = `${initialY}px`;

    this.iconElement.addEventListener('mouseenter', () => {
      if (!this.isDragging) {
        this.iconElement.style.transform = 'scale(1.05)';
        this.iconElement.style.boxShadow = '0 5px 14px rgba(0, 0, 0, 0.35)';
      }
    });

    this.iconElement.addEventListener('mouseleave', () => {
      if (!this.isDragging) {
        this.iconElement.style.transform = 'scale(1)';
        this.iconElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
      }
    });

    document.body.appendChild(this.iconElement);
  },

  setupDragListeners() {
    this.iconElement.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isDragging = true;
      this.iconElement.style.cursor = 'grabbing';
      this.iconElement.style.transform = 'scale(1.05)';
      
      const rect = this.iconElement.getBoundingClientRect();
      this.dragOffset.x = e.clientX - rect.left;
      this.dragOffset.y = e.clientY - rect.top;
      this.mouseStartPos.x = e.clientX;
      this.mouseStartPos.y = e.clientY;
      console.log('[AP Toolkit] mousedown at:', this.mouseStartPos);
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      let newX = e.clientX - this.dragOffset.x;
      let newY = e.clientY - this.dragOffset.y;

      newX = Math.max(0, Math.min(newX, window.innerWidth - this.config.iconSize));
      newY = Math.max(0, Math.min(newY, window.innerHeight - this.config.iconSize));

      this.iconElement.style.left = `${newX}px`;
      this.iconElement.style.top = `${newY}px`;
      this.position.x = newX;
      this.position.y = newY;
    });

    document.addEventListener('mouseup', (e) => {
      if (!this.isDragging) return;
      
      this.isDragging = false;
      this.iconElement.style.cursor = 'grab';
      this.iconElement.style.transform = 'scale(1)';
      this.savePosition();

      const distance = Math.sqrt(
        Math.pow(e.clientX - this.mouseStartPos.x, 2) +
        Math.pow(e.clientY - this.mouseStartPos.y, 2)
      );
      console.log('[AP Toolkit] mouseup distance:', distance, 'start:', this.mouseStartPos, 'end:', { x: e.clientX, y: e.clientY });

      if (distance < 5) {
        console.log('[AP Toolkit] Treating as click, triggering copy');
        this.handleCopy();
      } else {
        console.log('[AP Toolkit] Treating as drag, not triggering copy');
      }
    });

    window.addEventListener('resize', () => {
      if (this.iconElement) {
        const rect = this.iconElement.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
          this.iconElement.style.left = `${window.innerWidth - this.config.iconSize - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
          this.iconElement.style.top = `${window.innerHeight - this.config.iconSize - 10}px`;
        }
      }
    });
  },

  handleCopy() {
    console.log('[AP Toolkit] handleCopy triggered');
    const content = this.extractQuestionContent();
    console.log('[AP Toolkit] Extracted content:', content);
    if (content) {
      this.copyToClipboard(content);
      this.showNotification('Question copied to clipboard!');
    } else {
      console.warn('[AP Toolkit] No question content found');
      this.showNotification('No question content found', 'error');
    }
  },

  extractQuestionContent() {
    console.log('[AP Toolkit] Extracting question content...');
    const parts = [];
    
    console.log('[AP Toolkit] Checking for split layout (left panel passage)...');
    const sharedPassage = this.extractSharedPassage();
    if (sharedPassage) {
      console.log('[AP Toolkit] Found shared passage, using split layout mode');
      parts.push({ type: 'passage', content: sharedPassage });
      
      const questionStem = this.extractRightPanelQuestion();
      console.log('[AP Toolkit] Right panel question:', questionStem);
      if (questionStem) {
        parts.push({ type: 'stem', content: questionStem });
      }
    } else {
      console.log('[AP Toolkit] No shared passage, using standard layout');
      const questionStem = this.extractQuestionStem();
      console.log('[AP Toolkit] Question stem:', questionStem);
      if (questionStem) {
        parts.push({ type: 'stem', content: questionStem });
      }
    }

    const options = this.extractOptions();
    console.log('[AP Toolkit] Options:', options);
    if (options.length > 0) {
      parts.push({ type: 'options', content: options.join('\n') });
    }

    let result = '';
    parts.forEach((part, index) => {
      if (index > 0 && part.type === 'stem') {
        result += '\n\n';
      } else if (index > 0) {
        result += '\n';
      }
      result += part.content;
    });
    
    result = result.trim();
    console.log('[AP Toolkit] Final extracted content:', result);
    return result;
  },

  extractRightPanelQuestion() {
    console.log('[AP Toolkit] extractRightPanelQuestion: Looking for right panel question...');
    
    const selectors = [
      '.lrn_stimulus_content',
      '.lrn_stimulus',
      '.lrn_question'
    ];

    for (const selector of selectors) {
      console.log(`[AP Toolkit] extractRightPanelQuestion: Trying selector: ${selector}`);
      const allElements = document.querySelectorAll(selector);
      const visibleElements = Array.from(allElements).filter(el => this.isVisible(el));
      
      for (const element of visibleElements) {
        if (element.closest('.lrn_scrollablepassage, .lrn_sharedpassage, .learnosity-feature[data-type="scrollablepassage"]')) {
          console.log(`[AP Toolkit] extractRightPanelQuestion: Skipping element in left panel`);
          continue;
        }
        
        const text = this.extractTextWithMath(element);
        if (text && !this.isOptionElement(element)) {
          console.log(`[AP Toolkit] extractRightPanelQuestion: Found text from ${selector}:`, text.substring(0, 100));
          return text;
        }
      }
    }

    console.log('[AP Toolkit] extractRightPanelQuestion: No right panel question found');
    return null;
  },

  extractQuestionStem() {
    console.log('[AP Toolkit] extractQuestionStem: Starting extraction (standard layout)...');
    
    const selectors = [
      '.lrn_stimulus_content',
      '.lrn_stimulus',
      '.lrn_question',
      '.lrn-question-content',
      '.lrn_stimulus-content',
      '.question-stem',
      '[data-test-id="question-content"]',
      '.lrn_contentWrapper:not(.lrn-mcq-option .lrn_contentWrapper)',
      '.lrn-widget .lrn_contentWrapper'
    ];

    for (const selector of selectors) {
      console.log(`[AP Toolkit] extractQuestionStem: Trying selector: ${selector}`);
      const allElements = document.querySelectorAll(selector);
      const visibleElements = Array.from(allElements).filter(el => this.isVisible(el));
      console.log(`[AP Toolkit] extractQuestionStem: Found ${allElements.length} total, ${visibleElements.length} visible elements for selector: ${selector}`);
      for (const element of visibleElements) {
        const text = this.extractTextWithMath(element);
        if (text && !this.isOptionElement(element)) {
          console.log(`[AP Toolkit] extractQuestionStem: Found text from selector ${selector}:`, text.substring(0, 100));
          return text;
        }
      }
    }

    console.log('[AP Toolkit] extractQuestionStem: Trying fallback container search...');
    const allQuestionContainers = document.querySelectorAll('.lrn_question, .lrn-question, [data-test-id="question-container"], .question-container');
    const visibleQuestionContainers = Array.from(allQuestionContainers).filter(el => this.isVisible(el));
    console.log(`[AP Toolkit] extractQuestionStem: Found ${allQuestionContainers.length} total, ${visibleQuestionContainers.length} visible question containers`);
    
    for (const questionContainer of visibleQuestionContainers) {
      console.log('[AP Toolkit] extractQuestionStem: Checking visible question container');
      const stimulusContent = questionContainer.querySelector('.lrn_stimulus_content');
      if (stimulusContent && this.isVisible(stimulusContent)) {
        const text = this.extractTextWithMath(stimulusContent);
        if (text) {
          console.log('[AP Toolkit] extractQuestionStem: Found text from stimulus_content:', text.substring(0, 100));
          return text;
        }
      }
      const mcqGroup = questionContainer.querySelector('.lrn_mcqgroup');
      if (mcqGroup && this.isVisible(mcqGroup)) {
        const container = mcqGroup.parentElement;
        if (container) {
          const clone = container.cloneNode(true);
          const optionsToRemove = clone.querySelectorAll('.lrn_mcqgroup, .lrn-mcq-option');
          optionsToRemove.forEach(opt => opt.remove());
          const text = this.extractTextWithMath(clone);
          if (text) {
            console.log('[AP Toolkit] extractQuestionStem: Found text from container:', text.substring(0, 100));
            return text;
          }
        }
      }
    }

    console.log('[AP Toolkit] extractQuestionStem: No question stem found');
    return null;
  },

  extractSharedPassage() {
    console.log('[AP Toolkit] extractSharedPassage: Looking for left panel passage...');
    
    const selectors = [
      '.lrn_scrollablepassage .lrn_sharedpassage .lrn_clearfix',
      '.lrn_sharedpassage .lrn_clearfix',
      '.learnosity-feature[data-type="scrollablepassage"] .lrn_clearfix'
    ];

    for (const selector of selectors) {
      console.log(`[AP Toolkit] extractSharedPassage: Trying selector: ${selector}`);
      const elements = document.querySelectorAll(selector);
      
      for (const element of Array.from(elements).filter(el => this.isVisible(el))) {
        const text = this.extractTextWithMath(element);
        if (text && text.trim().length > 10) {
          console.log(`[AP Toolkit] extractSharedPassage: Found passage from ${selector}:`, text.substring(0, 100));
          return text;
        }
      }
    }

    const scrollablePassages = document.querySelectorAll('.lrn_scrollablepassage, .learnosity-feature[data-type="scrollablepassage"]');
    console.log(`[AP Toolkit] extractSharedPassage: Found ${scrollablePassages.length} scrollable passages`);
    
    for (const passage of Array.from(scrollablePassages).filter(el => this.isVisible(el))) {
      const clearfix = passage.querySelector('.lrn_clearfix');
      if (clearfix) {
        const text = this.extractTextWithMath(clearfix);
        if (text && text.trim().length > 10) {
          console.log('[AP Toolkit] extractSharedPassage: Found passage from clearfix:', text.substring(0, 100));
          return text;
        }
      }
    }

    console.log('[AP Toolkit] extractSharedPassage: No shared passage found');
    return null;
  },

  isOptionElement(element) {
    return element.closest('.lrn-mcq-option, .lrn-possible-answer') !== null;
  },

  isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           element.offsetParent !== null;
  },

  extractOptions() {
    console.log('[AP Toolkit] extractOptions: Starting extraction...');
    const options = [];
    const allOptionElements = document.querySelectorAll('li.lrn-mcq-option');
    const visibleOptionElements = Array.from(allOptionElements).filter(opt => this.isVisible(opt));
    console.log(`[AP Toolkit] extractOptions: Found ${allOptionElements.length} total, ${visibleOptionElements.length} visible option elements`);
    
    visibleOptionElements.forEach((option, index) => {
      const label = option.querySelector('.lrn-label, label');
      const contentWrapper = option.querySelector('.lrn_contentWrapper, .lrn-possible-answer');
      
      if (contentWrapper) {
        const text = this.extractTextWithMath(contentWrapper);
        if (text) {
          const letter = String.fromCharCode(65 + index);
          options.push(`${letter}. ${text}`);
          console.log(`[AP Toolkit] extractOptions: Option ${letter}:`, text.substring(0, 50));
        }
      }
    });

    return options;
  },

  extractTextWithMath(element) {
    const clone = element.cloneNode(true);
    
    const crossoutButtons = clone.querySelectorAll('[data-cy="crossout-question-toggle"], .option-eleminator-button');
    crossoutButtons.forEach(btn => btn.remove());

    const srOnlyElements = clone.querySelectorAll('.sr-only');
    srOnlyElements.forEach(el => el.remove());

    const mathContainers = clone.querySelectorAll('mjx-container');
    mathContainers.forEach(container => {
      const assistiveMml = container.querySelector('mjx-assistive-mml');
      if (assistiveMml) {
        const math = assistiveMml.querySelector('math');
        if (math) {
          const alttext = math.getAttribute('alttext');
          if (alttext) {
            const textNode = document.createTextNode(alttext);
            container.parentNode.replaceChild(textNode, container);
          } else {
            const mathText = this.extractMathText(math);
            const textNode = document.createTextNode(mathText);
            container.parentNode.replaceChild(textNode, container);
          }
        }
      } else {
        const ariaLabel = container.getAttribute('aria-label');
        if (ariaLabel) {
          const textNode = document.createTextNode(ariaLabel);
          container.parentNode.replaceChild(textNode, container);
        }
      }
    });

    let text = clone.textContent || '';
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  },

  extractMathText(mathElement) {
    let result = '';
    
    const processNode = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        if (tagName === 'mn') {
          result += node.textContent;
        } else if (tagName === 'mi') {
          result += node.textContent;
        } else if (tagName === 'mo') {
          result += node.textContent;
        } else if (tagName === 'mtext') {
          result += node.textContent;
        } else if (tagName === 'msub' || tagName === 'msup') {
          const children = node.children;
          for (const child of children) {
            processNode(child);
          }
          if (tagName === 'msub') {
          } else {
          }
        } else if (tagName === 'mfrac') {
          const children = node.children;
          if (children.length >= 2) {
            result += '(';
            processNode(children[0]);
            result += '/';
            processNode(children[1]);
            result += ')';
          }
        } else if (tagName === 'msqrt') {
          result += '√(';
          for (const child of node.children) {
            processNode(child);
          }
          result += ')';
        } else if (tagName === 'mroot') {
          const children = node.children;
          if (children.length >= 2) {
            result += '(';
            processNode(children[1]);
            result += ')√(';
            processNode(children[0]);
            result += ')';
          }
        } else if (tagName === 'mrow' || tagName === 'mstyle') {
          for (const child of node.childNodes) {
            processNode(child);
          }
        } else {
          for (const child of node.childNodes) {
            processNode(child);
          }
        }
      }
    };

    for (const child of mathElement.childNodes) {
      processNode(child);
    }

    return result;
  },

  async copyToClipboard(text) {
    console.log('[AP Toolkit] copyToClipboard: Attempting to copy text of length:', text.length);
    try {
      await navigator.clipboard.writeText(text);
      console.log('[AP Toolkit] copyToClipboard: Successfully copied using clipboard API');
      this.showCopySuccess();
    } catch (err) {
      console.warn('[AP Toolkit] copyToClipboard: Clipboard API failed, using fallback:', err);
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      console.log('[AP Toolkit] copyToClipboard: Successfully copied using fallback method');
      this.showCopySuccess();
    }
  },

  showCopySuccess() {
    this.iconElement.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease';
    this.iconElement.style.backgroundColor = '#22c55e';
    this.iconElement.style.transform = 'scale(1.15)';
    this.iconElement.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.5)';
    
    setTimeout(() => {
      this.iconElement.style.backgroundColor = '#324dc7';
      this.iconElement.style.transform = 'scale(1)';
      this.iconElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    }, 600);
  },

  showNotification(message, type = 'success') {
    if (!this.config.showNotification) return;

    const existing = document.getElementById('ap-toolkit-notification');
    if (existing) existing.remove();

    const style = document.createElement('style');
    style.id = 'ap-toolkit-notification-styles';
    style.textContent = `
      @keyframes apToolkitFadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      @keyframes apToolkitFadeOutDown {
        from {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateY(20px) scale(0.9);
        }
      }
      @keyframes apToolkitPulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.02);
        }
      }
    `;
    
    const oldStyle = document.getElementById('ap-toolkit-notification-styles');
    if (oldStyle) oldStyle.remove();
    document.head.appendChild(style);

    const notification = document.createElement('div');
    notification.id = 'ap-toolkit-notification';
    notification.textContent = message;
    
    const iconRect = this.iconElement.getBoundingClientRect();
    const notificationBottom = window.innerHeight - iconRect.top + 10;
    const notificationRight = window.innerWidth - iconRect.right;
    
    Object.assign(notification.style, {
      position: 'fixed',
      bottom: `${notificationBottom}px`,
      right: `${Math.max(10, notificationRight)}px`,
      backgroundColor: type === 'success' ? '#22c55e' : '#ef4444',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      zIndex: '2147483647',
      boxShadow: type === 'success' 
        ? '0 4px 16px rgba(34, 197, 94, 0.4)' 
        : '0 4px 16px rgba(239, 68, 68, 0.4)',
      animation: 'apToolkitFadeInUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      transition: 'box-shadow 0.3s ease',
      whiteSpace: 'nowrap'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'apToolkitPulse 0.3s ease';
    }, 400);

    setTimeout(() => {
      notification.style.animation = 'apToolkitFadeOutDown 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      setTimeout(() => notification.remove(), 400);
    }, 2000);
  },

  savePosition() {
    try {
      localStorage.setItem('ap-toolkit-icon-position', JSON.stringify(this.position));
    } catch (e) {
      console.warn('[AP Toolkit] Could not save icon position');
    }
  },

  loadPosition() {
    try {
      const saved = localStorage.getItem('ap-toolkit-icon-position');
      if (saved) {
        this.position = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[AP Toolkit] Could not load icon position');
    }
  },

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    if (this.iconElement) {
      this.iconElement.style.opacity = this.config.iconOpacity.toString();
      this.iconElement.style.width = `${this.config.iconSize}px`;
      this.iconElement.style.height = `${this.config.iconSize}px`;
    }
  }
};