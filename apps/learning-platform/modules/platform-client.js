async function parseJsonResponse(response) {
    const data = await response.json();
    if (!response.ok) throw { status: response.status, error: data.error };
    return data;
}

export function createPlatformClient({ baseUrl, fetch, FormDataConstructor }) {
    return {
        getJson(path) {
            return fetch(baseUrl + path, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }).then(parseJsonResponse);
        },
        postJson(path, body) {
            return fetch(baseUrl + path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }).then(parseJsonResponse);
        },
        postMultipart(path, fields) {
            const formData = new FormDataConstructor();
            fields.forEach(([key, value]) => formData.append(key, value));
            return fetch(baseUrl + path, {
                method: 'POST',
                body: formData
            }).then(parseJsonResponse);
        }
    };
}
