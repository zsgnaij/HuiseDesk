### 1. Create a Virtual Environment

```bash
# Navigate to the sg directory
cd sg

# Create a virtual environment
python -m venv venv
```

### 2. Activate the Virtual Environment

**Windows:**
```bash
# Command Prompt
venv\Scripts\activate

# PowerShell
venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

Once the virtual environment is activated, install the required Python packages:

```bash
pip install shotgun-api3 requests
```

## Usage

### Uploading Images to ShotGrid

```bash
python shotgrid/src/sg.py upload <image_path> <asset_name> [version_name] [asset_type]
```

Example:
```bash
python shotgrid/src/sg.py upload ./example.jpg "MyAsset" "v001" "Prop"
```

### Downloading Assets from ShotGrid

```bash
python shotgrid/src/sg.py
```

This will download all asset versions from the configured project.

## Configuration

The script is configured with the following settings in `shotgrid/src/sg.py`:

- `SERVER_URL`: The ShotGrid server URL
- `SCRIPT_NAME`: The ShotGrid script name
- `API_KEY`: The ShotGrid API key
- `PROJECT_NAME`: The project name to work with

## Directory Structure

- `shotgrid/src/`: Contains the main Python script
- `shotgrid/downloads/`: Directory where downloaded assets are saved
- `shotgrid/temp/`: Temporary directory for file uploads
- `shotgrid/assets/`: Directory for asset files (if needed)

## Deactivating the Virtual Environment

When you're done working with the ShotGrid integration, you can deactivate the virtual environment:

```bash
deactivate
```