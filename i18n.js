// Sistema de traducción i18n
const translations = {
    es: {
        // Títulos y headers
        title: "Mixxx a Rekordbox - Exportador de Playlists",
        headerTitle: "Mixxx a Rekordbox",
        subtitle: "Exportador de Playlists y Biblioteca",
        helpLink: "Ver ayuda y documentación",
        
        // Configuración
        configuration: "Configuración",
        dbFileLabel: "Base de datos de Mixxx:",
        dbFileHelp: "Selecciona el archivo mixxxdb.sqlite",
        browseButton: "Examinar...",
        oldBaseLabel: "Path base original (Linux): ej. /home/user/Music/electronic",
        oldBaseHelp: "Ruta donde están los archivos actualmente en Linux",
        newBaseLabel: "Path base destino (Windows): ej. D:\\electronic",
        newBaseHelp: "Ruta donde estarán los archivos en Windows",
        includePlaylists: "Incluir listas de reproducción (playlist)",
        includeCrates: "Incluir cajones (crates)",
        processButton: "Procesar y Generar XML",
        
        // Mensajes de estado
        readingDb: "Leyendo base de datos...",
        loadingSqlite: "Cargando SQLite...",
        executingQueries: "Ejecutando consultas SQL...",
        tracksFound: "Encontrados {count} tracks",
        positionMarksFound: "Encontrados {count} position marks",
        playlistsFound: "Encontradas {count} playlists/crates",
        generatingXml: "Generando XML...",
        xmlGenerated: "¡XML generado exitosamente!",
        
        // Errores
        errorNoFile: "Por favor selecciona un archivo de base de datos",
        errorNoPaths: "Por favor completa ambos campos de paths",
        errorNoOptions: "Debe seleccionarse al menos una opción (listas de reproducción o cajones)",
        errorSqlNotLoaded: "Error: SQL.js no se ha cargado correctamente. Por favor recarga la página.",
        errorProcessing: "Error procesando base de datos:",
        
        // Disclaimer
        disclaimer: "Disclaimer: Aunque este programa accede en modo solo lectura a la base de datos de Mixxx, no se responsabiliza de ninguna forma por pérdida de datos o cualquier otro inconveniente relacionado con Mixxx, Rekordbox, archivos de audio o cualquier otro problema que pueda surgir. El uso de este software es bajo su propia responsabilidad.",
        
        // Footer
        footer: "Convierte tu biblioteca de Mixxx a formato Rekordbox",
        author: "Autor: Leo Combes",
        license: "GPL-3.0",
        inspiredBy: "Inspirado en:",
        
        // Help page
        helpTitle: "Ayuda - Mixxx a Rekordbox",
        helpSubtitle: "Guía de uso y documentación",
        backToApp: "← Volver a la aplicación",
        languageLabel: "Idioma / Language:"
    },
    en: {
        // Titles and headers
        title: "Mixxx to Rekordbox - Playlist Exporter",
        headerTitle: "Mixxx to Rekordbox",
        subtitle: "Playlist and Library Exporter",
        helpLink: "View help and documentation",
        
        // Configuration
        configuration: "Configuration",
        dbFileLabel: "Mixxx Database:",
        dbFileHelp: "Select the mixxxdb.sqlite file",
        browseButton: "Browse...",
        oldBaseLabel: "Original Base Path (Linux): e.g. /home/user/Music/electronic",
        oldBaseHelp: "Path where files are currently located in Linux",
        newBaseLabel: "Destination Base Path (Windows): e.g. D:\\electronic",
        newBaseHelp: "Path where files will be located in Windows",
        includePlaylists: "Include playlists",
        includeCrates: "Include crates",
        processButton: "Process and Generate XML",
        
        // Status messages
        readingDb: "Reading database...",
        loadingSqlite: "Loading SQLite...",
        executingQueries: "Executing SQL queries...",
        tracksFound: "Found {count} tracks",
        positionMarksFound: "Found {count} position marks",
        playlistsFound: "Found {count} playlists/crates",
        generatingXml: "Generating XML...",
        xmlGenerated: "XML generated successfully!",
        
        // Errors
        errorNoFile: "Please select a database file",
        errorNoPaths: "Please complete both path fields",
        errorNoOptions: "At least one option must be selected (playlists or crates)",
        errorSqlNotLoaded: "Error: SQL.js has not loaded correctly. Please reload the page.",
        errorProcessing: "Error processing database:",
        
        // Disclaimer
        disclaimer: "Disclaimer: Although this program accesses the Mixxx database in read-only mode, it is not responsible in any way for data loss or any other inconvenience related to Mixxx, Rekordbox, audio files or any other problem that may arise. The use of this software is at your own risk.",
        
        // Footer
        footer: "Convert your Mixxx library to Rekordbox format",
        author: "Author: Leo Combes",
        license: "GPL-3.0",
        inspiredBy: "Inspired by:",
        
        // Help page
        helpTitle: "Help - Mixxx to Rekordbox",
        helpSubtitle: "Usage guide and documentation",
        backToApp: "← Back to application",
        languageLabel: "Language / Idioma:"
    }
};

// Función para obtener la traducción
function t(key, params = {}) {
    const lang = localStorage.getItem('language') || 'es';
    let text = translations[lang][key] || translations['es'][key] || key;
    
    // Reemplazar parámetros
    Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
}

// Función para cambiar el idioma
function setLanguage(lang) {
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    updatePageLanguage();
}

// Función para actualizar todos los textos de la página
function updatePageLanguage() {
    const lang = localStorage.getItem('language') || 'es';
    
    // Actualizar elementos con data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const params = element.getAttribute('data-i18n-params');
        const translationParams = params ? JSON.parse(params) : {};
        element.textContent = t(key, translationParams);
    });
    
    // Actualizar placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = t(key);
    });
    
    // Actualizar títulos
    if (document.title) {
        document.title = t('title');
    }
    
    // Actualizar enlace de ayuda según el idioma
    const helpLink = document.getElementById('helpLink');
    if (helpLink) {
        helpLink.href = lang === 'en' ? 'help_en.html' : 'help.html';
        helpLink.textContent = t('helpLink');
    }
    
    // Actualizar botón de examinar
    const fileButtonLabel = document.getElementById('fileButtonLabel');
    if (fileButtonLabel) {
        fileButtonLabel.textContent = t('browseButton');
    }
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('language') || 'es';
    setLanguage(savedLang);
});

