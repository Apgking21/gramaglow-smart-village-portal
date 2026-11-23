class AuthService {
  constructor(adminUserRepository) {
    this.adminUsers = adminUserRepository;
  }

  authenticate(username, password) {
    if (typeof username !== 'string' || typeof password !== 'string') return null;
    if (username.length > 80 || password.length > 256) return null;
    return this.adminUsers.verify(username.trim(), password);
  }
}

module.exports = { AuthService };
