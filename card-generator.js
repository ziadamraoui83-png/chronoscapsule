/* ═══════════════════════════════════════════════════════════
   CHRONOS CAPSULE — Card Generator (v2.0)
   توليد بطاقة احترافية بـ Canvas
   مستوحى من: Glassmorphism + Serif Quote + Cosmic
   ═══════════════════════════════════════════════════════════ */
(function(){
    'use strict';

    /* ═══ الأبعاد ═══ */
    const W = 1080;
    const H = 1350;
    const PAD = 60;

    /* ═══ ألوان المشاعر ═══ */
    const MOOD_THEMES = {
        hope:       { c1: '#38bdf8', c2: '#0ea5e9', emoji: '💙', ar: 'أمل',    en: 'Hope' },
        nostalgia:  { c1: '#a78bfa', c2: '#8b5cf6', emoji: '💜', ar: 'حنين',   en: 'Nostalgia' },
        secret:     { c1: '#34d399', c2: '#10b981', emoji: '💚', ar: 'سر',     en: 'Secret' },
        confession: { c1: '#fbbf24', c2: '#f59e0b', emoji: '💛', ar: 'اعتراف', en: 'Confession' },
        bold:       { c1: '#f87171', c2: '#ef4444', emoji: '❤️', ar: 'جرأة',   en: 'Bold' }
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
        return t.length > max ? t.slice(0, max - 1).trim() + '…' : t;
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

    /* ═══ انتظار الخطوط ═══ */
    async function waitForFonts() {
        try {
            if (document.fonts && document.fonts.ready) {
                await document.fonts.ready;
            }
        } catch (e) {}
        /* جرب تحميل الخطوط المعينة */
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

        /* ظل خارجي متوهج (طبقتان) */
        ctx.save();
        ctx.shadowColor = hexToRgba(color1, 0.35);
        ctx.shadowBlur = 60;
        ctx.fillStyle = 'rgba(13,18,33,1)';
        roundRect(ctx, x, y, w, h, 28);
        ctx.fill();
        ctx.restore();

        /* الخلفية الزجاجية */
        const bgGrad = ctx.createLinearGradient(x, y, x + w * 0.6, y + h);
        bgGrad.addColorStop(0, 'rgba(255,255,255,0.075)');
        bgGrad.addColorStop(0.34, 'rgba(255,255,255,0.028)');
        bgGrad.addColorStop(0.68, 'rgba(255,255,255,0.012)');
        bgGrad.addColorStop(1, 'rgba(255,255,255,0.05)');

        ctx.save();
        ctx.fillStyle = 'rgba(13,18,33,0.55)';
        roundRect(ctx, x, y, w, h, 28);
        ctx.fill();

        ctx.fillStyle = bgGrad;
        roundRect(ctx, x, y, w, h, 28);
        ctx.fill();
        ctx.restore();

        /* الإطار المتوهج (2.5px) */
        ctx.save();
        const borderGrad = ctx.createLinearGradient(x, y, x + w, y + h);
        borderGrad.addColorStop(0, color1);
        borderGrad.addColorStop(0.6, color2);
        borderGrad.addColorStop(1, color1);

        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 2.5;
        roundRect(ctx, x + 1.25, y + 1.25, w - 2.5, h - 2.5, 27);
        ctx.stroke();
        ctx.restore();

        /* وهج داخلي */
        ctx.save();
        const innerGlow = ctx.createRadialGradient(x + w / 2, y + h * 0.3, 0, x + w / 2, y + h * 0.3, w * 0.7);
        innerGlow.addColorStop(0, hexToRgba(color1, 0.06));
        innerGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = innerGlow;
        roundRect(ctx, x, y, w, h, 28);
        ctx.fill();
        ctx.restore();
    }

    /* ═══ رسم Pill (Badge) ═══ */
    function drawPill(ctx, x, y, opts) {
        const { text, emoji, bg, border, color, fontSize = 22, paddingX = 18, paddingY = 10, fontFamily = '"Tajawal", sans-serif', fontWeight = '700', dot } = opts;
        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        const fullText = (emoji ? emoji + ' ' : '') + text;
        const textW = ctx.measureText(fullText).width;
        const dotW = dot ? 14 : 0;
        const pillW = textW + paddingX * 2 + dotW;
        const pillH = fontSize + paddingY * 2;

        ctx.save();
        /* Background */
        ctx.fillStyle = bg;
        roundRect(ctx, x, y, pillW, pillH, pillH / 2);
        ctx.fill();

        /* Border */
        ctx.strokeStyle = border;
        ctx.lineWidth = 1.5;
        roundRect(ctx, x + 0.75, y + 0.75, pillW - 1.5, pillH - 1.5, (pillH - 1.5) / 2);
        ctx.stroke();

        /* Dot (اختياري) */
        let textStartX = x + paddingX;
        if (dot) {
            ctx.fillStyle = dot;
            ctx.beginPath();
            ctx.arc(x + paddingX + 5, y + pillH / 2, 5, 0, Math.PI * 2);
            ctx.fill();
            textStartX += dotW;
        }

        /* Text */
        ctx.fillStyle = color;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(fullText, textStartX, y + pillH / 2 + 1);
        ctx.restore();

        return { w: pillW, h: pillH };
    }

    /* ═══ رسم الاقتباس (متعدد الأسطر) ═══ */
    function drawQuote(ctx, text, cx, cy, maxW, opts) {
        const { fontFamily = '"Playfair Display", serif', fontSize = 52, lineH = 76, color = '#f8fafc', quoteColor = null } = opts;

        ctx.save();
        ctx.font = `italic 500 ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        /* كسر النص إلى أسطر */
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

        /* حد أقصى 5 أسطر */
        const maxLines = 5;
        if (lines.length > maxLines) {
            lines.length = maxLines;
            lines[maxLines - 1] = truncate(lines[maxLines - 1] + '…', 40);
        }

        /* السطر الأول مع علامة الاقتباس المائية */
        const totalH = lines.length * lineH;
        const startY = cy - totalH / 2 + lineH / 2;

        /* علامات الاقتباس المائية (خلفية) */
        if (quoteColor) {
            ctx.save();
            ctx.font = `italic 500 200px ${fontFamily}`;
            ctx.fillStyle = quoteColor;
            ctx.textAlign = 'left';
            ctx.fillText('"', cx - maxW / 2 - 30, startY - 30);
            ctx.textAlign = 'right';
            ctx.fillText('"', cx + maxW / 2 + 30, startY + totalH + 20);
            ctx.restore();
        }

        /* النص */
        ctx.fillStyle = color;
        ctx.font = `italic 500 ${fontSize}px ${fontFamily}`;
        lines.forEach((line, i) => {
            ctx.fillText(line, cx, startY + i * lineH);
        });

        ctx.restore();
        return totalH;
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
        /* الخلفية (المسار) */
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        roundRect(ctx, x, y, w, h, h / 2);
        ctx.fill();
        ctx.restore();

        /* الملء */
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

        /* نقطة النهاية البيضاء */
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
        /* التدرج الأساسي */
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#0a0e1a');
        bg.addColorStop(0.5, '#0f172a');
        bg.addColorStop(1, '#0a0e1a');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        /* سديم بنفسجي (زوايا) */
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

        /* نجوم (بذرة ثابتة) */
        let s = seed || 12345;
        const rand = () => {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };

        /* 250 نجمة صغيرة */
        ctx.save();
        for (let i = 0; i < 250; i++) {
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

        /* 6 نجوم لامعة مع وهج */
        for (let i = 0; i < 6; i++) {
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

    /* ═══ الدالة الرئيسية ═══ */
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

        /* إنشاء Canvas */
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        /* ═══ 1) الخلفية الكونية ═══ */
        const seed = String(text || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 12345;
        drawCosmicBackground(ctx, seed);

        /* ═══ 2) البطاقة الزجاجية ═══ */
        const cardPad = 80;
        const cardX = cardPad;
        const cardY = cardPad + 30;
        const cardW = W - cardPad * 2;
        const cardH = H - cardPad * 2 - 30;
        drawGlassCard(ctx, cardX, cardY, cardW, cardH, theme, isArrived);

        /* ═══ 3) الصف العلوي: Pills ═══ */
        const innerPad = 50;
        const topY = cardY + 48;

        /* Mood pill (يسار في RTL، يمين في LTR) */
        const moodLabel = isAr ? theme.ar : theme.en;
        const moodPillX = isAr ? cardX + cardW - innerPad - 240 : cardX + innerPad;
        const moodPillResult = drawPill(ctx, moodPillX, topY, {
            text: moodLabel,
            emoji: theme.emoji,
            bg: hexToRgba(theme.c2, 0.18),
            border: hexToRgba(theme.c2, 0.5),
            color: theme.c1,
            fontSize: 22
        });

        /* Status pill (يمين في RTL، يسار في LTR) */
        const statusText = isArrived
            ? (isAr ? 'وصلت' : 'ARRIVED')
            : (isAr ? 'في المدار' : 'IN ORBIT');
        const statusColor = isArrived ? '#34d399' : theme.c1;
        const statusTextW = ctx.measureText(statusText).width;
        const statusPillX = isAr ? cardX + innerPad : cardX + cardW - innerPad - 200;
        drawPill(ctx, statusPillX, topY, {
            text: statusText,
            bg: 'rgba(255,255,255,0.05)',
            border: 'rgba(255,255,255,0.12)',
            color: '#f8fafc',
            fontSize: 20,
            fontWeight: '600',
            fontFamily: '"IBM Plex Mono", monospace',
            dot: statusColor
        });

        /* ═══ 4) الاقتباس (منتصف) ═══ */
        const quoteCX = cardX + cardW / 2;
        const quoteCY = cardY + cardH * 0.42;
        const quoteFontSize = isAr ? 54 : 50;
        const quoteFontFamily = isAr
            ? '"Amiri", "Playfair Display", serif'
            : '"Playfair Display", "Amiri", serif';

        drawQuote(ctx, truncate(text, 220), quoteCX, quoteCY, cardW - 160, {
            fontFamily: quoteFontFamily,
            fontSize: quoteFontSize,
            lineH: isAr ? 92 : 82,
            color: '#f8fafc',
            quoteColor: hexToRgba(theme.c2, 0.25)
        });

        /* ═══ 5) المؤلف والتاريخ ═══ */
        const authorY = cardY + cardH * 0.68;
        const authorName = author || (isAr ? 'مجهول' : 'Anonymous');
        const whenISO = arrivalAt || createdAt || new Date().toISOString();
        const whenText = new Intl.DateTimeFormat(isAr ? 'ar-DZ' : 'en-GB', {
            year: 'numeric', month: 'short', day: 'numeric'
        }).format(new Date(whenISO));

        ctx.save();
        ctx.font = '400 22px "IBM Plex Mono", "Tajawal", monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const authorLine = isAr
            ? `بقلم ${authorName} · ${whenText}`
            : `by ${authorName} · ${whenText}`;
        ctx.fillText(authorLine, quoteCX, authorY);
        ctx.restore();

        /* ═══ 6) الإحصائيات ═══ */
        const statsY = authorY + 52;
        ctx.save();
        ctx.font = '500 20px "IBM Plex Mono", "Tajawal", monospace';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const readsLabel = isAr ? 'قراءة' : 'reads';
        const statsParts = [`👁️ ${reads} ${readsLabel}`];
        if (code) {
            statsParts.push(`🔑 ${code.slice(0, 12)}`);
        }
        const statsText = statsParts.join('   ·   ');
        ctx.fillText(statsText, quoteCX, statsY);
        ctx.restore();

        /* ═══ 7) شريط التقدم (فقط إن كان في المدار) ═══ */
        if (!isArrived && arrivalAt) {
            const cd = getCountdownData(createdAt, arrivalAt);
            const progress = cd ? cd.progress : 0;
            const progY = cardY + cardH * 0.79;
            const progW = cardW - 200;
            const progX = cardX + 100;
            const barH = 10;

            /* التسميات */
            ctx.save();
            ctx.font = '500 18px "IBM Plex Mono", "Tajawal", monospace';
            ctx.fillStyle = '#94a3b8';
            ctx.textBaseline = 'middle';

            if (isAr) {
                ctx.textAlign = 'right';
                ctx.fillText(`⏳ مقفلة حتى الوصول`, cardX + cardW - 100, progY - 22);
                ctx.textAlign = 'left';
                ctx.fillStyle = theme.c1;
                ctx.font = '700 22px "IBM Plex Mono", monospace';
                ctx.fillText(`${Math.round(progress)}%`, cardX + 100, progY - 22);
            } else {
                ctx.textAlign = 'left';
                ctx.fillText(`⏳ Time locked`, cardX + 100, progY - 22);
                ctx.textAlign = 'right';
                ctx.fillStyle = theme.c1;
                ctx.font = '700 22px "IBM Plex Mono", monospace';
                ctx.fillText(`${Math.round(progress)}%`, cardX + cardW - 100, progY - 22);
            }
            ctx.restore();

            /* الشريط */
            drawProgressBar(ctx, progX, progY, progW, barH, progress, theme);

            /* علامة النسبة (Chip على الشريط) */
            const chipW = 90;
            const chipH = 40;
            const chipCX = progX + (progress / 100) * progW;
            const chipX = Math.max(progX, Math.min(progX + progW - chipW, chipCX - chipW / 2));
            const chipY = progY + barH / 2 - chipH / 2;

            ctx.save();
            /* خلفية الـ chip */
            ctx.fillStyle = 'rgba(9,13,26,0.95)';
            ctx.shadowColor = hexToRgba(theme.c1, 0.5);
            ctx.shadowBlur = 16;
            roundRect(ctx, chipX, chipY, chipW, chipH, chipH / 2);
            ctx.fill();
            ctx.restore();

            /* إطار الـ chip */
            ctx.save();
            ctx.strokeStyle = hexToRgba(theme.c1, 0.6);
            ctx.lineWidth = 1.5;
            roundRect(ctx, chipX + 0.75, chipY + 0.75, chipW - 1.5, chipH - 1.5, (chipH - 1.5) / 2);
            ctx.stroke();
            ctx.restore();

            /* نص الـ chip */
            ctx.save();
            ctx.font = '700 20px "IBM Plex Mono", monospace';
            ctx.fillStyle = theme.c1;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${Math.round(progress)}%`, chipX + chipW / 2, chipY + chipH / 2 + 1);
            ctx.restore();
        }

        /* ═══ 8) التذييل (رابط الموقع) ═══ */
        ctx.save();
        ctx.font = '500 22px "IBM Plex Mono", "Tajawal", monospace';
        ctx.fillStyle = hexToRgba(theme.c1, 0.85);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔗 chronoscapsule.vercel.app', W / 2, cardY + cardH - 45);
        ctx.restore();

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

            /* سوشيال */
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