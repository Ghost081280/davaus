/* ==========================================================================
   JARVIS, Davaus Product Assistant
   Powered by Claude · Mobile-optimized · Fallback-resilient
   ========================================================================== */

const JARVIS_CONFIG = {
    backendUrl: (window.DAVAUS_CONFIG && window.DAVAUS_CONFIG.chatBackend) || 'https://api.davaus.com/chat',
    maxConversationLength: 12,
    maxInputLength: 500
};

let conversationHistory = [];
let messageCount = 0;
let lastMessageTime = 0;
const RATE_LIMIT_MS = 1500;
const SESSION_KEY = 'jarvis_conversation';

function restoreConversation() {
    try {
        const saved = sessionStorage.getItem(SESSION_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            conversationHistory = data.history || [];
            messageCount = data.messageCount || 0;
            return data.messages || [];
        }
    } catch (e) {}
    return null;
}

function saveConversation() {
    try {
        const chatMessages = document.getElementById('jarvisMessages');
        if (!chatMessages) return;
        const msgs = [];
        chatMessages.querySelectorAll('.chat-message:not(.typing-indicator)').forEach(function(el) {
            msgs.push({ className: el.className, html: el.innerHTML });
        });
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
            history: conversationHistory,
            messageCount: messageCount,
            messages: msgs
        }));
    } catch (e) {}
}

document.addEventListener('davaus:components-loaded', function() {
    initChatbot();
});
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initChatbot, 100);
}

function showChatbotButton() {
    const container = document.querySelector('.chatbot-container');
    if (container) container.classList.add('ready');
}

function initChatbot() {
    const chatbotBtn = document.getElementById('jarvisBtn');
    const chatWindow = document.getElementById('jarvisWindow');
    const chatbotClose = document.getElementById('jarvisClose');
    const chatInput = document.getElementById('jarvisInput');
    const chatSend = document.getElementById('jarvisSend');
    const chatMessages = document.getElementById('jarvisMessages');

    if (!chatbotBtn || !chatWindow) {
        setTimeout(initChatbot, 200);
        return;
    }

    if (chatbotBtn.dataset.initialized) return;
    chatbotBtn.dataset.initialized = 'true';

    let greetingShown = false;

    function openChatbot() {
        // Close mobile menu if it's open
        const menu = document.getElementById('mobile-menu');
        if (menu && menu.classList.contains('open')) {
            menu.classList.remove('open');
            document.body.classList.remove('menu-open');
        }

        chatWindow.classList.add('active');
        const container = document.querySelector('.chatbot-container');
        if (container) container.classList.add('chatbot-active');

        if (!greetingShown && chatMessages && chatMessages.children.length === 0) {
            greetingShown = true;
            setTimeout(function() {
                showTypingIndicator();
                setTimeout(function() {
                    hideTypingIndicator();
                    typeBotMessage("Hey, I'm Jarvis, Davaus' product assistant. Ask me about SeedRight, the Kernel Keeper, the Ride Tamer, dealer locations, or anything else.").then(function() {
                        if (chatInput) chatInput.focus();
                    });
                }, 500);
            }, 180);
        } else if (chatInput) {
            setTimeout(() => chatInput.focus(), 300);
        }
    }

    function closeChatbot() {
        chatWindow.classList.remove('active');
        chatWindow.classList.remove('keyboard-visible');
        const container = document.querySelector('.chatbot-container');
        if (container) container.classList.remove('chatbot-active');
        if (chatInput) chatInput.blur();
    }

    chatbotBtn.addEventListener('click', function() {
        if (chatWindow.classList.contains('active')) closeChatbot();
        else openChatbot();
    });

    if (chatbotClose) chatbotClose.addEventListener('click', closeChatbot);

    // Hide tooltip on scroll
    let scrollTimeout;
    window.addEventListener('scroll', function() {
        const label = document.querySelector('.chatbot-label');
        if (!label) return;
        label.classList.add('scrolled');
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => label.classList.remove('scrolled'), 1800);
    }, { passive: true });

    // Restore previous conversation
    const savedMessages = restoreConversation();
    if (savedMessages && savedMessages.length > 0 && chatMessages) {
        chatMessages.innerHTML = '';
        savedMessages.forEach(function(msg) {
            const div = document.createElement('div');
            div.className = msg.className;
            div.innerHTML = msg.html;
            chatMessages.appendChild(div);
        });
        greetingShown = true;
    }

    // Auto-grow textarea
    if (chatInput) {
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });

        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Mobile keyboard handling
        chatInput.addEventListener('focus', function() {
            if (window.innerWidth <= 640) {
                chatWindow.classList.add('keyboard-visible');
            }
        });
        chatInput.addEventListener('blur', function() {
            chatWindow.classList.remove('keyboard-visible');
        });
    }

    if (chatSend) chatSend.addEventListener('click', sendMessage);

    // ======================
    // MESSAGE FLOW
    // ======================
    async function sendMessage() {
        const text = (chatInput.value || '').trim();
        if (!text) return;

        const validation = validateMessage(text);
        if (!validation.valid) {
            addMessage('bot', validation.error);
            return;
        }

        chatInput.value = '';
        chatInput.style.height = 'auto';
        addMessage('user', text);
        messageCount++;
        lastMessageTime = Date.now();

        showTypingIndicator();
        try {
            const response = await callBackend(text);
            hideTypingIndicator();
            typeBotMessage(response);
        } catch (err) {
            hideTypingIndicator();
            typeBotMessage(getFallbackResponse(text));
        }

        saveConversation();
    }

    function validateMessage(text) {
        if (text.length > JARVIS_CONFIG.maxInputLength) {
            return { valid: false, error: `Please keep messages under ${JARVIS_CONFIG.maxInputLength} characters.` };
        }
        const now = Date.now();
        if (now - lastMessageTime < RATE_LIMIT_MS) {
            return { valid: false, error: "Easy there, give me a second to respond." };
        }
        if (messageCount >= 20) {
            return { valid: false, error: "You've hit this session's limit. Reach out at info@davaus.com to keep the conversation going." };
        }
        return { valid: true };
    }

    async function callBackend(userMessage) {
        conversationHistory.push({ role: 'user', content: userMessage });

        // Trim history to last N messages to keep payload sane
        if (conversationHistory.length > JARVIS_CONFIG.maxConversationLength) {
            conversationHistory = conversationHistory.slice(-JARVIS_CONFIG.maxConversationLength);
        }

        const response = await fetch(JARVIS_CONFIG.backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversationHistory })
        });

        if (!response.ok) {
            conversationHistory.pop();
            throw new Error(`Backend ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage = data.response || data.message || '';
        if (!assistantMessage) {
            conversationHistory.pop();
            throw new Error('Empty response');
        }
        conversationHistory.push({ role: 'assistant', content: assistantMessage });
        return assistantMessage;
    }

    // ======================
    // FALLBACK RESPONSES, used when the backend is unavailable.
    // Knowledge-grounded in Davaus products so the experience stays useful.
    // ======================
    function getFallbackResponse(message) {
        const msg = message.toLowerCase();

        if (msg.includes('seedright') || msg.includes('seed right') || msg.includes('cover crop') || msg.includes('seed plate')) {
            return "SeedRight lets you plant cover crops and small grains right from your planter, no seed drill required. Large-cell discs handle wheat, oats, cereal rye, and triticale. Small-cell discs handle radishes, turnips, crimson clover, rape seed, and rye grasses. Compatible with John Deere, Precision Planting, and Kinze vacuum meters. See <a href='/seedright.html'>the SeedRight page</a> for details.";
        }
        if (msg.includes('kernel keeper') || msg.includes('kernel') || msg.includes('corn head') || msg.includes('deck plate')) {
            return "The Kernel Keeper is a deck-mounted rail and finger-brush system that cushions, captures, and collects loose kernels at the corn head. Save just one kernel per acre (half a bushel) and you're looking at a 150%+ ROI. No replacement deck plates required, the kit includes a drill bit. Fits John Deere 600/700/C Series, Case IH 800/900/1000, and most New Holland 96C–996 heads. More on <a href='/kernel-keeper.html'>the Kernel Keeper page</a>.";
        }
        if (msg.includes('ride tamer') || msg.includes('mower') || msg.includes('zero turn') || msg.includes('suspension')) {
            return "Ride Tamer is a retrofit elastomeric suspension system for zero-turn mowers. It reduces operator impact by more than 47%, smooths the cut, and lowers frame stress. Installs to your existing front fork in under 15 minutes. Wear parts are serviceable. See <a href='/ride-tamer.html'>the Ride Tamer page</a> for video and details.";
        }
        if (msg.includes('dealer') || msg.includes('buy') || msg.includes('where') || msg.includes('locate')) {
            return "We have a dealer network across the country. <a href='https://www.zeemaps.com/view?group=3753470' target='_blank' rel='noopener'>Open the dealer locator map</a> to find one near you, or call us at 260-245-5006.";
        }
        if (msg.includes('contact') || msg.includes('phone') || msg.includes('email') || msg.includes('reach')) {
            return "You can reach us at 260-245-5006 or info@davaus.com. We're at 14508 Bruick Drive, Hoagland, IN 46745.";
        }
        if (msg.includes('about') || msg.includes('history') || msg.includes('who') || msg.includes('company')) {
            return "Davaus is a family-run agricultural products company in Hoagland, Indiana. We started with SeedRight, a Convoy, Ohio farmer who wondered if he could do more with less from his Kinze planter. Today we engineer practical solutions rooted in agronomy and built to improve the grower's bottom line.";
        }
        if (msg.includes('shop') || msg.includes('order') || msg.includes('price') || msg.includes('cost')) {
            return "Pricing and direct ordering for plates, parts, and apparel is on <a href='/shop.html'>our shop page</a>. For Kernel Keeper or Ride Tamer kits, we'll route you to your nearest dealer.";
        }
        if (msg.includes('install') || msg.includes('how') && msg.includes('work')) {
            return "Installation depends on the product, Ride Tamer is under 15 minutes to your existing front fork, Kernel Keeper requires no new deck plates (drill bit included), and SeedRight plates swap right into your vacuum meter. We have install videos and brochures on each product page.";
        }
        if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey') || msg.length < 6) {
            return "Hey! I can help with any of our three product lines, SeedRight (planter plates for cover crops and small grains), Kernel Keeper (corn-head kernel saver), or Ride Tamer (zero-turn mower suspension). What are you working on?";
        }
        return "I'd love to help with that. Could you share a bit more? Or you can reach the team directly at 260-245-5006 or info@davaus.com.";
    }

    // ======================
    // RENDERING HELPERS
    // ======================
    function addMessage(role, text) {
        if (!chatMessages) return;
        const msg = document.createElement('div');
        msg.className = 'chat-message ' + role;
        msg.innerHTML = `
            <div class="message-avatar">${role === 'user' ? 'You' : 'J'}</div>
            <div class="message-content">${text}</div>
        `;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        if (!chatMessages || document.querySelector('.typing-indicator')) return;
        const msg = document.createElement('div');
        msg.className = 'chat-message bot typing-indicator';
        msg.innerHTML = `
            <div class="message-avatar">J</div>
            <div class="message-content">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        `;
        chatMessages.appendChild(msg);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    }

    function typeBotMessage(text) {
        return new Promise(function(resolve) {
            if (!chatMessages) { resolve(); return; }
            const msg = document.createElement('div');
            msg.className = 'chat-message bot';
            msg.innerHTML = `
                <div class="message-avatar">J</div>
                <div class="message-content"></div>
            `;
            chatMessages.appendChild(msg);
            const content = msg.querySelector('.message-content');

            // Render full text immediately if it contains links, otherwise type out
            if (text.indexOf('<a') !== -1 || text.length > 280) {
                content.innerHTML = text;
                chatMessages.scrollTop = chatMessages.scrollHeight;
                saveConversation();
                resolve();
                return;
            }

            let i = 0;
            const speed = 14;
            const interval = setInterval(function() {
                content.textContent = text.slice(0, i++);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                if (i > text.length) {
                    clearInterval(interval);
                    saveConversation();
                    resolve();
                }
            }, speed);
        });
    }

    // Reveal button after init
    showChatbotButton();
}
