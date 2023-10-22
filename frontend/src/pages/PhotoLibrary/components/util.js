export const adminList = ['john@demo.com']

export function checkIsAdmin() {
    return adminList.includes(localStorage.getItem('username') || '');
}