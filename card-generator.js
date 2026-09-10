/* ═══════════════════════════════════════════════════════════
   CHRONOS CAPSULE — Card Generator (Canvas)
   نسخة كاملة: توليد بطاقة + نافذة معاينة + مشاركة
   ═══════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    /* ═══ الألوان حسب الشعور ═══ */
    const MOOD_THEMES = {
        hope:       { c1: '#38bdf8', c2: '#3b82f6', glow: '#60a5fa', emoji: '💙', label_ar: 'أمل', label_en: 'Hope' },
        nostalgia:  { c1: '#a78bfa', c2: '#8b5cf6', glow: '#c4b5fd', emoji: '💜', label_ar: 'حنين', label_en: 'Nostalgia' },
        secret:     { c1: '#34d399', c2: '#10b981', glow: '#6ee7b7', emoji: '💚', label_ar: 'سر', label_en: 'Secret' },
        confession: { c1: '#fbbf24', c2: '#f59e0b', glow: '#fcd34d', emoji: '💛', label_ar: 'اعتراف', label_en: 'Confession' },
        bold:       { c1: '#f87171', c2: '#ef4444', glow: '#fca5a5', emoji: '❤️', label_ar: 'جرأة', label_en: 'Bold' }
    };

    /* ═══ أبعاد البطاقة ═══ */
    const W = 1080;
    const H = 1080;

    /* ═══ دالة: اختيار أنسب حجم خط ═══ */
    function fitFont(ctx, text, maxWidth, initialSize, minSize, fontFamily, fontWeight) {
        let size = initialSize;
        while (size > minSize) {
            ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
            if (ctx.measureText(text).width <= maxWidth) return size;
            size -= 2;
        }
        return minSize;
    }

    /* ═══ دالة: قص النص ═══ */
    function truncate(text, maxLen) {
        const t = String(text || '');
        if (t.length <= maxLen) return t;
        return t.slice(0, maxLen - 1).trim() + '…';
    }

    /* ═══ دالة: حساب العد التنازلي ═══ */
    function getCountdown(arrivalISO) {
        if (!arrivalISO) return null;
        const diff = new Date(arrivalISO) - Date.now();
        if (diff <= 0) return null;
        return {
            days: Math.floor(diff / 864e5),
            hours: Math.floor((diff % 864e5) / 36e5),
            minutes: Math.floor((diff % 36e5) / 6e4)
        };
    }

    /* ═══ دالة: رسم نقطة نجمة ═══ */
    function drawStar(ctx, x, y, size, color, alpha) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /* ═══ دالة: رسم مستطيل بحواف دائرية ═══ */
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x + r, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    /* ═══ انتظار تحميل خط Tajawal ═══ */
    async function waitForFonts() {
        try {
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }
        } catch (e) {}
        /* انتظار إضافي بسيط للخط العربي */
        await new Promise(r => setTimeout(r, 200));
    }

    /* ═══════════════════════════════════════════════════════════
       الدالة الرئيسية: توليد البطاقة
       ═══════════════════════════════════════════════════════════ */
    async function generateCard(options) {
        const {
            text = '',
            author = '',
            country = '',
            mood = 'hope',
            arrivalAt = null,
            lang = 'ar'
        } = options || {};

        await waitForFonts();

        const theme = MOOD_THEMES[mood] || MOOD_THEMES.hope;
        const isAr = lang === 'ar';
        const fontFamily = '"Tajawal", sans-serif';

        /* ═══ إنشاء Canvas ═══ */
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        /* ═══ 1) الخلفية المتدرجة ═══ */
        const bgGrad = ctx.createLinearGradient(0, 0, W, H);
        bgGrad.addColorStop(0, '#010103');
        bgGrad.addColorStop(0.5, '#0a0a1a');
        bgGrad.addColorStop(1, '#010103');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        /* ═══ 2) هالة ملونة ═══ */
        const glowGrad = ctx.createRadialGradient(W * 0.85, H * 0.15, 0, W * 0.85, H * 0.15, W * 0.7);
        glowGrad.addColorStop(0, theme.c1 + '40');
        glowGrad.addColorStop(0.4, theme.c2 + '15');
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, W, H);

        const glowGrad2 = ctx.createRadialGradient(W * 0.15, H * 0.85, 0, W * 0.15, H * 0.85, W * 0.5);
        glowGrad2.addColorStop(0, theme.c2 + '22');
        glowGrad2.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad2;
        ctx.fillRect(0, 0, W, H);

        /* ═══ 3) نجوم متفرقة (بذرة ثابتة لكل بطاقة) ═══ */
        let seed = 12345;
        const rand = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
        for (let i = 0; i < 200; i++) {
            const x = rand() * W;
            const y = rand() * H;
            const s = rand() * 1.8 + 0.3;
            const a = rand() * 0.7 + 0.15;
            drawStar(ctx, x, y, s, '#ffffff', a);
        }
        /* نجوم أكبر متفرقة */
        for (let i = 0; i < 8; i++) {
            const x = rand() * W;
            const y = rand() * H;
            drawStar(ctx, x, y, rand() * 1.5 + 1.8, theme.c1, 0.5);
        }

        /* ═══ 4) الإطار الخارجي ═══ */
        const pad = 60;
        ctx.save();
        ctx.strokeStyle = theme.c1 + '66';
        ctx.lineWidth = 2;
        roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 40);
        ctx.stroke();
        ctx.restore();

        /* ═══ 5) الشعار في الأعلى ═══ */
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 38px ${fontFamily}`;
        const logoGrad = ctx.createLinearGradient(W/2 - 300, 0, W/2 + 300, 0);
        logoGrad.addColorStop(0, theme.c1);
        logoGrad.addColorStop(1, theme.c2);
        ctx.fillStyle = logoGrad;
        ctx.fillText('🚀  CHRONOS CAPSULE', W / 2, pad + 80);

        /* خط فاصل */
        ctx.strokeStyle = theme.c1 + '33';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(W/2 - 200, pad + 115);
        ctx.lineTo(W/2 + 200, pad + 115);
        ctx.stroke();
        ctx.restore();

        /* ═══ 6) صندوق النص ═══ */
        const boxPad = 90;
        const boxTop = 240;
        const boxH = H - boxTop - 380;
        const boxW = W - boxPad * 2;

        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
        ctx.strokeStyle = theme.c1 + '44';
        ctx.lineWidth = 2;
        roundRect(ctx, boxPad, boxTop, boxW, boxH, 30);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        /* ═══ 7) الاقتباس الافتتاحي ═══ */
        ctx.save();
        ctx.font = `900 100px ${fontFamily}`;
        ctx.fillStyle = theme.c1 + '44';
        ctx.textAlign = 'start';
        ctx.textBaseline = 'top';
        ctx.fillText('"', boxPad + 40, boxTop + 20);
        ctx.restore();

        /* ═══ 8) نص الكبسولة ═══ */
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#f8fafc';

        const displayText = truncate(text, 180);
        const maxTextW = boxW - 120;
        const words = displayText.split(/\s+/);
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const fontSize = fitFont(ctx, testLine, maxTextW, 44, 24, fontFamily, '700');
            ctx.font = `700 ${fontSize}px ${fontFamily}`;
            if (ctx.measureText(testLine).width > maxTextW && currentLine) {
                lines.push({ text: currentLine, size: fontSize });
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            const fontSize = fitFont(ctx, currentLine, maxTextW, 44, 24, fontFamily, '700');
            lines.push({ text: currentLine, size: fontSize });
        }

        const lineH = 62;
        const totalH = lines.length * lineH;
        const startY = boxTop + boxH / 2 - totalH / 2 + lineH / 2;

        lines.forEach((line, i) => {
            ctx.font = `700 ${line.size}px ${fontFamily}`;
            ctx.fillText(line.text, W / 2, startY + i * lineH);
        });
        ctx.restore();

        /* ═══ 9) الاقتباس الختامي ═══ */
        ctx.save();
        ctx.font = `900 100px ${fontFamily}`;
        ctx.fillStyle = theme.c1 + '44';
        ctx.textAlign = 'end';
        ctx.textBaseline = 'bottom';
        ctx.fillText('"', W - boxPad - 40, boxTop + boxH - 20);
        ctx.restore();

        /* ═══ 10) معلومات الكبسولة ═══ */
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        /* الدولة + الشعور */
        const countryFlag = country ? ' ' + getFlag(country) : '';
        const moodLabel = isAr ? theme.label_ar : theme.label_en;
        const infoLine = `${theme.emoji}  ${moodLabel}  ·  ${country}${countryFlag}`.trim();
        ctx.font = `700 30px ${fontFamily}`;
        ctx.fillStyle = theme.c1;
        ctx.fillText(infoLine, W / 2, boxTop + boxH + 55);

        /* الكاتب */
        if (author && author !== 'مجهول' && author !== 'Anonymous' && author !== '—') {
            ctx.font = `500 22px ${fontFamily}`;
            ctx.fillStyle = '#94a3b8';
            const authorLine = (isAr ? 'بقلم: ' : 'By: ') + author;
            ctx.fillText(authorLine, W / 2, boxTop + boxH + 100);
        }
        ctx.restore();

        /* ═══ 11) العد التنازلي ═══ */
        const cd = getCountdown(arrivalAt);
        if (cd) {
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const cdY = H - 270;
            const cdW = 540;
            const cdH = 110;
            const cdX = (W - cdW) / 2;

            /* خلفية العد */
            ctx.fillStyle = theme.c1 + '22';
            ctx.strokeStyle = theme.c1 + '77';
            ctx.lineWidth = 2;
            roundRect(ctx, cdX, cdY, cdW, cdH, 24);
            ctx.fill();
            ctx.stroke();

            /* العنوان */
            ctx.fillStyle = theme.glow;
            ctx.font = `700 24px ${fontFamily}`;
            ctx.fillText(isAr ? '⏳  متبقٍ حتى الوصول' : '⏳  Time until arrival', W / 2, cdY + 32);

            /* الأرقام */
            ctx.fillStyle = '#ffffff';
            ctx.font = `900 44px ${fontFamily}`;
            const dLbl = isAr ? 'ي' : 'd';
            const hLbl = isAr ? 'س' : 'h';
            const mLbl = isAr ? 'د' : 'm';
            const timeStr = `${cd.days}${dLbl}   ${cd.hours}${hLbl}   ${cd.minutes}${mLbl}`;
            ctx.fillText(timeStr, W / 2, cdY + 78);

            ctx.restore();
        }

        /* ═══ 12) الرابط في الأسفل ═══ */
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 24px ${fontFamily}`;
        ctx.fillStyle = theme.c1;
        ctx.fillText('🔗  chronoscapsule.vercel.app', W / 2, H - 80);
        ctx.restore();

        /* ═══ إرجاع Blob URL ═══ */
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Failed to create image'));
                resolve(URL.createObjectURL(blob));
            }, 'image/png', 0.95);
        });
    }

    /* ═══ دالة: الحصول على علم الدولة ═══ */
    function getFlag(code) {
        if (!/^[A-Z]{2}$/.test(code)) return '';
        return code.replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt(0)));
    }

    /* ═══════════════════════════════════════════════════════════
       نافذة معاينة البطاقة
       ═══════════════════════════════════════════════════════════ */
    function openCardModal(options) {
        /* إزالة أي نافذة سابقة */
        const existing = document.getElementById('cardModal');
        if (existing) existing.remove();

        const isAr = options.lang === 'ar';
        const modal = document.createElement('div');
        modal.id = 'cardModal';
        modal.className = 'card-modal-overlay';
        modal.innerHTML = `
            <div class="card-modal">
                <button class="card-modal-close" id="cardModalClose" aria-label="Close" type="button">&times;</button>
                <div class="card-modal-head">
                    <span class="card-modal-title">${isAr ? '🎨 بطاقة الكبسولة' : '🎨 Capsule Card'}</span>
                    <span class="card-modal-sub">${isAr ? 'جاهزة للمشاركة' : 'Ready to share'}</span>
                </div>
                <div class="card-modal-preview" id="cardModalPreview">
                    <div class="card-loading">
                        <div class="card-spinner"></div>
                        <span>${isAr ? 'جاري التوليد...' : 'Generating...'}</span>
                    </div>
                </div>
                <div class="card-modal-actions" id="cardModalActions" style="display:none">
                    <button class="card-btn primary" id="cardDownloadBtn" type="button">
                        ⬇️ ${isAr ? 'تحميل' : 'Download'}
                    </button>
                    <button class="card-btn native" id="cardShareBtn" type="button">
                        📤 ${isAr ? 'مشاركة' : 'Share'}
                    </button>
                    <button class="card-btn copy" id="cardCopyBtn" type="button">
                        🔗 ${isAr ? 'نسخ الرابط' : 'Copy link'}
                    </button>
                </div>
                <div class="card-social-row" id="cardSocialRow" style="display:none">
                    <span class="card-social-label">${isAr ? 'أو شارك على:' : 'Or share on:'}</span>
                    <a class="card-social-btn wa" id="cardWa" target="_blank" rel="noopener" title="WhatsApp">📱</a>
                    <a class="card-social-btn tw" id="cardTw" target="_blank" rel="noopener" title="X">𝕏</a>
                    <a class="card-social-btn fb" id="cardFb" target="_blank" rel="noopener" title="Facebook">f</a>
                    <a class="card-social-btn tg" id="cardTg" target="_blank" rel="noopener" title="Telegram">✈️</a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('active'));

        const preview = modal.querySelector('#cardModalPreview');
        const actionsRow = modal.querySelector('#cardModalActions');
        const socialRow = modal.querySelector('#cardSocialRow');

        /* ═══ توليد البطاقة ═══ */
        generateCard(options).then(blobUrl => {
            const img = document.createElement('img');
            img.src = blobUrl;
            img.alt = 'Capsule Card';
            preview.innerHTML = '';
            preview.appendChild(img);
            actionsRow.style.display = 'flex';
            socialRow.style.display = 'flex';

            /* ─── تحميل ─── */
            modal.querySelector('#cardDownloadBtn').addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `chronos-capsule-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                if (typeof gtag === 'function') gtag('event', 'card_downloaded', { mood: options.mood, lang: options.lang });
            });

            /* ─── مشاركة أصلية ─── */
            modal.querySelector('#cardShareBtn').addEventListener('click', async () => {
                if (navigator.share && navigator.canShare) {
                    try {
                        const blob = await (await fetch(blobUrl)).blob();
                        const file = new File([blob], 'capsule.png', { type: 'image/png' });
                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                files: [file],
                                title: isAr ? 'كبسولة الزمن' : 'Chronos Capsule',
                                text: (options.text || '').slice(0, 100),
                                url: 'https://chronoscapsule.vercel.app'
                            });
                            if (typeof gtag === 'function') gtag('event', 'card_shared', { method: 'native', lang: options.lang });
                            return;
                        }
                    } catch (e) {}
                }
                /* fallback: تحميل */
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `chronos-capsule-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });

            /* ─── نسخ الرابط ─── */
            modal.querySelector('#cardCopyBtn').addEventListener('click', () => {
                const text = (options.text || '').slice(0, 100);
                const shareText = `${text}\n\n🔗 https://chronoscapsule.vercel.app`;
                navigator.clipboard.writeText(shareText).then(() => {
                    const btn = modal.querySelector('#cardCopyBtn');
                    const orig = btn.innerHTML;
                    btn.innerHTML = '✅ ' + (isAr ? 'تم النسخ!' : 'Copied!');
                    setTimeout(() => { btn.innerHTML = orig; }, 1500);
                }).catch(() => {});
                if (typeof gtag === 'function') gtag('event', 'card_link_copied', { lang: options.lang });
            });

            /* ─── سوشيال ─── */
            const shareUrl = encodeURIComponent('https://chronoscapsule.vercel.app');
            const shareTxt = encodeURIComponent((options.text || '').slice(0, 120) + '\n\n🚀 Chronos Capsule');

            modal.querySelector('#cardWa').href = `https://wa.me/?text=${shareTxt}%20${shareUrl}`;
            modal.querySelector('#cardTw').href = `https://twitter.com/intent/tweet?text=${shareTxt}&url=${shareUrl}`;
            modal.querySelector('#cardFb').href = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
            modal.querySelector('#cardTg').href = `https://t.me/share/url?url=${shareUrl}&text=${shareTxt}`;

            socialRow.querySelectorAll('a').forEach(a => {
                a.addEventListener('click', () => {
                    const method = a.className.match(/card-social-btn\s+(\w+)/);
                    if (typeof gtag === 'function') gtag('event', 'card_shared', {
                        method: method ? method[1] : 'social',
                        lang: options.lang
                    });
                });
            });

        }).catch(err => {
            console.error('Card generation failed:', err);
            preview.innerHTML = `<div style="color:#f87171;text-align:center;padding:40px;font-size:14px">${isAr ? 'تعذر توليد البطاقة' : 'Failed to generate card'}</div>`;
        });

        /* ═══ إغلاق النافذة ═══ */
        const close = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                const url = preview.querySelector('img')?.src;
                if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
                modal.remove();
            }, 300);
        };
        modal.querySelector('#cardModalClose').addEventListener('click', close);
        modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
        document.addEventListener('keydown', function esc(e) {
            if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
        });
    }

    /* ═══ التصدير ═══ */
    window.CardGenerator = {
        generate: generateCard,
        open: openCardModal,
        MOOD_THEMES: MOOD_THEMES
    };
})();