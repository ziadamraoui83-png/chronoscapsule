/* ═══════════════════════════════════════════════════════════
   CHRONOS CAPSULE — script.js (نسخة مصحّحة شاملة)
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    let scene, camera, renderer, controls, planet, stars;

    let isZooming = false;
    let zoomTargetVector = new THREE.Vector3();

    let rotFactor = 1, rotTarget = 1;
    let fitDist = 21;
    const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ═══ أدوات مساعدة ═══ */
    const $ = id => document.getElementById(id);
        /* ═══ Google Analytics Event Tracker ═══ */
    function trackEvent(eventName, params = {}) {
        try {
            if (typeof gtag === 'function') {
                gtag('event', eventName, params);
            }
        } catch (e) {}
    }

    /* حماية كاملة من XSS — تهرّب كل الرموز الخطرة */
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[c]));

    /* ═══ ألوان المشاعر ═══ */
    const MOOD_COLORS = { hope: 0x38bdf8, nostalgia: 0xa78bfa, secret: 0x34d399, confession: 0xfbbf24, bold: 0xf87171 };
    const MOOD_CSS    = { hope: '#38bdf8', nostalgia: '#a78bfa', secret: '#34d399', confession: '#fbbf24', bold: '#f87171' };

    /* ═══ إعدادات الاتصال — مفاتيح حقيقية ═══ */
    const CC_CONFIG = {
        SUPABASE_URL: 'https://sylnhrtgrxfacskjaxlq.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5bG5ocnRncnhmYWNza2pheGxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MTA4MTcsImV4cCI6MjEwNDM4NjgxN30.gPFS04us1m7L4wZn0nvioctVQw86M7vEy2y3V5BELYQ'
    };
    const sb = (CC_CONFIG.SUPABASE_URL && window.supabase)
        ? supabase.createClient(CC_CONFIG.SUPABASE_URL, CC_CONFIG.SUPABASE_ANON_KEY) : null;

    function getDeviceHash() {
        let h = localStorage.getItem('cc_device');
        if (!h) {
            const a = crypto.getRandomValues(new Uint8Array(16));
            h = [...a].map(b => b.toString(16).padStart(2, '0')).join('');
            localStorage.setItem('cc_device', h);
        }
        return h;
    }
    function detectLang(t) { return /[\u0600-\u06FF]/.test(t) ? 'ar' : 'en'; }

    /* ═══ خريطة الدول ═══ */
    const COUNTRY_INFO = {
        DZ:{lat:28.03,lng:1.66,name:'الجزائر 🇩🇿'}, SA:{lat:24.71,lng:46.68,name:'السعودية 🇸🇦'},
        EG:{lat:26.82,lng:30.80,name:'مصر 🇪🇬'}, MA:{lat:31.79,lng:-7.09,name:'المغرب 🇲🇦'},
        TN:{lat:33.89,lng:9.54,name:'تونس 🇹🇳'}, AE:{lat:23.42,lng:53.85,name:'الإمارات 🇦🇪'},
        QA:{lat:25.35,lng:51.18,name:'قطر 🇶🇦'}, KW:{lat:29.31,lng:47.48,name:'الكويت 🇰🇼'},
        LY:{lat:26.34,lng:17.23,name:'ليبيا 🇱🇾'}, MR:{lat:20.26,lng:-13.00,name:'موريتانيا 🇲🇷'},
        IQ:{lat:33.22,lng:43.68,name:'العراق 🇮🇶'}, JO:{lat:31.95,lng:35.93,name:'الأردن 🇯🇴'},
        PS:{lat:31.95,lng:35.23,name:'فلسطين 🇵🇸'}, LB:{lat:33.85,lng:35.86,name:'لبنان 🇱🇧'},
        SY:{lat:34.80,lng:38.99,name:'سوريا 🇸🇾'}, SD:{lat:12.86,lng:30.22,name:'السودان 🇸🇩'},
        YE:{lat:15.55,lng:48.52,name:'اليمن 🇾🇪'}, OM:{lat:21.47,lng:55.98,name:'عُمان 🇴🇲'},
        BH:{lat:26.07,lng:50.56,name:'البحرين 🇧🇭'}, TR:{lat:39.00,lng:35.40,name:'تركيا 🇹🇷'},
        US:{lat:39.80,lng:-98.60,name:'الولايات المتحدة 🇺🇸'}, CA:{lat:56.13,lng:-106.35,name:'كندا 🇨🇦'},
        MX:{lat:23.63,lng:-102.55,name:'المكسيك 🇲🇽'}, BR:{lat:-14.24,lng:-51.93,name:'البرازيل 🇧🇷'},
        AR:{lat:-38.42,lng:-63.62,name:'الأرجنتين 🇦🇷'}, GB:{lat:54.00,lng:-2.50,name:'المملكة المتحدة 🇬🇧'},
        FR:{lat:46.60,lng:2.40,name:'فرنسا 🇫🇷'}, DE:{lat:51.17,lng:10.45,name:'ألمانيا 🇩🇪'},
        ES:{lat:40.46,lng:-3.75,name:'إسبانيا 🇪🇸'}, IT:{lat:41.87,lng:12.57,name:'إيطاليا 🇮🇹'},
        CH:{lat:46.80,lng:8.23,name:'سويسرا 🇨🇭'}, BE:{lat:50.50,lng:4.47,name:'بلجيكا 🇧🇪'},
        NL:{lat:52.13,lng:5.29,name:'هولندا 🇳🇱'}, PT:{lat:39.40,lng:-8.22,name:'البرتغال 🇵🇹'},
        SE:{lat:60.13,lng:18.64,name:'السويد 🇸🇪'}, NO:{lat:60.47,lng:8.47,name:'النرويج 🇳🇴'},
        RU:{lat:55.75,lng:37.62,name:'روسيا 🇷🇺'}, IN:{lat:20.59,lng:78.96,name:'الهند 🇮🇳'},
        PK:{lat:30.37,lng:69.35,name:'باكستان 🇵🇰'}, ID:{lat:-0.79,lng:113.92,name:'إندونيسيا 🇮🇩'},
        MY:{lat:4.21,lng:101.98,name:'ماليزيا 🇲🇾'}, CN:{lat:35.86,lng:104.20,name:'الصين 🇨🇳'},
        JP:{lat:36.20,lng:138.25,name:'اليابان 🇯🇵'}, KR:{lat:35.91,lng:127.77,name:'كوريا الجنوبية 🇰🇷'},
        AU:{lat:-25.27,lng:133.78,name:'أستراليا 🇦🇺'}, NG:{lat:9.08,lng:8.68,name:'نيجيريا 🇳🇬'},
        ZA:{lat:-30.56,lng:22.94,name:'جنوب أفريقيا 🇿🇦'}, SN:{lat:14.50,lng:-14.45,name:'السنغال 🇸🇳'},
        OTHER:{lat:0,lng:0,name:'فضاء آخر 🌍'}
    };
    const countryInfo = c => COUNTRY_INFO[c] || COUNTRY_INFO.OTHER;
    window.COUNTRY_INFO = COUNTRY_INFO;

    /* آمن: تطبيق الدول عبر i18n.js إن كان متاحًا */
    if (window.CCI18N && typeof window.CCI18N.applyCountries === 'function') {
        window.CCI18N.applyCountries();
    }

    /* ═══ طبقة التخزين ═══ */
    const CapsuleStore = {
        online: !!sb,
        key: 'chronos_capsules_v1',
        async load() {
            if (!this.online) {
                try {
                    const list = JSON.parse(localStorage.getItem(this.key)) || [];
                    return list.filter(m => !m.arrivalISO || new Date(m.arrivalISO) <= new Date());
                } catch (e) { return []; }
            }
            let goldenId = null;
            let goldenData = null;
            try {
                const { data: gData } = await sb.rpc('get_golden_capsule');
                if (gData && gData.length) {
                    goldenId = gData[0].o_id;
                    goldenData = gData[0];
                }
            } catch (e) {}

            const { data, error } = await sb.from('capsules')
                .select('id,text,author,country,mood,arrival_at')
                .order('arrival_at', { ascending: false }).limit(200);

            if (error) { console.warn('CapsuleStore.load:', error.message); return []; }

            let loaded = data.map(r => {
                const ci = countryInfo(r.country);
                return { id: 'db_' + r.id, dbId: r.id, text: r.text,
                         author: r.author || CCI18N.t('anon_name'),
                         country: r.country, mood: r.mood, lat: ci.lat, lng: ci.lng, isGolden: r.id === goldenId };
            });

            if (goldenData && !loaded.find(m => m.dbId === goldenId)) {
                const ci = countryInfo(goldenData.o_country);
                loaded.push({
                     id: 'db_' + goldenId, dbId: goldenId, text: goldenData.o_text,
                     author: goldenData.o_author || CCI18N.t('anon_name'),
                     country: goldenData.o_country, mood: goldenData.o_mood, lat: ci.lat, lng: ci.lng, isGolden: true
                });
            }
            return loaded;
        },
        async save(msg) {
            const ci = countryInfo(msg.country);
            const full = { ...msg, name: CCI18N.countryLabel(msg.country), lat: ci.lat, lng: ci.lng };
            if (!this.online) {
                try {
                    const list = JSON.parse(localStorage.getItem(this.key)) || [];
                    list.push(full);
                    localStorage.setItem(this.key, JSON.stringify(list));
                } catch (e) {}
                return { code: null };
            }
            const isPriv = !!msg.arrivalISO;
            const { data, error } = await sb.rpc('create_capsule', {
                p_text: msg.text, p_author: msg.author, p_country: msg.country,
                p_mood: msg.mood || 'hope', p_mode: isPriv ? 'private' : 'public',
                p_lang: detectLang(msg.text), p_arrival_at: msg.arrivalISO || null,
                p_theme_id: null, p_device_hash: getDeviceHash()
            });
            if (error) { console.error('CC:', error); throw new Error(CCI18N.err(error.message)); }
            try {
                const codes = JSON.parse(localStorage.getItem('cc_my_codes') || '[]');
                codes.push(data);
                localStorage.setItem('cc_my_codes', JSON.stringify(codes.slice(-100)));
            } catch (e) {}
            return { code: data };
        },
        async translateCapsule(id, targetLang) {
            if (!this.online) return Promise.resolve(null);
            try {
                const { data, error } = await sb.functions.invoke('translate-capsule', {
                    body: { id, target_lang: targetLang }
                });
                if (error) throw error;
                return data?.translation || null;
            } catch (e) {
                console.error('Translation failed:', e);
                return null;
            }
        },
        readCapsule(dbId) { return this.online ? sb.rpc('read_capsule', { p_id: dbId }) : Promise.resolve(); },
        report(dbId, why) {
            if (!this.online) return Promise.resolve(false);
            return sb.rpc('report_capsule', { p_id: dbId, p_reason: why })
                     .then(r => !r.error).catch(() => false);
        }
    };

    /* ملاحظة: طبقة الصوت المحيطي (AudioContext) أُزيلت لأنها لم تكن تُنتج صوتًا فعليًا.
       إن أردت إضافتها لاحقًا، استخدم <audio> element أو Tone.js بشكل صريح. */

    /* ═══ الرسائل الابتدائية ═══ */
    const seedMessages = [
        { id: 1, country: 'DZ', name: 'الجزائر 🇩🇿', text: 'سلام من أرض الشهداء والمحبة إلى جميع سكان الأرض!', author: 'رياض', lat: 28.0339, lng: 1.6596 },
        { id: 2, country: 'SA', name: 'السعودية 🇸🇦', text: 'اللهم احفظ أمتنا ويسر لكل حالم طريقه نحو المستقبل ✨', author: 'سارة', lat: 24.7136, lng: 46.6753 },
        { id: 3, country: 'EG', name: 'مصر 🇪🇬', text: 'من أهرامات أم الدنيا، أتمنى للجميع معانقة أحلامهم 🚀', author: 'أحمد', lat: 26.8206, lng: 30.8025 },
        { id: 4, country: 'MA', name: 'المغرب 🇲🇦', text: 'كبسولة سلام ومحبة عبر الأطلسي والكون 🌊', author: 'ياسين', lat: 31.7917, lng: -7.0926 },
        { id: 5, country: 'TN', name: 'تونس 🇹🇳', text: 'أجمل الأيام هي التي لم نعشها بعد، تفاءلوا دائماً 💫', author: 'أنس', lat: 33.8869, lng: 9.5375 },
        { id: 6, country: 'AE', name: 'الإمارات 🇦🇪', text: 'الطموح ليس له حدود، كما هذا الفضاء اللانهائي!', author: 'فاطمة', lat: 23.4241, lng: 53.8478 },
        { id: 101, country: 'US', name: 'الولايات المتحدة 🇺🇸', text: 'من مدينة التي لا تنام… أحلامنا أطول من ناطحات السحاب وأبعد من القمر!', author: 'Michael', lat: 40.7128, lng: -74.006 },
        { id: 102, country: 'JP', name: 'اليابان 🇯🇵', text: 'تحية من أرض الشمس المشرقة، نسير بخطى هادئة نحو النجوم 🌸', author: 'Yuki', lat: 36.2048, lng: 138.2529 },
        { id: 103, country: 'BR', name: 'البرازيل 🇧🇷', text: 'من قلب الأمازون ترتفع رسالة تخلط إيقاع السامبا بمسار المذنبات 🎵', author: 'Lucas', lat: -14.235, lng: -51.9253 },
        { id: 104, country: 'FR', name: 'فرنسا 🇫🇷', text: 'من مدينة النور، نرسل نورًا صغيرًا ليكمّل مداره في الكون ✨', author: 'Claire', lat: 48.8566, lng: 2.3522 },
        { id: 105, country: 'TR', name: 'تركيا 🇹🇷', text: 'بين قارتين وقلب واحد… ينبض من إسطنبول نحو درب التبانة', author: 'Emre', lat: 41.0082, lng: 28.9784 },
        { id: 106, country: 'IN', name: 'الهند 🇮🇳', text: 'من بلد الألوان ومليار حلم، أمنيتي تصل لأول نجم أراه الليلة ⭐', author: 'Priya', lat: 20.5937, lng: 78.9629 },
        { id: 107, country: 'DE', name: 'ألمانيا 🇩🇪', text: 'الدقة تصنع الصواريخ، والحلم يحدد وجهتها 🚀', author: 'Jonas', lat: 52.52, lng: 13.405 },
        { id: 108, country: 'GB', name: 'المملكة المتحدة 🇬🇧', text: 'من جزيرة الضباب، حيث المطر لا يمنع الحلم بالسماء الصافية', author: 'Oliver', lat: 51.5074, lng: -0.1278 },
        { id: 109, country: 'NG', name: 'نيجيريا 🇳🇬', text: 'من قلب أفريقيا النابض: أعظم القصص لم تُكتب بعد… وربما تكتبها كبسولتك!', author: 'Amara', lat: 9.082, lng: 8.6753 },
        { id: 110, country: 'KR', name: 'كوريا الجنوبية 🇰🇷', text: 'من سيول النابضة، موجة ترتفع من الأرض حتى حافة المجرة 🌊', author: 'Minji', lat: 37.5665, lng: 126.978 },
        { id: 111, country: 'AU', name: 'أستراليا 🇦🇺', text: 'من تحت سماء الصليب الجنوبي، نراقب معكم نفس النجوم ونتقاسم الأحلام', author: 'Jack', lat: -33.8688, lng: 151.2093 },
        { id: 112, country: 'MX', name: 'المكسيك 🇲🇽', text: 'من أرض المايا، شعبٌ نظر إلى النجوم قبل آلاف السنين ولم يتوقف', author: 'Diego', lat: 19.4326, lng: -99.1332 }
    ];

    const activeMessages = [...seedMessages];
    const labelElements = [];
    const meteors = [];
    let toastTimer = null, tooltipTarget = null;

    const tooltip = document.getElementById('msgTooltip');
    const labelsContainer = document.getElementById('labels-container');

    /* ═══ مراجع DOM مبكّرة (لتجنّب TDZ) ═══ */
    const messageModal = document.getElementById('messageModal');
    const deepModal = document.getElementById('deepModal');

    /* ═══ أدوات واجهة ═══ */
    function showToast(msg, ico = '🚀') {
        const t = document.getElementById('ccToast');
        if (!t) return;
        t.querySelector('.ico').textContent = ico;
        t.querySelector('.txt').textContent = msg;
        t.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
    }
    function hideTooltip() { tooltip.classList.remove('show'); tooltipTarget = null; }
    function updateCounter() {
        document.getElementById('capsuleCount').textContent = activeMessages.length;
    }

    /* ═══════════════════════════════════════════════════════════
       إعداد Three.js
       ═══════════════════════════════════════════════════════════ */
    function initThreeJS() {
        const isMobile = matchMedia('(max-width: 768px)').matches || /Mobi|Android/i.test(navigator.userAgent);
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x010103);

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.getElementById('planet-viewport').appendChild(renderer.domElement);

        /* ═══ إضاءة محسّنة — النصف المظلم مرئي أكثر ═══ */
scene.add(new THREE.AmbientLight(0xffffff, 1.1));

/* ضوء رئيسي (من الأمام-يمين) */
const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
dirLight.position.set(5, 3, 5);
scene.add(dirLight);

/* ضوء مُكمّل (من الخلف-يسار) — يُنير الجانب المظلم */
const fillLight = new THREE.DirectionalLight(0x88aaff, 0.7);
fillLight.position.set(-5, -2, -3);
scene.add(fillLight);

/* ضوء خفيف من الأسفل — يوحي بانعكاس الغلاف الجوي */
const bottomLight = new THREE.PointLight(0x3AE1FF, 0.4, 30);
bottomLight.position.set(0, -8, 0);
scene.add(bottomLight);

        const textureLoader = new THREE.TextureLoader();
        let earthTexture = null;
        try {
            earthTexture = textureLoader.load('https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/planets/earth_atmos_2048.jpg');
        } catch (e) { earthTexture = null; }
        const geom = new THREE.SphereGeometry(5, isMobile ? 48 : 64, isMobile ? 48 : 64);
        const mat = new THREE.MeshStandardMaterial({ map: earthTexture, roughness: 0.6, metalness: 0.1 });
        planet = new THREE.Mesh(geom, mat);
        scene.add(planet);

        const starsGeom = new THREE.BufferGeometry();
        const starsCount = isMobile ? 1200 : 2500;
        const starPositions = new Float32Array(starsCount * 3);
        const starColors = new Float32Array(starsCount * 3);
        for (let i = 0; i < starsCount; i++) {
            const r = 60 + Math.random() * 120;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            starPositions[i * 3 + 2] = r * Math.cos(phi);
            const color = new THREE.Color();
            color.setHSL(Math.random() * 0.2 + 0.5, 0.6, Math.random() * 0.4 + 0.6);
            starColors[i * 3] = color.r;
            starColors[i * 3 + 1] = color.g;
            starColors[i * 3 + 2] = color.b;
        }
        starsGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starsGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        const starsMat = new THREE.PointsMaterial({ size: 0.35, vertexColors: true, transparent: true, opacity: 0.9 });
        stars = new THREE.Points(starsGeom, starsMat);
        scene.add(stars);
                /* 🌌 تحسينات الكون */
        addCosmicDecorations();

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; controls.dampingFactor = 0.05;
        controls.enableZoom = true; controls.enablePan = false;
        controls.enableRotate = true;

        controls.addEventListener('start', () => { isZooming = false; hideTooltip(); });

        function applyFit() {
            const vFov = THREE.MathUtils.degToRad(camera.fov);
            const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
            const fov = Math.min(vFov, hFov);
            const dist = 5.6 / Math.sin(fov * 0.34);
            fitDist = dist;
            controls.minDistance = dist * 0.45;
            controls.maxDistance = dist * 1.5;
            return dist;
        }

        const baseDist = applyFit();
        camera.position.set(0, baseDist * 0.10, baseDist * 1.26);
        if (!REDUCE) { zoomTargetVector.set(0, 0, baseDist); isZooming = true; }
        else camera.position.set(0, 0, baseDist);
        let prevFit = baseDist;

        document.getElementById('zoomInBtn').addEventListener('click', () => {
            const dist = Math.max(controls.minDistance, camera.position.distanceTo(controls.target) * 0.7);
            const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
            zoomTargetVector.copy(controls.target).add(dir.multiplyScalar(dist));
            isZooming = true;
        });
        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            const dist = Math.min(controls.maxDistance, camera.position.distanceTo(controls.target) * 1.4);
            const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
            zoomTargetVector.copy(controls.target).add(dir.multiplyScalar(dist));
            isZooming = true;
        });

        activeMessages.forEach(msg => createMessageMarker(msg));
        updateCounter();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            const f = applyFit();
            const d = camera.position.distanceTo(controls.target);
            const nd = THREE.MathUtils.clamp(d * (f / prevFit), controls.minDistance, controls.maxDistance);
            camera.position.sub(controls.target).setLength(nd).add(controls.target);
            prevFit = f;
        });

        const clock = new THREE.Clock();
        let frameCount = 0;

        function animate() {
            requestAnimationFrame(animate);
            const dt = Math.min(clock.getDelta(), 0.05);
            frameCount++;
            const elapsed = clock.getElapsedTime();
            updateCosmicDecorations(dt, elapsed);

            const d = camera.position.distanceTo(controls.target);
            const t = THREE.MathUtils.clamp((d - controls.minDistance) / (controls.maxDistance - controls.minDistance), 0, 1);
            rotTarget = 0.05 + 0.95 * (t * t * (3 - 2 * t));
            rotFactor += (rotTarget - rotFactor) * 0.06;

            planet.rotation.y += 0.0006 * rotFactor;
            stars.rotation.y += 0.00003 * rotFactor;

            if (isZooming) {
                camera.position.lerp(zoomTargetVector, 0.08);
                if (camera.position.distanceTo(zoomTargetVector) < 0.1) isZooming = false;
            }

            for (let i = meteors.length - 1; i >= 0; i--) {
                const m = meteors[i];
                m.life += dt;
                const p = m.life / m.dur;
                if (p >= 1) {
                    scene.remove(m.line);
                    m.line.geometry.dispose(); m.line.material.dispose();
                    meteors.splice(i, 1);
                } else {
                    m.line.position.addScaledVector(m.dir, m.speed * dt);
                    m.line.material.opacity = Math.sin(p * Math.PI) * 0.9;
                }
            }

            controls.update();

            /* تحسين الأداء: تحديث المواضع كل إطارين فقط */
            if (frameCount % 2 === 0) updateLabelsPosition();

            renderer.render(scene, camera);
        }
        animate();
    }
        /* ═══════════════════════════════════════════════════════════
       🌌 تحسينات الكون — سديم + كواكب + شمس + حزام كويكبات
       ═══════════════════════════════════════════════════════════ */
    let cosmicObjects = { planets: [], asteroidBelt: null, nebulae: [], sun: null };

    function addCosmicDecorations() {
        const isMobile = matchMedia('(max-width: 768px)').matches;

        /* ═══ 1) السديم (Nebula) — 3 سحابات ═══ */
        const nebulaColors = [
            { color: 0x8b5cf6, pos: [-60, 40, -120], size: 140 },
            { color: 0x3b82f6, pos: [80, -30, -150], size: 160 },
            { color: 0xec4899, pos: [-40, -60, -130], size: 120 }
        ];

        nebulaColors.forEach(({ color, pos, size }) => {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 256;
            const ctx = canvas.getContext('2d');
            const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
            grad.addColorStop(0, `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.35)`);
            grad.addColorStop(0.5, `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.12)`);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 256, 256);

            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;

            const sprite = new THREE.Sprite(
                new THREE.SpriteMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0.7,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            sprite.position.set(pos[0], pos[1], pos[2]);
            sprite.scale.set(size, size, 1);
            scene.add(sprite);
            cosmicObjects.nebulae.push({ sprite, baseOpacity: 0.7, speed: 0.02 + Math.random() * 0.03 });
        });

        /* ═══ 2) الشمس البعيدة ═══ */
        const sunGroup = new THREE.Group();

        /* الكرة الأساسية */
        const sunCore = new THREE.Mesh(
            new THREE.SphereGeometry(3, 24, 24),
            new THREE.MeshBasicMaterial({ color: 0xffe6a3 })
        );
        sunGroup.add(sunCore);

        /* هالة خارجية */
        const sunCanvas = document.createElement('canvas');
        sunCanvas.width = sunCanvas.height = 256;
        const sctx = sunCanvas.getContext('2d');
        const sgrad = sctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        sgrad.addColorStop(0, 'rgba(255, 230, 163, 0.9)');
        sgrad.addColorStop(0.3, 'rgba(255, 180, 100, 0.5)');
        sgrad.addColorStop(0.7, 'rgba(255, 120, 50, 0.15)');
        sgrad.addColorStop(1, 'rgba(255, 100, 50, 0)');
        sctx.fillStyle = sgrad;
        sctx.fillRect(0, 0, 256, 256);

        const sunTexture = new THREE.CanvasTexture(sunCanvas);
        const sunHalo = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: sunTexture,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            })
        );
        sunHalo.scale.set(24, 24, 1);
        sunGroup.add(sunHalo);

        sunGroup.position.set(120, 60, -180);
        scene.add(sunGroup);
        cosmicObjects.sun = sunGroup;

        /* ═══ 3) الكواكب الصغيرة — 3 كواكب ═══ */
        const planetDefs = [
            { color: 0xd4a574, radius: 0.9, orbitRadius: 55, speed: 0.0008, tilt: 0.3 },
            { color: 0x6ba6d8, radius: 1.2, orbitRadius: 70, speed: 0.0005, tilt: -0.4 },
            { color: 0xc88b6b, radius: 0.7, orbitRadius: 45, speed: 0.0012, tilt: 0.6 }
        ];

        planetDefs.forEach((def, i) => {
            const geometry = new THREE.SphereGeometry(def.radius, isMobile ? 16 : 24, isMobile ? 16 : 24);
            const material = new THREE.MeshStandardMaterial({
                color: def.color,
                roughness: 0.7,
                metalness: 0.2,
                emissive: def.color,
                emissiveIntensity: 0.08
            });
            const planetMesh = new THREE.Mesh(geometry, material);
            planetMesh.userData = {
                orbitRadius: def.orbitRadius,
                speed: def.speed,
                angle: Math.random() * Math.PI * 2,
                tilt: def.tilt
            };
            scene.add(planetMesh);
            cosmicObjects.planets.push(planetMesh);

            /* قمر صغير يدور حول بعض الكواكب */
            if (i === 0 || i === 1) {
                const moonGeo = new THREE.SphereGeometry(def.radius * 0.25, 12, 12);
                const moonMat = new THREE.MeshBasicMaterial({ color: 0xa0a0a0 });
                const moon = new THREE.Mesh(moonGeo, moonMat);
                moon.userData = { parent: planetMesh, orbitRadius: def.radius * 3, speed: 0.05, angle: 0 };
                scene.add(moon);
                planetMesh.userData.moon = moon;
            }
        });

        /* ═══ 4) حزام الكويكبات — نقط صغيرة تدور ═══ */
        const asteroidCount = isMobile ? 80 : 160;
        const asteroidGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(asteroidCount * 3);
        const asteroidData = [];

        for (let i = 0; i < asteroidCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 30 + Math.random() * 15;
            const y = (Math.random() - 0.5) * 3;
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            asteroidData.push({ angle, radius, y, speed: 0.0005 + Math.random() * 0.0008 });
        }

        asteroidGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const asteroidMat = new THREE.PointsMaterial({
            color: 0xa0a0c0,
            size: 0.15,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true
        });
        const asteroidBelt = new THREE.Points(asteroidGeo, asteroidMat);
        asteroidBelt.userData = { data: asteroidData };
        scene.add(asteroidBelt);
        cosmicObjects.asteroidBelt = asteroidBelt;

        /* ═══ 5) إضاءة إضافية للكواكب الصغيرة ═══ */
        const sunLight = new THREE.PointLight(0xffe6a3, 1.5, 500);
        sunLight.position.copy(sunGroup.position);
        scene.add(sunLight);
    }

    function updateCosmicDecorations(dt, elapsed) {
        /* ═══ السديم — نبض خفيف ═══ */
        cosmicObjects.nebulae.forEach(n => {
            n.sprite.material.opacity = n.baseOpacity + Math.sin(elapsed * n.speed) * 0.15;
        });

        /* ═══ الشمس — نبض ═══ */
        if (cosmicObjects.sun) {
            const pulse = 1 + Math.sin(elapsed * 1.5) * 0.08;
            cosmicObjects.sun.children[1].scale.set(24 * pulse, 24 * pulse, 1);
        }

        /* ═══ الكواكب — دوران ═══ */
        cosmicObjects.planets.forEach(planet => {
            const d = planet.userData;
            d.angle += d.speed * dt * 60;
            planet.position.x = Math.cos(d.angle) * d.orbitRadius;
            planet.position.z = Math.sin(d.angle) * d.orbitRadius;
            planet.position.y = Math.sin(d.angle * 0.5) * 5 * Math.sin(d.tilt);
            planet.rotation.y += 0.005;

            /* القمر يدور حول الكوكب */
            if (d.moon) {
                d.moon.userData.angle += d.moon.userData.speed * dt * 60;
                const ma = d.moon.userData.angle;
                d.moon.position.x = planet.position.x + Math.cos(ma) * d.moon.userData.orbitRadius;
                d.moon.position.z = planet.position.z + Math.sin(ma) * d.moon.userData.orbitRadius;
                d.moon.position.y = planet.position.y + Math.sin(ma * 2) * 0.5;
            }
        });

        /* ═══ حزام الكويكبات — دوران بطيء ═══ */
        if (cosmicObjects.asteroidBelt) {
            const geo = cosmicObjects.asteroidBelt.geometry;
            const pos = geo.attributes.position.array;
            const data = cosmicObjects.asteroidBelt.userData.data;

            data.forEach((a, i) => {
                a.angle += a.speed * dt * 60;
                pos[i * 3] = Math.cos(a.angle) * a.radius;
                pos[i * 3 + 2] = Math.sin(a.angle) * a.radius;
            });
            geo.attributes.position.needsUpdate = true;
        }
    }

    function spawnMeteor() {
        if (document.visibilityState !== 'visible') return;
        const R = () => THREE.MathUtils.randFloatSpread(1);
        const start = new THREE.Vector3(R(), R() * 0.6 + 0.2, R()).normalize()
            .multiplyScalar(THREE.MathUtils.randFloat(55, 95));
        const dir = new THREE.Vector3(R(), R() * 0.5, R()).normalize();
        const len = THREE.MathUtils.randFloat(5, 9);
        const geo = new THREE.BufferGeometry().setFromPoints(
            [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0).addScaledVector(dir, -len)]);
        const line = new THREE.Line(geo, new THREE.LineBasicMaterial({
            color: 0x9fd9ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending
        }));
        line.position.copy(start);
        scene.add(line);
        meteors.push({ line, dir, speed: THREE.MathUtils.randFloat(28, 45), life: 0, dur: THREE.MathUtils.randFloat(1.1, 1.9) });
    }
    if (REDUCE) {
        /* في وضع تقليل الحركة: لا نُحدّث الكواكب */
        updateCosmicDecorations = function() {};
    }
    if (!REDUCE) {
        (function meteorLoop() {
            setTimeout(() => { spawnMeteor(); meteorLoop(); }, 5000 + Math.random() * 7000);
        })();
    }

    function get3DPos(lat, lng, radius = 5.05) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        return new THREE.Vector3(
            -(radius * Math.sin(phi) * Math.cos(theta)),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
    }

    function createMessageMarker(msg) {
        const localPos = get3DPos(msg.lat, msg.lng);
        const isG = msg.isGolden;
        const moodColor = isG ? 0xffd700 : (MOOD_COLORS[msg.mood] || 0x60a5fa);

        const markerMesh = new THREE.Mesh(
            new THREE.SphereGeometry(isG ? 0.12 : 0.08, 16, 16),
            new THREE.MeshBasicMaterial({ color: moodColor })
        );
        markerMesh.position.copy(localPos);
        planet.add(markerMesh);

        const halo = new THREE.Mesh(
            new THREE.SphereGeometry(isG ? 0.22 : 0.13, 12, 12),
            new THREE.MeshBasicMaterial({ color: moodColor, transparent: true, opacity: isG ? 0.45 : 0.25, blending: THREE.AdditiveBlending, depthWrite: false })
        );
        halo.position.copy(localPos);
        planet.add(halo);

        const labelDiv = document.createElement('div');
        labelDiv.className = 'country-label spawn' + (isG ? ' golden' : '');
        labelDiv.style.setProperty('--mood', isG ? '#fbbf24' : (MOOD_CSS[msg.mood] || '#60a5fa'));
        labelDiv.innerHTML = `<span>📍</span> ${esc(CCI18N.countryLabel(msg.country))}`;
        labelsContainer.appendChild(labelDiv);
        setTimeout(() => labelDiv.classList.remove('spawn'), 700);

        labelDiv.addEventListener('click', (e) => {
            e.stopPropagation();
                        trackEvent('capsule_viewed', {
                country: msg.country,
                mood: msg.mood || 'hope',
                is_golden: !!isG,
                lang: CCI18N.lang
            });
            const flag = msg.dbId
                ? `<button class="action-btn report-btn" data-db="${msg.dbId}" title="${CCI18N.lang === 'ar' ? 'بلاغ عن محتوى غير لائق' : 'Report inappropriate content'}">🚩</button>`
                : '';
            const tLang = CCI18N.lang === 'ar' ? 'ar' : 'en';
            const transUrl = `https://translate.google.com/?sl=auto&tl=${tLang}&text=${encodeURIComponent(msg.text)}&op=translate`;
            const translateBtn = `<a href="${transUrl}" target="_blank" rel="noopener" class="action-btn translate-btn" data-translate title="${CCI18N.lang === 'ar' ? 'ترجم' : 'Translate'}">🔤</a>`;
            const goldenHeader = isG ? `<div style="color:#fbbf24;font-size:12px;margin-bottom:6px;font-weight:900;text-align:center;">🌟 ${CCI18N.lang === 'ar' ? 'الكبسولة الذهبية اليوم' : 'Golden Capsule of the Day'} 🌟</div>` : '';

            /* ✅ إصلاح XSS: استخدام esc() على كل المحتوى القادم من المستخدم */
            tooltip.innerHTML = `
                ${goldenHeader}
                <h4>${esc(CCI18N.countryLabel(msg.country))} ${flag} ${translateBtn}</h4>
                <p>"${esc(msg.text)}"</p>
                <div class="author">${esc(CCI18N.t('by'))}: ${esc(msg.author)}</div>
            `;
            tooltip.style.left = labelDiv.style.left;
            tooltip.style.top = labelDiv.style.top;
            tooltip.classList.add('show');
            tooltipTarget = labelDiv;

            const rbtn = tooltip.querySelector('.report-btn');
            if (rbtn) rbtn.addEventListener('click', async (ev) => {
                ev.stopPropagation();
                rbtn.disabled = true; rbtn.textContent = '…';
                const ok = await CapsuleStore.report(parseInt(rbtn.dataset.db, 10), 'user_report');
                rbtn.textContent = ok ? '✓' : '!';
                const ar = CCI18N.lang === 'ar';
                showToast(ok ? (ar ? 'شكرًا، تم تسجيل البلاغ وسيُراجع 🙏' : 'Thanks, your report was recorded 🙏')
                             : (ar ? 'تعذر إرسال البلاغ الآن' : 'Could not submit the report now'),
                          ok ? '🚩' : '⚠️');
            });
        });

        labelElements.push({ mesh: markerMesh, element: labelDiv, localPos: localPos, msg: msg });
    }

    document.addEventListener('click', () => hideTooltip());

    function updateLabelsPosition() {
        const cameraDistance = camera.position.distanceTo(controls.target);
        const showLabels = cameraDistance < fitDist * 0.62;

        labelElements.forEach(item => {
            const worldPos = new THREE.Vector3();
            item.mesh.getWorldPosition(worldPos);

            const cameraDir = camera.position.clone().sub(controls.target).normalize();
            const pointDir = worldPos.clone().sub(controls.target).normalize();
            const dot = cameraDir.dot(pointDir);

            if (dot > 0.2 && showLabels) {
                const screenPos = worldPos.clone().project(camera);
                const x = (screenPos.x * .5 + .5) * window.innerWidth;
                const y = (-(screenPos.y * .5) + .5) * window.innerHeight;
                item.element.style.left = `${x}px`;
                item.element.style.top = `${y}px`;
                item.element.style.opacity = '1';
                item.element.style.pointerEvents = 'auto';
            } else {
                item.element.style.opacity = '0';
                item.element.style.pointerEvents = 'none';
            }
        });

        if (tooltipTarget) {
            if (tooltipTarget.style.opacity === '0') hideTooltip();
            else {
                tooltip.style.left = tooltipTarget.style.left;
                tooltip.style.top = tooltipTarget.style.top;
            }
        }
    }

    function buildCapsuleMesh(mood) {
        const c = MOOD_COLORS[mood] || 0x60a5fa;
        const g = new THREE.Group();
        const bodyMat = new THREE.MeshBasicMaterial({ color: c });
        const glowMat = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false });
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.26, 10), bodyMat);
        cyl.rotation.x = Math.PI / 2;
        const capGeo = new THREE.SphereGeometry(0.09, 10, 10);
        const nose = new THREE.Mesh(capGeo, bodyMat); nose.position.z = 0.13;
        const tail = new THREE.Mesh(capGeo, bodyMat); tail.position.z = -0.13;
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.17, 10, 10), glowMat);
        g.add(cyl, nose, tail, glow);
        return g;
    }

    function launchMessage(countryCode, text, author, mood) {
        const targetInfo = COUNTRY_INFO[countryCode] || COUNTRY_INFO.OTHER;
        const endPos = get3DPos(targetInfo.lat, targetInfo.lng);
        const startPos = endPos.clone().normalize().multiplyScalar(15);

        const capsule = buildCapsuleMesh(mood);
        capsule.position.copy(startPos);
        capsule.lookAt(endPos);
        scene.add(capsule);

        const TRAIL_N = 14;
        const trailPositions = new Float32Array(TRAIL_N * 3);
        for (let i = 0; i < TRAIL_N; i++) {
            trailPositions[i * 3] = startPos.x;
            trailPositions[i * 3 + 1] = startPos.y;
            trailPositions[i * 3 + 2] = startPos.z;
        }
        const trailColors = new Float32Array(TRAIL_N * 3);
        for (let i = 0; i < TRAIL_N; i++) {
            const f = 1 - i / TRAIL_N;
            trailColors[i * 3] = 0.42 * f; trailColors[i * 3 + 1] = 0.65 * f; trailColors[i * 3 + 2] = 1 * f;
        }
        const trailGeo = new THREE.BufferGeometry();
        trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
        trailGeo.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));
        const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({
            vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending
        }));
        scene.add(trail);

        const startTime = performance.now();
        const duration = 2.0;

        function animateLaunch(time) {
            const elapsed = (time - startTime) / 1000;
            const p = Math.max(0, Math.min(elapsed / duration, 1));
            capsule.position.lerpVectors(startPos, endPos, 1 - Math.pow(1 - p, 3));

            for (let i = TRAIL_N - 1; i > 0; i--) {
                trailPositions[i * 3] = trailPositions[(i - 1) * 3];
                trailPositions[i * 3 + 1] = trailPositions[(i - 1) * 3 + 1];
                trailPositions[i * 3 + 2] = trailPositions[(i - 1) * 3 + 2];
            }
            trailPositions[0] = capsule.position.x;
            trailPositions[1] = capsule.position.y;
            trailPositions[2] = capsule.position.z;
            trailGeo.attributes.position.needsUpdate = true;

            if (p < 1) {
                requestAnimationFrame(animateLaunch);
            } else {
                scene.remove(capsule);
                const fs = performance.now();
                (function fadeTrail() {
                    const fp = (performance.now() - fs) / 300;
                    if (fp < 1) { trail.material.opacity = 0.85 * (1 - fp); requestAnimationFrame(fadeTrail); }
                    else { scene.remove(trail); trail.geometry.dispose(); trail.material.dispose(); }
                })();

                const newMsg = {
                    id: Date.now(),
                    country: countryCode,
                    name: CCI18N.countryLabel(countryCode),
                    text: text,
                    author: author,
                    mood: mood,
                    lat: targetInfo.lat,
                    lng: targetInfo.lng
                };
                createMessageMarker(newMsg);
                activeMessages.push(newMsg);
                updateCounter();
            }
        }
        requestAnimationFrame(animateLaunch);
    }

    initThreeJS();

    /* ═══ جلب الكبسولات من القاعدة ═══ */
    CapsuleStore.load().then(list => {
        list.forEach(m => { activeMessages.push(m); createMessageMarker(m); });
        updateCounter();
    });

    /* ═══════════════════════════════════════════════════════════
       إدارة النموذج والواجهة
       ═══════════════════════════════════════════════════════════ */
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const messageForm = document.getElementById('messageForm');
    const messageText = document.getElementById('messageText');
    const charCounter = document.querySelector('.char-counter');

    const modeRadios = document.querySelectorAll('input[name="capsuleMode"]');
    const arrivalGroup = document.getElementById('arrivalGroup');
    const arrivalDate = document.getElementById('arrivalDate');
    const arrivalPreview = document.getElementById('arrivalPreview');
    const notePub = document.getElementById('privacyNotePub');
    const notePriv = document.getElementById('privacyNotePriv');
    const authorNameInput = document.getElementById('authorName');
    const sendAsAnonymous = document.getElementById('sendAsAnonymous');
    let chosenDays = null;

    /* ✅ إعادة حساب min كل مرة تفتح النافذة (كانت ثابتة وتصبح قديمة) */
    function refreshArrivalMin() {
        arrivalDate.min = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
    }
    refreshArrivalMin();

    function fmtDate(d) {
        return new Intl.DateTimeFormat(CCI18N.lang === 'ar' ? 'ar-DZ' : 'en-GB',
            { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
    }
    function setArrival(days) {
        chosenDays = days;
        document.querySelectorAll('.arrival-chips .chip').forEach(c =>
            c.classList.toggle('on', c.dataset.days === String(days)));
        if (days === 'custom') { arrivalDate.style.display = 'block'; arrivalPreview.textContent = ''; return; }
        arrivalDate.style.display = 'none';
        arrivalPreview.innerHTML = CCI18N.t('arrives_on') + ' <b>' + esc(fmtDate(new Date(Date.now() + days * 864e5))) + '</b>';
    }
    arrivalDate.addEventListener('change', () => {
        if (!arrivalDate.value) return;
        arrivalPreview.innerHTML = CCI18N.t('arrives_on') + ' <b>' + esc(fmtDate(new Date(arrivalDate.value + 'T12:00:00'))) + '</b>';
    });
    document.querySelectorAll('.arrival-chips .chip').forEach(c =>
        c.addEventListener('click', () => {
            const v = c.dataset.days;
            setArrival(v === 'custom' ? 'custom' : parseInt(v, 10));
        }));

    modeRadios.forEach(radio => radio.addEventListener('change', (e) => {
        const isPrivate = e.target.value === 'private';
        arrivalGroup.style.display = isPrivate ? 'block' : 'none';
        notePub.style.display = isPrivate ? 'none' : 'block';
        notePriv.style.display = isPrivate ? 'block' : 'none';
        if (isPrivate) setArrival(1);
        else {
            chosenDays = null;
            arrivalPreview.textContent = '';
            arrivalDate.style.display = 'none';
            document.querySelectorAll('.arrival-chips .chip').forEach(c => c.classList.remove('on'));
        }
    }));

    /* ✅ عند فتح النافذة: تحديث min + مزامنة حالة "مجهول" */
    openModalBtn.addEventListener('click', () => {
        refreshArrivalMin();
        if (sendAsAnonymous && authorNameInput) {
            authorNameInput.disabled = sendAsAnonymous.checked;
            authorNameInput.style.opacity = sendAsAnonymous.checked ? '0.5' : '1';
        }
        messageModal.classList.add('active');
    });
    closeModalBtn.addEventListener('click', () => messageModal.classList.remove('active'));
    messageModal.addEventListener('click', (e) => {
        if (e.target === messageModal) messageModal.classList.remove('active');
    });
    addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            messageModal.classList.remove('active');
            deepModal.classList.remove('active');
            hideTooltip();
        }
    });

    /* ✅ ربط "إرسال كمجهول" فعليًا */
    if (sendAsAnonymous && authorNameInput) {
        sendAsAnonymous.addEventListener('change', (e) => {
            authorNameInput.disabled = e.target.checked;
            authorNameInput.style.opacity = e.target.checked ? '0.5' : '1';
            if (e.target.checked) authorNameInput.value = '';
        });
    }

    messageText.addEventListener('input', (e) => {
        charCounter.textContent = `${e.target.value.length} / ${e.target.getAttribute('maxlength')}`;
    });

    function resetFormUI() {
        chosenDays = null;
        arrivalGroup.style.display = 'none';
        arrivalDate.style.display = 'none';
        arrivalDate.value = '';
        arrivalPreview.textContent = '';
        notePub.style.display = 'block';
        notePriv.style.display = 'none';
        document.querySelectorAll('.arrival-chips .chip').forEach(c => c.classList.remove('on'));
        charCounter.textContent = '0 / 300';
        if (sendAsAnonymous) sendAsAnonymous.checked = false;
        if (authorNameInput) { authorNameInput.disabled = false; authorNameInput.style.opacity = '1'; }
    }

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const country = document.getElementById('userCountry').value;
        if (!country) { showToast(CCI18N.t('pick_warn'), '⚠️'); return; }

        const text = messageText.value.trim();

        /* ✅ قراءة "إرسال كمجهول" فعليًا */
        const isAnon = !!(sendAsAnonymous && sendAsAnonymous.checked);
        const author = isAnon
            ? CCI18N.t('anon_name')
            : (authorNameInput.value.trim() || CCI18N.t('anon_name'));

        const mood = (document.querySelector('input[name="mood"]:checked') || {}).value || 'hope';
        const isPrivate = (document.querySelector('input[name="capsuleMode"]:checked') || {}).value === 'private';

        let arrivalISO = null;
        if (isPrivate) {
            if (chosenDays === 'custom') {
                if (!arrivalDate.value) { showToast(CCI18N.t('pick_date'), '⚠️'); return; }
                arrivalISO = new Date(arrivalDate.value + 'T12:00:00').toISOString();
            } else {
                arrivalISO = new Date(Date.now() + chosenDays * 864e5).toISOString();
            }
        }

        const btn = messageForm.querySelector('.btn-submit');
        const original = btn.innerHTML;
        btn.disabled = true; btn.textContent = CCI18N.t('preparing');

        try {
                        const { code } = await CapsuleStore.save({ text, author, country, mood, arrivalISO });
            launchMessage(country, text, author, mood);
             showToast(code ? CCI18N.t('launched_code') + code : CCI18N.t('launched'));

            /* ✅ تتبّع الإرسال */
            trackEvent('capsule_sent', {
                country: country,
                mood: mood,
                is_private: isPrivate,
                is_anonymous: isAnon,
                has_text: text.length > 0,
                text_length: text.length,
                lang: CCI18N.lang
            });

            messageForm.reset();
            resetFormUI();
            messageModal.classList.remove('active');
        } catch (err) {
            showToast(err.message, '⚠️');
        } finally {
            btn.disabled = false; btn.innerHTML = original;
        }
    });

    /* ═══════════════════════════════════════════════════════════
       Google Auth
       ═══════════════════════════════════════════════════════════ */
    const googleBtn = document.getElementById('googleLoginBtn');

        const GOOGLE_LOGO_SVG = `<svg class="g-logo" viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;

    function updateAuthUI(user) {
        if (!googleBtn) return;
        if (user) {
            const name = (user.user_metadata && user.user_metadata.full_name)
                      || (user.email ? user.email.split('@')[0] : null)
                      || (CCI18N.lang === 'ar' ? 'مستخدم' : 'User');
            const avatar = (user.user_metadata && user.user_metadata.avatar_url) || '';

            googleBtn.innerHTML = `
                ${avatar
                    ? `<img src="${esc(avatar)}" class="g-avatar" alt="" referrerpolicy="no-referrer">`
                    : `<span>👤</span>`}
                <span class="g-text">${esc(name)}</span>
            `;
            googleBtn.classList.add('signed-in');
            googleBtn.title = CCI18N.lang === 'ar' ? 'اضغط لتسجيل الخروج' : 'Click to sign out';
        } else {
            googleBtn.innerHTML = `${GOOGLE_LOGO_SVG}<span class="g-text">${CCI18N.lang === 'ar' ? 'تسجيل الدخول' : 'Sign in'}</span>`;
            googleBtn.classList.remove('signed-in');
            googleBtn.title = CCI18N.lang === 'ar' ? 'تسجيل الدخول باستخدام Google' : 'Sign in with Google';
        }
    }

    if (sb && googleBtn) {
        /* جلب الجلسة الحالية */
        sb.auth.getSession().then(({ data }) => {
            updateAuthUI(data && data.session ? data.session.user : null);
        }).catch(() => updateAuthUI(null));

        /* الاستماع لتغيرات الحالة */
        sb.auth.onAuthStateChange((_event, session) => {
            updateAuthUI(session ? session.user : null);
        });

        /* زر الدخول / الخروج */
        googleBtn.addEventListener('click', async () => {
            try {
                const { data } = await sb.auth.getSession();
                if (data && data.session) {
                    await sb.auth.signOut();
                    showToast(CCI18N.lang === 'ar' ? 'تم تسجيل الخروج' : 'Signed out', '👋');
                } else {
                    const { error } = await sb.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: window.location.origin + window.location.pathname }
                    });
                    if (error) showToast(error.message, '⚠️');
                }
            } catch (err) {
                showToast(CCI18N.lang === 'ar' ? 'فشل الاتصال بجوجل' : 'Google sign-in failed', '⚠️');
            }
        });
    } else if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            showToast(CCI18N.lang === 'ar' ? 'قاعدة البيانات غير متصلة' : 'Database not connected', '⚠️');
        });
    }

    /* عند تبديل اللغة: تحديث أسماء الدول في التسميات + زر Google */
                            /* عند تبديل اللغة: تحديث أسماء الدول في التسميات + زر Google */
    addEventListener('cc:lang', () => {
        trackEvent('language_toggle', { lang: CCI18N.lang, page: 'home' });
        labelElements.forEach(it => {
            it.element.innerHTML = `<span>📍</span> ${esc(CCI18N.countryLabel(it.msg.country))}`;
        });
        if (sb) {
            sb.auth.getSession().then(({ data }) => {
                updateAuthUI(data && data.session ? data.session.user : null);
            }).catch(() => {});
        }
    });

    /* ═══════════════════════════════════════════════════════════
       كبسولة من الأعماق
       ═══════════════════════════════════════════════════════════ */
    const deepBtn   = document.getElementById('deepBtn');
    const deepText  = document.getElementById('deepText');
    const deepMeta  = document.getElementById('deepMeta');
    let lastDeepId  = null;

    async function openDeep() {
        trackEvent('deep_dive_opened', { lang: CCI18N.lang });
        if (!sb) {
                    
            showToast(CCI18N.lang === 'ar' ? 'هذه الميزة تحتاج ربط قاعدة البيانات' : 'This needs the database connection', '⚠️');
            return;
        }
        const { data, error } = await sb.rpc('get_deep_capsule', { p_exclude_id: lastDeepId });
        if (error) { showToast('🌊 ' + error.message, '⚠️'); return; }
        if (!data || !data.length) {
            deepText.textContent = CCI18N.t('deep_empty');
            deepText.classList.add('deep-empty');
            deepMeta.innerHTML = '';
            lastDeepId = null;
        } else {
            const r = data[0];
            lastDeepId = r.o_id;
            deepText.classList.remove('deep-empty');
            deepText.textContent = '“' + r.o_text + '”';
            const when = new Intl.DateTimeFormat(CCI18N.lang === 'ar' ? 'ar-DZ' : 'en-GB',
                { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(r.o_created));
            deepMeta.innerHTML =
                `<span>${esc(CCI18N.countryLabel(r.o_country))}</span>` +
                `<span>${esc(CCI18N.lang === 'ar' ? 'بقلم' : 'by')} <b>${esc(r.o_author || '—')}</b></span>` +
                `<span>${esc(when)}</span>` +
                `<span>👁️ <b>${r.o_reads != null ? r.o_reads : 0}</b> ${esc(CCI18N.t('deep_reads'))}</span>`;
            sb.rpc('read_capsule', { p_id: r.o_id }).catch(() => {});
        }
        deepModal.classList.add('active');
    }

    deepBtn.addEventListener('click', openDeep);
    document.getElementById('deepAgain')?.addEventListener('click', openDeep);
    document.getElementById('deepClose')?.addEventListener('click', () => deepModal.classList.remove('active'));
    deepModal.addEventListener('click', (e) => {
        if (e.target === deepModal) deepModal.classList.remove('active');
    });

    /* ═══ حركة رسم الشعار ═══ */
    const logo = document.querySelector('.cc-logo');
    if (logo) {
        if (REDUCE) { try { logo.pauseAnimations(); } catch (e) {} }
        else {
            logo.classList.add('cc-anim');
            requestAnimationFrame(() => requestAnimationFrame(() => logo.classList.add('live')));
        }
    }
});