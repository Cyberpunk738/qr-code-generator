// DOM Elements
const qrInput = document.getElementById('qrInput');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const qrImg = document.getElementById('qrImg');
const qrResult = document.getElementById('qrResult');
const qrDisplay = document.getElementById('qrDisplay');
const qrPlaceholder = document.querySelector('.qr-placeholder');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const qrSize = document.getElementById('qrSize');
const qrColor = document.getElementById('qrColor');
const toast = document.getElementById('toast');

// State
let currentQRData = null;

// Event Listeners
generateBtn.addEventListener('click', generateQRCode);
clearBtn.addEventListener('click', clearInput);
downloadBtn.addEventListener('click', downloadQRCode);
shareBtn.addEventListener('click', shareQRCode);
qrInput.addEventListener('input', handleInputChange);
qrInput.addEventListener('keypress', handleKeyPress);

// Generate QR Code
async function generateQRCode() {
    const inputValue = qrInput.value.trim();
    
    if (!inputValue) {
        showToast('Please enter some text or URL', 'error');
        return;
    }
    
    // Validate URL format
    if (isURL(inputValue) && !isValidURL(inputValue)) {
        showToast('Please enter a valid URL', 'error');
        return;
    }
    
    try {
        setLoadingState(true);
        
        const size = qrSize.value;
        const color = qrColor.value.replace('#', '');
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(inputValue)}&color=${color}`;
        
        // Create a promise to handle image loading
        const loadImage = () => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load QR code'));
                img.src = apiUrl;
            });
        };
        
        const img = await loadImage();
        qrImg.src = img.src;
        currentQRData = {
            text: inputValue,
            size: size,
            color: color,
            imageUrl: img.src
        };
        
        showQRResult();
        showToast('QR Code generated successfully!');
        
    } catch (error) {
        console.error('Error generating QR code:', error);
        showToast('Failed to generate QR code. Please try again.', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Handle input changes
function handleInputChange() {
    const hasValue = qrInput.value.trim().length > 0;
    clearBtn.classList.toggle('visible', hasValue);
    
    // Auto-generate QR code for URLs
    if (isURL(qrInput.value) && isValidURL(qrInput.value)) {
        // Debounce the auto-generation
        clearTimeout(qrInput.autoGenerateTimeout);
        qrInput.autoGenerateTimeout = setTimeout(() => {
            if (qrInput.value.trim() && isValidURL(qrInput.value)) {
                generateQRCode();
            }
        }, 1000);
    }
}

// Handle Enter key press
function handleKeyPress(event) {
    if (event.key === 'Enter') {
        generateQRCode();
    }
}

// Clear input
function clearInput() {
    qrInput.value = '';
    clearBtn.classList.remove('visible');
    hideQRResult();
    qrInput.focus();
}

// Show QR result
function showQRResult() {
    qrPlaceholder.style.display = 'none';
    qrDisplay.style.display = 'block';
    qrResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Hide QR result
function hideQRResult() {
    qrPlaceholder.style.display = 'block';
    qrDisplay.style.display = 'none';
    currentQRData = null;
}

// Set loading state
function setLoadingState(loading) {
    const btnText = generateBtn.querySelector('span');
    const btnIcon = generateBtn.querySelector('i');
    
    if (loading) {
        generateBtn.classList.add('loading');
        generateBtn.disabled = true;
        btnText.textContent = 'Generating...';
        btnIcon.className = 'fas fa-spinner';
    } else {
        generateBtn.classList.remove('loading');
        generateBtn.disabled = false;
        btnText.textContent = 'Generate QR Code';
        btnIcon.className = 'fas fa-magic';
    }
}

// Download QR code
async function downloadQRCode() {
    if (!currentQRData) {
        showToast('No QR code to download', 'error');
        return;
    }
    
    try {
        // Create a canvas to draw the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        // Set canvas size to match QR code size
        const size = parseInt(currentQRData.size);
        canvas.width = size;
        canvas.height = size;
        
        // Wait for image to load
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.crossOrigin = 'anonymous';
            img.src = currentQRData.imageUrl;
        });
        
        // Draw the image on canvas
        ctx.drawImage(img, 0, 0, size, size);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `qr-code-${Date.now()}.png`;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            showToast('QR Code downloaded successfully!');
        }, 'image/png');
        
    } catch (error) {
        console.error('Error downloading QR code:', error);
        showToast('Failed to download QR code', 'error');
    }
}

// Share QR code
async function shareQRCode() {
    if (!currentQRData) {
        showToast('No QR code to share', 'error');
        return;
    }
    
    try {
        if (navigator.share) {
            await navigator.share({
                title: 'QR Code',
                text: `QR Code for: ${currentQRData.text}`,
                url: currentQRData.imageUrl
            });
        } else {
            // Fallback: copy to clipboard
            await copyToClipboard(currentQRData.imageUrl);
            showToast('QR Code URL copied to clipboard!');
        }
    } catch (error) {
        console.error('Error sharing QR code:', error);
        showToast('Failed to share QR code', 'error');
    }
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Utility functions
function isURL(str) {
    return str.includes('http://') || str.includes('https://') || str.includes('www.');
}

function isValidURL(str) {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Focus on input when page loads
    qrInput.focus();
    
    // Add some example text on first visit
    if (!localStorage.getItem('qrGeneratorVisited')) {
        qrInput.placeholder = 'Try: https://www.google.com';
        localStorage.setItem('qrGeneratorVisited', 'true');
    }
    
    // Add smooth scrolling for better UX
    document.documentElement.style.scrollBehavior = 'smooth';
});

// Add some nice hover effects and interactions
document.addEventListener('DOMContentLoaded', () => {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    button {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
