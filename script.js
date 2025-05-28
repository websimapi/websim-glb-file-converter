import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';

document.addEventListener('DOMContentLoaded', () => {
    const glbFileInput = document.getElementById('glbFile');
    const fileNameDisplay = document.getElementById('fileName');
    const convertButton = document.getElementById('convertButton');
    const statusMessage = document.getElementById('statusMessage');
    const downloadLink = document.getElementById('downloadLink');
    const spinner = document.getElementById('spinner');

    let selectedFile = null;

    glbFileInput.addEventListener('change', (event) => {
        selectedFile = event.target.files[0];
        if (selectedFile) {
            fileNameDisplay.textContent = selectedFile.name;
            statusMessage.textContent = '';
            downloadLink.style.display = 'none';
        } else {
            fileNameDisplay.textContent = 'No file chosen';
        }
    });

    convertButton.addEventListener('click', async () => {
        if (!selectedFile) {
            setStatus('Please select a GLB file first.', 'error');
            return;
        }

        const selectedFormat = document.querySelector('input[name="format"]:checked').value;

        setStatus('Processing...', 'info', true);
        convertButton.disabled = true;
        downloadLink.style.display = 'none';

        try {
            if (selectedFormat === 'OBJ') {
                await convertToOBJ(selectedFile);
            } else if (selectedFormat === 'FBX') {
                handleFBXConversion();
            }
        } catch (error) {
            console.error('Conversion error:', error);
            setStatus(`Error during conversion: ${error.message}`, 'error');
        } finally {
            spinner.style.display = 'none';
            convertButton.disabled = false;
        }
    });

    function setStatus(message, type = 'info', showSpinner = false) {
        statusMessage.textContent = message;
        statusMessage.className = type; // 'error', 'success', 'info'
        spinner.style.display = showSpinner ? 'block' : 'none';
    }

    async function convertToOBJ(file) {
        setStatus('Loading GLB file...', 'info', true);
        const loader = new GLTFLoader();
        const arrayBuffer = await file.arrayBuffer();

        return new Promise((resolve, reject) => {
            loader.parse(
                arrayBuffer,
                '',
                (gltf) => {
                    setStatus('Exporting to OBJ...', 'info', true);
                    try {
                        const exporter = new OBJExporter();
                        const objData = exporter.parse(gltf.scene);
                        
                        const blob = new Blob([objData], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        
                        downloadLink.href = url;
                        const originalFileName = file.name.split('.').slice(0, -1).join('.');
                        downloadLink.download = `${originalFileName}_converted.obj`;
                        downloadLink.style.display = 'inline-block';
                        
                        setStatus('OBJ conversion successful! Ready for download.', 'success');
                        resolve();
                    } catch (exportError) {
                        console.error('OBJ Export Error:', exportError);
                        reject(new Error('Failed to export scene to OBJ.'));
                    }
                },
                (error) => {
                    console.error('GLB Loading Error:', error);
                    let errorMessage = 'Failed to load GLB file.';
                    if (error.message && error.message.includes('Unexpected token')) {
                        errorMessage += ' The file might be corrupt or not a valid GLB.';
                    } else if (error.message) {
                        errorMessage += ` ${error.message}`;
                    }
                    reject(new Error(errorMessage));
                }
            );
        });
    }

    function handleFBXConversion() {
        setStatus('FBX conversion is not supported by this tool. Client-side FBX export is complex due to the proprietary nature of the format. Please consider converting to OBJ instead.', 'info');
        // No actual conversion attempt for FBX
    }
});

