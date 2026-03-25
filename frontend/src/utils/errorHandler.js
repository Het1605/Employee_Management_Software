export const handleApiError = (error) => {
    if (!error.response || !error.response.data) {
        return "Network error or server unreachable. Please try again.";
    }
    
    const detail = error.response.data.detail;
    
    // String errors directly from backend (e.g., "Email already registered")
    if (typeof detail === 'string') {
        const lowerDetail = detail.toLowerCase();
        if (lowerDetail.includes('psycopg2') || 
            lowerDetail.includes('sql') || 
            lowerDetail.includes('traceback') || 
            lowerDetail.includes('integrityerror')) {
            return "Internal server error. Please try again later.";
        }
        return detail;
    }
    
    // Pydantic validation error arrays (e.g., GST or PAN length constraints)
    if (Array.isArray(detail) && detail.length > 0) {
        const firstError = detail[0];
        let field = "Input";
        
        if (firstError.loc && firstError.loc.length > 0) {
            field = firstError.loc[firstError.loc.length - 1]; // usually the field name
        }
        
        // Format "gst_number" to "Gst Number" for cleaner UI
        const cleanField = String(field)
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
            
        const msg = firstError.msg || "provided an invalid value";
        return `${cleanField}: ${msg}`;
    }
    
    return "Something went wrong. Please try again.";
};
