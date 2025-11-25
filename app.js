// Variables globales
let db = null;
let SQL = null;

// Inicializar sql.js
async function initSQL() {
    try {
        if (window.initSqlJs) {
            // sql-asm.js no requiere locateFile ya que no usa archivos WASM externos
            SQL = await window.initSqlJs();
        } else {
            console.error('initSqlJs no está disponible. Verifica que sql-asm.js se haya cargado correctamente.');
        }
    } catch (error) {
        console.error('Error al inicializar SQL.js:', error);
    }
}

// Función para calcular la posición del beat en segundos desde el blob de beats
// Nota: Esta es una aproximación simplificada. Para una implementación completa
// necesitarías el schema de protobuf de Mixxx (beats_pb2.BeatGrid)
function calculateBeatPosition(blobData, sampleRate, bpm) {
    try {
        if (!blobData || !sampleRate || !bpm) return null;
        
        // El blob contiene un protobuf serializado de BeatGrid
        // Intentamos leer los valores directamente desde los bytes
        // Esto es una aproximación y puede no funcionar para todos los casos
        
        const dataView = new DataView(blobData);
        
        // Buscar el frame_position en el protobuf
        // Los protobufs almacenan campos con tags, necesitamos buscar el campo correcto
        // Por ahora, usamos un valor por defecto de 0.0
        // En producción, necesitarías usar protobuf.js con el schema de Mixxx
        
        // Valor por defecto: inicio del primer beat
        return 0.0;
    } catch (error) {
        console.warn('Error al calcular beat position:', error);
        return null;
    }
}

// Función para normalizar rutas (convertir barras invertidas a barras normales)
function normalizePath(path) {
    if (!path) return path;
    // Convertir todas las barras invertidas a barras normales
    return path.replace(/\\/g, '/');
}

// Función para convertir path de Linux a Windows
function convertPath(originalLocation, oldBase, newBase) {
    if (originalLocation.startsWith("file://localhost//")) {
        // Quitar el prefijo file://localhost//
        const linuxPath = originalLocation.substring(17);
        
        // Normalizar las rutas base para comparación
        const normalizedOldBase = normalizePath(oldBase);
        const normalizedNewBase = normalizePath(newBase);
        
        // Remapear la carpeta base
        if (linuxPath.startsWith(normalizedOldBase)) {
            const windowsPath = linuxPath.replace(normalizedOldBase, normalizedNewBase);
            // Normalizar la ruta de Windows y asegurar que tenga barra después de localhost
            const normalizedWindowsPath = normalizePath(windowsPath);
            // Asegurar que comience con / después de localhost
            const finalPath = normalizedWindowsPath.startsWith('/') 
                ? normalizedWindowsPath 
                : '/' + normalizedWindowsPath;
            return `file://localhost${finalPath}`;
        } else {
            return originalLocation;
        }
    }
    return originalLocation;
}

// Función para escapar XML
function escapeXml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

// Función para obtener el color hexadecimal
function getHexColor(color) {
    if (!color) return '';
    
    const colorMap = {
        86264: '0x0000FF',      // Blue
        2023424: '0x00FF00',    // Green
        8849664: '0xFF0000',    // Red
        9963768: '0x660099',    // Purple
        16281848: '0xFF007F',   // Rose/Pink
        16293936: '0xFFA500',   // Orange
        16311089: '0xFFFF00'    // Yellow
    };
    
    return colorMap[color] || '';
}

// Función para obtener el nombre del color
function getColorName(color) {
    if (!color) return '';
    
    const colorMap = {
        86264: 'Blue',
        2023424: 'Green',
        8849664: 'Red',
        9963768: 'Purple',
        16281848: 'Pink',
        16293936: 'Orange',
        16311089: 'Yellow'
    };
    
    return colorMap[color] || '';
}

// Función para obtener el rating
function getRating(rating) {
    const ratingMap = {
        0: 0,
        1: 51,
        2: 102,
        3: 153,
        4: 204,
        5: 255
    };
    
    if (rating >= 5) return 255;
    return ratingMap[rating] || 0;
}

// Función para obtener el tipo de archivo
function getFileType(filetype) {
    if (filetype === 'm4a') return 'M4A File';
    if (filetype === 'mp3') return 'MP3 File';
    return filetype || '';
}

// Función para generar el XML
function generateXML(tracks, positionMarks, playlists, oldBase, newBase) {
    let xml = '<?xml version=\'1.0\' encoding=\'UTF-8\'?>\n';
    xml += '<DJ_PLAYLISTS Version="1.0.0">\n';
    xml += '  <PRODUCT Name="rekordbox" Version="6.7.7" Company="AlphaTheta"/>\n';
    xml += `  <COLLECTION Entries="${tracks.length}">\n`;
    
    // Generar tracks
    tracks.forEach(track => {
        const location = convertPath(track.Location, oldBase, newBase);
        const hexColor2 = getHexColor(track.color);
        const grouping = getColorName(track.color);
        
        xml += `    <TRACK TrackID="${escapeXml(track.TrackID)}" `;
        xml += `Name="${escapeXml(track.Name)}" `;
        xml += `Artist="${escapeXml(track.Artist)}" `;
        xml += `Composer="${escapeXml(track.Composer)}" `;
        xml += `Album="${escapeXml(track.Album)}" `;
        xml += `Grouping="${escapeXml(grouping)}" `;
        xml += `Genre="${escapeXml(track.Genre)}" `;
        xml += `Kind="${escapeXml(getFileType(track.Kind))}" `;
        xml += `Size="${escapeXml(track.Size)}" `;
        xml += `TotalTime="${escapeXml(track.TotalTime)}" `;
        xml += `DiscNumber="" `;
        xml += `TrackNumber="${escapeXml(track.TrackNumber)}" `;
        xml += `Year="${escapeXml(track.Year)}" `;
        xml += `AverageBpm="${escapeXml(track.AverageBpm)}" `;
        xml += `DateAdded="" `;
        xml += `BitRate="${escapeXml(track.BitRate)}" `;
        xml += `SampleRate="${escapeXml(track.SampleRate)}" `;
        xml += `Comments="${escapeXml(track.Comments)}" `;
        xml += `PlayCount="${escapeXml(track.PlayCount)}" `;
        xml += `Rating="${escapeXml(getRating(track.Rating))}" `;
        xml += `Location="${escapeXml(location)}" `;
        xml += `Remixer="" `;
        xml += `Tonality="${escapeXml(track.Tonality)}" `;
        xml += `Label="" `;
        xml += `Mix="" `;
        xml += `Colour="${escapeXml(hexColor2)}"`;
        xml += '>\n';
        
        // TEMPO element
        if (track.AverageBpm && track.SampleRate) {
            // Intentar calcular la posición del beat desde el blob
            let beatPosition = null;
            if (track.beats && track.beats.length > 0) {
                // Convertir ArrayBuffer/Uint8Array a formato usable
                const beatsData = track.beats instanceof Uint8Array ? track.beats : new Uint8Array(track.beats);
                beatPosition = calculateBeatPosition(beatsData.buffer, track.SampleRate, track.AverageBpm);
            }
            
            // Usar posición calculada o valor por defecto
            const inizio = beatPosition !== null ? beatPosition.toFixed(3) : "0.000";
            xml += `      <TEMPO Inizio="${inizio}" Bpm="${escapeXml(track.AverageBpm)}" Metro="4/4" Battito="1"/>\n`;
        }
        
        // POSITION_MARK elements
        if (positionMarks[track.TrackID]) {
            positionMarks[track.TrackID].forEach(pm => {
                xml += `      <POSITION_MARK `;
                xml += `Name="${escapeXml(pm.Name)}" `;
                xml += `Type="${escapeXml(pm.Type)}" `;
                xml += `Start="${escapeXml(pm.Start)}" `;
                xml += `Num="${escapeXml(pm.Num)}" `;
                xml += `Red="${escapeXml(pm.Red)}" `;
                xml += `Green="${escapeXml(pm.Green)}" `;
                xml += `Blue="${escapeXml(pm.Blue)}"`;
                xml += '/>\n';
            });
        }
        
        xml += '    </TRACK>\n';
    });
    
    xml += '  </COLLECTION>\n';
    
    // Solo incluir PLAYLISTS si hay playlists
    if (Object.keys(playlists).length > 0) {
        xml += '  <PLAYLISTS>\n';
        xml += `    <NODE Name="ROOT" Type="0" Count="${Object.keys(playlists).length}">\n`;
        
        // Generar playlists ordenadas por nombre
        Object.entries(playlists)
            .sort(([, a], [, b]) => {
                const nameA = (a.Name || '').toLowerCase();
                const nameB = (b.Name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            })
            .forEach(([playlistId, playlistData]) => {
                xml += `      <NODE Name="${escapeXml(playlistData.Name)}" Type="1" KeyType="0" Entries="${playlistData.Tracks.length}">\n`;
                playlistData.Tracks.forEach(trackId => {
                    xml += `        <TRACK Key="${escapeXml(trackId)}"/>\n`;
                });
                xml += '      </NODE>\n';
            });
        
        xml += '    </NODE>\n';
        xml += '  </PLAYLISTS>\n';
    }
    xml += '</DJ_PLAYLISTS>';
    
    return xml;
}

// Función para procesar la base de datos
async function processDatabase(dbFile, oldBase, newBase, includePlaylists = true, includeCrates = true) {
    try {
        updateStatus(t('readingDb'), 'info');
        updateProgress(10);
        
        const fileBuffer = await dbFile.arrayBuffer();
        const uint8Array = new Uint8Array(fileBuffer);
        
        updateStatus(t('loadingSqlite'), 'info');
        updateProgress(20);
        
        if (!SQL) {
            throw new Error(t('errorSqlNotLoaded'));
        }
        
        db = new SQL.Database(uint8Array);
    
    updateStatus(t('executingQueries'), 'info');
    updateProgress(30);
    
    // Query principal de tracks
    const tracksQuery = `
        SELECT
            T0.id as TrackID,
            IFNULL(T0.artist, '') as Artist,
            IFNULL(T0.title, '') as Name,
            IFNULL(T0.album, '') as Album,
            IFNULL(T0.year, '') as Year,
            IFNULL(T0.genre, '') as Genre,
            IFNULL(T0.tracknumber, '') as TrackNumber,
            IFNULL(T0.comment, '') as Comments,
            IFNULL(T0.duration, '') as TotalTime,
            IFNULL(T0.samplerate, '') as SampleRate,
            IFNULL(T0.bitrate, '') as BitRate,
            IFNULL(T0.bpm, '') as AverageBpm,
            IFNULL(T0.timesplayed, '') as PlayCount,
            CASE WHEN T0.filetype = 'm4a' THEN 'M4A File' WHEN T0.filetype = 'mp3' THEN 'MP3 File' ELSE T0.filetype END as Kind,
            IFNULL(T0.key, '') as Tonality,
            IFNULL(T0.composer, '') as Composer,
            'file://localhost/' || T1.location as Location,
            IFNULL(T1.filesize, '') as Size,
            CASE 
                WHEN T0.rating = 0 THEN 0 
                WHEN T0.rating = 1 THEN 51
                WHEN T0.rating = 2 THEN 102
                WHEN T0.rating = 3 THEN 153
                WHEN T0.rating = 4 THEN 204
                WHEN T0.rating = 5 THEN 255
                WHEN T0.rating > 5 THEN 255
                ELSE 0 
            END as Rating,
            T0.color,
            T0.beats
        FROM library T0
        INNER JOIN track_locations T1 ON T0.id = T1.id
        WHERE T0.mixxx_deleted = 0
    `;
    
    const tracksResult = db.exec(tracksQuery);
    const tracks = tracksResult[0] ? tracksResult[0].values.map(row => {
        const obj = {};
        tracksResult[0].columns.forEach((col, idx) => {
            // Manejar blobs (beats) correctamente
            if (col === 'beats' && row[idx] !== null) {
                // Convertir blob a Uint8Array si es necesario
                if (row[idx] instanceof Uint8Array) {
                    obj[col] = row[idx];
                } else if (row[idx] instanceof ArrayBuffer) {
                    obj[col] = new Uint8Array(row[idx]);
                } else {
                    obj[col] = row[idx];
                }
            } else {
                obj[col] = row[idx];
            }
        });
        return obj;
    }) : [];
    
    updateStatus(t('tracksFound', { count: tracks.length }), 'info');
    updateProgress(50);
    
    // Query de position marks
    const positionMarksQuery = `
        SELECT 
            T0.track_id as TrackID, 
            T0.label as Name,
            0 as Type, 
            ROUND(T0.position / (2.0 * T1.samplerate), 3) as Start, 
            T0.hotcue as Num,
            ((T0.color >> 16) & 255) AS Red,
            ((T0.color >> 8) & 255) AS Green,
            (T0.color & 255) AS Blue
        FROM cues T0 
        INNER JOIN library T1 ON T0.track_id = T1.id
        WHERE T0.type = 1 AND T1.mixxx_deleted = 0
    `;
    
    const positionMarksResult = db.exec(positionMarksQuery);
    const positionMarksData = positionMarksResult[0] ? positionMarksResult[0].values.map(row => {
        const obj = {};
        positionMarksResult[0].columns.forEach((col, idx) => {
            obj[col] = row[idx];
        });
        return obj;
    }) : [];
    
    // Agrupar position marks por TrackID
    const positionMarks = {};
    positionMarksData.forEach(pm => {
        if (!positionMarks[pm.TrackID]) {
            positionMarks[pm.TrackID] = [];
        }
        positionMarks[pm.TrackID].push(pm);
    });
    
    updateStatus(t('positionMarksFound', { count: positionMarksData.length }), 'info');
    updateProgress(70);
    
    // Construir query de playlists y crates según las opciones seleccionadas
    let playlistsQueryParts = [];
    
    if (includePlaylists) {
        playlistsQueryParts.push(`
            SELECT '1' || T0.id AS id, '[P]' || T0.name AS name, T1.track_id, T1.position
            FROM Playlists T0 
            INNER JOIN PlaylistTracks T1 ON T0.id = T1.playlist_id
            INNER JOIN library T2 ON T1.track_id = T2.id
            WHERE T0.hidden = 0
        `);
    }
    
    if (includeCrates) {
        if (includePlaylists) {
            playlistsQueryParts.push('UNION ALL');
        }
        playlistsQueryParts.push(`
            SELECT '2' || T0.id AS id, '[C]' || T0.name AS name, T1.track_id, T1.track_id as position
            FROM crates T0 
            INNER JOIN crate_tracks T1 ON T0.id = T1.crate_id
            INNER JOIN library T2 ON T1.track_id = T2.id
        `);
    }
    
    const playlistsQuery = playlistsQueryParts.length > 0 
        ? playlistsQueryParts.join('\n        ') + '\n        ORDER BY id, position ASC'
        : '';
    
    let playlistsResult = null;
    if (playlistsQuery) {
        playlistsResult = db.exec(playlistsQuery);
    }
    const playlistsData = (playlistsResult && playlistsResult[0]) ? playlistsResult[0].values.map(row => {
        const obj = {};
        playlistsResult[0].columns.forEach((col, idx) => {
            obj[col] = row[idx];
        });
        return obj;
    }) : [];
    
    // Agrupar playlists
    const playlists = {};
    playlistsData.forEach(item => {
        if (!playlists[item.id]) {
            playlists[item.id] = { Name: item.name, Tracks: [] };
        }
        playlists[item.id].Tracks.push(item.track_id);
    });
    
    updateStatus(t('playlistsFound', { count: Object.keys(playlists).length }), 'info');
    updateProgress(85);
    
    // Generar XML
    updateStatus(t('generatingXml'), 'info');
    const xml = generateXML(tracks, positionMarks, playlists, oldBase, newBase);
    
        updateProgress(100);
        updateStatus(t('xmlGenerated'), 'success');
        
        // Descargar archivo
        downloadXML(xml);
    } catch (error) {
        console.error('Error procesando base de datos:', error);
        throw error;
    } finally {
        // Limpiar la base de datos de memoria
        if (db) {
            db.close();
            db = null;
        }
    }
}

// Función para descargar el XML
function downloadXML(xml) {
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rekordbox_export.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Función para actualizar el estado
function updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.classList.remove('hidden');
}

// Función para actualizar el progreso
function updateProgress(percent) {
    const progressEl = document.getElementById('progress');
    const progressFillEl = document.getElementById('progressFill');
    const progressTextEl = document.getElementById('progressText');
    
    progressEl.classList.remove('hidden');
    progressFillEl.style.width = `${percent}%`;
    progressTextEl.textContent = `${percent}%`;
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    await initSQL();
    
    const dbFileInput = document.getElementById('dbFile');
    const oldBaseInput = document.getElementById('oldBase');
    const newBaseInput = document.getElementById('newBase');
    const includePlaylistsCheckbox = document.getElementById('includePlaylists');
    const includeCratesCheckbox = document.getElementById('includeCrates');
    const processBtn = document.getElementById('processBtn');
    
    // Función para prevenir que ambos checkboxes estén deseleccionados
    function preventBothUnchecked(checkbox, otherCheckbox) {
        checkbox.addEventListener('change', () => {
            if (!checkbox.checked && !otherCheckbox.checked) {
                // Si intentan deseleccionar y el otro ya está deseleccionado, volver a seleccionar
                checkbox.checked = true;
                updateStatus(t('errorNoOptions'), 'error');
                setTimeout(() => {
                    const statusEl = document.getElementById('status');
                    if (statusEl.textContent.includes('Debe seleccionarse')) {
                        statusEl.classList.add('hidden');
                    }
                }, 3000);
            }
        });
    }
    
    // Aplicar la validación a ambos checkboxes
    preventBothUnchecked(includePlaylistsCheckbox, includeCratesCheckbox);
    preventBothUnchecked(includeCratesCheckbox, includePlaylistsCheckbox);
    
    // Mostrar nombre del archivo seleccionado y habilitar botón
    const fileNameSpan = document.getElementById('fileName');
    dbFileInput.addEventListener('change', () => {
        if (dbFileInput.files.length > 0) {
            processBtn.disabled = false;
            if (fileNameSpan) {
                fileNameSpan.textContent = dbFileInput.files[0].name;
            }
        } else {
            processBtn.disabled = true;
            if (fileNameSpan) {
                fileNameSpan.textContent = '';
            }
        }
    });
    
    // Procesar cuando se hace clic en el botón
    processBtn.addEventListener('click', async () => {
        const dbFile = dbFileInput.files[0];
        // Normalizar las rutas de entrada (aceptar tanto / como \)
        const oldBase = normalizePath(oldBaseInput.value.trim());
        const newBase = normalizePath(newBaseInput.value.trim());
        const includePlaylists = includePlaylistsCheckbox.checked;
        const includeCrates = includeCratesCheckbox.checked;
        
        if (!dbFile) {
            updateStatus(t('errorNoFile'), 'error');
            return;
        }
        
        if (!oldBase || !newBase) {
            updateStatus(t('errorNoPaths'), 'error');
            return;
        }
        
        if (!includePlaylists && !includeCrates) {
            updateStatus(t('errorNoOptions'), 'error');
            return;
        }
        
        if (!SQL) {
            updateStatus(t('errorSqlNotLoaded'), 'error');
            return;
        }
        
        try {
            processBtn.disabled = true;
            document.getElementById('progress').classList.remove('hidden');
            await processDatabase(dbFile, oldBase, newBase, includePlaylists, includeCrates);
        } catch (error) {
            console.error('Error:', error);
            updateStatus(`${t('errorProcessing')} ${error.message}`, 'error');
            updateProgress(0);
        } finally {
            processBtn.disabled = false;
        }
    });
    
    // Listener para el selector de idioma
    const languageSelect = document.getElementById('language');
    if (languageSelect) {
        const savedLang = localStorage.getItem('language') || 'es';
        languageSelect.value = savedLang;
        
        languageSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
});

