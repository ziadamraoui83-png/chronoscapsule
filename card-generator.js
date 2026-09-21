/* ═══════════════════════════════════════════════════════════
   CHRONOS CAPSULE — Card Generator (v3.0 — Stories/Status)
   توليد بطاقة فيرالية 9:16 للـ Stories و WhatsApp Status
   مستوحى من: Glassmorphism + Serif Quote + Cosmic
   ═══════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    /* ✅ Debug flag - فقط في localhost أو ?debug */
    const __CC_DEBUG = location.hostname === 'localhost' ||
                       location.hostname === '127.0.0.1' ||
                       location.search.includes('debug');

    /* ═══ الأبعاد — 9:16 للـ Stories ═══ */
    const W = 1080;
    const H = 1920;
    const PAD = 60;

    /* ═══ ألوان المشاعر ═══ */
    const MOOD_THEMES = {
        hope:       { c1: '#38bdf8', c2: '#0ea5e9', emoji: '💙', ar: 'أمل',    en: 'Hope' },
        nostalgia:  { c1: '#a78bfa', c2: '#8b5cf6', emoji: '💜', ar: 'حنين',   en: 'Nostalgia' },
        secret:     { c1: '#34d399', c2: '#10b981', emoji: '💚', ar: 'سر',     en: 'Secret' },
        confession: { c1: '#fbbf24', c2: '#f59e0b', emoji: '💛', ar: 'اعتراف', en: 'Confession' },
        bold:       { c1: '#f87171', c2: '#ef4444', emoji: '❤️', ar: 'جرأة',   en: 'Bold' }
    };

    /* ═══ خريطة الأشهر العربية ═══ */
    const AR_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

    /* ═══ أسئلة فضولية حسب نوع الكبسولة ═══ */
    const CURIOUS_Q = {
        public: {
            ar: 'ماذا لو قرأت رسالة من شخص لا تعرفه؟',
            en: 'What if you read a message from a stranger?'
        },
        private: {
            ar: 'رسالة تُفتح في يوم محدد',
            en: 'A message that opens on a specific day'
        }
    };

    /* ═══ أدوات مساعدة ═══ */
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

    function hexToRgba(hex, alpha) {
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function truncate(text, max) {
        const t = String(text || '');
        const chars = [...t];
        return chars.length > max ? chars.slice(0, max - 1).join('').trim() + '…' : t;
    }

    function flagOf(code) {
        return /^[A-Z]{2}$/.test(code)
            ? code.replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt(0)))
            : '🌍';
    }

    function getCountdownData(createdISO, arrivalISO) {
        if (!arrivalISO) return null;
        const end = new Date(arrivalISO).getTime();
        const now = Date.now();
        const remaining = end - now;
        if (remaining <= 0) return null;
        const start = createdISO ? new Date(createdISO).getTime() : (end - 30 * 864e5);
        const total = Math.max(1, end - start);
        const elapsed = Math.max(0, now - start);
        const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
        return { progress, remaining };
    }

    /* ═══ تنسيق التاريخ ═══ */
    function formatDate(isoString, isAr) {
        const d = new Date(isoString);
        if (isAr) {
            const day = d.getDate();
            const month = AR_MONTHS[d.getMonth()];
            const year = d.getFullYear();
            return `${day} ${month} ${year}`;
        }
        return new Intl.DateTimeFormat('en-GB', {
            year: 'numeric', month: 'short', day: 'numeric'
        }).format(d);
    }

    /* ═══ انتظار الخطوط ═══ */
    async function waitForFonts() {
        try {
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }
        } catch (e) {}
        const fontsToLoad = [
            'italic 400 40px "Amiri"',
            'italic 400 40px "Playfair Display"',
            '400 30px "IBM Plex Mono"',
            '700 30px "Tajawal"',
            '500 30px "Tajawal"'
        ];
        try {
            await Promise.all(fontsToLoad.map(f => document.fonts.load(f)));
        } catch (e) {}
        await new Promise(r => setTimeout(r, 250));
    }

    /* ═══ رسم مستطيل دائري مملوء + إطار ═══ */
    function drawGlassCard(ctx, x, y, w, h, theme, isArrived) {
        const color1 = isArrived ? '#34d399' : theme.c1;
        const color2 = isArrived ? '#10b981' : theme.c2;

        ctx.save();
        ctx.shadowColor = hexToRgba(color1, 0.35);
        ctx.shadowBlur = 60;
        ctx.fillStyle = 'rgba(13,18,33,1)';
        roundRect(ctx, x, y, w, h, 32);
        ctx.fill();
        ctx.restore();

        const bgGrad = ctx.createLinearGradient(x, y, x + w * 0.6, y + h);
        bgGrad.addColorStop(0, 'rgba(255,255,255,0.075)');
        bgGrad.addColorStop(0.34, 'rgba(255,255,255,0.028)');
        bgGrad.addColorStop(0.68, 'rgba(255,255,255,0.012)');
        bgGrad.addColorStop(1, 'rgba(255,255,255,0.05)');

        ctx.save();
        ctx.fillStyle = 'rgba(13,18,33,0.55)';
        roundRect(ctx, x, y, w, h, 32);
        ctx.fill();
        ctx.fillStyle = bgGrad;
        roundRect(ctx, x, y, w, h, 32);
        ctx.fill();
        ctx.restore();

        ctx.save();
        const borderGrad = ctx.createLinearGradient(x, y, x + w, y + h);
        borderGrad.addColorStop(0, color1);
        borderGrad.addColorStop(0.6, color2);
        borderGrad.addColorStop(1, color1);
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 2.5;
        roundRect(ctx, x + 1.25, y + 1.25, w - 2.5, h - 2.5, 31);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        const innerGlow = ctx.createRadialGradient(x + w / 2, y + h * 0.3, 0, x + w / 2, y + h * 0.3, w * 0.7);
        innerGlow.addColorStop(0, hexToRgba(color1, 0.06));
        innerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = innerGlow;
        roundRect(ctx, x, y, w, h, 32);
        ctx.fill();
        ctx.restore();
    }

    /* ═══ رسم Pill (Badge) ═══ */
    function drawPill(ctx, x, y, opts) {
        const { text, bg, border, color, fontSize = 22, paddingX = 18, paddingY = 10, fontFamily = '"Tajawal", sans-serif', fontWeight = '700', dot } = opts;
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        const textW = ctx.measureText(text).width;
        const dotW = dot ? 14 : 0;
        const pillW = textW + paddingX * 2 + dotW;
        const pillH = fontSize + paddingY * 2;

        ctx.save();
        ctx.fillStyle = bg;
        roundRect(ctx, x, y, pillW, pillH, pillH / 2);
        ctx.fill();
        ctx.strokeStyle = border;
        ctx.lineWidth = 1.5;
        roundRect(ctx, x + 0.75, y + 0.75, pillW - 1.5, pillH - 1.5, (pillH - 1.5) / 2);
        ctx.stroke();

        let textStartX = x + paddingX;
        if (dot) {
            ctx.fillStyle = dot;
            ctx.beginPath();
            ctx.arc(x + paddingX + 5, y + pillH / 2, 5, 0, Math.PI * 2);
            ctx.fill();
            textStartX += dotW;
        }

        ctx.fillStyle = color;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(text, textStartX, y + pillH / 2 + 1);
        ctx.restore();

        return { w: pillW, h: pillH };
    }

    /* ═══ رسم خط فاصل ═══ */
    function drawDivider(ctx, cx, y, w, color) {
        ctx.save();
        const grad = ctx.createLinearGradient(cx - w / 2, y, cx + w / 2, y);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.15, color);
        grad.addColorStop(0.85, color);
        grad.addColorStop(1, 'transparent');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, y);
        ctx.lineTo(cx + w / 2, y);
        ctx.stroke();
        ctx.restore();
    }

    /* ═══ رسم شريط التقدم ═══ */
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
        ctx.shadowColor = hexToRgba(theme.c1, 0.6);
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

    /* ═══ خلفية كونية ═══ */
    function drawCosmicBackground(ctx, seed) {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0a0e1a');
        bg.addColorStop(0.5, '#0f172a');
        bg.addColorStop(1, '#0a0e1a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        const nebula1 = ctx.createRadialGradient(W * 0.15, H * 0.2, 0, W * 0.15, H * 0.2, W * 0.6);
        nebula1.addColorStop(0, 'rgba(139,92,246,0.10)');
        nebula1.addColorStop(1, 'transparent');
        ctx.fillStyle = nebula1;
        ctx.fillRect(0, 0, W, H);

        const nebula2 = ctx.createRadialGradient(W * 0.9, H * 0.85, 0, W * 0.9, H * 0.85, W * 0.55);
        nebula2.addColorStop(0, 'rgba(58,225,255,0.08)');
        nebula2.addColorStop(1, 'transparent');
        ctx.fillStyle = nebula2;
        ctx.fillRect(0, 0, W, H);

        let s = seed || 12345;
        const rand = () => {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };

        ctx.save();
        for (let i = 0; i < 320; i++) {
            const x = rand() * W;
            const y = rand() * H;
            const r = rand() * 1.4 + 0.4;
            const a = rand() * 0.6 + 0.2;
            ctx.fillStyle = `rgba(255,255,255,${a})`;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        for (let i = 0; i < 8; i++) {
            const x = rand() * W;
            const y = rand() * H;
            const R = 30 + rand() * 25;
            const glow = ctx.createRadialGradient(x, y, 0, x, y, R);
            glow.addColorStop(0, 'rgba(255,255,255,0.35)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, R, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.beginPath();
            ctx.arc(x, y, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /* ═══ رسم أيقونة القفل ═══ */
    function drawLockIcon(ctx, cx, cy, size, color) {
        const bodyW = size * 0.9;
        const bodyH = size * 0.72;
        const bodyX = cx - bodyW / 2;
        const bodyY = cy - bodyH * 0.15;
        const arcR = size * 0.34;
        const arcStroke = size * 0.13;
        const shackleTop = bodyY - arcR * 1.1;

        ctx.save();

        /* توهج خارجي */
        ctx.shadowColor = hexToRgba(color, 0.55);
        ctx.shadowBlur = 38;

        /* جسم القفل */
        ctx.fillStyle = hexToRgba(color, 0.15);
        roundRect(ctx, bodyX, bodyY, bodyW, bodyH, size * 0.14);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = arcStroke * 0.9;
        roundRect(ctx, bodyX, bodyY, bodyW, bodyH, size * 0.14);
        ctx.stroke();

        ctx.restore();
        ctx.save();

        /* قوس القفل */
        ctx.strokeStyle = color;
        ctx.lineWidth = arcStroke;
        ctx.lineCap = 'round';
        ctx.shadowColor = hexToRgba(color, 0.55);
        ctx.shadowBlur = 28;
        ctx.beginPath();
        ctx.arc(cx, bodyY, arcR, Math.PI, 0, false);
        ctx.stroke();

        ctx.restore();
        ctx.save();

        /* دائرة الثقب */
        ctx.fillStyle = color;
        ctx.shadowColor = hexToRgba(color, 0.8);
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(cx, bodyY + bodyH * 0.38, size * 0.09, 0, Math.PI * 2);
        ctx.fill();

        /* خط الثقب السفلي */
        ctx.fillStyle = color;
        ctx.fillRect(cx - size * 0.045, bodyY + bodyH * 0.38, size * 0.09, size * 0.18);

        ctx.restore();
    }

    /* ═══ رسم نص متعدد الأسطر (مع دعم RTL) ═══ */
    function drawWrappedText(ctx, text, cx, cy, maxW, opts) {
        const {
            fontFamily = '"Tajawal", sans-serif',
            fontSize = 46,
            lineH = 68,
            color = '#f8fafc',
            maxLines = 4,
            align = 'center'
        } = opts;

        ctx.save();
        ctx.font = `italic 500 ${fontSize}px ${fontFamily}`;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';

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

        if (lines.length > maxLines) {
            lines.length = maxLines;
            lines[maxLines - 1] = truncate(lines[maxLines - 1] + '…', 38);
        }

        const totalH = lines.length * lineH;
        const startY = cy - totalH / 2 + lineH / 2;

        ctx.fillStyle = color;
        lines.forEach((line, i) => {
            ctx.fillText(line, cx, startY + i * lineH);
        });

        ctx.restore();
        return totalH;
    }

    /* ═══ رسم علامات الاقتباس المائية ═══ */
    function drawQuoteMarks(ctx, cx, cy, textH, maxW, fontFamily, color) {
        ctx.save();
        ctx.font = `italic 500 180px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('"', cx - maxW / 2 - 20, cy - textH / 2 - 60);
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('"', cx + maxW / 2 + 20, cy + textH / 2 + 60);
        ctx.restore();
    }

    /* ═══ الدالة الرئيسية — Stories (9:16) ═══ */
    async function generateCard(options) {
        const {
            text = '',
            author = '',
            country = '',
            mood = 'hope',
            arrivalAt = null,
            createdAt = null,
            reads = 0,
            code = '',
            lang = 'ar'
        } = options || {};

        await waitForFonts();

        const theme = MOOD_THEMES[mood] || MOOD_THEMES.hope;
        const isAr = lang === 'ar';
        const isArrived = !arrivalAt || new Date(arrivalAt) <= new Date();

        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        /* ═══ 1) الخلفية الكونية ═══ */
        const seed = String(text || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 12345;
        drawCosmicBackground(ctx, seed);

        /* ═══ 2) البطاقة الزجاجية ═══ */
        const cardPad  = 52;
        const cardX    = cardPad;
        const cardY    = cardPad + 20;
        const cardW    = W - cardPad * 2;
        const cardH    = H - cardPad * 2 - 20;
        drawGlassCard(ctx, cardX, cardY, cardW, cardH, theme, isArrived);

        const innerPad = 56;
        const cx       = cardX + cardW / 2;

        /* ─────────────────────────────────────────
           ══ 3) الشعار + العنوان (أعلى البطاقة) ══
           ───────────────────────────────────────── */
        /* أيقونة الموقع (رمز الوقت ⏳ كـ badge أنيق) */
        const logoY = cardY + 58;

        ctx.save();
        ctx.font = '700 38px "Tajawal", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        /* دائرة الشعار */
        const logoR = 38;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, logoY, logoR, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(theme.c1, 0.12);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(theme.c1, 0.45);
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();

        ctx.font = '400 40px "Tajawal"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⏳', cx, logoY + 1);
        ctx.restore();

        /* ── العنوان الرئيسي (ثنائي اللغة) ── */
        const titleY = logoY + logoR + 36;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        /* السطر العربي */
        ctx.font = '900 68px "Tajawal", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = hexToRgba(theme.c1, 0.5);
        ctx.shadowBlur = 22;
        ctx.fillText('رسالة إلى المستقبل', cx, titleY);

        /* السطر الإنجليزي */
        ctx.font = '400 italic 30px "Playfair Display", serif';
        ctx.fillStyle = hexToRgba(theme.c1, 0.8);
        ctx.shadowBlur = 10;
        ctx.fillText('Message to the Future', cx, titleY + 68);

        ctx.restore();

        /* خط فاصل رفيع */
        drawDivider(ctx, cx, titleY + 110, cardW * 0.55, hexToRgba(theme.c1, 0.35));

        /* ─────────────────────────────────────────
           ══ 4) عنصر القفل البصري ══
           ───────────────────────────────────────── */
        const lockCY = titleY + 220;
        const lockSize = 120;
        drawLockIcon(ctx, cx, lockCY, lockSize, theme.c1);

        /* نص "قُفلت حتى [التاريخ]" */
        const lockTextY = lockCY + lockSize * 0.7;
        const whenISO   = arrivalAt || createdAt || new Date().toISOString();
        const whenStr   = formatDate(whenISO, isAr);
        const lockLabel = isAr
            ? `قُفلت حتى  ${whenStr}`
            : `Locked until  ${whenStr}`;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `600 32px "IBM Plex Mono", "Tajawal", monospace`;
        ctx.fillStyle = hexToRgba(theme.c1, 0.9);
        ctx.shadowColor = hexToRgba(theme.c1, 0.4);
        ctx.shadowBlur = 14;
        ctx.fillText(lockLabel, cx, lockTextY + 14);
        ctx.restore();

        /* Pill حالة الكبسولة */
        const statusText  = isArrived
            ? (isAr ? '✦ وصلت' : '✦ ARRIVED')
            : (isAr ? '⟡ في المدار' : '⟡ IN ORBIT');
        const statusColor = isArrived ? '#34d399' : theme.c1;
        const pillResult  = drawPill(ctx, 0, 0, {
            text: statusText,
            bg: 'rgba(255,255,255,0.05)',
            border: hexToRgba(statusColor, 0.5),
            color: statusColor,
            fontSize: 24,
            fontWeight: '700',
            fontFamily: '"IBM Plex Mono", monospace',
            paddingX: 22,
            paddingY: 11
        });
        /* نرسم الـ pill في المنتصف */
        const pillX = cx - pillResult.w / 2;
        const pillY = lockTextY + 58;
        drawPill(ctx, pillX, pillY, {
            text: statusText,
            bg: 'rgba(255,255,255,0.05)',
            border: hexToRgba(statusColor, 0.5),
            color: statusColor,
            fontSize: 24,
            fontWeight: '700',
            fontFamily: '"IBM Plex Mono", monospace',
            paddingX: 22,
            paddingY: 11
        });

        /* خط فاصل */
        drawDivider(ctx, cx, pillY + pillResult.h + 44, cardW * 0.65, hexToRgba(theme.c1, 0.25));

        /* ─────────────────────────────────────────
           ══ 5) النص المقتطع (60 حرف) ══
           ───────────────────────────────────────── */
        const textAreaY    = pillY + pillResult.h + 80;
        const quoteFontSz  = isAr ? 52 : 46;
        const quoteFontFam = isAr
            ? '"Amiri", "Playfair Display", serif'
            : '"Playfair Display", "Amiri", serif';

        /* علامات اقتباس مائية */
        const quoteMarkColor = hexToRgba(theme.c2, 0.20);

        /* نقتطع أول 60 حرفًا */
        const truncatedText = truncate(text, 60);

        /* نرسم النص */
        const quoteH = drawWrappedText(ctx, truncatedText, cx, textAreaY + 90, cardW - 140, {
            fontFamily: quoteFontFam,
            fontSize: quoteFontSz,
            lineH: isAr ? 86 : 74,
            color: '#f8fafc',
            maxLines: 3
        });
        drawQuoteMarks(ctx, cx, textAreaY + 90, quoteH, cardW - 140, quoteFontFam, quoteMarkColor);

        /* "النص الكامل داخل الكبسولة" */
        const hintY = textAreaY + 90 + quoteH / 2 + 38;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `400 26px "Tajawal", sans-serif`;
        ctx.fillStyle = 'rgba(148,163,184,0.65)';
        const hintText = isAr
            ? '· · ·  النص الكامل داخل الكبسولة  · · ·'
            : '· · ·  Full text inside the capsule  · · ·';
        ctx.fillText(hintText, cx, hintY);
        ctx.restore();

        /* ─────────────────────────────────────────
           ══ 6) السؤال الفضولي ══
           ───────────────────────────────────────── */
        const questionY  = hintY + 68;
        const qType      = (options.isPublic === false || !options.isPublic) ? 'private' : 'public';
        const questionTxt = isAr ? CURIOUS_Q[qType].ar : CURIOUS_Q[qType].en;

        /* خلفية السؤال */
        const qBoxW = cardW - 120;
        const qBoxX = cardX + 60;
        const qBoxH = 90;
        const qBoxY = questionY - qBoxH / 2;

        ctx.save();
        ctx.fillStyle = hexToRgba(theme.c2, 0.10);
        roundRect(ctx, qBoxX, qBoxY, qBoxW, qBoxH, 18);
        ctx.fill();
        ctx.strokeStyle = hexToRgba(theme.c2, 0.28);
        ctx.lineWidth = 1.5;
        roundRect(ctx, qBoxX, qBoxY, qBoxW, qBoxH, 18);
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 30px "Tajawal", sans-serif`;
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(questionTxt, cx, questionY);
        ctx.restore();

        /* خط فاصل */
        drawDivider(ctx, cx, questionY + 64, cardW * 0.70, hexToRgba(theme.c1, 0.22));

        /* ─────────────────────────────────────────
           ══ 7) CTA (الدعوة للعمل) ══
           ───────────────────────────────────────── */
        const ctaY    = questionY + 118;
        const ctaBtnW = cardW - 140;
        const ctaBtnH = 100;
        const ctaBtnX = cardX + 70;

        /* زر CTA بتدرج لوني */
        ctx.save();
        const ctaGrad = ctx.createLinearGradient(ctaBtnX, ctaY, ctaBtnX + ctaBtnW, ctaY);
        ctaGrad.addColorStop(0, theme.c2);
        ctaGrad.addColorStop(1, theme.c1);
        ctx.fillStyle = ctaGrad;
        ctx.shadowColor = hexToRgba(theme.c1, 0.55);
        ctx.shadowBlur = 32;
        roundRect(ctx, ctaBtnX, ctaY, ctaBtnW, ctaBtnH, ctaBtnH / 2);
        ctx.fill();
        ctx.restore();

        /* نص الزر */
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '900 40px "Tajawal", sans-serif';
        ctx.fillStyle = '#0a0e1a';
        const ctaText = isAr ? '✦ اكتب كبسولتك الآن — مجانًا' : '✦ Write Your Capsule Now — Free';
        ctx.fillText(ctaText, cx, ctaY + ctaBtnH / 2);
        ctx.restore();

        /* رابط الموقع */
        const urlY = ctaY + ctaBtnH + 36;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '500 28px "IBM Plex Mono", monospace';
        ctx.fillStyle = hexToRgba(theme.c1, 0.95);
        ctx.shadowColor = hexToRgba(theme.c1, 0.35);
        ctx.shadowBlur = 10;
        ctx.fillText('🔗 chronoscapsule.vercel.app', cx, urlY);
        ctx.restore();

        /* اسم الموقع + شعار صغير */
        const brandY = urlY + 52;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '700 26px "Tajawal", "IBM Plex Mono", sans-serif';
        ctx.fillStyle = 'rgba(148,163,184,0.7)';
        ctx.fillText('⏳  Chronos Capsule', cx, brandY);
        ctx.restore();

        /* ─────────────────────────────────────────
           ══ 8) التذييل — المؤلف / التاريخ ══
           ───────────────────────────────────────── */
        drawDivider(ctx, cx, brandY + 38, cardW * 0.55, hexToRgba(theme.c1, 0.18));

        const footerY = brandY + 70;
        const authorName = author || (isAr ? 'مجهول' : 'Anonymous');
        const footerDate = formatDate(whenISO, isAr);
        const authorLine = isAr
            ? `بقلم ${authorName}  ·  ${footerDate}`
            : `by ${authorName}  ·  ${footerDate}`;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '400 24px "IBM Plex Mono", "Tajawal", monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText(authorLine, cx, footerY);
        ctx.restore();

        /* mood badge أسفل يسار (زخرفي) */
        const moodLabel = isAr ? theme.ar : theme.en;
        const moodBadgeY = footerY + 48;
        const moodResult = drawPill(ctx, 0, 0, {
            text: `${theme.emoji} ${moodLabel}`,
            bg: hexToRgba(theme.c2, 0.14),
            border: hexToRgba(theme.c2, 0.4),
            color: theme.c1,
            fontSize: 22,
            paddingX: 18,
            paddingY: 9
        });
        drawPill(ctx, cx - moodResult.w / 2, moodBadgeY, {
            text: `${theme.emoji} ${moodLabel}`,
            bg: hexToRgba(theme.c2, 0.14),
            border: hexToRgba(theme.c2, 0.4),
            color: theme.c1,
            fontSize: 22,
            paddingX: 18,
            paddingY: 9
        });

        /* إرجاع Blob URL */
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error('Failed to create image'));
                resolve(URL.createObjectURL(blob));
            }, 'image/png', 0.95);
        });
    }

    /* ═══ فتح النافذة المنبثقة ═══ */
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
                    <span class="card-modal-title">${isAr ? '🎨 بطاقة الكبسولة' : '🎨 Capsule Card'}</span>
                    <span class="card-modal-sub">${isAr ? 'جاهزة للمشاركة على Stories' : 'Ready for Stories & Status'}</span>
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

        const preview    = modal.querySelector('#cardModalPreview');
        const actionsRow = modal.querySelector('#cardModalActions');
        const socialRow  = modal.querySelector('#cardSocialRow');

        /* توليد البطاقة */
        generateCard(options).then(blobUrl => {
            const img = document.createElement('img');
            img.src = blobUrl;
            img.alt = 'Capsule Card';
            preview.innerHTML = '';
            preview.appendChild(img);
            actionsRow.style.display = 'flex';
            socialRow.style.display = 'flex';

            /* تحميل */
            modal.querySelector('#cardDownloadBtn').addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = `chronos-capsule-${Date.now()}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                if (typeof gtag === 'function') gtag('event', 'card_downloaded', { mood: options.mood, lang: options.lang });
            });

            /* مشاركة أصلية */
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

            /* نسخ الرابط */
            modal.querySelector('#cardCopyBtn').addEventListener('click', () => {
                const textSnippet = truncate(options.text || '', 100);
                const shareText = `${textSnippet}\n\n🔗 https://chronoscapsule.vercel.app`;
                navigator.clipboard.writeText(shareText).then(() => {
                    const btn = modal.querySelector('#cardCopyBtn');
                    const orig = btn.innerHTML;
                    btn.innerHTML = '✅ ' + (isAr ? 'تم النسخ!' : 'Copied!');
                    setTimeout(() => { btn.innerHTML = orig; }, 1500);
                }).catch(() => {});
                if (typeof gtag === 'function') gtag('event', 'card_link_copied', { lang: options.lang });
            });

            /* سوشيال */
            const shareUrl = encodeURIComponent('https://chronoscapsule.vercel.app');
            const shareTxt = encodeURIComponent(truncate(options.text || '', 120) + '\n\n🚀 Chronos Capsule');

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
            if (typeof __CC_DEBUG !== 'undefined' && __CC_DEBUG) {
                console.error('Card generation failed:', err);
            }
            preview.innerHTML = `<div style="color:#f87171;text-align:center;padding:40px;font-size:14px">${isAr ? 'تعذر توليد البطاقة' : 'Failed to generate card'}</div>`;
        });

        /* إغلاق */
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
