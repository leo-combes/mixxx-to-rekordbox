// Global variables
let db = null;
let SQL = null;

// Initialize sql.js
async function initSQL() {
    try {
        if (window.initSqlJs) {
            SQL = await window.initSqlJs();
        } else {
            console.error('initSqlJs is not available. Verify that sql-asm.js has been loaded correctly.');
        }
    } catch (error) {
        console.error('Error initializing SQL.js:', error);
    }
}

// Global variable to store the BeatGrid class once loaded
let BeatGridMessage = null;

// Async function to load the schema (must be executed when the page loads)
async function loadProtobufSchema() {
    try {
        // Use protobuf.js to load the schema defined above
        const root = await protobuf.load("data:text/plain;base64," + btoa(`
            syntax = "proto2";
            package beats;

            message Beat {
              optional int32 frame_position = 1;
              optional bool enabled = 2 [default = true];
              optional Source source = 3 [default = ANALYZER];
            }

            message Bpm {
              optional double bpm = 1;
              optional Source source = 2 [default = ANALYZER];
            }

            message BeatMap {
              repeated Beat beat = 1;
            }

            message BeatGrid {
              optional Bpm bpm = 1;
              optional Beat first_beat = 2;
            }

            enum Source {
              ANALYZER = 0;
              FILE_METADATA = 1;
              USER = 2;
            }
        `));
        
        // Get the definition of the specific message we need
        BeatGridMessage = root.lookupType("beats.BeatGrid");
        console.log("BeatGrid schema loaded successfully.");
        
    } catch (error) {
        console.error("Error loading Protobuf schema:", error);
    }
}

// Call this function when the page loads to prepare the schema
loadProtobufSchema();


// --- Main calculation function ---
function calculateBeatPosition(blobData, sampleRate) {
    if (!BeatGridMessage) {
        console.error("Protobuf schema is not yet loaded.");
        return null;
    }

    try {
        if (!blobData || !sampleRate) return null;
        
        const byteArray = new Uint8Array(blobData);

        // Use the dynamically loaded BeatGridMessage class
        const beatGrid = BeatGridMessage.decode(byteArray);

        if (beatGrid.firstBeat && typeof beatGrid.firstBeat.framePosition !== 'undefined' && beatGrid.bpm && typeof beatGrid.bpm.bpm !== 'undefined') {
            
            const framePosition = beatGrid.firstBeat.framePosition;
            const beatLength = 60.0 / beatGrid.bpm.bpm; 
            let positionSeconds = framePosition / sampleRate;

            // Position adjustment logic
            if (positionSeconds < 0) {
                positionSeconds += beatLength;
            }
            if (positionSeconds > beatLength) {
                positionSeconds -= beatLength;
            }
            return positionSeconds;

        } else {
            console.warn('Protobuf did not contain the required first_beat or bpm fields.');
            return null;
        }

    } catch (error) {
        console.error('Error calculating beat position:', error);
        return null;
    }
}

// Function to normalize paths (convert backslashes to forward slashes)
function normalizePath(path) {
    if (!path) return path;
    // Convert all backslashes to forward slashes
    return path.replace(/\\/g, '/');
}

// Function to convert path from Linux to Windows
function convertPath(originalLocation, oldBase, newBase) {
    if (originalLocation.startsWith("file://localhost//")) {
        // Remove the file://localhost// prefix
        const linuxPath = originalLocation.substring(17);
        
        // Normalize base paths for comparison
        const normalizedOldBase = normalizePath(oldBase);
        const normalizedNewBase = normalizePath(newBase);
        
        // Remap the base folder
        if (linuxPath.startsWith(normalizedOldBase)) {
            const windowsPath = linuxPath.replace(normalizedOldBase, normalizedNewBase);
            // Normalize Windows path and ensure it has a slash after localhost
            const normalizedWindowsPath = normalizePath(windowsPath);
            // Ensure it starts with / after localhost
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

// Function to escape XML
function escapeXml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

// Function to get hexadecimal color
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

// Function to get color name
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

// Function to get rating
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

// Function to get file type
function getFileType(filetype) {
    if (filetype === 'm4a') return 'M4A File';
    if (filetype === 'mp3') return 'MP3 File';
    return filetype || '';
}

// Function to generate XML
function generateXML(tracks, positionMarks, playlists, oldBase, newBase) {
    let xml = '<?xml version=\'1.0\' encoding=\'UTF-8\'?>\n';
    xml += '<DJ_PLAYLISTS Version="1.0.0">\n';
    xml += '  <PRODUCT Name="rekordbox" Version="6.7.7" Company="AlphaTheta"/>\n';
    xml += `  <COLLECTION Entries="${tracks.length}">\n`;
    
    // Generate tracks
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
            // Try to calculate beat position from blob
            let beatPosition = null;
            if (track.beats && track.beats.length > 0) {
                // Convert ArrayBuffer/Uint8Array to usable format
                const beatsData = track.beats instanceof Uint8Array ? track.beats : new Uint8Array(track.beats);
                if(track.beats_version == 'BeatGrid-2.0'){
                    beatPosition = calculateBeatPosition(beatsData.buffer, track.SampleRate, track.AverageBpm);
                }
                // track.beats_version == 'BeatMap-1.0'
                else{   // not implemented YET
                    beatPosition = null;
                }
            }
            
            // Use calculated position or default value
            const inizio = beatPosition !== null ? beatPosition.toFixed(3) : "0.000";
            xml += `      <TEMPO Inizio="${inizio}" Bpm="${escapeXml(track.AverageBpm)}" Metro="4/4" Battito="1"/>\n`;
        }

        if (positionMarks[track.TrackID]) {
            positionMarks[track.TrackID].forEach(pm => {
                xml += `      <POSITION_MARK `;
                xml += `Name="${escapeXml(pm.Name)}" `;

                if(pm.internalType == 'hotcue'){

                    // CASE 1
                    if(pm.Type == 1){   // hotcue
                        xml += `Type="0" `;
                        xml += `Start="${escapeXml(pm.Start)}" `;
                        xml += `Num="${escapeXml(pm.Num)}" `;
                        xml += `Red="${escapeXml(pm.Red)}" `;
                        xml += `Green="${escapeXml(pm.Green)}" `;
                        xml += `Blue="${escapeXml(pm.Blue)}"`;
                    }
                    // CASE 2
                    else if(pm.Type == 4){   // loop
                        xml += `Type="4" `;
                        xml += `Start="${escapeXml(pm.Start)}" `;                        
                        // here we actually have the loop duration in seconds
                        // convert it to loop end position in seconds
                        const endPosition = parseFloat(pm.Start) + parseFloat(pm.Stop);
                        xml += `End="${escapeXml(endPosition.toFixed(3))}" `;
                        xml += `Num="-1"`;
                    }
                }
                else if(pm.internalType == 'cuepoint'){
                    // CASE 3
                    xml += `Type="0" `;
                    xml += `Start="${escapeXml(pm.Start)}" `;
                    xml += `Num="-1"`;
                }
                xml += '/>\n';
            });
        }        
        
        xml += '    </TRACK>\n';
    });
    
    xml += '  </COLLECTION>\n';
    
    // Only include PLAYLISTS if there are playlists
    if (Object.keys(playlists).length > 0) {
        xml += '  <PLAYLISTS>\n';
        xml += `    <NODE Name="ROOT" Type="0" Count="${Object.keys(playlists).length}">\n`;
        
        // Generate playlists sorted by name
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

// Function to process the database
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
    
    // Main tracks query
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
            T0.beats,
            T0.beats_version
        FROM library T0
        INNER JOIN track_locations T1 ON T0.id = T1.id
        WHERE T0.mixxx_deleted = 0
    `;
    
    const tracksResult = db.exec(tracksQuery);
    const tracks = tracksResult[0] ? tracksResult[0].values.map(row => {
        const obj = {};
        tracksResult[0].columns.forEach((col, idx) => {
            // Handle blobs (beats) correctly
            if (col === 'beats' && row[idx] !== null) {
                // Convert blob to Uint8Array if necessary
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
    
    // === CASE 1: first query, table "cues" type = 1 (hotcue)
    //  in Mixxx:
    //      label = name
    //      type = 1 (is hotcue)
    //      position = position expressed in samples
    //      length = 0 (has no length)
    //  in rekordbox:
    //      "Name" = name
    //      "Type" = "0"
    //      "Start" = track start time in seconds
    //      "Num" = consecutive number "1", "2", "3", etc.
    //      "Red", "Green", "Blue" = hotcue colors
    //
    // === CASE 2: first query, table "cues" type = 4 (loop)
    //  in Mixxx:
    //      type = 4 (is loop)
    //      position = position expressed in samples
    //      length = length expressed in samples
    //  in rekordbox:
    //      "Name" = loops don't have names (we always name it "")
    //      "Type" = "4"
    //      "Start" = loop start time in seconds
    //      "End" = loop end time in seconds
    //      "Num" = always "-1"
    //
    // === CASE 3: second query, table "library", adds the default CUE in Mixxx as memory cue in Rekordbox
    //  in Mixxx:
    //      cuepoint = position expressed in samples
    //  in rekordbox:
    //      "Name" = we always set it to "Cuepoint"
    //      "Type" = "0"
    //      "Start" = track start time in seconds
    //      "Num" = always "-1"
    //
    // Fields not specified in Rekordbox are not used (e.g., loop or default cue don't have colors)

    const positionMarksQuery = `
        SELECT 
            T0.track_id as TrackID, 
            T0.label as Name,
            T0.Type as Type,
            'hotcue' as internalType,
            ROUND(T0.position / (2.0 * T1.samplerate), 3) as Start,
            ROUND(T0.length / (2.0 * T1.samplerate), 3) as Stop,
            T0.hotcue as Num,
            ((T0.color >> 16) & 255) AS Red,
            ((T0.color >> 8) & 255) AS Green,
            (T0.color & 255) AS Blue
        FROM cues T0 
        INNER JOIN library T1 ON T0.track_id = T1.id
        WHERE T0.type IN (1, 4) AND T1.mixxx_deleted = 0

        UNION ALL

        -- Second query to add CUEPOINT (Type="0" Num="-1")
        SELECT
            T1_cp.id AS TrackID,
            'Cuepoint' AS Name,           -- Fixed name for cuepoint
            0 AS Type,
            'cuepoint' as internalType,
            ROUND(T1_cp.cuepoint / (2.0 * T1_cp.samplerate), 3) AS Start,
            0 AS Stop,
            "-1" AS Num,
            0 AS Red,
            0 AS Green,
            0 AS Blue
        FROM library T1_cp
        WHERE T1_cp.mixxx_deleted = 0 AND T1_cp.cuepoint IS NOT NULL AND T1_cp.cuepoint > 0
    `;
    
    const positionMarksResult = db.exec(positionMarksQuery);
    const positionMarksData = positionMarksResult[0] ? positionMarksResult[0].values.map(row => {
        const obj = {};
        positionMarksResult[0].columns.forEach((col, idx) => {
            obj[col] = row[idx];
        });
        return obj;
    }) : [];
    
    // Group position marks by TrackID
    const positionMarks = {};
    positionMarksData.forEach(pm => {
        if (!positionMarks[pm.TrackID]) {
            positionMarks[pm.TrackID] = [];
        }
        positionMarks[pm.TrackID].push(pm);
    });
    
    updateStatus(t('positionMarksFound', { count: positionMarksData.length }), 'info');
    updateProgress(70);
    
    // Build playlists and crates query according to selected options
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
    
    // Group playlists
    const playlists = {};
    playlistsData.forEach(item => {
        if (!playlists[item.id]) {
            playlists[item.id] = { Name: item.name, Tracks: [] };
        }
        playlists[item.id].Tracks.push(item.track_id);
    });
    
    updateStatus(t('playlistsFound', { count: Object.keys(playlists).length }), 'info');
    updateProgress(85);
    
    // Generate XML
    updateStatus(t('generatingXml'), 'info');
    const xml = generateXML(tracks, positionMarks, playlists, oldBase, newBase);
    
        updateProgress(100);
        updateStatus(t('xmlGenerated'), 'success');
        
        // Download file
        downloadXML(xml);
    } catch (error) {
        console.error('Error processing database:', error);
        throw error;
    } finally {
        // Clean up in-memory database
        if (db) {
            db.close();
            db = null;
        }
    }
}

// Function to download XML
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

// Function to update status
function updateStatus(message, type = 'info') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.classList.remove('hidden');
}

// Function to update progress
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
    
    // Function to prevent both checkboxes from being unchecked
    function preventBothUnchecked(checkbox, otherCheckbox) {
        checkbox.addEventListener('change', () => {
            if (!checkbox.checked && !otherCheckbox.checked) {
                // If they try to uncheck and the other is already unchecked, re-check
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
    
    // Apply validation to both checkboxes
    preventBothUnchecked(includePlaylistsCheckbox, includeCratesCheckbox);
    preventBothUnchecked(includeCratesCheckbox, includePlaylistsCheckbox);
    
    // Show selected file name and enable button
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
    
    // Process when button is clicked
    processBtn.addEventListener('click', async () => {
        const dbFile = dbFileInput.files[0];
        // Normalize input paths (accept both / and \)
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
    
    // Listener for language selector
    const languageSelect = document.getElementById('language');
    if (languageSelect) {
        const savedLang = localStorage.getItem('language') || 'es';
        languageSelect.value = savedLang;
        
        languageSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
});

