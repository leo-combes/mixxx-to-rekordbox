# Mixxx-to-Rekordbox

A bridge tool to export Mixxx playlists and crates to Rekordbox XML format.

**Author:** Leo Combes

**License:** GPL-3.0 (see [LICENSE](LICENSE) file)

## Features

- Export playlists and crates from Mixxx database
- Convert file paths between Linux and Windows
- Generate Rekordbox-compatible XML files
- Bilingual interface (Spanish/English)
- Web-based application (no installation required)
- Works entirely in the browser using SQL.js

## Installation

1. Download the project from GitHub:
   - Click on the green "Code" button on the [repository page](https://github.com/YOUR_USERNAME/mixxx-to-rekordbox)
   - Select "Download ZIP" to download the entire project as a ZIP file
   - Alternatively, you can clone the repository using Git: `git clone https://github.com/YOUR_USERNAME/mixxx-to-rekordbox.git`

2. Extract the ZIP file (if downloaded) to a directory of your choice

3. That's it! No additional installation or dependencies required. The application runs entirely in your web browser.

## Usage

1. Open `index.html` in your web browser
2. Select your Mixxx database file (`mixxxdb.sqlite`)
3. Configure the path mappings (original Linux path → destination Windows path)
4. Select what to include (playlists and/or crates)
5. Generate and download the XML file
6. Import the XML into Rekordbox

## Requirements

- A modern web browser (Chrome, Firefox, Edge, Safari)
- Mixxx database file (`mixxxdb.sqlite`)
- Rekordbox installed on Windows or macOS (for importing the XML)

## Documentation

- **Spanish**: See `help.html` for complete documentation
- **English**: See `help_en.html` for complete documentation

## Important Notes

⚠️ **Warning**: When importing the XML file into Rekordbox, existing data in your Rekordbox library may be overwritten. It is strongly recommended to make a backup of your Rekordbox library before importing.

## Disclaimer

This program accesses the Mixxx database in read-only mode. It is not responsible in any way for data loss or any other inconvenience related to Mixxx, Rekordbox, audio files or any other problem that may arise. The use of this software is at your own risk.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0). See the [LICENSE](LICENSE) file for details.

## Credits

This project is inspired by the work of:

- **[mixxx-utils](https://github.com/FrankwaP/mixxx-utils)** by FrankwaP - A collection of tools for working with Mixxx and its database
- **[MixxxToRekordbox](https://github.com/TheKantankerus/MixxxToRekordbox)** by TheKantankerus - Mixxx to Rekordbox XML exporter utility

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

