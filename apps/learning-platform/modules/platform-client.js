import {
    normalizeLearningPlatformMalformedResponse,
    normalizeLearningPlatformTransportError
} from './error-adapter.js';

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

async function parseActionResponse(response) {
    if (response.status === 204) {
        if (!response.ok) throw { status: response.status };
        return undefined;
    }
    return parseJsonResponse(response);
}

function normalizeRequest(request, parse = parseJsonResponse) {
    return request.catch(error => {
        throw normalizeLearningPlatformTransportError(error);
    }).then(parse);
}

function requestOptions(options, sessionRequest) {
    if (!sessionRequest) return options;
    return {
        ...options,
        cache: 'no-store',
        credentials: 'include',
        headers: {
            ...options.headers,
            'X-Machado-Session-Request': '1'
        },
        mode: 'cors',
        redirect: 'error',
        referrerPolicy: 'no-referrer'
    };
}

export function createPlatformClient({
    baseUrl,
    fetch,
    FormDataConstructor,
    sessionRequest = false
}) {
    if (typeof sessionRequest !== 'boolean') {
        throw new TypeError('sessionRequest must be a boolean');
    }

    return {
        getJson(path) {
            return normalizeRequest(fetch(baseUrl + path, requestOptions({
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }, sessionRequest)));
        },
        post(path) {
            return normalizeRequest(fetch(baseUrl + path, requestOptions({
                method: 'POST'
            }, sessionRequest)), parseActionResponse);
        },
        postJson(path, body) {
            return normalizeRequest(fetch(baseUrl + path, requestOptions({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }, sessionRequest)));
        },
        postMultipart(path, fields) {
            const formData = new FormDataConstructor();
            fields.forEach(([key, value]) => formData.append(key, value));
            return normalizeRequest(fetch(baseUrl + path, requestOptions({
                method: 'POST',
                body: formData
            }, sessionRequest)));
        }
    };
}
