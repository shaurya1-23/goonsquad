/* --------------------------------------------------------------------------
           3.1 Sound System
           -------------------------------------------------------------------------- */
        
        // Initialize the Web Audio API context for playing sounds.
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Browsers often require user interaction (like a click) before allowing audio to play.
        // This function resumes the audio context if it's suspended.
        function resumeAudio() {
            if (audioCtx.state === 'suspended') audioCtx.resume();
        }
        // Attach the resume function to the first click or touch on the page.
        document.body.addEventListener('click', resumeAudio, { once: true });
        document.body.addEventListener('touchstart', resumeAudio, { once: true });

        // Plays a "boop" sound effect for UI interactions.
        function playBoop() {
            // Don't play sound if silent mode is active.
            if (document.getElementById('silentMode').classList.contains('active')) return;
            resumeAudio(); // Ensure audio context is active.
            
            // Create an oscillator (generates a sound wave) and a gain node (controls volume).
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            // Configure the sound: sine wave, starts at 400Hz and ramps up to 600Hz.
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
            
            // Configure the volume: starts at 0.1 and fades out.
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
            
            // Connect the nodes and play the sound for a short duration.
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.2);
        }

        // Helper function to safely add event listeners to elements that might not exist.
        function safeOn(el, evt, handler) {
            if (el) el.addEventListener(evt, handler);
        }

        /* --------------------------------------------------------------------------
           3.2 System Services (Time, Battery, Controls)
           -------------------------------------------------------------------------- */
        
        // Updates the clock display in the status bar every second.
        function updateTime() {
            const now = new Date();
            let h = now.getHours(); const m = now.getMinutes().toString().padStart(2, '0');
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12; h = h ? h : 12; // Convert 24-hour to 12-hour format.
            document.getElementById('clockDisplay').textContent = `${h}:${m} ${ampm}`;
        }
        setInterval(updateTime, 1000); updateTime();

        // Uses the Battery Status API to display the current battery level and charging status.
        if (navigator.getBattery) {
            navigator.getBattery().then(function(battery) {
                function updateBattery() {
                    const level = Math.round(battery.level * 100);
                    document.getElementById('batteryPercent').textContent = level + '%';
                    document.getElementById('batteryLevel').style.width = level + '%';
                    document.querySelector('.battery-icon').classList.toggle('battery-charging', battery.charging);
                }
                updateBattery();
                // Listen for changes in battery level or charging status.
                battery.addEventListener('levelchange', updateBattery);
                battery.addEventListener('chargingchange', updateBattery);
            });
        }

        // --- Control Center Logic ---
        const controlCenterTrigger = document.getElementById('controlCenterTrigger');
        const controlCenter = document.getElementById('controlCenter');
        // Toggle Control Center visibility when the trigger is clicked.
        controlCenterTrigger.addEventListener('click', () => {
            if (visualizerActive || aslTrainerActive) return; // Don't open if a full-screen app is active.
            controlCenter.classList.toggle('visible');
            playBoop();
        });
        // Close the Control Center if a click occurs outside of it.
        document.addEventListener('click', (e) => {
            if (!controlCenter.classList.contains('visible')) return;
            if (controlCenter.contains(e.target) || controlCenterTrigger.contains(e.target)) return;
            controlCenter.classList.remove('visible');
        });
        
        // --- Shared State for Toggles (Silent Mode & Hide Camera) ---
        // These toggles exist in both the Control Center and the Settings window,
        // so their states need to be synchronized.
        
        const silentModeToggle = document.getElementById('silentMode');
        const settingsSilentMode = document.getElementById('settingsSilentMode');
        function setSilentModeState(isActive) {
            silentModeToggle.classList.toggle('active', isActive);
            if (settingsSilentMode) settingsSilentMode.classList.toggle('active', isActive);
        }
        silentModeToggle.addEventListener('click', (e) => {
            const nextState = !e.currentTarget.classList.contains('active');
            setSilentModeState(nextState);
            playBoop();
        });
        if (settingsSilentMode) {
            settingsSilentMode.addEventListener('click', (e) => {
                const nextState = !e.currentTarget.classList.contains('active');
                setSilentModeState(nextState);
                playBoop();
            });
        }

        // Cache all DOM elements for performance.
        const cameraBox = document.getElementById('cameraBox');
        const showCameraBtn = document.getElementById('showCameraBtn');
        const hideCameraToggle = document.getElementById('hideCamera');
        const settingsHideCamera = document.getElementById('settingsHideCamera');
        const appExitBtn = document.getElementById('appExitBtn');

        // Visualizer App Elements
        const visualizerApp = document.getElementById('visualizerApp');
        const visualizerCanvas = document.getElementById('visualizerCanvas');
        const vizAddBtn = document.getElementById('vizAddBtn');
        const vizMoreBtn = document.getElementById('vizMoreBtn');
        const vizCustomizeBtn = document.getElementById('vizCustomizeBtn');
        const vizTrashBtn = document.getElementById('vizTrashBtn');
        const visualizerStart = document.getElementById('visualizerStart');
        const vizNewProjectBtn = document.getElementById('vizNewProjectBtn');
        const vizOpenFileBtn = document.getElementById('vizOpenFileBtn');
        const vizOpenSavedBtn = document.getElementById('vizOpenSavedBtn');
        const vizSavedList = document.getElementById('vizSavedList');
        const vizAddModal = document.getElementById('vizAddModal');
        const vizAddCancelBtn = document.getElementById('vizAddCancelBtn');
        const vizObjectGrid = document.getElementById('vizObjectGrid');
        const vizMoreMenu = document.getElementById('vizMoreMenu');
        const vizNewProjectMenu = document.getElementById('vizNewProjectMenu');
        const vizOpenStartMenu = document.getElementById('vizOpenStartMenu');
        const vizEditPopover = document.getElementById('vizEditPopover');
        const vizEditHex = document.getElementById('vizEditHex');
        const vizColorPreview = document.getElementById('vizColorPreview');
        const vizHueSlider = document.getElementById('vizHueSlider');
        const vizOpenColorMapBtn = document.getElementById('vizOpenColorMapBtn');
        const vizEditCloseBtn = document.getElementById('vizEditCloseBtn');
        const colorPickerOverlay = document.getElementById('colorPickerOverlay');
        const colorMapCanvas = document.getElementById('colorMap');
        const colorMapHue = document.getElementById('colorMapHue');
        const colorMapPreview = document.getElementById('colorMapPreview');
        const colorMapHex = document.getElementById('colorMapHex');
        const colorMapDoneBtn = document.getElementById('colorMapDoneBtn');
        const objectOverlay = document.getElementById('objectOverlay');
        const trashHint = document.getElementById('trashHint');
        const vizFileInput = document.getElementById('vizFileInput');

        // ASL Trainer App Elements [NEW]
        const aslTrainerApp = document.getElementById('aslTrainerApp');
        const aslTargetImageEl = document.getElementById('aslTargetImage');
        const aslFeedbackEl = document.getElementById('aslFeedback');
        const aslProgressBarEl = document.getElementById('aslProgressBar');
        const aslAttemptsEl = document.getElementById('aslAttempts');
        const aslCorrectEl = document.getElementById('aslCorrect');
        const aslAccuracyEl = document.getElementById('aslAccuracy');


        // Function to synchronize the "Hide Camera" state.
        function setHideCameraState(isActive) {
            hideCameraToggle.classList.toggle('active', isActive);
            if (settingsHideCamera) settingsHideCamera.classList.toggle('active', isActive);
            cameraBox.classList.toggle('hidden', isActive);
            showCameraBtn.classList.toggle('visible', isActive);
        }
        hideCameraToggle.addEventListener('click', (e) => {
            const isActive = !e.currentTarget.classList.contains('active');
            setHideCameraState(isActive);
            playBoop();
        });
        if (settingsHideCamera) {
            settingsHideCamera.addEventListener('click', (e) => {
                const isActive = !e.currentTarget.classList.contains('active');
                setHideCameraState(isActive);
                playBoop();
            });
        }
        
        // Event listener for the button that re-shows the camera view.
        showCameraBtn.addEventListener('click', () => {
            setHideCameraState(false);
            playBoop();
        });

        /* --------------------------------------------------------------------------
           3.3 Visualizer App Logic (Three.js)
           -------------------------------------------------------------------------- */
        
        let visualizerActive = false; // Global flag for whether the visualizer app is open.
        
        // State object to hold all variables related to the Three.js scene and UI.
        const vizState = {
            initialized: false,         // Has the Three.js scene been set up?
            scene: null,                // The Three.js scene object.
            camera: null,               // The Three.js camera object.
            renderer: null,             // The Three.js renderer.
            planeGroup: null,           // A group containing the ground plane and all objects, for easy rotation/panning.
            planeMesh: null,            // The ground plane mesh itself.
            objects: [],                // Array of all 3D objects currently in the scene.
            objectCatalog: [],          // A list of available object types to add (Sphere, Cube, etc.).
            objectIdCounter: 0,         // Simple counter to give each object a unique ID.
            raycaster: new THREE.Raycaster(), // Used for picking objects with the cursor.
            ndc: new THREE.Vector2(),   // Normalized Device Coordinates for raycasting.
            lastTwoHandMid: null,       // Stores the midpoint of a two-handed gesture from the previous frame.
            lastTwoHandDist: null,      // Stores the distance of a two-handed gesture from the previous frame.
            lastTwoHandAngle: null,     // Stores the angle of a two-handed gesture from the previous frame.
            zoom: 1,                    // Current camera zoom level.
            isInteracting: false,       // Is the user currently interacting with the scene (dragging, zooming)?
            wasInteracting: false,      // Was the user interacting in the previous frame? (Used for autosave).
            draggingObjectId: null,     // The ID of the object currently being dragged.
            singlePinchActive: false,   // Is a single-hand pinch gesture active?
            selectedObjectId: null,     // The ID of the currently selected object.
            trashMode: false,           // Is trash mode active?
            customizeMode: false,       // Is customize/edit mode active?
            editingObjectId: null,      // The ID of the object currently being edited.
            verticalAdjust: null,       // State for vertical object adjustment gesture.
            cameraBase: { y: 6.5, z: 10.5 }, // Base camera position.
            currentProjectId: null,     // ID of the project currently being worked on.
            currentProjectName: 'Untitled Project', // Name of the current project.
            lastAutoExport: 0,          // Timestamp of the last autosave.
            lastAutoExportHash: '',     // Hash of the last autosaved data to prevent redundant saves.
            suspendAutosave: false,     // Temporarily disable autosave (e.g., while loading a project).
            wheelSaveTimeout: null      // Timeout for saving after mouse wheel zoom.
        };

        // Creates a simple gradient texture for the ground plane.
        function createGradientTexture() {
            const size = 512;
            const canvas = document.createElement('canvas');
            canvas.width = size; canvas.height = size;
            const g = canvas.getContext('2d');
            const grad = g.createLinearGradient(0, 0, 0, size);
            grad.addColorStop(0, '#2a2a2a');
            grad.addColorStop(1, '#0a0a0a');
            g.fillStyle = grad;
            g.fillRect(0, 0, size, size);
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            return texture;
        }

        // Updates the camera's position based on the current zoom level.
        function updateCameraZoom() {
            if (!vizState.camera) return;
            vizState.camera.position.set(0, vizState.cameraBase.y * vizState.zoom, vizState.cameraBase.z * vizState.zoom);
            vizState.camera.lookAt(vizState.planeGroup ? vizState.planeGroup.position : new THREE.Vector3());
        }

        // Helper to find an object in the `vizState.objects` array by its ID.
        function getObjectById(id) {
            return vizState.objects.find(obj => obj.id === id);
        }

        // --- Color Utility Functions ---
        function normalizeHexInput(value) {
            if (!value) return null;
            let v = value.trim();
            if (!v.startsWith('#')) v = `#${v}`;
            v = v.toLowerCase();
            if (/^#([0-9a-f]{3}){1}$/.test(v)) {
                v = `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
            }
            if (/^#([0-9a-f]{6})$/.test(v)) return v;
            return null;
        }

        function hslToHex(h, s, l) {
            s /= 100; l /= 100;
            const k = (n) => (n + h / 30) % 12;
            const a = s * Math.min(l, 1 - l);
            const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
            const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, '0');
            return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
        }

        function hexToHsl(hex) {
            const n = normalizeHexInput(hex);
            if (!n) return { h: 210, s: 100, l: 50 };
            const r = parseInt(n.slice(1, 3), 16) / 255;
            const g = parseInt(n.slice(3, 5), 16) / 255;
            const b = parseInt(n.slice(5, 7), 16) / 255;
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            let h = 0;
            const l = (max + min) / 2;
            const d = max - min;
            const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
            if (d !== 0) {
                switch (max) {
                    case r: h = ((g - b) / d) % 6; break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h = Math.round(h * 60);
                if (h < 0) h += 360;
            }
            return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
        }

        // Populates the "Add Object" modal with buttons for each available object type.
        function renderObjectCatalog() {
            if (!vizObjectGrid) return;
            vizObjectGrid.innerHTML = '';
            vizState.objectCatalog.forEach((item) => {
                const btn = document.createElement('button');
                btn.className = 'viz-action-btn';
                btn.textContent = item.type;
                btn.dataset.objectType = item.type;
                btn.addEventListener('click', () => {
                    addObject(item.type);
                    vizAddModal.classList.remove('visible');
                    playBoop();
                });
                vizObjectGrid.appendChild(btn);
            });
        }

        // Creates a new Three.js mesh for a given object type and color.
        function createObjectMesh(type, color) {
            const entry = vizState.objectCatalog.find(item => item.type === type);
            if (!entry) return null;
            const material = new THREE.MeshStandardMaterial({
                color: color || entry.color,
                roughness: 0.35,
                metalness: 0.4
            });
            return new THREE.Mesh(entry.geometry, material);
        }

        // Adds a new object to the scene.
        function addObject(type, position, rotation, colorOverride) {
            if (!vizState.planeGroup) return;
            const palette = [0x7aa2ff, 0xffc861, 0x7bffb0, 0xff8fb1, 0xbfa1ff];
            const color = colorOverride || palette[vizState.objects.length % palette.length];
            const mesh = createObjectMesh(type, color);
            if (!mesh) return;
            mesh.castShadow = true;
            const id = `obj-${vizState.objectIdCounter++}`;
            const spread = vizState.objects.length;
            const defaultPos = new THREE.Vector3((spread % 3 - 1) * 2.2, 1.2, Math.floor(spread / 3) * -2.2);
            const target = position ? position.clone() : defaultPos;
            mesh.position.copy(target);
            if (rotation) mesh.rotation.set(rotation.x, rotation.y, rotation.z);
            vizState.planeGroup.add(mesh);
            const colorHex = `#${new THREE.Color(color).getHexString()}`;
            vizState.objects.push({ id, type, mesh, target, color: colorHex });
            createObjectOverlay(id);
            if (!vizState.suspendAutosave) autoSaveProject();
        }

        // Removes all objects from the scene.
        function clearObjects() {
            vizState.objects.forEach(obj => {
                vizState.planeGroup.remove(obj.mesh);
            });
            vizState.objects = [];
            objectOverlay.innerHTML = '';
            if (vizState.editingObjectId) closeEditPopover();
        }

        // Removes a single object by its ID.
        function removeObjectById(id) {
            const index = vizState.objects.findIndex(obj => obj.id === id);
            if (index === -1) return;
            const obj = vizState.objects[index];
            vizState.planeGroup.remove(obj.mesh);
            vizState.objects.splice(index, 1);
            const tag = objectOverlay.querySelector(`[data-object-id="${id}"]`);
            if (tag) tag.remove();
            if (vizState.editingObjectId === id) closeEditPopover();
            if (!vizState.suspendAutosave) autoSaveProject();
        }

        // Creates the 2D HTML overlay (edit/trash buttons) for a 3D object.
        function createObjectOverlay(id) {
            const tag = document.createElement('div');
            tag.className = 'object-tag';
            tag.dataset.objectId = id;
            const editBtn = document.createElement('button');
            editBtn.className = 'object-edit';
            editBtn.type = 'button';
            editBtn.textContent = '✎';
            editBtn.addEventListener('click', () => {
                openEditPopover(id);
                playBoop();
            });
            const btn = document.createElement('button');
            btn.className = 'object-trash';
            btn.type = 'button';
            btn.textContent = '🗑';
            btn.addEventListener('click', () => {
                removeObjectById(id);
                playBoop();
            });
            tag.appendChild(editBtn);
            tag.appendChild(btn);
            objectOverlay.appendChild(tag);
        }

        // Toggles customize/edit mode.
        function setCustomizeMode(isActive) {
            vizState.customizeMode = isActive;
            document.body.classList.toggle('customize-mode', isActive);
            if (vizCustomizeBtn) vizCustomizeBtn.classList.toggle('active', isActive);
            if (!isActive) {
                closeEditPopover();
                if (colorPickerOverlay) colorPickerOverlay.classList.remove('visible');
            }
        }

        // Applies a new color to the object currently being edited.
        function applyObjectColor(hex) {
            const normalized = normalizeHexInput(hex);
            if (!normalized) return;
            const activeObj = getObjectById(vizState.editingObjectId);
            if (!activeObj) return;
            activeObj.color = normalized;
            if (activeObj.mesh && activeObj.mesh.material) {
                activeObj.mesh.material.color.set(normalized);
            }
            if (!vizState.suspendAutosave) autoSaveProject();
        }

        // Updates the color in all relevant UI elements (input fields, previews).
        function setEditorColor(hex) {
            const normalized = normalizeHexInput(hex);
            if (!normalized) return;
            if (vizEditHex) vizEditHex.value = normalized.toUpperCase();
            if (vizColorPreview) vizColorPreview.style.background = normalized;
            if (colorMapHex) colorMapHex.value = normalized.toUpperCase();
            if (colorMapPreview) colorMapPreview.style.background = normalized;
            applyObjectColor(normalized);
            const hsl = hexToHsl(normalized);
            if (vizHueSlider) vizHueSlider.value = hsl.h;
            if (colorMapHue) colorMapHue.value = hsl.h;
            drawColorMap(hsl.h);
        }

        // Opens the edit popover for a specific object.
        function openEditPopover(objectId) {
            if (!visualizerActive) return;
            const obj = getObjectById(objectId);
            if (!obj) return;
            vizState.editingObjectId = objectId;
            const currentHex = obj.color || `#${obj.mesh.material.color.getHexString()}`;
            setEditorColor(currentHex);
            if (vizEditPopover) vizEditPopover.classList.add('visible');
        }

        // Closes the edit popover.
        function closeEditPopover() {
            vizState.editingObjectId = null;
            if (vizEditPopover) vizEditPopover.classList.remove('visible');
        }

        // Draws the saturation/lightness color map for a given hue.
        function drawColorMap(hue) {
            if (!colorMapCanvas) return;
            const ctx = colorMapCanvas.getContext('2d');
            const w = colorMapCanvas.width;
            const h = colorMapCanvas.height;
            const satGrad = ctx.createLinearGradient(0, 0, w, 0);
            satGrad.addColorStop(0, 'rgb(255,255,255)');
            satGrad.addColorStop(1, `hsl(${hue}, 100%, 50%)`);
            ctx.fillStyle = satGrad;
            ctx.fillRect(0, 0, w, h);
            const valGrad = ctx.createLinearGradient(0, 0, 0, h);
            valGrad.addColorStop(0, 'rgba(0,0,0,0)');
            valGrad.addColorStop(1, 'rgba(0,0,0,1)');
            ctx.fillStyle = valGrad;
            ctx.fillRect(0, 0, w, h);
        }

        // --- Project Save/Load Logic ---
        // Converts the current scene state into a serializable JSON object.
        function serializeProject() {
            return {
                id: vizState.currentProjectId || null,
                name: vizState.currentProjectName || 'Untitled',
                updatedAt: Date.now(),
                plane: {
                    position: vizState.planeGroup ? vizState.planeGroup.position.toArray() : [0, 0, 0],
                    rotation: vizState.planeGroup ? [vizState.planeGroup.rotation.x, vizState.planeGroup.rotation.y, vizState.planeGroup.rotation.z] : [0, 0, 0],
                    zoom: vizState.zoom
                },
                objects: vizState.objects.map(obj => ({
                    id: obj.id,
                    type: obj.type,
                    position: obj.mesh.position.toArray(),
                    rotation: [obj.mesh.rotation.x, obj.mesh.rotation.y, obj.mesh.rotation.z],
                    color: obj.color || `#${obj.mesh.material.color.getHexString()}`
                }))
            };
        }

        // Loads a project from a JSON object, rebuilding the scene.
        function loadProjectData(data) {
            if (!data) return;
            vizState.suspendAutosave = true;
            clearObjects();
            if (data.plane && vizState.planeGroup) {
                const pos = data.plane.position || [0, 0, 0];
                const rot = data.plane.rotation || [0, 0, 0];
                vizState.planeGroup.position.set(pos[0], pos[1], pos[2]);
                vizState.planeGroup.rotation.set(rot[0], rot[1], rot[2]);
                vizState.zoom = data.plane.zoom || 1;
                updateCameraZoom();
            }
            (data.objects || []).forEach(obj => {
                const pos = obj.position ? new THREE.Vector3(obj.position[0], obj.position[1], obj.position[2]) : null;
                const rot = obj.rotation ? new THREE.Vector3(obj.rotation[0], obj.rotation[1], obj.rotation[2]) : null;
                addObject(obj.type, pos, rot, obj.color);
            });
            vizState.currentProjectId = data.id || vizState.currentProjectId;
            vizState.currentProjectName = data.name || vizState.currentProjectName;
            vizState.suspendAutosave = false;
            autoSaveProject();
        }

        // Functions to interact with localStorage for saving and retrieving projects.
        const PROJECTS_KEY = 'visualizerProjects';
        function getSavedProjects() {
            try {
                return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');
            } catch {
                return [];
            }
        }
        function saveProjects(list) {
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
        }
        function upsertProject(data) {
            const list = getSavedProjects();
            const index = list.findIndex(p => p.id === data.id);
            if (index >= 0) list[index] = data;
            else list.unshift(data);
            saveProjects(list.slice(0, 8));
        }
        
        // Saves the current project to localStorage.
        function autoSaveProject() {
            if (!vizState.initialized) return;
            if (!vizState.currentProjectId) {
                vizState.currentProjectId = `proj-${Date.now()}`;
                vizState.currentProjectName = 'Untitled Project';
            }
            const data = serializeProject();
            data.id = vizState.currentProjectId;
            data.name = vizState.currentProjectName;
            upsertProject(data);
            renderSavedProjectsList();
        }
        
        // Renders the list of saved projects on the start screen.
        function renderSavedProjectsList() {
            if (!vizSavedList) return;
            const list = getSavedProjects();
            vizSavedList.innerHTML = '';
            if (!list.length) {
                const empty = document.createElement('div');
                empty.className = 'viz-saved-item';
                empty.textContent = 'No saved projects yet.';
                vizSavedList.appendChild(empty);
                return;
            }
            list.forEach(project => {
                const item = document.createElement('div');
                item.className = 'viz-saved-item';
                const label = document.createElement('span');
                label.textContent = project.name || 'Untitled';
                const btn = document.createElement('button');
                btn.className = 'viz-action-btn';
                btn.style.flex = '0 0 auto';
                btn.textContent = 'Open';
                btn.addEventListener('click', () => {
                    vizState.currentProjectId = project.id;
                    vizState.currentProjectName = project.name;
                    loadProjectData(project);
                    visualizerStart.classList.remove('visible');
                    playBoop();
                });
                item.appendChild(label);
                item.appendChild(btn);
                vizSavedList.appendChild(item);
            });
        }

        // --- Core Visualizer Setup & Animation Loop ---
        // Initializes the entire Three.js scene, camera, renderer, lighting, etc.
        // This is called only once when the visualizer is first opened.
        function initVisualizer() {
            if (vizState.initialized) return;

            const renderer = new THREE.WebGLRenderer({ canvas: visualizerCanvas, antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio || 1);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0x000000, 1);

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
            camera.position.set(0, vizState.cameraBase.y, vizState.cameraBase.z);
            camera.lookAt(0, 0, 0);

            const ambient = new THREE.AmbientLight(0xffffff, 0.7);
            const key = new THREE.DirectionalLight(0xffffff, 0.9);
            key.position.set(6, 10, 6);
            scene.add(ambient, key);

            const planeGroup = new THREE.Group();
            planeGroup.rotation.x = -0.15;
            const planeMat = new THREE.MeshStandardMaterial({
                map: createGradientTexture(),
                roughness: 0.95,
                metalness: 0.1
            });
            const planeMesh = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), planeMat);
            planeMesh.rotation.x = -Math.PI / 2;
            planeGroup.add(planeMesh);
            scene.add(planeGroup);

            vizState.objectCatalog = [
                { type: 'Sphere', geometry: new THREE.SphereGeometry(1.2, 40, 40), color: 0x7aa2ff },
                { type: 'Cube', geometry: new THREE.BoxGeometry(2, 2, 2), color: 0xffc861 },
                { type: 'Torus', geometry: new THREE.TorusGeometry(1.2, 0.4, 24, 60), color: 0x7bffb0 },
                { type: 'Cone', geometry: new THREE.ConeGeometry(1.4, 2.4, 36), color: 0xff8fb1 },
                { type: 'Knot', geometry: new THREE.TorusKnotGeometry(0.9, 0.3, 100, 12), color: 0xbfa1ff },
                { type: 'Cylinder', geometry: new THREE.CylinderGeometry(1.2, 1.2, 2.4, 32), color: 0x63e2ff },
                { type: 'Icosahedron', geometry: new THREE.IcosahedronGeometry(1.3, 0), color: 0xff7aa2 },
                { type: 'Dodecahedron', geometry: new THREE.DodecahedronGeometry(1.3, 0), color: 0xffd166 },
                { type: 'Octahedron', geometry: new THREE.OctahedronGeometry(1.3, 0), color: 0x9aff6b },
                { type: 'Tetrahedron', geometry: new THREE.TetrahedronGeometry(1.3, 0), color: 0x8a9bff },
                { type: 'Prism', geometry: new THREE.CylinderGeometry(1.2, 1.2, 2.2, 3), color: 0xff9f1c }
            ];

            vizState.scene = scene;
            vizState.camera = camera;
            vizState.renderer = renderer;
            vizState.planeGroup = planeGroup;
            vizState.planeMesh = planeMesh;

            renderObjectCatalog();
            updateCameraZoom();
            vizState.initialized = true;
            resizeVisualizer();
            requestAnimationFrame(animateVisualizer);
        }

        // Handles window resizing to keep the canvas and camera aspect ratio correct.
        function resizeVisualizer() {
            if (!vizState.initialized) return;
            const w = window.innerWidth;
            const h = window.innerHeight;
            vizState.renderer.setSize(w, h);
            vizState.camera.aspect = w / h;
            vizState.camera.updateProjectionMatrix();
            resizeColorMap();
        }

        // The main animation loop, called on every frame to render the scene and update object positions.
        function animateVisualizer() {
            requestAnimationFrame(animateVisualizer);
            if (!vizState.initialized) return;
            vizState.objects.forEach(obj => {
                obj.mesh.position.lerp(obj.target, 0.22);
                if (!vizState.isInteracting) {
                    obj.mesh.rotation.y += 0.002;
                }
            });
            if (visualizerActive) {
                vizState.renderer.render(vizState.scene, vizState.camera);
                updateObjectOverlays();
            }
        }

        // Updates the 2D positions of the object overlays to match their 3D counterparts.
        function updateObjectOverlays() {
            if (!vizState.camera) return;
            vizState.planeGroup.updateMatrixWorld();
            vizState.objects.forEach(obj => {
                const tag = objectOverlay.querySelector(`[data-object-id="${obj.id}"]`);
                if (!tag) return;
                const worldPos = obj.mesh.position.clone();
                worldPos.applyMatrix4(vizState.planeGroup.matrixWorld);
                const screenPos = worldPos.project(vizState.camera);
                const visible = screenPos.z < 1;
                if (!visible) {
                    tag.style.display = 'none';
                    return;
                }
                const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
                const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight - 18;
                tag.style.display = 'block';
                tag.style.left = `${x}px`;
                tag.style.top = `${y}px`;
            });
        }

        // --- Visualizer App State Management ---
        // Opens the visualizer app, showing the UI and starting the animation loop.
        function openVisualizer() {
            if (visualizerActive) return;
            visualizerActive = true;
            document.body.classList.add('visualizer-mode');
            visualizerApp.classList.add('visible');
            if (appExitBtn) appExitBtn.classList.add('visible');
            if (controlCenter.classList.contains('visible')) controlCenter.classList.remove('visible');
            initVisualizer();
            toggleLauncher(false);
            appsOpenCount++;
            renderSavedProjectsList();
            if (visualizerStart) visualizerStart.classList.add('visible');
            if (vizAddModal) vizAddModal.classList.remove('visible');
            if (vizMoreMenu) vizMoreMenu.classList.remove('visible');
            if (trashHint) trashHint.classList.toggle('visible', vizState.trashMode);
            if (objectOverlay) objectOverlay.classList.remove('hidden');
            setCustomizeMode(false);
            playBoop();
        }

        // Closes the visualizer app and returns to the main OS view.
        function closeVisualizer() {
            if (!visualizerActive) return;
            visualizerActive = false;
            document.body.classList.remove('visualizer-mode');
            visualizerApp.classList.remove('visible');
            if (appExitBtn) appExitBtn.classList.remove('visible');
            if (visualizerStart) visualizerStart.classList.remove('visible');
            if (vizAddModal) vizAddModal.classList.remove('visible');
            if (vizMoreMenu) vizMoreMenu.classList.remove('visible');
            if (objectOverlay) objectOverlay.classList.add('hidden');
            vizState.trashMode = false;
            if (vizTrashBtn) vizTrashBtn.classList.remove('active');
            if (trashHint) trashHint.classList.remove('visible');
            setCustomizeMode(false);
            if (colorPickerOverlay) colorPickerOverlay.classList.remove('visible');
            vizState.lastTwoHandMid = null;
            vizState.lastTwoHandDist = null;
            vizState.lastTwoHandAngle = null;
            vizState.isInteracting = false;
            vizState.verticalAdjust = null;
            appsOpenCount = Math.max(0, appsOpenCount - 1);
            if (appsOpenCount === 0) toggleLauncher(true);
            playBoop();
        }

        // --- Visualizer Interaction Logic (Hand Tracking & Mouse) ---
        function clamp(value, min, max) {
            return Math.min(max, Math.max(min, value));
        }
        
        // Converts 2D screen coordinates (x, y) to a 3D point on the ground plane.
        function screenToPlanePoint(x, y) {
            if (!vizState.planeMesh || !vizState.camera) return null;
            vizState.ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
            vizState.raycaster.setFromCamera(vizState.ndc, vizState.camera);
            const hits = vizState.raycaster.intersectObject(vizState.planeMesh);
            return hits.length > 0 ? hits[0].point : null;
        }
        
        // Finds which 3D object (if any) is under the given 2D screen coordinates.
        function raycastObjectAt(x, y) {
            if (!vizState.camera || vizState.objects.length === 0) return null;
            vizState.ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
            vizState.raycaster.setFromCamera(vizState.ndc, vizState.camera);
            const hits = vizState.raycaster.intersectObjects(vizState.objects.map(obj => obj.mesh), false);
            if (!hits.length) return null;
            const mesh = hits[0].object;
            return vizState.objects.find(obj => obj.mesh === mesh) || null;
        }
        
        // Helper to check if a hand is in an "open palm" gesture.
        function isPalmOpen(lm) {
            return lm[20].y < lm[18].y && lm[16].y < lm[14].y && lm[12].y < lm[10].y && lm[8].y < lm[6].y;
        }
        
        // Maps MediaPipe hand landmark data to screen coordinates and calculates pinch distance.
        function mapHandToScreen(lm) {
            const indexTip = lm[8];
            const thumbTip = lm[4];
            const SCALE = 1.1;
            const indexX = (((1 - indexTip.x) - 0.5) * SCALE + 0.5) * window.innerWidth;
            const indexY = ((indexTip.y - 0.5) * SCALE + 0.5) * window.innerHeight;
            const thumbX = (((1 - thumbTip.x) - 0.5) * SCALE + 0.5) * window.innerWidth;
            const thumbY = ((thumbTip.y - 0.5) * SCALE + 0.5) * window.innerHeight;
            const centerX = (indexX + thumbX) / 2;
            const centerY = (indexY + thumbY) / 2;
            const pinch = Math.hypot(indexX - thumbX, indexY - thumbY) / window.innerWidth;
            return { centerX, centerY, pinch };
        }

        // The core function that interprets hand gestures to manipulate the 3D scene.
        // Handles single-pinch drag, two-hand pan/zoom/rotate, and vertical adjustment.
        function updateVisualizerFromHands(handLandmarks, handedness) {
            if (!visualizerActive || !vizState.initialized || !handLandmarks || handLandmarks.length === 0) {
                if (vizState.wasInteracting) autoSaveProject();
                vizState.lastTwoHandMid = null;
                vizState.lastTwoHandDist = null;
                vizState.lastTwoHandAngle = null;
                vizState.isInteracting = false;
                vizState.singlePinchActive = false;
                vizState.draggingObjectId = null;
                vizState.wasInteracting = false;
                vizState.verticalAdjust = null;
                return;
            }
            if ((vizEditPopover && vizEditPopover.classList.contains('visible')) || (colorPickerOverlay && colorPickerOverlay.classList.contains('visible'))) {
                vizState.singlePinchActive = false;
                vizState.draggingObjectId = null;
                vizState.isInteracting = false;
                vizState.verticalAdjust = null;
                return;
            }

            const data = handLandmarks.map((lm, i) => {
                const label = handedness && handedness[i] && handedness[i].label ? handedness[i].label : 'Unknown';
                return { ...mapHandToScreen(lm), label, palmOpen: isPalmOpen(lm) };
            });
            const pinching = data.filter(hand => hand.pinch < 0.06);
            const leftPalmOpen = data.some(hand => hand.label === 'Left' && hand.palmOpen);
            const rightPinch = data.find(hand => hand.label === 'Right' && hand.pinch < 0.06);

            if (pinching.length >= 2) {
                const h1 = pinching[0];
                const h2 = pinching[1];
                const midX = (h1.centerX + h2.centerX) / 2;
                const midY = (h1.centerY + h2.centerY) / 2;
                const dist = Math.hypot(h1.centerX - h2.centerX, h1.centerY - h2.centerY);
                const angle = Math.atan2(h2.centerY - h1.centerY, h2.centerX - h1.centerX);
                if (vizState.lastTwoHandMid) {
                    const dx = (midX - vizState.lastTwoHandMid.x) / window.innerWidth;
                    const dy = (midY - vizState.lastTwoHandMid.y) / window.innerHeight;
                    const distNorm = dist / window.innerWidth;
                    const distDelta = distNorm - (vizState.lastTwoHandDist || distNorm);
                    const angleDelta = angle - (vizState.lastTwoHandAngle || angle);
                    if (Math.abs(distDelta) > 0.012) {
                        vizState.zoom = clamp(vizState.zoom - distDelta * 3.5, 0.55, 1.85);
                        updateCameraZoom();
                    } else if (Math.abs(angleDelta) > 0.03) {
                        vizState.planeGroup.rotation.y += angleDelta * 1.4;
                    } else {
                        vizState.planeGroup.position.x += dx * 12;
                        vizState.planeGroup.position.z += dy * 12;
                    }
                }
                vizState.lastTwoHandMid = { x: midX, y: midY };
                vizState.lastTwoHandDist = dist / window.innerWidth;
                vizState.lastTwoHandAngle = angle;
                vizState.singlePinchActive = false;
                vizState.draggingObjectId = null;
                vizState.verticalAdjust = null;
                vizState.isInteracting = true;
                vizState.wasInteracting = true;
                return;
            }

            vizState.lastTwoHandMid = null;
            vizState.lastTwoHandDist = null;
            vizState.lastTwoHandAngle = null;
            if (pinching.length === 1) {
                const h = (leftPalmOpen && rightPinch) ? rightPinch : pinching[0];
                if (!vizState.singlePinchActive) {
                    const hitObject = raycastObjectAt(h.centerX, h.centerY);
                    if (!hitObject) return;
                    if (vizState.customizeMode) {
                        openEditPopover(hitObject.id);
                        return;
                    }
                    if (vizState.trashMode) {
                        removeObjectById(hitObject.id);
                        return;
                    }
                    vizState.singlePinchActive = true;
                    vizState.draggingObjectId = hitObject.id;
                }
                const activeObj = getObjectById(vizState.draggingObjectId);
                if (!activeObj) return;
                const hit = screenToPlanePoint(h.centerX, h.centerY);
                if (hit) {
                    const local = vizState.planeGroup.worldToLocal(hit.clone());
                    const currentY = activeObj.target ? activeObj.target.y : activeObj.mesh.position.y;
                    activeObj.target.set(local.x, currentY, local.z);
                }
                if (leftPalmOpen && h.label === 'Right') {
                    if (!vizState.verticalAdjust || vizState.verticalAdjust.id !== activeObj.id) {
                        vizState.verticalAdjust = { id: activeObj.id, startHandY: h.centerY, startObjY: activeObj.target.y };
                    }
                    const delta = (vizState.verticalAdjust.startHandY - h.centerY) / window.innerHeight;
                    const nextY = clamp(vizState.verticalAdjust.startObjY + delta * 8, 0.4, 6);
                    activeObj.target.y = nextY;
                } else {
                    vizState.verticalAdjust = null;
                }
                vizState.isInteracting = true;
                vizState.wasInteracting = true;
                return;
            }

            vizState.isInteracting = false;
            vizState.singlePinchActive = false;
            vizState.draggingObjectId = null;
            vizState.verticalAdjust = null;
            if (vizState.wasInteracting) autoSaveProject();
            vizState.wasInteracting = false;
        }

        // --- Event Listeners for Visualizer UI ---
        window.addEventListener('resize', resizeVisualizer);
        
        function resetPlane() {
            if (!vizState.planeGroup) return;
            vizState.planeGroup.position.set(0, 0, 0);
            vizState.planeGroup.rotation.set(-0.15, 0, 0);
            vizState.zoom = 1;
            updateCameraZoom();
        }
        function startNewProject() {
            if (!visualizerActive) {
                openVisualizer();
            } else if (!vizState.initialized) {
                initVisualizer();
            }
            if (visualizerApp) visualizerApp.classList.add('visible');
            if (appExitBtn) appExitBtn.classList.add('visible');
            clearObjects();
            resetPlane();
            vizState.trashMode = false;
            if (vizTrashBtn) vizTrashBtn.classList.remove('active');
            if (trashHint) trashHint.classList.remove('visible');
            setCustomizeMode(false);
            if (colorPickerOverlay) colorPickerOverlay.classList.remove('visible');
            vizState.currentProjectId = `proj-${Date.now()}`;
            vizState.currentProjectName = 'New Project';
            autoSaveProject();
            if (visualizerStart) visualizerStart.classList.remove('visible');
            if (vizAddModal) vizAddModal.classList.remove('visible');
            if (vizMoreMenu) vizMoreMenu.classList.remove('visible');
            playBoop();
        }

        safeOn(vizNewProjectBtn, 'click', startNewProject);
        safeOn(vizNewProjectMenu, 'click', () => {
            vizMoreMenu.classList.remove('visible');
            startNewProject();
        });
        safeOn(vizOpenStartMenu, 'click', () => {
            vizMoreMenu.classList.remove('visible');
            renderSavedProjectsList();
            visualizerStart.classList.add('visible');
            playBoop();
        });
        safeOn(vizOpenSavedBtn, 'click', () => {
            renderSavedProjectsList();
            visualizerStart.classList.add('visible');
            playBoop();
        });
        safeOn(vizOpenFileBtn, 'click', () => {
            vizFileInput.value = '';
            vizFileInput.click();
        });
        safeOn(vizFileInput, 'change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const data = JSON.parse(reader.result);
                    loadProjectData(data);
                    vizState.currentProjectId = data.id || `proj-${Date.now()}`;
                    vizState.currentProjectName = data.name || 'Imported Project';
                    autoSaveProject();
                    visualizerStart.classList.remove('visible');
                    playBoop();
                } catch {
                    alert('Invalid project file.');
                }
            };
            reader.readAsText(file);
        });

        safeOn(vizAddBtn, 'click', () => {
            if (!visualizerActive) return;
            if (visualizerStart.classList.contains('visible')) return;
            vizAddModal.classList.add('visible');
            playBoop();
        });
        safeOn(vizAddCancelBtn, 'click', () => {
            vizAddModal.classList.remove('visible');
            playBoop();
        });
        safeOn(vizMoreBtn, 'click', () => {
            if (!visualizerActive) return;
            vizMoreMenu.classList.toggle('visible');
            playBoop();
        });
        safeOn(vizCustomizeBtn, 'click', () => {
            if (!visualizerActive) return;
            setCustomizeMode(!vizState.customizeMode);
            playBoop();
        });
        safeOn(vizTrashBtn, 'click', () => {
            if (!visualizerActive) return;
            vizState.trashMode = !vizState.trashMode;
            vizTrashBtn.classList.toggle('active', vizState.trashMode);
            trashHint.classList.toggle('visible', vizState.trashMode);
            playBoop();
        });
        safeOn(vizEditCloseBtn, 'click', () => {
            closeEditPopover();
            playBoop();
        });
        safeOn(vizOpenColorMapBtn, 'click', () => {
            openColorPicker();
            playBoop();
        });
        safeOn(colorMapDoneBtn, 'click', () => {
            closeColorPicker();
            playBoop();
        });

        let colorMapDragging = false;
        function resizeColorMap() {
            if (!colorMapCanvas || !colorPickerOverlay || !colorPickerOverlay.classList.contains('visible')) return;
            const rect = colorMapCanvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            colorMapCanvas.width = Math.round(rect.width);
            colorMapCanvas.height = Math.round(rect.height);
            drawColorMap(Number(colorMapHue ? colorMapHue.value : 210));
        }

        function openColorPicker() {
            if (!colorPickerOverlay) return;
            colorPickerOverlay.classList.add('visible');
            requestAnimationFrame(resizeColorMap);
            drawColorMap(Number(colorMapHue ? colorMapHue.value : 210));
        }

        function closeColorPicker() {
            if (colorPickerOverlay) colorPickerOverlay.classList.remove('visible');
        }

        function pickColorFromMap(e) {
            if (!colorMapCanvas) return;
            const rect = colorMapCanvas.getBoundingClientRect();
            const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
            const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
            const scaleX = colorMapCanvas.width / rect.width;
            const scaleY = colorMapCanvas.height / rect.height;
            const ctx = colorMapCanvas.getContext('2d');
            const data = ctx.getImageData(Math.floor(x * scaleX), Math.floor(y * scaleY), 1, 1).data;
            const hex = `#${[data[0], data[1], data[2]].map(v => v.toString(16).padStart(2, '0')).join('')}`;
            setEditorColor(hex);
        }

        safeOn(vizEditHex, 'input', (e) => {
            const normalized = normalizeHexInput(e.target.value);
            if (normalized) setEditorColor(normalized);
        });
        safeOn(colorMapHex, 'input', (e) => {
            const normalized = normalizeHexInput(e.target.value);
            if (normalized) setEditorColor(normalized);
        });
        safeOn(vizHueSlider, 'input', (e) => {
            const hue = Number(e.target.value);
            setEditorColor(hslToHex(hue, 100, 50));
        });
        safeOn(colorMapHue, 'input', (e) => {
            const hue = Number(e.target.value);
            drawColorMap(hue);
            setEditorColor(hslToHex(hue, 100, 50));
        });
        safeOn(colorMapCanvas, 'pointerdown', (e) => {
            colorMapDragging = true;
            pickColorFromMap(e);
        });
        safeOn(colorMapCanvas, 'pointermove', (e) => {
            if (!colorMapDragging) return;
            pickColorFromMap(e);
        });
        window.addEventListener('pointerup', () => { colorMapDragging = false; });

        const pointerState = { active: false, mode: null, lastX: 0, lastY: 0 };
        safeOn(visualizerCanvas, 'contextmenu', (e) => e.preventDefault());
        safeOn(visualizerCanvas, 'pointerdown', (e) => {
            if (!visualizerActive || visualizerStart.classList.contains('visible') || vizAddModal.classList.contains('visible') || vizMoreMenu.classList.contains('visible') || (vizEditPopover && vizEditPopover.classList.contains('visible')) || (colorPickerOverlay && colorPickerOverlay.classList.contains('visible'))) return;
            pointerState.active = true;
            pointerState.lastX = e.clientX;
            pointerState.lastY = e.clientY;
            if (e.button === 0) {
                const hitObj = raycastObjectAt(e.clientX, e.clientY);
                if (hitObj) {
                    if (vizState.customizeMode) {
                        openEditPopover(hitObj.id);
                        pointerState.active = false;
                        return;
                    }
                    if (vizState.trashMode) {
                        removeObjectById(hitObj.id);
                        pointerState.active = false;
                        return;
                    }
                    vizState.draggingObjectId = hitObj.id;
                    pointerState.mode = 'object';
                } else {
                    pointerState.mode = null;
                }
            } else if (e.button === 2) {
                pointerState.mode = 'rotate';
            } else if (e.button === 1) {
                pointerState.mode = 'pan';
            }
        });
        safeOn(visualizerCanvas, 'pointermove', (e) => {
            if (!visualizerActive || !pointerState.active) return;
            const dx = e.clientX - pointerState.lastX;
            const dy = e.clientY - pointerState.lastY;
            pointerState.lastX = e.clientX;
            pointerState.lastY = e.clientY;
            if (pointerState.mode === 'object' && vizState.draggingObjectId) {
                const activeObj = getObjectById(vizState.draggingObjectId);
                const hit = screenToPlanePoint(e.clientX, e.clientY);
                if (activeObj && hit) {
                    const local = vizState.planeGroup.worldToLocal(hit.clone());
                    activeObj.target.set(local.x, 1.2, local.z);
                }
            } else if (pointerState.mode === 'rotate') {
                vizState.planeGroup.rotation.y += dx * 0.006;
                vizState.planeGroup.rotation.x = clamp(vizState.planeGroup.rotation.x + dy * 0.004, -0.7, 0.35);
            } else if (pointerState.mode === 'pan') {
                vizState.planeGroup.position.x += dx * 0.02;
                vizState.planeGroup.position.z += dy * 0.02;
            }
            vizState.isInteracting = true;
        });
        function clearPointerState() {
            pointerState.active = false;
            pointerState.mode = null;
            vizState.draggingObjectId = null;
            if (visualizerActive) autoSaveProject();
        }
        safeOn(visualizerCanvas, 'pointerup', clearPointerState);
        safeOn(visualizerCanvas, 'pointerleave', clearPointerState);
        safeOn(visualizerCanvas, 'wheel', (e) => {
            if (!visualizerActive) return;
            vizState.zoom = clamp(vizState.zoom + e.deltaY * 0.001, 0.55, 1.85);
            updateCameraZoom();
            if (vizState.wheelSaveTimeout) clearTimeout(vizState.wheelSaveTimeout);
            vizState.wheelSaveTimeout = setTimeout(() => autoSaveProject(), 300);
        });

        /* --------------------------------------------------------------------------
           3.5 ASL Trainer Logic [NEW SECTION]
           -------------------------------------------------------------------------- */
        
        let aslTrainerActive = false; // Global flag for the ASL Trainer app.
        
        // State object for the ASL Trainer.
        const aslState = {
            targetLetters: ['A', 'B', 'C', 'D', 'E'],
            currentLetterIdx: 0,
            attempts: 0,
            correctSigns: 0,
            signStartTime: null,
            correctHoldDuration: 2.0, // seconds
            // Image sources for the target letters.
            imageSources: {
                'A': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Sign_language_A.svg/1200px-Sign_language_A.svg.png',
                'B': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Sign_language_B.svg/1200px-Sign_language_B.svg.png',
                'C': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Sign_language_C.svg/1200px-Sign_language_C.svg.png',
                'D': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Sign_language_D.svg/1200px-Sign_language_D.svg.png',
                'E': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Sign_language_E.svg/1200px-Sign_language_E.svg.png'
            }
        };

        // Opens the ASL Trainer app.
        function openAslTrainer() {
            if (aslTrainerActive) return;
            aslTrainerActive = true;
            document.body.classList.add('asl-trainer-mode');
            aslTrainerApp.classList.add('visible');
            appExitBtn.classList.add('visible');
            if (controlCenter.classList.contains('visible')) controlCenter.classList.remove('visible');
            
            // Reset stats and start with the first letter
            aslState.currentLetterIdx = 0;
            aslState.attempts = 0;
            aslState.correctSigns = 0;
            aslState.signStartTime = null;
            
            toggleLauncher(false);
            appsOpenCount++;
            drawAslUi(); // Initial UI draw
            playBoop();
        }

        // Closes the ASL Trainer app.
        function closeAslTrainer() {
            if (!aslTrainerActive) return;
            aslTrainerActive = false;
            document.body.classList.remove('asl-trainer-mode');
            aslTrainerApp.classList.remove('visible');
            appExitBtn.classList.remove('visible');
            
            appsOpenCount = Math.max(0, appsOpenCount - 1);
            if (appsOpenCount === 0) toggleLauncher(true);
            playBoop();
        }

        // Updates the HTML elements of the ASL Trainer UI based on the current state.
        function drawAslUi() {
            const state = aslState;
            const targetLetter = state.targetLetters[state.currentLetterIdx];
            
            aslTargetImageEl.src = state.imageSources[targetLetter];
            
            const accuracy = state.attempts > 0 ? (state.correctSigns / state.attempts * 100) : 0;
            aslAttemptsEl.innerText = `Attempts: ${state.attempts}`;
            aslCorrectEl.innerText = `Correct: ${state.correctSigns}`;
            aslAccuracyEl.innerText = `Accuracy: ${accuracy.toFixed(1)}%`;
        }

        // Calculates the Euclidean distance between two landmark points.
        function calculateDistance(p1, p2) {
            return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
        }

        // Determines if each finger is open or closed, accounting for left/right hand.
        function getFingerStates(landmarks, handedness) {
            const fingerStates = [];
            const tipIds = [4, 8, 12, 16, 20];
            const pipIds = [3, 6, 10, 14, 18]; // Proximal Interphalangeal joint

            // --- Thumb ---
            // Logic is different for left vs. right hand due to mirroring.
            if (handedness === 'Right') {
                fingerStates.push(landmarks[tipIds[0]].x < landmarks[pipIds[0]].x);
            } else { // Left Hand
                fingerStates.push(landmarks[tipIds[0]].x > landmarks[pipIds[0]].x);
            }

            // --- Other Four Fingers ---
            // Logic is the same for both hands (tip.y < joint.y).
            for (let i = 1; i < 5; i++) {
                fingerStates.push(landmarks[tipIds[i]].y < landmarks[pipIds[i]].y);
            }
            return fingerStates;
        }

        // Recognizes an ASL letter from hand landmarks, now accepting handedness.
        function recognizeAslLetter(landmarks, handedness) {
            if (!landmarks || !handedness) return null;
            
            const fingerStates = getFingerStates(landmarks, handedness);
            const [thumbOpen, indexOpen, middleOpen, ringOpen, pinkyOpen] = fingerStates;

            // Letter A: Fist with thumb on the side.
            if (thumbOpen && !indexOpen && !middleOpen && !ringOpen && !pinkyOpen && landmarks[4].y < landmarks[5].y) {
                return 'A';
            }
            // Letter B: All four fingers up, thumb tucked.
            if (!thumbOpen && indexOpen && middleOpen && ringOpen && pinkyOpen) {
                return 'B';
            }
            // Letter C: Hand in a curved 'C' shape.
            if (thumbOpen && indexOpen && landmarks[8].y > landmarks[6].y && landmarks[12].y > landmarks[10].y) {
                if (calculateDistance(landmarks[4], landmarks[13]) > calculateDistance(landmarks[8], landmarks[13])) {
                    return 'C';
                }
            }
            // Letter D: Index finger up, other fingers touching thumb.
            if (!thumbOpen && indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
                if (calculateDistance(landmarks[4], landmarks[12]) < 0.07) {
                    return 'D';
                }
            }
            // Letter E: Fist with thumb tucked in, fingers curled over.
            if (!thumbOpen && !indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
                if (landmarks[8].y > landmarks[6].y && landmarks[12].y > landmarks[10].y) {
                    return 'E';
                }
            }
            return null;
        }

        // Main logic loop for the ASL Trainer, called from onResults.
        function updateAslTrainerFromHands(handLandmarks, handedness) {
            if (!aslTrainerActive) return;

            const recognized = recognizeAslLetter(handLandmarks, handedness);
            const target = aslState.targetLetters[aslState.currentLetterIdx];
            let progress = 0;

            if (recognized === target) {
                aslFeedbackEl.innerText = "Correct!";
                aslFeedbackEl.style.color = '#30d158'; // Green

                if (aslState.signStartTime === null) {
                    aslState.signStartTime = Date.now();
                }
                
                const elapsedTime = (Date.now() - aslState.signStartTime) / 1000;
                progress = Math.min(elapsedTime / aslState.correctHoldDuration, 1.0);

                if (elapsedTime >= aslState.correctHoldDuration) {
                    aslState.correctSigns++;
                    aslState.attempts++;
                    aslState.currentLetterIdx = (aslState.currentLetterIdx + 1) % aslState.targetLetters.length;
                    aslState.signStartTime = null;
                    progress = 0;
                    playBoop();
                    drawAslUi(); // Update UI for new letter
                }
            } else {
                aslFeedbackEl.innerText = "Incorrect";
                aslFeedbackEl.style.color = '#ff5f56'; // Red
                aslState.signStartTime = null;
                progress = 0;
            }
            
            aslProgressBarEl.style.width = `${progress * 100}%`;
        }


        /* --------------------------------------------------------------------------
           3.6 General UI Logic (Windows, Launcher)
           -------------------------------------------------------------------------- */
        
        const cursor = document.getElementById('cursor');
        const launcher = document.getElementById('appLauncher');
        let zIndex = 100; // Manages the stacking order of windows.
        let appsOpenCount = 0; // Tracks how many apps are open.
        let activeWindow = null; // The currently focused window.

        // Shows or hides the app launcher overlay.
        function toggleLauncher(show) {
            launcher.classList.toggle('hidden', !show);
        }
        document.getElementById('launcherClose').addEventListener('click', () => { toggleLauncher(false); playBoop(); });

        // Opens an application window or a full-screen app.
        function openApp(id) {
            if (id === 'visualizer') {
                openVisualizer();
                return;
            }
            if (id === 'asl-trainer') { // [NEW]
                openAslTrainer();
                return;
            }
            const win = document.getElementById(id);
            if(win) { 
                win.classList.add('active'); 
                win.style.zIndex = ++zIndex; // Bring to front.
                appsOpenCount++; 
                toggleLauncher(false);
                activeWindow = win;
                playBoop();
            }
        }

        // General exit button handler for full-screen apps
        safeOn(appExitBtn, 'click', () => {
            if (visualizerActive) closeVisualizer();
            if (aslTrainerActive) closeAslTrainer(); // [NEW]
        });

        // Closes an application window.
        function closeApp(win) {
            win.classList.remove('active', 'maximized'); 
            appsOpenCount--;
            // If no apps are left open, show the launcher.
            if(appsOpenCount === 0) {
                toggleLauncher(true);
                activeWindow = null;
            } else {
                // Otherwise, find the next top-most window to be active.
                const wins = Array.from(document.querySelectorAll('.window.active')).sort((a,b) => b.style.zIndex - a.style.zIndex);
                activeWindow = wins.length > 0 ? wins[0] : null;
            }
            playBoop();
        }

        // Handles focusing a window when it's clicked.
        document.addEventListener('click', (e) => {
            const win = e.target.closest('.window');
            if(win && win !== activeWindow) {
                activeWindow = win;
                win.style.zIndex = ++zIndex; // Bring to front.
            }
        });

        // Logic for the Photos app.
        function openPhoto(target) {
            const win = target.closest('.window');
            const viewer = win.querySelector('.photo-viewer');
            const imgEl = viewer.querySelector('img');
            const metaDiv = win.querySelector('.photo-metadata');
            viewer.classList.remove('visible');
            imgEl.style.opacity = '0'; metaDiv.style.opacity = '0'; imgEl.src = ''; 
            win.querySelector('#metaDate').textContent = target.dataset.date;
            win.querySelector('#metaLoc').textContent = target.dataset.loc;
            viewer.style.display = 'flex';
            win.querySelector('.btn-back').style.display = 'block';
            win.querySelector('.header-title').textContent = 'View';
            imgEl.src = target.dataset.full;
            imgEl.onload = () => { viewer.classList.add('visible'); imgEl.style.opacity = '1'; metaDiv.style.opacity = '1'; }
            playBoop();
        }
        function closePhoto(win) {
            const viewer = win.querySelector('.photo-viewer');
            viewer.classList.remove('visible');
            setTimeout(() => { viewer.style.display = 'none'; viewer.querySelector('img').src = ''; }, 300);
            win.querySelector('.btn-back').style.display = 'none';
            win.querySelector('.header-title').textContent = 'Photos';
        }

        /* --------------------------------------------------------------------------
           3.7 Hand Tracking Engine (MediaPipe)
           -------------------------------------------------------------------------- */
        
        // This function acts as a router for "pinch" clicks, determining what UI element was targeted.
        function triggerClick(x, y) {
            cursor.classList.add('clicked');
            setTimeout(() => cursor.classList.remove('clicked'), 200);
            
            let target = lockedElement || document.elementFromPoint(x, y);
            if(!target) return;
            
            if (controlCenter.classList.contains('visible') && !controlCenter.contains(target) && !controlCenterTrigger.contains(target)) {
                controlCenter.classList.remove('visible');
            }

            if(target.closest('.app-item, #launcherClose, .win-btn, .gallery-img, #showCameraBtn, .control-item, #appExitBtn, .status-btn, .object-trash, .object-edit, .viz-action-btn')) playBoop();

            if(target.closest('#appExitBtn')) { target.closest('#appExitBtn').click(); return; }
            if(target.closest('.status-btn')) { target.closest('.status-btn').click(); return; }
            if(target.closest('.object-edit')) { target.closest('.object-edit').click(); return; }
            if(target.closest('.object-trash')) { target.closest('.object-trash').click(); return; }
            if(target.closest('.viz-action-btn')) { target.closest('.viz-action-btn').click(); return; }
            if(!visualizerActive && !aslTrainerActive && target.closest('#controlCenterTrigger')) { target.closest('#controlCenterTrigger').click(); return; }
            if(target.closest('.control-item')) { target.closest('.control-item').click(); return; }

            if(target.closest('.app-item')) { openApp(target.closest('.app-item').dataset.target); return; }
            if(target.closest('#launcherClose')) { toggleLauncher(false); return; }
            
            const win = target.closest('.window');
            if(win) {
                if(win !== activeWindow) {
                    activeWindow = win;
                    win.style.zIndex = ++zIndex;
                }
                if(target.closest('.btn-close')) { closeApp(win); return; }
                if(target.closest('.btn-max')) { win.classList.toggle('maximized'); return; }
                if(target.closest('.btn-back')) { closePhoto(win); return; }
            }
            if(target.classList.contains('gallery-img')) { openPhoto(target); return; }
            if(target.closest('.slider-container')) { updateSlider(target.closest('.slider-container'), x); isPinching = true; dragItem = target.closest('.slider-container'); return; }
            if(target.closest('#showCameraBtn')) { target.closest('#showCameraBtn').click(); return; }
            
            // Logic for initiating window dragging or resizing.
            if(win && !win.classList.contains('maximized')) {
                if(target.closest('.resize-handle')) {
                    isResizing = true; activeWindow = win;
                    const r = win.getBoundingClientRect();
                    resizeData = { w: r.width, h: r.height, startX: x, startY: y };
                } else if(target.closest('.window-header') && target.tagName !== 'BUTTON') {
                    dragItem = win;
                    const r = win.getBoundingClientRect();
                    dragOffset.x = x - parseFloat(win.style.left || window.innerWidth / 2);
                    dragOffset.y = y - parseFloat(win.style.top || window.innerHeight / 2);
                    target.closest('.window-header').classList.add('dragging');
                }
            }
        }

        // Updates the brightness slider based on cursor position.
        function updateSlider(slider, x) {
            const rect = slider.getBoundingClientRect();
            let pct = (x - rect.left) / rect.width;
            pct = Math.max(0, Math.min(1, pct));
            slider.querySelector('.mac-slider-fill').style.width = (pct * 100) + '%';
            document.body.style.filter = `brightness(${0.3 + (pct * 0.7)})`;
        }

        // --- Tracking State Variables ---
        const video = document.getElementById('videoElement');
        const camCanvas = document.getElementById('camCanvas');
        const ctx = camCanvas.getContext('2d');
        
        let cursorX = window.innerWidth/2, cursorY = window.innerHeight/2;
        let isPinching = false;
        let lockedElement = null; // The UI element the cursor is currently "magnetized" to.
        let dragItem = null;      // The window or slider currently being dragged.
        let dragOffset = {x:0, y:0};
        let isResizing = false;
        let resizeData = {};
        let lastPalmTime = 0;     // Timestamp to prevent rapid firing of the palm gesture.

        // --- Tracking Constants ---
        const PINCH_THRESH = 0.05;   // Distance (normalized) to consider a pinch a "click".
        const PINCH_RELEASE = 0.07;  // Distance to consider the pinch released.
        const MAGNET_DIST = 40;      // Distance (pixels) to snap the cursor to a target.
        const MAGNET_BREAK = 90;     // Distance to break the magnetic lock.

        // --- MediaPipe Initialization ---
        const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
        hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });
        hands.onResults(onResults); // Set the callback function for when tracking data is available.
        
        const camera = new Camera(video, { 
            onFrame: async () => { await hands.send({image: video}); }, 
            width: 640, height: 480 
        });
        let cameraStarted = false;
        function startCamera() {
            if (cameraStarted) return;
            cameraStarted = true;
            camera.start();
        }
        startCamera(); // Start camera immediately.
        document.body.addEventListener('click', startCamera, { once: true }); // Also start on first click as a fallback.

        // --- Main Tracking Loop ---
        // This function is called by MediaPipe every time it processes a frame from the camera.
        function onResults(results) {
            ctx.clearRect(0, 0, camCanvas.width, camCanvas.height);
            
            if(results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                // --- 1. Get Hand Data & Calculate Cursor Position ---
                const lm = results.multiHandLandmarks[0]; // Use the first detected hand for the main cursor.
                const indexTip = lm[8]; const thumbTip = lm[4];

                // Convert normalized coordinates (0.0 to 1.0) from MediaPipe to screen pixels.
                const SCALE = 1.1; // A slight scale to allow reaching screen edges more easily.
                const rawIndexX = (((1 - indexTip.x) - 0.5) * SCALE + 0.5) * window.innerWidth;
                const rawIndexY = ((indexTip.y - 0.5) * SCALE + 0.5) * window.innerHeight;
                const rawThumbX = (((1 - thumbTip.x) - 0.5) * SCALE + 0.5) * window.innerWidth;
                const rawThumbY = ((thumbTip.y - 0.5) * SCALE + 0.5) * window.innerHeight;

                // Update the visual finger dots.
                document.getElementById('indexDot').style.left = rawIndexX + 'px';
                document.getElementById('indexDot').style.top = rawIndexY + 'px';
                document.getElementById('thumbDot').style.left = rawThumbX + 'px';
                document.getElementById('thumbDot').style.top = rawThumbY + 'px';

                // The target cursor position is the midpoint between the thumb and index finger.
                let targetX = (rawIndexX + rawThumbX) / 2;
                let targetY = (rawIndexY + rawThumbY) / 2;
                
                // Clamp coordinates to stay within the screen bounds.
                targetX = Math.max(0, Math.min(window.innerWidth, targetX));
                targetY = Math.max(0, Math.min(window.innerHeight, targetY));

                // Apply smoothing (lerp) to the cursor movement to prevent jitter.
                const distMove = Math.hypot(targetX - cursorX, targetY - cursorY);
                let alpha = distMove > 50 ? 0.4 : (distMove > 20 ? 0.2 : 0.08); // More smoothing for small movements.
                cursorX += (targetX - cursorX) * alpha;
                cursorY += (targetY - cursorY) * alpha;

                // --- 2. Handle Cursor Magnetism ---
                if (lockedElement) {
                    const rect = lockedElement.getBoundingClientRect();
                    const cx = rect.left + rect.width/2; const cy = rect.top + rect.height/2;
                    if (Math.hypot(cursorX - cx, cursorY - cy) < MAGNET_BREAK) {
                        cursorX += (cx - cursorX) * 0.4; cursorY += (cy - cursorY) * 0.4;
                        cursor.classList.add('locked'); lockedElement.classList.add('hover-active');
                    } else {
                        lockedElement.classList.remove('hover-active'); lockedElement = null; cursor.classList.remove('locked');
                    }
                } else {
                    const potential = document.elementsFromPoint(cursorX, cursorY);
                    for(let el of potential) {
                        const l = el.closest('.win-btn, .app-item, .gallery-img, #launcherClose, #showCameraBtn, .control-item, #controlCenterTrigger, #appExitBtn, .status-btn, .object-trash, .object-edit, .viz-action-btn');
                        if (l) {
                            const r = l.getBoundingClientRect();
                            if (Math.hypot(cursorX - (r.left+r.width/2), cursorY - (r.top+r.height/2)) < MAGNET_DIST) {
                                lockedElement = l; break;
                            }
                        }
                    }
                }

                // Update the cursor's final position on the screen.
                cursor.style.left = cursorX + 'px'; cursor.style.top = cursorY + 'px';

                // --- 3. Detect Pinch Gesture & Handle Clicks/Drags ---
                const distPinch = Math.hypot(rawIndexX - rawThumbX, rawIndexY - rawThumbY) / window.innerWidth;
                const targetEl = document.elementFromPoint(cursorX, cursorY);
                const allowUiClick = (!visualizerActive && !aslTrainerActive) || (targetEl && targetEl.closest('#appExitBtn, .status-btn, #visualizerStart, #vizAddModal, #vizMoreMenu, #vizEditPopover, #colorPickerOverlay, .object-trash, .object-edit, .viz-action-btn'));
                
                if(!isPinching && distPinch < PINCH_THRESH) {
                    isPinching = true; 
                    if (allowUiClick) triggerClick(cursorX, cursorY);
                } else if(isPinching && distPinch > PINCH_RELEASE) {
                    isPinching = false;
                    // Release any dragged or resized items.
                    if(dragItem && dragItem instanceof HTMLElement && dragItem.classList.contains('window')) dragItem.querySelector('.window-header').classList.remove('dragging');
                    dragItem = null; isResizing = false;
                }

                // If a pinch is ongoing, update the position of the dragged/resized item.
                if(isPinching && !visualizerActive && !aslTrainerActive) {
                    if(dragItem) {
                        if(dragItem.classList.contains('slider-container')) { updateSlider(dragItem, cursorX); }
                        else if(dragItem.classList.contains('window')) {
                            dragItem.style.transform = 'translate(-50%, -50%)';
                            dragItem.style.left = (cursorX - dragOffset.x) + 'px';
                            dragItem.style.top = (cursorY - dragOffset.y) + 'px';
                        }
                    } else if(isResizing && activeWindow) {
                        const dX = cursorX - resizeData.startX; 
                        const dY = cursorY - resizeData.startY;
                        activeWindow.style.width = Math.max(400, resizeData.w + dX) + 'px';
                        activeWindow.style.height = Math.max(300, resizeData.h + dY) + 'px';
                    }
                }

                // --- 4. Detect Palm Gesture for App Launcher ---
                if(!visualizerActive && !aslTrainerActive && !isPinching && !dragItem && appsOpenCount > 0) {
                     const fo = lm[20].y < lm[18].y && lm[16].y < lm[14].y && lm[12].y < lm[10].y && lm[8].y < lm[6].y;
                     const now = Date.now();
                     if(fo && (now - lastPalmTime > 1000)) { 
                         toggleLauncher(true); 
                         document.getElementById('palmHint').style.opacity=0;
                         lastPalmTime = now;
                     }
                }
            }
            // --- 5. Update Full-Screen Apps ---
            updateVisualizerFromHands(results.multiHandLandmarks || [], results.multiHandedness || []);
            // [MODIFIED] Pass the first detected hand and its handedness to the ASL trainer.
            updateAslTrainerFromHands(
                results.multiHandLandmarks ? results.multiHandLandmarks[0] : null,
                results.multiHandedness ? results.multiHandedness[0]?.label : null
            );
        }

        // Set canvas dimensions once the video metadata is loaded.
        video.onloadedmetadata = () => { 
            if(video.videoWidth > 0 && video.videoHeight > 0) {
                camCanvas.width = video.videoWidth; 
                camCanvas.height = video.videoHeight; 
            }
        }