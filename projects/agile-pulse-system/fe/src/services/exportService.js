/**
 * Export Service
 * Handles story export to JSON/CSV for Jira/Taiga
 */

const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "http://localhost:3001"
).replace(/\/$/, "");
const EXPORT_ENDPOINT = `${API_BASE_URL}/api/stories/export`;

const defaultHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = localStorage.getItem("token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Export stories to a file
 * @param {Array<string>} storyIds - Array of story IDs to export (empty for all)
 * @param {string} format - 'json' or 'csv'
 * @param {string} target - 'jira', 'taiga', or 'generic'
 * @returns {Promise<{success: boolean, message: string, filename?: string}>}
 */
async function exportStories(storyIds, format, target) {
  try {
    const response = await fetch(EXPORT_ENDPOINT, {
      method: "POST",
      headers: defaultHeaders(),
      body: JSON.stringify({
        storyIds: storyIds && storyIds.length > 0 ? storyIds : undefined,
        format,
        target,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Get filename from Content-Disposition header
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = `stories_export_${new Date().toISOString().split("T")[0]}.${format}`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    // Get the data as blob
    const blob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      message: `Stories exported successfully as ${filename}`,
      filename,
    };
  } catch (error) {
    console.error("Error exporting stories:", error);
    return {
      success: false,
      message: error.message || "Failed to export stories",
    };
  }
}

const exportService = {
  exportStories,
};

export default exportService;



