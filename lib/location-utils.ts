import { Country, State, City } from 'country-state-city';

export interface CountryOption {
    name: string;
    code: string;
}

export interface StateOption {
    name: string;
    code: string;
}

export interface CityOption {
    name: string;
}

/**
 * Get all countries with their ISO codes
 */
export function getAllCountries(): CountryOption[] {
    const countries = Country.getAllCountries();
    return countries.map(country => ({
        name: country.name,
        code: country.isoCode
    }));
}

/**
 * Get all states for a specific country
 * @param countryCode - ISO country code (e.g., 'IN' for India, 'US' for United States)
 */
export function getStatesByCountry(countryCode: string): StateOption[] {
    const states = State.getStatesOfCountry(countryCode);
    return states.map(state => ({
        name: state.name,
        code: state.isoCode
    }));
}

/**
 * Get all cities for a specific state in a country
 * @param countryCode - ISO country code
 * @param stateCode - ISO state code
 */
export function getCitiesByState(countryCode: string, stateCode: string): CityOption[] {
    const cities = City.getCitiesOfState(countryCode, stateCode);
    return cities.map(city => ({
        name: city.name
    }));
}

/**
 * Get country code by country name
 */
export function getCountryCode(countryName: string): string | null {
    const countries = Country.getAllCountries();
    const country = countries.find(c => c.name === countryName);
    return country ? country.isoCode : null;
}

/**
 * Get state code by state name and country code
 */
export function getStateCode(countryCode: string, stateName: string): string | null {
    const states = State.getStatesOfCountry(countryCode);
    const state = states.find(s => s.name === stateName);
    return state ? state.isoCode : null;
}
