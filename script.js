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

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
        dirLight.position.set(5, 3, 5);
        scene.add(dirLight);

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
            const flag = msg.dbId
                ? `<button class="action-btn report-btn" data-db="${msg.dbId}" title="${CCI18N.lang === 'ar' ? 'بلاغ عن محتوى غير لائق' : 'Report inappropriate content'}">🚩</button>`
                : '';
            const tLang = CCI18N.lang === 'ar' ? 'ar' : 'en';
            const transUrl = `https://translate.google.com/?sl=auto&tl=${tLang}&text=${encodeURIComponent(msg.text)}&op=translate`;
            const translateBtn = `<a href="${transUrl}" target="_blank" rel="noopener" class="action-btn translate-btn" title="${CCI18N.lang === 'ar' ? 'ترجم' : 'Translate'}">🔤</a>`;
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

    function updateAuthUI(user) {
        if (!googleBtn) return;
        if (user) {
            const name = (user.user_metadata && user.user_metadata.full_name)
                      || (user.email ? user.email.split('@')[0] : null)
                      || (CCI18N.lang === 'ar' ? 'مستخدم' : 'User');
            googleBtn.innerHTML = `<span>👤</span> ${esc(name)}`;
            googleBtn.title = CCI18N.lang === 'ar' ? 'اضغط لتسجيل الخروج' : 'Click to sign out';
        } else {
            googleBtn.innerHTML = `<span>🌐</span> ${CCI18N.lang === 'ar' ? 'دخول بجوجل' : 'Sign in with Google'}`;
            googleBtn.title = '';
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
    addEventListener('cc:lang', () => {
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