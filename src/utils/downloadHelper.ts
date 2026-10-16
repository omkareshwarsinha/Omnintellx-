/**
 * Omnintellx — Resilient Multi-Platform File Downloader
 * Engineered specifically for:
 * 1. Mobile Android Chrome & WebViews (No popup blockers)
 * 2. Sandboxed iframes (No target="_blank" crashes)
 * 3. Desktop browsers with fallback to Data URIs & Direct Copy
 */

import JSZip from 'jszip';

export interface DownloadResult {
  success: boolean;
  method: 'BLOB_URL' | 'DATA_URI' | 'SERVER_ROUTE' | 'CLIPBOARD_FALLBACK';
  message: string;
}

/**
 * Downloads a blob safely without relying on window.open or target="_blank"
 */
export async function downloadBlobSafely(filename: string, blob: Blob): Promise<DownloadResult> {
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Attempt Method 1: Standard Object URL with hidden link click
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (_) {}
    }, 1500);

    return {
      success: true,
      method: 'BLOB_URL',
      message: `Downloaded ${cleanName} (${(blob.size / 1024).toFixed(1)} KB)`
    };
  } catch (err) {
    console.warn('[Downloader] Blob URL method failed, attempting Data URI fallback:', err);
  }

  // Attempt Method 2: Convert to base64 Data URI
  try {
    const reader = new FileReader();
    const dataUriPromise = new Promise<string>((resolve, reject) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const dataUri = await dataUriPromise;
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = dataUri;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        document.body.removeChild(link);
      } catch (_) {}
    }, 1500);

    return {
      success: true,
      method: 'DATA_URI',
      message: `Downloaded ${cleanName} via Data URI`
    };
  } catch (err2) {
    console.warn('[Downloader] Data URI method failed:', err2);
  }

  return {
    success: false,
    method: 'BLOB_URL',
    message: `Browser prevented automatic download. Please use View Raw / Copy button.`
  };
}

/**
 * Downloads a text file (HTML, JSON, Markdown, JS, CSS, PHP)
 */
export async function downloadTextFileSafely(
  filename: string,
  content: string,
  mimeType: string = 'text/plain;charset=utf-8'
): Promise<DownloadResult> {
  const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const blob = new Blob([content], { type: mimeType });
  const result = await downloadBlobSafely(cleanName, blob);

  if (!result.success) {
    // Attempt clipboard fallback
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
        return {
          success: true,
          method: 'CLIPBOARD_FALLBACK',
          message: `Could not trigger file write: Copied ${cleanName} to clipboard instead!`
        };
      }
    } catch (_) {}
  }

  return result;
}

/**
 * Packs multiple files into a ZIP archive and triggers a safe download
 */
export async function downloadZipSafely(
  zipFilename: string,
  files: Array<{ name: string; content: string }>,
  extraHeaders?: Record<string, string>
): Promise<DownloadResult> {
  const cleanZipName = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`;

  if (!files || files.length === 0) {
    return {
      success: false,
      method: 'BLOB_URL',
      message: 'No files provided for archive generation.'
    };
  }

  try {
    const zip = new JSZip();

    for (const f of files) {
      if (f.name && f.content !== undefined) {
        // Normalize slashes
        const normalizedPath = f.name.replace(/\\/g, '/').replace(/^\/+/, '');
        zip.file(normalizedPath, f.content);
      }
    }

    if (extraHeaders) {
      for (const [name, content] of Object.entries(extraHeaders)) {
        zip.file(name, content);
      }
    }

    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    return await downloadBlobSafely(cleanZipName, blob);
  } catch (err: any) {
    return {
      success: false,
      method: 'BLOB_URL',
      message: `Failed to generate ZIP: ${err.message}`
    };
  }
}

/**
 * Compatibility helper for HTML download
 */
export function downloadHtmlFile(filename: string, content: string): { success: boolean; message: string } {
  downloadTextFileSafely(filename, content, 'text/html;charset=utf-8').catch(() => {});
  return { success: true, message: 'Download initiated' };
}

/**
 * Universal clipboard copy helper with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Downloads compiled app-debug.apk package directly
 */
export async function downloadAppDebugApk(projectId?: string): Promise<DownloadResult> {
  const candidateUrls = [
    '/android/app-debug.apk',
    '/omni/app-debug.apk',
    '/public/app-debug.apk',
    projectId ? `/api/projects/${projectId}/download/apk` : null
  ].filter(Boolean) as string[];

  for (const url of candidateUrls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 1000) {
          return await downloadBlobSafely('app-debug.apk', blob);
        }
      }
    } catch {}
  }

  return {
    success: false,
    method: 'BLOB_URL',
    message: 'Could not stream app-debug.apk from server.'
  };
}


