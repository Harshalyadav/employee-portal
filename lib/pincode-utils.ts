/**
 * Fetches city, state, and country information from a pincode using India Post Pincode API
 * @param pincode - 6-digit Indian pincode
 * @returns Location data or null if not found
 */
export async function fetchCityFromPincode(pincode: string): Promise<{
    city: string;
    state: string;
    country: string;
} | null> {
    // Validate pincode format (6 digits)
    if (!/^\d{6}$/.test(pincode)) {
        return null;
    }

    try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
        const data = await response.json();

        if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
            const postOffice = data[0].PostOffice[0];
            return {
                city: postOffice.Name || postOffice.District || postOffice.Region || "",
                state: postOffice.State || "",
                country: postOffice.Country || "India"
            };
        }

        return null;
    } catch (error) {
        console.error("Error fetching pincode data:", error);
        return null;
    }
}
