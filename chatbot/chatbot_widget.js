(function () {
    'use strict';

    var API_URL = '/chatbot/chatbot_api.php';
    // 기본값은 관리자 페이지에서 DB로 설정된 값이 도착하면 즉시 덮어씁니다.
    // 프로젝트별로 /images/ 하위에 챗봇 아이콘 PNG를 두고 LOGO 경로만 바꾸면 됩니다.
    var BRAND = '상담 AI';
    var PHONE = '';
    var LOGO = '/images/chatbot_icon.png';
    var QUICK = ['서비스가 궁금해요', '가격이 궁금해요', '상담 받고 싶어요', '위치가 궁금해요'];
    var WELCOME = '안녕하세요!\n궁금하신 점을 편하게 물어보세요.';

    var sessionId = sessionStorage.getItem('cb_session') || '';
    var history = JSON.parse(sessionStorage.getItem('cb_history') || '[]');
    var isOpen = false;
    var isSending = false;
    var leadCollected = false;

    function init() {
        // 관리자 설정 동기화 (브랜드명/전화/환영문구/빠른질문)
        fetch(API_URL + '?action=config', { cache: 'no-store' })
            .then(function (r) { return r.json(); })
            .then(function (cfg) {
                if (cfg.brand_name) BRAND = cfg.brand_name;
                if (cfg.phone) PHONE = cfg.phone;
                if (cfg.welcome) WELCOME = cfg.welcome;
                if (cfg.quick_questions && cfg.quick_questions.length) QUICK = cfg.quick_questions;
            })
            .catch(function () {})
            .finally(function () { renderWidget(); });
    }

    function renderWidget() {
        // 로고 이미지 로드 실패 시 SVG 말풍선 아이콘으로 자동 폴백
        // class="cb-icon-chat" 유지 — 안 그러면 .cb-toggle.active 상태에서 display:none 안 먹어서 X 옆에 유령 아이콘 남음
        var FALLBACK_TOGGLE = "this.outerHTML='<svg class=\\'cb-icon-chat\\' viewBox=\\'0 0 24 24\\' style=\\'width:55%;height:55%;fill:#333;\\'><path d=\\'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 10h8v2H8v-2zm0-3h8v2H8V7z\\'/></svg>';";
        var FALLBACK_HEADER = "this.outerHTML='<svg viewBox=\\'0 0 24 24\\' style=\\'width:60%;height:60%;fill:#6366f1;\\'><path d=\\'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 10h8v2H8v-2zm0-3h8v2H8V7z\\'/></svg>';";
        var actionsHtml = PHONE ? ('<div class="cb-actions" id="cbActions"><a href="tel:' + PHONE + '" class="cb-action-btn cb-action-call">전화상담 ' + PHONE + '</a></div>') : '';
        var html =
            '<button class="cb-toggle" id="cbToggle">' +
            '<img class="cb-icon-chat" src="' + LOGO + '" onerror="' + FALLBACK_TOGGLE + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">' +
            '<svg class="cb-icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>' +
            '</button>' +
            '<div class="cb-window" id="cbWindow">' +
            '<div class="cb-header">' +
            '<div class="cb-header-icon"><img src="' + LOGO + '" onerror="' + FALLBACK_HEADER + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"></div>' +
            '<div class="cb-header-text">' +
            '<div class="cb-header-title">' + BRAND + '</div>' +
            '<div class="cb-header-sub">AI 상담사가 24시간 답변드려요</div>' +
            '</div>' +
            '</div>' +
            '<div class="cb-messages" id="cbMessages"></div>' +
            '<div class="cb-quick" id="cbQuick"></div>' +
            actionsHtml +
            '<div class="cb-input-wrap">' +
            '<input type="text" class="cb-input" id="cbInput" placeholder="메시지를 입력하세요..." autocomplete="off">' +
            '<button class="cb-send" id="cbSend">' +
            '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>' +
            '</button>' +
            '</div>' +
            '</div>';

        var target = document.getElementById('cbContainer');
        if (!target) return;
        target.innerHTML = html;

        document.getElementById('cbToggle').addEventListener('click', toggle);
        document.getElementById('cbSend').addEventListener('click', send);
        var isComposing = false;
        document.getElementById('cbInput').addEventListener('compositionstart', function () { isComposing = true; });
        document.getElementById('cbInput').addEventListener('compositionend', function () { isComposing = false; });
        document.getElementById('cbInput').addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey && !isComposing) { e.preventDefault(); send(); }
        });

        var quickWrap = document.getElementById('cbQuick');
        QUICK.forEach(function (q) {
            var btn = document.createElement('button');
            btn.textContent = q;
            btn.addEventListener('click', function () { sendMessage(q); });
            quickWrap.appendChild(btn);
        });

        if (history.length > 0) {
            history.forEach(function (h) { appendMessage(h.role, h.content, true); });
            document.getElementById('cbQuick').style.display = 'none';
        }

        // // 3초 후 토스트 표시, 8초 후 사라짐
        // if (!isOpen) {
        //     var toast = document.createElement('div');
        //     toast.className = 'cb-toast';
        //     toast.textContent = 'AI 상담사에게 물어보세요!';
        //     document.body.appendChild(toast);
        //     setTimeout(function () { toast.classList.add('show'); }, 3000);
        //     setTimeout(function () {
        //         toast.classList.remove('show');
        //         setTimeout(function () { toast.remove(); }, 300);
        //     }, 8000);
        // }

        // // 클릭전까지 안사라짐
        // if (!isOpen) {
        //     var toast = document.createElement('div');
        //     toast.className = 'cb-toast';
        //     toast.innerHTML = 'AI 상담사 <br> 러키와 대화하기';
        //     document.body.appendChild(toast);

        //     setTimeout(function () {
        //         toast.classList.add('show');
        //     }, 3000);

        //     toast.addEventListener('click', function () {
        //         toast.classList.remove('show');
        //         setTimeout(function () {
        //             toast.remove();
        //         }, 300);
        //     });
        // }

        // 오픈/클로즈에 따라 토스트 토글 + 토스트 클릭해도 오픈
        var toast = document.createElement('div');
        toast.className = 'cb-toast';
        toast.id = 'cbToast';
        toast.innerHTML = 'AI 상담사와 <br> 대화해보세요';
        target.appendChild(toast);

        setTimeout(function () {
            if (!isOpen) toast.classList.add('show');
        }, 3000);

        toast.addEventListener('click', function () {
            toggle();
        });
    }



    function toggle() {
        isOpen = !isOpen;
        var win = document.getElementById('cbWindow');
        var btn = document.getElementById('cbToggle');
        var toast = document.getElementById('cbToast');
        if (isOpen) {
            win.classList.add('open');
            btn.classList.add('active');
            if (toast) toast.classList.remove('show');
            if (history.length === 0) {
                appendMessage('assistant', WELCOME);
                history.push({ role: 'assistant', content: WELCOME });
                saveSession();
            }
            document.getElementById('cbInput').focus();
            scrollBottom();
        } else {
            win.classList.remove('open');
            btn.classList.remove('active');
            if (toast) toast.classList.add('show');
        }
    }

    function send() {
        var input = document.getElementById('cbInput');
        var msg = input.value.trim();
        if (!msg || isSending) return;
        input.value = '';
        sendMessage(msg);
    }

    function sendMessage(msg) {
        if (isSending) return;
        isSending = true;

        appendMessage('user', msg);
        history.push({ role: 'user', content: msg });
        saveSession();

        document.getElementById('cbQuick').style.display = 'none';

        var typing = document.createElement('div');
        typing.className = 'cb-typing';
        typing.id = 'cbTyping';
        typing.innerHTML = '<span></span><span></span><span></span>';
        document.getElementById('cbMessages').appendChild(typing);
        scrollBottom();

        document.getElementById('cbSend').disabled = true;

        var sendHistory = history.filter(function (h) { return h.role !== 'system'; });

        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: msg,
                session_id: sessionId,
                history: sendHistory.slice(0, -1)
            })
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                removeTyping();

                if (data.error) {
                    appendMessage('assistant', '죄송해요, 일시적 오류가 발생했어요. ' + PHONE + '으로 직접 문의해주세요!');
                } else {
                    // 전화번호 자동 링크 — PHONE에 실제 숫자가 2개 이상 있을 때만 적용
                    // (빈 문자열·구분자만 있는 값이면 정규식이 모든 공백 위치에 매칭되어 밑줄 도배됨)
                    var reply = data.reply;
                    if (PHONE && (PHONE.match(/\d/g) || []).length >= 7) {
                        var phoneRe = new RegExp('(' + PHONE.replace(/[-.\s]/g, '[-.\\s]?') + ')', 'g');
                        reply = reply.replace(phoneRe, '<a href="tel:' + PHONE + '">$1</a>');
                    }
                    appendMessage('assistant', reply, false, true);
                    history.push({ role: 'assistant', content: data.reply });
                    if (data.session_id) sessionId = data.session_id;
                    saveSession();

                    var userMsgCount = history.filter(function (h) { return h.role === 'user'; }).length;
                    if (userMsgCount >= 3 && !leadCollected) {
                        showLeadForm();
                    }
                }
            })
            .catch(function () {
                removeTyping();
                appendMessage('assistant', '네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
            })
            .finally(function () {
                isSending = false;
                document.getElementById('cbSend').disabled = false;
                scrollBottom();
            });
    }

    function showLeadForm() {
        leadCollected = true;
        var formHtml =
            '<div class="cb-lead-form">' +
            '<p class="cb-lead-title">상담사가 직접 연락드릴까요?</p>' +
            '<input type="text" class="cb-lead-input" id="cbLeadName" placeholder="이름">' +
            '<input type="tel" class="cb-lead-input" id="cbLeadPhone" placeholder="연락처">' +
            '<input type="text" class="cb-lead-input" id="cbLeadRegion" placeholder="희망 지역">' +
            '<button class="cb-lead-submit" id="cbLeadSubmit">연락 요청하기</button>' +
            '</div>';
        var el = document.createElement('div');
        el.className = 'cb-msg assistant';
        el.innerHTML = formHtml;
        document.getElementById('cbMessages').appendChild(el);
        scrollBottom();

        document.getElementById('cbLeadSubmit').addEventListener('click', function () {
            var name = document.getElementById('cbLeadName').value.trim();
            var phone = document.getElementById('cbLeadPhone').value.trim();
            var region = document.getElementById('cbLeadRegion').value.trim();
            if (!phone) { alert('연락처를 입력해주세요.'); return; }
            var leadMsg = '이름: ' + (name || '미입력') + ', 연락처: ' + phone + ', 희망지역: ' + (region || '미입력');
            sendMessage(leadMsg);
            el.innerHTML = '<div class="cb-msg assistant">감사합니다! 빠르게 연락드릴게요!</div>';
        });
    }

    function appendMessage(role, content, skipAnim, isHtml) {
        var el = document.createElement('div');
        el.className = 'cb-msg ' + role;
        if (isHtml) {
            el.innerHTML = content;
        } else {
            el.textContent = content;
        }
        if (!skipAnim) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(8px)';
            setTimeout(function () {
                el.style.transition = 'opacity 0.2s, transform 0.2s';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, 10);
        }
        document.getElementById('cbMessages').appendChild(el);
        scrollBottom();
    }

    function removeTyping() {
        var el = document.getElementById('cbTyping');
        if (el) el.remove();
    }

    function scrollBottom() {
        var el = document.getElementById('cbMessages');
        setTimeout(function () { el.scrollTop = el.scrollHeight; }, 50);
    }

    function saveSession() {
        sessionStorage.setItem('cb_session', sessionId);
        sessionStorage.setItem('cb_history', JSON.stringify(history));
    }

    window.ChatbotWidget = { init: init };
})();
