/* ═══════════════════════════════════════════════════════════
   CHRONOS CAPSULE — Card Generator (v3.0)
   متطابق مع هوية الموقع: Glassmorphism + Cosmic + Tajawal
   ألوان المشاعر متزامنة مع archive.css
   ═══════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    const __CC_DEBUG = location.hostname === 'localhost' ||
                       location.hostname === '127.0.0.1' ||
                       location.search.includes('debug');

    /* ═══ الأبعاد (4:5 مثالي للسوشيال) ═══ */
    const W = 1080;
    const H = 1350;

    /* ═══ ألوان المشاعر — متزامنة مع mood-* في archive.css ═══ */
    const MOOD_THEMES = {
        hope:       { c1: '#34d399', c2: '#10b981', emoji: '🌱', ar: 'أمل',    en: 'Hope' },
        nostalgia:  { c1: '#fbbf24', c2: '#d97706', emoji: '🌅', ar: 'حنين',   en: 'Nostalgia' },
        secret:     { c1: '#8b5cf6', c2: '#6d28d9', emoji: '🤫', ar: 'سر',     en: 'Secret' },
        confession: { c1: '#ef4444', c2: '#b91c1c', emoji: '🕯️', ar: 'اعتراف', en: 'Confession' },
        bold:       { c1: '#f97316', c2: '#c2410c', emoji: '🔥', ar: 'جرأة',   en: 'Bold' },
        love:       { c1: '#ec4899', c2: '#be185d', emoji: '💗', ar: 'حب',     en: 'Love' },
        dream:      { c1: '#06b6d4', c2: '#0e7490', emoji: '✨', ar: 'حلم',    en: 'Dream' },
        wisdom:     { c1: '#eab308', c2: '#a16207', emoji: '🦉', ar: 'حكمة',   en: 'Wisdom' }
    };

    const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

    /* ═══ أدوات مساعدة ═══ */
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.arcTo(x + w, y, x + w, y + r, r);
        ctx.lineTo(x + w, y + h - r);
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        ctx.lineTo(x, y + h);
        ctx.arcTo(x, y + h, x, y + h - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    function hexToRgba(hex, alpha) {
        const h = hex.replace('#', '');
        return `rgba(${parseInt(h.substring(0,2),16)},${parseInt(h.substring(2,4),16)},${parseInt(h.substring(4,6),16)},${alpha})`;
    }

    function truncate(text, max) {
        const chars = [...String(text || '')];
        return chars.length > max ? chars.slice(0, max - 1).join('').trim() + '…' : String(text || '');
    }

    function getCountdownData(createdISO, arrivalISO) {
        if (!arrivalISO) return null;
        const end = new Date(arrivalISO).getTime();
        const remaining = end - Date.now();
        if (remaining <= 0) return null;
        const start = createdISO ? new Date(createdISO).getTime() : (end - 30 * 864e5);
        const total = Math.max(1, end - start);
        const elapsed = Math.max(0, Date.now() - start);
        return { progress: Math.min(100, Math.max(0, (elapsed / total) * 100)), remaining };
    }

    async function waitForFonts() {
        try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
        const fontsToLoad = [
            '400 54px "Amiri"',
            '700 54px "Amiri"',
            'italic 500 50px "Playfair Display"',
            '400 22px "IBM Plex Mono"',
            '700 24px "Tajawal"',
            '500 24px "Tajawal"',
            '900 30px "Tajawal"'
        ];
        try { await Promise.all(fontsToLoad.map(f => document.fonts.load(f))); } catch (e) {}
        await new Promise(r => setTimeout(r, 250));
    }

    /* ═══ خلفية كونية — مطابقة لخلفية الموقع (body::before/::after) ═══ */
    function drawBackground(ctx, seed) {
        /* القاعدة — نفس لون body في archive.css */
        ctx.fillStyle = '#010103';
        ctx.fillRect(0, 0, W, H);

        /* السدم — نفس ألوان وتوزيع خلفية الموقع */
        const nebula1 = ctx.createRadialGradient(W*0.2, H*0.5, 0, W*0.2, H*0.5, W*0.7);
        nebula1.addColorStop(0, 'rgba(139,92,246,0.10)');
        nebula1.addColorStop(1, 'transparent');
        ctx.fillStyle = nebula1;
        ctx.fillRect(0, 0, W, H);

        const nebula2 = ctx.createRadialGradient(W*0.8, H*0.2, 0, W*0.8, H*0.2, W*0.6);
        nebula2.addColorStop(0, 'rgba(59,130,246,0.09)');
        nebula2.addColorStop(1, 'transparent');
        ctx.fillStyle = nebula2;
        ctx.fillRect(0, 0, W, H);

        /* النجوم — بذرة ثابتة مشتقة من النص */
        let s = seed || 12345;
        const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

        for (let i = 0; i < 220; i++) {
            const x = rand() * W, y = rand() * H;
            const r = rand() * 1.3 + 0.4;
            ctx.fillStyle = `rgba(255,255,255,${rand() * 0.55 + 0.15})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        /* 5 نجوم لامعة */
        for (let i = 0; i < 5; i++) {
            const x = rand() * W, y = rand() * H, R = 26 + rand() * 22;
            const glow = ctx.createRadialGradient(x, y, 0, x, y, R);
            glow.addColorStop(0, 'rgba(255,255,255,0.30)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2); ctx.fill();
        }
    }

    /* ═══ البطاقة الزجاجية ═══ */
    function drawGlassCard(ctx, x, y, w, h, theme, isArrived) {
        const color1 = isArrived ? '#34d399' : theme.c1;
        const color2 = isArrived ? '#10b981' : theme.c2;

        /* ظل التوهج الخارجي */
        ctx.save();
        ctx.shadowColor = hexToRgba(color1, 0.30);
        ctx.shadowBlur = 70;
        ctx.fillStyle = 'rgba(10,14,26,1)';
        roundRect(ctx, x, y, w, h, 32);
        ctx.fill();
        ctx.restore();

        /* جسم الزجاج */
        ctx.save();
        ctx.fillStyle = 'rgba(15,23,42,0.62)'; /* نفس .cap-item */
        roundRect(ctx, x, y, w, h, 32);
        ctx.fill();

        const sheen = ctx.createLinearGradient(x, y, x + w * 0.5, y + h);
        sheen.addColorStop(0, 'rgba(255,255,255,0.06)');
        sheen.addColorStop(0.5, 'rgba(255,255,255,0.015)');
        sheen.addColorStop(1, 'rgba(255,255,255,0.04)');
        ctx.fillStyle = sheen;
        roundRect(ctx, x, y, w, h, 32);
        ctx.fill();
        ctx.restore();

        /* الإطار المتوهج */
        ctx.save();
        const borderGrad = ctx.createLinearGradient(x, y, x + w, y + h);
        borderGrad.addColorStop(0, hexToRgba(color1, 0.9));
        borderGrad.addColorStop(0.5, hexToRgba(color2, 0.45));
        borderGrad.addColorStop(1, hexToRgba(color1, 0.9));
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 2;
        roundRect(ctx, x + 1, y + 1, w - 2, h - 2, 31);
        ctx.stroke();
        ctx.restore();

        /* وهج داخلي علوي */
        ctx.save();
        const innerGlow = ctx.createRadialGradient(x + w/2, y, 0, x + w/2, y, h * 0.55);
        innerGlow.addColorStop(0, hexToRgba(color1, 0.07));
        innerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = innerGlow;
        roundRect(ctx, x, y, w, h, 32);
        ctx.fill();
        ctx.restore();
    }

    /* ═══ Pill موحّد — يقيس ويرسم ويعيد العرض ═══ */
    function drawPill(ctx, x, y, text, opts) {
        const {
            bg = 'rgba(255,255,255,0.05)', border = 'rgba(255,255,255,0.12)',
            color = '#f8fafc', fontSize = 22, fontWeight = '700',
            fontFamily = '"Tajawal", sans-serif',
            padX = 20, glow = null
        } = opts;

        ctx.save();
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.direction = 'ltr';
        const tw = ctx.measureText(text).width;
        const w = tw + padX * 2;
        const h = fontSize + 22;

        if (glow) {
            ctx.shadowColor = glow;
            ctx.shadowBlur = 18;
        }
        ctx.fillStyle = bg;
        roundRect(ctx, x, y, w, h, h / 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = border;
        ctx.lineWidth = 1.5;
        roundRect(ctx, x + 0.75, y + 0.75, w - 1.5, h - 1.5, (h - 1.5) / 2);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + padX, y + h / 2 + 1);
        ctx.restore();

        return { w, h };
    }

    /* ═══ الاقتباس — بدون italic للعربية (يشوّه الخط) ═══ */
    function drawQuote(ctx, text, cx, cy, maxW, opts) {
        const { isAr, fontSize, lineH, color = '#f8fafc', quoteColor } = opts;

        ctx.save();
        ctx.direction = isAr ? 'rtl' : 'ltr';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const fontFamily = isAr ? '"Amiri", serif' : '"Playfair Display", serif';
        ctx.font = isAr ? `700 ${fontSize}px ${fontFamily}` : `italic 500 ${fontSize}px ${fontFamily}`;

        /* كسر النص لأسطر */
        const words = String(text || '').split(/\s+/);
        const lines = [];
        let current = '';
        for (const word of words) {
            const test = current ? current + ' ' + word : word;
            if (ctx.measureText(test).width > maxW && current) {
                lines.push(current);
                current = word;
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);

        const maxLines = 5;
        if (lines.length > maxLines) {
            lines.length = maxLines;
            lines[maxLines - 1] = truncate(lines[maxLines - 1], 42) + '…';
        }

        const totalH = lines.length * lineH;
        const startY = cy - totalH / 2 + lineH / 2;

        /* علامات اقتباس مائية بلون المشاعر */
        if (quoteColor) {
            ctx.save();
            ctx.font = `italic 500 ${isAr ? 170 : 200}px ${fontFamily}`;
            ctx.fillStyle = quoteColor;
            ctx.textAlign = 'left';
            ctx.fillText('"', cx - maxW / 2 - 24, startY - 34);
            ctx.textAlign = 'right';
            ctx.fillText('"', cx + maxW / 2 + 24, startY + totalH + 16);
            ctx.restore();
        }

        ctx.fillStyle = color;
        ctx.font = isAr ? `700 ${fontSize}px ${fontFamily}` : `italic 500 ${fontSize}px ${fontFamily}`;
        lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * lineH));

        ctx.restore();
        return totalH;
    }

    /* ═══ خط فاصل متدرج ═══ */
    function drawDivider(ctx, cx, y, w, color) {
        ctx.save();
        const grad = ctx.createLinearGradient(cx - w / 2, y, cx + w / 2, y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.2, color);
        grad.addColorStop(0.8, color);
        grad.addColorStop(1, 'transparent');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, y);
        ctx.lineTo(cx + w / 2, y);
        ctx.stroke();
        ctx.restore();
    }

    /* ═══ شريط التقدم ═══ */
    function drawProgressBar(ctx, x, y, w, h, progress, theme) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        roundRect(ctx, x, y, w, h, h / 2);
        ctx.fill();
        ctx.restore();

        const fillW = Math.max(h, (progress / 100) * w);
        ctx.save();
        const fillGrad = ctx.createLinearGradient(x, 0, x + fillW, 0);
        fillGrad.addColorStop(0, theme.c2);
        fillGrad.addColorStop(1, theme.c1);
        ctx.fillStyle = fillGrad;
        ctx.shadowColor = hexToRgba(theme.c1, 0.55);
        ctx.shadowBlur = 14;
        roundRect(ctx, x, y, fillW, h, h / 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.shadowColor = hexToRgba(theme.c1, 1);
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(x + fillW - 3, y + h / 2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /* ═══════════════ الدالة الرئيسية ═══════════════ */
    async function generateCard(options) {
        const {
            text = '', author = '', country = '',
            mood = 'hope', arrivalAt = null, createdAt = null,
            reads = 0, code = '', lang = 'ar'
        } = options || {};

        await waitForFonts();

        const theme = MOOD_THEMES[mood] || MOOD_THEMES.hope;
        const isAr = lang === 'ar';
        const isArrived = !arrivalAt || new Date(arrivalAt) <= new Date();

        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        /* 1) الخلفية */
        const seed = [...(text || '12345')].reduce((a, ch) => a + ch.charCodeAt(0), 0);
        drawBackground(ctx, seed);

        /* 2) البطاقة الزجاجية */
        const pad = 70;
        const cardX = pad, cardY = 100;
        const cardW = W - pad * 2;
        const cardH = H - 200;
        drawGlassCard(ctx, cardX, cardY, cardW, cardH, theme, isArrived);

        const innerPad = 54;
        const cx = cardX + cardW / 2;

        /* 3) الصف العلوي — Pill المشاعر + حالة الوصول */
        const topY = cardY + 50;
        const moodLabel = `${theme.emoji} ${isAr ? theme.ar : theme.en}`;
        const statusText = isArrived
            ? (isAr ? 'وصلت ✓' : 'ARRIVED ✓')
            : (isAr ? 'في المدار' : 'IN ORBIT');
        const statusColor = isArrived ? '#34d399' : theme.c1;

        /* قياس أولاً ثم توزيع من الحواف للداخل */
        ctx.font = '700 22px "Tajawal", sans-serif';
        const moodW = ctx.measureText(moodLabel).width + 40;
        ctx.font = '600 19px "IBM Plex Mono", monospace';
        const statusW = ctx.measureText(statusText).width + 40 + 16;

        if (isAr) {
            drawPill(ctx, cardX + cardW - innerPad - moodW, topY, moodLabel, {
                bg: hexToRgba(theme.c2, 0.16), border: hexToRgba(theme.c2, 0.5),
                color: theme.c1, fontSize: 22, glow: hexToRgba(theme.c2, 0.25)
            });
            drawPill(ctx, cardX + innerPad, topY + 1, statusText, {
                bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)',
                color: '#e2e8f0', fontSize: 19, fontWeight: '600',
                fontFamily: '"IBM Plex Mono", monospace'
            });
        } else {
            drawPill(ctx, cardX + innerPad, topY, moodLabel, {
                bg: hexToRgba(theme.c2, 0.16), border: hexToRgba(theme.c2, 0.5),
                color: theme.c1, fontSize: 22, glow: hexToRgba(theme.c2, 0.25)
            });
            drawPill(ctx, cardX + cardW - innerPad - statusW, topY + 1, statusText, {
                bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)',
                color: '#e2e8f0', fontSize: 19, fontWeight: '600',
                fontFamily: '"IBM Plex Mono", monospace'
            });
        }

        /* 4) الاقتباس — بطل البطاقة */
        drawQuote(ctx, truncate(text, 220), cx, cardY + cardH * 0.38, cardW - 170, {
            isAr,
            fontSize: isAr ? 54 : 50,
            lineH: isAr ? 94 : 80,
            quoteColor: hexToRgba(theme.c1, 0.22)
        });

        /* 5) فاصل + المؤلف + التاريخ */
        const divY = cardY + cardH * 0.585;
        drawDivider(ctx, cx, divY, cardW - 260, hexToRgba(theme.c1, 0.35));

        const authorName = author || (isAr ? 'مجهول' : 'Anonymous');
        const whenISO = arrivalAt || createdAt || new Date().toISOString();
        const whenDate = new Date(whenISO);
        let whenText;
        if (isAr) {
            whenText = `${whenDate.getDate()} ${AR_MONTHS[whenDate.getMonth()]} ${whenDate.getFullYear()}`;
        } else {
            whenText = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }).format(whenDate);
        }

        ctx.save();
        ctx.direction = isAr ? 'rtl' : 'ltr';
        ctx.font = '500 24px "Tajawal", sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            isAr ? `— ${authorName} · ${whenText}` : `${authorName} · ${whenText} —`,
            cx, divY + 52
        );

        /* 6) الإحصائيات */
        ctx.font = '400 20px "IBM Plex Mono", "Tajawal", monospace';
        ctx.fillStyle = '#64748b';
        const statsParts = [`👁 ${reads} ${isAr ? 'قراءة' : 'reads'}`];
        if (code) statsParts.push(`🔑 ${code.slice(0, 12)}`);
        ctx.fillText(statsParts.join('   ·   '), cx, divY + 100);
        ctx.restore();

        /* 7) شريط التقدم (في المدار فقط) */
        if (!isArrived && arrivalAt) {
            const cd = getCountdownData(createdAt, arrivalAt);
            const progress = cd ? cd.progress : 0;
            const progW = cardW - 220;
            const progX = cardX + 110;
            const progY = cardY + cardH * 0.775;
            const barH = 10;

            ctx.save();
            ctx.direction = isAr ? 'rtl' : 'ltr';
            ctx.font = '500 19px "Tajawal", sans-serif';
            ctx.fillStyle = '#94a3b8';
            ctx.textBaseline = 'middle';
            const lockLabel = isAr ? '⏳ مقفلة حتى موعد الوصول' : '⏳ Time locked';
            const pctLabel = `${Math.round(progress)}%`;

            if (isAr) {
                ctx.textAlign = 'right';
                ctx.fillText(lockLabel, cardX + cardW - 110, progY - 28);
                ctx.textAlign = 'left';
                ctx.font = '700 22px "IBM Plex Mono", monospace';
                ctx.fillStyle = theme.c1;
                ctx.fillText(pctLabel, progX, progY - 28);
            } else {
                ctx.textAlign = 'left';
                ctx.fillText(lockLabel, progX, progY - 28);
                ctx.textAlign = 'right';
                ctx.font = '700 22px "IBM Plex Mono", monospace';
                ctx.fillStyle = theme.c1;
                ctx.fillText(pctLabel, cardX + cardW - 110, progY - 28);
            }
            ctx.restore();

            drawProgressBar(ctx, progX, progY, progW, barH, progress, theme);

            /* Chip النسبة */
            const chipW = 88, chipH = 38;
            const chipCX = progX + (progress / 100) * progW;
            const chipX = Math.max(progX, Math.min(progX + progW - chipW, chipCX - chipW / 2));
            const chipY = progY + barH / 2 - chipH / 2;

            ctx.save();
            ctx.fillStyle = 'rgba(2,6,17,0.95)';
            ctx.shadowColor = hexToRgba(theme.c1, 0.5);
            ctx.shadowBlur = 16;
            roundRect(ctx, chipX, chipY, chipW, chipH, chipH / 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = hexToRgba(theme.c1, 0.6);
            ctx.lineWidth = 1.5;
            roundRect(ctx, chipX + 0.75, chipY + 0.75, chipW - 1.5, chipH - 1.5, (chipH - 1.5) / 2);
            ctx.stroke();
            ctx.font = '700 19px "IBM Plex Mono", monospace';
            ctx.fillStyle = theme.c1;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${Math.round(progress)}%`, chipX + chipW / 2, chipY + chipH / 2 + 1);
            ctx.restore();
        }

        /* 8) التذييل — الهوية + الرابط */
        const footY = cardY + cardH - 62;
        drawDivider(ctx, cx, footY - 34, 220, 'rgba(255,255,255,0.10)');

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.direction = 'ltr';
        ctx.font = '900 21px "Tajawal", sans-serif';
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText('⏳ CHRONOS CAPSULE', cx, footY - 2);
        ctx.font = '500 19px "IBM Plex Mono", monospace';
        ctx.fillStyle = hexToRgba(theme.c1, 0.8);
        ctx.fillText('chronoscapsule.vercel.app', cx, footY + 30);
        ctx.restore();

        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Failed to create image'));
                resolve(URL.createObjectURL(blob));
            }, 'image/png', 0.95);
        });
    }

    /* ═══ نافذة المعاينة — نفس المنطق، عناصر محسّنة ═══ */
    function openCardModal(options) {
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
                    <span class="card-modal-title">🎨 ${isAr ? 'بطاقة الكبسولة' : 'Capsule Card'}</span>
                    <span class="card-modal-sub">${isAr ? 'جاهزة للمشاركة مع العالم' : 'Ready to share with the world'}</span>
                </div>
                <div class="card-modal-preview" id="cardModalPreview">
                    <div class="card-loading">
                        <div class="card-spinner"></div>
                        <span>${isAr ? 'جاري توليد بطاقتك...' : 'Generating your card...'}</span>
                    </div>
                </div>
                <div class="card-modal-actions" id="cardModalActions" style="display:none">
                    <button class="card-btn primary" id="cardDownloadBtn" type="button">⬇️ ${isAr ? 'تحميل' : 'Download'}</button>
                    <button class="card-btn native" id="cardShareBtn" type="button">📤 ${isAr ? 'مشاركة' : 'Share'}</button>
                    <button class="card-btn copy" id="cardCopyBtn" type="button">🔗 ${isAr ? 'نسخ الرابط' : 'Copy link'}</button>
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

        generateCard(options).then(blobUrl => {
            const img = document.createElement('img');
            img.src = blobUrl;
            img.alt = 'Capsule Card';
            preview.innerHTML = '';
            preview.appendChild(img);
            actionsRow.style.display = 'flex';
            socialRow.style.display = 'flex';

            modal.querySelector('#cardDownloadBtn').addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `chronos-capsule-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                if (typeof gtag === 'function') gtag('event', 'card_downloaded', { mood: options.mood, lang: options.lang });
            });

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
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `chronos-capsule-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });

            modal.querySelector('#cardCopyBtn').addEventListener('click', () => {
                const shareText = `${(options.text || '').slice(0, 100)}\n\n🔗 https://chronoscapsule.vercel.app`;
                navigator.clipboard.writeText(shareText).then(() => {
                    const btn = modal.querySelector('#cardCopyBtn');
                    const orig = btn.innerHTML;
                    btn.innerHTML = '✅ ' + (isAr ? 'تم النسخ!' : 'Copied!');
                    setTimeout(() => { btn.innerHTML = orig; }, 1500);
                }).catch(() => {});
                if (typeof gtag === 'function') gtag('event', 'card_link_copied', { lang: options.lang });
            });

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
                        method: method ? method[1] : 'social', lang: options.lang
                    });
                });
            });
        }).catch(err => {
            if (__CC_DEBUG) console.error('Card generation failed:', err);
            preview.innerHTML = `<div style="color:#f87171;text-align:center;padding:40px;font-size:14px">${isAr ? 'تعذر توليد البطاقة' : 'Failed to generate card'}</div>`;
        });

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
