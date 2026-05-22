const API_URL = 'http://localhost:8000/api';

const Api = {
    _token() {
        return localStorage.getItem('token');
    },

    async _request(method, path, body = null) {
        const headers = { 'Content-Type': 'application/json' };

        const token = this._token();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const options = { method, headers };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(`${API_URL}${path}`, options);
        const data = await res.json();

        if (!res.ok) throw { status: res.status, ...data };
        return data;
    },

    get(path)         { return this._request('GET', path); },
    post(path, body)  { return this._request('POST', path, body); },
    put(path, body)   { return this._request('PUT', path, body); },
    del(path)         { return this._request('DELETE', path); },

    setToken(token)   { localStorage.setItem('token', token); },
    clearToken()      { localStorage.removeItem('token'); },
};
