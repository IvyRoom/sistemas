import {
    normalizeLearningPlatformMalformedResponse,
    normalizeLearningPlatformTransportError
} from './error-adapter.js';

export const DEFAULT_PLATFORM_BASE_URL =
    'https://plataforma-backend-v3.azurewebsites.net/plataforma_v2';

export function resolvePlatformBaseUrl(configuredBaseUrl) {
    return configuredBaseUrl ?? DEFAULT_PLATFORM_BASE_URL;
}

async function parseJsonResponse(response) {
    let data;
    try {
        data = await response.json();
    } catch (error) {
        throw normalizeLearningPlatformMalformedResponse(error);
    }
    if (!response.ok) throw { status: response.status, error: data.error };
    return data;
}

function normalizeRequest(request) {
    return request.catch(error => {
        throw normalizeLearningPlatformTransportError(error);
    }).then(parseJsonResponse);
}

export function createPlatformClient({ baseUrl, fetch, FormDataConstructor }) {
    return {
        getJson(path) {
            return normalizeRequest(fetch(baseUrl + path, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }));
        },
        postJson(path, body) {
            return normalizeRequest(fetch(baseUrl + path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }));
        },
        postMultipart(path, fields) {
            const formData = new FormDataConstructor();
            fields.forEach(([key, value]) => formData.append(key, value));
            return normalizeRequest(fetch(baseUrl + path, {
                method: 'POST',
                body: formData
            }));
        }
    };
}
