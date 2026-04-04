async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token');

    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
        };
    }

    const response = await fetch(url, options);
    
    if(response.status === 401) {
        const refreshResponse = await fetch('http://localhost:3000/auth/refresh', {
            method: 'POST',
            credentials: 'include', // Include cookies for refresh token
        });

        if(refreshResponse.ok) {
            const data = await refreshResponse.json();
            localStorage.setItem('token', data.accessToken);
            // Retry original request with new token
            options.headers['Authorization'] = `Bearer ${data.accessToken}`;
            return fetch(url, options);
        } else {
            // Refresh token is invalid, redirect to login
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    }
    return response;
    
}

export default apiFetch;